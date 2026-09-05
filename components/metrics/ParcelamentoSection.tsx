'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Scale, ArrowRightLeft, ArrowLeftRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CalculationIsland from '@/components/CalculationIsland';
import CalculationMemoryPanel from '@/components/CalculationMemoryPanel';
import { useTheme } from '@/components/ThemeProvider';
import { Calculations } from '@/lib/types';
import { useAnimationLock } from '@/lib/useAnimationLock';

interface SwapToggle3DProps {
  isActive: boolean;
  defaultLabel: string;
  activeLabel: string;
  accentColor: string;
  darkAccentColor: string;
  isDark: boolean;
  onClick: () => void;
  title: string;
}

function SwapToggle3D({
  isActive,
  defaultLabel,
  activeLabel,
  accentColor,
  darkAccentColor,
  isDark,
  onClick,
  title,
}: SwapToggle3DProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const activeColor = isDark ? darkAccentColor : accentColor;

  const animFrame = useRef<number | null>(null);
  const targetTilt = useRef({ x: 0, y: 0 });
  const tiltRef = useRef({ x: 0, y: 0 });

  const startTiltLoop = useCallback(() => {
    const loop = () => {
      const tx = targetTilt.current.x;
      const ty = targetTilt.current.y;
      tiltRef.current = {
        x: tiltRef.current.x + (tx - tiltRef.current.x) * 0.15,
        y: tiltRef.current.y + (ty - tiltRef.current.y) * 0.15,
      };
      setTilt({ ...tiltRef.current });
      animFrame.current = requestAnimationFrame(loop);
    };
    animFrame.current = requestAnimationFrame(loop);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetTilt.current = { x: y * 12, y: x * -12 };
      if (!isHovered) {
        setIsHovered(true);
        startTiltLoop();
      }
    },
    [isHovered, startTiltLoop],
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    targetTilt.current = { x: 0, y: 0 };
    if (animFrame.current) cancelAnimationFrame(animFrame.current);
    const decay = () => {
      tiltRef.current = {
        x: tiltRef.current.x * 0.82,
        y: tiltRef.current.y * 0.82,
      };
      if (Math.abs(tiltRef.current.x) < 0.1 && Math.abs(tiltRef.current.y) < 0.1) {
        tiltRef.current = { x: 0, y: 0 };
        setTilt({ x: 0, y: 0 });
        return;
      }
      setTilt({ ...tiltRef.current });
      requestAnimationFrame(decay);
    };
    requestAnimationFrame(decay);
  }, []);

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="absolute -top-1 -right-1 z-20 group"
      whileTap={{ scale: 0.88, rotateZ: -8 }}
      title={title}
      style={{ perspective: '600px' }}
    >
      <motion.div
        className="relative flex items-center justify-center h-8 rounded-bl-2xl px-2.5 gap-1.5 overflow-hidden"
        style={{
          backgroundColor: activeColor,
          transformStyle: 'preserve-3d',
          rotateX: tilt.x,
          rotateY: tilt.y,
          boxShadow: isActive
            ? `0 0 14px ${activeColor}88, 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)`
            : `0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)`,
          transition: 'box-shadow 0.3s ease',
        }}
        whileHover={{
          boxShadow: `0 0 18px ${activeColor}AA, 0 6px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)`,
        }}
      >
        {/* Shimmer overlay on hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: isHovered
              ? `linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)`
              : 'none',
          }}
          transition={{ duration: 0.4 }}
        />

        <AnimatePresence mode="wait">
          <motion.span
            key={isActive ? 'active' : 'default'}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-white text-[10px] font-bold whitespace-nowrap relative z-10"
            style={{ transformOrigin: 'center' }}
          >
            {isActive ? activeLabel : defaultLabel}
          </motion.span>
        </AnimatePresence>

        <motion.div
          animate={{ rotate: isActive ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="relative z-10"
        >
          <ArrowLeftRight className="w-3 h-3 text-white/80" />
        </motion.div>

        {isActive && (
          <motion.span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#D4A373] border border-white z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          />
        )}
      </motion.div>
    </motion.button>
  );
}

interface Props {
  calculations: Calculations;
  splitBase: 'dose_perdas' | 'necessidade_liquida';
  v4v6Percent: number;
  v4v6Mode: 'single' | 'range';
  v4v6Percent2: number;
  v8v10Percent: number;
  v8v10Mode: 'single' | 'range';
  v8v10Percent2: number;
  baseDoseMode: 'single' | 'range';
}

export default function ParcelamentoSection({
  calculations,
  splitBase,
  v4v6Percent,
  v4v6Mode,
  v4v6Percent2,
  v8v10Percent,
  v8v10Mode,
  v8v10Percent2,
  baseDoseMode,
}: Props) {
  const { isDark } = useTheme();
  const [showCalcMeta, setShowCalcMeta] = useState(false);
  const [showCalcBase, setShowCalcBase] = useState(false);
  const [showCalcV4V6, setShowCalcV4V6] = useState(false);
  const [showCalcV8V10, setShowCalcV8V10] = useState(false);
  const [showCalcSoma, setShowCalcSoma] = useState(false);
  const [showCalcDif, setShowCalcDif] = useState(false);
  const [showAgronomicV4V6, setShowAgronomicV4V6] = useState(false);
  const [showAgronomicV8V10, setShowAgronomicV8V10] = useState(false);
  const { withLock } = useAnimationLock(400);

  const isV4V6Range = v4v6Mode === 'range' && v4v6Percent2 > 0;
  const isV8V10Range = v8v10Mode === 'range' && v8v10Percent2 > 0;

  const v4v6UserDiffersFromDefault =
    v4v6Percent !== 50 || v4v6Percent2 !== 60;
  const v8v10UserDiffersFromDefault =
    v8v10Percent !== 20 || v8v10Percent2 !== 30;

  const baseLabel = splitBase === 'dose_perdas' ? 'Dose com perdas' : 'N Líquido';

  return (
    <div
      id="parceling_section"
      className="calc-island-scoop bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-6 shadow-sm space-y-6 transition-colors relative"
    >
      <div className="border-b border-[#F0EDE5] dark:border-[#2C3328] pb-4 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-[#5A5A40] dark:text-[#E8E6DF] uppercase tracking-wider flex items-center gap-2">
            <Scale className="h-5 w-5 text-[#5A5A40] dark:text-[#9CB386]" /> Cronograma de Parcelamento
          </h3>
          <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-0.5">
            Comparação de dosagens em cada estádio fenológico (Foco da Questão)
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* META (base) */}
        <div className="relative">
          <CalculationIsland
            isVisible={showCalcMeta}
            onToggle={() => setShowCalcMeta(!showCalcMeta)}
            accentColor="#D4A373"
            darkAccentColor="#D4A373"
            isDark={isDark}
          />
          <div className="p-4 bg-[#F9F8F6] dark:bg-[#151813] rounded-2xl border border-dashed border-[#D4A373] dark:border-[#A27B5C] flex justify-between items-center">
            <div>
              <span className="bg-[#D4A373] text-white text-[9px] px-3 py-1 rounded-full uppercase font-bold inline-block mb-1.5">
                Meta (base)
              </span>
              <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-0.5">
                {splitBase === 'dose_perdas' ? 'Dose com Perdas' : 'Necessidade Líquida'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#3D3D3D] dark:text-[#E8E6DF]">
                {calculations.targetSplitTotal.toFixed(2)} <span className="text-xs font-semibold text-[#8C897E] dark:text-[#9EA399]">kg N/ha</span>
              </div>
            </div>
          </div>
          <CalculationMemoryPanel isVisible={showCalcMeta} isDark={isDark}>
            <div className={`p-3 rounded-lg border text-[11px] leading-relaxed space-y-1.5 ${
              isDark ? 'bg-[#232821] border-[#2C3328] text-[#E8E6DF]' : 'bg-white border-[#E5E2D9] text-[#3D3D3D]'
            }`}>
              <div className={`font-bold text-xs mb-2 ${isDark ? 'text-[#9CB386]' : 'text-[#5A5A40]'}`}>Meta (base):</div>
              <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Fórmula:</span> {splitBase === 'dose_perdas' ? 'Dose com Perdas (recommendedDose)' : 'Necessidade Líquida (liquidNeed)'}</div>
              <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Valor:</span> {calculations.targetSplitTotal.toFixed(2)} kg N/ha</div>
            </div>
          </CalculationMemoryPanel>
        </div>

        {/* 1st Application Display */}
        <div className="relative">
          <CalculationIsland
            isVisible={showCalcBase}
            onToggle={() => setShowCalcBase(!showCalcBase)}
            accentColor="#D4A373"
            darkAccentColor="#D4A373"
            isDark={isDark}
          />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-4 bg-[#F9F8F6] dark:bg-[#151813] rounded-2xl border border-dashed border-[#D4A373] dark:border-[#A27B5C]">
            <div>
              <span className="bg-[#D4A373] text-white text-[9px] px-3 py-1 rounded-full uppercase font-bold inline-block mb-1.5">
                1ª Aplicação: Base
              </span>
              <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-0.5">
                Padrão agronômico inicial: <strong>30 a 40 kg N/ha</strong>
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#3D3D3D] dark:text-[#E8E6DF]">
                {calculations.base1_kg.toFixed(2)} <span className="text-xs font-semibold text-[#8C897E] dark:text-[#9EA399]">kg N/ha</span>
              </div>
              <span className="text-[10px] text-[#D4A373] dark:text-[#E0A96D] font-serif italic font-bold">Aplicado na base</span>
            </div>
          </div>
          <CalculationMemoryPanel isVisible={showCalcBase} isDark={isDark}>
            <div className={`p-3 rounded-lg border text-[11px] leading-relaxed space-y-1.5 ${
              isDark ? 'bg-[#232821] border-[#2C3328] text-[#E8E6DF]' : 'bg-white border-[#E5E2D9] text-[#3D3D3D]'
            }`}>
              <div className={`font-bold text-xs mb-2 ${isDark ? 'text-[#9CB386]' : 'text-[#5A5A40]'}`}>1ª Base:</div>
              <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Valor absoluto:</span> {calculations.base1_kg.toFixed(2)} kg N/ha</div>
            </div>
          </CalculationMemoryPanel>
        </div>

        {/* 2nd Application — V4-V6 */}
        <div className="relative">
          <CalculationIsland
            isVisible={showCalcV4V6}
            onToggle={() => setShowCalcV4V6(!showCalcV4V6)}
            accentColor="#5A5A40"
            darkAccentColor="#3D4D35"
            isDark={isDark}
          />
          <div
            className="p-4 bg-[#F9F8F6] dark:bg-[#151813] rounded-2xl border border-dashed border-[#5A5A40] dark:border-[#4B5E40] space-y-3 relative"
            style={{ perspective: '800px' }}
          >
          {/* Toggle button for agronomic default — hidden when baseDoseMode is single */}
          {baseDoseMode !== 'single' && v4v6UserDiffersFromDefault && (
            <SwapToggle3D
              isActive={showAgronomicV4V6}
              defaultLabel="50-60"
              activeLabel={`${v4v6Percent}${v4v6Percent2 > 0 ? `-${v4v6Percent2}` : ''}`}
              accentColor="#5A5A40"
              darkAccentColor="#3D4D35"
              isDark={isDark}
              onClick={withLock(() => setShowAgronomicV4V6(!showAgronomicV4V6))}
              title={showAgronomicV4V6 ? 'Voltar para seus valores' : 'Ver padrão agronômico (50-60%)'}
            />
          )}

          <div className="flex justify-between items-start">
            <div>
              <span className="bg-[#5A5A40] dark:bg-[#3D4D35] text-white text-[9px] px-3 py-1 rounded-full uppercase font-bold inline-block mb-1.5">
                2ª Aplicação: V4-V6
              </span>
              <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-0.5">
                {baseDoseMode === 'single' ? (
                  <>Modo único: <strong>{v4v6Percent}%</strong> da meta ({baseLabel})</>
                ) : (
                  <>Padrão agronômico: <strong>50% a 60%</strong> da meta ({baseLabel})</>
                )}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {baseDoseMode === 'single' ? (
              <motion.div
                key="locked-single-v4v6"
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 22,
                  mass: 0.8,
                  opacity: { duration: 0.2 },
                }}
                style={{ transformOrigin: 'top center' }}
                className="pt-2 border-t border-[#F0EDE5] dark:border-[#2C3328] text-center"
              >
                <div className="bg-white dark:bg-[#232821] p-3 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328]">
                  <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] block">Com {v4v6Percent}%</span>
                  <span className="text-xl font-bold text-[#3D3D3D] dark:text-[#E8E6DF] mt-0.5 block">
                    {calculations.v4v6_1_kg.toFixed(2)} <span className="text-xs font-normal text-[#8C897E] dark:text-[#9EA399]">kg/ha</span>
                  </span>
                </div>
              </motion.div>
            ) : showAgronomicV4V6 ? (
              <motion.div
                key="agronomic-v4v6"
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 22,
                  mass: 0.8,
                  opacity: { duration: 0.2 },
                }}
                style={{ transformOrigin: 'top center' }}
                className="grid grid-cols-2 gap-4 pt-2 border-t border-[#F0EDE5] dark:border-[#2C3328] text-center"
              >
                <div className="bg-white dark:bg-[#232821] p-2.5 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328]">
                  <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] block">Com 50%</span>
                  <span className="text-base font-bold text-[#3D3D3D] dark:text-[#E8E6DF] mt-0.5 block">
                    {calculations.v4v6_50.toFixed(2)} <span className="text-xs font-normal text-[#8C897E] dark:text-[#9EA399]">kg/ha</span>
                  </span>
                </div>
                <div className="bg-white dark:bg-[#232821] p-2.5 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328]">
                  <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] block">Com 60%</span>
                  <span className="text-base font-bold text-[#3D3D3D] dark:text-[#E8E6DF] mt-0.5 block">
                    {calculations.v4v6_60.toFixed(2)} <span className="text-xs font-normal text-[#8C897E] dark:text-[#9EA399]">kg/ha</span>
                  </span>
                </div>
              </motion.div>
            ) : isV4V6Range ? (
              <motion.div
                key="user-range-v4v6"
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 22,
                  mass: 0.8,
                  opacity: { duration: 0.2 },
                }}
                style={{ transformOrigin: 'top center' }}
                className="grid grid-cols-2 gap-4 pt-2 border-t border-[#F0EDE5] dark:border-[#2C3328] text-center"
              >
                <div className="bg-white dark:bg-[#232821] p-2.5 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328]">
                  <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] block">Com {v4v6Percent}%</span>
                  <span className="text-base font-bold text-[#3D3D3D] dark:text-[#E8E6DF] mt-0.5 block">
                    {calculations.v4v6_1_kg.toFixed(2)} <span className="text-xs font-normal text-[#8C897E] dark:text-[#9EA399]">kg/ha</span>
                  </span>
                </div>
                <div className="bg-white dark:bg-[#232821] p-2.5 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328]">
                  <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] block">Com {v4v6Percent2}%</span>
                  <span className="text-base font-bold text-[#3D3D3D] dark:text-[#E8E6DF] mt-0.5 block">
                    {calculations.v4v6_2_kg.toFixed(2)} <span className="text-xs font-normal text-[#8C897E] dark:text-[#9EA399]">kg/ha</span>
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="user-single-v4v6"
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 22,
                  mass: 0.8,
                  opacity: { duration: 0.2 },
                }}
                style={{ transformOrigin: 'top center' }}
                className="pt-2 border-t border-[#F0EDE5] dark:border-[#2C3328] text-center"
              >
                <div className="bg-white dark:bg-[#232821] p-3 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328]">
                  <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] block">Com {v4v6Percent}%</span>
                  <span className="text-xl font-bold text-[#3D3D3D] dark:text-[#E8E6DF] mt-0.5 block">
                    {calculations.v4v6_1_kg.toFixed(2)} <span className="text-xs font-normal text-[#8C897E] dark:text-[#9EA399]">kg/ha</span>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
          <CalculationMemoryPanel isVisible={showCalcV4V6} isDark={isDark}>
            <div className={`p-3 rounded-lg border text-[11px] leading-relaxed space-y-1.5 ${
              isDark ? 'bg-[#232821] border-[#2C3328] text-[#E8E6DF]' : 'bg-white border-[#E5E2D9] text-[#3D3D3D]'
            }`}>
              <div className={`font-bold text-xs mb-2 ${isDark ? 'text-[#9CB386]' : 'text-[#5A5A40]'}`}>2ª V4-V6:</div>
              {baseDoseMode === 'single' ? (
                <>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Percentual:</span> {v4v6Percent}%</div>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Fórmula:</span> {v4v6Percent}% × {calculations.targetSplitTotal.toFixed(2)}</div>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Resultado:</span> {calculations.v4v6_1_kg.toFixed(2)} kg N/ha</div>
                </>
              ) : isV4V6Range ? (
                <>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Faixa:</span> {v4v6Percent}% a {v4v6Percent2}%</div>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Min:</span> {v4v6Percent}% × {calculations.targetSplitTotal.toFixed(2)} = {calculations.v4v6_1_kg.toFixed(2)} kg N/ha</div>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Max:</span> {v4v6Percent2}% × {calculations.targetSplitTotal.toFixed(2)} = {calculations.v4v6_2_kg.toFixed(2)} kg N/ha</div>
                </>
              ) : (
                <>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Percentual:</span> {v4v6Percent}%</div>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Fórmula:</span> {v4v6Percent}% × {calculations.targetSplitTotal.toFixed(2)}</div>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Resultado:</span> {calculations.v4v6_1_kg.toFixed(2)} kg N/ha</div>
                </>
              )}
            </div>
          </CalculationMemoryPanel>
        </div>

        {/* 3rd Application — V8-V10 */}
        <div className="relative">
          <CalculationIsland
            isVisible={showCalcV8V10}
            onToggle={() => setShowCalcV8V10(!showCalcV8V10)}
            accentColor="#8D6E63"
            darkAccentColor="#6D544C"
            isDark={isDark}
          />
          <div
            className="p-4 bg-[#F9F8F6] dark:bg-[#151813] rounded-2xl border border-dashed border-[#8D6E63] dark:border-[#6D544C] space-y-3 relative"
            style={{ perspective: '800px' }}
          >
          {/* Toggle button for agronomic default — hidden when baseDoseMode is single */}
          {baseDoseMode !== 'single' && v8v10UserDiffersFromDefault && (
            <SwapToggle3D
              isActive={showAgronomicV8V10}
              defaultLabel="20-30"
              activeLabel={`${v8v10Percent}${v8v10Percent2 > 0 ? `-${v8v10Percent2}` : ''}`}
              accentColor="#8D6E63"
              darkAccentColor="#6D544C"
              isDark={isDark}
              onClick={withLock(() => setShowAgronomicV8V10(!showAgronomicV8V10))}
              title={showAgronomicV8V10 ? 'Voltar para seus valores' : 'Ver padrão agronômico (20-30%)'}
            />
          )}

          <div className="flex justify-between items-start">
            <div>
              <span className="bg-[#8D6E63] dark:bg-[#6D544C] text-white text-[9px] px-3 py-1 rounded-full uppercase font-bold inline-block mb-1.5">
                3ª Aplicação: V8-V10
              </span>
              <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-0.5">
                {baseDoseMode === 'single' ? (
                  <>Auto-calculado: <strong>{calculations.v8v10_1_auto}%</strong> da meta ({baseLabel})</>
                ) : (
                  <>Padrão agronômico: <strong>20% a 30%</strong> da meta ({baseLabel})</>
                )}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {baseDoseMode === 'single' ? (
              <motion.div
                key="auto-v8v10"
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 22,
                  mass: 0.8,
                  opacity: { duration: 0.2 },
                }}
                style={{ transformOrigin: 'top center' }}
                className="pt-2 border-t border-[#F0EDE5] dark:border-[#2C3328] text-center"
              >
                <div className="bg-white dark:bg-[#232821] p-3 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328]">
                  <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] block">Auto-calculado: {calculations.v8v10_1_auto}%</span>
                  <span className="text-xl font-bold text-[#8D6E63] dark:text-[#D4A373] mt-0.5 block">
                    {calculations.v8v10_1_kg.toFixed(2)} <span className="text-xs font-normal text-[#8C897E] dark:text-[#9EA399]">kg/ha</span>
                  </span>
                </div>
              </motion.div>
            ) : showAgronomicV8V10 ? (
              <motion.div
                key="agronomic-v8v10"
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 22,
                  mass: 0.8,
                  opacity: { duration: 0.2 },
                }}
                style={{ transformOrigin: 'top center' }}
                className="grid grid-cols-2 gap-4 pt-2 border-t border-[#F0EDE5] dark:border-[#2C3328] text-center"
              >
                <div className="bg-white dark:bg-[#232821] p-2.5 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328]">
                  <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] block">Com 20%</span>
                  <span className="text-base font-bold text-[#3D3D3D] dark:text-[#E8E6DF] mt-0.5 block">
                    {calculations.v8v10_20.toFixed(2)} <span className="text-xs font-normal text-[#8C897E] dark:text-[#9EA399]">kg/ha</span>
                  </span>
                </div>
                <div className="bg-white dark:bg-[#232821] p-2.5 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328]">
                  <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] block">Com 30%</span>
                  <span className="text-base font-bold text-[#3D3D3D] dark:text-[#E8E6DF] mt-0.5 block">
                    {calculations.v8v10_30.toFixed(2)} <span className="text-xs font-normal text-[#8C897E] dark:text-[#9EA399]">kg/ha</span>
                  </span>
                </div>
              </motion.div>
            ) : isV8V10Range ? (
              <motion.div
                key="user-range-v8v10"
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 22,
                  mass: 0.8,
                  opacity: { duration: 0.2 },
                }}
                style={{ transformOrigin: 'top center' }}
                className="grid grid-cols-2 gap-4 pt-2 border-t border-[#F0EDE5] dark:border-[#2C3328] text-center"
              >
                <div className="bg-white dark:bg-[#232821] p-2.5 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328]">
                  <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] block">Com {calculations.v8v10_1_final}%</span>
                  <span className="text-base font-bold text-[#3D3D3D] dark:text-[#E8E6DF] mt-0.5 block">
                    {calculations.v8v10_1_kg.toFixed(2)} <span className="text-xs font-normal text-[#8C897E] dark:text-[#9EA399]">kg/ha</span>
                  </span>
                </div>
                <div className="bg-white dark:bg-[#232821] p-2.5 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328]">
                  <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] block">Com {calculations.v8v10_2_final}%</span>
                  <span className="text-base font-bold text-[#3D3D3D] dark:text-[#E8E6DF] mt-0.5 block">
                    {calculations.v8v10_2_kg.toFixed(2)} <span className="text-xs font-normal text-[#8C897E] dark:text-[#9EA399]">kg/ha</span>
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="user-single-v8v10"
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 22,
                  mass: 0.8,
                  opacity: { duration: 0.2 },
                }}
                style={{ transformOrigin: 'top center' }}
                className="pt-2 border-t border-[#F0EDE5] dark:border-[#2C3328] text-center"
              >
                <div className="bg-white dark:bg-[#232821] p-3 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328]">
                  <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] block">Com {calculations.v8v10_1_final}%</span>
                  <span className="text-xl font-bold text-[#3D3D3D] dark:text-[#E8E6DF] mt-0.5 block">
                    {calculations.v8v10_1_kg.toFixed(2)} <span className="text-xs font-normal text-[#8C897E] dark:text-[#9EA399]">kg/ha</span>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
          <CalculationMemoryPanel isVisible={showCalcV8V10} isDark={isDark}>
            <div className={`p-3 rounded-lg border text-[11px] leading-relaxed space-y-1.5 ${
              isDark ? 'bg-[#232821] border-[#2C3328] text-[#E8E6DF]' : 'bg-white border-[#E5E2D9] text-[#3D3D3D]'
            }`}>
              <div className={`font-bold text-xs mb-2 ${isDark ? 'text-[#9CB386]' : 'text-[#5A5A40]'}`}>3ª V8-V10:</div>
              {baseDoseMode === 'single' ? (
                <>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Auto-calculado:</span> {calculations.v8v10_1_auto}%</div>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Fórmula:</span> {calculations.targetSplitTotal.toFixed(2)} - ({calculations.v4v6_1_kg.toFixed(2)} + {calculations.base1_kg.toFixed(2)})</div>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Resultado:</span> {calculations.v8v10_1_kg.toFixed(2)} kg N/ha</div>
                </>
              ) : isV8V10Range ? (
                <>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Faixa:</span> {calculations.v8v10_1_final}% a {calculations.v8v10_2_final}%</div>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Min:</span> {calculations.v8v10_1_final}% × {calculations.targetSplitTotal.toFixed(2)} = {calculations.v8v10_1_kg.toFixed(2)} kg N/ha</div>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Max:</span> {calculations.v8v10_2_final}% × {calculations.targetSplitTotal.toFixed(2)} = {calculations.v8v10_2_kg.toFixed(2)} kg N/ha</div>
                </>
              ) : (
                <>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Percentual:</span> {calculations.v8v10_1_final}%</div>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Fórmula:</span> {calculations.v8v10_1_final}% × {calculations.targetSplitTotal.toFixed(2)}</div>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Resultado:</span> {calculations.v8v10_1_kg.toFixed(2)} kg N/ha</div>
                </>
              )}
            </div>
          </CalculationMemoryPanel>
        </div>

        {/* DIFFERENCE BETWEEN BOTH SELECTED MAIN APPLICATIONS — always uses user values */}
        <div className="relative">
          <CalculationIsland
            isVisible={showCalcDif}
            onToggle={() => setShowCalcDif(!showCalcDif)}
            accentColor="#5A5A40"
            darkAccentColor="#9CB386"
            isDark={isDark}
          />
          <div className="p-4 bg-[#F9F8F6] dark:bg-[#151813] rounded-2xl border border-[#E5E2D9] dark:border-[#2C3328] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-[#8C897E] dark:text-[#9EA399]" />
              <div>
                <span className="text-xs font-bold text-[#3D3D3D] dark:text-[#E8E6DF]">
                  Diferença entre as duas doses principais
                </span>
                <p className="text-[10px] text-[#8C897E] dark:text-[#9EA399]">Módulo da diferença: | V4-V6 - V8-V10 |</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-[#5A5A40] dark:text-[#9CB386]">
                {calculations.splitDifference.toFixed(2)} kg N/ha
              </span>
            </div>
          </div>
          <CalculationMemoryPanel isVisible={showCalcDif} isDark={isDark}>
            <div className={`p-3 rounded-lg border text-[11px] leading-relaxed space-y-1.5 ${
              isDark ? 'bg-[#232821] border-[#2C3328] text-[#E8E6DF]' : 'bg-white border-[#E5E2D9] text-[#3D3D3D]'
            }`}>
              <div className={`font-bold text-xs mb-2 ${isDark ? 'text-[#9CB386]' : 'text-[#5A5A40]'}`}>Diferença V4-V6 vs V8-V10:</div>
              <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Fórmula:</span> | V4-V6 - V8-V10 |</div>
              <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>V4-V6:</span> {calculations.v4v6_1_kg.toFixed(2)} kg N/ha</div>
              <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>V8-V10:</span> {calculations.v8v10_1_kg.toFixed(2)} kg N/ha</div>
              <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Resultado:</span> {calculations.splitDifference.toFixed(2)} kg N/ha</div>
            </div>
          </CalculationMemoryPanel>
        </div>
      </div>

      {/* Soma / Verification */}
      <div className="relative">
        <CalculationIsland
          isVisible={showCalcSoma}
          onToggle={() => setShowCalcSoma(!showCalcSoma)}
          accentColor="#D4A373"
          darkAccentColor="#D4A373"
          isDark={isDark}
        />
        {baseDoseMode === 'single' ? (
          <div className="bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-3 mb-3">
            <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase block">3ª V8-V10</span>
            <span className="text-base font-bold text-[#8D6E63] dark:text-[#CBB5A1] block mt-1">
              {calculations.targetSplitTotal.toFixed(2)} - ({calculations.v4v6_1_kg.toFixed(2)} + {calculations.base1_kg.toFixed(2)}) = {calculations.v8v10_1_kg.toFixed(2)} kg N/ha
            </span>
            <p className="text-[10px] text-[#8C897E] dark:text-[#9EA399] mt-0.5">Dose Total a Aplicar - (Aplicação: V4-V6 + Aplicação: Base)</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-3 mb-3">
            <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase block">3ª V8-V10</span>
            <span className="text-base font-bold text-[#8D6E63] dark:text-[#CBB5A1] block mt-1">
              {calculations.v8v10_1_final}% × {calculations.targetSplitTotal.toFixed(2)} = {calculations.v8v10_1_kg.toFixed(2)} kg N/ha
            </span>
            <p className="text-[10px] text-[#8C897E] dark:text-[#9EA399] mt-0.5">Percentual da meta</p>
          </div>
        )}
        <CalculationMemoryPanel isVisible={showCalcSoma} isDark={isDark}>
          <div className={`p-3 rounded-lg border text-[11px] leading-relaxed space-y-1.5 ${
            isDark ? 'bg-[#232821] border-[#2C3328] text-[#E8E6DF]' : 'bg-white border-[#E5E2D9] text-[#3D3D3D]'
          }`}>
            <div className={`font-bold text-xs mb-2 ${isDark ? 'text-[#9CB386]' : 'text-[#5A5A40]'}`}>Soma / Verificação:</div>
            <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>1ª Base:</span> {calculations.base1_kg.toFixed(2)} kg N/ha (valor absoluto)</div>
            <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>2ª V4-V6:</span> {calculations.v4v6_1}% × {calculations.targetSplitTotal.toFixed(2)} = {calculations.v4v6_1_kg.toFixed(2)} kg N/ha</div>
            <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>3ª V8-V10:</span> {calculations.v8v10_1_final}% × {calculations.targetSplitTotal.toFixed(2)} = {calculations.v8v10_1_kg.toFixed(2)} kg N/ha</div>
            <div className={`border-t pt-1.5 mt-1.5 font-bold ${isDark ? 'border-[#2C3328] text-[#D4A373]' : 'border-[#F0EDE5] text-[#8D6E63]'}`}>
              Soma: {calculations.base1_kg.toFixed(2)} + {calculations.v4v6_1_kg.toFixed(2)} + {calculations.v8v10_1_kg.toFixed(2)} = {calculations.sumOfSplits.toFixed(2)} kg N/ha
            </div>
          </div>
        </CalculationMemoryPanel>
      </div>
    </div>
  );
}
