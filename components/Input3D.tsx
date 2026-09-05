'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'motion/react';
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

  const prevValueRef = useRef(value);
  const [animDirection, setAnimDirection] = useState<'up' | 'down'>('up');
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const animTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getDecimalPlaces = (num: number): number => {
    const str = num.toString();
    if (str.includes('.')) return str.split('.')[1].length;
    return 0;
  };

  const formatNumber = (num: number): string => {
    const decimals = getDecimalPlaces(step);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  useEffect(() => {
    const prevValue = prevValueRef.current;
    if (prevValue !== value) {
      const direction = value > prevValue ? 'up' : 'down';
      setAnimDirection(direction);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      setIsAnimating(true);
      motionValue.set(value);
      animTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        setDisplayValue(value);
      }, 400);
      prevValueRef.current = value;
    }
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayValue(Number(latest.toFixed(getDecimalPlaces(step))));
    });
    return () => unsubscribe();
  }, [springValue, step]);

  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, []);

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

  const edgeColor = critical
    ? '#991b1b'
    : warning
    ? '#92400e'
    : filling
    ? '#166534'
    : accentColor;

  return (
    <motion.div
      className={`relative group ${className}`}
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

      <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
        {/* SHADOW LAYER — MagicButton inspired */}
        <div
          className={`absolute inset-0 rounded-xl ${isFocused ? 'translate-y-[1px]' : isHovered ? 'translate-y-[5px]' : 'translate-y-[2px]'}`}
          style={{
            background: isDark
              ? `linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.25) 100%)`
              : `linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.12) 100%)`,
            filter: 'blur(6px)',
            transition: 'translate 300ms cubic-bezier(0.3,0.7,0.4,1)',
          }}
          aria-hidden="true"
        />

        {/* EDGE LAYER — MagicButton inspired, shows accent color depth */}
        <div
          className={`absolute inset-0 rounded-xl ${isFocused ? 'translate-y-[0px]' : isHovered ? 'translate-y-[3px]' : 'translate-y-[1px]'}`}
          style={{
            background: `linear-gradient(135deg, ${edgeColor}dd 0%, ${edgeColor}99 50%, ${edgeColor}bb 100%)`,
            transition: 'translate 300ms cubic-bezier(0.3,0.7,0.4,1)',
          }}
          aria-hidden="true"
        />

        {/* FRONT FACE — the actual input */}
        <motion.div
          className="relative"
          animate={{
            rotateX: filling ? 2 : isFocused ? 1.5 : isHovered ? 0.5 : 0,
            rotateY: filling ? -1 : isFocused ? -0.5 : isHovered ? 0.3 : 0,
            y: isFocused ? 0 : isHovered ? -5 : -4,
          }}
          transition={{
            type: 'spring',
            stiffness: filling ? 200 : isFocused ? 350 : 450,
            damping: 22,
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="relative overflow-hidden rounded-xl">
            {/* Shimmer border effect on focus */}
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

            {/* Animated number display (when not focused) */}
            {!isFocused && (
              <div
                className={`absolute inset-0 flex items-center p-2.5 rounded-xl border text-sm font-medium ${
                  readOnly ? 'cursor-default opacity-80' : ''
                } ${
                  isDark ? 'bg-[#242720] text-[#F4F3EE]' : 'bg-white text-[#3D3D3D]'
                }`}
                style={{ borderColor, pointerEvents: 'none' }}
              >
                <span className="tabular-nums tracking-wider">
                  {value === 0 ? (
                    <span className="text-[#8C897E] dark:text-[#9EA399]">{placeholder || '0'}</span>
                  ) : isAnimating ? (
                    <motion.span
                      className="tabular-nums tracking-wider"
                      style={{ color: animDirection === 'up' ? '#22c55e' : '#ef4444' }}
                      initial={{ y: animDirection === 'up' ? 10 : -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    >
                      {formatNumber(displayValue)}
                    </motion.span>
                  ) : (
                    formatNumber(value)
                  )}
                </span>
              </div>
            )}

            {/* Actual input */}
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
              className={`w-full p-2.5 rounded-xl border text-sm font-medium focus:outline-none transition-all duration-200 ${
                readOnly ? 'cursor-default opacity-80' : ''
              } ${
                isDark ? 'bg-[#242720] text-[#F4F3EE]' : 'bg-white text-[#3D3D3D]'
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
                  ? `0 0 0 3px ${accentColor}44, 0 4px 12px -2px ${accentColor}33`
                  : 'none',
                opacity: isFocused ? 1 : 0,
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
      </div>

      {hint && (
        <span className="text-[10px] text-[#8C897E] block mt-1">{hint}</span>
      )}
    </motion.div>
  );
}
