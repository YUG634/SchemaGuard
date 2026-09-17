import json
from app.mcp_server import transform_contract

def test_mcp_valid_transform():
    input_data = {"user": {"handle": "@alex", "cost": "$45.50"}}
    schema = {
        "type": "object",
        "properties": {
            "username": {"type": "string"},
            "price": {"type": "number"}
        },
        "required": ["username", "price"]
    }
    mapping = {
        "user.handle": "username",
        "user.cost": "price"
    }

    raw_output = transform_contract(input_data, schema, mapping)
    result = json.loads(raw_output)

    assert result["status"] == "valid"
    assert result["payload"]["username"] == "@alex"
    assert result["payload"]["price"] == 45.5
    assert result["validation"]["valid"] is True

def test_mcp_ambiguity_rejection():
    input_data = {"date": "06/07/2026"}
    schema = {
        "type": "object",
        "properties": {"date": {"type": "string"}}
    }
    mapping = {"date": "date"}

    raw_output = transform_contract(input_data, schema, mapping)
    result = json.loads(raw_output)

    assert result["status"] == "error"
    assert result["error_type"] == "AmbiguousDataError"