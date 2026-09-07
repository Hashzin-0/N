'use client';

import React, { useMemo, useCallback } from 'react';
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

export default function SectionNavGooey({ activeTab, activeSectionIds, onNavigate }: SectionNavGooeyProps) {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const scrollProgress = useScrollProgress();

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

  const glowColors = isDark
    ? { primary: '#9CB386', secondary: '#D4A373', tertiary: '#CBB5A1' }
    : { primary: '#5A5A40', secondary: '#D4A373', tertiary: '#8D6E63' };

  const glowGradient = `linear-gradient(${isMobile ? 'to right' : 'to bottom'}, ${glowColors.primary}, ${glowColors.secondary}, ${glowColors.tertiary})`;
  const glowColor = isDark ? '#9CB386' : '#5A5A40';

  const insetGradStart = isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)';
  const insetGradEnd = isDark ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.08)';
  const edgeColor = isDark ? '#9CB386' : '#5A5A40';

  const maskDir = isMobile ? 'to right' : 'to bottom';
  const glowPct = `${scrollProgress * 100}%`;
  const maskGradient = `linear-gradient(${maskDir}, transparent, black ${Math.max(0, scrollProgress * 100 - 15)}%, black ${glowPct}, black ${Math.min(100, scrollProgress * 100 + 15)}%, transparent)`;
  const maskGradientStart = `linear-gradient(${maskDir}, black ${Math.min(100, scrollProgress * 100 + 8)}%, transparent)`;

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

          <filter
            id="section-inset-shadow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 12 -5"
            />
          </filter>

          <filter
            id="section-glow-blur"
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
            />
          </filter>
        </defs>
      </svg>

      {/* Nav rail with gooey body effect + inset shadow/edge/glow */}
      <div
        className={`relative ${isMobile ? 'px-2' : 'flex-1 py-2 px-1'}`}
        style={{ filter: 'url(#section-nav-body-gooey)' }}
      >
        {/* SVG inset shadow + edge + glow — follows gooey metaball shape */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ overflow: 'visible', zIndex: 1 }}
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          {/* SHADOW LAYER — blurred dark gradient, inset top */}
          <g filter="url(#section-inset-shadow)">
            <rect
              x="0" y="0" width="100%" height="100%"
              rx="16" ry="16"
              fill={`url(#inset-shadow-grad-${isMobile ? 'h' : 'v'})`}
            />
          </g>

          {/* EDGE LAYER — accent-colored inset edge */}
          <rect
            x="0" y="0" width="100%" height="100%"
            rx="16" ry="16"
            fill={`${edgeColor}55`}
            style={{
              transform: isMobile ? 'translateY(0.5px)' : 'translateX(0.5px)',
            }}
          />

          {/* GLOW LAYER — scroll progress light on edge, masked by progress */}
          <g
            style={{
              WebkitMaskImage: maskGradientStart,
              maskImage: maskGradientStart,
            }}
          >
            <g filter="url(#section-glow-blur)">
              <rect
                x="0" y="0" width="100%" height="100%"
                rx="16" ry="16"
                fill={glowGradient}
                opacity={0.5}
              />
            </g>
          </g>

          {/* GLOW DOT — bright accent at scroll position */}
          {isMobile ? (
            <circle
              cx={`${scrollProgress * 100}%`}
              cy="50%"
              r="5"
              fill={glowColor}
              opacity={0.9}
              style={{ transition: 'cx 0.15s ease-out' }}
            />
          ) : (
            <circle
              cx="50%"
              cy={`${scrollProgress * 100}%`}
              r="5"
              fill={glowColor}
              opacity={0.9}
              style={{ transition: 'cy 0.15s ease-out' }}
            />
          )}

          {/* Gradient definitions */}
          <defs>
            <linearGradient
              id="inset-shadow-grad-v"
              x1="0" y1="0" x2="0" y2="1"
            >
              <stop offset="0%" stopColor={insetGradStart} />
              <stop offset="100%" stopColor={insetGradEnd} />
            </linearGradient>
            <linearGradient
              id="inset-shadow-grad-h"
              x1="0" y1="0" x2="1" y2="0"
            >
              <stop offset="0%" stopColor={insetGradStart} />
              <stop offset="100%" stopColor={insetGradEnd} />
            </linearGradient>
          </defs>
        </svg>

        <MultiButton
          gooey
          variant="ghost"
          size="md"
          items={items}
          highlightColor={isDark ? '#9CB386' : '#5A5A40'}
          disableBlur
          className={isMobile ? 'w-full justify-center gap-2' : 'flex-col !rounded-2xl h-full items-stretch justify-center gap-3'}
        />
      </div>
    </div>
  );
}
