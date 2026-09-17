import React from 'react';
import { ShieldCheck, Github, Sparkles } from 'lucide-react';
import { useAppStore } from '../lib/store';

export const Nav: React.FC = () => {
  const { setView, result, setToast } = useAppStore();

  const scrollToSection = (id: string, requiresResult: boolean = false) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (requiresResult && !result) {
      // If result section is not yet mounted, guide user to workspace
      document.getElementById('workspace-section')?.scrollIntoView({ behavior: 'smooth' });
      setToast({
        message: 'Run an analysis to inspect this section.',
        type: 'info',
      });
    } else {
      document.getElementById('workspace-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      id="main-nav"
      className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#0b0a09]/80 border-b border-[#26221d] transition-colors"
    >
      <div className="max-w-300 mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <button
          id="nav-logo-btn"
          type="button"
          onClick={() => {
            setView('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 group text-left focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-[#14120f] border border-[#26221d] flex items-center justify-center group-hover:border-[#ff6900]/40 transition-colors shadow-sm">
            <ShieldCheck className="w-4 h-4 text-[#ff6900]" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold tracking-tight text-[15px] text-[#f4f1ec] leading-none">
              SchemaGuard
            </span>
            <span className="text-[10px] text-[#6b6660] font-mono tracking-wider">
              v1.4·PROD
            </span>
          </div>
        </button>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-7">
          <button
            type="button"
            onClick={() => scrollToSection('workspace-section')}
            className="text-[13px] text-[#a8a29a] hover:text-[#f4f1ec] transition-colors"
          >
            Product
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('root-cause-section', true)}
            className="text-[13px] text-[#a8a29a] hover:text-[#f4f1ec] transition-colors"
          >
            Docs & Specs
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('impact-section', true)}
            className="text-[13px] text-[#a8a29a] hover:text-[#f4f1ec] transition-colors"
          >
            Blast Radius
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('drift-section', true)}
            className="text-[13px] text-[#a8a29a] hover:text-[#f4f1ec] transition-colors flex items-center gap-1.5"
          >
            Changelog
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff6900]" />
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <a
            id="nav-github-link"
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#26221d] hover:border-[#3a342c] hover:bg-[#1c1915] text-[13px] text-[#a8a29a] hover:text-[#f4f1ec] transition-all"
          >
            <Github className="w-3.5 h-3.5" />
            <span>Star on GitHub</span>
            <span className="px-1.5 py-0.5 text-[11px] font-mono bg-[#14120f] border border-[#26221d] rounded text-[#6b6660]">
              1.2k
            </span>
          </a>

          <button
            id="nav-try-now-btn"
            type="button"
            onClick={() => scrollToSection('workspace-section')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#ff6900] hover:bg-[#ff7a1a] text-white text-[12.5px] font-medium transition-all shadow-[0_0_16px_rgba(255,105,0,0.25)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyze</span>
          </button>
        </div>
      </div>
    </header>
  );
};
