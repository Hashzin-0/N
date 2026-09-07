'use client';

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { motion, useTransform } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useIsMobile } from '@/hooks/use-mobile';
import { MultiButton, type MultiButtonItem } from './godui/multi-button';
import {
  FolderGit2,
  Sliders,
  Sparkles,
  Layers,
  Scale,
  Calculator,
  LayoutDashboard,
  AlertTriangle,
  Eye,
  Trophy,
  Landmark,
  FileText,
  BookOpen,
  ScanSearch,
} from 'lucide-react';

interface SectionConfig {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  colorDark: string;
}

const NITROGEN_SECTIONS: SectionConfig[] = [
  { id: 'preset_selector', label: 'Cenários', shortLabel: 'Cenários', icon: FolderGit2, color: '#5A5A40', colorDark: '#9CB386' },
  { id: 'form_section', label: 'Parâmetros', shortLabel: 'Parâmetros', icon: Sliders, color: '#5A5A40', colorDark: '#9CB386' },
  { id: 'results_section', label: 'Resultados', shortLabel: 'Resultados', icon: Sparkles, color: '#2E6F40', colorDark: '#86efac' },
  { id: 'parceling_section', label: 'Parcelamento', shortLabel: 'Parcelamento', icon: Layers, color: '#D4A373', colorDark: '#D4A373' },
  { id: 'balanco_section', label: 'Balanço', shortLabel: 'Balanço', icon: Scale, color: '#2E6F40', colorDark: '#86efac' },
  { id: 'detailed_math_panel', label: 'Fórmulas', shortLabel: 'Fórmulas', icon: Calculator, color: '#8D6E63', colorDark: '#CBB5A1' },
];

const CORN_SECTIONS: SectionConfig[] = [
  { id: 'corn_yield_header', label: 'Visão Geral', shortLabel: 'Visão', icon: LayoutDashboard, color: '#C19262', colorDark: '#D4A373' },
  { id: 'corn_yield_params', label: 'Parâmetros', shortLabel: 'Parâmetros', icon: Sliders, color: '#5A5A40', colorDark: '#9CB386' },
  { id: 'corn_yield_alerts', label: 'Alertas', shortLabel: 'Alertas', icon: AlertTriangle, color: '#D4A373', colorDark: '#E0A96D' },
  { id: 'corn_yield_visual', label: 'Visual 3D', shortLabel: 'Visual', icon: Eye, color: '#C19262', colorDark: '#D4A373' },
  { id: 'corn_yield_results', label: 'Resultados', shortLabel: 'Resultados', icon: Trophy, color: '#2E6F40', colorDark: '#86efac' },
];

const ITR_SECTIONS: SectionConfig[] = [
  { id: 'itr_section', label: 'Cálculo ITR', shortLabel: 'ITR', icon: Landmark, color: '#5A5A40', colorDark: '#9CB386' },
  { id: 'itr_params_section', label: 'Parâmetros VTN', shortLabel: 'Parâmetros', icon: Sliders, color: '#5A5A40', colorDark: '#9CB386' },
  { id: 'itr_results_section', label: 'Demonstrativo', shortLabel: 'Demonstrativo', icon: FileText, color: '#2E6F40', colorDark: '#86efac' },
];

const ABNT_SECTIONS: SectionConfig[] = [
  { id: 'abnt_section', label: 'Referências ABNT', shortLabel: 'ABNT', icon: BookOpen, color: '#5A5A40', colorDark: '#9CB386' },
  { id: 'bibliography_autodetect', label: 'Detector Fontes', shortLabel: 'Detector', icon: ScanSearch, color: '#2E6F40', colorDark: '#86efac' },
];

interface SectionNavGooeyProps {
  activeTab: string;
  activeSectionIds?: string[];
  onNavigate?: (sectionId: string) => void;
}

export default React.memo(function SectionNavGooey({ activeTab, activeSectionIds, onNavigate }: SectionNavGooeyProps) {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const scrollProgressMV = useScrollProgress();
  const containerRef = useRef<HTMLDivElement>(null);
  const [fillWidth, setFillWidth] = useState(0);

  const glowX = useTransform(scrollProgressMV, (v) => `${Math.max(0, Math.min(100, v * 100))}%`);
  const glowY = useTransform(scrollProgressMV, (v) => `${Math.max(0, Math.min(100, v * 100))}%`);

  const sections = useMemo(() => {
    switch (activeTab) {
      case 'nitrogen': return NITROGEN_SECTIONS;
      case 'productivity': return CORN_SECTIONS;
      case 'itr': return ITR_SECTIONS;
      case 'abnt': return ABNT_SECTIONS;
      default: return NITROGEN_SECTIONS;
    }
  }, [activeTab]);

  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  const currentSection = useScrollSpy({
    sectionIds,
    rootMargin: '-25% 0px -45% 0px',
    threshold: 0.1,
  });

  const activeSet = useMemo(
    () => new Set(activeSectionIds ?? (currentSection ? [currentSection] : [sectionIds[0]])),
    [activeSectionIds, currentSection, sectionIds],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setFillWidth(Math.floor(rect.width));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleClick = useCallback(
    (sectionId: string) => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        onNavigate?.(sectionId);
      }
    },
    [onNavigate],
  );

  const items: MultiButtonItem[] = useMemo(
    () =>
      sections.map((config) => {
        const Icon = config.icon;
        const isActive = activeSet.has(config.id);
        const colorHex = isDark ? config.colorDark : config.color;

        return {
          id: config.id,
          icon: ({ className }: { className?: string }) => (
            <Icon
              className={`${className ?? 'size-4'} transition-transform duration-200 ${
                isActive ? 'scale-110' : 'opacity-70'
              }`}
              style={{ color: isActive ? colorHex : undefined }}
            />
          ),
          label: isMobile ? config.shortLabel : config.label,
          ariaLabel: config.label,
          onClick: () => handleClick(config.id),
        };
      }),
    [sections, isDark, isMobile, activeSet, handleClick],
  );

  const accentColor = isDark ? '#9CB386' : '#5A5A40';

  return (
    <div
      ref={containerRef}
      className={`relative ${isMobile ? 'w-full' : 'h-full flex flex-col justify-start'}`}
      role="navigation"
      aria-label="Navegação de seções"
    >
      {/* 
        3D CONTAINER SHELL (MIRRORS SELECT3D TOGGLE CONTAINER)
        Features inset shadow + accent edge highlight
      */}
      <div
        className={`relative overflow-hidden rounded-2xl p-1 transition-colors duration-200 ${
          isDark
            ? 'bg-[#151913] border border-[#2B3327] shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)]'
            : 'bg-[#F2EFE9] border border-[#E0DCD3] shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]'
        } ${isMobile ? 'w-full' : 'h-auto py-2'}`}
      >
        {/* 
          SCROLL-SYNCED GLOW INDICATOR:
          Glides across the gooey multi-select synchronized with page scroll,
          illuminating the edge and surface contour.
        */}
        {isMobile ? (
          <motion.div
            style={{ left: glowX }}
            className="absolute top-0 bottom-0 w-24 -translate-x-1/2 pointer-events-none z-0"
            aria-hidden="true"
          >
            {/* Radial glow */}
            <div
              className="w-full h-full rounded-full opacity-60"
              style={{
                background: `radial-gradient(ellipse at center, ${accentColor}55 0%, ${accentColor}15 55%, transparent 75%)`,
                filter: 'blur(8px)',
              }}
            />
            {/* Top edge highlight */}
            <div
              className="absolute top-0 left-2 right-2 h-[2px] rounded-full opacity-80"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            style={{ top: glowY }}
            className="absolute left-0 right-0 h-24 -translate-y-1/2 pointer-events-none z-0"
            aria-hidden="true"
          >
            {/* Radial glow */}
            <div
              className="w-full h-full rounded-full opacity-60"
              style={{
                background: `radial-gradient(ellipse at center, ${accentColor}55 0%, ${accentColor}15 55%, transparent 75%)`,
                filter: 'blur(8px)',
              }}
            />
            {/* Left edge highlight */}
            <div
              className="absolute top-2 bottom-2 left-0 w-[2px] rounded-full opacity-80"
              style={{
                background: `linear-gradient(180deg, transparent, ${accentColor}, transparent)`,
              }}
            />
          </motion.div>
        )}

        {/* 
          GODUI MULTI-BUTTON IN GOOEY MODE:
          Provides the liquid gooey blob animation on selection & hover.
        */}
        <div className="relative z-10">
          <MultiButton
            gooey
            variant="ghost"
            size="md"
            items={items}
            fillWidth={fillWidth > 0 ? fillWidth : undefined}
            highlightColor={accentColor}
            className={
              isMobile
                ? 'w-full justify-around !gap-1'
                : 'flex-col !rounded-xl w-full items-stretch justify-start space-y-1'
            }
          />
        </div>
      </div>
    </div>
  );
});
