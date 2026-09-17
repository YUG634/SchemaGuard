import { AnalysisResult } from './types';

export const SAMPLE_CONTRACT = `{
  "openapi": "3.1.0",
  "info": {
    "title": "Payment Orchestration API",
    "version": "1.4.0"
  },
  "paths": {
    "/v1/charge": {
      "post": {
        "summary": "Execute payment transaction",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["amount", "currency", "customer_id", "idempotency_key", "settlement_tier"],
                "properties": {
                  "amount": { "type": "integer", "description": "Charge amount in smallest currency unit (cents)" },
                  "currency": { "type": "string", "enum": ["usd", "eur", "gbp", "jpy"] },
                  "customer_id": { "type": "string", "pattern": "^cus_[a-zA-Z0-9]{16}$" },
                  "idempotency_key": { "type": "string", "format": "uuid" },
                  "settlement_tier": { "type": "string", "enum": ["instant", "standard", "t_plus_2"] },
                  "signature": { "type": "string", "description": "HMAC-SHA256 authorization signature" },
                  "retry_policy": {
                    "type": "object",
                    "properties": {
                      "max_attempts": { "type": "integer", "maximum": 5 },
                      "backoff_multiplier": { "type": "number" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;

export const SAMPLE_PAYLOAD = `{
  "amount": "4950",
  "currency": "USD",
  "customer_id": "cus_9934810294819284",
  "idempotency_key": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "signature": ["hmac_v1_sha256", "98a1f4e09b1a03"],
  "retry_policy": {
    "max_attempts": "3",
    "backoff_multiplier": 1.5
  }
}`;

export const HISTORICAL_DRIFT = [
  { date: 'May 10', errors: 0 },
  { date: 'May 17', errors: 0 },
  { date: 'May 24', errors: 1 },
  { date: 'May 31', errors: 0 },
  { date: 'Jun 07', errors: 2 },
  { date: 'Jun 14', errors: 1 },
  { date: 'Jun 21', errors: 4 },
];

export const mockAnalysis: AnalysisResult = {
  run_id: 'a91f2',
  timestamp: Date.now() - 2300,
  source: 'mock',
  transform: {
    status: 'invalid',
    payload: {
      amount: '4950',
      currency: 'USD',
      customer_id: 'cus_9934810294819284',
      idempotency_key: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      signature: ['hmac_v1_sha256', '98a1f4e09b1a03'],
      retry_policy: {
        max_attempts: '3',
        backoff_multiplier: 1.5,
      },
    },
    validation: {
      valid: false,
      mutations_applied: [
        { field: 'currency', action: 'normalize_case', to: 'usd' },
      ],
      errors: [
        "Field 'settlement_tier' is required but missing",
        "Field 'signature' expected string, got array",
        "Field 'amount' expected integer, got string",
      ],
    },
  },
  diagnose: {
    status: 'violated',
    violations: [
      {
        path: 'settlement_tier',
        violation_type: 'missing_required_field',
        expected: '"settlement_tier": "instant" | "standard"',
        actual: 'undefined /* missing required field */',
        message: "Required property 'settlement_tier' is completely missing from payload.",
        severity: 'BREAKING',
      },
      {
        path: 'signature',
        violation_type: 'type_mismatch',
        expected: '"signature": "hmac_v1_98a1f4e09b1a03..."',
        actual: '"signature": ["hmac_v1_sha256", "98a1f4e09b1a03"]',
        message: "Type mismatch: expected 'string', but received 'array' with 2 items.",
        severity: 'BREAKING',
      },
      {
        path: 'amount',
        violation_type: 'type_mismatch',
        expected: '"amount": 4950',
        actual: '"amount": "4950"',
        message: 'Type mismatch: string received where integer required (breaks downstream arithmetic).',
        severity: 'BREAKING',
      },
      {
        path: 'currency',
        violation_type: 'value_constraint',
        expected: '"currency": "usd"',
        actual: '"currency": "USD"',
        message: "Case sensitivity warning: enum defines lowercase values ['usd', 'eur', 'gbp', 'jpy'].",
        severity: 'WARNING',
      },
    ],
    impact: {
      summary: '3 breaking violations and 1 warning detected against Payment Orchestration API v1.4.0.',
      downstream_risks: [
        'Billing Service batch drop: missing settlement_tier leads to unrouted settlement queue.',
        'Mobile App parser crash: signature deserializer expects string primitive, received array.',
        'Analytics aggregation failure: string amount causes NaN calculations in revenue metrics.',
      ],
      probable_root_cause:
        'Upstream checkout bumped @paycore/types to v2.4.0 altering signature format to tuple, while frontend serializer omitted settlement_tier.',
      recommended_fix:
        "Coerce amount to integer, normalize currency to lowercase, and provide settlement_tier: 'standard'.",
      patch_snippet: `{\n  "amount": 4950,\n  "currency": "usd",\n  "settlement_tier": "standard",\n  "signature": "hmac_v1_98a1f4e09b1a03"\n}`,
    },
    telemetry: {},
  },
  diff: {
    breaking_change_count: 1,
    breaking_changes: [
      {
        path: 'paths./v1/charge.post.requestBody.settlement_tier',
        violation_type: 'required_field_added',
        expected: 'optional or defaulted property',
        actual: "required: [..., 'settlement_tier']",
        message: "New required property 'settlement_tier' introduced without fallback default in candidate contract.",
        severity: 'BREAKING',
      },
    ],
  },
  derived: {
    total_findings: 5,
    breaking: 4,
    warnings: 1,
    passed: false,
  },
};

