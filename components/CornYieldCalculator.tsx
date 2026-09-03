'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, 
  Sprout, 
  HelpCircle, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
  Info,
  AlertTriangle
} from 'lucide-react';
import CornEar3DVisualizer from './CornEar3DVisualizer';
import CornAlert3D, { AgronomicValidationIssue } from './CornAlert3D';
import Input3D from './Input3D';
import Button3D from './Button3D';
import Elastic3DSlider from './Elastic3DSlider';
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

  const [plantasPorMetro, setPlantasPorMetro] = useState<number>(4.0);
  const [espacamentoLinhas, setEspacamentoLinhas] = useState<number>(0.50);
  const [fileiras, setFileiras] = useState<number>(16);
  const [graosPorFileira, setGraosPorFileira] = useState<number>(35);
  const [espigas, setEspigas] = useState<number>(1.0);
  const [pmg, setPmg] = useState<number>(300);
  const [quebraDecimal, setQuebraDecimal] = useState<number>(0.05);
  const [activePreset, setActivePreset] = useState<string>('questao_exemplo');
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(true);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // Calculations
  const estande = useMemo(() => {
    return Number((plantasPorMetro * espacamentoLinhas * 10000).toFixed(0));
  }, [plantasPorMetro, espacamentoLinhas]);

  const quantidadeGraos = useMemo(() => {
    return Number((fileiras * graosPorFileira).toFixed(0));
  }, [fileiras, graosPorFileira]);

  const pmgUnitario = useMemo(() => pmg / 1000, [pmg]);

  const scHaBruto = useMemo(() => {
    const raw = (estande * espigas * quantidadeGraos * pmgUnitario) / 1000;
    return Number(raw.toFixed(2));
  }, [estande, espigas, quantidadeGraos, pmgUnitario]);

  const kgHaBruto = useMemo(() => Number((scHaBruto * 60).toFixed(1)), [scHaBruto]);

  const quebraValor = useMemo(() => {
    return Number((scHaBruto * quebraDecimal).toFixed(2));
  }, [scHaBruto, quebraDecimal]);

  const produtividadeLiquida = useMemo(() => {
    return Number(Math.max(0, scHaBruto - quebraValor).toFixed(2));
  }, [scHaBruto, quebraValor]);

  // Agronomic validation
  const agronomicIssues = useMemo((): AgronomicValidationIssue[] => {
    const issues: AgronomicValidationIssue[] = [];

    if (plantasPorMetro < 2.5 || plantasPorMetro > 6.0) {
      issues.push({
        field: 'plantasPorMetro',
        label: 'Plantas por Metro',
        currentValue: plantasPorMetro,
        typicalRange: '2.5 a 6.0 pl/m',
        severity: plantasPorMetro < 1.5 || plantasPorMetro > 8.0 ? 'critical' : 'warning',
        message: plantasPorMetro < 2.5
          ? 'População muito baixa para milho. Comumente utilizam-se 3.0 a 5.5 pl/m.'
          : 'População excessiva, pode causar competição por luz e nutrients.',
        recommendedValue: 4.0,
      });
    }

    if (espacamentoLinhas < 0.40 || espacamentoLinhas > 0.80) {
      issues.push({
        field: 'espacamentoLinhas',
        label: 'Espaçamento entre Linhas',
        currentValue: espacamentoLinhas,
        typicalRange: '0.40 a 0.80 m',
        severity: espacamentoLinhas < 0.30 || espacamentoLinhas > 1.0 ? 'critical' : 'warning',
        message: espacamentoLinhas < 0.40
          ? 'Espaçamento estreito, reduz vigor e dificulta manejo mecânico.'
          : 'Espaçamento largo, reduz população por ha e potencial produtivo.',
        recommendedValue: 0.50,
      });
    }

    if (fileiras < 14 || fileiras > 20) {
      issues.push({
        field: 'fileiras',
        label: 'Fileiras na Espiga',
        currentValue: fileiras,
        typicalRange: '14 a 20 fileiras',
        severity: fileiras < 10 || fileiras > 24 ? 'critical' : 'warning',
        message: fileiras < 14
          ? 'Poucas fileiras, abaixo do típico para híbridos modernos (14-20).'
          : 'Muitas fileiras, pode indicar erros de contagem ou híbrido atípico.',
        recommendedValue: 16,
      });
    }

    if (graosPorFileira < 25 || graosPorFileira > 45) {
      issues.push({
        field: 'graosPorFileira',
        label: 'Grãos por Fileira',
        currentValue: graosPorFileira,
        typicalRange: '25 a 45 grãos',
        severity: graosPorFileira < 15 || graosPorFileira > 55 ? 'critical' : 'warning',
        message: graosPorFileira < 25
          ? 'Baixa contagem de grãos por fileira, pode indicar estresse durante enchimento.'
          : 'Contagem alta, atípica para a maioria dos híbridos comerciais.',
        recommendedValue: 35,
      });
    }

    if (espigas < 0.8 || espigas > 1.5) {
      issues.push({
        field: 'espigas',
        label: 'Espigas / Planta',
        currentValue: espigas,
        typicalRange: '0.8 a 1.5 espigas/planta',
        severity: espigas < 0.5 || espigas > 2.0 ? 'critical' : 'warning',
        message: espigas < 0.8
          ? 'Espigamento baixo, pode indicar estresse hídrico ou nutricional.'
          : 'Múltiplas espigas por planta é atípico em híbridos modernos.',
        recommendedValue: 1.0,
      });
    }

    if (pmg < 200 || pmg > 400) {
      issues.push({
        field: 'pmg',
        label: 'PMG (g/1000 grãos)',
        currentValue: pmg,
        typicalRange: '200 a 400 g',
        severity: pmg < 150 || pmg > 450 ? 'critical' : 'warning',
        message: pmg < 200
          ? 'Peso de mil grãos muito baixo, grãos mal preenchidos.'
          : 'PMG muito alto, pode indicar erro de medição ou híbrido especial.',
        recommendedValue: 300,
      });
    }

    if (quebraDecimal < 0.02 || quebraDecimal > 0.15) {
      issues.push({
        field: 'quebraDecimal',
        label: 'Quebra / Perda (%)',
        currentValue: `${(quebraDecimal * 100).toFixed(1)}%`,
        typicalRange: '2% a 15%',
        severity: quebraDecimal > 0.20 ? 'critical' : 'warning',
        message: quebraDecimal > 0.15
          ? 'Perda de colheita muito acima do normal (típico: 3-10%).'
          : 'Perda de colheita abaixo do esperado, pode subestimar perdas reais.',
        recommendedValue: 0.05,
      });
    }

    return issues;
  }, [plantasPorMetro, espacamentoLinhas, fileiras, graosPorFileira, espigas, pmg, quebraDecimal]);

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

  const handleFixAll = () => {
    loadPreset(YIELD_PRESETS[0]);
  };

  const handleFixField = (field: string, val: number) => {
    setActivePreset('personalizado');
    switch (field) {
      case 'plantasPorMetro': setPlantasPorMetro(val); break;
      case 'espacamentoLinhas': setEspacamentoLinhas(val); break;
      case 'fileiras': setFileiras(val); break;
      case 'graosPorFileira': setGraosPorFileira(val); break;
      case 'espigas': setEspigas(val); break;
      case 'pmg': setPmg(val); break;
      case 'quebraDecimal': setQuebraDecimal(val); break;
    }
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

  // Helper: check if a field has issues
  const getFieldSeverity = (field: string): 'warning' | 'critical' | undefined => {
    const issue = agronomicIssues.find((i) => i.field === field);
    return issue?.severity;
  };

  return (
    <section id="corn_yield_calculator_section" className="space-y-6">
      
      {/* HEADER CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`p-6 sm:p-7 rounded-3xl border shadow-sm transition-colors ${
          isDark ? 'bg-[#1C1E19] border-[#2E3326]' : 'bg-white border-[#E5E2D9]'
        }`}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 border-[#F0EDE5] dark:border-[#2F3329]">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-3 rounded-2xl bg-[#D4A373]/20 text-[#D4A373] border border-[#D4A373]/30"
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            >
              <Calculator className="h-6 w-6" />
            </motion.div>
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
              <Button3D
                key={p.id}
                variant={activePreset === p.id ? 'secondary' : 'ghost'}
                size="sm"
                active={activePreset === p.id}
                isDark={isDark}
                onClick={() => loadPreset(p)}
              >
                {p.name.split(' ')[0]}
              </Button3D>
            ))}
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {appliedToast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="mt-4 p-3.5 rounded-2xl bg-[#2E6F40] text-white flex items-center justify-between text-xs font-semibold shadow-md"
          >
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
          </motion.div>
        )}
      </motion.div>

      {/* 3D ALERT: AGRONOMIC VALIDATION */}
      <CornAlert3D
        issues={agronomicIssues}
        onFixAll={handleFixAll}
        onFixField={handleFixField}
        isDark={isDark}
      />

      {/* TWO COLUMN GRID: INPUTS & 3D / RESULTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: PARAMETER INPUTS (7 COLS) */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 250, damping: 30, delay: 0.1 }}
          className={`lg:col-span-7 p-6 rounded-3xl border shadow-sm space-y-6 transition-colors ${
            isDark ? 'bg-[#1C1E19] border-[#2E3326]' : 'bg-white border-[#E5E2D9]'
          }`}
        >
          
          <div className="flex items-center justify-between border-b pb-3 border-[#F0EDE5] dark:border-[#2F3329]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#5A5A40] dark:text-[#A3B18A] flex items-center gap-2">
              <Layers className="h-4 w-4" /> Parâmetros da Lavoura / Questão
            </h3>
            <Button3D
              variant="ghost"
              size="sm"
              isDark={isDark}
              onClick={() => loadPreset(YIELD_PRESETS[0])}
              icon={<RotateCcw className="h-3 w-3" />}
            >
              Resetar
            </Button3D>
          </div>

          <div className="space-y-5">
            
            {/* 1. PLANTAS POR METRO & ESPAÇAMENTO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input3D
                id="input_plantas_por_metro"
                label="Plantas por Metro"
                unit="pl/m"
                value={plantasPorMetro}
                onChange={(v) => { setPlantasPorMetro(v); setActivePreset('personalizado'); }}
                step={0.1}
                min={1}
                max={10}
                isDark={isDark}
                accentColor="#5A5A40"
                critical={getFieldSeverity('plantasPorMetro') === 'critical'}
                warning={getFieldSeverity('plantasPorMetro') === 'warning'}
                hint="Contagem linear na linha de semeadura."
              />
              <Input3D
                id="input_espacamento_linhas"
                label="Espaçamento entre Linhas"
                unit={`m (${Math.round(espacamentoLinhas * 100)} cm)`}
                value={espacamentoLinhas}
                onChange={(v) => { setEspacamentoLinhas(v); setActivePreset('personalizado'); }}
                step={0.05}
                min={0.30}
                max={1.20}
                isDark={isDark}
                accentColor="#5A5A40"
                critical={getFieldSeverity('espacamentoLinhas') === 'critical'}
                warning={getFieldSeverity('espacamentoLinhas') === 'warning'}
                hint="Distância entre linhas (metros)."
              />
            </div>

            {/* ELASTIC SLIDER: PLANTAS POR METRO */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#A6A395] uppercase tracking-wider">
                Ajuste rápido (Plantas/m):
              </span>
              <Elastic3DSlider
                id="slider_plantas_por_metro"
                value={plantasPorMetro}
                min={1.5}
                max={7.0}
                step={0.1}
                onChange={(v) => { setPlantasPorMetro(v); setActivePreset('personalizado'); }}
                unit="pl/m"
                isDark={isDark}
                accentColor="#5A5A40"
                minLabel="1.5 pl/m"
                maxLabel="7.0 pl/m"
              />
            </div>

            {/* ESTANDE RESULT CALLOUT */}
            <motion.div
              className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-colors ${
                isDark ? 'bg-[#242720] border-[#393E32]' : 'bg-[#FAF9F5] border-[#E5E2D9]'
              }`}
              animate={{ scale: [1, 1.005, 1] }}
              transition={{ duration: 0.3 }}
              key={estande}
            >
              <div className="flex items-center gap-2">
                <Sprout className="h-4 w-4 text-[#D4A373]" />
                <span className="font-semibold text-[#5A5A40] dark:text-[#E8E7DF]">
                  Estande (População Calculada):
                </span>
              </div>
              <div className="font-mono font-bold text-sm text-[#2E6F40] dark:text-[#86efac]">
                {estande.toLocaleString('pt-BR')} <span className="text-xs font-normal">plantas/ha</span>
              </div>
            </motion.div>

            {/* 2. FILEIRAS & GRÃOS POR FILEIRA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input3D
                id="input_fileiras"
                label="Fileiras na Espiga"
                unit="fileiras"
                value={fileiras}
                onChange={(v) => { setFileiras(Math.round(v)); setActivePreset('personalizado'); }}
                step={2}
                min={10}
                max={24}
                isDark={isDark}
                accentColor="#5A5A40"
                critical={getFieldSeverity('fileiras') === 'critical'}
                warning={getFieldSeverity('fileiras') === 'warning'}
                hint="Sempre em números pares (12, 14, 16, 18, 20)."
              />
              <Input3D
                id="input_graos_por_fileira"
                label="Grãos por Fileira"
                unit="grãos"
                value={graosPorFileira}
                onChange={(v) => { setGraosPorFileira(Math.round(v)); setActivePreset('personalizado'); }}
                step={1}
                min={10}
                max={60}
                isDark={isDark}
                accentColor="#5A5A40"
                critical={getFieldSeverity('graosPorFileira') === 'critical'}
                warning={getFieldSeverity('graosPorFileira') === 'warning'}
                hint="Contagem média longitudinal de grãos."
              />
            </div>

            {/* ELASTIC SLIDERS: FILEIRAS & GRÃOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Elastic3DSlider
                id="slider_fileiras"
                value={fileiras}
                min={12}
                max={22}
                step={2}
                onChange={(v) => { setFileiras(v); setActivePreset('personalizado'); }}
                unit="fileiras"
                isDark={isDark}
                accentColor="#5A5A40"
              />
              <Elastic3DSlider
                id="slider_graos"
                value={graosPorFileira}
                min={20}
                max={50}
                step={1}
                onChange={(v) => { setGraosPorFileira(v); setActivePreset('personalizado'); }}
                unit="grãos"
                isDark={isDark}
                accentColor="#5A5A40"
              />
            </div>

            {/* 3. ESPIGAS, PMG & QUEBRA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <Input3D
                id="input_espigas"
                label="Espigas / Planta"
                unit=""
                value={espigas}
                onChange={(v) => { setEspigas(v); setActivePreset('personalizado'); }}
                step={0.05}
                min={0.5}
                max={2.0}
                isDark={isDark}
                accentColor="#D4A373"
                critical={getFieldSeverity('espigas') === 'critical'}
                warning={getFieldSeverity('espigas') === 'warning'}
                hint="Espigas viáveis por planta (questão: 1.0)."
              />

              <Input3D
                id="input_pmg"
                label="PMG (g / 1000 grãos)"
                unit="g"
                value={pmg}
                onChange={(v) => { setPmg(v); setActivePreset('personalizado'); }}
                step={5}
                min={150}
                max={450}
                isDark={isDark}
                accentColor="#D4A373"
                critical={getFieldSeverity('pmg') === 'critical'}
                warning={getFieldSeverity('pmg') === 'warning'}
                hint={`PMG unitário: ${pmgUnitario.toFixed(3)} g/grão`}
              />

              <Input3D
                id="input_quebra"
                label="Quebra / Perda (%)"
                unit={`${(quebraDecimal * 100).toFixed(1)}% (${quebraDecimal})`}
                value={quebraDecimal}
                onChange={(v) => { setQuebraDecimal(v); setActivePreset('personalizado'); }}
                step={0.01}
                min={0}
                max={0.30}
                isDark={isDark}
                accentColor="#D4A373"
                critical={getFieldSeverity('quebraDecimal') === 'critical'}
                warning={getFieldSeverity('quebraDecimal') === 'warning'}
                hint="Em decimal (ex: 0.05 para 5% de perda)."
              />
            </div>

          </div>

          {/* EDUCATIONAL STEP-BY-STEP BREAKDOWN PANEL */}
          <motion.div
            className={`rounded-2xl border p-4 transition-colors ${
              isDark ? 'bg-[#181A15] border-[#2E3326]' : 'bg-[#FAF8F3] border-[#E5E2D9]'
            }`}
          >
            <button
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#5A5A40] dark:text-[#A3B18A]"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#D4A373]" />
                <span>Memória de Cálculo Didática (Passo a Passo da Questão)</span>
              </div>
              <motion.div
                animate={{ rotate: showFormulaDetails ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </button>

            {showFormulaDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3.5 space-y-2.5 text-xs text-[#3D3D3D] dark:text-[#D5D4CB] font-mono border-t pt-3 border-[#E5E2D9] dark:border-[#2F3329]"
              >
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
              </motion.div>
            )}
          </motion.div>

        </motion.div>

        {/* RIGHT COLUMN: 3D EAR & ESTIMATED YIELD RESULTS (5 COLS) */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 250, damping: 30, delay: 0.2 }}
          className="lg:col-span-5 space-y-6"
        >
          
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
            <motion.div
              className="p-5 rounded-2xl bg-gradient-to-br from-[#5A5A40] to-[#454530] text-white shadow-md space-y-2"
              animate={{ scale: [1, 1.005, 1] }}
              transition={{ duration: 0.4 }}
              key={produtividadeLiquida}
            >
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                  Produtividade Líquida (Após Quebra)
                </span>
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <svg className="h-5 w-5 text-[#86efac]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </motion.span>
              </div>
              <div className="flex items-baseline gap-2">
                <motion.span
                  className="text-4xl sm:text-5xl font-mono font-extrabold text-white tracking-tight"
                  key={produtividadeLiquida}
                  initial={{ scale: 1.1, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {produtividadeLiquida}
                </motion.span>
                <span className="text-lg font-medium text-white/90">sc/ha</span>
              </div>
              <div className="text-xs text-white/80 pt-1 border-t border-white/20 flex justify-between">
                <span>Total em Grãos:</span>
                <strong>{Number((produtividadeLiquida * 60).toFixed(0)).toLocaleString('pt-BR')} kg/ha</strong>
              </div>
            </motion.div>

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
            <Button3D
              id="btn_apply_yield_to_n"
              variant="primary"
              size="lg"
              isDark={isDark}
              onClick={handleApplyToNitrogenCalculator}
              icon={<Sparkles className="h-4 w-4 text-[#86efac]" />}
              iconRight={<svg className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
              tooltip="Transfere esta produtividade diretamente para a calculadora de Nitrogênio"
              className="w-full"
            >
              Usar esta Produtividade no Cálculo de Nitrogênio
            </Button3D>

          </div>

        </motion.div>

      </div>

    </section>
  );
}
