import json
from typing import Any, Dict, Tuple, Union


def resolve_contract_schema(contract_input: Union[Dict[str, Any], str]) -> Tuple[Dict[str, Any], str]:
    """
    Parses contract input. Detects if input is raw JSON Schema or OpenAPI specification.
    Returns (extracted_json_schema, format_type).
    """
    if isinstance(contract_input, str):
        try:
            parsed = json.loads(contract_input)
        except Exception:
            return {"type": "object"}, "unknown"
    else:
        parsed = contract_input

    # Detect OpenAPI / Swagger specification
    if isinstance(parsed, dict) and ("openapi" in parsed or "swagger" in parsed):
        paths = parsed.get("paths", {})
        for _, path_item in paths.items():
            if not isinstance(path_item, dict):
                continue
            for _, operation in path_item.items():
                if not isinstance(operation, dict):
                    continue
                responses = operation.get("responses", {})
                for status_code in ("200", "201", 200, 201, "default"):
                    resp_obj = responses.get(status_code, {})
                    content = resp_obj.get("content", {})
                    if "application/json" in content:
                        schema = content["application/json"].get("schema")
                        if schema:
                            return schema, "openapi_3"
                    if "schema" in resp_obj:
                        return resp_obj["schema"], "swagger_2"

    return parsed, "json_schema"