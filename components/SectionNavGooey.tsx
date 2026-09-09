'use client';

import React, { useMemo, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { useScrollSpy } from '@/hooks/useScrollSpy';
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
  Search,
  Globe,
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

const PESQUISADOR_SECTIONS: SectionConfig[] = [
  { id: 'pesquisador_fontes', label: 'Pesquisador de Fontes', shortLabel: 'Fontes', icon: Search, color: '#2E6F40', colorDark: '#86efac' },
  { id: 'pesquisador_portais', label: 'Portais Confiáveis', shortLabel: 'Portais', icon: Globe, color: '#D4A373', colorDark: '#D4A373' },
  { id: 'pesquisador_automatico', label: 'Pesquisador Automático', shortLabel: 'Artigo ABNT', icon: Sparkles, color: '#5A5A40', colorDark: '#9CB386' },
];

interface SectionNavGooeyProps {
  activeTab: string;
  activeSectionIds?: string[];
  onNavigate?: (sectionId: string) => void;
}

export default React.memo(function SectionNavGooey({ activeTab, activeSectionIds, onNavigate }: SectionNavGooeyProps) {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  const sections = useMemo(() => {
    switch (activeTab) {
      case 'nitrogen': return NITROGEN_SECTIONS;
      case 'productivity': return CORN_SECTIONS;
      case 'itr': return ITR_SECTIONS;
      case 'abnt': return ABNT_SECTIONS;
      case 'pesquisador': return PESQUISADOR_SECTIONS;
      default: return NITROGEN_SECTIONS;
    }
  }, [activeTab]);

  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  const currentSection = useScrollSpy({
    sectionIds,
  });

  const selectedSectionId = useMemo(() => {
    if (activeSectionIds && activeSectionIds.length > 0) {
      return activeSectionIds[0];
    }
    return currentSection ?? sectionIds[0];
  }, [activeSectionIds, currentSection, sectionIds]);

  const handleClick = useCallback(
    (sectionId: string) => {
      const el = document.getElementById(sectionId);
      if (el) {
        const headerOffset = 80;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
        onNavigate?.(sectionId);
      }
    },
    [onNavigate],
  );

  const items: MultiButtonItem[] = useMemo(
    () =>
      sections.map((config) => {
        const Icon = config.icon;
        const isSelected = selectedSectionId === config.id;
        const colorHex = isDark ? config.colorDark : config.color;

        return {
          id: config.id,
          icon: ({ className }: { className?: string }) => (
            <Icon
              className={`${className ?? 'size-4'} transition-transform duration-200 ${
                isSelected ? 'scale-110' : 'opacity-70'
              }`}
              style={{ color: isSelected ? colorHex : undefined }}
            />
          ),
          label: isMobile ? config.shortLabel : config.label,
          ariaLabel: config.label,
          onClick: () => handleClick(config.id),
        };
      }),
    [sections, isDark, isMobile, selectedSectionId, handleClick],
  );

  const accentColor = isDark ? '#9CB386' : '#2E6F40';

  // Motion value for real-time scroll progress (0 to 1)
  const scrollProgress = useMotionValue(0);

  // Smooth spring physics for silky fluid motion without lag or stutter
  const smoothProgress = useSpring(scrollProgress, {
    stiffness: 130,
    damping: 24,
    mass: 0.15,
  });

  // Calculate sliding glow position across the top border (with safe margin for rounded corners)
  const glowLeft = useTransform(
    smoothProgress,
    (p) => `calc(8px + ${Math.max(0, Math.min(1, p))} * (100% - 16px))`
  );

  // Progressive illuminated trail width behind the moving glow
  const trailWidth = useTransform(
    smoothProgress,
    (p) => `${Math.max(0, Math.min(1, p)) * 100}%`
  );

  // Continuously synchronize scroll progress with page scroll through the active sections
  useEffect(() => {
    let rafId: number | null = null;

    const updateScrollProgress = () => {
      if (typeof window === 'undefined') return;

      const firstEl = sectionIds[0] ? document.getElementById(sectionIds[0]) : null;
      const lastEl = sectionIds[sectionIds.length - 1]
        ? document.getElementById(sectionIds[sectionIds.length - 1])
        : null;

      if (firstEl && lastEl) {
        const firstRect = firstEl.getBoundingClientRect();
        const lastRect = lastEl.getBoundingClientRect();
        const firstTop = window.pageYOffset + firstRect.top - 120;
        const lastBottom = window.pageYOffset + lastRect.bottom - window.innerHeight * 0.7;
        const distance = Math.max(100, lastBottom - firstTop);
        const current = window.pageYOffset - firstTop;
        const rawProgress = Math.min(1, Math.max(0, current / distance));
        scrollProgress.set(rawProgress);
        return;
      }

      // Fallback: entire page scroll progress
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const docProgress = maxScroll > 0 ? Math.min(1, Math.max(0, window.pageYOffset / maxScroll)) : 0;
      scrollProgress.set(docProgress);
    };

    const handleScrollOrResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateScrollProgress);
    };

    handleScrollOrResize();
    const timeoutId = setTimeout(handleScrollOrResize, 250);

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
      clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [sectionIds, scrollProgress]);

  return (
    <div
      className={`relative ${isMobile ? 'w-full flex flex-col items-center pt-2.5 pb-1' : 'h-full flex flex-col justify-start pt-2.5 pb-2'}`}
      role="navigation"
      aria-label="Navegação de seções"
    >
      {/* 
        TOP BORDER SCROLL-SYNCED GLOW:
        Borda superior com glow radiante que desliza suavemente da esquerda para a direita,
        acompanhando a sincronização em tempo real do scroll ao longo das seções.
      */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none z-30 overflow-visible"
        aria-hidden="true"
      >
        {/* Base border track */}
        <div className="w-full h-full bg-[#4A4A30]/30 dark:bg-white/10 rounded-full relative overflow-hidden">
          {/* Illuminated trail line trailing behind the sliding glow */}
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-transparent via-[#2E6F40]/50 to-[#86efac] dark:via-[#9CB386]/50 dark:to-[#86efac]"
            style={{ width: trailWidth }}
          />
        </div>

        {/* Sliding Glow Beam & Flare */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none flex items-center justify-center"
          style={{ left: glowLeft }}
        >
          {/* Ambient radial blur/halo casting light above and below the top border */}
          <div
            className="absolute w-24 sm:w-36 h-7 rounded-full blur-md opacity-85 pointer-events-none"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse at center, rgba(134, 239, 172, 0.85) 0%, rgba(74, 222, 128, 0.45) 45%, rgba(46, 111, 64, 0) 75%)'
                : 'radial-gradient(ellipse at center, rgba(134, 239, 172, 0.95) 0%, rgba(46, 111, 64, 0.5) 45%, rgba(212, 163, 115, 0) 75%)',
            }}
          />

          {/* Luminous elongated beam with high-contrast core */}
          <div
            className="w-14 sm:w-20 h-[3px] rounded-full"
            style={{
              background: isDark
                ? 'linear-gradient(90deg, transparent, rgba(134, 239, 172, 0.9) 30%, #ffffff 50%, rgba(134, 239, 172, 0.9) 70%, transparent)'
                : 'linear-gradient(90deg, transparent, rgba(74, 222, 128, 0.9) 30%, #ffffff 50%, rgba(74, 222, 128, 0.9) 70%, transparent)',
              boxShadow: isDark
                ? '0 0 10px #86efac, 0 0 20px rgba(74, 222, 128, 0.6)'
                : '0 0 10px #4ade80, 0 0 18px rgba(46, 111, 64, 0.5)',
            }}
          />

          {/* Core bright specular sparkle point */}
          <div
            className="absolute w-2 h-2 rounded-full bg-white"
            style={{
              boxShadow: '0 0 6px #ffffff, 0 0 12px #86efac, 0 0 20px #4ade80',
            }}
          />
        </motion.div>
      </div>

      {/* 
        INSET GOOEY CARD CONTAINER:
        - Preserves the exact fluid capsule / pill contour ("mantendo o formato gooey do card, o formato atual")
        - Inset well recessed into #app_header surface (darker cavity tone + subtle inner shadow)
        - Crisp edge highlight and borders reinforcing visual depth
      */}
      <div className={`relative z-10 flex ${isMobile ? 'justify-center max-w-full overflow-x-auto scrollbar-none px-1 py-1' : 'w-full py-1'}`}>
        <MultiButton
          gooey
          variant="secondary"
          size="md"
          items={items}
          selectedId={selectedSectionId}
          highlightColor={accentColor}
          enable3d
          inset
          isDark={isDark}
          edgeColor={accentColor}
          cardFill={isDark ? '#151813' : '#F9F8F6'}
          className={
            isMobile
              ? 'justify-center !gap-0 overflow-visible'
              : 'flex-col w-full items-stretch justify-start space-y-1'
          }
        />
      </div>
    </div>
  );
});

