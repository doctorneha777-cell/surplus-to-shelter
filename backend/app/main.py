from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app import models
from app.api import donations
from app.api import network
from app.api import matching
from app.api import dispatch
from app.api import routing
from app.api import impact
from app.api import notifications

app = FastAPI(title="Surplus-to-Shelter API", version="0.1.0")

Base.metadata.create_all(bind=engine)

# Allow CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(donations.router)
app.include_router(network.router)
app.include_router(matching.router)
app.include_router(dispatch.router)
app.include_router(routing.router)
app.include_router(impact.router)
app.include_router(notifications.router)

@app.get("/")
def read_root():
    return {"name": "Surplus-to-Shelter", "status": "ready"}


@app.get("/health")
def health_check():
    return {"status": "ok"}