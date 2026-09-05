'use client';

import React, { useMemo, useCallback } from 'react';
import { useTheme } from './ThemeProvider';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useIsMobile } from '@/hooks/use-mobile';
import { MultiButton, type MultiButtonItem } from './godui/multi-button';
import GeometryIcon3D from './GeometryIcon3D';

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
  { id: 'detailed_math_panel', label: 'Fórmulas', shortLabel: 'Fórmulas', geometry: 'icosahedron', color: '#8D6E63', colorDark: '#CBB5A1' },
];

const CORN_SECTIONS: SectionConfig[] = [
  { id: 'corn_yield_header', label: 'Visão Geral', shortLabel: 'Visão Geral', geometry: 'sphere', color: '#C19262', colorDark: '#D4A373' },
  { id: 'corn_yield_params', label: 'Parâmetros', shortLabel: 'Parâmetros', geometry: 'cylinder', color: '#5A5A40', colorDark: '#9CB386' },
  { id: 'corn_yield_alerts', label: 'Alertas', shortLabel: 'Alertas', geometry: 'cone', color: '#D4A373', colorDark: '#E0A96D' },
  { id: 'corn_yield_visual', label: 'Visual', shortLabel: 'Visual', geometry: 'torus', color: '#C19262', colorDark: '#D4A373' },
  { id: 'corn_yield_results', label: 'Resultados', shortLabel: 'Resultados', geometry: 'octahedron', color: '#2E6F40', colorDark: '#86efac' },
];

const COMPARATOR_SECTIONS: SectionConfig[] = [
  { id: 'scenario_comparator_section', label: 'Comparador', shortLabel: 'Comparador', geometry: 'box', color: '#5A5A40', colorDark: '#9CB386' },
];

const ABNT_SECTIONS: SectionConfig[] = [
  { id: 'abnt_section', label: 'Referências ABNT', shortLabel: 'ABNT', geometry: 'cylinder', color: '#5A5A40', colorDark: '#9CB386' },
];

interface SectionNavGooeyProps {
  activeTab: string;
  onNavigate?: (sectionId: string) => void;
}

export default function SectionNavGooey({ activeTab, onNavigate }: SectionNavGooeyProps) {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const scrollProgress = useScrollProgress();
  const sections = useMemo(() => {
    switch (activeTab) {
      case 'calculadora': return NITROGEN_SECTIONS;
      case 'estimativa_milho': return CORN_SECTIONS;
      case 'comparador': return COMPARATOR_SECTIONS;
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
        return {
          id: config.id,
          icon: ({ className }: { className?: string }) => (
            <GeometryIcon3D
              geometry={config.geometry}
              color={colorHex}
              isActive={currentSection === config.id}
              className={className}
            />
          ),
          label: isMobile ? config.shortLabel : config.label,
          ariaLabel: config.label,
          onClick: () => handleClick(config.id),
        };
      }),
    [sections, isDark, isMobile, currentSection, handleClick],
  );

  const indicatorProgress = useMemo(() => {
    return scrollProgress;
  }, [scrollProgress]);

  return (
    <div
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
        className={`relative ${isMobile ? 'px-2' : 'flex-1 py-2 px-1'}`}
        style={{ filter: 'url(#section-nav-body-gooey)' }}
      >
        <MultiButton
          gooey
          variant="ghost"
          size="md"
          items={items}
          highlightColor={isDark ? '#9CB386' : '#5A5A40'}
          className={isMobile ? 'w-full' : 'flex-col !rounded-2xl h-full items-stretch'}
        />
      </div>

      {/* Scroll progress indicator */}
      <div
        className={`absolute ${
          isMobile
            ? 'bottom-0 left-2 right-2 h-1'
            : 'left-[28px] top-2 bottom-2 w-1'
        } bg-[#E5E2D9] dark:bg-[#2C3328] rounded-full overflow-hidden`}
      >
        <div
          className="absolute rounded-full"
          style={{
            background: isDark
              ? 'linear-gradient(to right, #9CB386, #D4A373, #CBB5A1)'
              : 'linear-gradient(to right, #5A5A40, #D4A373, #8D6E63)',
            ...(isMobile
              ? {
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${indicatorProgress * 100}%`,
                  transition: 'width 0.15s ease-out',
                }
              : {
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${indicatorProgress * 100}%`,
                  transition: 'height 0.15s ease-out',
                }),
          }}
        />
        <div
          className="absolute rounded-full bg-white shadow-lg"
          style={{
            width: 8,
            height: 8,
            boxShadow: `0 0 8px ${isDark ? '#9CB386' : '#5A5A40'}`,
            ...(isMobile
              ? {
                  top: '50%',
                  left: `calc(${indicatorProgress * 100}% - 4px)`,
                  transform: 'translateY(-50%)',
                  transition: 'left 0.15s ease-out',
                }
              : {
                  left: '50%',
                  top: `calc(${indicatorProgress * 100}% - 4px)`,
                  transform: 'translateX(-50%)',
                  transition: 'top 0.15s ease-out',
                }),
          }}
        />
      </div>
    </div>
  );
}
