import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple
import jsonschema
from jsonschema.exceptions import ValidationError

BANNED_KEYS = {"__proto__", "constructor", "prototype"}


class AmbiguousDataError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class PoisoningError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class TransformationEngine:
    @classmethod
    def sanitize_structure(cls, data: Any) -> None:
        """Traverse incoming structure and raise error on prototype poison keys."""
        if isinstance(data, dict):
            for k, v in data.items():
                if k in BANNED_KEYS:
                    raise PoisoningError(f"Malicious key '{k}' detected in payload")
                cls.sanitize_structure(v)
        elif isinstance(data, list):
            for item in data:
                cls.sanitize_structure(item)

    @classmethod
    def check_ambiguous_date(cls, val: Any) -> None:
        """
        Flag ambiguous dates where day and month cannot be resolved deterministically.
        e.g., '03/04/2026' or '03-04-2026' (both tokens <= 12).
        """
        if not isinstance(val, str):
            return

        date_match = re.match(r"^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$", val.strip())
        if date_match:
            first, second, _ = map(int, date_match.groups())
            if 1 <= first <= 12 and 1 <= second <= 12 and first != second:
                raise AmbiguousDataError(
                    f"Ambiguous date '{val}': cannot determine whether format is DD/MM/YYYY or MM/DD/YYYY"
                )

    @staticmethod
    def get_by_dot_path(data: Dict[str, Any], path: str) -> Tuple[bool, Any]:
        """Traverse nested dictionary using dot-notation keys."""
        tokens = path.split(".")
        current = data
        for token in tokens:
            if isinstance(current, dict) and token in current:
                current = current[token]
            else:
                return False, None
        return True, current

    @staticmethod
    def normalize_value(val: Any, target_type: Optional[str]) -> Tuple[Any, Optional[str]]:
        """
        Normalize values deterministically (e.g., currency strings to floats).
        Matches currency symbols (\u20B9, $, \u20AC, \u00A3, \u00A5).
        """
        if target_type in ("number", "integer") and isinstance(val, str):
            cleaned = re.sub(r"[\$\u20B9\u20AC\u00A3\u00A5\s]", "", val).replace(",", "")
            try:
                converted = float(cleaned)
                if target_type == "integer":
                    converted = int(converted)
                return converted, "currency_normalization"
            except ValueError:
                pass
        return val, None

    @classmethod
    def propose_mappings(
        cls,
        input_data: Dict[str, Any],
        target_schema: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Deterministic heuristic fallback for field mapping when none are supplied.
        Extracts leaf paths from input and matches them against target schema properties.
        """
        proposed: Dict[str, str] = {}
        target_props = set(target_schema.get("properties", {}).keys())

        def extract_paths(obj: Dict[str, Any], prefix: str = ""):
            for k, v in obj.items():
                full_path = f"{prefix}.{k}" if prefix else k
                if isinstance(v, dict):
                    extract_paths(v, full_path)
                else:
                    norm_key = k.lower().replace("-", "_")
                    for prop in target_props:
                        prop_norm = prop.lower().replace("-", "_")
                        if norm_key == prop_norm or norm_key in prop_norm or prop_norm in norm_key:
                            if prop not in proposed.values():
                                proposed[full_path] = prop

        extract_paths(input_data)
        return proposed

    @classmethod
    def transform(
        cls,
        input_data: Dict[str, Any],
        target_schema: Dict[str, Any],
        mapping_instructions: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        # Step 1: Scan for prototype poisoning & schema tampering
        cls.sanitize_structure(input_data)
        cls.sanitize_structure(target_schema)

        # Step 2: Use provided mappings or infer via advisor
        active_mappings = mapping_instructions or cls.propose_mappings(input_data, target_schema)

        transformed_payload: Dict[str, Any] = {}
        mutations: List[Dict[str, str]] = []
        schema_props = target_schema.get("properties", {})

        for src_path, dest_field in active_mappings.items():
            exists, raw_value = cls.get_by_dot_path(input_data, src_path)
            if not exists:
                continue

            # Step 3: Guard against ambiguous values
            cls.check_ambiguous_date(raw_value)

            expected_type = schema_props.get(dest_field, {}).get("type")
            normalized_value, mutation_type = cls.normalize_value(raw_value, expected_type)

            transformed_payload[dest_field] = normalized_value

            if mutation_type:
                mutations.append({
                    "field": src_path,
                    "action": mutation_type,
                    "to": dest_field
                })
            else:
                mutations.append({
                    "field": src_path,
                    "action": "rename",
                    "to": dest_field
                })

        # Step 4: Authoritative Schema Validation
        validator = jsonschema.Draft202012Validator(target_schema)
        errors = [err.message for err in validator.iter_errors(transformed_payload)]

        if errors:
            return {
                "status": "invalid",
                "payload": None,
                "validation": {
                    "valid": False,
                    "mutations_applied": mutations,
                    "errors": errors
                }
            }

        return {
            "status": "valid",
            "payload": transformed_payload,
            "validation": {
                "valid": True,
                "mutations_applied": mutations,
                "errors": []
            }
        }