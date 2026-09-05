'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationLock } from '@/lib/useAnimationLock';
import { JellyButton } from '@/components/godui/jelly-button';

interface CalculationIslandProps {
  isVisible: boolean;
  onToggle: () => void;
  accentColor?: string;
  darkAccentColor?: string;
  isDark?: boolean;
}

export default function CalculationIsland({
  isVisible,
  onToggle,
  accentColor = '#5A5A40',
  darkAccentColor = '#9CB386',
  isDark = false,
}: CalculationIslandProps) {
  const activeColor = isDark ? darkAccentColor : accentColor;
  const { withLock } = useAnimationLock(400);

  return (
    <JellyButton
      variant="outline"
      squash={0.6}
      onClick={withLock(onToggle)}
      className="absolute -top-1 -right-1 z-20 !w-8 !h-8 !p-0 !rounded-bl-2xl !rounded-tr-lg !rounded-br-lg !rounded-tl-lg !border-none !shadow-none !text-white"
      style={{
        backgroundColor: activeColor,
        boxShadow: isVisible
          ? `0 0 12px ${activeColor}88, 0 2px 8px rgba(0,0,0,0.15)`
          : `0 2px 6px rgba(0,0,0,0.12)`,
        '--background': activeColor,
        '--foreground': 'white',
        '--button-px-sm': '0px',
        '--button-py-sm': '0px',
        '--button-radius-sm': '0px',
      } as React.CSSProperties}
      title={isVisible ? 'Fechar memória de cálculo' : 'Ver memória de cálculo (passo a passo)'}
    >
      {/* SVG "C" icon — Cálculo */}
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 6C14.5 3 9.5 3 6 6s-3.5 8 0 11 8.5 4 12 1" />
      </svg>

      {/* Active dot indicator */}
      <AnimatePresence>
        {isVisible && (
          <motion.span
            layoutId="island-dot"
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#D4A373] border border-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          />
        )}
      </AnimatePresence>
    </JellyButton>
  );
}
