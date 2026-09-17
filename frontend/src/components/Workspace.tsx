import React, { useRef } from 'react';
import { ArrowLeftRight, UploadCloud, FileCode, Check, Sparkles, RefreshCw, FileText } from 'lucide-react';
import { useAppStore } from '../lib/store';

export const Workspace: React.FC = () => {
  const {
    contractInput,
    setContractInput,
    payloadInput,
    setPayloadInput,
    contractTab,
    setContractTab,
    payloadTab,
    setPayloadTab,
    loadSample,
    analyze,
    isLoading,
    setToast,
  } = useAppStore();

  const contractFileRef = useRef<HTMLInputElement>(null);
  const payloadFileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    tabSetter: (tab: 'paste' | 'upload') => void,
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setter(text);
        tabSetter('paste');
        setToast({
          message: `Loaded ${file.name} into ${label}`,
          type: 'success',
        });
      }
    };
    reader.readAsText(file);
    // Reset file input value so the same file can be re-uploaded if needed
    e.target.value = '';
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    setter: (val: string) => void,
    tabSetter: (tab: 'paste' | 'upload') => void,
    label: string
  ) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setter(text);
        tabSetter('paste');
        setToast({
          message: `Dropped ${file.name} into ${label}`,
          type: 'success',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <section id="workspace-section" className="py-20 md:py-28 relative">
      <div className="max-w-300 mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-10 text-left">
          <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-[#6b6660]">
            STEP ①
          </div>
          <h2 className="text-[28px] sm:text-[32px] leading-[1.1] tracking-[-0.03em] font-semibold text-[#f4f1ec] mt-1.5">
            Compare what was promised to what was sent.
          </h2>
          <p className="text-[15px] leading-[1.55] tracking-[-0.01em] text-[#a8a29a] mt-1">
            Two inputs. One verdict.
          </p>
        </div>

        {/* Two-Column Grid */}
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Contract Input */}
          <div
            id="contract-panel"
            className="rounded-2xl border border-[#26221d] bg-[#14120f] p-5 shadow-sm transition-colors hover:border-[#3a342c]/70 flex flex-col min-h-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#26221d]/70 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-[14px] font-semibold text-[#f4f1ec]">
                  Contract Input
                </span>
                <span className="text-[12px] text-[#6b6660]">
                  what the API promised
                </span>
              </div>

              {/* Minimal Underline Tabs */}
              <div className="flex items-center gap-4 text-[12.5px]">
                <button
                  type="button"
                  onClick={() => setContractTab('paste')}
                  className={`pb-0.5 transition-colors ${
                    contractTab === 'paste'
                      ? 'text-[#f4f1ec] border-b-2 border-[#ff6900] font-medium'
                      : 'text-[#6b6660] hover:text-[#a8a29a]'
                  }`}
                >
                  Paste
                </button>
                <button
                  type="button"
                  onClick={() => setContractTab('upload')}
                  className={`pb-0.5 transition-colors ${
                    contractTab === 'upload'
                      ? 'text-[#f4f1ec] border-b-2 border-[#ff6900] font-medium'
                      : 'text-[#6b6660] hover:text-[#a8a29a]'
                  }`}
                >
                  Upload
                </button>
              </div>
            </div>

            {contractTab === 'paste' ? (
              <div className="flex-1 flex flex-col">
                <textarea
                  id="contract-textarea"
                  value={contractInput}
                  onChange={(e) => setContractInput(e.target.value)}
                  placeholder={`// Paste OpenAPI 3.x, JSON Schema, or Pydantic JSON\n{\n  "type": "object",\n  "required": ["amount", "currency", "settlement_tier"],\n  "properties": { ... }\n}`}
                  className="w-full flex-1 min-h-65 bg-[#0b0a09] border border-[#26221d] rounded-lg p-3.5 font-mono text-[12.5px] leading-[1.7] text-[#f4f1ec] placeholder-[#6b6660] focus:outline-none focus:ring-1 focus:ring-[#ff6900] focus:border-[#ff6900] resize-y"
                  spellCheck={false}
                />
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#6b6660]">
                  <span>Supports OpenAPI 3.0/3.1, JSON Schema, Swagger</span>
                  <span>{contractInput ? `${contractInput.length} chars` : 'Empty'}</span>
                </div>
              </div>
            ) : (
              <div
                onDrop={(e) => handleDrop(e, setContractInput, setContractTab, 'Contract')}
                onDragOver={handleDragOver}
                onClick={() => contractFileRef.current?.click()}
                className="flex-1 min-h-65 border border-dashed border-[#3a342c] hover:border-[#ff6900]/60 rounded-lg bg-[#0b0a09]/50 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors group"
              >
                <input
                  ref={contractFileRef}
                  type="file"
                  accept=".json,.yaml,.yml,.txt"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, setContractInput, setContractTab, 'Contract')}
                />
                <div className="w-12 h-12 rounded-full bg-[#14120f] border border-[#26221d] flex items-center justify-center text-[#ff6900] mb-3 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-[13px] font-medium text-[#f4f1ec]">
                  Drop .json or .yaml schema file here
                </div>
                <div className="text-[11px] text-[#6b6660] mt-1">
                  Or click to browse from local filesystem
                </div>
              </div>
            )}
          </div>

          {/* Centered Decorative Connector Icon (Desktop only) */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-[#14120f] border border-[#26221d] items-center justify-center text-[#6b6660] shadow-md pointer-events-none">
            <ArrowLeftRight className="w-4 h-4" />
          </div>

          {/* Right: Payload Input */}
          <div
            id="payload-panel"
            className="rounded-2xl border border-[#26221d] bg-[#14120f] p-5 shadow-sm transition-colors hover:border-[#3a342c]/70 flex flex-col min-h-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#26221d]/70 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-[14px] font-semibold text-[#f4f1ec]">
                  Payload Input
                </span>
                <span className="text-[12px] text-[#6b6660]">
                  what the API actually sent
                </span>
              </div>

              {/* Minimal Underline Tabs */}
              <div className="flex items-center gap-4 text-[12.5px]">
                <button
                  type="button"
                  onClick={() => setPayloadTab('paste')}
                  className={`pb-0.5 transition-colors ${
                    payloadTab === 'paste'
                      ? 'text-[#f4f1ec] border-b-2 border-[#ff6900] font-medium'
                      : 'text-[#6b6660] hover:text-[#a8a29a]'
                  }`}
                >
                  Paste
                </button>
                <button
                  type="button"
                  onClick={() => setPayloadTab('upload')}
                  className={`pb-0.5 transition-colors ${
                    payloadTab === 'upload'
                      ? 'text-[#f4f1ec] border-b-2 border-[#ff6900] font-medium'
                      : 'text-[#6b6660] hover:text-[#a8a29a]'
                  }`}
                >
                  Upload
                </button>
              </div>
            </div>

            {payloadTab === 'paste' ? (
              <div className="flex-1 flex flex-col">
                <textarea
                  id="payload-textarea"
                  value={payloadInput}
                  onChange={(e) => setPayloadInput(e.target.value)}
                  placeholder={`// Paste response JSON or request body\n{\n  "amount": "4950",\n  "currency": "USD",\n  "signature": ["hmac_v1", "..."]\n}`}
                  className="w-full flex-1 min-h-65 bg-[#0b0a09] border border-[#26221d] rounded-lg p-3.5 font-mono text-[12.5px] leading-[1.7] text-[#f4f1ec] placeholder-[#6b6660] focus:outline-none focus:ring-1 focus:ring-[#ff6900] focus:border-[#ff6900] resize-y"
                  spellCheck={false}
                />
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#6b6660]">
                  <span>Raw JSON / REST response body</span>
                  <span>{payloadInput ? `${payloadInput.length} chars` : 'Empty'}</span>
                </div>
              </div>
            ) : (
              <div
                onDrop={(e) => handleDrop(e, setPayloadInput, setPayloadTab, 'Payload')}
                onDragOver={handleDragOver}
                onClick={() => payloadFileRef.current?.click()}
                className="flex-1 min-h-65 border border-dashed border-[#3a342c] hover:border-[#ff6900]/60 rounded-lg bg-[#0b0a09]/50 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors group"
              >
                <input
                  ref={payloadFileRef}
                  type="file"
                  accept=".json,.txt"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, setPayloadInput, setPayloadTab, 'Payload')}
                />
                <div className="w-12 h-12 rounded-full bg-[#14120f] border border-[#26221d] flex items-center justify-center text-[#ff6900] mb-3 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-[13px] font-medium text-[#f4f1ec]">
                  Drop .json response payload here
                </div>
                <div className="text-[11px] text-[#6b6660] mt-1">
                  Or click to browse from local filesystem
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Row below grid */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="load-sample-btn"
              type="button"
              onClick={loadSample}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#26221d] hover:border-[#3a342c] hover:bg-[#1c1915] text-[13px] text-[#a8a29a] hover:text-[#f4f1ec] transition-colors"
            >
              <FileCode className="w-4 h-4 text-[#ff6900]" />
              <span>Load Sample (Payment API Break)</span>
            </button>
            <span className="hidden sm:inline text-[11px] text-[#6b6660]">
              Populates realistic OpenAPI spec + failing payload
            </span>
          </div>

          <div className="w-full sm:w-auto">
            <button
              id="analyze-schema-btn"
              type="button"
              disabled={isLoading}
              onClick={analyze}
              className={`w-full sm:w-auto btn-primary-glow inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-full bg-[#ff6900] hover:bg-[#ff7a1a] text-white text-[14px] font-medium transition-all duration-300 disabled:opacity-80 disabled:cursor-not-allowed ${
                isLoading ? 'min-w-45' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validating AST...</span>
                </>
              ) : (
                <>
                  <span>Analyze Schema</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
