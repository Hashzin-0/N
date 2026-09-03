'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Sprout, 
  Percent, 
  Scale, 
  TrendingUp, 
  ArrowRight, 
  HelpCircle, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';
import CornEar3DVisualizer from './CornEar3DVisualizer';
import { useTheme } from './ThemeProvider';

interface CornYieldCalculatorProps {
  onApplyYieldGoal?: (scHa: number) => void;
}

interface YieldPreset {
  id: string;
  name: string;
  description: string;
  plantasPorMetro: number;
  espacamentoLinhas: number;
  fileiras: number;
  graosPorFileira: number;
  espigas: number;
  pmg: number;
  quebraDecimal: number;
}

const YIELD_PRESETS: YieldPreset[] = [
  {
    id: 'questao_exemplo',
    name: 'Exercício da Questão (Típico)',
    description: 'Valores clássicos de provas e exercícios agronômicos.',
    plantasPorMetro: 4.0,
    espacamentoLinhas: 0.50,
    fileiras: 16,
    graosPorFileira: 35,
    espigas: 1.0,
    pmg: 300,
    quebraDecimal: 0.05,
  },
  {
    id: 'safra_verao',
    name: 'Safra Verão Alto Investimento',
    description: 'Espaçamento 0.45m, espigas graúdas e híbridos modernos.',
    plantasPorMetro: 3.8,
    espacamentoLinhas: 0.45,
    fileiras: 18,
    graosPorFileira: 38,
    espigas: 1.0,
    pmg: 340,
    quebraDecimal: 0.03,
  },
  {
    id: 'safrinha',
    name: 'Safrinha Centro-Oeste / Cerrado',
    description: 'Condição de menor umidade no enchimento de grãos.',
    plantasPorMetro: 3.2,
    espacamentoLinhas: 0.50,
    fileiras: 14,
    graosPorFileira: 30,
    espigas: 0.95,
    pmg: 280,
    quebraDecimal: 0.08,
  },
];

export default function CornYieldCalculator({ onApplyYieldGoal }: CornYieldCalculatorProps) {
  const { isDark } = useTheme();

  // Inputs
  const [plantasPorMetro, setPlantasPorMetro] = useState<number>(4.0);
  const [espacamentoLinhas, setEspacamentoLinhas] = useState<number>(0.50);
  const [fileiras, setFileiras] = useState<number>(16);
  const [graosPorFileira, setGraosPorFileira] = useState<number>(35);
  const [espigas, setEspigas] = useState<number>(1.0);
  const [pmg, setPmg] = useState<number>(300);
  const [quebraDecimal, setQuebraDecimal] = useState<number>(0.05); // 0.05 = 5%
  const [activePreset, setActivePreset] = useState<string>('questao_exemplo');
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(true);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // Calculations strictly adhering to user formulas:
  // 1. estande(população) = contagem de plantas por metro × espaçamento entre linhas × 10000
  const estande = useMemo(() => {
    return Number((plantasPorMetro * espacamentoLinhas * 10000).toFixed(0));
  }, [plantasPorMetro, espacamentoLinhas]);

  // 2. Quantidade de grãos = fileira × grãos/fileira
  const quantidadeGraos = useMemo(() => {
    return Number((fileiras * graosPorFileira).toFixed(0));
  }, [fileiras, graosPorFileira]);

  // 3. PMG = xyz (valor dada na questão) ÷ por mil
  const pmgUnitario = useMemo(() => {
    return pmg / 1000;
  }, [pmg]);

  // 4. sc/ha = estande × espigas(por fileira) × Qant. De grãos × PMG ÷ 1000
  // Note: user specified PMG = xyz ÷ 1000.
  // When computing sc/ha with PMG unitário:
  // (estande * espigas * quantidadeGraos * pmgUnitario) / 1000
  // We compute exactly the mathematical outcome of the prompt formula:
  const scHaBruto = useMemo(() => {
    const raw = (estande * espigas * quantidadeGraos * pmgUnitario) / 1000;
    return Number(raw.toFixed(2));
  }, [estande, espigas, quantidadeGraos, pmgUnitario]);

  // Equivalent in kg/ha
  const kgHaBruto = useMemo(() => {
    return Number((scHaBruto * 60).toFixed(1));
  }, [scHaBruto]);

  // 5. Quebra(perda) = valor de sc/ha × porcentagem(falada na questão, em decimal)
  const quebraValor = useMemo(() => {
    return Number((scHaBruto * quebraDecimal).toFixed(2));
  }, [scHaBruto, quebraDecimal]);

  // Produtividade Líquida final
  const produtividadeLiquida = useMemo(() => {
    return Number(Math.max(0, scHaBruto - quebraValor).toFixed(2));
  }, [scHaBruto, quebraValor]);

  const loadPreset = (p: YieldPreset) => {
    setActivePreset(p.id);
    setPlantasPorMetro(p.plantasPorMetro);
    setEspacamentoLinhas(p.espacamentoLinhas);
    setFileiras(p.fileiras);
    setGraosPorFileira(p.graosPorFileira);
    setEspigas(p.espigas);
    setPmg(p.pmg);
    setQuebraDecimal(p.quebraDecimal);
  };

  const handleApplyToNitrogenCalculator = () => {
    if (onApplyYieldGoal) {
      onApplyYieldGoal(Math.round(produtividadeLiquida));
      setAppliedToast(`Meta de ${Math.round(produtividadeLiquida)} sc/ha aplicada no Simulador de Nitrogênio!`);
      setTimeout(() => setAppliedToast(null), 4000);
      const el = document.getElementById('form_section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="corn_yield_calculator_section" className="space-y-6">
      
      {/* HEADER CARD */}
      <div className={`p-6 sm:p-7 rounded-3xl border shadow-sm transition-colors ${
        isDark ? 'bg-[#1C1E19] border-[#2E3326]' : 'bg-white border-[#E5E2D9]'
      }`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 border-[#F0EDE5] dark:border-[#2F3329]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#D4A373]/20 text-[#D4A373] border border-[#D4A373]/30">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#5A5A40] dark:text-[#E8E7DF]">
                Estimativa de Produtividade de Milho
              </h2>
              <p className="text-xs sm:text-sm text-[#8C897E] dark:text-[#A6A395] mt-0.5">
                Cálculo de estande (população), grãos por espiga, PMG unitário, sc/ha e quebra por perdas.
              </p>
            </div>
          </div>

          {/* PRESET CHIPS */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#A6A395] uppercase tracking-wider">
              Cenários:
            </span>
            {YIELD_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => loadPreset(p)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all active:scale-95 ${
                  activePreset === p.id
                    ? 'bg-[#5A5A40] text-white border-[#5A5A40] dark:bg-[#7D8861] dark:border-[#7D8861]'
                    : 'bg-[#F9F8F6] text-[#5A5A40] border-[#E5E2D9] hover:bg-white dark:bg-[#242720] dark:text-[#C5C4B8] dark:border-[#383D31]'
                }`}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {appliedToast && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#2E6F40] text-white flex items-center justify-between text-xs font-semibold shadow-md animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#86efac]" />
              <span>{appliedToast}</span>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('form_section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg text-[11px]"
            >
              Ver Simulador N ↓
            </button>
          </div>
        )}
      </div>

      {/* TWO COLUMN GRID: INPUTS & 3D / RESULTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: PARAMETER INPUTS (7 COLS) */}
        <div className={`lg:col-span-7 p-6 rounded-3xl border shadow-sm space-y-6 transition-colors ${
          isDark ? 'bg-[#1C1E19] border-[#2E3326]' : 'bg-white border-[#E5E2D9]'
        }`}>
          
          <div className="flex items-center justify-between border-b pb-3 border-[#F0EDE5] dark:border-[#2F3329]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#5A5A40] dark:text-[#A3B18A] flex items-center gap-2">
              <Layers className="h-4 w-4" /> Parâmetros da Lavoura / Questão
            </h3>
            <button
              onClick={() => loadPreset(YIELD_PRESETS[0])}
              className="text-xs text-[#8C897E] hover:text-[#5A5A40] dark:hover:text-[#E8E7DF] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Resetar
            </button>
          </div>

          <div className="space-y-5">
            
            {/* 1. PLANTAS POR METRO & ESPAÇAMENTO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#8C897E] dark:text-[#A6A395] uppercase tracking-wider">
                    Plantas por Metro
                  </label>
                  <span className="text-sm font-mono font-bold text-[#5A5A40] dark:text-[#A3B18A]">
                    {plantasPorMetro} pl/m
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={plantasPorMetro}
                  onChange={(e) => {
                    setPlantasPorMetro(parseFloat(e.target.value) || 0);
                    setActivePreset('personalizado');
                  }}
                  className={`w-full p-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                    isDark
                      ? 'bg-[#242720] border-[#393E32] text-[#F4F3EE] focus:ring-[#7D8861]'
                      : 'bg-white border-[#E5E2D9] text-[#3D3D3D] focus:ring-[#5A5A40]'
                  }`}
                />
                <input
                  type="range"
                  min="1.5"
                  max="7.0"
                  step="0.1"
                  value={plantasPorMetro}
                  onChange={(e) => {
                    setPlantasPorMetro(parseFloat(e.target.value));
                    setActivePreset('personalizado');
                  }}
                  className="w-full accent-[#5A5A40] dark:accent-[#7D8861] cursor-pointer"
                />
                <span className="text-[10px] text-[#8C897E] block">
                  Contagem linear na linha de semeadura.
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#8C897E] dark:text-[#A6A395] uppercase tracking-wider">
                    Espaçamento entre Linhas
                  </label>
                  <span className="text-sm font-mono font-bold text-[#5A5A40] dark:text-[#A3B18A]">
                    {espacamentoLinhas} m ({Math.round(espacamentoLinhas * 100)} cm)
                  </span>
                </div>
                <input
                  type="number"
                  step="0.05"
                  min="0.30"
                  max="1.20"
                  value={espacamentoLinhas}
                  onChange={(e) => {
                    setEspacamentoLinhas(parseFloat(e.target.value) || 0);
                    setActivePreset('personalizado');
                  }}
                  className={`w-full p-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                    isDark
                      ? 'bg-[#242720] border-[#393E32] text-[#F4F3EE] focus:ring-[#7D8861]'
                      : 'bg-white border-[#E5E2D9] text-[#3D3D3D] focus:ring-[#5A5A40]'
                  }`}
                />
                <input
                  type="range"
                  min="0.35"
                  max="0.90"
                  step="0.05"
                  value={espacamentoLinhas}
                  onChange={(e) => {
                    setEspacamentoLinhas(parseFloat(e.target.value));
                    setActivePreset('personalizado');
                  }}
                  className="w-full accent-[#5A5A40] dark:accent-[#7D8861] cursor-pointer"
                />
                <span className="text-[10px] text-[#8C897E] block">
                  Distância entre linhas (metros).
                </span>
              </div>
            </div>

            {/* ESTANDE RESULT CALLOUT */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-colors ${
              isDark ? 'bg-[#242720] border-[#393E32]' : 'bg-[#FAF9F5] border-[#E5E2D9]'
            }`}>
              <div className="flex items-center gap-2">
                <Sprout className="h-4 w-4 text-[#D4A373]" />
                <span className="font-semibold text-[#5A5A40] dark:text-[#E8E7DF]">
                  Estande (População Calculada):
                </span>
              </div>
              <div className="font-mono font-bold text-sm text-[#2E6F40] dark:text-[#86efac]">
                {estande.toLocaleString('pt-BR')} <span className="text-xs font-normal">plantas/ha</span>
              </div>
            </div>

            {/* 2. FILEIRAS & GRÃOS POR FILEIRA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#8C897E] dark:text-[#A6A395] uppercase tracking-wider">
                    Fileiras na Espiga
                  </label>
                  <span className="text-sm font-mono font-bold text-[#5A5A40] dark:text-[#A3B18A]">
                    {fileiras} fileiras
                  </span>
                </div>
                <input
                  type="number"
                  min="10"
                  max="24"
                  step="2"
                  value={fileiras}
                  onChange={(e) => {
                    setFileiras(parseInt(e.target.value, 10) || 0);
                    setActivePreset('personalizado');
                  }}
                  className={`w-full p-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                    isDark
                      ? 'bg-[#242720] border-[#393E32] text-[#F4F3EE] focus:ring-[#7D8861]'
                      : 'bg-white border-[#E5E2D9] text-[#3D3D3D] focus:ring-[#5A5A40]'
                  }`}
                />
                <input
                  type="range"
                  min="12"
                  max="22"
                  step="2"
                  value={fileiras}
                  onChange={(e) => {
                    setFileiras(parseInt(e.target.value, 10));
                    setActivePreset('personalizado');
                  }}
                  className="w-full accent-[#5A5A40] dark:accent-[#7D8861] cursor-pointer"
                />
                <span className="text-[10px] text-[#8C897E] block">
                  Sempre em números pares (12, 14, 16, 18, 20).
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#8C897E] dark:text-[#A6A395] uppercase tracking-wider">
                    Grãos por Fileira
                  </label>
                  <span className="text-sm font-mono font-bold text-[#5A5A40] dark:text-[#A3B18A]">
                    {graosPorFileira} grãos
                  </span>
                </div>
                <input
                  type="number"
                  min="10"
                  max="60"
                  value={graosPorFileira}
                  onChange={(e) => {
                    setGraosPorFileira(parseInt(e.target.value, 10) || 0);
                    setActivePreset('personalizado');
                  }}
                  className={`w-full p-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                    isDark
                      ? 'bg-[#242720] border-[#393E32] text-[#F4F3EE] focus:ring-[#7D8861]'
                      : 'bg-white border-[#E5E2D9] text-[#3D3D3D] focus:ring-[#5A5A40]'
                  }`}
                />
                <input
                  type="range"
                  min="20"
                  max="50"
                  step="1"
                  value={graosPorFileira}
                  onChange={(e) => {
                    setGraosPorFileira(parseInt(e.target.value, 10));
                    setActivePreset('personalizado');
                  }}
                  className="w-full accent-[#5A5A40] dark:accent-[#7D8861] cursor-pointer"
                />
                <span className="text-[10px] text-[#8C897E] block">
                  Contagem média longitudinal de grãos.
                </span>
              </div>
            </div>

            {/* 3. ESPIGAS, PMG & QUEBRA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Espigas */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#8C897E] dark:text-[#A6A395] uppercase tracking-wider">
                    Espigas / Planta
                  </label>
                  <span className="text-sm font-mono font-bold text-[#5A5A40] dark:text-[#A3B18A]">
                    {espigas}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="2.0"
                  value={espigas}
                  onChange={(e) => {
                    setEspigas(parseFloat(e.target.value) || 0);
                    setActivePreset('personalizado');
                  }}
                  className={`w-full p-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                    isDark
                      ? 'bg-[#242720] border-[#393E32] text-[#F4F3EE] focus:ring-[#7D8861]'
                      : 'bg-white border-[#E5E2D9] text-[#3D3D3D] focus:ring-[#5A5A40]'
                  }`}
                />
                <span className="text-[10px] text-[#8C897E] block">
                  Espigas viáveis por planta (questão: 1.0).
                </span>
              </div>

              {/* PMG */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#8C897E] dark:text-[#A6A395] uppercase tracking-wider">
                    PMG (g / 1000 grãos)
                  </label>
                  <span className="text-sm font-mono font-bold text-[#5A5A40] dark:text-[#A3B18A]">
                    {pmg} g
                  </span>
                </div>
                <input
                  type="number"
                  step="5"
                  min="150"
                  max="450"
                  value={pmg}
                  onChange={(e) => {
                    setPmg(parseFloat(e.target.value) || 0);
                    setActivePreset('personalizado');
                  }}
                  className={`w-full p-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                    isDark
                      ? 'bg-[#242720] border-[#393E32] text-[#F4F3EE] focus:ring-[#7D8861]'
                      : 'bg-white border-[#E5E2D9] text-[#3D3D3D] focus:ring-[#5A5A40]'
                  }`}
                />
                <span className="text-[10px] text-[#8C897E] block">
                  PMG unitário: <strong>{pmgUnitario.toFixed(3)} g/grão</strong>
                </span>
              </div>

              {/* Quebra */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#8C897E] dark:text-[#A6A395] uppercase tracking-wider">
                    Quebra / Perda (%)
                  </label>
                  <span className="text-sm font-mono font-bold text-[#D4A373]">
                    {(quebraDecimal * 100).toFixed(1)}% ({quebraDecimal})
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="0.30"
                  value={quebraDecimal}
                  onChange={(e) => {
                    setQuebraDecimal(parseFloat(e.target.value) || 0);
                    setActivePreset('personalizado');
                  }}
                  className={`w-full p-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                    isDark
                      ? 'bg-[#242720] border-[#393E32] text-[#F4F3EE] focus:ring-[#7D8861]'
                      : 'bg-white border-[#E5E2D9] text-[#3D3D3D] focus:ring-[#5A5A40]'
                  }`}
                />
                <span className="text-[10px] text-[#8C897E] block">
                  Em decimal (ex: 0.05 para 5% de perda).
                </span>
              </div>
            </div>

          </div>

          {/* EDUCATIONAL STEP-BY-STEP BREAKDOWN PANEL */}
          <div className={`rounded-2xl border p-4 transition-colors ${
            isDark ? 'bg-[#181A15] border-[#2E3326]' : 'bg-[#FAF8F3] border-[#E5E2D9]'
          }`}>
            <button
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#5A5A40] dark:text-[#A3B18A]"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#D4A373]" />
                <span>Memória de Cálculo Didática (Passo a Passo da Questão)</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFormulaDetails ? 'rotate-180' : ''}`} />
            </button>

            {showFormulaDetails && (
              <div className="mt-3.5 space-y-2.5 text-xs text-[#3D3D3D] dark:text-[#D5D4CB] font-mono border-t pt-3 border-[#E5E2D9] dark:border-[#2F3329]">
                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5">
                  <span className="text-[#8C897E] dark:text-[#9CA38C]">1. Estande (População):</span>
                  <div className="text-[#5A5A40] dark:text-[#A3B18A] font-bold">
                    {plantasPorMetro} pl/m × {espacamentoLinhas} m × 10.000 = <strong>{estande.toLocaleString('pt-BR')} plantas/ha</strong>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5">
                  <span className="text-[#8C897E] dark:text-[#9CA38C]">2. Quantidade de grãos por espiga:</span>
                  <div className="text-[#5A5A40] dark:text-[#A3B18A] font-bold">
                    {fileiras} fileiras × {graosPorFileira} grãos/fileira = <strong>{quantidadeGraos} grãos/espiga</strong>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5">
                  <span className="text-[#8C897E] dark:text-[#9CA38C]">3. PMG Unitário (÷ 1000):</span>
                  <div className="text-[#5A5A40] dark:text-[#A3B18A] font-bold">
                    {pmg} g ÷ 1000 = <strong>{pmgUnitario.toFixed(3)} g por grão</strong>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5">
                  <span className="text-[#8C897E] dark:text-[#9CA38C]">4. sc/ha Bruto:</span>
                  <div className="text-[#5A5A40] dark:text-[#A3B18A] font-bold">
                    ({estande.toLocaleString('pt-BR')} × {espigas} × {quantidadeGraos} × {pmgUnitario.toFixed(3)}) ÷ 1000 = <strong>{scHaBruto} sc/ha</strong>
                    <span className="text-[11px] font-normal block text-[#8C897E] dark:text-[#9CA38C]">
                      (= {kgHaBruto.toLocaleString('pt-BR')} kg/ha)
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5">
                  <span className="text-[#8C897E] dark:text-[#9CA38C]">5. Quebra (perda de colheita):</span>
                  <div className="text-[#D4A373] font-bold">
                    {scHaBruto} sc/ha × {quebraDecimal} ({(quebraDecimal * 100).toFixed(1)}%) = <strong>{quebraValor} sc/ha de quebra</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#2E6F40]/10 border border-[#2E6F40]/20 text-[#2E6F40] dark:text-[#86efac]">
                  <span className="font-bold">6. Produtividade Líquida Estimada:</span>
                  <div className="text-sm font-bold mt-0.5">
                    {scHaBruto} - {quebraValor} = <strong>{produtividadeLiquida} sc/ha líquido colhido</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: 3D EAR & ESTIMATED YIELD RESULTS (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 3D CORN EAR VISUALIZER */}
          <CornEar3DVisualizer
            rows={fileiras}
            kernelsPerRow={graosPorFileira}
            totalKernels={quantidadeGraos}
          />

          {/* RESULTS CARD */}
          <div className={`p-6 rounded-3xl border shadow-md space-y-5 transition-colors ${
            isDark ? 'bg-[#1F221B] border-[#373C2C]' : 'bg-white border-[#E5E2D9]'
          }`}>
            
            <div className="border-b pb-3 border-[#F0EDE5] dark:border-[#2F3329] flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C897E] dark:text-[#A6A395]">
                Resultado Final da Estimativa
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#D4A373]/20 text-[#D4A373] font-bold">
                Safra Milho
              </span>
            </div>

            {/* BIG METRIC 1: PRODUTIVIDADE LÍQUIDA */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#5A5A40] to-[#454530] text-white shadow-md space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                  Produtividade Líquida (Após Quebra)
                </span>
                <TrendingUp className="h-5 w-5 text-[#86efac]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-mono font-extrabold text-white tracking-tight">
                  {produtividadeLiquida}
                </span>
                <span className="text-lg font-medium text-white/90">sc/ha</span>
              </div>
              <div className="text-xs text-white/80 pt-1 border-t border-white/20 flex justify-between">
                <span>Total em Grãos:</span>
                <strong>{Number((produtividadeLiquida * 60).toFixed(0)).toLocaleString('pt-BR')} kg/ha</strong>
              </div>
            </div>

            {/* SUB METRICS: BRUTO E QUEBRA */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3.5 rounded-2xl border transition-colors ${
                isDark ? 'bg-[#242720] border-[#393E32]' : 'bg-[#FAF9F5] border-[#E5E2D9]'
              }`}>
                <span className="text-[10px] uppercase font-bold text-[#8C897E] dark:text-[#A6A395] block">
                  Produtividade Bruta
                </span>
                <div className="text-xl font-mono font-bold text-[#5A5A40] dark:text-[#A3B18A] mt-1">
                  {scHaBruto} <span className="text-xs font-normal">sc/ha</span>
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border transition-colors ${
                isDark ? 'bg-[#242720] border-[#393E32]' : 'bg-[#FAF9F5] border-[#E5E2D9]'
              }`}>
                <span className="text-[10px] uppercase font-bold text-[#D4A373] block">
                  Quebra / Perda ({quebraDecimal * 100}%)
                </span>
                <div className="text-xl font-mono font-bold text-[#D4A373] mt-1">
                  -{quebraValor} <span className="text-xs font-normal">sc/ha</span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTON: APPLY TO NITROGEN CALCULATOR */}
            <button
              id="btn_apply_yield_to_n"
              onClick={handleApplyToNitrogenCalculator}
              className="w-full flex items-center justify-center gap-2 bg-[#2E6F40] hover:bg-[#255833] text-white font-bold py-3.5 px-5 rounded-2xl transition-all shadow-md active:scale-95 group text-sm"
              title="Transfere esta produtividade diretamente para a calculadora de Nitrogênio"
            >
              <Sparkles className="h-4 w-4 text-[#86efac] group-hover:rotate-12 transition-transform" />
              <span>Usar esta Produtividade no Cálculo de Nitrogênio</span>
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>

          </div>

        </div>

      </div>

    </section>
  );
}
