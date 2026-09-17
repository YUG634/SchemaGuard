from app.differ import SchemaDiffer
from app.agent import GuardianInvestigationAgent
from app.schemas import ViolationSeverity


def test_schema_differ_detects_removed_field():
    base = {
        "type": "object",
        "properties": {"id": {"type": "string"}, "price": {"type": "number"}},
        "required": ["id"],
    }
    candidate = {
        "type": "object",
        "properties": {"id": {"type": "string"}},
        "required": ["id"],
    }

    diffs = SchemaDiffer.diff_specs(base, candidate)
    assert len(diffs) == 1
    assert diffs[0].violation_type == "REMOVED_FIELD"
    assert diffs[0].path == "properties.price"


def test_agent_investigation_workflow():
    agent = GuardianInvestigationAgent()
    base = {"type": "object", "properties": {"user_id": {"type": "string"}}}
    payload = {"user_id": 12345}

    # Simulate diff finding
    diffs = SchemaDiffer.diff_specs(
        base, {"type": "object", "properties": {"user_id": {"type": "integer"}}}
    )
    analysis = agent.investigate(base, payload, diffs)

    assert "type mismatch" in analysis.probable_root_cause.lower()
    assert len(analysis.downstream_risks) > 0