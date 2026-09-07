'use client';

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { motion, useTransform } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useIsMobile } from '@/hooks/use-mobile';
import { MultiButton, type MultiButtonItem } from './godui/multi-button';
import NavSvgIcon from './NavSvgIcon';

interface SectionConfig {
  id: string;
  label: string;
  shortLabel: string;
  geometry: 'dodecahedron' | 'box' | 'octahedron' | 'torusknot' | 'icosahedron' | 'cone' | 'torus' | 'sphere' | 'cylinder';
  color: string;
  colorDark: string;
}

const NITROGEN_SECTIONS: SectionConfig[] = [
  { id: 'preset_selector', label: 'Cenários', shortLabel: 'Cenários', geometry: 'dodecahedron', color: '#5A5A40', colorDark: '#9CB386' },
  { id: 'form_section', label: 'Parâmetros', shortLabel: 'Parâmetros', geometry: 'box', color: '#5A5A40', colorDark: '#9CB386' },
  { id: 'results_section', label: 'Resultados', shortLabel: 'Resultados', geometry: 'octahedron', color: '#2E6F40', colorDark: '#86efac' },
  { id: 'parceling_section', label: 'Parcelamento', shortLabel: 'Parcelamento', geometry: 'torusknot', color: '#D4A373', colorDark: '#D4A373' },
  { id: 'balanco_section', label: 'Balanço', shortLabel: 'Balanço', geometry: 'octahedron', color: '#2E6F40', colorDark: '#86efac' },
  { id: 'detailed_math_panel', label: 'Fórmulas', shortLabel: 'Fórmulas', geometry: 'icosahedron', color: '#8D6E63', colorDark: '#CBB5A1' },
];

const CORN_SECTIONS: SectionConfig[] = [
  { id: 'corn_yield_header', label: 'Visão Geral', shortLabel: 'Visão Geral', geometry: 'sphere', color: '#C19262', colorDark: '#D4A373' },
  { id: 'corn_yield_params', label: 'Parâmetros', shortLabel: 'Parâmetros', geometry: 'cylinder', color: '#5A5A40', colorDark: '#9CB386' },
  { id: 'corn_yield_alerts', label: 'Alertas', shortLabel: 'Alertas', geometry: 'cone', color: '#D4A373', colorDark: '#E0A96D' },
  { id: 'corn_yield_visual', label: 'Visual', shortLabel: 'Visual', geometry: 'torus', color: '#C19262', colorDark: '#D4A373' },
  { id: 'corn_yield_results', label: 'Resultados', shortLabel: 'Resultados', geometry: 'octahedron', color: '#2E6F40', colorDark: '#86efac' },
];

const ABNT_SECTIONS: SectionConfig[] = [
  { id: 'abnt_section', label: 'Referências ABNT', shortLabel: 'ABNT', geometry: 'cylinder', color: '#5A5A40', colorDark: '#9CB386' },
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
  const glowX = useTransform(scrollProgressMV, (v) => `${v * 100}%`);
  const glowY = useTransform(scrollProgressMV, (v) => `${v * 100}%`);

  const sections = useMemo(() => {
    switch (activeTab) {
      case 'nitrogen': return NITROGEN_SECTIONS;
      case 'productivity': return CORN_SECTIONS;
      case 'abnt': return ABNT_SECTIONS;
      default: return NITROGEN_SECTIONS;
    }
  }, [activeTab]);

  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  const currentSection = useScrollSpy({
    sectionIds,
    rootMargin: '-30% 0px -50% 0px',
    threshold: 0.1,
  });

  const activeSet = useMemo(
    () => new Set(activeSectionIds ?? (currentSection ? [currentSection] : [])),
    [activeSectionIds, currentSection],
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
        const colorHex = isDark ? config.colorDark : config.color;
        const isActive = activeSet.has(config.id);
        return {
          id: config.id,
          icon: ({ className }: { className?: string }) => (
            <NavSvgIcon
              geometry={config.geometry}
              color={colorHex}
              isActive={isActive}
              className={className}
            />
          ),
          label: isMobile ? config.shortLabel : config.label,
          ariaLabel: config.label,
          onClick: () => handleClick(config.id),
        };
      }),
    [sections, isDark, isMobile, activeSet, handleClick],
  );

  const glowColor = isDark ? '#9CB386' : '#5A5A40';

  const insetShadow = isDark
    ? 'inset 0 6px 12px -4px rgba(0,0,0,0.35), inset 0 1px 0 rgba(155,179,134,0.25)'
    : 'inset 0 6px 12px -4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(90,90,64,0.25)';

  return (
    <div
      ref={containerRef}
      className={`relative ${isMobile ? 'w-full' : 'h-full flex flex-col'}`}
      role="tablist"
      aria-label="Navegação de seções"
    >
      {/* Gooey body filter — makes the nav feel embedded in the page */}
      <svg className="absolute" style={{ width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter
            id="section-nav-body-gooey"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 12 -5"
            />
          </filter>
        </defs>
      </svg>

      {/* Nav rail with gooey body effect */}
      <div
        className={`relative ${isMobile ? '' : 'flex-1'}`}
        style={{ filter: 'url(#section-nav-body-gooey)' }}
      >
        {/* Inset shadow card — follows MultiButton shape via gooey filter */}
        <div
          className={`relative ${isMobile ? '' : 'h-full'}`}
          style={{
            boxShadow: insetShadow,
            borderRadius: '1rem',
          }}
        >
          <MultiButton
            gooey
            variant="ghost"
            size="md"
            items={items}
            fillWidth={fillWidth > 0 ? fillWidth : undefined}
            highlightColor={isDark ? '#9CB386' : '#5A5A40'}
            disableBlur
            className={isMobile ? 'w-full justify-center' : 'flex-col !rounded-2xl h-full items-stretch justify-center'}
          />
        </div>
      </div>

      {/* Scroll glow dot — small indicator on edge */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ overflow: 'visible', zIndex: 10 }}
        aria-hidden="true"
      >
        <defs>
          <filter id="section-glow-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 14 -6"
            />
          </filter>
        </defs>
        {isMobile ? (
          <motion.circle
            cx={glowX}
            cy="50%"
            r="4"
            fill={glowColor}
            opacity={0.85}
            filter="url(#section-glow-blur)"
            style={{ transition: 'cx 0.15s ease-out' }}
          />
        ) : (
          <motion.circle
            cx="50%"
            cy={glowY}
            r="4"
            fill={glowColor}
            opacity={0.85}
            filter="url(#section-glow-blur)"
            style={{ transition: 'cy 0.15s ease-out' }}
          />
        )}
      </svg>
    </div>
  );
});
