from typing import Any, Dict, List
from app.schemas import ContractViolation, ViolationSeverity


class SchemaDiffer:
    @staticmethod
    def diff_specs(
        base_schema: Dict[str, Any], candidate_schema: Dict[str, Any]
    ) -> List[ContractViolation]:
        violations: List[ContractViolation] = []

        base_props = base_schema.get("properties", {})
        cand_props = candidate_schema.get("properties", {})
        base_req = set(base_schema.get("required", []))
        cand_req = set(candidate_schema.get("required", []))

        # Check for newly added required fields (breaking for producers)
        new_required = cand_req - base_req
        for req_field in new_required:
            if req_field not in base_props:
                violations.append(
                    ContractViolation(
                        path=f"required.{req_field}",
                        violation_type="ADDED_REQUIRED_CONSTRAINT",
                        expected="Optional or non-existent in baseline",
                        actual="Required in candidate",
                        message=f"New required field '{req_field}' breaks existing consumers.",
                        severity=ViolationSeverity.BREAKING,
                    )
                )

        # Check for removed fields in candidate schema
        for prop_name, prop_def in base_props.items():
            if prop_name not in cand_props:
                severity = (
                    ViolationSeverity.BREAKING
                    if prop_name in base_req
                    else ViolationSeverity.WARNING
                )
                violations.append(
                    ContractViolation(
                        path=f"properties.{prop_name}",
                        violation_type="REMOVED_FIELD",
                        expected=f"Field defined ({prop_def.get('type', 'any')})",
                        actual="None",
                        message=f"Field '{prop_name}' was removed from target contract.",
                        severity=severity,
                    )
                )
                continue

            # Check for type divergence
            base_type = prop_def.get("type")
            cand_type = cand_props[prop_name].get("type")
            if base_type and cand_type and base_type != cand_type:
                violations.append(
                    ContractViolation(
                        path=f"properties.{prop_name}.type",
                        violation_type="TYPE_MUTATION",
                        expected=base_type,
                        actual=cand_type,
                        message=f"Field '{prop_name}' type shifted from '{base_type}' to '{cand_type}'.",
                        severity=ViolationSeverity.BREAKING,
                    )
                )

        return violations