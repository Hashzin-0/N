'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  HelpCircle, 
  RotateCcw, 
  CheckCircle2, 
  ChevronRight, 
  Percent, 
  Printer, 
  TrendingUp, 
  Sprout, 
  Layers, 
  BookmarkPlus,
  Database,
  Columns,
  Mic,
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import SaveScenarioModal from '@/components/SaveScenarioModal';
import ScenarioComparator from '@/components/ScenarioComparator';
import VoiceAssistantHUD from '@/components/VoiceAssistantHUD';
import DarkMode3DToggle from '@/components/DarkMode3DToggle';
import SectionNav3D from '@/components/SectionNav3D';
import LoadingSkeleton3D from '@/components/LoadingSkeleton3D';
import CornYieldCalculator from '@/components/CornYieldCalculator';
import Input3D from '@/components/Input3D';
import Button3D from '@/components/Button3D';
import Select3D from '@/components/Select3D';
import CellDivisionContainer from '@/components/CellDivisionContainer';
import { useGeminiLiveAgent } from '@/hooks/useGeminiLiveAgent';
import { useTheme } from '@/components/ThemeProvider';
import { SQLikeCalculationDB, CalculationRecord, useCalculationRecords, notifyStorageChange } from '@/lib/storage';
import { computeCalculations } from '@/lib/calculations';
import ExtracaoTotalCard from '@/components/metrics/ExtracaoTotalCard';
import NecessidadeLiquidaCard from '@/components/metrics/NecessidadeLiquidaCard';
import DoseRecomendadaCard from '@/components/metrics/DoseRecomendadaCard';
import SecondaryCreditsCard from '@/components/metrics/SecondaryCreditsCard';
import ParcelamentoSection from '@/components/metrics/ParcelamentoSection';
import BalancoSection from '@/components/metrics/BalancoSection';
import DetailedMathPanel from '@/components/metrics/DetailedMathPanel';
import ITRCalculator from '@/components/ITRCalculator';
import AbntReferenceFormatter from '@/components/AbntReferenceFormatter';
import GooeyNav, { GooeyNavItem } from '@/components/GooeyNav';

// Interfaces for structured data
interface Preset {
  id: string;
  name: string;
  description: string;
  yieldGoal: number; // sc/ha
  nRequirementPerBag: number; // kg N/sc
  mosNContribution: number; // kg N/ha
  soyNContribution: number; // kg N/ha
  efficiency: number; // 0.80 standard
  baseDose: number; // kg N/ha in base (typically 30-40)
  baseDose2: number; // 2nd value for range (0 = single value)
  v4v6Percent: number; // default 50 or 60
  v4v6Percent2: number; // 2nd % value for range (0 = single value)
  v8v10Percent: number; // default 20 or 30
  v8v10Percent2: number; // 2nd % value for range (0 = single value)
}

const PRESETS: Preset[] = [
  {
    id: 'alta_produtividade',
    name: 'Alta Produtividade',
    description: 'Milho irrigado com alta tecnologia, produtividade superior a 160 sc/ha.',
    yieldGoal: 180,
    nRequirementPerBag: 1.45,
    mosNContribution: 45,
    soyNContribution: 25,
    efficiency: 0.85,
    baseDose: 35,
    baseDose2: 0,
    v4v6Percent: 55,
    v4v6Percent2: 0,
    v8v10Percent: 20,
    v8v10Percent2: 0,
  },
  {
    id: 'produtividade_media',
    name: 'Produtividade Média',
    description: 'Milho de sequeiro com manejo padrão, produtividade entre 100-140 sc/ha.',
    yieldGoal: 120,
    nRequirementPerBag: 1.35,
    mosNContribution: 35,
    soyNContribution: 20,
    efficiency: 0.80,
    baseDose: 30,
    baseDose2: 0,
    v4v6Percent: 50,
    v4v6Percent2: 0,
    v8v10Percent: 25,
    v8v10Percent2: 0,
  },
  {
    id: 'baixa_produtividade',
    name: 'Baixa Produtividade',
    description: 'Milho com limitações hídricas ou solo pobre, produtividade abaixo de 100 sc/ha.',
    yieldGoal: 80,
    nRequirementPerBag: 1.25,
    mosNContribution: 25,
    soyNContribution: 15,
    efficiency: 0.75,
    baseDose: 25,
    baseDose2: 0,
    v4v6Percent: 45,
    v4v6Percent2: 0,
    v8v10Percent: 30,
    v8v10Percent2: 0,
  },
];

export default function Home() {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  // Input states
  const [yieldGoal, setYieldGoal] = useState<number>(0);
  const [nRequirementPerBag, setNRequirementPerBag] = useState<number>(0);
  const [mosNContribution, setMosNContribution] = useState<number>(0);
  const [soyNContribution, setSoyNContribution] = useState<number>(0);
  const [efficiency, setEfficiency] = useState<number>(0);
  
  // Custom interactive split parameters
  const [baseDose, setBaseDose] = useState<number>(0);
  const [baseDose2, setBaseDose2] = useState<number>(0); // 0 = single value mode
  const [v4v6Percent, setV4v6Percent] = useState<number>(0);
  const [v4v6Percent2, setV4v6Percent2] = useState<number>(0); // 0 = single value mode
  const [v8v10Percent, setV8v10Percent] = useState<number>(0);
  const [v8v10Percent2, setV8v10Percent2] = useState<number>(0); // 0 = single value mode
  
  // Toggle for 1 vs 2 values per application
  const [baseDoseMode, setBaseDoseMode] = useState<'single' | 'range'>('single');
  const [v4v6Mode, setV4v6Mode] = useState<'single' | 'range'>('single');
  const [v8v10Mode, setV8v10Mode] = useState<'single' | 'range'>('single');
  
  // Split base configuration: dose with losses (Dose de N a aplicar) or net requirement (Necessidade Líquida)
  const [splitBase, setSplitBase] = useState<'dose_perdas' | 'necessidade_liquida'>('dose_perdas');

  // Active Tooltips / Modal for explaining formulas
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Active scenario preset
  const [activePreset, setActivePreset] = useState<string>('personalizado');
  
  // Animation state for filling fields when loading presets
  const [fillingFields, setFillingFields] = useState<Set<string>>(new Set());
  const fillingTimersRef = useRef<NodeJS.Timeout[]>([]);

  // SQLike Local Storage states
  const savedRecords = useCalculationRecords();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculadora' | 'estimativa_milho' | 'comparador' | 'itr' | 'abnt'>('calculadora');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // GooeyNav items and tab mapping
  const gooeyNavItems: GooeyNavItem[] = [
    { label: 'Adubação Nitrogenada', href: '#' },
    { label: 'Estimativa de Produtividade', href: '#' },
    { label: 'Comparador', href: '#' },
    { label: 'ITR', href: '#' },
    { label: 'Referências ABNT', href: '#' },
  ];

  const tabToIndex: Record<string, number> = {
    calculadora: 0,
    estimativa_milho: 1,
    comparador: 2,
    itr: 3,
    abnt: 4,
  };

  const indexToTab: Record<number, string> = {
    0: 'calculadora',
    1: 'estimativa_milho',
    2: 'comparador',
    3: 'itr',
    4: 'abnt',
  };

  const handleReloadRecords = () => {
    notifyStorageChange();
  };

  // Handle preset loading with 3D staggered animation
  const handleLoadPreset = useCallback((preset: Preset) => {
    // Clear any existing timers
    fillingTimersRef.current.forEach(clearTimeout);
    fillingTimersRef.current = [];
    
    // Define the fields to fill with their delays (staggered animation)
    const fieldsToFill = [
      { name: 'yieldGoal', value: preset.yieldGoal, delay: 0 },
      { name: 'nRequirementPerBag', value: preset.nRequirementPerBag, delay: 80 },
      { name: 'mosNContribution', value: preset.mosNContribution, delay: 160 },
      { name: 'soyNContribution', value: preset.soyNContribution, delay: 240 },
      { name: 'efficiency', value: preset.efficiency * 100, delay: 320 },
      { name: 'baseDose', value: preset.baseDose, delay: 400 },
      { name: 'baseDose2', value: preset.baseDose2, delay: 450 },
      { name: 'v4v6Percent', value: preset.v4v6Percent, delay: 500 },
      { name: 'v4v6Percent2', value: preset.v4v6Percent2, delay: 550 },
      { name: 'v8v10Percent', value: preset.v8v10Percent, delay: 600 },
      { name: 'v8v10Percent2', value: preset.v8v10Percent2, delay: 650 },
    ];

    // Set the active preset immediately
    setActivePreset(preset.id);

    // Animate each field with staggered delay
    fieldsToFill.forEach(({ name, value, delay }) => {
      const timer = setTimeout(() => {
        // Add field to filling state
        setFillingFields(prev => new Set([...prev, name]));
        
        // Set the actual value
        switch (name) {
          case 'yieldGoal': setYieldGoal(value); break;
          case 'nRequirementPerBag': setNRequirementPerBag(value); break;
          case 'mosNContribution': setMosNContribution(value); break;
          case 'soyNContribution': setSoyNContribution(value); break;
          case 'efficiency': setEfficiency(value); break;
          case 'baseDose': setBaseDose(value); break;
          case 'baseDose2': setBaseDose2(value); break;
          case 'v4v6Percent': setV4v6Percent(value); break;
          case 'v4v6Percent2': setV4v6Percent2(value); break;
          case 'v8v10Percent': setV8v10Percent(value); break;
          case 'v8v10Percent2': setV8v10Percent2(value); break;
        }
        
        // Remove from filling state after animation completes
        setTimeout(() => {
          setFillingFields(prev => {
            const next = new Set(prev);
            next.delete(name);
            return next;
          });
        }, 300);
      }, delay);
      
      fillingTimersRef.current.push(timer);
    });

    // Set modes based on preset values
    const modeTimer = setTimeout(() => {
      setBaseDoseMode(preset.baseDose2 > 0 ? 'range' : 'single');
      setV4v6Mode(preset.v4v6Percent2 > 0 ? 'range' : 'single');
      setV8v10Mode(preset.v8v10Percent2 > 0 ? 'range' : 'single');
    }, 100);
    fillingTimersRef.current.push(modeTimer);
  }, []);

  // Mark custom if any state changes
  const handleCustomInputChange = (updater: () => void) => {
    updater();
    setActivePreset('personalizado');
  };

  // Calculations
  const calculations = computeCalculations({
    yieldGoal,
    nRequirementPerBag,
    mosNContribution,
    soyNContribution,
    efficiency,
    baseDose,
    baseDose2,
    baseDoseMode,
    v4v6Percent,
    v4v6Percent2,
    v8v10Percent,
    v8v10Percent2,
    splitBase,
  });

  // Save scenario to SQLike local database
  const handleSaveScenario = (name: string, notes: string) => {
    SQLikeCalculationDB.insert({
      name,
      notes,
      yield_goal: yieldGoal,
      n_req_per_bag: nRequirementPerBag,
      mos_n: mosNContribution,
      soy_n: soyNContribution,
      efficiency: efficiency,
      base_dose: baseDose,
      v4v6_percent: v4v6Percent,
      v8v10_percent: v8v10Percent,
      split_base: splitBase,
      total_extraction: calculations.totalExtraction,
      liquid_need: calculations.liquidNeed,
      recommended_dose: calculations.recommendedDose,
      selected_v4v6_val: calculations.v4v6_1_kg,
      selected_v8v10_val: calculations.v8v10_1_kg,
      sum_of_splits: calculations.sumOfSplits,
    });
    handleReloadRecords();
    setSaveToast(`Cenário "${name}" gravado com sucesso no banco local!`);
    setTimeout(() => setSaveToast(null), 4000);
  };

  // Load saved scenario from SQLike database into calculator inputs
  const handleLoadRecordIntoCalculator = (record: CalculationRecord) => {
    setYieldGoal(record.yield_goal);
    setNRequirementPerBag(record.n_req_per_bag);
    setMosNContribution(record.mos_n);
    setSoyNContribution(record.soy_n);
    setEfficiency(record.efficiency);
    setBaseDose(record.base_dose);
    setV4v6Percent(record.v4v6_percent);
    setV8v10Percent(record.v8v10_percent);
    setSplitBase(record.split_base);
    setActivePreset('personalizado');
    setActiveTab('calculadora');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSaveToast(`Cenário "${record.name}" carregado na calculadora.`);
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Handle dynamic layout print
  const handlePrint = () => {
    window.print();
  };

  // Gemini Live Voice Assistant (Puck voice + interactive UI automation)
  const voiceAgent = useGeminiLiveAgent({
    yieldGoal,
    nRequirementPerBag,
    mosNContribution,
    soyNContribution,
    efficiency,
    baseDose,
    v4v6Percent,
    v8v10Percent,
    splitBase,
    totalExtraction: calculations.totalExtraction,
    liquidNeed: calculations.liquidNeed,
    recommendedDose: calculations.recommendedDose,
    selectedV4V6Val: calculations.v4v6_1_kg,
    selectedV8V10Val: calculations.v8v10_1_kg,
    sumOfSplits: calculations.sumOfSplits,
    onSetYieldGoal: (val) => {
      setYieldGoal(val);
      setActivePreset('personalizado');
    },
    onSetSoilParameters: ({ mos, soy, efficiency: eff }) => {
      if (mos !== undefined) setMosNContribution(mos);
      if (soy !== undefined) setSoyNContribution(soy);
      if (eff !== undefined) setEfficiency(eff);
      setActivePreset('personalizado');
    },
    onSetParceling: ({ baseDose: b, v4v6Percent: p1, v8v10Percent: p2 }) => {
      if (b !== undefined) setBaseDose(b);
      if (p1 !== undefined) setV4v6Percent(p1);
      if (p2 !== undefined) setV8v10Percent(p2);
      setActivePreset('personalizado');
    },
    onLoadPreset: (presetId) => {
      const p = PRESETS.find((pr) => pr.id === presetId);
      if (p) handleLoadPreset(p);
    },
    onSaveScenario: (name, notes) => {
      handleSaveScenario(name, notes || 'Salvo via assistente Puck');
    },
  });

  return (
    <>
      <LoadingSkeleton3D
        onComplete={() => setIsLoading(false)}
        duration={4500}
      />

      <main
        id="main_container"
        className="min-h-screen bg-[#FDFBF7] dark:bg-[#121511] text-[#3D3D3D] dark:text-[#E8E6DF] antialiased pb-8 font-sans transition-colors duration-300"
        style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.5s ease-in-out' }}
      >
      {/* HERO SECTION - rolls with page */}
      <section className="bg-[#5A5A40] dark:bg-[#1E241B] text-white px-4 sm:px-6 lg:px-8 pt-6 pb-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="bg-white/10 dark:bg-white/5 text-white p-2.5 rounded-2xl border border-white/20 dark:border-white/10">
                  <Sprout id="brand_icon" className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 id="app_title" className="text-2xl sm:text-3xl font-serif italic font-bold tracking-tight text-white">
                    Agronômica N-Pro
                  </h1>
                  <p id="app_subtitle" className="text-xs sm:text-sm text-white/90 dark:text-white/80 mt-1 font-medium">
                    Calculadora de Adubação: Milho (Sucessão Soja) & Estimativa de Produtividade
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap">
              <div className="flex items-center">
                <DarkMode3DToggle />
              </div>

              <button
                id="btn_header_voice_agent"
                onClick={() => {
                  if (voiceAgent.state.isConnected) {
                    voiceAgent.disconnect();
                  } else {
                    voiceAgent.connect();
                  }
                }}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 font-bold py-2.5 px-4 rounded-xl transition-all text-sm active:scale-95 shadow-md ${
                  voiceAgent.state.isConnected
                    ? 'bg-[#2E6F40] text-white ring-2 ring-white/50'
                    : 'bg-white dark:bg-[#2A3125] text-[#5A5A40] dark:text-[#E8E6DF] hover:bg-[#F9F8F6] dark:hover:bg-[#343D2F]'
                }`}
                title="Conversar por voz com Puck (Gemini Live API)"
              >
                <Mic className={`h-4 w-4 ${voiceAgent.state.isConnected ? 'animate-bounce text-white' : 'text-[#5A5A40] dark:text-[#C5D9B0]'}`} />
                <span>{voiceAgent.state.isConnected ? 'Puck Conectado' : 'Falar com Puck'}</span>
              </button>
              <button
                id="btn_open_save_modal"
                onClick={() => setIsSaveModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#D4A373] dark:bg-[#B38356] hover:bg-[#C19262] dark:hover:bg-[#C19262] text-white font-bold py-2.5 px-4 rounded-xl transition-all text-sm active:scale-95 shadow-md shadow-[#D4A37333]"
                title="Salvar cálculo atual no banco local"
              >
                <BookmarkPlus className="h-4 w-4 text-white" />
                Salvar Cenário
              </button>
              <button
                id="btn_nav_comparator"
                onClick={() => {
                  setActiveTab('comparador');
                  const el = document.getElementById('scenario_comparator_section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/10 dark:bg-white/5 hover:bg-white/20 text-white font-semibold py-2.5 px-4 rounded-xl border border-white/20 dark:border-white/10 transition-all text-sm active:scale-95"
                title="Visualizar e comparar cenários salvos"
              >
                <Columns className="h-4 w-4 text-white" />
                Comparador ({savedRecords.length})
              </button>
              <button
                id="btn_print"
                onClick={handlePrint}
                className="p-2.5 bg-white/10 dark:bg-white/5 hover:bg-white/20 text-white rounded-xl border border-white/20 dark:border-white/10 transition-all active:scale-95"
                title="Imprimir Relatório"
              >
                <Printer className="h-4 w-4 text-white" />
              </button>
              <button
                id="btn_reset"
                onClick={() => {
                  setYieldGoal(0);
                  setNRequirementPerBag(0);
                  setMosNContribution(0);
                  setSoyNContribution(0);
                  setEfficiency(0);
                  setBaseDose(0);
                  setBaseDose2(0);
                  setBaseDoseMode('single');
                  setV4v6Percent(0);
                  setV4v6Percent2(0);
                  setV4v6Mode('single');
                  setV8v10Percent(0);
                  setV8v10Percent2(0);
                  setV8v10Mode('single');
                  setActivePreset('personalizado');
                }}
                className="flex items-center justify-center p-2.5 bg-white/10 dark:bg-white/5 hover:bg-white/20 text-white rounded-xl border border-white/20 dark:border-white/10 transition-all active:scale-95"
                title="Resetar para valores padrão"
              >
                <RotateCcw className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* STICKY SECTION NAV - sticks to top when scrolling */}
      <header
        id="app_header"
        className="sticky top-0 z-50 bg-[#5A5A40] dark:bg-[#1E241B] shadow-lg border-b border-[#4A4A30] dark:border-[#2D3528] transition-all"
      >
        {/* Mobile: horizontal nav inside sticky header */}
        <div className="lg:hidden px-4 sm:px-6 py-2">
          <SectionNav3D activeTab={activeTab} />
        </div>
      </header>

      {/* Desktop: fixed sidebar nav */}
      <aside className="hidden lg:block fixed top-0 left-0 h-screen w-[180px] bg-[#5A5A40] dark:bg-[#1E241B] shadow-lg border-r border-[#4A4A30] dark:border-[#2D3528] p-2 z-40">
        <SectionNav3D activeTab={activeTab} />
      </aside>

      {/* Main content area - offset for desktop sidebar */}
      <div className="lg:ml-[180px] px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* TOP NAVIGATION / MODE SWITCHER — GOOEY NAV */}
        <div id="app_mode_nav" className="py-2">
          <GooeyNav
            items={gooeyNavItems}
            initialActiveIndex={tabToIndex[activeTab] ?? 0}
            onNavigate={(_index, _item) => {
              const tab = indexToTab[_index];
              if (tab) setActiveTab(tab as typeof activeTab);
            }}
            particleCount={12}
            particleDistances={[80, 10]}
            particleR={80}
            animationTime={500}
            timeVariance={200}
            colors={[1, 2, 3, 1, 2, 3, 1, 4]}
          />
        </div>

        {/* TOAST NOTIFICATION FOR SAVE/LOAD ACTIONS */}
        <AnimatePresence>
          {saveToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#5A5A40] dark:bg-[#242A20] text-white p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md border border-white/10 dark:border-[#353D30]"
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                <CheckCircle2 className="h-5 w-5 text-[#D4A373] shrink-0" />
                <span>{saveToast}</span>
              </div>
              <button
                onClick={() => {
                  setActiveTab('comparador');
                  const el = document.getElementById('scenario_comparator_section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs bg-[#D4A373] text-white font-bold px-3 py-1.5 rounded-lg hover:bg-[#C19262] transition-colors shrink-0"
              >
                Ver Comparador ↓
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CORN YIELD ESTIMATION CALCULATOR (ALWAYS READY OR SWITCHABLE) */}
        <div id="corn_yield_calculator_section" className={activeTab === 'estimativa_milho' ? 'block' : 'hidden'}>
          <CornYieldCalculator
            onApplyYieldGoal={(scHa) => {
              setYieldGoal(scHa);
              setActivePreset('personalizado');
              setActiveTab('calculadora');
              setSaveToast(`Meta de ${scHa} sc/ha calculada e aplicada na Adubação Nitrogenada!`);
              setTimeout(() => setSaveToast(null), 4500);
            }}
          />
        </div>

        {/* COMPARATOR VIEW TAB */}
        <div className={activeTab === 'comparador' ? 'block' : 'hidden'}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#5A5A40] dark:text-[#E8E6DF] flex items-center gap-2">
              <Columns className="h-5 w-5 text-[#5A5A40] dark:text-[#9CB386]" />
              Banco de Cenários e Comparador Agronômico
            </h2>
            <button
              onClick={() => setActiveTab('calculadora')}
              className="text-xs font-bold text-[#5A5A40] dark:text-[#9CB386] hover:underline flex items-center gap-1"
            >
              Voltar para Calculadora →
            </button>
          </div>
        </div>

        {/* ITR CALCULATOR TAB */}
        <div id="itr_section" className={activeTab === 'itr' ? 'block' : 'hidden'}>
          <ITRCalculator />
        </div>

        {/* ABNT REFERENCE FORMATTER TAB */}
        <div id="abnt_section" className={activeTab === 'abnt' ? 'block' : 'hidden'}>
          <AbntReferenceFormatter />
        </div>

        {/* MAIN NITROGEN CALCULATOR VIEW */}
        <div className={activeTab === 'calculadora' ? 'space-y-8 block' : 'hidden'}>
          {/* QUICK PROMPT TO OPEN CORN YIELD CALCULATOR */}
          <div className="bg-[#FDFBF7] dark:bg-[#1A1E18] border border-[#E5E2D9] dark:border-[#2C3328] p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#D4A373]/20 dark:bg-[#D4A373]/10 text-[#D4A373] rounded-xl shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#5A5A40] dark:text-[#E8E6DF]">
                  Precisa calcular a produtividade estimada da lavoura primeiro?
                </h4>
                <p className="text-xs text-[#8C897E] dark:text-[#9EA399]">
                  Estime sacas por hectare a partir de plantas/metro, espaçamento, espigas, grãos e PMG com visualização.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('estimativa_milho')}
              className="flex items-center gap-1.5 text-xs font-bold bg-[#D4A373] hover:bg-[#C19262] text-white px-4 py-2 rounded-xl transition-all shrink-0 shadow-sm"
            >
              <span>Abrir Calculadora de Espigas</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* PERSISTENT SCENARIO SELECTOR */}
          <section id="preset_selector" className="bg-white dark:bg-[#1C201A] p-6 rounded-3xl shadow-sm border border-[#E5E2D9] dark:border-[#2C3328] transition-colors">
            <h2 className="text-xs font-bold text-[#8C897E] dark:text-[#9EA399] uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-[#F0EDE5] dark:border-[#2C3328] pb-2">
              <Layers className="h-3.5 w-3.5 text-[#8C897E] dark:text-[#9EA399]" /> Cenários e Exercícios Prontos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  id={`preset_btn_${p.id}`}
                  onClick={() => handleLoadPreset(p)}
                  className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden ${
                    activePreset === p.id 
                      ? 'border-[#5A5A40] dark:border-[#9CB386] bg-[#F9F8F6] dark:bg-[#232821] ring-1 ring-[#5A5A40] dark:ring-[#9CB386]' 
                      : 'border-[#E5E2D9] dark:border-[#2C3328] hover:border-[#8C897E] dark:hover:border-[#4B5545] hover:bg-[#F9F8F6]/50 dark:hover:bg-[#232821]/50'
                  }`}
                >
                  <div className="font-semibold text-sm text-[#5A5A40] dark:text-[#E8E6DF] flex items-center gap-1.5">
                    {p.name}
                    {activePreset === p.id && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D4A373] inline-block animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-1 line-clamp-1">{p.description}</p>
                  <div className="mt-2.5 flex gap-3 text-[10px] font-medium text-[#8C897E] dark:text-[#9EA399] border-t border-[#F0EDE5] dark:border-[#2C3328] pt-2">
                    <span>Prod: <strong className="text-[#5A5A40] dark:text-[#9CB386]">{p.yieldGoal} sc/ha</strong></span>
                    <span>MOS: <strong className="text-[#5A5A40] dark:text-[#9CB386]">{p.mosNContribution} kg/ha</strong></span>
                  </div>
                </button>
              ))}
              <button
                id="preset_btn_custom"
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  activePreset === 'personalizado' 
                    ? 'border-[#D4A373] dark:border-[#D4A373] bg-[#FDFBF7] dark:bg-[#232821] ring-1 ring-[#D4A373]' 
                    : 'border-dashed border-[#E5E2D9] dark:border-[#2C3328] hover:border-[#8C897E] bg-[#F9F8F6]/30 dark:bg-[#1C201A]/30'
                }`}
                disabled
              >
                <div className="font-semibold text-sm text-[#3D3D3D] dark:text-[#E8E6DF] flex items-center gap-1.5">
                  Cenário Customizado
                  {activePreset === 'personalizado' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D4A373] inline-block" />
                  )}
                </div>
                <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-1">Valores ajustados manualmente no formulário.</p>
                <div className="mt-2.5 flex gap-3 text-[10px] font-medium text-[#8C897E] dark:text-[#9EA399] border-t border-[#F0EDE5] dark:border-[#2C3328] pt-2">
                  <span>Editando valores...</span>
                </div>
              </button>
            </div>
          </section>

        {/* TWO-COLUMN LAYOUT */}
        <div id="main_grid" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: PARAMETER FORM */}
          <section id="form_section" className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-[#1C201A] p-6 rounded-3xl shadow-sm border border-[#E5E2D9] dark:border-[#2C3328] space-y-6 transition-colors">
              
              <div className="border-b border-[#F0EDE5] dark:border-[#2C3328] pb-4">
                <h2 className="text-lg font-bold text-[#5A5A40] dark:text-[#E8E6DF] flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-[#5A5A40] dark:text-[#9CB386]" /> Entrada de Dados
                </h2>
                <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-1">Ajuste os dados de produtividade e histórico do solo</p>
              </div>

              <div className="space-y-5">
                {/* Product Goal */}
                <Input3D
                  id="input_group_yield_goal"
                  label="Produtividade Alvo"
                  unit="sc/ha"
                  value={yieldGoal}
                  onChange={(v) => handleCustomInputChange(() => setYieldGoal(v))}
                  step={5}
                  min={50}
                  max={250}
                  placeholder="Ex: 160"
                  isDark={isDark}
                  accentColor="#5A5A40"
                  hint="Meta de rendimento em sacas de 60kg por hectare."
                  filling={fillingFields.has('yieldGoal')}
                />

                {/* N Requirement */}
                <Input3D
                  label="N necessário por saca produzida"
                  unit="kg N/sc"
                  value={nRequirementPerBag}
                  onChange={(v) => handleCustomInputChange(() => setNRequirementPerBag(Math.max(0, v)))}
                  step={0.05}
                  min={0.5}
                  max={2.5}
                  placeholder="Ex: 1.35"
                  isDark={isDark}
                  accentColor="#5A5A40"
                  hint="Extração unitária: 1.2 a 1.5 kg N por saca (padrão: 1.35)."
                  filling={fillingFields.has('nRequirementPerBag')}
                />

                {/* MOS Contribution */}
                <Input3D
                  id="input_group_soil"
                  label="N fornecido pela M.O. (MOS)"
                  unit="kg N/ha"
                  value={mosNContribution}
                  onChange={(v) => handleCustomInputChange(() => setMosNContribution(Math.max(0, v)))}
                  step={1}
                  min={0}
                  max={150}
                  placeholder="Ex: 40"
                  isDark={isDark}
                  accentColor="#5A5A40"
                  hint="Mineralização da Matéria Orgânica do Solo."
                  filling={fillingFields.has('mosNContribution')}
                />

                {/* Soy Credit */}
                <Input3D
                  label="Crédito de N pela Soja (cultura anterior)"
                  unit="kg N/ha"
                  value={soyNContribution}
                  onChange={(v) => handleCustomInputChange(() => setSoyNContribution(Math.max(0, v)))}
                  step={1}
                  min={0}
                  max={100}
                  placeholder="Ex: 20"
                  isDark={isDark}
                  accentColor="#5A5A40"
                  hint="Crédito de N da soja: 15 a 30 kg N/ha na sucessão Soja-Milho."
                  filling={fillingFields.has('soyNContribution')}
                />

                {/* Efficiency rate */}
                <Input3D
                  id="input_group_efficiency"
                  label="Eficiência de Aplicação (%)"
                  unit="%"
                  value={efficiency}
                  onChange={(v) => handleCustomInputChange(() => setEfficiency(v))}
                  onBlurCustom={(v) => handleCustomInputChange(() => setEfficiency(Math.min(100, Math.max(10, v))))}
                  step={1}
                  min={10}
                  max={100}
                  placeholder="Ex: 80"
                  isDark={isDark}
                  accentColor="#5A5A40"
                  hint="Eficiência padrão: 80% (fator 0.8). Perdas por volatilização/lixiviação."
                  filling={fillingFields.has('efficiency')}
                />

              </div>

            </div>

            {/* SEPARATE CONFIGURATION FOR CHOSEN SPLIT PERCENTAGES */}
            <div className="bg-white dark:bg-[#1C201A] p-6 rounded-3xl shadow-sm border border-[#E5E2D9] dark:border-[#2C3328] space-y-6 transition-colors">
              <div className="border-b border-[#F0EDE5] dark:border-[#2C3328] pb-4">
                <h3 className="text-sm font-bold text-[#5A5A40] dark:text-[#E8E6DF] uppercase tracking-wider flex items-center gap-2">
                  <Percent className="h-5 w-5 text-[#5A5A40] dark:text-[#9CB386]" /> Configuração do Parcelamento
                </h3>
                <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-1">Configure as dosagens reais que deseja validar</p>
              </div>

              <div className="space-y-5">
                {/* Switch split base */}
                <Select3D
                  label="Base para cálculo do parcelamento:"
                  value={splitBase}
                  onChange={(v) => handleCustomInputChange(() => setSplitBase(v as 'dose_perdas' | 'necessidade_liquida'))}
                  isDark={isDark}
                  accentColor="#D4A373"
                  options={[
                    {
                      value: 'dose_perdas',
                      label: `Dose com Perdas (${calculations.recommendedDose} kg N/ha)`,
                      description: 'Inclui perdas por eficiência',
                    },
                    {
                      value: 'necessidade_liquida',
                      label: `Necessidade Líquida (${calculations.liquidNeed} kg N/ha)`,
                      description: 'Sem correção de perdas',
                    },
                  ]}
                />

                {/* 1st Application — Base/Semeadura (kg N/ha) — Cell Division Animation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#3D3D3D] dark:text-[#E8E6DF]">
                      1ª Aplicação (Base / Semeadura)
                    </span>
                    <Select3D
                      value={baseDoseMode}
                      onChange={(v) => handleCustomInputChange(() => {
                        const newMode = v as 'single' | 'range';
                        setBaseDoseMode(newMode);
                        if (newMode === 'single') {
                          setBaseDose2(0);
                          setV4v6Mode('single');
                          setV4v6Percent2(0);
                          setV8v10Mode('single');
                          setV8v10Percent2(0);
                        }
                      })}
                      isDark={isDark}
                      accentColor="#D4A373"
                      options={[
                        { value: 'single', label: '1 valor' },
                        { value: 'range', label: '2 valores' },
                      ]}
                      className="!inline-flex !w-auto"
                    />
                  </div>

                  <CellDivisionContainer
                    mode={baseDoseMode}
                    onModeChange={(m) => handleCustomInputChange(() => {
                      setBaseDoseMode(m);
                      if (m === 'single') {
                        setBaseDose2(0);
                        setV4v6Mode('single');
                        setV4v6Percent2(0);
                        setV8v10Mode('single');
                        setV8v10Percent2(0);
                      }
                    })}
                    accentColor="#D4A373"
                    isDark={isDark}
                  >
                    <Input3D
                      label={baseDoseMode === 'range' ? 'Min (kg N/ha)' : 'Valor (kg N/ha)'}
                      labelMorph
                      unit="kg N/ha"
                      value={baseDose}
                      onChange={(v) => handleCustomInputChange(() => setBaseDose(v))}
                      step={1}
                      min={0}
                      max={100}
                      placeholder="Ex: 35"
                      isDark={isDark}
                      accentColor="#D4A373"
                      filling={fillingFields.has('baseDose')}
                    />
                    <Input3D
                      label="Max (kg N/ha)"
                      unit="kg N/ha"
                      value={baseDose2}
                      onChange={(v) => handleCustomInputChange(() => setBaseDose2(v))}
                      step={1}
                      min={0}
                      max={100}
                      placeholder="0"
                      isDark={isDark}
                      accentColor="#D4A373"
                      filling={fillingFields.has('baseDose2')}
                    />
                  </CellDivisionContainer>

                  <p className="text-[10px] text-[#8C897E] dark:text-[#9EA399] mt-1 leading-relaxed">
                    * Faixa agronômica típica: 30 a 40 kg N/ha.
                  </p>
                </div>

                {/* 2nd Application — V4-V6 (% values) — Cell Division Animation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#3D3D3D] dark:text-[#E8E6DF]">
                      2ª Aplicação (V4-V6) — Percentual
                    </span>
                    {baseDoseMode === 'single' ? (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isDark ? 'bg-[#2C3328] text-[#9CB386]' : 'bg-[#F0EDE5] text-[#5A5A40]'
                      }`}>
                        1 valor %
                      </span>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isDark ? 'bg-[#2C3328] text-[#9CB386]' : 'bg-[#F0EDE5] text-[#5A5A40]'
                      }`}>
                        2 valores %
                      </span>
                    )}
                  </div>

                  <CellDivisionContainer
                    mode={baseDoseMode}
                    onModeChange={(m) => handleCustomInputChange(() => {
                      if (baseDoseMode === 'single') return;
                      if (m === 'single') setV4v6Percent2(0);
                    })}
                    accentColor="#5A5A40"
                    isDark={isDark}
                  >
                    <Input3D
                      label={baseDoseMode === 'single' ? '% do total' : (baseDoseMode === 'range' ? 'Min %' : '% do total')}
                      labelMorph
                      unit="%"
                      value={v4v6Percent}
                      onChange={(v) => handleCustomInputChange(() => setV4v6Percent(v))}
                      step={1}
                      min={0}
                      max={100}
                      placeholder="Ex: 50"
                      isDark={isDark}
                      accentColor="#5A5A40"
                      filling={fillingFields.has('v4v6Percent')}
                    />
                    {baseDoseMode !== 'single' && (
                      <Input3D
                        label="Max %"
                        labelMorph
                        unit="%"
                        value={v4v6Percent2}
                        onChange={(v) => handleCustomInputChange(() => setV4v6Percent2(v))}
                        step={1}
                        min={0}
                        max={100}
                        placeholder="0"
                        isDark={isDark}
                        accentColor="#5A5A40"
                        filling={fillingFields.has('v4v6Percent2')}
                      />
                    )}
                  </CellDivisionContainer>

                  <p className="text-[10px] text-[#8C897E] dark:text-[#9EA399] leading-relaxed">
                    * Faixa agronômica padrão: 50% a 60% do total.
                  </p>
                </div>

                {/* 3rd Application — V8-V10 (% values, auto-calculated) — Cell Division Animation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#3D3D3D] dark:text-[#E8E6DF]">
                      3ª Aplicação (V8-V10) — Percentual
                    </span>
                    {baseDoseMode === 'single' ? (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isDark ? 'bg-[#2C3328] text-[#D4A373]' : 'bg-[#F0EDE5] text-[#8D6E63]'
                      }`}>
                        Auto-calculado
                      </span>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isDark ? 'bg-[#2C3328] text-[#D4A373]' : 'bg-[#F0EDE5] text-[#8D6E63]'
                      }`}>
                        2 valores %
                      </span>
                    )}
                  </div>

                  {baseDoseMode === 'single' ? (
                    <>
                      <div className={`p-4 rounded-xl border text-center ${
                        isDark ? 'bg-[#242720] border-[#393E32]' : 'bg-[#FAF9F5] border-[#E5E2D9]'
                      }`}>
                        <span className={`text-[10px] font-bold block mb-1 ${
                          isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'
                        }`}>Auto-calculado para fechar o balanço</span>
                        <span className="text-lg font-bold text-[#8D6E63] dark:text-[#D4A373]">
                          {calculations.v8v10_1_auto}%
                        </span>
                        <span className={`text-xs ml-2 ${
                          isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'
                        }`}>do total</span>
                      </div>
                    </>
                  ) : (
                    <CellDivisionContainer
                      mode={baseDoseMode}
                      onModeChange={(m) => handleCustomInputChange(() => {
                        if (m === 'single') setV8v10Percent2(0);
                      })}
                      accentColor="#8D6E63"
                      isDark={isDark}
                    >
                      <Input3D
                        label={baseDoseMode === 'range' ? 'Min %' : '% do total'}
                        labelMorph
                        unit="%"
                        value={v8v10Percent}
                        onChange={(v) => handleCustomInputChange(() => setV8v10Percent(v))}
                        step={1}
                        min={0}
                        max={100}
                        placeholder="Ex: 20"
                        isDark={isDark}
                        accentColor="#8D6E63"
                        derived={v8v10Percent === 0}
                        hint={v8v10Percent === 0 ? `Auto-calculado: ${calculations.v8v10_1_auto}%` : undefined}
                        filling={fillingFields.has('v8v10Percent')}
                      />
                      <Input3D
                        label="Max %"
                        labelMorph
                        unit="%"
                        value={v8v10Percent2}
                        onChange={(v) => handleCustomInputChange(() => setV8v10Percent2(v))}
                        step={1}
                        min={0}
                        max={100}
                        placeholder="0"
                        isDark={isDark}
                        accentColor="#8D6E63"
                        derived={v8v10Percent2 === 0 && v4v6Percent2 > 0}
                        hint={v8v10Percent2 === 0 && v4v6Percent2 > 0 ? `Auto-calculado: ${calculations.v8v10_2_auto}%` : undefined}
                        filling={fillingFields.has('v8v10Percent2')}
                      />
                    </CellDivisionContainer>
                  )}

                  <p className="text-[10px] text-[#8C897E] dark:text-[#9EA399] leading-relaxed">
                    * Se deixar em 0%, o sistema calcula automaticamente para fechar o balanço. Faixa padrão: 20% a 30%.
                  </p>
                </div>
              </div>
            </div>

          </section>

          {/* RIGHT COLUMN: REAL-TIME OUTPUTS & CALCULATIONS */}
          <section id="results_section" className="lg:col-span-7 space-y-6">
            
            {/* CORE METRICS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ExtracaoTotalCard
                totalExtraction={calculations.totalExtraction}
                yieldGoal={yieldGoal}
                nRequirementPerBag={nRequirementPerBag}
              />
              <NecessidadeLiquidaCard
                liquidNeed={calculations.liquidNeed}
                totalExtraction={calculations.totalExtraction}
                mosNContribution={mosNContribution}
                soyNContribution={soyNContribution}
              />
              <div id="card_dose_total" className="col-span-2 sm:col-span-3">
                <DoseRecomendadaCard
                  recommendedDose={calculations.recommendedDose}
                  liquidNeed={calculations.liquidNeed}
                  efficiency={efficiency}
                  onSaveClick={() => setIsSaveModalOpen(true)}
                />
              </div>
            </div>

            {/* SECONDARY METRICS: MOS AND SOY CREDITS */}
            <SecondaryCreditsCard
              totalExtraction={calculations.totalExtraction}
              mosNContribution={mosNContribution}
              soyNContribution={soyNContribution}
            />

            {/* DYNAMIC PARCELAMENTO DISCLOSURES PANEL */}
            <ParcelamentoSection
              calculations={calculations}
              splitBase={splitBase}
              v4v6Percent={v4v6Percent}
              v4v6Percent2={v4v6Percent2}
              v8v10Percent={v8v10Percent}
              v8v10Percent2={v8v10Percent2}
              baseDoseMode={baseDoseMode}
            />

            {/* BALANCO SECTION */}
            <BalancoSection calculations={calculations} />

          </section>

        </div>

        {/* DETAILED FORMULA AND MATHEMATICAL EXPLANATIONS PANEL */}
        <DetailedMathPanel
          calculations={calculations}
          mosNContribution={mosNContribution}
          soyNContribution={soyNContribution}
        />
        </div>

        {/* SQLIKE STORAGE & COMPARATOR SECTION */}
        <div className={activeTab === 'comparador' ? 'block' : 'hidden'}>
          <ScenarioComparator
            records={savedRecords}
            onReloadRecords={handleReloadRecords}
            onLoadIntoCalculator={(rec) => {
              handleLoadRecordIntoCalculator(rec);
              setActiveTab('calculadora');
            }}
            activeCalculationData={{
              yieldGoal,
              nRequirementPerBag,
              mosNContribution,
              soyNContribution,
              efficiency,
              baseDose,
              baseDose2,
              v4v6Percent,
              v4v6Percent2,
              v8v10Percent,
              v8v10Percent2,
              splitBase,
              totalExtraction: calculations.totalExtraction,
              liquidNeed: calculations.liquidNeed,
              recommendedDose: calculations.recommendedDose,
              selectedV4V6Val: calculations.v4v6_1_kg,
              selectedV8V10Val: calculations.v8v10_1_kg,
              sumOfSplits: calculations.sumOfSplits,
            }}
          />
        </div>

        {/* MODAL TO SAVE SCENARIO */}
        <SaveScenarioModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSaveScenario}
          currentData={{
            yieldGoal,
            nRequirementPerBag,
            mosNContribution,
            soyNContribution,
            efficiency,
            baseDose,
            baseDose2,
            v4v6Percent,
            v4v6Percent2,
            v8v10Percent,
            v8v10Percent2,
            splitBase,
            totalExtraction: calculations.totalExtraction,
            liquidNeed: calculations.liquidNeed,
            recommendedDose: calculations.recommendedDose,
            selectedV4V6Val: calculations.v4v6_1_kg,
            selectedV8V10Val: calculations.v8v10_1_kg,
            sumOfSplits: calculations.sumOfSplits,
          }}
        />

        {/* GEMINI LIVE VOICE ASSISTANT HUD WITH 3D ORB */}
        <VoiceAssistantHUD
          agentState={voiceAgent.state}
          onConnect={voiceAgent.connect}
          onDisconnect={voiceAgent.disconnect}
          onToggleMute={voiceAgent.toggleMute}
        />


        {/* FOOTER */}
        <footer className="p-4 text-center border-t border-[#F0EDE5] dark:border-[#2C3328] text-[10px] text-[#8C897E] dark:text-[#9EA399] bg-[#F9F8F6] dark:bg-[#1C201A] rounded-2xl transition-colors">
          🌿 Desenvolvido para auxílio na tomada de decisão agronômica. Consulte sempre um Engenheiro Agrônomo.
        </footer>

      </div>
    </main>
    </>
  );
}
