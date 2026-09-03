'use client';

import React, { useState } from 'react';
import { Scale, ArrowRightLeft, ArrowLeftRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CalculationIsland from '@/components/CalculationIsland';
import CalculationMemoryPanel from '@/components/CalculationMemoryPanel';
import { useTheme } from '@/components/ThemeProvider';
import { Calculations } from '@/lib/types';

interface Props {
  calculations: Calculations;
  splitBase: 'dose_perdas' | 'necessidade_liquida';
  v4v6Percent: number;
  v4v6Mode: 'single' | 'range';
  v4v6Percent2: number;
  v8v10Percent: number;
  v8v10Mode: 'single' | 'range';
  v8v10Percent2: number;
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
}: Props) {
  const { isDark } = useTheme();
  const [showCalc, setShowCalc] = useState(false);
  const [showAgronomicV4V6, setShowAgronomicV4V6] = useState(false);
  const [showAgronomicV8V10, setShowAgronomicV8V10] = useState(false);

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
      <CalculationIsland
        isVisible={showCalc}
        onToggle={() => setShowCalc(!showCalc)}
        accentColor="#D4A373"
        darkAccentColor="#D4A373"
        isDark={isDark}
      />

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
        {/* 1st Application Display */}
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

        {/* 2nd Application — V4-V6 */}
        <div
          className="p-4 bg-[#F9F8F6] dark:bg-[#151813] rounded-2xl border border-dashed border-[#5A5A40] dark:border-[#4B5E40] space-y-3 relative"
          style={{ perspective: '800px' }}
        >
          {/* Toggle button for agronomic default */}
          {v4v6UserDiffersFromDefault && (
            <motion.button
              type="button"
              onClick={() => setShowAgronomicV4V6(!showAgronomicV4V6)}
              className="absolute -top-1 -right-1 z-20 group"
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.92 }}
              title={showAgronomicV4V6 ? 'Voltar para seus valores' : 'Ver padrão agronômico (50-60%)'}
            >
              <div
                className="relative flex items-center justify-center h-8 rounded-bl-2xl px-2.5 transition-all duration-300 gap-1"
                style={{
                  backgroundColor: isDark ? '#3D4D35' : '#5A5A40',
                  boxShadow: showAgronomicV4V6
                    ? `0 0 12px ${isDark ? '#3D4D35' : '#5A5A40'}88, 0 2px 8px rgba(0,0,0,0.15)`
                    : '0 2px 6px rgba(0,0,0,0.12)',
                }}
              >
                <span className="text-white text-[10px] font-bold whitespace-nowrap">
                  {showAgronomicV4V6 ? `${v4v6Percent}${v4v6Percent2 > 0 ? `-${v4v6Percent2}` : ''}` : '50-60'}
                </span>
                <ArrowLeftRight className="w-3 h-3 text-white/80" />
                {showAgronomicV4V6 && (
                  <motion.span
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#D4A373] border border-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  />
                )}
              </div>
            </motion.button>
          )}

          <div className="flex justify-between items-start">
            <div>
              <span className="bg-[#5A5A40] dark:bg-[#3D4D35] text-white text-[9px] px-3 py-1 rounded-full uppercase font-bold inline-block mb-1.5">
                2ª Aplicação: V4-V6
              </span>
              <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-0.5">
                Padrão agronômico: <strong>50% a 60%</strong> da meta ({baseLabel})
              </p>
            </div>
            {/* User percentage badge */}
            {!showAgronomicV4V6 && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#5A5A40] dark:text-[#9CB386] bg-[#FDFBF7] dark:bg-[#232821] border border-[#E5E2D9] dark:border-[#2C3328] px-2.5 py-1 rounded-md">
                  {v4v6Percent}{v4v6Percent2 > 0 ? `-${v4v6Percent2}` : ''}% ({calculations.v4v6_1_kg} kg N/ha)
                  {calculations.v4v6_2_kg > 0 && ` a ${calculations.v4v6_2_kg} kg N/ha`}
                </span>
              </div>
            )}
            {showAgronomicV4V6 && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#5A5A40] dark:text-[#9CB386] bg-[#FDFBF7] dark:bg-[#232821] border border-[#E5E2D9] dark:border-[#2C3328] px-2.5 py-1 rounded-md">
                  Padrão: 50-60%
                </span>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {showAgronomicV4V6 ? (
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

        {/* 3rd Application — V8-V10 */}
        <div
          className="p-4 bg-[#F9F8F6] dark:bg-[#151813] rounded-2xl border border-dashed border-[#8D6E63] dark:border-[#6D544C] space-y-3 relative"
          style={{ perspective: '800px' }}
        >
          {/* Toggle button for agronomic default */}
          {v8v10UserDiffersFromDefault && (
            <motion.button
              type="button"
              onClick={() => setShowAgronomicV8V10(!showAgronomicV8V10)}
              className="absolute -top-1 -right-1 z-20 group"
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.92 }}
              title={showAgronomicV8V10 ? 'Voltar para seus valores' : 'Ver padrão agronômico (20-30%)'}
            >
              <div
                className="relative flex items-center justify-center h-8 rounded-bl-2xl px-2.5 transition-all duration-300 gap-1"
                style={{
                  backgroundColor: isDark ? '#6D544C' : '#8D6E63',
                  boxShadow: showAgronomicV8V10
                    ? `0 0 12px ${isDark ? '#6D544C' : '#8D6E63'}88, 0 2px 8px rgba(0,0,0,0.15)`
                    : '0 2px 6px rgba(0,0,0,0.12)',
                }}
              >
                <span className="text-white text-[10px] font-bold whitespace-nowrap">
                  {showAgronomicV8V10 ? `${v8v10Percent}${v8v10Percent2 > 0 ? `-${v8v10Percent2}` : ''}` : '20-30'}
                </span>
                <ArrowLeftRight className="w-3 h-3 text-white/80" />
                {showAgronomicV8V10 && (
                  <motion.span
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#D4A373] border border-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  />
                )}
              </div>
            </motion.button>
          )}

          <div className="flex justify-between items-start">
            <div>
              <span className="bg-[#8D6E63] dark:bg-[#6D544C] text-white text-[9px] px-3 py-1 rounded-full uppercase font-bold inline-block mb-1.5">
                3ª Aplicação: V8-V10
              </span>
              <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-0.5">
                Padrão agronômico: <strong>20% a 30%</strong> da meta ({baseLabel})
              </p>
            </div>
            {!showAgronomicV8V10 && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#8D6E63] dark:text-[#D4A373] bg-[#FDFBF7] dark:bg-[#232821] border border-[#E5E2D9] dark:border-[#2C3328] px-2.5 py-1 rounded-md">
                  {calculations.v8v10_1_final}% ({calculations.v8v10_1_kg} kg N/ha)
                  {calculations.v8v10_2_final > 0 && ` a ${calculations.v8v10_2_final}% (${calculations.v8v10_2_kg} kg N/ha)`}
                </span>
              </div>
            )}
            {showAgronomicV8V10 && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#8D6E63] dark:text-[#D4A373] bg-[#FDFBF7] dark:bg-[#232821] border border-[#E5E2D9] dark:border-[#2C3328] px-2.5 py-1 rounded-md">
                  Padrão: 20-30%
                </span>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {showAgronomicV8V10 ? (
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

        {/* DIFFERENCE BETWEEN BOTH SELECTED MAIN APPLICATIONS — always uses user values */}
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
      </div>

      <CalculationMemoryPanel isVisible={showCalc} isDark={isDark}>
        <div className={`p-3 rounded-lg border text-[11px] leading-relaxed space-y-1.5 ${
          isDark ? 'bg-[#232821] border-[#2C3328] text-[#E8E6DF]' : 'bg-white border-[#E5E2D9] text-[#3D3D3D]'
        }`}>
          <div className={`font-bold text-xs mb-2 ${isDark ? 'text-[#9CB386]' : 'text-[#5A5A40]'}`}>Cronograma de Parcelamento:</div>
          <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Meta (base):</span> {calculations.targetSplitTotal.toFixed(2)} kg N/ha</div>
          <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>1ª Base:</span> {calculations.base1_kg} kg N/ha (valor absoluto)</div>
          <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>2ª V4-V6:</span> {calculations.v4v6_1}% × {calculations.targetSplitTotal.toFixed(2)} = {calculations.v4v6_1_kg} kg N/ha</div>
          <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>3ª V8-V10:</span> {calculations.v8v10_1_final}% × {calculations.targetSplitTotal.toFixed(2)} = {calculations.v8v10_1_kg} kg N/ha</div>
          <div className={`border-t pt-1.5 mt-1.5 font-bold ${isDark ? 'border-[#2C3328] text-[#D4A373]' : 'border-[#F0EDE5] text-[#8D6E63]'}`}>
            Soma: {calculations.base1_kg} + {calculations.v4v6_1_kg} + {calculations.v8v10_1_kg} = {calculations.sumOfSplits} kg N/ha
          </div>
          <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Diferença V4-V6 vs V8-V10:</span> {calculations.splitDifference.toFixed(2)} kg N/ha</div>
        </div>
      </CalculationMemoryPanel>
    </div>
  );
}
