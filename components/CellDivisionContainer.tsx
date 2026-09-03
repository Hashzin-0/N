'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type Phase = 'idle' | 'dividing' | 'divided' | 'merging' | 'merged';

interface CellDivisionContainerProps {
  mode: 'single' | 'range';
  onModeChange: (mode: 'single' | 'range') => void;
  accentColor?: string;
  isDark?: boolean;
  children: React.ReactNode;
}

const PARTICLE_DATA = Array.from({ length: 10 }, (_, i) => ({
  angle: (i / 10) * Math.PI * 2,
  dist: 30 + (((i * 7 + 3) % 11) / 11) * 20,
  size: 3 + (((i * 3 + 5) % 7) / 7) * 3,
}));

export default function CellDivisionContainer({
  mode,
  onModeChange,
  accentColor = '#D4A373',
  isDark = false,
  children,
}: CellDivisionContainerProps) {
  const [phase, setPhase] = useState<Phase>(mode === 'range' ? 'divided' : 'idle');
  const prevMode = useRef(mode);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const addTimer = useCallback((fn: () => void, delay: number) => {
    timers.current.push(setTimeout(fn, delay));
  }, []);

  useEffect(() => {
    if (mode === prevMode.current) return;
    prevMode.current = mode;
    clearTimeouts();

    if (mode === 'range') {
      addTimer(() => setPhase('dividing'), 0);
      addTimer(() => setPhase('divided'), 950);
    } else {
      addTimer(() => setPhase('merging'), 0);
      addTimer(() => setPhase('merged'), 750);
      addTimer(() => setPhase('idle'), 800);
    }

    return clearTimeouts;
  }, [mode, clearTimeouts, addTimer]);

  const isDividing = phase === 'dividing';
  const isMerging = phase === 'merging';
  const isDivided = phase === 'divided';
  const isIdle = phase === 'idle' || phase === 'merged';
  const isAnimating = isDividing || isMerging;

  const isBridgeVisible = isDividing || isMerging || isDivided;

  const bridgeOpacity = isDividing ? 1 : isMerging ? 0.6 : isDivided ? 0.85 : 0;
  const bridgePinch = isDividing ? 0.15 : isMerging ? 0.5 : isDivided ? 0 : 0.5;
  const bridgeGlow = isDividing ? 1 : isMerging ? 0.4 : isDivided ? 0.3 : 0;

  const [snapActive, setSnapActive] = useState(false);

  useEffect(() => {
    if (isDividing) {
      addTimer(() => setSnapActive(true), 600);
      addTimer(() => setSnapActive(false), 850);
    } else {
      addTimer(() => setSnapActive(false), 0);
    }
  }, [isDividing, addTimer]);

  const childrenArray = React.Children.toArray(children);
  const firstChild = childrenArray[0];
  const secondChild = childrenArray[1];

  return (
    <div
      className="relative w-full"
      style={{ perspective: '800px' }}
    >
      <div
        className="relative flex items-end gap-0"
        style={{ minHeight: '72px' }}
      >
        {/* First input — morphs from full width to ~50% */}
        <motion.div
          className="relative overflow-visible"
          style={{ transformStyle: 'preserve-3d', zIndex: 2 }}
          animate={{
            flex: isIdle ? '1 1 100%' : '1 1 48%',
            rotateX: isDividing ? -1.5 : isMerging ? 1 : 0,
            scale: isAnimating ? 1.01 : 1,
          }}
          transition={{
            flex: {
              type: 'spring',
              stiffness: 200,
              damping: 22,
              mass: 0.8,
            },
            rotateX: { duration: 0.4 },
            scale: { type: 'spring', stiffness: 400, damping: 25 },
          }}
        >
          {/* Organic blob morph overlay on right edge during division */}
          {isDividing && (
            <motion.div
              className="absolute top-0 right-0 bottom-0 pointer-events-none"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '60%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${accentColor}18 40%, ${accentColor}30 70%, ${accentColor}15 100%)`,
                borderRadius: '0 50% 50% 0',
                filter: 'blur(2px)',
                zIndex: -1,
              }}
            />
          )}

          {/* Glow pulse on right edge during pinch phase */}
          {isDividing && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-16 pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 0.8, 0.4, 0],
                scale: [0.5, 1.2, 0.8, 0.5],
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                background: `radial-gradient(ellipse, ${accentColor}60, transparent 70%)`,
                borderRadius: '50%',
              }}
            />
          )}

          <div style={{ opacity: isMerging ? 1 : 1 }}>
            {firstChild}
          </div>
        </motion.div>

        {/* Membrane Bridge SVG */}
        <AnimatePresence>
          {isBridgeVisible && (
            <motion.div
              className="absolute top-0 bottom-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: bridgeOpacity }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                left: '46%',
                right: '46%',
                zIndex: 3,
                filter: `drop-shadow(0 0 ${bridgeGlow * 8}px ${accentColor}44)`,
              }}
            >
              <svg
                viewBox="0 0 60 100"
                preserveAspectRatio="none"
                className="w-full h-full"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <radialGradient id="membraneGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={accentColor} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Glow at pinch point */}
                <motion.ellipse
                  cx="30"
                  cy="50"
                  fill="url(#membraneGlow)"
                  animate={{
                    rx: isDividing ? [12, 8, 18, 0] : isMerging ? [0, 14, 20, 10] : 10,
                    ry: isDividing ? [30, 25, 35, 0] : isMerging ? [0, 30, 38, 30] : 30,
                    opacity: bridgeGlow,
                  }}
                  transition={{
                    duration: isDividing ? 0.9 : 0.7,
                    ease: 'easeInOut',
                  }}
                />

                {/* Main membrane path */}
                <motion.path
                  fill={`${accentColor}25`}
                  stroke={accentColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  animate={{
                    d: isDividing
                      ? [
                          'M 5,15 Q 30,12 55,15 L 55,85 Q 30,88 5,85 Z',
                          'M 10,20 Q 30,18 50,20 L 50,80 Q 30,82 10,80 Z',
                          'M 18,28 Q 30,40 42,28 L 42,72 Q 30,60 18,72 Z',
                          'M 24,35 Q 30,48 36,35 L 36,65 Q 30,52 24,65 Z',
                          'M 28,42 Q 30,50 32,42 L 32,58 Q 30,50 28,42 Z',
                        ]
                      : isMerging
                      ? [
                          'M 28,42 Q 30,50 32,42 L 32,58 Q 30,50 28,42 Z',
                          'M 18,28 Q 30,40 42,28 L 42,72 Q 30,60 18,72 Z',
                          'M 10,20 Q 30,18 50,20 L 50,80 Q 30,82 10,80 Z',
                          'M 5,15 Q 30,12 55,15 L 55,85 Q 30,88 5,85 Z',
                        ]
                      : 'M 5,15 Q 30,12 55,15 L 55,85 Q 30,88 5,85 Z',
                    opacity: isDividing ? [1, 0.8, 0.5, 0] : isMerging ? [0, 0.5, 0.8, 1] : 1,
                  }}
                  transition={{
                    duration: isDividing ? 0.9 : 0.7,
                    ease: 'easeInOut',
                  }}
                />

                {/* Animated particles along the membrane edge */}
                {(isDividing || isMerging) &&
                  [0, 1, 2, 3, 4].map((i) => {
                    const baseY = 20 + i * 15;
                    return (
                      <motion.circle
                        key={i}
                        r="2"
                        fill={accentColor}
                        initial={{ opacity: 0 }}
                        animate={{
                          cx: isDividing ? [30, 30, 30] : [30, 30, 30],
                          cy: [baseY, baseY + (isDividing ? -3 : 3), baseY],
                          opacity: [0, 0.6, 0],
                          r: isDividing ? [1.5, 2.5, 1] : [1, 2.5, 1.5],
                        }}
                        transition={{
                          duration: 0.7,
                          delay: i * 0.1,
                          repeat: isAnimating ? 2 : 0,
                          ease: 'easeInOut',
                        }}
                      />
                    );
                  })}
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Snap flash effect */}
        <AnimatePresence>
          {snapActive && (
            <>
              {/* Expanding ring */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 pointer-events-none rounded-full border-2"
                style={{
                  left: '50%',
                  width: 8,
                  height: 8,
                  marginLeft: -4,
                  borderColor: 'white',
                  zIndex: 10,
                }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 14, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
              {/* Particle burst */}
              {PARTICLE_DATA.map((p, i) => {
                return (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
                    style={{
                      width: p.size,
                      height: p.size,
                      backgroundColor: accentColor,
                      zIndex: 11,
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos(p.angle) * p.dist,
                      y: Math.sin(p.angle) * p.dist,
                      opacity: 0,
                      scale: 0,
                    }}
                    transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.02 }}
                  />
                );
              })}
            </>
          )}
        </AnimatePresence>

        {/* Second input — appears during division, fades during merge */}
        <motion.div
          className="relative overflow-visible"
          style={{ transformStyle: 'preserve-3d', zIndex: 2 }}
          initial={false}
          animate={{
            flex: isIdle ? '0 0 0%' : '1 1 48%',
            opacity: isMerging ? [1, 0.8, 0] : isDividing ? [0, 0, 0.5, 1] : isDivided ? 1 : 0,
            scale: isMerging ? [1, 1.03, 0.95] : isDividing ? [0.9, 1.05, 1] : isDivided ? 1 : 0.9,
            rotateX: isMerging ? 1.5 : isDividing ? -1.5 : 0,
          }}
          transition={{
            flex: {
              type: 'spring',
              stiffness: 200,
              damping: 22,
              mass: 0.8,
            },
            opacity: { duration: isDividing ? 0.5 : 0.4, ease: 'easeOut' },
            scale: { type: 'spring', stiffness: 300, damping: 20 },
            rotateX: { duration: 0.4 },
          }}
        >
          {/* Blob entrance overlay during division */}
          {isDividing && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ clipPath: 'circle(0% at 0% 50%)' }}
              animate={{ clipPath: 'circle(100% at 50% 50%)' }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
              style={{
                background: `linear-gradient(270deg, ${accentColor}10, ${accentColor}05)`,
                borderRadius: '50% 0 0 50%',
              }}
            />
          )}

          <div style={{ opacity: isMerging ? 0 : 1, pointerEvents: isIdle ? 'none' : 'auto' }}>
            {secondChild}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
