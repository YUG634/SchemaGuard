from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_successful_transform_with_currency():
    payload = {
        "input_data": {
            "customer": {
                "name": "Yug Agrawal",
                "revenue": "\u20b91,299"
            }
        },
        "target_schema": {
            "type": "object",
            "properties": {
                "customer_name": {"type": "string"},
                "amount": {"type": "number"}
            },
            "required": ["customer_name", "amount"]
        },
        "mapping_instructions": {
            "customer.name": "customer_name",
            "customer.revenue": "amount"
        }
    }

    response = client.post("/v1/transform", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "valid"
    assert data["payload"]["customer_name"] == "Yug Agrawal"
    assert data["payload"]["amount"] == 1299.0
    assert data["validation"]["valid"] is True
    assert len(data["validation"]["mutations_applied"]) == 2

def test_validation_failure_missing_required():
    payload = {
        "input_data": {
            "customer": {
                "name": "Yug Agrawal"
            }
        },
        "target_schema": {
            "type": "object",
            "properties": {
                "customer_name": {"type": "string"},
                "amount": {"type": "number"}
            },
            "required": ["customer_name", "amount"]
        },
        "mapping_instructions": {
            "customer.name": "customer_name"
        }
    }

    response = client.post("/v1/transform", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "invalid"
    assert data["payload"] is None
    assert data["validation"]["valid"] is False
    assert any("'amount' is a required property" in err for err in data["validation"]["errors"])

def test_payload_exceeds_1mb():
    large_input = {"key": "x" * (1024 * 1024 + 50)}
    response = client.post(
        "/v1/transform",
        json={"input_data": large_input, "target_schema": {}, "mapping_instructions": {}}
    )
    assert response.status_code == 413
