import re
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "schemaguard-mcp"
    assert data["schemaVersion"] == 1
    assert re.match(r"^[0-9a-fA-F]{40}$", data["commit"])

def test_well_known_verification():
    response = client.get("/.well-known/xagent-verification.json")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "schemaguard-mcp"
    assert data["schemaVersion"] == 1
    assert len(data["commit"]) == 40