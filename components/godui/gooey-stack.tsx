'use client';

import { useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface GooeyStackProps {
  collapsed: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function GooeyStack({ collapsed, children, className = '' }: GooeyStackProps) {
  const uid = useId().replace(/:/g, '');
  const filterId = `gooey-${uid}`;
  const maskId = `gooey-mask-${uid}`;

  const childArray = Array.isArray(children) ? children : [children];
  const firstChild = childArray[0];
  const secondChild = childArray[1];

  return (
    <div className={`relative ${className}`.trim()}>
      {/* === SVG FILTER (defined once per instance) === */}
      <svg className="absolute" style={{ width: 0, height: 0 }}>
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%"
            colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix"
              values="18 0 0 0 0
                      0 18 0 0 0
                      0 0 18 0 0
                      0 0 0 18 -7"
              result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* === COLLAPSED: single rounded pill === */}
      <AnimatePresence>
        {collapsed && (
          <motion.div
            key="pill"
            className="relative flex items-center justify-center h-12 rounded-full
                       bg-neutral-800 dark:bg-neutral-900
                       border border-white/[0.06]
                       shadow-[0_2px_12px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)]
                       cursor-pointer select-none overflow-hidden"
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          >
            {firstChild}
          </motion.div>
        )}
      </AnimatePresence>

      {/* === EXPANDED: split card with SVG gooey filter === */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            key="expanded"
            className="relative"
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            {/* --- Blob split layer (filtered — organic merge effect) --- */}
            <div
              className="absolute inset-0 overflow-visible pointer-events-none"
              style={{ filter: `url(#${filterId})` }}
            >
              <div className="relative w-full h-full">
                {/* Left blob */}
                <div
                  className="absolute top-0 left-0 h-full rounded-xl"
                  style={{
                    width: '52%',
                    background: 'linear-gradient(135deg, #1a1c17 0%, #222520 100%)',
                    transform: 'translateX(0%)',
                    transition: 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                />
                {/* Right blob */}
                <div
                  className="absolute top-0 right-0 h-full rounded-xl"
                  style={{
                    width: '52%',
                    background: 'linear-gradient(135deg, #222520 0%, #1a1c17 100%)',
                    transform: 'translateX(0%)',
                    transition: 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                />
              </div>
            </div>

            {/* --- Card content (NOT filtered — crisp text) --- */}
            <div className="relative z-10">
              <div className="rounded-xl overflow-hidden
                              bg-gradient-to-br from-neutral-800/95 to-neutral-900/95
                              dark:from-neutral-800/95 dark:to-neutral-900/95
                              border border-white/[0.06]
                              shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]">

                {/* Connector row */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08, duration: 0.25 }}
                >
                  {firstChild}
                </motion.div>

                {/* Separator */}
                <div className="h-px mx-5 bg-white/[0.06]" />

                {/* Body / textarea area */}
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ delay: 0.12, duration: 0.3 }}
                >
                  {secondChild}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
