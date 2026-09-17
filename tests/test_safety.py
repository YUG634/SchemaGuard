from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_rejects_prototype_poisoning():
    payload = {
        "input_data": {
            "__proto__": {"admin": True},
            "user": "legit"
        },
        "target_schema": {
            "type": "object",
            "properties": {"user": {"type": "string"}}
        },
        "mapping_instructions": {"user": "user"}
    }
    response = client.post("/v1/transform", json=payload)
    assert response.status_code == 400
    assert "Malicious key '__proto__' detected" in response.json()["detail"]

def test_rejects_ambiguous_date():
    payload = {
        "input_data": {
            "event_date": "03/04/2026"
        },
        "target_schema": {
            "type": "object",
            "properties": {"date": {"type": "string"}}
        },
        "mapping_instructions": {"event_date": "date"}
    }
    response = client.post("/v1/transform", json=payload)
    assert response.status_code == 422
    assert "Ambiguous date '03/04/2026'" in response.json()["detail"]

def test_allows_unambiguous_date():
    payload = {
        "input_data": {
            "event_date": "25/12/2026"
        },
        "target_schema": {
            "type": "object",
            "properties": {"date": {"type": "string"}}
        },
        "mapping_instructions": {"event_date": "date"}
    }
    response = client.post("/v1/transform", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "valid"
