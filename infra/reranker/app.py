import os
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from FlagEmbedding import FlagReranker

MODEL_NAME = os.getenv("MODEL_NAME", "BAAI/bge-reranker-base")
DEVICE = os.getenv("DEVICE", "cpu")

app = FastAPI(title="Reranker Service", version="1.0")

print("🚀 Loading BGE Reranker:", MODEL_NAME)
reranker = FlagReranker(MODEL_NAME, use_fp16=False, device=DEVICE)

class Passage(BaseModel):
    id: str
    text: str

class RerankRequest(BaseModel):
    query: str
    passages: List[Passage]
    topK: Optional[int] = 10

@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_NAME}

@app.post("/rerank")
def rerank(req: RerankRequest):
    if not req.passages:
        return []

    pairs = [(req.query, p.text) for p in req.passages]
    scores = reranker.compute_score(pairs)

    scored = [{"id": p.id, "score": float(s)} for p, s in zip(req.passages, scores)]
    scored.sort(key=lambda x: x["score"], reverse=True)

    k = req.topK or len(scored)
    return scored[:k]
