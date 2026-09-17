import httpx
import json

client = httpx.Client(base_url="http://127.0.0.1:8000")

print("--- 1. Contract Transformation Test ---")
payload_valid = {
    "input_data": {"customer": {"name": "Yug Agrawal", "revenue": "\u20b91,299"}},
    "target_schema": {
        "type": "object",
        "properties": {"customer_name": {"type": "string"}, "amount": {"type": "number"}},
        "required": ["customer_name", "amount"],
    },
    "mapping_instructions": {"customer.name": "customer_name", "customer.revenue": "amount"},
}
r = client.post("/v1/transform", json=payload_valid)
print(f"Status: {r.status_code}")
print(json.dumps(r.json(), indent=2))

print("\n--- 2. Guardian Diagnostic Investigation Test ---")
payload_invalid = {
    "input_data": {"customer": {"name": "Yug Agrawal"}},
    "target_schema": {
        "type": "object",
        "properties": {"customer_name": {"type": "string"}, "amount": {"type": "number"}},
        "required": ["customer_name", "amount"],
    },
    "mapping_instructions": {"customer.name": "customer_name"},
}
r = client.post("/v1/diagnose", json=payload_invalid)
print(f"Status: {r.status_code}")
print(json.dumps(r.json(), indent=2))

print("\n--- 3. Breaking Change Schema Differ Test ---")
diff_payload = {
    "baseline_schema": {
        "type": "object",
        "properties": {"id": {"type": "string"}, "price": {"type": "number"}},
        "required": ["id"],
    },
    "candidate_schema": {
        "type": "object",
        "properties": {"id": {"type": "string"}},
        "required": ["id", "tax_rate"],
    },
}
r = client.post("/v1/diff", json=diff_payload)
print(f"Status: {r.status_code}")
print(json.dumps(r.json(), indent=2))

client.close()