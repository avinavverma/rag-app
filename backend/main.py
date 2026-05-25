import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers.ingest import router as ingest_router
from routers.query import router as query_router
from routers.documents import router as documents_router

from services.embedder import warm_up
from services.timing import logger

load_dotenv()

app = FastAPI(title="Margin Backend")

@app.on_event("startup")
def on_startup():
    try:
        warm_up()
        logger.info("embedder warm_up completed")
    except Exception:
        logger.exception("embedder warm_up failed")

cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest_router)
app.include_router(query_router)
app.include_router(documents_router)


@app.get("/health")
async def health():
    return {"status": "ok"}