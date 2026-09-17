import { create } from 'zustand';
import { View, AnalysisResult } from './types';
import { SAMPLE_CONTRACT, SAMPLE_PAYLOAD, mockAnalysis } from './demo';
import { runAnalysis } from './analyze';

interface AppState {
  view: View;
  contractInput: string;
  payloadInput: string;
  contractTab: 'paste' | 'upload';
  payloadTab: 'paste' | 'upload';
  isLoading: boolean;
  result: AnalysisResult | null;
  diffFilter: 'all' | 'errors' | 'warnings' | 'missing';
  toast: { message: string; type?: 'info' | 'success' | 'warning' | 'error' } | null;
  isBackendOffline: boolean;

  // Actions
  setView: (view: View) => void;
  setContractInput: (val: string) => void;
  setPayloadInput: (val: string) => void;
  setContractTab: (tab: 'paste' | 'upload') => void;
  setPayloadTab: (tab: 'paste' | 'upload') => void;
  setDiffFilter: (filter: 'all' | 'errors' | 'warnings' | 'missing') => void;
  setToast: (toast: { message: string; type?: 'info' | 'success' | 'warning' | 'error' } | null) => void;
  loadSample: () => void;
  analyze: () => Promise<void>;
  reset: () => void;
  applyPatchToContract: (patchCode: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  view: 'landing',
  contractInput: '',
  payloadInput: '',
  contractTab: 'paste',
  payloadTab: 'paste',
  isLoading: false,
  result: null,
  diffFilter: 'all',
  toast: null,
  isBackendOffline: false,

  setView: (view) => set({ view }),
  setContractInput: (contractInput) => set({ contractInput }),
  setPayloadInput: (payloadInput) => set({ payloadInput }),
  setContractTab: (contractTab) => set({ contractTab }),
  setPayloadTab: (payloadTab) => set({ payloadTab }),
  setDiffFilter: (diffFilter) => set({ diffFilter }),
  setToast: (toast) => {
    set({ toast });
    if (toast) {
      setTimeout(() => {
        if (get().toast?.message === toast.message) {
          set({ toast: null });
        }
      }, 4000);
    }
  },

  loadSample: () => {
    set({
      contractInput: SAMPLE_CONTRACT,
      payloadInput: SAMPLE_PAYLOAD,
      contractTab: 'paste',
      payloadTab: 'paste',
      result: null,
      view: 'workspace',
    });
    get().setToast({
      message: 'Sample payment contract & breaking payload loaded.',
      type: 'info',
    });
  },

  reset: () => {
    set({
      view: 'workspace',
      result: null,
    });
  },

  applyPatchToContract: (patchCode: string) => {
    const { payloadInput } = get();
    let finalContract = patchCode;

    // If the patch is Python (models.py) or non-JSON, convert payload into valid JSON Schema
    const trimmed = patchCode.trim();
    const isJson = trimmed.startsWith('{') || trimmed.startsWith('[');

    if (!isJson && payloadInput) {
      try {
        const parsed = JSON.parse(payloadInput);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const properties: Record<string, any> = {};
          const required: string[] = [];

          Object.entries(parsed).forEach(([key, val]) => {
            required.push(key);
            if (val === null) properties[key] = { type: ['string', 'null'] };
            else if (Array.isArray(val)) properties[key] = { type: 'array' };
            else if (typeof val === 'number') properties[key] = { type: Number.isInteger(val) ? 'integer' : 'number' };
            else if (typeof val === 'boolean') properties[key] = { type: 'boolean' };
            else if (typeof val === 'object') properties[key] = { type: 'object' };
            else properties[key] = { type: 'string' };
          });

          finalContract = JSON.stringify(
            {
              type: 'object',
              properties,
              required,
            },
            null,
            2
          );
        }
      } catch {
        finalContract = patchCode;
      }
    }

    set({
      contractInput: finalContract,
      contractTab: 'paste',
      view: 'workspace',
      result: null,
    });

    get().setToast({
      message: 'Contract evolved to match payload. Click Analyze Schema to verify.',
      type: 'success',
    });

    setTimeout(() => {
      const el = document.getElementById('workspace-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  },

  analyze: async () => {
    const { contractInput, payloadInput } = get();
    set({ isLoading: true });

    const activeContract = contractInput.trim() || SAMPLE_CONTRACT;
    const activePayload = payloadInput.trim() || SAMPLE_PAYLOAD;

    if (!contractInput.trim() || !payloadInput.trim()) {
      set({
        contractInput: activeContract,
        payloadInput: activePayload,
      });
    }

    try {
      // Call the centralized client hitting Render rather than a local /api route
      const data = await runAnalysis({
        contract: activeContract,
        payload: activePayload,
      });

      const isMock = data.source === 'mock';

      set({
        result: data,
        isLoading: false,
        view: 'results',
        isBackendOffline: isMock,
      });

      if (isMock) {
        get().setToast({
          message: 'Backend offline — showing demo data',
          type: 'warning',
        });
      }
    } catch (err) {
      console.warn('Analysis execution error:', err);
      const randomRunId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID().slice(0, 6)
          : Math.random().toString(36).substring(2, 8);

      const fallbackResult: AnalysisResult = {
        ...mockAnalysis,
        run_id: randomRunId,
        timestamp: Date.now(),
        source: 'mock',
      };

      set({
        result: fallbackResult,
        isLoading: false,
        view: 'results',
        isBackendOffline: true,
      });
      get().setToast({
        message: 'Backend offline — showing demo data',
        type: 'warning',
      });
    }

    setTimeout(() => {
      const resultsEl = document.getElementById('results-section');
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  },
}));