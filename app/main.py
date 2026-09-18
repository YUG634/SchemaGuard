import json
import re
from typing import Any, Dict
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import jsonschema

from app.agent import GuardianInvestigationAgent
from app.differ import SchemaDiffer
from app.schemas import (
    ContractViolation,
    DiffResponse,
    GuardianDiagnosisResponse,
    SeverityLevel,
    TransformMutation,
    TransformResponse,
    TransformValidation,
)
from app.strands_agent import run_strands_investigation

load_dotenv()

app = FastAPI(title="SchemaGuard API", version="1.0.0")

# Bulletproof CORS: allow all origins, disable credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

agent = GuardianInvestigationAgent()
differ = SchemaDiffer()


async def get_safe_json_body(request: Request) -> Dict[str, Any]:
    """Safely extracts JSON body, returning empty dict if payload is missing or empty."""
    raw = await request.body()
    if not raw or not raw.strip():
        return {}
    try:
        return json.loads(raw.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON payload.")


def check_prototype_poisoning(obj: Any):
    """Recursively checks for prototype poisoning keys."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in ("__proto__", "constructor", "prototype"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Malicious key '{k}' detected"
                )
            check_prototype_poisoning(v)
    elif isinstance(obj, list):
        for item in obj:
            check_prototype_poisoning(item)


def extract_nested_key(data: Dict[str, Any], path: str) -> Any:
    """Access nested keys using dot notation."""
    parts = path.split(".")
    curr = data
    for part in parts:
        if isinstance(curr, dict) and part in curr:
            curr = curr[part]
        else:
            return None
    return curr


def parse_numeric_value(val: Any) -> Any:
    """Coerce currency strings ($89.99, ₹1,299) to clean floats."""
    if isinstance(val, str):
        cleaned = re.sub(r"[^\d.-]", "", val)
        if cleaned:
            try:
                return float(cleaned)
            except ValueError:
                pass
    return val


def check_ambiguous_dates(obj: Any):
    """Rejects ambiguous DD/MM/YYYY vs MM/DD/YYYY date representations."""
    if isinstance(obj, dict):
        for v in obj.values():
            check_ambiguous_dates(v)
    elif isinstance(obj, list):
        for v in obj:
            check_ambiguous_dates(v)
    elif isinstance(obj, str):
        match = re.match(r"^(\d{2})/(\d{2})/(\d{4})$", obj.strip())
        if match:
            first, second = int(match.group(1)), int(match.group(2))
            if first <= 12 and second <= 12:
                raise HTTPException(
                    status_code=422,
                    detail=f"Ambiguous date '{obj}'. Use ISO-8601 (YYYY-MM-DD)."
                )


def normalize_schema(schema: Any) -> Dict[str, Any]:
    """Convert an OpenAPI document or operation into a JSON Schema object."""
    if not isinstance(schema, dict):
        return {}
    if "openapi" not in schema:
        return schema

    paths = schema.get("paths", {})
    for path_item in paths.values():
        if not isinstance(path_item, dict):
            continue
        for operation in path_item.values():
            if not isinstance(operation, dict):
                continue
            request_body = operation.get("requestBody", {})
            content = request_body.get("content", {}) if isinstance(request_body, dict) else {}
            application_json = content.get("application/json", {}) if isinstance(content, dict) else {}
            extracted = application_json.get("schema") if isinstance(application_json, dict) else None
            if isinstance(extracted, dict):
                return extracted
    return {}


@app.get("/")
async def root_health():
    return {
        "service": "SchemaGuard Engine",
        "status": "healthy",
        "endpoints": [
            "/v1/transform",
            "/v1/diagnose",
            "/v1/diff",
            "/v1/agent/strands",
            "/docs"
        ]
    }


@app.post("/v1/agent/strands")
async def strands_endpoint(request: Request):
    """Executes multi-strand investigation using AWS Strands Agents SDK + Groq."""
    body = await get_safe_json_body(request)

    base_contract = body.get("base_contract") or body.get("baseline_contract") or {}
    updated_contract = body.get("updated_contract") or body.get("candidate_contract") or {}

    if isinstance(base_contract, str):
        try:
            base_contract = json.loads(base_contract)
        except Exception:
            base_contract = {}

    if isinstance(updated_contract, str):
        try:
            updated_contract = json.loads(updated_contract)
        except Exception:
            updated_contract = {}

    return await run_strands_investigation(
        base_contract=base_contract,
        updated_contract=updated_contract
    )


@app.post("/v1/transform", response_model=TransformResponse)
async def transform_endpoint(request: Request):
    raw_body_bytes = await request.body()
    if len(raw_body_bytes) > 1024 * 1024:
        raise HTTPException(status_code=413, detail="Payload exceeds maximum permitted size (1MB).")

    if not raw_body_bytes or not raw_body_bytes.strip():
        body = {}
    else:
        try:
            body = json.loads(raw_body_bytes.decode("utf-8"))
        except Exception:
            raise HTTPException(status_code=400, detail="Malformed JSON payload.")

    check_prototype_poisoning(body)
    check_ambiguous_dates(body)

    input_data = body.get("input_data") or body.get("payload") or body.get("data") or {}
    target_schema = body.get("target_schema") or body.get("contract") or {}

    if isinstance(input_data, str):
        try:
            input_data = json.loads(input_data)
        except Exception:
            input_data = {}
    if isinstance(target_schema, str):
        try:
            target_schema = json.loads(target_schema)
        except Exception:
            target_schema = {}
    target_schema = normalize_schema(target_schema)
    mapping_instructions = body.get("mapping_instructions") or {}

    transformed_payload: Dict[str, Any] = {}
    mutations: list[TransformMutation] = []

    # 1. Apply explicit mapping instructions
    if mapping_instructions and isinstance(input_data, dict):
        for src_path, target_key in mapping_instructions.items():
            val = extract_nested_key(input_data, src_path)
            if val is not None:
                expected_type = (
                    target_schema.get("properties", {}).get(target_key, {}).get("type")
                    if isinstance(target_schema, dict)
                    else None
                )
                if expected_type in ("number", "integer"):
                    val = parse_numeric_value(val)
                transformed_payload[target_key] = val
                mutations.append(TransformMutation(field=src_path, action="map", to=target_key))

    # 2. Auto-map matching keys or flatten nested structures
    if not transformed_payload and isinstance(input_data, dict):
        flat_input = {}
        for k, v in input_data.items():
            if isinstance(v, dict):
                flat_input.update(v)
            else:
                flat_input[k] = v

        for k, v in flat_input.items():
            norm_k = k.replace("total_", "").replace("user_", "")
            val = parse_numeric_value(v)
            transformed_payload[norm_k] = val
            if norm_k != k:
                transformed_payload[k] = val
                mutations.append(TransformMutation(field=k, action="normalize", to=norm_k))

    # 3. Validate against target_schema
    errors = []
    status = "valid"
    if target_schema and isinstance(target_schema, dict):
        validator = jsonschema.Draft7Validator(target_schema)
        for err in validator.iter_errors(transformed_payload):
            errors.append(err.message)
        if errors:
            status = "invalid"

    final_payload = None if status == "invalid" else transformed_payload

    return TransformResponse(
        status=status,
        payload=final_payload,
        validation=TransformValidation(
            valid=(status == "valid"),
            mutations_applied=mutations,
            errors=errors
        ),
        strategy="schema_evolution",
        source="v1",
        target="v2"
    )


@app.post("/v1/diagnose", response_model=GuardianDiagnosisResponse)
async def diagnose_endpoint(request: Request):
    body = await get_safe_json_body(request)
    schema = body.get("contract") or body.get("schema") or {}
    payload = body.get("payload") or body.get("data") or {}

    if isinstance(schema, str):
        try:
            schema = json.loads(schema)
        except Exception:
            schema = {}
    schema = normalize_schema(schema)
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except Exception:
            payload = {}

    violations = []
    if schema and isinstance(schema, dict):
        validator = jsonschema.Draft7Validator(schema)
        for err in sorted(validator.iter_errors(payload), key=lambda e: e.path):
            v_type = "SCHEMA_VIOLATION"
            if "required" in err.message:
                v_type = "MISSING_REQUIRED_FIELD"
            elif "type" in err.message:
                v_type = "TYPE_MISMATCH"

            violations.append(ContractViolation(
                path=".".join([str(p) for p in err.path]) if err.path else "schema.validation",
                violation_type=v_type,
                expected="Compliant schema definition",
                actual="Mismatched contract payload",
                message=err.message,
                severity="BREAKING"
            ))

    impact = agent.investigate(schema, payload, violations)
    consumers = agent.derive_affected_consumers(violations)

    return GuardianDiagnosisResponse(
        status="violated" if violations else "compliant",
        violations=violations,
        impact=impact,
        downstream=consumers,
        telemetry={"checked_rules": len(schema.get("properties", {})) if isinstance(schema, dict) else 0}
    )


@app.post("/v1/diff", response_model=DiffResponse)
async def diff_endpoint(request: Request):
    body = await get_safe_json_body(request)
    baseline = body.get("baseline_contract") or body.get("baseline") or {}
    candidate = body.get("candidate_contract") or body.get("candidate") or {}

    if isinstance(baseline, str):
        try:
            baseline = json.loads(baseline)
        except Exception:
            baseline = {}
    if isinstance(candidate, str):
        try:
            candidate = json.loads(candidate)
        except Exception:
            candidate = {}

    if hasattr(differ, "diff"):
        violations = differ.diff(baseline, candidate)
    elif hasattr(differ, "diff_specs"):
        violations = differ.diff_specs(baseline, candidate)
    elif hasattr(SchemaDiffer, "diff_specs"):
        violations = SchemaDiffer.diff_specs(baseline, candidate)
    else:
        violations = []

    if isinstance(violations, DiffResponse):
        return violations
    if isinstance(violations, dict):
        return DiffResponse(**violations)

    breaking_count = sum(
        1 for v in violations if getattr(v, "severity", "") in ("BREAKING", SeverityLevel.BREAKING)
    )
    risk = "HIGH" if breaking_count > 0 else "LOW"

    return DiffResponse(
        breaking_change_count=breaking_count,
        breaking_changes=violations,
        risk_level=risk,
        affected_services=[]
    )