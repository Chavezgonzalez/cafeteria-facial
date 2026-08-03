from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.database import Base, engine
from app.routers import (
    auth,
    categories,
    orders,
    products,
    users
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API Cafetería Escolar",
    description=(
        "Backend para la aplicación móvil "
        "de la cafetería escolar"
    ),
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
def root():
    return {
        "message": (
            "Backend de la cafetería funcionando"
        )
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(orders.router)