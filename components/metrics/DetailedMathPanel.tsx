'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { Calculations } from '@/lib/types';

interface Props {
  calculations: Calculations;
  mosNContribution: number;
  soyNContribution: number;
}

export default function DetailedMathPanel({ calculations, mosNContribution, soyNContribution }: Props) {
  const { isDark } = useTheme();

  return (
    <section id="detailed_math_panel" className="bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-6 shadow-sm transition-colors">
      <div className="bg-[#FDFBF7] dark:bg-[#151813] border border-[#E5E2D9] dark:border-[#2C3328] p-5 rounded-xl text-xs text-[#3D3D3D] dark:text-[#E8E6DF] leading-relaxed space-y-2">
        <h4 className="font-bold text-[#5A5A40] dark:text-[#9CB386] flex items-center gap-1.5 text-sm">
          <Info className="h-4 w-4 text-[#5A5A40] dark:text-[#9CB386]" /> Resumo de Respostas e Conferência (Pronto para Copiar)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans pt-2">
          <div className="space-y-1.5">
            <div>• <strong>Necessidade total de N (Extração):</strong> {calculations.totalExtraction.toFixed(2)} kg N/ha</div>
            <div>• <strong>N proveniente da MOS:</strong> {mosNContribution.toFixed(2)} kg N/ha</div>
            <div>• <strong>Crédito da Soja:</strong> {soyNContribution.toFixed(2)} kg N/ha</div>
            <div>• <strong>Necessidade líquida de N:</strong> {calculations.liquidNeed.toFixed(2)} kg N/ha</div>
            <div>• <strong>Dose de N a aplicar (com perdas):</strong> {calculations.recommendedDose.toFixed(2)} kg N/ha</div>
          </div>
          <div className="space-y-1.5">
            <div>• <strong>Dose aplicada na Base:</strong> {calculations.base1_kg} kg N/ha</div>
            <div>• <strong>Faixa V4-V6 (50% a 60%):</strong> {calculations.v4v6_50.toFixed(2)} a {calculations.v4v6_60.toFixed(2)} kg N/ha</div>
            <div>• <strong>Faixa V8-V10 (20% a 30%):</strong> {calculations.v8v10_20.toFixed(2)} a {calculations.v8v10_30.toFixed(2)} kg N/ha</div>
            <div>• <strong>Diferença de dose (V4-V6 vs V8-V10):</strong> {calculations.splitDifference} kg N/ha</div>
            <div>• <strong>Soma das parcelas aplicadas:</strong> {calculations.sumOfSplits} kg N/ha (Meta: {calculations.targetSplitTotal} kg N/ha)</div>
          </div>
        </div>
      </div>
    </section>
  );
}
