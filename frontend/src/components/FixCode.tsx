import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Copy, Download, Check, ArrowUpRight } from 'lucide-react';
import { useAppStore } from '../lib/store';

interface FixCodeProps {
  patchSnippet?: string;
  strategy?: string;
  source?: string;
  target?: string;
}

const schemaGuardTheme: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: '#f4f1ec',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '12.5px',
    lineHeight: '1.7',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    tabSize: 4,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#f4f1ec',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '12.5px',
    lineHeight: '1.7',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    tabSize: 4,
    hyphens: 'none',
    padding: '1.25rem',
    margin: 0,
    overflow: 'auto',
    background: '#0b0a09',
  },
  comment: { color: '#6b6660', fontStyle: 'italic' },
  punctuation: { color: '#a8a29a' },
  property: { color: '#f4f1ec' },
  tag: { color: '#ff6900' },
  boolean: { color: '#ff6900' },
  number: { color: '#ff6900', fontWeight: '500' },
  constant: { color: '#ff6900' },
  symbol: { color: '#ff6900' },
  deleted: { color: '#d94a3d', backgroundColor: 'rgba(217,74,61,0.1)' },
  inserted: { color: '#4d8c35', backgroundColor: 'rgba(77,140,53,0.1)' },
  string: { color: '#4d8c35' },
  builtin: { color: '#f4f1ec', fontWeight: '500' },
  operator: { color: '#a8a29a' },
  keyword: { color: '#ff6900', fontWeight: '600' },
  function: { color: '#f4f1ec', fontWeight: '500' },
  'class-name': { color: '#f4f1ec', fontWeight: '600' },
};

export const FixCode: React.FC<FixCodeProps> = ({
  patchSnippet = '',
  strategy = 'schema_evolution',
  source,
  target,
}) => {
  const [activeTab, setActiveTab] = useState<'patch' | 'target'>('patch');
  const [copied, setCopied] = useState(false);
  const { setToast, applyPatchToContract } = useAppStore();

  const trimmed = patchSnippet.trim();
  const isJson = trimmed.startsWith('{') || trimmed.startsWith('[');
  const isDiff = trimmed.includes('---') || trimmed.includes('+++') || trimmed.includes('@@');
  const isPython = trimmed.includes('from pydantic') || trimmed.includes('class ') || trimmed.includes('import ');

  let formattedCode = patchSnippet;
  if (isJson) {
    try {
      formattedCode = JSON.stringify(JSON.parse(patchSnippet), null, 2);
    } catch {
      formattedCode = patchSnippet;
    }
  }

  if (typeof formattedCode === 'string') {
    formattedCode = formattedCode.replace(/\\n/g, '\n').replace(/\\t/g, '    ');
  }

  const getActiveCode = () => {
    if (activeTab === 'target' && target) {
      return {
        code: target,
        lang: 'json',
        filename: 'contract.v2.json',
      };
    }

    if (isPython) {
      return {
        code: formattedCode,
        lang: 'python',
        filename: 'models.py',
      };
    }

    if (isDiff) {
      return {
        code: formattedCode,
        lang: 'diff',
        filename: 'schema_patch.diff',
      };
    }

    if (isJson) {
      return {
        code: formattedCode,
        lang: 'json',
        filename: 'patch_snippet.json',
      };
    }

    return {
      code: formattedCode,
      lang: 'python',
      filename: 'models.py',
    };
  };

  const { code, lang, filename } = getActiveCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setToast({
      message: `Copied ${filename} to clipboard`,
      type: 'success',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({
      message: `Downloaded ${filename}`,
      type: 'info',
    });
  };

  const handleApply = () => {
    if (code.includes('No patch required')) {
      setToast({
        message: 'Contract is already aligned with the payload.',
        type: 'info',
      });
      return;
    }
    const patchToApply = activeTab === 'target' && target ? target : code;
    applyPatchToContract(patchToApply);
  };

  return (
    <div
      id="the-fix-section"
      className="rounded-2xl border border-[#26221d] bg-[#14120f] p-6 shadow-sm overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#26221d]">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-[#6b6660]">
            AUTOMATIC REMEDIATION · {strategy.replace(/_/g, ' ').toUpperCase()}
          </div>
          <h3 className="text-[20px] leading-[1.15] tracking-[-0.02em] font-semibold text-[#f4f1ec] mt-0.5">
            The Fix
          </h3>
          <p className="text-[13px] leading-normal text-[#6b6660]">
            paste this into your backend or OpenAPI schema
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0b0a09] border border-[#26221d]">
          <button
            type="button"
            onClick={() => setActiveTab('patch')}
            className={`px-3 py-1.5 rounded text-[12px] font-mono transition-colors ${
              activeTab === 'patch'
                ? 'bg-[#1c1915] text-[#f4f1ec] border border-[#3a342c]'
                : 'text-[#6b6660] hover:text-[#a8a29a]'
            }`}
          >
            {filename}
          </button>
          {target && (
            <button
              type="button"
              onClick={() => setActiveTab('target')}
              className={`px-3 py-1.5 rounded text-[12px] font-mono transition-colors ${
                activeTab === 'target'
                  ? 'bg-[#1c1915] text-[#f4f1ec] border border-[#3a342c]'
                  : 'text-[#6b6660] hover:text-[#a8a29a]'
              }`}
            >
              Target Schema
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-[#26221d] bg-[#0b0a09] overflow-hidden shadow-inner">
        <div className="px-4 py-2 border-b border-[#26221d] bg-[#14120f] flex items-center justify-between text-[11px] font-mono text-[#6b6660]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4d8c35]" />
            <span className="text-[#f4f1ec]">{filename}</span>
            <span>· Python (Pydantic v2)</span>
          </div>
          <span>UTF-8 · Ready to commit</span>
        </div>
        <div className="max-h-90 overflow-auto">
          <SyntaxHighlighter
            language={lang}
            style={schemaGuardTheme}
            customStyle={{
              background: '#0b0a09',
              margin: 0,
              padding: '1.25rem',
              fontSize: '12.5px',
              lineHeight: '1.7',
              fontFamily: 'JetBrains Mono, monospace',
              whiteSpace: 'pre',
            }}
          >
            {code || '# No patch required: payload and contract are aligned.'}
          </SyntaxHighlighter>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-[#26221d] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            id="copy-fix-btn"
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#26221d] hover:border-[#3a342c] hover:bg-[#1c1915] text-[13px] text-[#a8a29a] hover:text-[#f4f1ec] transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#4d8c35]" />
                <span className="text-[#4d8c35]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            id="download-patch-btn"
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#26221d] hover:border-[#3a342c] hover:bg-[#1c1915] text-[13px] text-[#a8a29a] hover:text-[#f4f1ec] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {filename}</span>
          </button>
        </div>

        <button
          id="apply-to-contract-btn"
          type="button"
          onClick={handleApply}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff6900]/15 hover:bg-[#ff6900]/25 border border-[#ff6900]/30 text-[13px] font-medium text-[#ff6900] transition-all"
        >
          <span>Apply to Contract</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};