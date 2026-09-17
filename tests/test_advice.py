from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_automatic_advice_and_mapping():
    payload = {
        "input_data": {
            "account": {
                "customer_name": "Jane Doe",
                "total_amount": "$89.99"
            }
        },
        "target_schema": {
            "type": "object",
            "properties": {
                "customer_name": {"type": "string"},
                "amount": {"type": "number"}
            },
            "required": ["customer_name", "amount"]
        }
    }

    response = client.post("/v1/transform", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "valid"
    assert data["payload"]["customer_name"] == "Jane Doe"
    assert data["payload"]["amount"] == 89.99
    assert data["validation"]["valid"] is True