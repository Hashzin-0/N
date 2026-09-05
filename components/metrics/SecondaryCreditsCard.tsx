'use client';

import React from 'react';
import { useTheme } from '@/components/ThemeProvider';
import CalculationIsland from '@/components/CalculationIsland';
import CalculationMemoryPanel from '@/components/CalculationMemoryPanel';

interface Props {
  totalExtraction: number;
  mosNContribution: number;
  soyNContribution: number;
}

export default function SecondaryCreditsCard({ totalExtraction, mosNContribution, soyNContribution }: Props) {
  const { isDark } = useTheme();
  const [showMosCalc, setShowMosCalc] = React.useState(false);
  const [showSoyCalc, setShowSoyCalc] = React.useState(false);

  const mosResult = Number((totalExtraction - mosNContribution).toFixed(2));
  const soyResult = Number((totalExtraction - soyNContribution).toFixed(2));

  return (
    <div className="bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-5 shadow-sm grid grid-cols-2 gap-4 transition-colors">
      <div className="relative border-r border-[#F0EDE5] dark:border-[#2C3328] pr-2">
        <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase block">
          N Proveniente da MOS
        </span>
        <div className="mt-1.5 text-2xl font-bold text-[#5A5A40] dark:text-[#9CB386]">
          {mosResult.toFixed(2)}{' '}
          <span className="text-xs font-semibold text-[#8C897E] dark:text-[#9EA399]">kg N/ha</span>
        </div>
        <div className="mt-2 text-[10px] text-[#8C897E] dark:text-[#9EA399] border-t border-[#F0EDE5] dark:border-[#2C3328] pt-2 font-medium">
          Extração − MOS
        </div>
        <CalculationIsland
          isVisible={showMosCalc}
          onToggle={() => setShowMosCalc(!showMosCalc)}
          accentColor="#5A5A40"
          darkAccentColor="#9CB386"
          isDark={isDark}
        />
        <CalculationMemoryPanel isVisible={showMosCalc} isDark={isDark}>
          <div>E = Extração Total (Cultivo) − N fornecido pela M.O. (MOS)</div>
          <div>{totalExtraction.toFixed(2)} − {mosNContribution.toFixed(2)} = {mosResult.toFixed(2)} kg N/ha</div>
          <p>Reduz a necessidade química</p>
        </CalculationMemoryPanel>
      </div>
      <div className="relative pl-2">
        <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase block">
          Crédito da Soja
        </span>
        <div className="mt-1.5 text-2xl font-bold text-[#5A5A40] dark:text-[#9CB386]">
          {soyResult.toFixed(2)}{' '}
          <span className="text-xs font-semibold text-[#8C897E] dark:text-[#9EA399]">kg N/ha</span>
        </div>
        <div className="mt-2 text-[10px] text-[#8C897E] dark:text-[#9EA399] border-t border-[#F0EDE5] dark:border-[#2C3328] pt-2 font-medium">
          Extração − Soja
        </div>
        <CalculationIsland
          isVisible={showSoyCalc}
          onToggle={() => setShowSoyCalc(!showSoyCalc)}
          accentColor="#5A5A40"
          darkAccentColor="#9CB386"
          isDark={isDark}
        />
        <CalculationMemoryPanel isVisible={showSoyCalc} isDark={isDark}>
          <div>Crédito da Soja = Extração Total − Crédito de N pela Soja (cultura anterior)</div>
          <div>{totalExtraction.toFixed(2)} − {soyNContribution.toFixed(2)} = {soyResult.toFixed(2)} kg N/ha</div>
          <p>Leguminosa anterior</p>
        </CalculationMemoryPanel>
      </div>
    </div>
  );
}
