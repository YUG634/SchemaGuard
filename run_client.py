import httpx
import json

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

with httpx.Client(base_url="http://127.0.0.1:8000") as client:
    # 1. Health & Crawler Verification Check
    health_resp = client.get("/health")
    print("=== Health Check ===")
    print(json.dumps(health_resp.json(), indent=2))

    # 2. Transformation Engine Check
    transform_resp = client.post("/v1/transform", json=payload)
    print("\n=== Transform Response ===")
    print(json.dumps(transform_resp.json(), indent=2))