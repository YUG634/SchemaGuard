from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from app.config import settings
from app.engine import TransformationEngine, AmbiguousDataError, PoisoningError
from app.schemas import TransformRequest, TransformResponse, VerificationResponse

app = FastAPI(
    title="SchemaGuard MCP",
    description="Deterministic Runtime Contract Adapter for Autonomous Agents",
    version="1.0.0",
)

MAX_BODY_SIZE = 1024 * 1024  # 1 MB

@app.middleware("http")
async def limit_payload_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_SIZE:
        return JSONResponse(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            content={"detail": "Payload strictly exceeds 1MB threshold"}
        )
    return await call_next(request)

@app.exception_handler(PoisoningError)
async def poisoning_error_handler(request: Request, exc: PoisoningError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": exc.message}
    )

@app.exception_handler(AmbiguousDataError)
async def ambiguous_data_error_handler(request: Request, exc: AmbiguousDataError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.message}
    )

@app.get("/health", response_model=VerificationResponse)
@app.get("/.well-known/xagent-verification.json", response_model=VerificationResponse)
def get_verification():
    return {
        "schemaVersion": settings.SCHEMA_VERSION,
        "slug": settings.SLUG,
        "commit": settings.COMMIT_HASH,
    }

@app.post("/v1/transform", response_model=TransformResponse)
def transform_payload(req: TransformRequest):
    return TransformationEngine.transform(
        input_data=req.input_data,
        target_schema=req.target_schema,
        mapping_instructions=req.mapping_instructions
    )
