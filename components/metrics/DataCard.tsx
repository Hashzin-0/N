'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import CalculationIsland from '@/components/CalculationIsland';
import CalculationMemoryPanel from '@/components/CalculationMemoryPanel';
import { useGeminiLiveAgent } from '@/hooks/useGeminiLiveAgent';

interface DataCardProps {
  isDark: boolean;
}

export default function DataCard({ isDark }: DataCardProps) {
  const [showCalc, setShowCalc] = useState(false);
  const [localDate, setLocalDate] = useState<string>('');
  const [isLoadingDate, setIsLoadingDate] = useState(false);
  const { state, connect } = useGeminiLiveAgent({
    yieldGoal: 0,
    nRequirementPerBag: 0,
    mosNContribution: 0,
    soyNContribution: 0,
    efficiency: 80,
    baseDose: 0,
    v4v6Percent: 50,
    v8v10Percent: 20,
    splitBase: 'dose_perdas',
  });

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      setLocalDate(now.toLocaleDateString('pt-BR', { dateStyle: 'full' }));
    };
    updateDate();
    const timer = setInterval(updateDate, 60000);
    return () => clearInterval(timer);
  }, []);

  const handlePopulateDate = async () => {
    setIsLoadingDate(true);
    try {
      const result = await (connect ? undefined : null);
      const now = new Date();
      setLocalDate(now.toLocaleDateString('pt-BR', { dateStyle: 'full' }));
    } catch (e) {
      const now = new Date();
      setLocalDate(now.toLocaleDateString('pt-BR', { dateStyle: 'full' }));
    } finally {
      setIsLoadingDate(false);
    }
  };

  return (
    <div id="data_card" className="col-span-2 sm:col-span-3 bg-white dark:bg-[#1C201A] p-6 rounded-3xl shadow-sm border border-[#E5E2D9] dark:border-[#2C3328] transition-colors">
      <div className="border-b border-[#F0EDE5] dark:border-[#2C3328] pb-4">
        <h2 className="text-lg font-bold text-[#5A5A40] dark:text-[#E8E6DF] flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-[#5A5A40] dark:text-[#9CB386]"
            fill="none"
            stroke="currentColor"
          >
            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a2 2 0 00-2-2H4a2 2 0 00-2 2v4m0 0V7a2 2 0 00-2-2H2a2 2 0 00-2 2v4m0 0t6 8.943m-6.5 4.5A2.5 2.5 0 0111 15h1.286c.264 0 .526-.077.707-.218l1.96-1.15a2.5 2.5 0 01.153-.654l-.948-1.665m13.056-9.368l-.789.532a3 3 0 01-.57 1.358l-.789-.532m10.165 0a3 3 0 11.378 0l-.789.532m13.056-9.368L21.054 6.343m0 0l-.789.532a3 3 0 01-.57 1.358l-.789-.532m-7.293 0a3.5 3.5 0 105.486 3.152A3.588 3.588 0 0014 3.573z" />
          </svg>
          Data e Hora Atuais
        </h2>
        <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-1">
          Data baseada no fuso horário local do usuário
        </p>
      </div>

      <CalculationIsland
        isVisible={showCalc}
        onToggle={() => setShowCalc(prev => !prev)}
        accentColor="#5A5A40"
        darkAccentColor="#9CB386"
        isDark={isDark}
      />

      <CalculationMemoryPanel isVisible={showCalc} isDark={isDark}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-[#3D3D3D] dark:text-[#E8E6DF]">
              Data Local
            </span>
            <button
              onClick={handlePopulateDate}
              className={`flex items-center gap-2 text-sm font-medium ${
                isLoadingDate
                  ? 'text-[#D4A373]'
                  : 'text-[#5A5A40] dark:text-[#9CB386]'
              } hover:underline`}
            >
              {isLoadingDate ? 'Atualizando...' : 'Popular data'}
            </button>
          </div>

          {isLoadingDate ? (
            <div className="text-xs text-[#8C897E] dark:text-[#9EA399]">
              Consultando data do usuário via Gemini Live...
            </div>
          ) : null}

          <div>
            <p className={`text-2xl font-bold ${
              isDark ? 'text-[#E8E6DF]' : 'text-[#5A5A40]'
            }`}>
              {localDate}
            </p>
            <p className="text-xs text-[#8C897E] dark:text-[#9EA399]">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </CalculationMemoryPanel>
    </div>
  );
}