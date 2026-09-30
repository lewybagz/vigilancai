"""
Vigilancai Laya decision service.

A thin FastAPI wrapper around the Laya decision model (https://pypi.org/project/laya/).
Laya is a non-generative classifier: typed questions (choice / score / noul) over a text state,
one forward pass, calibrated probabilities. The Next.js pipeline calls:

  GET  /health    -> {"status": "ok", "model": {...}}
  POST /evaluate  -> {"answers": {...}}            (laya.Agent.predict, unchanged)
  POST /inspect   -> {"answers": {...}, "attribution": [...]}  (adds leave-one-out attribution over state fields)

Set LAYA_API_KEY to require an x-api-key header. Set LAYA_MODEL to pick a checkpoint
(default convaiinnovations/laya; laya-multilingual reads up to 1,024 tokens).
"""
from __future__ import annotations

import os
import threading
import time
from typing import Any, Dict, List, Union

import laya
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

MODEL_ID = os.getenv("LAYA_MODEL", "convaiinnovations/laya")
API_KEY = os.getenv("LAYA_API_KEY")
MAX_ATTRIBUTION_FIELDS = 8

app = FastAPI(title="Vigilancai Laya service", version="1.0.0")

model = laya.load(MODEL_ID)
# The model is not safe to run concurrently; FastAPI serves sync routes from a thread pool.
model_lock = threading.Lock()

StateT = Union[str, Dict[str, Any], List[Any]]


def require_key(x_api_key: str | None = Header(default=None)) -> None:
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="invalid api key")


class EvaluateRequest(BaseModel):
    state: StateT
    questions: Dict[str, Dict[str, Any]]


class InspectRequest(EvaluateRequest):
    attribution: bool = True


def _predict(state: StateT, questions: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    try:
        with model_lock:
            return model.predict(state=state, questions=questions)
    except (KeyError, ValueError, TypeError) as e:
        raise HTTPException(status_code=422, detail=f"{type(e).__name__}: {e}")


def _top(answer: Dict[str, Any]) -> tuple[str, float]:
    """(label, probability) of the winning option for any question type."""
    if answer["type"] == "noul":
        p = float(answer["noul"])
        return ("true", p) if p >= 0.5 else ("false", 1.0 - p)
    probs = answer.get("probabilities") or {}
    if not probs:
        return ("", 0.0)
    label = max(probs, key=probs.get)
    return label, float(probs[label])


def _tvd(a: Dict[str, Any], b: Dict[str, Any]) -> float:
    if a["type"] == "noul":
        return abs(float(a["noul"]) - float(b["noul"]))
    pa, pb = a.get("probabilities") or {}, b.get("probabilities") or {}
    return 0.5 * sum(abs(float(pa.get(k, 0)) - float(pb.get(k, 0))) for k in set(pa) | set(pb))


@app.get("/health")
def health() -> Dict[str, Any]:
    cfg = getattr(model, "cfg", {}) or {}
    return {
        "status": "ok",
        "model": {
            "id": MODEL_ID,
            "encoder": cfg.get("encoder"),
            "max_len": cfg.get("max_len"),
            "device": str(getattr(model, "device", "cpu")),
        },
    }


@app.post("/evaluate", dependencies=[Depends(require_key)])
def evaluate(req: EvaluateRequest) -> Dict[str, Any]:
    t0 = time.perf_counter()
    out = _predict(req.state, req.questions)
    out["timing_ms"] = round((time.perf_counter() - t0) * 1000, 1)
    return out


@app.post("/inspect", dependencies=[Depends(require_key)])
def inspect(req: InspectRequest) -> Dict[str, Any]:
    """Evaluate, then (for dict states) drop one field at a time to see which fields carry the decision.

    `support` is how much the winning answer's probability fell without that field,
    averaged over the questions the pipeline gates on (material, severity). Positive support means
    the field argued for the final answer.
    """
    t0 = time.perf_counter()
    base = _predict(req.state, req.questions)
    attribution: List[Dict[str, Any]] = []

    if req.attribution and isinstance(req.state, dict) and len(req.state) >= 2:
        gate_qs = [q for q in ("material", "severity") if q in req.questions] or list(req.questions)[:2]
        for key in list(req.state.keys())[:MAX_ATTRIBUTION_FIELDS]:
            reduced = {k: v for k, v in req.state.items() if k != key}
            without = _predict(reduced, req.questions)
            supports, tvds, flipped = [], [], False
            for q in gate_qs:
                b, w = base["answers"][q], without["answers"][q]
                b_label, b_p = _top(b)
                w_label, _ = _top(w)
                if b["type"] == "noul":
                    w_p_same = float(w["noul"]) if b_label == "true" else 1.0 - float(w["noul"])
                else:
                    w_p_same = float((w.get("probabilities") or {}).get(b_label, 0.0))
                supports.append(b_p - w_p_same)
                tvds.append(_tvd(b, w))
                flipped = flipped or (w_label != b_label)
            attribution.append({
                "label": str(key),
                "text": str(req.state[key])[:200],
                "support": round(sum(supports) / len(supports), 4),
                "tvd": round(max(tvds), 4),
                "flipped": flipped,
            })
        attribution.sort(key=lambda a: -a["tvd"])

    base["attribution"] = attribution
    base["timing_ms"] = round((time.perf_counter() - t0) * 1000, 1)
    return base
