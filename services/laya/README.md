# Laya decision service

The fast, cheap half of Vigilancai's classifier. Laya (Apache 2.0, by Convai Innovations) is a
421M-parameter ModernBERT model that answers typed questions about a piece of text in one forward
pass: `choice` (pick a label), `score` (ordinal rubric), and `noul` (calibrated yes/no). It returns
probabilities and a confidence value. It never generates text; Claude writes the cards.

The Next.js pipeline asks it, for every diff:

| Question   | Type   | Used for                                              |
|------------|--------|-------------------------------------------------------|
| `material` | noul   | Is this a real change, or boilerplate churn?          |
| `category` | choice | permit_fee / material_price / licensing / code / terms|
| `severity` | score  | medium / high / critical                              |
| `roofing`, `hvac`, `gc` | noul | Trade relevance for the owner's profile      |

Claude classifies independently. Agreement publishes; disagreement or low Laya confidence holds the
change for review, and a critical alert only pages the crew when both agree.

## Run locally

```bash
cd services/laya
uv sync            # or: pip install "fastapi[standard]" laya
uv run uvicorn main:app --port 8000
curl localhost:8000/health
```

First start downloads the checkpoint (~800 MB). CPU inference is 200-500 ms per call; a T4 GPU is ~35 ms.

## Deploy (Railway, Fly, Render)

```bash
docker build -t vigilancai-laya services/laya
docker run -p 8000:8000 -e LAYA_API_KEY=change-me vigilancai-laya
```

Give the container at least 2 GB RAM. Then set on the Next.js side:

```
LAYA_URL=https://your-laya-host
LAYA_API_KEY=change-me
```

If `LAYA_URL` is unset or the service is unreachable, the pipeline logs it and falls back to
Claude-only classification (`classification.method = "llm_only"` on the change).

## Endpoints

- `GET /health`
- `POST /evaluate` `{ state, questions }` → `{ answers }` (Laya's native output)
- `POST /inspect` `{ state, questions, attribution: true }` → adds `attribution[]`: leave-one-out
  support per state field, shown in the app as "Why we flagged this".

## Options

- `LAYA_MODEL=convaiinnovations/laya-multilingual` for 1,024-token context.
- `LAYA_DEVICE=cuda` on a GPU host.
