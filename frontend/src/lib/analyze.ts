import {
  AnalysisResult,
  DiagnoseResponse,
  DiffResponse,
  TransformResponse,
  Violation,
} from './types';
import { mockAnalysis } from './demo';

export interface AnalyzeRequestBody {
  contract: string;
  payload: string;
  baseline_contract?: string;
}

export async function runAnalysis(
  body: AnalyzeRequestBody
): Promise<AnalysisResult> {
  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

  try {
    const timeoutSignal = AbortSignal.timeout(5000);

    const transformPromise = fetch(`${backendUrl}/v1/transform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contract: body.contract,
        payload: body.payload,
      }),
      signal: timeoutSignal,
    });

    const diagnosePromise = fetch(`${backendUrl}/v1/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contract: body.contract,
        payload: body.payload,
      }),
      signal: timeoutSignal,
    });

    // Without an explicit baseline, diff the contract against itself.
    const baselineContract = body.baseline_contract || body.contract;

    const diffPromise = fetch(`${backendUrl}/v1/diff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseline_contract: baselineContract,
        candidate_contract: body.contract,
      }),
      signal: timeoutSignal,
    });

    const [transformRes, diagnoseRes, diffRes] = await Promise.all([
      transformPromise,
      diagnosePromise,
      diffPromise,
    ]);

    if (!transformRes.ok || !diagnoseRes.ok) {
      throw new Error(
        `Backend error: transform=${transformRes.status}, diagnose=${diagnoseRes.status}`
      );
    }

    if (diffRes && !diffRes.ok) {
      throw new Error(`Backend error: diff=${diffRes.status}`);
    }

    const transformData = (await transformRes.json()) as TransformResponse;
    const diagnoseData = (await diagnoseRes.json()) as DiagnoseResponse;
    const diffData = diffRes ? ((await diffRes.json()) as DiffResponse) : null;

    // 1. Runtime AST/Schema Violations (Payload vs Contract)
    const runtimeViolations: Violation[] = diagnoseData.violations || [];
    const runtimeBreaking = runtimeViolations.filter(
      (v) => (v.severity || '').toUpperCase() === 'BREAKING'
    ).length;

    // 2. Spec Evolution Diff Changes (Candidate vs Baseline)
    const diffChanges: Violation[] = diffData?.breaking_changes || [];

    // 3. Verdict: Current payload satisfies the contract rules
    const passed = runtimeBreaking === 0 && diagnoseData.status === 'compliant';

    const randomRunId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 6)
        : Math.random().toString(36).substring(2, 8);

    return {
      run_id: randomRunId,
      timestamp: Date.now(),
      source: 'live',
      transform: transformData,
      diagnose: diagnoseData,
      diff: diffData,
      derived: {
        total_findings: runtimeViolations.length + diffChanges.length,
        breaking: runtimeBreaking,
        warnings: diffChanges.length,
        passed,
      },
    };
  } catch (error) {
    console.warn('Real backend call failed, falling back to mock data:', error);
    const randomRunId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 6)
        : Math.random().toString(36).substring(2, 8);

    return {
      ...mockAnalysis,
      run_id: randomRunId,
      timestamp: Date.now(),
      source: 'mock',
    };
  }
}