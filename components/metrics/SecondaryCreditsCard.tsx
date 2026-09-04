'use client';

import React from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface Props {
  totalExtraction: number;
  mosNContribution: number;
  soyNContribution: number;
}

export default function SecondaryCreditsCard({ totalExtraction, mosNContribution, soyNContribution }: Props) {
  const { isDark } = useTheme();

  const mosResult = Number((totalExtraction - mosNContribution).toFixed(2));
  const soyResult = Number((totalExtraction - soyNContribution).toFixed(2));

  return (
    <div className="bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-5 shadow-sm grid grid-cols-2 gap-4 transition-colors">
      <div className="border-r border-[#F0EDE5] dark:border-[#2C3328] pr-2">
        <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase block">
          N Proveniente da MOS
        </span>
        <span className={`text-[10px] font-mono mt-1 block ${isDark ? 'text-[#9CB386]' : 'text-[#5A5A40]'}`}>
          E = Extração Total (Cultivo) − N fornecido pela M.O. (MOS)
        </span>
        <span className={`text-xs font-bold mt-0.5 block ${isDark ? 'text-[#D4A373]' : 'text-[#8D6E63]'}`}>
          {totalExtraction.toFixed(2)} − {mosNContribution.toFixed(2)} = {mosResult.toFixed(2)} kg N/ha
        </span>
        <p className="text-[10px] text-[#8C897E] dark:text-[#9EA399] mt-0.5">Reduz a necessidade química</p>
      </div>
      <div className="pl-2">
        <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase block">
          Crédito da Soja
        </span>
        <span className={`text-[10px] font-mono mt-1 block ${isDark ? 'text-[#9CB386]' : 'text-[#5A5A40]'}`}>
          E = Extração Total (Cultivo) − Crédito de N pela Soja (cultura anterior)
        </span>
        <span className={`text-xs font-bold mt-0.5 block ${isDark ? 'text-[#D4A373]' : 'text-[#8D6E63]'}`}>
          {totalExtraction.toFixed(2)} − {soyNContribution.toFixed(2)} = {soyResult.toFixed(2)} kg N/ha
        </span>
        <p className="text-[10px] text-[#8C897E] dark:text-[#9EA399] mt-0.5">Leguminosa anterior</p>
      </div>
    </div>
  );
}
