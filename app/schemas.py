from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class VerificationResponse(BaseModel):
    schemaVersion: int
    slug: str
    commit: str


class TransformRequest(BaseModel):
    input_data: Dict[str, Any]
    target_schema: Dict[str, Any]
    mapping_instructions: Optional[Dict[str, str]] = Field(default_factory=dict)


class MutationAudit(BaseModel):
    field: str
    action: str
    to: str


class ValidationResult(BaseModel):
    valid: bool
    mutations_applied: List[MutationAudit] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)


class TransformResponse(BaseModel):
    status: str  # "valid" or "invalid"
    payload: Optional[Dict[str, Any]] = None
    validation: ValidationResult