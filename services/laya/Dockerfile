# CPU image. ~1.5 GB with torch; first start downloads the checkpoint (~800 MB) into /root/.cache.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    LAYA_DEVICE=cpu \
    LAYA_THREADS=4 \
    HF_HOME=/root/.cache/huggingface

WORKDIR /app
RUN pip install --extra-index-url https://download.pytorch.org/whl/cpu torch \
 && pip install "fastapi[standard]>=0.115" "laya>=0.3.6"

COPY main.py .

# Bake the checkpoint into the image so cold starts don't hit Hugging Face.
# Comment out to keep the image small and download on first boot instead.
RUN python -c "import laya; laya.load('convaiinnovations/laya')"

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health').status==200 else 1)"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
