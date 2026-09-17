import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Minus } from 'lucide-react';
import { Violation } from '../lib/types';

interface DiffExplorerProps {
  violations?: Violation[];
  breakingChanges?: Violation[];
  passed?: boolean;
}

export const DiffExplorer: React.FC<DiffExplorerProps> = ({
  violations = [],
  breakingChanges = [],
  passed = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'breaking' | 'warnings'>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mergedList: Violation[] = [...violations, ...breakingChanges];

  const breakingCount = mergedList.filter((d) => d.severity === 'BREAKING').length;
  const warningsCount = mergedList.filter((d) => d.severity === 'WARNING').length;

  const filteredDiffs = mergedList.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'breaking') return item.severity === 'BREAKING';
    if (filter === 'warnings') return item.severity === 'WARNING';
    return true;
  });

  const renderHighlightedCode = (text: string, isActual?: boolean) => {
    if (!text) return <span className="text-[#6b6660] italic">null</span>;

    if (text.includes('undefined') || text.includes('missing')) {
      return (
        <span className="text-[#d94a3d] italic font-mono font-medium">
          {text}{' '}
          <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-[#d94a3d]/20 text-[#d94a3d] font-normal not-italic">
            missing
          </span>
        </span>
      );
    }

    const parts = text.split(/("[^"]*":|"[^"]*"|\b\d+\b|\btrue\b|\bfalse\b|\bnull\b)/g);

    return (
      <span className="font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap break-all">
        {parts.map((part, i) => {
          if (!part) return null;
          if (/^"[^"]*":$/.test(part)) {
            return (
              <span key={i} className="text-[#f4f1ec] font-medium">
                {part}{' '}
              </span>
            );
          }
          if (/^"[^"]*"$/.test(part)) {
            return (
              <span key={i} className="text-[#62a844]">
                {part}
              </span>
            );
          }
          if (/^\d+$/.test(part)) {
            return (
              <span key={i} className="text-[#ff6900] font-semibold">
                {part}
              </span>
            );
          }
          if (part === 'null' || part === 'false' || part === 'true') {
            return (
              <span key={i} className="text-[#6b6660] italic">
                {part}
              </span>
            );
          }
          return (
            <span key={i} className="text-[#a8a29a]">
              {part}
            </span>
          );
        })}
      </span>
    );
  };

  const getStatusIcon = (severity: 'BREAKING' | 'WARNING') => {
    if (severity === 'BREAKING') {
      return <XCircle className="w-3.5 h-3.5 text-[#d94a3d] shrink-0" />;
    }
    if (severity === 'WARNING') {
      return <AlertTriangle className="w-3.5 h-3.5 text-[#d99a2b] shrink-0" />;
    }
    return <Minus className="w-3.5 h-3.5 text-[#6b6660] shrink-0" />;
  };

  const getRowClass = (severity: 'BREAKING' | 'WARNING') => {
    if (severity === 'BREAKING') {
      return 'bg-[#d94a3d]/[0.08] border-l-2 border-l-[#d94a3d]';
    }
    if (severity === 'WARNING') {
      return 'bg-[#d99a2b]/[0.08] border-l-2 border-l-[#d99a2b]';
    }
    return 'border-l-2 border-l-transparent hover:bg-[#14120f]';
  };

  if (passed && mergedList.length === 0) {
    return (
      <div className="rounded-2xl border border-[#26221d] bg-[#14120f] p-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-[#4d8c35] mx-auto mb-3" />
        <h3 className="text-[20px] font-semibold text-[#f4f1ec]">The contract holds.</h3>
        <p className="text-[13px] text-[#6b6660] mt-1 max-w-sm mx-auto">
          Every field, format constraint, and schema rule in the payload matches the specification perfectly.
        </p>
      </div>
    );
  }

  return (
    <div
      id="diff-explorer-card"
      className="rounded-2xl border border-[#26221d] bg-[#14120f] p-6 shadow-sm overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#26221d]">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-[#6b6660]">
            MOMENT 3 · MONACO-STYLE DIFF
          </div>
          <h3 className="text-[20px] leading-[1.15] tracking-[-0.02em] font-semibold text-[#f4f1ec] mt-0.5">
            The Break
          </h3>
          <p className="text-[13px] leading-normal text-[#6b6660]">
            where the promise broke
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0b0a09] border border-[#26221d]">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono tracking-wide uppercase transition-colors ${
              filter === 'all'
                ? 'bg-[#1c1915] text-[#f4f1ec] border border-[#3a342c]'
                : 'text-[#6b6660] hover:text-[#a8a29a]'
            }`}
          >
            All ({mergedList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('breaking')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono tracking-wide uppercase transition-colors ${
              filter === 'breaking'
                ? 'bg-[#d94a3d]/20 text-[#d94a3d] border border-[#d94a3d]/40'
                : 'text-[#6b6660] hover:text-[#d94a3d]'
            }`}
          >
            Breaking ({breakingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('warnings')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono tracking-wide uppercase transition-colors ${
              filter === 'warnings'
                ? 'bg-[#d99a2b]/20 text-[#d99a2b] border border-[#d99a2b]/40'
                : 'text-[#6b6660] hover:text-[#d99a2b]'
            }`}
          >
            Warnings ({warningsCount})
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-[#26221d] bg-[#0b0a09] overflow-x-auto shadow-inner">
        <div className="grid grid-cols-[40px_1fr_1fr] border-b border-[#26221d] text-[11px] font-mono select-none">
          <div className="p-2.5 text-center text-[#6b6660] bg-[#14120f]/60">
            #
          </div>
          <div className="p-2.5 px-4 bg-[#4d8c35]/6 text-[#4d8c35] border-r border-[#26221d] flex items-center justify-between">
            <span className="font-semibold">Expected · from the contract</span>
            <span className="text-[10px] text-[#4d8c35]/80">OpenAPI Spec</span>
          </div>
          <div className="p-2.5 px-4 bg-[#d94a3d]/6 text-[#d94a3d] flex items-center justify-between">
            <span className="font-semibold">Actual · from the payload</span>
            <span className="text-[10px] text-[#d94a3d]/80">Observed Output</span>
          </div>
        </div>

        <div className="divide-y divide-[#26221d]/60">
          {filteredDiffs.map((row, idx) => {
            const isBreaking = row.severity === 'BREAKING';
            const rowNumber = idx + 1;
            const violationTypeDisplay = (row.violation_type || (row as any).type || 'BREAKING_CHANGE').replace(/_/g, ' ');

            return (
              <div
                key={`${row.path || 'path'}-${row.violation_type || 'vt'}-${idx}`}
                style={{
                  ['--row-index' as any]: idx,
                }}
                className={`grid grid-cols-[40px_1fr_1fr] transition-colors ${getRowClass(
                  row.severity
                )} ${
                  mounted && isBreaking ? 'animate-row-shake' : ''
                }`}
              >
                <div className="p-3 text-right pr-2 text-[#6b6660] tabular-nums font-mono text-[11px] select-none flex flex-col items-center justify-start gap-1 pt-3.5 border-r border-[#26221d]/40 bg-[#14120f]/40">
                  <span>{rowNumber}</span>
                  {getStatusIcon(row.severity)}
                </div>

                <div className="p-3 px-4 border-r border-[#26221d]/50 font-mono text-[12.5px] leading-[1.7] overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#1c1915] text-[#a8a29a] border border-[#26221d]">
                      {row.path || 'schema.validation'}
                    </span>
                  </div>
                  <div>{renderHighlightedCode(row.expected)}</div>
                </div>

                <div className="p-3 px-4 font-mono text-[12.5px] leading-[1.7] overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10.5px] font-mono px-1.5 py-0.5 rounded border font-medium ${
                        isBreaking
                          ? 'bg-[#d94a3d]/20 text-[#d94a3d] border-[#d94a3d]/30'
                          : 'bg-[#d99a2b]/20 text-[#d99a2b] border-[#d99a2b]/30'
                      }`}
                    >
                      {violationTypeDisplay}
                    </span>
                  </div>
                  <div>{renderHighlightedCode(row.actual, true)}</div>
                  <div className="text-[11.5px] font-sans text-[#a8a29a] mt-1.5 border-t border-[#26221d]/40 pt-1">
                    {row.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
