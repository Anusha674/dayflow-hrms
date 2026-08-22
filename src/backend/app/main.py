import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_settings
from app.database.session import Base, engine
from app.routers import attendance, auth, employees, leaves, notifications, payroll

# Imported for their side effect of registering mappers before create_all.
from app.models import audit, employee, leave, payroll as payroll_model, user  # noqa: F401
from app.routers import reports

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dayflow")
settings = get_settings()

app = FastAPI(
    title="Dayflow HRMS API",
    version="1.0.0",
    description="Human Resource Management System — employees, attendance, leave, payroll, analytics.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

for module in (auth, employees, attendance, leaves, payroll, notifications, reports):
    app.include_router(module.router)


@app.on_event("startup")
def on_startup() -> None:
    # In production schema changes go through Alembic; create_all keeps dev simple.
    Base.metadata.create_all(bind=engine)
    logger.info("Dayflow API ready")


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError):
    fields = {}
    for error in exc.errors():
        location = [part for part in error["loc"] if part != "body"]
        fields[".".join(str(part) for part in location)] = error["msg"]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Please correct the highlighted fields.", "fields": fields},
    )


@app.exception_handler(SQLAlchemyError)
async def database_handler(_: Request, exc: SQLAlchemyError):
    # Internal detail is logged, never returned to the client.
    logger.exception("Database failure: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Something went wrong. Please try again."})


@app.exception_handler(Exception)
async def unhandled_handler(_: Request, exc: Exception):
    logger.exception("Unhandled failure: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Something went wrong. Please try again."})


@app.get("/api/health", tags=["system"])
def health() -> dict:
    return {"status": "ok"}
