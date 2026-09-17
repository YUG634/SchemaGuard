export type View = 'landing' | 'workspace' | 'results';

export interface TransformValidationMutation {
  field: string;
  action: string;
  to: string;
}

export interface TransformValidation {
  valid: boolean;
  mutations_applied: TransformValidationMutation[];
  errors: string[];
}

export interface TransformImpactSummary {
  risk_level?: string;
  affected_consumers_count?: number;
  estimated_migration_hours?: number;
}

export interface TransformResponse {
  status: 'valid' | 'invalid';
  payload: Record<string, unknown>;
  validation?: TransformValidation;
  patch_snippet?: string;
  strategy?: string;
  source?: string;
  target?: string;
  impact_summary?: TransformImpactSummary | null;
  downstream?: DownstreamConsumer[];
}

export interface Violation {
  path: string;
  violation_type: string;
  expected: string;
  actual: string;
  message: string;
  severity: 'BREAKING' | 'WARNING';
  probable_root_cause?: string;
}

export interface DiagnoseImpact {
  summary: string;
  downstream_risks: string[];
  probable_root_cause: string;
  recommended_fix: string;
  patch_snippet?: string;
}

export interface DiagnoseResponse {
  status: 'compliant' | 'violated';
  violations: Violation[];
  impact?: DiagnoseImpact;
  telemetry?: Record<string, unknown>;
  downstream?: DownstreamConsumer[];
}

export interface DiffResponse {
  breaking_change_count: number;
  breaking_changes: Violation[];
  risk_level?: string;
  affected_services?: string[];
}

export interface AnalysisDerived {
  total_findings: number;
  breaking: number;
  warnings: number;
  passed: boolean; // diagnose.status === "compliant" && (!diff || diff.breaking_change_count === 0)
}

export interface DriftPoint {
  date: string;
  errors: number;
}

export type AnalysisResult = {
  run_id: string;
  timestamp: number;
  source: 'live' | 'mock';
  transform: TransformResponse | null;
  diagnose: DiagnoseResponse;
  diff: DiffResponse | null;
  derived: AnalysisDerived;
  drift?: DriftPoint[];
};

export interface DownstreamConsumer {
  name: string;
  severity: 'low' | 'medium' | 'breaking';
  description?: string;
}

