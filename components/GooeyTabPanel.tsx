'use client';

import React, {
  ReactNode,
  useCallback,
  useRef,
  useId,
  useState,
} from 'react';

import {
  AnimatePresence,
  motion,
} from 'motion/react';

import { useTheme } from '@/components/ThemeProvider';

/* ============================================================
   TIPOS
============================================================ */

export type TabId =
  | 'nitrogen'
  | 'productivity'
  | 'itr'
  | 'abnt';

interface Tab {
  id: TabId;
  label: string;
}

/* ============================================================
   CONFIGURAÇÃO
============================================================ */

const TABS: Tab[] = [
  { id: 'nitrogen', label: 'Adubação Nitrogenada' },
  { id: 'productivity', label: 'Estimativa de Produtividade' },
  { id: 'itr', label: 'ITR' },
  { id: 'abnt', label: 'Referências ABNT' },
];

const TAB_INDEX: Record<TabId, number> = {
  nitrogen: 0,
  productivity: 1,
  itr: 2,
  abnt: 3,
};

const TAB_H = 105;
const CONNECTOR_H = 40;

/* ============================================================
   GOOEY FILTER
============================================================ */

function GooeyFilter({ id }: { id: string }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute h-0 w-0"
    >
      <defs>
        <filter
          id={id}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation="6"
            result="blur"
          />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 22 -10"
            result="goo"
          />
          <feComposite
            in="SourceGraphic"
            in2="goo"
            operator="atop"
          />
        </filter>
      </defs>
    </svg>
  );
}

/* ============================================================
   FORMA GOOEY — TAB + CONECTOR SVG
============================================================ */

function GooeyShell({
  activeTab,
  filterId,
  fillColor,
}: {
  activeTab: TabId;
  filterId: string;
  fillColor: string;
}) {
  const tabIndex = TAB_INDEX[activeTab];

  const W = 1000;
  const R = 38;

  const tabWidth = W / 4;
  const tabLeft = tabIndex * tabWidth;
  const tabRight = (tabIndex + 1) * tabWidth;

  const circleX = (tabLeft + tabRight) / 2;

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${W} ${TAB_H + CONNECTOR_H}`}
      preserveAspectRatio="none"
      style={{ overflow: 'visible' }}
    >
      <g filter={`url(#${filterId})`}>
        {/* Tab body */}
        <path
          fill={fillColor}
          d={`
            M ${tabLeft} ${TAB_H}
            L ${tabLeft} ${R}
            Q ${tabLeft} 0 ${tabLeft + R} 0
            L ${tabRight - R} 0
            Q ${tabRight} 0 ${tabRight} ${R}
            L ${tabRight} ${TAB_H}
            Z
          `}
        />
        {/* Circle at junction — gooey connection */}
        <circle
          cx={circleX}
          cy={TAB_H}
          r="34"
          fill={fillColor}
        />
      </g>
    </svg>
  );
}

/* ============================================================
   SLIDER DE PÁGINAS
============================================================ */

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
  }),
  center: {
    x: '0%',
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
  }),
};

const pageTransition = {
  x: {
    type: 'spring' as const,
    stiffness: 330,
    damping: 34,
    mass: 0.85,
  },
};

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */

export interface GooeyTabPanelProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  nitrogenContent: ReactNode;
  productivityContent: ReactNode;
  itrContent: ReactNode;
  abntContent: ReactNode;
}

export default function GooeyTabPanel({
  activeTab,
  onTabChange,
  nitrogenContent,
  productivityContent,
  itrContent,
  abntContent,
}: GooeyTabPanelProps) {
  const [direction, setDirection] = useState(1);
  const { isDark } = useTheme();
  const rawId = useId();
  const filterId = `gooey-tabs-${rawId.replace(/:/g, '')}`;

  const fillColor = isDark ? '#1C201A' : '#FDFBF7';

  const touchStartX = useRef(0);
  const mouseStartX = useRef(0);

  const changeTab = useCallback(
    (nextTab: TabId) => {
      if (nextTab === activeTab) return;
      const currentIndex = TAB_INDEX[activeTab];
      const nextIndex = TAB_INDEX[nextTab];
      setDirection(nextIndex > currentIndex ? 1 : -1);
      onTabChange(nextTab);
    },
    [activeTab, onTabChange],
  );

  const handleSwipeGesture = useCallback(
    (deltaX: number) => {
      const THRESHOLD = 50;
      const idx = TAB_INDEX[activeTab];
      if (deltaX < -THRESHOLD && idx < TABS.length - 1) {
        changeTab(TABS[idx + 1].id);
      } else if (deltaX > THRESHOLD && idx > 0) {
        changeTab(TABS[idx - 1].id);
      }
    },
    [activeTab, changeTab],
  );

  const contentMap: Record<TabId, ReactNode> = {
    nitrogen: nitrogenContent,
    productivity: productivityContent,
    itr: itrContent,
    abnt: abntContent,
  };

  return (
    <div
      className="relative w-full"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        handleSwipeGesture(deltaX);
      }}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        const el = e.target as HTMLElement;
        if (el.closest('button, a, input, select, textarea, [role="button"]')) return;
        mouseStartX.current = e.clientX;
      }}
      onMouseUp={(e) => {
        if (mouseStartX.current === 0) return;
        const deltaX = e.clientX - mouseStartX.current;
        mouseStartX.current = 0;
        handleSwipeGesture(deltaX);
      }}
    >
      <GooeyFilter id={filterId} />

      {/* Tabs — em fluxo normal, rola com o conteúdo */}
      <div className="relative z-30 grid w-full grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => changeTab(tab.id)}
              className="relative h-[105px] border-0 bg-transparent px-2 outline-none"
            >
              <span
                className={`
                  relative z-10
                  flex h-full items-center justify-center
                  text-[13px] font-semibold
                  transition-all duration-300
                  sm:text-[15px]
                  ${active ? 'text-[#3D3D3D] dark:text-[#efeee7]' : 'text-[#a6a89f] hover:text-[#d4d3cb]'}
                `}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Conector — área de transição gooey */}
      <div
        className="relative z-20"
        style={{ height: CONNECTOR_H, marginTop: '-20px' }}
      >
        <GooeyShell
          activeTab={activeTab}
          filterId={filterId}
          fillColor={fillColor}
        />
      </div>

      {/* Conteúdo — em fluxo normal, rola com scroll */}
      <div className="relative z-10">
        <AnimatePresence
          initial={false}
          custom={direction}
          mode="sync"
        >
          <motion.div
            key={activeTab}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={pageTransition}
          >
            {contentMap[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
