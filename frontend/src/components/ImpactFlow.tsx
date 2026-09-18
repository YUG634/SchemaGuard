import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Cpu } from 'lucide-react';
import { DownstreamConsumer } from '../lib/types';
import { StrandsData } from './FixCode';

interface ImpactFlowProps {
  impactSummary?: {
    risk_level?: string;
    affected_consumers_count?: number;
    estimated_migration_hours?: number;
  } | null;
  verdict?: 'LOW' | 'MEDIUM' | 'BREAKING';
  reasons?: string[];
  downstreamRisks?: string[] | string;
  downstream?: DownstreamConsumer[];
  endpoint?: string;
  strandsData?: StrandsData | null;
}

export const ImpactFlow: React.FC<ImpactFlowProps> = ({
  impactSummary,
  verdict = 'BREAKING',
  reasons = [],
  downstreamRisks = [],
  downstream = [],
  endpoint = 'LIVE ANALYSIS',
  strandsData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredConsumerIndex, setHoveredConsumerIndex] = useState<number | null>(null);

  const animProgressRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);

  // Derive effective verdict considering AWS Strands Agent analysis
  const effectiveVerdict = useMemo(() => {
    if (strandsData?.result?.risk_level) {
      const risk = strandsData.result.risk_level.toUpperCase();
      if (risk === 'CRITICAL' || risk === 'HIGH') return 'BREAKING';
      if (risk === 'MODERATE') return 'MEDIUM';
      return 'LOW';
    }
    return verdict;
  }, [strandsData, verdict]);

  // Normalize downstreamRisks safely into a string array
  const normalizedRisks: string[] = useMemo(() => {
    if (!downstreamRisks) return [];
    if (typeof downstreamRisks === 'string') {
      return downstreamRisks
        .split(/[;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (Array.isArray(downstreamRisks)) {
      return downstreamRisks
        .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
        .filter(Boolean);
    }
    return [];
  }, [downstreamRisks]);

  // 1. Dynamic downstream consumers mapping (prioritizing AWS Strands results if present)
  const activeConsumers: DownstreamConsumer[] = useMemo(() => {
    if (strandsData?.result?.blast_radius?.affected_consumers?.length) {
      return strandsData.result.blast_radius.affected_consumers.map((name) => ({
        name,
        severity: effectiveVerdict === 'BREAKING' ? 'breaking' : 'medium',
      }));
    }

    if (Array.isArray(downstream) && downstream.length > 0) {
      return downstream;
    }

    return [];
  }, [strandsData, downstream, effectiveVerdict]);

  // 2. Active reasons list (integrating Strands risk explanation)
  const activeReasons: string[] = useMemo(() => {
    if (strandsData?.result?.blast_radius?.risk_explanation) {
      return [strandsData.result.blast_radius.risk_explanation];
    }
    if (normalizedRisks.length > 0) {
      return normalizedRisks;
    }
    if (Array.isArray(reasons) && reasons.length > 0) {
      return reasons;
    }
    return effectiveVerdict === 'BREAKING'
      ? ['Strict typed consumer decoders hit null pointers or schema validation rejection.']
      : ['Payload satisfies schema constraints; zero consumer service disruptions detected.'];
  }, [strandsData, normalizedRisks, reasons, effectiveVerdict]);

  const getColorBySeverity = (severity: 'low' | 'medium' | 'breaking') => {
    switch (severity.toLowerCase()) {
      case 'breaking':
        return '#d94a3d';
      case 'medium':
        return '#d99a2b';
      case 'low':
        return '#4d8c35';
      default:
        return '#6b6660';
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animationFrameId: number;

    const render = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const elapsed = time - startTimeRef.current;
      const totalDuration = 800;
      animProgressRef.current = Math.min(elapsed / totalDuration, 1);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = 300;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = 50;

      const numConsumers = activeConsumers.length;
      const arcRadiusX = Math.min(width * 0.42, 380);
      const arcRadiusY = 180;
      const arcStartAngle = Math.PI * 0.15;
      const arcEndAngle = Math.PI * 0.85;

      const consumerCoords = activeConsumers.map((_, i) => {
        const angle =
          numConsumers === 1
            ? Math.PI * 0.5
            : arcStartAngle + (arcEndAngle - arcStartAngle) * (i / (numConsumers - 1));
        const x = centerX + arcRadiusX * Math.cos(angle);
        const y = centerY + arcRadiusY * Math.sin(angle);
        return { x, y };
      });

      // Draw Bezier Ribbons
      activeConsumers.forEach((consumer, i) => {
        const target = consumerCoords[i];
        const isHovered = hoveredConsumerIndex === i;
        const color = getColorBySeverity(consumer.severity);

        const ribbonDelay = i * 0.08;
        const ribbonProgress = Math.max(
          0,
          Math.min((animProgressRef.current - ribbonDelay) / (1 - ribbonDelay), 1)
        );

        if (ribbonProgress > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);

          const cpX = (centerX + target.x) / 2;
          const cpY = (centerY + target.y) / 2 - 20;

          const t = ribbonProgress;
          const currentX =
            (1 - t) * (1 - t) * centerX + 2 * (1 - t) * t * cpX + t * t * target.x;
          const currentY =
            (1 - t) * (1 - t) * centerY + 2 * (1 - t) * t * cpY + t * t * target.y;

          ctx.quadraticCurveTo(
            centerX + (cpX - centerX) * t,
            centerY + (cpY - centerY) * t,
            currentX,
            currentY
          );

          ctx.strokeStyle = color;
          ctx.lineWidth = isHovered ? 6 : consumer.severity === 'breaking' ? 4.5 : 3;
          ctx.globalAlpha = isHovered
            ? 1.0
            : consumer.severity === 'breaking'
            ? 0.85
            : 0.55;
          ctx.lineCap = 'round';
          ctx.stroke();

          if (isHovered) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
            ctx.stroke();
          }
          ctx.restore();
        }
      });

      // Draw Consumer Nodes & Labels
      activeConsumers.forEach((consumer, i) => {
        const { x, y } = consumerCoords[i];
        const isHovered = hoveredConsumerIndex === i;
        const color = getColorBySeverity(consumer.severity);

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, isHovered ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (consumer.severity === 'breaking' || isHovered) {
          ctx.beginPath();
          ctx.arc(x, y, isHovered ? 14 : 11, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.globalAlpha = isHovered ? 0.4 : 0.2;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.font = `${isHovered ? '600' : '500'} 12px Inter, sans-serif`;
        ctx.fillStyle = isHovered ? '#f4f1ec' : '#a8a29a';
        ctx.textAlign = 'center';
        ctx.fillText(consumer.name, x, y + 22);

        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = color;
        ctx.fillText(consumer.severity.toUpperCase(), x, y + 36);
        ctx.restore();
      });

      // Central Node
      ctx.save();
      const isBreaking = effectiveVerdict === 'BREAKING';
      const centerColor = isBreaking ? '#d94a3d' : '#ff6900';

      ctx.beginPath();
      ctx.arc(centerX, centerY, 24, 0, Math.PI * 2);
      ctx.fillStyle = `${centerColor}22`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
      ctx.fillStyle = centerColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.font = '600 12px JetBrains Mono, monospace';
      ctx.fillStyle = '#f4f1ec';
      ctx.textAlign = 'center';
      ctx.fillText(endpoint, centerX, centerY + 28);

      ctx.restore();
      ctx.restore();

      if (animProgressRef.current < 1) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    const resizeObserver = new ResizeObserver(() => {
      startTimeRef.current = null;
      animProgressRef.current = 0;
      animationFrameId = requestAnimationFrame(render);
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [activeConsumers, hoveredConsumerIndex, effectiveVerdict, endpoint]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = rect.width;
    const centerX = width / 2;
    const centerY = 50;

    const numConsumers = activeConsumers.length;
    const arcRadiusX = Math.min(width * 0.42, 380);
    const arcRadiusY = 180;
    const arcStartAngle = Math.PI * 0.15;
    const arcEndAngle = Math.PI * 0.85;

    let foundIndex: number | null = null;
    activeConsumers.forEach((_, i) => {
      const angle =
        numConsumers === 1
          ? Math.PI * 0.5
          : arcStartAngle + (arcEndAngle - arcStartAngle) * (i / (numConsumers - 1));
      const targetX = centerX + arcRadiusX * Math.cos(angle);
      const targetY = centerY + arcRadiusY * Math.sin(angle);

      const dist = Math.hypot(x - targetX, y - targetY);
      if (dist < 32) {
        foundIndex = i;
      }
    });

    setHoveredConsumerIndex(foundIndex);
  };

  const handleMouseLeave = () => {
    setHoveredConsumerIndex(null);
  };

  const breakingCount = activeConsumers.filter((c) => c.severity === 'breaking').length;

  return (
    <div
      id="impact-section"
      className="rounded-2xl border border-[#26221d] bg-[#14120f] p-6 shadow-sm overflow-hidden"
    >
      <div className="pb-4 border-b border-[#26221d]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.08em] font-medium text-[#6b6660]">
                MOMENT 4 · CANVAS DECISION-FLOW
              </span>
              {strandsData && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#ff6900]/10 text-[#ff6900] border border-[#ff6900]/25">
                  <Cpu className="w-3 h-3" />
                  AWS STRANDS AGENT
                </span>
              )}
            </div>
            <h3 className="text-[20px] leading-[1.15] tracking-[-0.02em] font-semibold text-[#f4f1ec] mt-0.5">
              Blast Radius Impact
            </h3>
            <p className="text-[13px] leading-normal text-[#6b6660]">
              what breaks downstream if we ship this?
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c1915] border border-[#3a342c] text-[12px] font-mono shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${
                effectiveVerdict === 'BREAKING' ? 'bg-[#d94a3d]' : 'bg-[#4d8c35]'
              }`}
            />
            <span className="text-[#a8a29a]">
              Active Consumers: {activeConsumers.length}
              {breakingCount > 0 && (
                <span className="text-[#d94a3d] ml-1.5">({breakingCount} at risk)</span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full pt-4">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-75 cursor-crosshair block"
        />
      </div>

      <div className="mt-6 pt-5 border-t border-[#26221d] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-[#6b6660]">
            DOWNSTREAM BLAST VERDICT
          </div>
          <div
            className={`text-[32px] font-semibold tracking-tight ${
              effectiveVerdict === 'BREAKING'
                ? 'text-[#d94a3d]'
                : effectiveVerdict === 'MEDIUM'
                ? 'text-[#d99a2b]'
                : 'text-[#4d8c35]'
            }`}
          >
            {effectiveVerdict}
          </div>
        </div>

        <div className="flex-1 max-w-xl">
          <div className="text-[11px] uppercase tracking-[0.08em] font-mono text-[#6b6660] mb-2">
            Identified Execution Risks
          </div>
          <ul className="space-y-2 text-[13px] text-[#a8a29a]">
            {activeReasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2.5 font-mono text-[12.5px]">
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    effectiveVerdict === 'BREAKING' ? 'bg-[#d94a3d]' : 'bg-[#4d8c35]'
                  }`}
                />
                <span className={effectiveVerdict === 'BREAKING' ? 'text-[#f4f1ec]' : 'text-[#a8a29a]'}>
                  {reason}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};