from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SeverityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    WARNING = "WARNING"
    BREAKING = "BREAKING"


ViolationSeverity = SeverityLevel


class DiffHighlightType(str, Enum):
    TYPE_MISMATCH = "TYPE_MISMATCH"
    MISSING = "MISSING"
    REMOVED = "REMOVED"
    INFO = "INFO"


class ContractViolation(BaseModel):
    path: str
    violation_type: str
    expected: str
    actual: str
    message: str
    severity: str
    probable_root_cause: Optional[str] = None


class DiffNode(BaseModel):
    path: str
    expected: str
    actual: str
    diff_type: DiffHighlightType
    message: str


class ImpactAnalysis(BaseModel):
    summary: str
    downstream_risks: List[str] = Field(default_factory=list)
    probable_root_cause: str
    recommended_fix: str
    patch_snippet: Optional[str] = None


class DownstreamConsumerModel(BaseModel):
    name: str
    severity: str
    description: Optional[str] = None


class GuardianDiagnosisResponse(BaseModel):
    status: str
    violations: List[ContractViolation]
    impact: Optional[ImpactAnalysis] = None
    downstream: Optional[List[DownstreamConsumerModel]] = None
    telemetry: Optional[Dict[str, Any]] = None


class HistoricalDriftPoint(BaseModel):
    timestamp: str
    error_count: int
    health_score: int


class ImpactScorecard(BaseModel):
    score: SeverityLevel
    summary: str
    probable_root_cause: str
    downstream_risks: List[str]
    recommended_fix: str
    patch_snippet: str


class AnalyzeResponse(BaseModel):
    run_id: str
    status: str
    summary_banner: str
    violation_count: int
    diff_nodes: List[DiffNode]
    impact: ImpactScorecard
    historical_drift: List[HistoricalDriftPoint]


class TransformMutation(BaseModel):
    field: str
    action: str
    to: str


class TransformValidation(BaseModel):
    valid: bool
    mutations_applied: List[TransformMutation] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)


class TransformImpactSummary(BaseModel):
    risk_level: str
    affected_consumers_count: int
    estimated_migration_hours: float


class TransformResponse(BaseModel):
    status: str
    payload: Optional[Dict[str, Any]] = None
    validation: Optional[TransformValidation] = None
    patch_snippet: Optional[str] = None
    strategy: Optional[str] = None
    source: Optional[str] = None
    target: Optional[str] = None
    impact_summary: Optional[TransformImpactSummary] = None
    downstream: Optional[List[DownstreamConsumerModel]] = None


class DiffResponse(BaseModel):
    breaking_change_count: int
    breaking_changes: List[ContractViolation]
    risk_level: Optional[str] = "LOW"
    affected_services: Optional[List[str]] = Field(default_factory=list)