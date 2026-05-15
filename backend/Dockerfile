FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# HF Spaces runs as uid 1000
RUN useradd -m -u 1000 user && chown -R user:user /app
USER user

EXPOSE 7860
ENV PORT=7860

# Train model on startup (generates .pkl + DB), then serve API
CMD ["sh", "-c", "python model/train.py && uvicorn main:app --host 0.0.0.0 --port 7860"]
