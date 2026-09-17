import json
from typing import Any, Dict, Optional
from mcp.server.mcpserver import MCPServer
from app.engine import TransformationEngine, AmbiguousDataError, PoisoningError

mcp = MCPServer("SchemaGuard")


@mcp.tool()
def transform_contract(
    input_data: Dict[str, Any],
    target_schema: Dict[str, Any],
    mapping_instructions: Optional[Dict[str, str]] = None
) -> str:
    """
    Deterministic runtime contract adapter for autonomous agents.
    Transforms raw input dictionaries to match strict target JSON schemas
    using explicit field mappings or heuristic advisory matching,
    followed by deterministic type coercions and strict schema validation.
    """
    try:
        result = TransformationEngine.transform(
            input_data=input_data,
            target_schema=target_schema,
            mapping_instructions=mapping_instructions
        )
        return json.dumps(result, indent=2)
    except PoisoningError as pe:
        return json.dumps({
            "status": "error",
            "error_type": "SecurityPoisoningError",
            "detail": pe.message
        }, indent=2)
    except AmbiguousDataError as ae:
        return json.dumps({
            "status": "error",
            "error_type": "AmbiguousDataError",
            "detail": ae.message
        }, indent=2)
    except Exception as e:
        return json.dumps({
            "status": "error",
            "error_type": "InternalEngineError",
            "detail": str(e)
        }, indent=2)


if __name__ == "__main__":
    mcp.run(transport="stdio")
