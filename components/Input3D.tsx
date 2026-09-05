'use client';

import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import MorphText from '@/components/MorphText';

interface Input3DProps {
  id?: string;
  value: number;
  onChange: (val: number) => void;
  onBlurCustom?: (val: number) => void;
  label?: string;
  labelMorph?: boolean;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  isDark?: boolean;
  accentColor?: string;
  className?: string;
  readOnly?: boolean;
  derived?: boolean;
  warning?: boolean;
  critical?: boolean;
  hint?: string;
  filling?: boolean;
}

export default function Input3D({
  id,
  value,
  onChange,
  onBlurCustom,
  label,
  labelMorph = false,
  unit = '',
  step = 1,
  min,
  max,
  placeholder,
  isDark = false,
  accentColor = '#5A5A40',
  className = '',
  readOnly = false,
  derived = false,
  warning = false,
  critical = false,
  hint,
  filling = false,
}: Input3DProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const tiltX = useTransform(mouseY, [-0.5, 0.5], [3, -3]);
  const tiltY = useTransform(mouseX, [-0.5, 0.5], [-3, 3]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const borderColor = critical
    ? '#ef4444'
    : warning
    ? '#f59e0b'
    : filling
    ? '#22c55e'
    : isFocused
    ? accentColor
    : isDark
    ? '#393E32'
    : '#E5E2D9';

  const glowColor = critical
    ? 'rgba(239,68,68,0.35)'
    : warning
    ? 'rgba(245,158,11,0.3)'
    : filling
    ? 'rgba(34,197,94,0.4)'
    : isFocused
    ? `${accentColor}44`
    : 'transparent';

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ perspective: 600 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#8C897E] dark:text-[#A6A395]">
            {labelMorph ? (
              <MorphText
                text={label}
                accentColor={accentColor}
                darkAccentColor={isDark ? '#9CB386' : '#5A5A40'}
              />
            ) : (
              label
            )}
          </label>
          {unit && (
            <span className="text-xs font-mono font-bold text-[#5A5A40] dark:text-[#A3B18A]">
              {value === 0 ? '' : value} {unit}
            </span>
          )}
        </div>
      )}

      <motion.div
        animate={{
          rotateX: filling ? 2 : isFocused ? 3 : isHovered ? 1 : 0,
          rotateY: filling ? -2 : isFocused ? -1 : isHovered ? 0.5 : 0,
          scale: filling ? 1.03 : isFocused ? 1.02 : isHovered ? 1.01 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: filling ? 200 : isFocused ? 300 : 400,
          damping: 20,
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="relative overflow-hidden rounded-xl">
          {/* Shimmer border effect */}
          {(isFocused || filling) && !readOnly && (
            <div
              className="absolute inset-0 rounded-xl pointer-events-none z-10"
              style={{
                background: filling
                  ? `linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)`
                  : `linear-gradient(90deg, transparent, ${accentColor}33, transparent)`,
                backgroundSize: '200% 100%',
                animation: 'shimmer-border 2s ease-in-out infinite',
              }}
            />
          )}

          <input
            ref={inputRef}
            id={id}
            type="number"
            step={step}
            min={min}
            max={max}
            value={value === 0 ? '' : value}
            placeholder={placeholder || '0'}
            readOnly={readOnly}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) onChange(val);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              const val = parseFloat(e.target.value);
              if (onBlurCustom) {
                onBlurCustom(isNaN(val) ? 0 : val);
              } else if (e.target.value === '' || e.target.value === '-') {
                onChange(0);
              }
            }}
            className={`w-full p-2.5 rounded-xl border text-sm font-medium focus:outline-none neonFocusClasses transition-all duration-200 ${
              readOnly
                ? 'cursor-default opacity-80'
                : ''
            } ${
              isDark
                ? 'bg-[#242720] text-[#F4F3EE]'
                : 'bg-white text-[#3D3D3D]'
            } ${
              critical
                ? 'border-red-400 dark:border-red-500'
                : warning
                ? 'border-amber-400 dark:border-amber-500'
                : ''
            }`}
            style={{
              borderColor,
              boxShadow: isFocused
                ? `0 0 0 3px ${glowColor}, 0 4px 12px -2px ${glowColor}`
                : isHovered
                ? `0 2px 8px -1px ${glowColor}`
                : 'none',
            }}
          />

          {/* Derived badge */}
          {derived && (
            <div className="absolute top-1.5 right-2 z-10">
              <span className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md bg-[#2E6F40]/15 text-[#2E6F40] dark:text-[#86efac] border border-[#2E6F40]/20">
                Calculado
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {hint && (
        <span className="text-[10px] text-[#8C897E] block mt-1">{hint}</span>
      )}
    </motion.div>
  );
}
