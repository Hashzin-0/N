'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type Phase = 'idle' | 'growing' | 'sliding' | 'split' | 'merging' | 'merged';

interface CellDivisionContainerProps {
  mode: 'single' | 'range';
  onModeChange: (mode: 'single' | 'range') => void;
  accentColor?: string;
  isDark?: boolean;
  children: React.ReactNode;
}

const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  angle: (i / 10) * Math.PI * 2,
  dist: 24 + (((i * 7 + 3) % 11) / 11) * 16,
  size: 2.5 + (((i * 3 + 5) % 7) / 7) * 2.5,
}));

export default function CellDivisionContainer({
  mode,
  onModeChange,
  accentColor = '#D4A373',
  isDark = false,
  children,
}: CellDivisionContainerProps) {
  const [phase, setPhase] = useState<Phase>(mode === 'range' ? 'split' : 'idle');
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
      addTimer(() => setPhase('growing'), 0);
      addTimer(() => setPhase('sliding'), 200);
      addTimer(() => setPhase('split'), 900);
    } else {
      addTimer(() => setPhase('merging'), 0);
      addTimer(() => setPhase('merged'), 650);
      addTimer(() => setPhase('idle'), 700);
    }

    return clearTimeouts;
  }, [mode, clearTimeouts, addTimer]);

  const isSliding = phase === 'sliding';
  const isSplit = phase === 'split';
  const isMerging = phase === 'merging';
  const isGrowing = phase === 'growing';
  const isIdle = phase === 'idle' || phase === 'merged';
  const isAnimating = isSliding || isMerging || isGrowing;

  const [snapFlash, setSnapFlash] = useState(false);

  useEffect(() => {
    if (isSliding) {
      addTimer(() => setSnapFlash(true), 580);
      addTimer(() => setSnapFlash(false), 820);
    } else {
      addTimer(() => setSnapFlash(false), 0);
    }
  }, [isSliding, addTimer]);

  const childrenArray = React.Children.toArray(children);
  const firstChild = childrenArray[0];
  const secondChild = childrenArray[1];

  // --- Derived animation values ---
  // Bridge width: 0 when idle/growing, 60px when sliding, shrinks to 0 at split
  const bridgeWidth = isSliding ? 60 : isSplit ? 0 : isMerging ? 50 : 0;

  // Border radius on inner edges
  // During merged look: 0 (flat). After split: 12px (rounded).
  const innerRadius = isSplit ? 12 : 0;

  // Bridge opacity
  const bridgeOpacity = isSliding ? 1 : isMerging ? 0.8 : 0;

  // Bridge glow intensity
  const bridgeGlow = isSliding ? 1 : isMerging ? 0.5 : 0;

  // Second input opacity
  const input2Opacity = isIdle ? 0 : 1;

  // Is in split state (final separated state)
  const isSplitState = isSplit || isMerging || isGrowing;

  return (
    <div className="relative w-full" style={{ perspective: '800px' }}>
      <div
        className="relative"
        style={{ minHeight: '72px' }}
      >
        {/* ===================== INPUT 2 (emerges from center) ===================== */}
        <motion.div
          className="absolute top-0 bottom-0 left-0 overflow-hidden"
          style={{
            zIndex: 2,
            transformStyle: 'preserve-3d',
          }}
          animate={{
            width: isIdle ? '0%' : '48%',
            opacity: input2Opacity,
            scale: isGrowing ? 0.5 : isSliding ? 1 : isSplit ? 1 : isMerging ? 0.5 : 0,
            scaleX: isSliding ? 1.02 : 1,
            scaleY: isSliding ? 0.98 : 1,
            borderTopRightRadius: innerRadius,
            borderBottomRightRadius: innerRadius,
            rotateX: isGrowing ? 0 : isSliding ? -1 : isMerging ? 0.5 : 0,
            clipPath: isGrowing 
              ? 'inset(0 50% 0 50%)' 
              : isSliding || isSplit || isMerging 
                ? 'inset(0 0 0 0)' 
                : 'inset(0 50% 0 50%)',
          }}
          transition={{
            width: {
              type: 'spring',
              stiffness: isSliding ? 180 : 250,
              damping: isSliding ? 20 : 22,
              mass: 0.6,
            },
            opacity: { duration: isSliding ? 0.3 : 0.25, ease: 'easeOut' },
            scale: { 
              type: 'spring', 
              stiffness: isGrowing ? 300 : 200, 
              damping: isGrowing ? 20 : 25,
              delay: isGrowing ? 0 : 0.1
            },
            scaleX: { duration: 0.3 },
            scaleY: { duration: 0.3 },
            borderTopRightRadius: { duration: 0.25, ease: 'easeOut' },
            borderBottomRightRadius: { duration: 0.25, ease: 'easeOut' },
            rotateX: { duration: 0.35 },
            clipPath: { duration: 0.4, ease: [0.32, 0.72, 0, 1] },
          }}
        >
          {/* Blob glow on right edge during slide-out */}
          {isSliding && (
            <motion.div
              className="absolute top-0 right-0 bottom-0 w-8 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.2] }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${accentColor}25 60%, ${accentColor}10 100%)`,
                borderRadius: `0 ${innerRadius}px ${innerRadius}px 0`,
              }}
            />
          )}

          {/* Invisible placeholder when width is 0 — keeps DOM node for smooth animation */}
          <div style={{ opacity: isIdle ? 0 : 1, pointerEvents: isIdle ? 'none' : 'auto' }}>
            {secondChild}
          </div>
        </motion.div>

        {/* ===================== BRIDGE / CHANNEL ===================== */}
        <motion.div
          className="absolute top-0 bottom-0 overflow-hidden"
          style={{ 
            zIndex: 1,
            left: '48%',
          }}
          animate={{
            width: bridgeWidth,
            opacity: bridgeOpacity,
          }}
          transition={{
            width: {
              type: 'spring',
              stiffness: isSliding ? 180 : 250,
              damping: isSliding ? 20 : 22,
              mass: 0.6,
            },
            opacity: { duration: 0.25 },
          }}
        >
          {/* Channel body — same background as inputs to create merged look */}
          <div
            className="w-full h-full"
            style={{
              backgroundColor: isDark ? '#242720' : 'white',
              backgroundImage: isDark
                ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.1) 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(0,0,0,0.02) 100%)',
            }}
          />

          {/* Glow at connection points */}
          {isSliding && (
            <>
              <motion.div
                className="absolute top-0 left-0 bottom-0 w-3 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: bridgeGlow * 0.5 }}
                transition={{ duration: 0.4 }}
                style={{
                  background: `linear-gradient(90deg, ${accentColor}40, transparent)`,
                }}
              />
              <motion.div
                className="absolute top-0 right-0 bottom-0 w-3 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: bridgeGlow * 0.5 }}
                transition={{ duration: 0.4 }}
                style={{
                  background: `linear-gradient(270deg, ${accentColor}40, transparent)`,
                }}
              />
            </>
          )}

          {/* Thin center line that snaps */}
          {isSliding && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full"
              initial={{ width: 0, height: 0, opacity: 0 }}
              animate={{
                width: [0, 4, 2, 0],
                height: ['40%', '70%', '50%', '0%'],
                opacity: [0, 0.8, 0.5, 0],
              }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              style={{ backgroundColor: `${accentColor}60` }}
            />
          )}
        </motion.div>

        {/* ===================== SNAP FLASH EFFECT ===================== */}
        <AnimatePresence>
          {snapFlash && (
            <>
              {/* Expanding ring at snap point — positioned at left edge of Input1 */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 pointer-events-none rounded-full"
                style={{
                  right: 'calc(48% + 60px)',
                  width: 6,
                  height: 6,
                  marginRight: -3,
                  border: `2px solid ${accentColor}`,
                  zIndex: 10,
                }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 12, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
              {/* Particle burst */}
              {PARTICLES.map((p, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
                  style={{
                    width: p.size,
                    height: p.size,
                    backgroundColor: accentColor,
                    zIndex: 11,
                    marginLeft: -p.size / 2,
                    marginTop: -p.size / 2,
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(p.angle) * p.dist,
                    y: Math.sin(p.angle) * p.dist,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ duration: 0.35, ease: 'easeOut', delay: i * 0.015 }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* ===================== INPUT 1 (shrinks to right) ===================== */}
        <motion.div
          className="absolute top-0 bottom-0 right-0 overflow-hidden"
          style={{
            zIndex: 2,
            transformStyle: 'preserve-3d',
          }}
          animate={{
            width: isIdle ? '100%' : '48%',
            scale: isGrowing ? 1.03 : isSplit ? 1 : isMerging ? 1.03 : 1,
            scaleX: isSliding ? 1.02 : 1,
            scaleY: isSliding ? 0.98 : 1,
            borderTopLeftRadius: innerRadius,
            borderBottomLeftRadius: innerRadius,
            rotateX: isGrowing ? 0 : isSliding ? 1 : isMerging ? -0.5 : 0,
          }}
          transition={{
            width: { type: 'spring', stiffness: 220, damping: 24, mass: 0.8 },
            scale: { type: 'spring', stiffness: 400, damping: 25 },
            scaleX: { duration: 0.3 },
            scaleY: { duration: 0.3 },
            borderTopLeftRadius: { duration: 0.25, ease: 'easeOut' },
            borderBottomLeftRadius: { duration: 0.25, ease: 'easeOut' },
            rotateX: { duration: 0.35 },
          }}
        >
          {/* Blob glow on left edge during slide-out */}
          {isSliding && (
            <motion.div
              className="absolute top-0 left-0 bottom-0 w-8 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0.3] }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{
                background: `linear-gradient(270deg, transparent 0%, ${accentColor}30 60%, ${accentColor}15 100%)`,
                borderRadius: `${innerRadius}px 0 0 ${innerRadius}px`,
              }}
            />
          )}

          {firstChild}
        </motion.div>
      </div>
    </div>
  );
}
