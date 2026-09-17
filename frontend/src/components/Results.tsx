import React, { useState } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Wrench,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useAppStore } from '../lib/store';
import { DiffExplorer } from './DiffExplorer';
import { ImpactFlow } from './ImpactFlow';
import { FixCode } from './FixCode';

export const Results: React.FC = () => {
  const { result, analyze, reset, isLoading } = useAppStore();
  const [activeAccordion, setActiveAccordion] = useState<number[]>([1, 2, 3]);

  if (!result) return null;

  // 1. Safe extraction of violations and diagnosis structures
  const diagnose = result.diagnose || {};
  const violations: any[] = Array.isArray(diagnose.violations)
    ? diagnose.violations
    : Array.isArray((result as any).violations)
    ? (result as any).violations
    : [];

  const impact = diagnose.impact || (result as any).impact || {};
  const transform = result.transform || (result as any).transformation || {};
  const diff = result.diff;

  // 2. Safe derivation calculations
  const breakingCount = violations.filter(
    (v) => (v.severity || '').toUpperCase() === 'BREAKING'
  ).length;
  const warningCount = violations.length - breakingCount;

  const derived = result.derived || {
    total_findings: violations.length,
    breaking: breakingCount,
    warnings: warningCount,
    passed: violations.length === 0,
  };

  const isPassed = Boolean(derived.passed);
  const isViolation = !isPassed;

  const toggleAccordion = (index: number) => {
    setActiveAccordion((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // 3. Historical Drift series formatting
  const driftData =
    Array.isArray(result.drift) && result.drift.length > 0
      ? result.drift
      : [
          { date: '14d ago', errors: 0 },
          { date: '7d ago', errors: 0 },
          { date: '3d ago', errors: Math.max(0, derived.breaking - 1) },
          { date: 'Yesterday', errors: derived.breaking },
          { date: 'Today (current)', errors: derived.breaking },
        ];

  const maxErrors = Math.max(...driftData.map((d) => d.errors || 0), 2);
  const lastPoint = driftData[driftData.length - 1];
  const isDriftBreaking = lastPoint && lastPoint.errors >= 3;

  // 4. Safe string split for Root Causes & Recommendations
  const rootCauses: string[] =
    typeof impact?.probable_root_cause === 'string'
      ? impact.probable_root_cause
          .split(';')
          .map((s: string) => s.trim().replace(/\.+$/, ''))
          .filter(Boolean)
      : [];

  const recommendedFixes: string[] =
    typeof impact?.recommended_fix === 'string'
      ? impact.recommended_fix
          .split(';')
          .map((s: string) => s.trim().replace(/\.+$/, ''))
          .filter(Boolean)
      : [];

  const downstreamConsumers = diagnose.downstream || (result as any).downstream || [];

  const handleNewAnalysis = () => {
    reset();
    setTimeout(() => {
      document.getElementById('workspace-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <section id="results-section" className="pb-32 relative">
      {/* Sticky Sub-nav */}
      <div className="sticky top-14 z-40 w-full backdrop-blur-md bg-[#0b0a09]/90 border-b border-[#26221d] py-2.5">
        <div className="max-w-300 mx-auto px-4 sm:px-6 flex items-center justify-between text-[12.5px]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('workspace-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1 text-[#a8a29a] hover:text-[#f4f1ec] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <span className="text-[#3a342c]">·</span>
            <span className="font-mono text-[#f4f1ec]">Run #{result.run_id || 'LOCAL'}</span>
            <span className="text-[#3a342c]">·</span>
            <span className="text-[#6b6660]">
              {typeof result.timestamp === 'number'
                ? new Date(result.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : result.timestamp || 'Just now'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={analyze}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-[#26221d] hover:border-[#3a342c] hover:bg-[#1c1915] text-[#a8a29a] hover:text-[#f4f1ec] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Re-run</span>
            </button>
            <button
              type="button"
              onClick={handleNewAnalysis}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#1c1915] hover:bg-[#26221d] text-[#f4f1ec] border border-[#3a342c] transition-colors"
            >
              <PlusCircle className="w-3 h-3 text-[#ff6900]" />
              <span>New Analysis</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-300 mx-auto px-4 sm:px-6 pt-10 space-y-12">
        {/* Step Indicator */}
        <div className="w-full flex items-center justify-center py-4 select-none">
          <div className="flex items-center gap-2 sm:gap-3 text-[12.5px]">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('workspace-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#1c1915] border border-[#3a342c] text-[#f4f1ec] font-medium flex items-center gap-1.5 shadow-sm hover:border-[#ff6900]/40 transition-colors"
            >
              <span className="font-mono">①</span>
              <span>Compare</span>
            </button>
            <div className="w-6 sm:w-8 h-px border-b border-dashed border-[#3a342c]" />
            <div className="px-3.5 py-1.5 rounded-full bg-[#1c1915] border border-[#3a342c] text-[#f4f1ec] font-medium flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#ff6900] animate-pulse-dot" />
              <span className="font-mono">②</span>
              <span>Find the Break</span>
            </div>
            <div className="w-6 sm:w-8 h-px border-b border-dashed border-[#3a342c]" />
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('the-fix-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#1c1915] border border-[#3a342c] text-[#f4f1ec] font-medium flex items-center gap-1.5 shadow-sm hover:border-[#ff6900]/40 transition-colors"
            >
              <span className="font-mono">③</span>
              <span>Fix It</span>
            </button>
          </div>
        </div>

        {/* Verdict Banner */}
        <div
          id="verdict-banner"
          className={`relative rounded-2xl border bg-[#14120f] p-7 sm:p-9 overflow-hidden shadow-lg border-l-4 ${
            isPassed
              ? 'border-[#26221d] border-l-[#4d8c35]'
              : 'border-[#26221d] border-l-[#d94a3d]'
          }`}
          style={{
            backgroundImage: isPassed
              ? 'radial-gradient(circle at 0% 50%, rgba(77, 140, 53, 0.12) 0%, transparent 65%)'
              : 'radial-gradient(circle at 0% 50%, rgba(217, 74, 61, 0.12) 0%, transparent 65%)',
          }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.08em] font-mono text-[#a8a29a] flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPassed ? 'bg-[#4d8c35]' : 'bg-[#d94a3d]'
                  }`}
                />
                <span>
                  RUN #{result.run_id || 'LOCAL'} ·{' '}
                  {typeof result.timestamp === 'number'
                    ? new Date(result.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : result.timestamp || '2.3s AGO'}
                </span>
              </div>

              <h2 className="text-[32px] sm:text-[44px] leading-[1.08] tracking-[-0.035em] font-semibold text-[#f4f1ec] mt-2">
                {isPassed
                  ? 'This API kept its promise.'
                  : 'This API broke its contract.'}
              </h2>

              <p className="text-[15px] leading-[1.55] tracking-[-0.01em] text-[#a8a29a] mt-2">
                {isPassed
                  ? 'All schema constraints satisfied · safe for production'
                  : `${derived.breaking} breaking changes detected · do not ship`}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <div
                className={`px-4 py-2 rounded-xl font-mono text-[13px] font-semibold tracking-wide uppercase border flex items-center gap-2 ${
                  isViolation
                    ? 'bg-[#d94a3d]/15 border-[#d94a3d]/40 text-[#d94a3d]'
                    : 'bg-[#4d8c35]/15 border-[#4d8c35]/40 text-[#4d8c35]'
                }`}
              >
                {isViolation ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>FAILED (VIOLATION)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>PASSED (100%)</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stat Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-[#26221d] bg-[#14120f] px-4 py-3 shadow-sm">
            <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-[#6b6660]">
              Total Findings
            </div>
            <div className="font-mono text-[20px] font-semibold text-[#f4f1ec] mt-1">
              {derived.total_findings}
            </div>
          </div>

          <div className="rounded-lg border border-[#26221d] bg-[#14120f] px-4 py-3 shadow-sm">
            <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-[#6b6660]">
              Breaking
            </div>
            <div className="font-mono text-[20px] font-semibold text-[#d94a3d] mt-1">
              {derived.breaking}
            </div>
          </div>

          <div className="rounded-lg border border-[#26221d] bg-[#14120f] px-4 py-3 shadow-sm">
            <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-[#6b6660]">
              Warnings
            </div>
            <div className="font-mono text-[20px] font-semibold text-[#d99a2b] mt-1">
              {derived.warnings}
            </div>
          </div>

          <div className="rounded-lg border border-[#26221d] bg-[#14120f] px-4 py-3 shadow-sm">
            <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-[#6b6660]">
              Status
            </div>
            <div
              className={`font-mono text-[20px] font-semibold mt-1 ${
                isPassed ? 'text-[#4d8c35]' : 'text-[#d94a3d]'
              }`}
            >
              {isPassed ? 'COMPLIANT' : 'VIOLATIONS'}
            </div>
          </div>
        </div>

        {/* Monaco Diff Explorer */}
        <DiffExplorer
          violations={violations}
          breakingChanges={isPassed ? [] : diff?.breaking_changes || []}
          passed={isPassed}
        />

        {/* Drift Chart */}
        <div
          id="drift-section"
          className="rounded-2xl border border-[#26221d] bg-[#14120f] p-6 shadow-sm overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-[#26221d]">
            <div>
              <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-[#6b6660]">
                TEMPORAL REGRESSION ANALYSIS
              </div>
              <h3 className="text-[20px] leading-[1.15] tracking-[-0.02em] font-semibold text-[#f4f1ec] mt-0.5">
                Historical Drift
              </h3>
              <p className="text-[13px] leading-normal text-[#6b6660]">
                has this endpoint been drifting over past releases?
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-[#a8a29a]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff6900]" /> Contract Violations
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-px border-b border-dashed border-[#d94a3d]" /> Breaking Threshold
              </span>
            </div>
          </div>

          <div className="mt-6 w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={driftData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="driftGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6900" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ff6900" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6b6660', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: '#26221d' }}
                  tickLine={false}
                />
                <YAxis hide domain={[0, maxErrors + 1]} />
                <ReferenceLine
                  y={3}
                  stroke="#d94a3d"
                  strokeDasharray="4 4"
                  label={{
                    value: 'breaking threshold (3)',
                    fill: '#d94a3d',
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono',
                    position: 'top',
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-[#3a342c] bg-[#0b0a09] px-3 py-2 shadow-xl text-[12px] font-mono">
                          <div className="text-[#a8a29a]">{data.date}</div>
                          <div className="text-[#ff6900] font-semibold mt-0.5">
                            {data.errors} schema {data.errors === 1 ? 'error' : 'errors'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="errors"
                  stroke={isDriftBreaking ? '#d94a3d' : '#ff6900'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#driftGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Canvas Decision-Flow / Blast Radius */}
        <ImpactFlow
          impactSummary={transform?.impact_summary}
          verdict={derived.breaking > 0 ? 'BREAKING' : derived.warnings > 0 ? 'MEDIUM' : 'LOW'}
          downstreamRisks={impact?.downstream_risks || []}
          downstream={downstreamConsumers}
        />

        {/* Deep Inspection Accordion */}
        <div
          id="root-cause-section"
          className="rounded-2xl border border-[#26221d] bg-[#14120f] p-6 shadow-sm overflow-hidden"
        >
          <div className="pb-5 border-b border-[#26221d]">
            <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-[#6b6660]">
              DEEP INSPECTION
            </div>
            <h3 className="text-[20px] leading-[1.15] tracking-[-0.02em] font-semibold text-[#f4f1ec] mt-0.5">
              Diagnostic & AST Triage
            </h3>
            <p className="text-[13px] leading-normal text-[#6b6660]">
              why the payload broke contract and how the schema validator isolated it
            </p>
          </div>

          <div className="mt-4 divide-y divide-[#26221d]">
            {/* Accordion Item 1: Diagnostic Findings */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleAccordion(1)}
                className="w-full flex items-center justify-between text-left text-[14px] font-semibold text-[#f4f1ec] hover:text-[#ff6900] transition-colors"
              >
                <span>1. Diagnostic Findings ({violations.length})</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#a8a29a] transition-transform duration-200 ${
                    activeAccordion.includes(1) ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {activeAccordion.includes(1) && (
                <div className="mt-3 text-[14px] leading-[1.65] text-[#a8a29a] space-y-2 pl-2 border-l border-[#26221d]">
                  {violations.length > 0 ? (
                    violations.map((v: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-[#0b0a09] border border-[#26221d] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10.5px] font-mono font-semibold ${
                                (v.severity || '').toUpperCase() === 'BREAKING'
                                  ? 'bg-[#d94a3d]/20 text-[#d94a3d]'
                                  : 'bg-[#d99a2b]/20 text-[#d99a2b]'
                              }`}
                            >
                              {v.severity || 'BREAKING'}
                            </span>
                            <span className="font-mono text-[12px] text-[#f4f1ec]">
                              {v.path || 'schema.validation'}
                            </span>
                          </div>
                          <div className="text-[12.5px] text-[#a8a29a]">{v.message}</div>
                        </div>
                        <div className="font-mono text-[11px] text-[#6b6660] shrink-0">
                          {v.violation_type || 'SCHEMA_VIOLATION'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#4d8c35]">No violations detected. Specification is compliant.</p>
                  )}
                </div>
              )}
            </div>

            {/* Accordion Item 2: Remediation Strategy & Root Cause */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleAccordion(2)}
                className="w-full flex items-center justify-between text-left text-[14px] font-semibold text-[#f4f1ec] hover:text-[#ff6900] transition-colors"
              >
                <span>2. Remediation Strategy & Root Cause</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#a8a29a] transition-transform duration-200 ${
                    activeAccordion.includes(2) ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {activeAccordion.includes(2) && (
                <div className="mt-3 space-y-3 pl-2 border-l border-[#26221d]">
                  {rootCauses.length > 0 && (
                    <div className="p-3.5 rounded-lg bg-[#1a140e] border border-[#ff6900]/30 space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#ff6900] font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Probable Root Cause</span>
                      </div>
                      <ul className="space-y-1.5 pl-1">
                        {rootCauses.map((cause, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[13px] text-[#f4f1ec] font-mono">
                            <span className="text-[#ff6900] font-bold">›</span>
                            <span>{cause}.</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recommendedFixes.length > 0 && (
                    <div className="p-3.5 rounded-lg bg-[#0e1711] border border-[#4d8c35]/40 space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#4d8c35] font-semibold">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Recommended Actions</span>
                      </div>
                      <ul className="space-y-1.5 pl-1">
                        {recommendedFixes.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[13px] text-[#f4f1ec] font-mono">
                            <span className="text-[#4d8c35] font-bold">›</span>
                            <span>{action}.</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {impact?.summary && (
                    <div className="p-3 rounded-lg bg-[#0b0a09] border border-[#26221d] flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-[#a8a29a] shrink-0 mt-0.5" />
                      <p className="text-[12.5px] text-[#a8a29a] leading-normal font-mono">
                        {impact.summary}
                      </p>
                    </div>
                  )}

                  {rootCauses.length === 0 && recommendedFixes.length === 0 && (
                    <p className="text-[13px] text-[#4d8c35]">
                      No remediation required. All properties strictly conform to specification.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Accordion Item 3: Baseline Diff & Breaking Changes */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleAccordion(3)}
                className="w-full flex items-center justify-between text-left text-[14px] font-semibold text-[#f4f1ec] hover:text-[#ff6900] transition-colors"
              >
                <span>3. Baseline Diff & Breaking Changes</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#a8a29a] transition-transform duration-200 ${
                    activeAccordion.includes(3) ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {activeAccordion.includes(3) && (
                <div className="mt-3 space-y-2 pl-2 border-l border-[#26221d]">
                  {diff?.breaking_changes && diff.breaking_changes.length > 0 ? (
                    <div className="p-3 rounded-lg bg-[#0b0a09] border border-[#26221d] text-[13px]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[#f4f1ec]">
                          Risk Level: {diff.risk_level || 'HIGH'}
                        </span>
                        <span className="font-mono text-[11px] text-[#ff6900]">
                          {diff.breaking_change_count || diff.breaking_changes.length} breaking changes detected
                        </span>
                      </div>
                      {diff.breaking_changes.map((bc: any, i: number) => {
                        const pathText = typeof bc === 'string' ? 'diff.contract' : bc.path || 'schema';
                        const messageText = typeof bc === 'string' ? bc : bc.message || bc.description || 'Contract divergence';

                        return (
                          <div
                            key={i}
                            className="py-1.5 text-[12px] font-mono text-[#a8a29a] border-t border-[#26221d]/50 flex items-start gap-2"
                          >
                            <span className="text-[#d94a3d] font-bold">✕</span>
                            <span>
                              <strong className="text-[#f4f1ec]">{pathText}</strong>: {messageText}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-[#0b0a09] border border-[#26221d] text-[12.5px] text-[#6b6660]">
                      No baseline breaking changes detected between candidate schema and baseline contract.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* The Fix */}
        <FixCode
          patchSnippet={impact?.patch_snippet || transform?.patch_snippet || ''}
          strategy={transform?.strategy || 'schema_evolution'}
          source={transform?.source}
          target={transform?.target || (transform as any)?.target_schema}
        />
      </div>
    </section>
  );
};