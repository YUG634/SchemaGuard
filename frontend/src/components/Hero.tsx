import React, { useRef, useEffect } from 'react';
import { Lock, ArrowRight, Github, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useAppStore } from '../lib/store';

export const Hero: React.FC = () => {
  const { loadSample } = useAppStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const streakRef = useRef<HTMLDivElement>(null);

  const eyebrowRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const mockupWrapperRef = useRef<HTMLDivElement>(null);

  const targetTilt = useRef({ x: 0, y: 0 });
  const currentTilt = useRef({ x: 0, y: 0 });
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      if (eyebrowRef.current) {
        eyebrowRef.current.animate(
          [
            { opacity: 0, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          { duration: 400, delay: 100, fill: 'forwards', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
      }

      if (h1Ref.current) {
        h1Ref.current.animate(
          [
            { clipPath: 'inset(100% 0 0 0)', opacity: 0.2 },
            { clipPath: 'inset(0% 0 0 0)', opacity: 1 }
          ],
          { duration: 700, delay: 250, fill: 'forwards', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
      }

      if (subRef.current) {
        subRef.current.animate(
          [
            { opacity: 0, transform: 'translateY(10px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          { duration: 500, delay: 450, fill: 'forwards', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
      }

      if (ctaRef.current) {
        ctaRef.current.animate(
          [
            { opacity: 0, transform: 'translateY(12px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          { duration: 500, delay: 600, fill: 'forwards', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
      }

      if (mockupWrapperRef.current) {
        mockupWrapperRef.current.animate(
          [
            { opacity: 0, transform: 'translateY(24px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          { duration: 900, delay: 750, fill: 'forwards', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
      }
    }

    const updateTilt = () => {
      const factor = 0.08;
      currentTilt.current.x += (targetTilt.current.x - currentTilt.current.x) * factor;
      currentTilt.current.y += (targetTilt.current.y - currentTilt.current.y) * factor;

      if (cardRef.current) {
        cardRef.current.style.transform = `perspective(1000px) rotateX(${currentTilt.current.x.toFixed(2)}deg) rotateY(${currentTilt.current.y.toFixed(2)}deg)`;
      }

      animFrameId.current = requestAnimationFrame(updateTilt);
    };

    animFrameId.current = requestAnimationFrame(updateTilt);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const maxDegree = 2;
    const rotateY = (mouseX / (rect.width / 2)) * maxDegree;
    const rotateX = -(mouseY / (rect.height / 2)) * maxDegree;

    targetTilt.current = { x: rotateX, y: rotateY };
  };

  const handleMouseLeave = () => {
    targetTilt.current = { x: 0, y: 0 };
  };

  const handlePrimaryCTA = () => {
    loadSample();
    setTimeout(() => {
      const el = document.getElementById('workspace-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <section className="relative pt-20 pb-28 md:pt-24 md:pb-36 overflow-hidden">
      <div className="max-w-300 mx-auto px-4 sm:px-6 text-center">
        {/* Eyebrow */}
        <div
          ref={eyebrowRef}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#26221d] bg-[#14120f]/90 text-[11px] uppercase tracking-[0.08em] font-medium text-[#a8a29a] mb-6 shadow-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff6900] animate-pulse" />
          <span>Spell-check for your API contracts.</span>
        </div>

        {/* H1 */}
        <h1
          ref={h1Ref}
          className="text-[42px] sm:text-[56px] leading-[1.05] tracking-[-0.04em] font-semibold text-[#f4f1ec] max-w-3xl mx-auto"
        >
          Catch API breaks <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#f4f1ec] via-[#f4f1ec] to-[#a8a29a]">
            before production does.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          ref={subRef}
          className="mt-6 text-[15px] leading-[1.55] tracking-[-0.01em] text-[#a8a29a] max-w-lg mx-auto"
        >
          Paste a contract. Paste a payload. Get a diff, a root cause, and a ready-to-ship patch in seconds. Powered by FastAPI and an AST diagnostic agent.
        </p>

        {/* CTA row */}
        <div
          ref={ctaRef}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5"
        >
          <button
            id="hero-analyze-cta"
            type="button"
            onClick={handlePrimaryCTA}
            className="btn-primary-glow group inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-[#ff6900] hover:bg-[#ff7a1a] text-white text-[14px] font-medium transition-all duration-200"
          >
            <span>Analyze a Contract</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <a
            id="hero-github-cta"
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-[#26221d] hover:border-[#3a342c] hover:bg-[#1c1915] text-[14px] text-[#f4f1ec] font-medium transition-all"
          >
            <Github className="w-4 h-4 text-[#a8a29a]" />
            <span>View on GitHub</span>
          </a>
        </div>

        {/* MOMENT 2: 3D-Tilt Mockup Card */}
        <div
          ref={mockupWrapperRef}
          className="mt-16 sm:mt-20 max-w-225 mx-auto perspective-distant"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div
            ref={cardRef}
            className="relative rounded-2xl border border-[#26221d] bg-[#14120f] shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden transition-transform duration-75 will-change-transform text-left"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* macOS Chrome */}
            <div className="h-10 px-4 border-b border-[#26221d] bg-[#0e0c0a] flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#3a342c] border border-[#26221d]" />
                <div className="w-3 h-3 rounded-full bg-[#3a342c] border border-[#26221d]" />
                <div className="w-3 h-3 rounded-full bg-[#3a342c] border border-[#26221d]" />
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#14120f] border border-[#26221d] text-[11px] font-mono text-[#a8a29a]">
                <Lock className="w-3 h-3 text-[#6b6660]" />
                <span className="text-[#6b6660]">https://</span>
                <span className="text-[#f4f1ec]">schemaguard.dev</span>
                <span className="text-[#6b6660]">/run/a91f2</span>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#d94a3d]/15 text-[#d94a3d] border border-[#d94a3d]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d94a3d]" />
                <span>Violation</span>
              </div>
            </div>

            {/* Results Preview */}
            <div className="p-5 sm:p-7 space-y-4">
              <div className="relative rounded-xl border border-[#26221d] border-l-4 border-l-[#d94a3d] bg-[#14120f] p-4 overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-[#d94a3d]/10 via-transparent to-transparent pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.08em] font-mono text-[#a8a29a]">
                      RUN #a91f2 · 2.3s AGO
                    </div>
                    <div className="text-[18px] sm:text-[22px] font-semibold tracking-tight text-[#f4f1ec] mt-0.5">
                      This API broke its contract.
                    </div>
                    <div className="text-[12px] text-[#a8a29a]">
                      3 fields wrong · 1 missing · do not ship
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono text-[#6b6660] uppercase tracking-wider">
                      Endpoint Drift
                    </span>
                    <div className="mt-1 w-28 h-7 flex items-center">
                      <svg viewBox="0 0 100 24" className="w-full h-full overflow-visible">
                        <path
                          d="M 0,20 Q 20,20 35,16 T 70,12 T 100,4"
                          fill="none"
                          stroke="#ff6900"
                          strokeWidth="2"
                        />
                        <circle cx="100" cy="4" r="3" fill="#d94a3d" className="animate-ping" />
                        <circle cx="100" cy="4" r="2.5" fill="#d94a3d" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Rows */}
              <div className="rounded-xl border border-[#26221d] bg-[#0b0a09] overflow-hidden text-[12px] font-mono divide-y divide-[#26221d]">
                <div className="flex items-center px-3 py-2 bg-[#d94a3d]/8 border-l-2 border-l-[#d94a3d]">
                  <div className="w-8 text-[#6b6660] text-right pr-2 tabular-nums select-none">18</div>
                  <XCircle className="w-3.5 h-3.5 text-[#d94a3d] mr-2 shrink-0" />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <span className="text-[#a8a29a]">"settlement_tier": "instant"</span>
                    <span className="text-[#d94a3d] font-medium flex items-center gap-1.5">
                      undefined <span className="text-[10px] px-1 py-0.2 bg-[#d94a3d]/20 rounded text-[#d94a3d]">missing</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center px-3 py-2 bg-[#d99a2b]/8 border-l-2 border-l-[#d99a2b]">
                  <div className="w-8 text-[#6b6660] text-right pr-2 tabular-nums select-none">19</div>
                  <AlertTriangle className="w-3.5 h-3.5 text-[#d99a2b] mr-2 shrink-0" />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <span className="text-[#a8a29a]">"signature": "hmac_v1_..."</span>
                    <span className="text-[#d99a2b] flex items-center gap-1.5">
                      ["hmac_v1", "..."]
                      <span className="text-[10px] px-1 bg-[#ff6900]/15 text-[#ff6900] rounded">string → array</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center px-3 py-2">
                  <div className="w-8 text-[#6b6660] text-right pr-2 tabular-nums select-none">20</div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4d8c35] mr-2 shrink-0" />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <span className="text-[#a8a29a]">"customer_id": "cus_9934..."</span>
                    <span className="text-[#4d8c35]">"cus_9934..." ✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Streak */}
            <div className="relative h-1 w-full overflow-hidden bg-[#26221d]/40">
              <div
                ref={streakRef}
                className="animate-streak absolute top-0 bottom-0 w-48 bg-linear-to-r from-transparent via-[#ff6900] to-transparent blur-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};