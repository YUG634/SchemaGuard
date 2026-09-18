import React, { useEffect } from 'react';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Workspace } from './components/Workspace';
import { Results } from './components/Results';
import { Toast } from './components/Toast';
import { useAppStore } from './lib/store';
import { ShieldCheck, ArrowUpRight, Terminal, Github, Heart } from 'lucide-react';

export default function App() {
  const { result, view, loadSample } = useAppStore();

  return (
    <div className="relative min-h-screen bg-[#0b0a09] text-[#f4f1ec] selection:bg-[#ff6900]/30 selection:text-[#f4f1ec]">
      {/* MOMENT 1 — AMBIENT GRID BACKDROP (1px lines every 48px, fading to transparent via mask) */}
      <div
        id="ambient-grid-backdrop"
        className="pointer-events-none fixed inset-0 z-0 ambient-grid opacity-75"
      />

      {/* Top subtle orange glow spotlight */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-175 h-87.5 bg-linear-to-b from-[#ff6900]/[0.07] to-transparent blur-3xl" />

      {/* Navigation */}
      <Nav />

      {/* Main Content Sections */}
      <main className="relative z-10">
        {/* Section 2: Hero */}
        <Hero />

        {/* Section 3: Workspace */}
        <Workspace />

        {/* Section 4: Results (rendered when analysis run exists) */}
        {result && <Results />}
      </main>

      {/* Toast Notification container */}
      <Toast />

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#26221d] py-16 mt-20 bg-[#0b0a09]/95 text-[#6b6660] text-[13px]">
        <div className="max-w-300 mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-12 border-b border-[#26221d]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#14120f] border border-[#26221d] flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#ff6900]" />
                </div>
                <span className="font-semibold text-[15px] text-[#f4f1ec]">
                  SchemaGuard
                </span>
              </div>
              <p className="text-[13px] text-[#a8a29a] max-w-sm">
                Spell-check for your API contracts. Built for modern engineering teams preventing contract drift.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3 text-[13px]">
              <a
                href="#workspace-section"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('workspace-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-[#f4f1ec] transition-colors"
              >
                Try Validator
              </a>
              <a
                href="#sample"
                onClick={(e) => {
                  e.preventDefault();
                  loadSample();
                  document.getElementById('workspace-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-[#f4f1ec] transition-colors"
              >
                Load Demo Spec
              </a>
              <a
                href="https://github.com/YUG634/SchemaGuard"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#f4f1ec] transition-colors flex items-center gap-1"
              >
                GitHub <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] font-mono">
            <div>© {new Date().getFullYear()} SchemaGuard Inc. All rights reserved.</div>
            <div className="flex items-center gap-4 text-[#6b6660]">
              <span>FastAPI + AWS Strands</span>
              <span>·</span>
              <span>OpenAPI 3.1 Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
