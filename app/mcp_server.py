import json
from typing import Any, Dict, Optional
from mcp.server.fastmcp import FastMCP
from app.agent import GuardianInvestigationAgent
from app.differ import SchemaDiffer
from app.engine import AmbiguousDataError, PoisoningError, TransformationEngine
from app.schemas import ContractViolation

mcp = FastMCP("SchemaGuard-Guardian")
agent = GuardianInvestigationAgent()


@mcp.tool()
def transform_contract(
    input_data: Dict[str, Any],
    target_schema: Dict[str, Any],
    mapping_instructions: Optional[Dict[str, str]] = None,
) -> str:
    """
    Deterministic runtime contract adapter for autonomous agents.
    Transforms raw input dictionaries to match strict target JSON schemas
    using explicit field mappings or heuristic advisory matching.
    """
    try:
        result = TransformationEngine.transform(
            input_data=input_data,
            target_schema=target_schema,
            mapping_instructions=mapping_instructions,
        )
        return json.dumps(result, indent=2)
    except PoisoningError as pe:
        return json.dumps(
            {
                "status": "error",
                "error_type": "SecurityPoisoningError",
                "detail": pe.message,
            },
            indent=2,
        )
    except AmbiguousDataError as ae:
        return json.dumps(
            {
                "status": "error",
                "error_type": "AmbiguousDataError",
                "detail": ae.message,
            },
            indent=2,
        )
    except Exception as e:
        return json.dumps(
            {
                "status": "error",
                "error_type": "InternalEngineError",
                "detail": str(e),
            },
            indent=2,
        )


@mcp.tool()
def validate_and_diagnose(
    input_data: Dict[str, Any],
    target_schema: Dict[str, Any],
    mapping_instructions: Optional[Dict[str, str]] = None,
) -> str:
    """
    Validates API responses against an expected JSON schema,
    identifies contract breaks, and executes an automated diagnostic investigation.
    """
    transform_result = TransformationEngine.transform(
        input_data=input_data,
        target_schema=target_schema,
        mapping_instructions=mapping_instructions,
    )

    if transform_result["status"] == "valid":
        return json.dumps({"status": "valid", "message": "Contract intact."}, indent=2)

    raw_errors = transform_result["validation"]["errors"]
    violations = [
        ContractViolation(
            path="schema.validation",
            violation_type="SCHEMA_VIOLATION",
            expected="Compliant Draft202012 object",
            actual="Invalid structure",
            message=err,
        )
        for err in raw_errors
    ]

    impact = agent.investigate(target_schema, input_data, violations)

    return json.dumps(
        {
            "status": "violated",
            "violations": [v.model_dump() for v in violations],
            "impact_analysis": impact.model_dump(),
        },
        indent=2,
    )


@mcp.tool()
def detect_breaking_changes(
    baseline_schema: Dict[str, Any], candidate_schema: Dict[str, Any]
) -> str:
    """
    Compares two schemas over time to identify backward-incompatible breaks.
    """
    diffs = SchemaDiffer.diff_specs(baseline_schema, candidate_schema)
    return json.dumps(
        {
            "breaking_change_count": len(diffs),
            "breaking_changes": [d.model_dump() for d in diffs],
        },
        indent=2,
    )


if __name__ == "__main__":
    mcp.run(transport="stdio")
