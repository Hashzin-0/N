'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  HelpCircle, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Percent, 
  Scale, 
  FileSpreadsheet, 
  Printer, 
  TrendingUp, 
  Sprout, 
  Layers, 
  ArrowRightLeft,
  Info,
  BookmarkPlus,
  Database,
  Columns,
  Mic,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import SaveScenarioModal from '@/components/SaveScenarioModal';
import ScenarioComparator from '@/components/ScenarioComparator';
import VoiceAssistantHUD from '@/components/VoiceAssistantHUD';
import DarkMode3DToggle from '@/components/DarkMode3DToggle';
import CornYieldCalculator from '@/components/CornYieldCalculator';
import { useGeminiLiveAgent } from '@/hooks/useGeminiLiveAgent';
import { SQLikeCalculationDB, CalculationRecord, useCalculationRecords, notifyStorageChange } from '@/lib/storage';

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
  v4v6Percent: number; // default 50 or 60
  v8v10Percent: number; // default 20 or 30
}

const PRESETS: Preset[] = [
  {
    id: 'padrao',
    name: 'Exemplo Agronômico Padrão',
    description: 'Parâmetros médios recomendados para solos de fertilidade média.',
    yieldGoal: 150,
    nRequirementPerBag: 1.35,
    mosNContribution: 30,
    soyNContribution: 20,
    efficiency: 0.80,
    baseDose: 30,
    v4v6Percent: 50,
    v8v10Percent: 30,
  },
  {
    id: 'alta_produtividade',
    name: 'Alta Produtividade',
    description: 'Para metas de produtividade desafiadoras e alta tecnologia.',
    yieldGoal: 180,
    nRequirementPerBag: 1.40,
    mosNContribution: 25,
    soyNContribution: 25,
    efficiency: 0.80,
    baseDose: 40,
    v4v6Percent: 55,
    v8v10Percent: 25,
  },
  {
    id: 'solo_arenoso',
    name: 'Solo Arenoso / Baixa M.O.',
    description: 'Solos com menor teor de matéria orgânica seca e maior risco de lixiviação.',
    yieldGoal: 120,
    nRequirementPerBag: 1.30,
    mosNContribution: 15,
    soyNContribution: 15,
    efficiency: 0.80,
    baseDose: 30,
    v4v6Percent: 60,
    v8v10Percent: 20,
  }
];

export default function Home() {
  // Input states
  const [yieldGoal, setYieldGoal] = useState<number>(150);
  const [nRequirementPerBag, setNRequirementPerBag] = useState<number>(1.35);
  const [mosNContribution, setMosNContribution] = useState<number>(30);
  const [soyNContribution, setSoyNContribution] = useState<number>(20);
  const [efficiency, setEfficiency] = useState<number>(80);
  
  // Custom interactive split parameters
  const [baseDose, setBaseDose] = useState<number>(30);
  const [v4v6Percent, setV4v6Percent] = useState<number>(50);
  const [v8v10Percent, setV8v10Percent] = useState<number>(30);
  
  // Split base configuration: dose with losses (Dose de N a aplicar) or net requirement (Necessidade Líquida)
  const [splitBase, setSplitBase] = useState<'dose_perdas' | 'necessidade_liquida'>('dose_perdas');

  // Active Tooltips / Modal for explaining formulas
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Active scenario preset
  const [activePreset, setActivePreset] = useState<string>('padrao');

  // SQLike Local Storage states
  const savedRecords = useCalculationRecords();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculadora' | 'estimativa_milho' | 'comparador'>('calculadora');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const handleReloadRecords = () => {
    notifyStorageChange();
  };

  // Handle preset loading
  const handleLoadPreset = (preset: Preset) => {
    setYieldGoal(preset.yieldGoal);
    setNRequirementPerBag(preset.nRequirementPerBag);
    setMosNContribution(preset.mosNContribution);
    setSoyNContribution(preset.soyNContribution);
    setEfficiency(preset.efficiency * 100);
    setBaseDose(preset.baseDose);
    setV4v6Percent(preset.v4v6Percent);
    setV8v10Percent(preset.v8v10Percent);
    setActivePreset(preset.id);
  };

  // Mark custom if any state changes
  const handleCustomInputChange = (updater: () => void) => {
    updater();
    setActivePreset('personalizado');
  };

  // Calculations
  const calculations = useMemo(() => {
    const totalExtraction = Number((yieldGoal * nRequirementPerBag).toFixed(2));
    const liquidNeed = Number((totalExtraction - mosNContribution - soyNContribution).toFixed(2));
    
    // Correction for efficiency (e.g. 80% = / 0.8)
    const effDecimal = efficiency / 100;
    const recommendedDose = Number((liquidNeed / effDecimal).toFixed(2));

    // Base target for split applications
    const targetSplitTotal = splitBase === 'dose_perdas' ? recommendedDose : liquidNeed;

    // Split calculations for 50% and 60% for V4-V6 based on target
    const v4v6_50 = Number((targetSplitTotal * 0.50).toFixed(2));
    const v4v6_60 = Number((targetSplitTotal * 0.60).toFixed(2));

    // Split calculations for 20% and 30% for V8-V10 based on target
    const v8v10_20 = Number((targetSplitTotal * 0.20).toFixed(2));
    const v8v10_30 = Number((targetSplitTotal * 0.30).toFixed(2));

    // User selected split values
    const selectedV4V6Val = Number((targetSplitTotal * (v4v6Percent / 100)).toFixed(2));
    const selectedV8V10Val = Number((targetSplitTotal * (v8v10Percent / 100)).toFixed(2));

    // Total of the three applications
    const sumOfSplits = Number((baseDose + selectedV4V6Val + selectedV8V10Val).toFixed(2));
    
    // Difference between splits sum and actual net/recommended target
    const splitDiscrepancy = Number((sumOfSplits - targetSplitTotal).toFixed(2));

    // Difference between the two main split doses (v4-v6 vs v8-v10)
    const splitDifference = Number(Math.abs(selectedV4V6Val - selectedV8V10Val).toFixed(2));

    return {
      totalExtraction,
      liquidNeed,
      recommendedDose,
      targetSplitTotal,
      v4v6_50,
      v4v6_60,
      v8v10_20,
      v8v10_30,
      selectedV4V6Val,
      selectedV8V10Val,
      sumOfSplits,
      splitDiscrepancy,
      splitDifference
    };
  }, [yieldGoal, nRequirementPerBag, mosNContribution, soyNContribution, efficiency, baseDose, v4v6Percent, v8v10Percent, splitBase]);

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
      selected_v4v6_val: calculations.selectedV4V6Val,
      selected_v8v10_val: calculations.selectedV8V10Val,
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
    selectedV4V6Val: calculations.selectedV4V6Val,
    selectedV8V10Val: calculations.selectedV8V10Val,
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
    <main id="main_container" className="min-h-screen bg-[#FDFBF7] dark:bg-[#121511] text-[#3D3D3D] dark:text-[#E8E6DF] antialiased py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* TOP BRANDING / HEADER - NATURAL TONES STYLE */}
        <header id="app_header" className="bg-[#5A5A40] dark:bg-[#1E241B] text-white p-6 sm:p-8 rounded-3xl shadow-md border border-transparent dark:border-[#2D3528] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
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
            {/* 3D Dark Mode Toggle */}
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
              onClick={() => handleLoadPreset(PRESETS[0])}
              className="flex items-center justify-center p-2.5 bg-white/10 dark:bg-white/5 hover:bg-white/20 text-white rounded-xl border border-white/20 dark:border-white/10 transition-all active:scale-95"
              title="Resetar para valores padrão"
            >
              <RotateCcw className="h-4 w-4 text-white" />
            </button>
          </div>
        </header>

        {/* TOP NAVIGATION / MODE SWITCHER BAR */}
        <nav id="app_mode_nav" className="bg-white dark:bg-[#1C201A] p-2 rounded-2xl border border-[#E5E2D9] dark:border-[#2C3328] shadow-sm flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              id="tab_btn_nitrogen"
              onClick={() => setActiveTab('calculadora')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'calculadora'
                  ? 'bg-[#5A5A40] text-white shadow-sm dark:bg-[#2F372A]'
                  : 'text-[#8C897E] hover:text-[#5A5A40] dark:text-[#9EA399] dark:hover:text-[#E8E6DF] hover:bg-[#F9F8F6] dark:hover:bg-[#232821]'
              }`}
            >
              <Sprout className="h-4 w-4" />
              <span>Adubação Nitrogenada</span>
            </button>
            <button
              id="tab_btn_corn_yield"
              onClick={() => setActiveTab('estimativa_milho')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'estimativa_milho'
                  ? 'bg-[#D4A373] text-white shadow-sm dark:bg-[#B08053]'
                  : 'text-[#8C897E] hover:text-[#D4A373] dark:text-[#9EA399] dark:hover:text-[#E8E6DF] hover:bg-[#F9F8F6] dark:hover:bg-[#232821]'
              }`}
            >
              <Calculator className="h-4 w-4" />
              <span>Estimativa de Produtividade (Milho)</span>
              <span className="text-[10px] bg-black/10 dark:bg-white/20 px-1.5 py-0.5 rounded-md font-bold uppercase">3D</span>
            </button>
            <button
              id="tab_btn_comparator"
              onClick={() => setActiveTab('comparador')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'comparador'
                  ? 'bg-[#5A5A40] text-white shadow-sm dark:bg-[#2F372A]'
                  : 'text-[#8C897E] hover:text-[#5A5A40] dark:text-[#9EA399] dark:hover:text-[#E8E6DF] hover:bg-[#F9F8F6] dark:hover:bg-[#232821]'
              }`}
            >
              <Columns className="h-4 w-4" />
              <span>Comparador de Cenários ({savedRecords.length})</span>
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 text-xs text-[#8C897E] dark:text-[#9EA399]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#2E6F40] animate-pulse" />
            <span>Puck Live Assistant Ativo</span>
          </div>
        </nav>

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
                  Estime sacas por hectare a partir de plantas/metro, espaçamento, espigas, grãos e PMG com visualização 3D.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('estimativa_milho')}
              className="flex items-center gap-1.5 text-xs font-bold bg-[#D4A373] hover:bg-[#C19262] text-white px-4 py-2 rounded-xl transition-all shrink-0 shadow-sm"
            >
              <span>Abrir Calculadora de Espigas 3D</span>
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
                <div id="input_group_yield_goal" className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[11px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase tracking-wider flex items-center gap-1.5">
                      Produtividade Alvo
                      <button 
                        type="button" 
                        onClick={() => setActiveTooltip(activeTooltip === 'prod' ? null : 'prod')}
                        className="text-[#8C897E] dark:text-[#9EA399] hover:text-[#5A5A40] dark:hover:text-[#9CB386]"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </label>
                    <span className="text-xs font-bold text-[#5A5A40] dark:text-[#E8E6DF] bg-[#F9F8F6] dark:bg-[#232821] border border-[#E5E2D9] dark:border-[#2C3328] px-2 py-0.5 rounded-md">
                      {yieldGoal} sc/ha
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="250"
                    step="5"
                    value={yieldGoal}
                    onChange={(e) => handleCustomInputChange(() => setYieldGoal(Number(e.target.value)))}
                    className="w-full h-2 bg-[#F0EDE5] dark:bg-[#2D3429] rounded-lg appearance-none cursor-pointer accent-[#5A5A40] dark:accent-[#9CB386]"
                  />
                  <div className="flex justify-between text-[10px] text-[#8C897E] dark:text-[#9EA399] font-semibold px-0.5">
                    <span>50 sc/ha</span>
                    <span>150 sc/ha</span>
                    <span>250 sc/ha</span>
                  </div>
                  
                  {activeTooltip === 'prod' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs bg-[#F9F8F6] dark:bg-[#232821] text-[#3D3D3D] dark:text-[#E8E6DF] p-3 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328] mt-2 space-y-1"
                    >
                      <p><strong>Meta de Rendimento (sc/ha):</strong> Representa a expectativa de colheita em sacas de 60kg por hectare.</p>
                    </motion.div>
                  )}
                </div>

                {/* N Requirement */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[11px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase tracking-wider flex items-center gap-1.5">
                      N necessário por saca produzida
                      <button 
                        type="button" 
                        onClick={() => setActiveTooltip(activeTooltip === 'n_req' ? null : 'n_req')}
                        className="text-[#8C897E] dark:text-[#9EA399] hover:text-[#5A5A40] dark:hover:text-[#9CB386]"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </label>
                    <span className="text-xs font-bold text-[#5A5A40] dark:text-[#E8E6DF] bg-[#F9F8F6] dark:bg-[#232821] border border-[#E5E2D9] dark:border-[#2C3328] px-2 py-0.5 rounded-md">
                      {nRequirementPerBag.toFixed(2)} kg N/sc
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="2.5"
                      value={nRequirementPerBag}
                      onChange={(e) => handleCustomInputChange(() => setNRequirementPerBag(Math.max(0, Number(e.target.value))))}
                      className="w-full text-sm bg-[#F9F8F6] dark:bg-[#151813] border border-[#E5E2D9] dark:border-[#2C3328] rounded-xl px-4 py-3 font-semibold text-[#5A5A40] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                    />
                  </div>
                  
                  {activeTooltip === 'n_req' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs bg-[#F9F8F6] dark:bg-[#232821] text-[#3D3D3D] dark:text-[#E8E6DF] p-3 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328] mt-2"
                    >
                      <p><strong>Extração Unitária:</strong> Quantidade de nitrogênio requerida pela cultura para produzir uma saca (60kg). O padrão na literatura de fertilidade varia geralmente entre <strong>1,2 e 1,5 kg N por saca</strong> produzida.</p>
                    </motion.div>
                  )}
                </div>

                {/* MOS Contribution */}
                <div id="input_group_soil" className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[11px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase tracking-wider flex items-center gap-1.5">
                      N fornecido pela M.O. (MOS)
                      <button 
                        type="button" 
                        onClick={() => setActiveTooltip(activeTooltip === 'mos' ? null : 'mos')}
                        className="text-[#8C897E] dark:text-[#9EA399] hover:text-[#5A5A40] dark:hover:text-[#9CB386]"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </label>
                    <span className="text-xs font-bold text-[#5A5A40] dark:text-[#E8E6DF] bg-[#F9F8F6] dark:bg-[#232821] border border-[#E5E2D9] dark:border-[#2C3328] px-2 py-0.5 rounded-md">
                      {mosNContribution} kg N/ha
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={mosNContribution}
                      onChange={(e) => handleCustomInputChange(() => setMosNContribution(Math.max(0, Number(e.target.value))))}
                      className="w-full text-sm bg-[#F9F8F6] dark:bg-[#151813] border border-[#E5E2D9] dark:border-[#2C3328] rounded-xl px-4 py-3 font-semibold text-[#5A5A40] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                    />
                  </div>

                  {activeTooltip === 'mos' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs bg-[#F9F8F6] dark:bg-[#232821] text-[#3D3D3D] dark:text-[#E8E6DF] p-3 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328] mt-2"
                    >
                      <p><strong>Mineralização da Matéria Orgânica do Solo (MOS):</strong> Quantidade estimada de nitrogênio liberada no solo pela matéria orgânica seca disponível para a cultura do milho durante o ciclo.</p>
                    </motion.div>
                  )}
                </div>

                {/* Soy Credit */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[11px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase tracking-wider flex items-center gap-1.5">
                      Crédito de N pela Soja (cultura anterior)
                      <button 
                        type="button" 
                        onClick={() => setActiveTooltip(activeTooltip === 'soy' ? null : 'soy')}
                        className="text-[#8C897E] dark:text-[#9EA399] hover:text-[#5A5A40] dark:hover:text-[#9CB386]"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </label>
                    <span className="text-xs font-bold text-[#5A5A40] dark:text-[#E8E6DF] bg-[#F9F8F6] dark:bg-[#232821] border border-[#E5E2D9] dark:border-[#2C3328] px-2 py-0.5 rounded-md">
                      {soyNContribution} kg N/ha
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={soyNContribution}
                      onChange={(e) => handleCustomInputChange(() => setSoyNContribution(Math.max(0, Number(e.target.value))))}
                      className="w-full text-sm bg-[#F9F8F6] dark:bg-[#151813] border border-[#E5E2D9] dark:border-[#2C3328] rounded-xl px-4 py-3 font-semibold text-[#5A5A40] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                    />
                  </div>

                  {activeTooltip === 'soy' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs bg-[#F9F8F6] dark:bg-[#232821] text-[#3D3D3D] dark:text-[#E8E6DF] p-3 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328] mt-2"
                    >
                      <p><strong>Crédito de Nitrogênio da Soja:</strong> Por ser uma leguminosa com fixação biológica de nitrogênio, a cultura da soja deixa resíduos ricos em N no solo. O crédito comumente adotado na sucessão Soja-Milho varia de <strong>15 a 30 kg N/ha</strong>.</p>
                    </motion.div>
                  )}
                </div>

                {/* Efficiency rate */}
                <div id="input_group_efficiency" className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[11px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase tracking-wider flex items-center gap-1.5">
                      Eficiência de Aplicação (%)
                      <button 
                        type="button" 
                        onClick={() => setActiveTooltip(activeTooltip === 'eff' ? null : 'eff')}
                        className="text-[#8C897E] dark:text-[#9EA399] hover:text-[#5A5A40] dark:hover:text-[#9CB386]"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </label>
                    <span className="text-xs font-bold text-[#5A5A40] dark:text-[#E8E6DF] bg-[#F9F8F6] dark:bg-[#232821] border border-[#E5E2D9] dark:border-[#2C3328] px-2 py-0.5 rounded-md">
                      {efficiency}%
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={efficiency}
                      onChange={(e) => handleCustomInputChange(() => setEfficiency(Math.min(100, Math.max(10, Number(e.target.value)))))}
                      className="w-full text-sm bg-[#F9F8F6] dark:bg-[#151813] border border-[#E5E2D9] dark:border-[#2C3328] rounded-xl px-4 py-3 font-semibold text-[#5A5A40] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                    />
                  </div>

                  {activeTooltip === 'eff' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs bg-[#F9F8F6] dark:bg-[#232821] text-[#3D3D3D] dark:text-[#E8E6DF] p-3 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328] mt-2"
                    >
                      <p><strong>Eficiência de Aproveitamento (padrão 80%):</strong> Fração do nitrogênio aplicado que é efetivamente absorvida pela planta. Perdas por volatilização ou lixiviação reduzem esse valor. Uma eficiência de 80% (fator 0.8) indica que é necessário aplicar uma dose maior para compensar as perdas previstas.</p>
                    </motion.div>
                  )}
                </div>

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
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase tracking-wider">
                    Base para cálculo do parcelamento:
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-[#F9F8F6] dark:bg-[#151813] border border-[#E5E2D9] dark:border-[#2C3328] p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSplitBase('dose_perdas')}
                      className={`text-xs py-2 px-3 rounded-lg font-bold transition-all ${
                        splitBase === 'dose_perdas'
                          ? 'bg-[#D4A373] text-white shadow-sm'
                          : 'text-[#8C897E] dark:text-[#9EA399] hover:text-[#5A5A40] dark:hover:text-[#E8E6DF]'
                      }`}
                    >
                      Dose com Perdas ({calculations.recommendedDose} kg N/ha)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitBase('necessidade_liquida')}
                      className={`text-xs py-2 px-3 rounded-lg font-bold transition-all ${
                        splitBase === 'necessidade_liquida'
                          ? 'bg-[#D4A373] text-white shadow-sm'
                          : 'text-[#8C897E] dark:text-[#9EA399] hover:text-[#5A5A40] dark:hover:text-[#E8E6DF]'
                      }`}
                    >
                      Necessidade Líquida ({calculations.liquidNeed} kg N/ha)
                    </button>
                  </div>
                  <p className="text-[10px] text-[#8C897E] dark:text-[#9EA399] mt-1 leading-relaxed">
                    *Nota: A prática mais segura é parcelar a dose real de fertilizante a aplicar (Dose com perdas).
                  </p>
                </div>

                {/* Base Application N (1a Aplicação) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-[#3D3D3D] dark:text-[#E8E6DF]">
                      1ª Aplicação (Base / Semeadura)
                    </label>
                    <span className="text-xs font-bold text-[#5A5A40] dark:text-[#E8E6DF] bg-[#F9F8F6] dark:bg-[#232821] border border-[#E5E2D9] dark:border-[#2C3328] px-2.5 py-0.5 rounded-md">
                      {baseDose} kg N/ha
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={baseDose}
                    onChange={(e) => handleCustomInputChange(() => setBaseDose(Number(e.target.value)))}
                    className="w-full h-2 bg-[#F0EDE5] dark:bg-[#2D3429] rounded-lg appearance-none cursor-pointer accent-[#D4A373]"
                  />
                  <div className="flex justify-between text-[10px] text-[#8C897E] dark:text-[#9EA399] font-medium">
                    <span>Recomendado: 30 a 40 kg N/ha</span>
                  </div>
                </div>

                {/* V4-V6 Percentage Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-[#3D3D3D] dark:text-[#E8E6DF]">
                      2ª Aplicação (V4-V6) - % Escolhida
                    </label>
                    <span className="text-xs font-bold text-[#5A5A40] dark:text-[#E8E6DF] bg-[#F9F8F6] dark:bg-[#232821] border border-[#E5E2D9] dark:border-[#2C3328] px-2.5 py-0.5 rounded-md">
                      {v4v6Percent}% do total
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="80"
                    step="5"
                    value={v4v6Percent}
                    onChange={(e) => handleCustomInputChange(() => setV4v6Percent(Number(e.target.value)))}
                    className="w-full h-2 bg-[#F0EDE5] dark:bg-[#2D3429] rounded-lg appearance-none cursor-pointer accent-[#D4A373]"
                  />
                  <div className="flex justify-between text-[10px] text-[#8C897E] dark:text-[#9EA399] font-medium">
                    <span>Recomendado padrão: 50% a 60%</span>
                  </div>
                </div>

                {/* V8-V10 Percentage Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-[#3D3D3D] dark:text-[#E8E6DF]">
                      3ª Aplicação (V8-V10) - % Escolhida
                    </label>
                    <span className="text-xs font-bold text-[#5A5A40] dark:text-[#E8E6DF] bg-[#F9F8F6] dark:bg-[#232821] border border-[#E5E2D9] dark:border-[#2C3328] px-2.5 py-0.5 rounded-md">
                      {v8v10Percent}% do total
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={v8v10Percent}
                    onChange={(e) => handleCustomInputChange(() => setV8v10Percent(Number(e.target.value)))}
                    className="w-full h-2 bg-[#F0EDE5] dark:bg-[#2D3429] rounded-lg appearance-none cursor-pointer accent-[#D4A373]"
                  />
                  <div className="flex justify-between text-[10px] text-[#8C897E] dark:text-[#9EA399] font-medium">
                    <span>Recomendado padrão: 20% a 30%</span>
                  </div>
                </div>
              </div>
            </div>

          </section>

          {/* RIGHT COLUMN: REAL-TIME OUTPUTS & CALCULATIONS */}
          <section id="results_section" className="lg:col-span-7 space-y-6">
            
            {/* CORE METRICS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              
              {/* Metric 1: Necessidade Total */}
              <div className="bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px] transition-colors">
                <div>
                  <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase block">
                    1. Extração Total (Cultivo)
                  </span>
                  <div className="text-2xl font-bold text-[#5A5A40] dark:text-[#9CB386] mt-1.5">
                    {calculations.totalExtraction.toFixed(2)} <span className="text-xs font-semibold text-[#8C897E] dark:text-[#9EA399]">kg N/ha</span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-[#8C897E] dark:text-[#9EA399] border-t border-[#F0EDE5] dark:border-[#2C3328] pt-2 font-medium">
                  {yieldGoal} sc/ha × {nRequirementPerBag.toFixed(2)} kg/sc
                </div>
              </div>

              {/* Metric 2: Necessidade Líquida */}
              <div className="bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px] transition-colors">
                <div>
                  <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase block">
                    2. Necessidade Líquida
                  </span>
                  <div className="text-2xl font-bold text-[#5A5A40] dark:text-[#9CB386] mt-1.5">
                    {calculations.liquidNeed.toFixed(2)} <span className="text-xs font-semibold text-[#8C897E] dark:text-[#9EA399]">kg N/ha</span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-[#8C897E] dark:text-[#9EA399] border-t border-[#F0EDE5] dark:border-[#2C3328] pt-2 font-medium">
                  Extração - MOS - Crédito Soja
                </div>
              </div>

              {/* Metric 3: Dose Recomendada com Perdas */}
              <div id="card_dose_total" className="bg-[#5A5A40] dark:bg-[#263122] text-white rounded-3xl p-5 shadow-md flex flex-col justify-between min-h-[120px] col-span-2 sm:col-span-1 border border-transparent dark:border-[#3D4C37] transition-colors">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-85 block">
                      Dose Total a Aplicar
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSaveModalOpen(true)}
                      className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all text-[10px] flex items-center gap-1 font-bold border border-white/15"
                      title="Salvar este cálculo no histórico local"
                    >
                      <BookmarkPlus className="h-3 w-3 text-[#D4A373]" />
                      <span>Salvar</span>
                    </button>
                  </div>
                  <div className="text-3xl font-bold font-serif mt-1">
                    {calculations.recommendedDose.toFixed(2)} <span className="text-xs font-sans font-normal opacity-80">kg N/ha</span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] opacity-75 border-t border-white/20 pt-2 font-medium">
                  Eficiência: {efficiency}% (Perdas de {100 - efficiency}%)
                </div>
              </div>

            </div>

            {/* SECONDARY METRICS: MOS AND SOY CREDITS */}
            <div className="bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-5 shadow-sm grid grid-cols-2 gap-4 transition-colors">
              <div className="border-r border-[#F0EDE5] dark:border-[#2C3328] pr-2">
                <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase block">
                  N Proveniente da MOS
                </span>
                <span className="text-base font-bold text-[#8D6E63] dark:text-[#CBB5A1] block mt-1">
                  -{mosNContribution.toFixed(2)} kg N/ha
                </span>
                <p className="text-[10px] text-[#8C897E] dark:text-[#9EA399] mt-0.5">Reduz a necessidade química</p>
              </div>
              <div className="pl-2">
                <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase block">
                  Crédito da Soja
                </span>
                <span className="text-base font-bold text-[#5A5A40] dark:text-[#9CB386] block mt-1">
                  -{soyNContribution.toFixed(2)} kg N/ha
                </span>
                <p className="text-[10px] text-[#8C897E] dark:text-[#9EA399] mt-0.5">Leguminosa anterior</p>
              </div>
            </div>

            {/* DYNAMIC PARCELAMENTO DISCLOSURES PANEL */}
            <div id="parceling_section" className="bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-6 shadow-sm space-y-6 transition-colors">
              
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
                      {baseDose.toFixed(2)} <span className="text-xs font-semibold text-[#8C897E] dark:text-[#9EA399]">kg N/ha</span>
                    </div>
                    <span className="text-[10px] text-[#D4A373] dark:text-[#E0A96D] font-serif italic font-bold">Aplicado na base</span>
                  </div>
                </div>

                {/* 2nd Application Compare (50% and 60%) */}
                <div className="p-4 bg-[#F9F8F6] dark:bg-[#151813] rounded-2xl border border-dashed border-[#5A5A40] dark:border-[#4B5E40] space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-[#5A5A40] dark:bg-[#3D4D35] text-white text-[9px] px-3 py-1 rounded-full uppercase font-bold inline-block mb-1.5">
                        2ª Aplicação: V2-V6
                      </span>
                      <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-0.5">
                        Padrão agronômico: <strong>50% a 60%</strong> da meta ({splitBase === 'dose_perdas' ? 'Dose com perdas' : 'N Líquido'})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[#5A5A40] dark:text-[#9CB386] bg-[#FDFBF7] dark:bg-[#232821] border border-[#E5E2D9] dark:border-[#2C3328] px-2.5 py-1 rounded-md">
                        Escolhido: {v4v6Percent}% ({calculations.selectedV4V6Val.toFixed(2)} kg N/ha)
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#F0EDE5] dark:border-[#2C3328] text-center">
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
                  </div>
                </div>

                {/* 3rd Application Compare (20% and 30%) */}
                <div className="p-4 bg-[#F9F8F6] dark:bg-[#151813] rounded-2xl border border-dashed border-[#8D6E63] dark:border-[#6D544C] space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-[#8D6E63] dark:bg-[#6D544C] text-white text-[9px] px-3 py-1 rounded-full uppercase font-bold inline-block mb-1.5">
                        3ª Aplicação: V8-V10
                      </span>
                      <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-0.5">
                        Padrão agronômico: <strong>20% a 30%</strong> da meta ({splitBase === 'dose_perdas' ? 'Dose com perdas' : 'N Líquido'})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[#8D6E63] dark:text-[#D4A373] bg-[#FDFBF7] dark:bg-[#232821] border border-[#E5E2D9] dark:border-[#2C3328] px-2.5 py-1 rounded-md">
                        Escolhido: {v8v10Percent}% ({calculations.selectedV8V10Val.toFixed(2)} kg N/ha)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#F0EDE5] dark:border-[#2C3328] text-center">
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
                  </div>
                </div>

                {/* DIFFERENCE BETWEEN BOTH SELECTED MAIN APPLICATIONS */}
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

            </div>

            {/* INTEGRITY AND VALIDATION CHECK PANEL */}
            <div className="bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-6 shadow-sm space-y-4 transition-colors">
              
              <div className="border-b border-[#F0EDE5] dark:border-[#2C3328] pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-[#5A5A40] dark:text-[#E8E6DF] uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#5A5A40] dark:text-[#9CB386]" /> Validação e Fechamento de Balanço
                  </h3>
                  <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-0.5">
                    Verifique se o parcelamento soma exatamente a sua meta planejada
                  </p>
                </div>
              </div>

              {/* STACKED BAR / CHIPS DIAGRAM */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-[#3D3D3D] dark:text-[#E8E6DF]">
                  <span>Visualização do Balanço:</span>
                  <span className="text-[#5A5A40] dark:text-[#9CB386]">Meta: {calculations.targetSplitTotal.toFixed(2)} kg N/ha</span>
                </div>
                
                <div className="h-4 bg-[#F0EDE5] dark:bg-[#2D3429] rounded-full flex overflow-hidden shadow-inner">
                  <div 
                    style={{ width: `${Math.min(100, (baseDose / calculations.targetSplitTotal) * 100)}%` }} 
                    className="bg-[#8C897E] h-full transition-all duration-300" 
                    title={`Base: ${baseDose} kg N/ha`}
                  />
                  <div 
                    style={{ width: `${Math.min(100, (calculations.selectedV4V6Val / calculations.targetSplitTotal) * 100)}%` }} 
                    className="bg-[#5A5A40] dark:bg-[#9CB386] h-full transition-all duration-300" 
                    title={`V4-V6: ${calculations.selectedV4V6Val} kg N/ha`}
                  />
                  <div 
                    style={{ width: `${Math.min(100, (calculations.selectedV8V10Val / calculations.targetSplitTotal) * 100)}%` }} 
                    className="bg-[#8D6E63] dark:bg-[#D4A373] h-full transition-all duration-300" 
                    title={`V8-V10: ${calculations.selectedV8V10Val} kg N/ha`}
                  />
                </div>

                <div className="flex flex-wrap gap-4 text-xs font-semibold text-[#8C897E] dark:text-[#9EA399] justify-between border-b border-[#F0EDE5] dark:border-[#2C3328] pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#8C897E] rounded-sm" />
                    <span>1ª Base: {baseDose.toFixed(2)} kg/ha</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#5A5A40] dark:bg-[#9CB386] rounded-sm" />
                    <span>2ª V4-V6: {calculations.selectedV4V6Val.toFixed(2)} kg/ha ({v4v6Percent}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#8D6E63] dark:bg-[#D4A373] rounded-sm" />
                    <span>3ª V8-V10: {calculations.selectedV8V10Val.toFixed(2)} kg/ha ({v8v10Percent}%)</span>
                  </div>
                </div>

                {/* RESULTS INTEGRITY COMPOSER */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-2">
                  <div className="space-y-1">
                    <div className="text-xs text-[#8C897E] dark:text-[#9EA399]">Soma das Três Aplicações:</div>
                    <div className="text-sm font-bold text-[#3D3D3D] dark:text-[#E8E6DF]">
                      {baseDose.toFixed(2)} + {calculations.selectedV4V6Val.toFixed(2)} + {calculations.selectedV8V10Val.toFixed(2)} = <span className="font-extrabold text-[#5A5A40] dark:text-[#9CB386] text-lg">{calculations.sumOfSplits.toFixed(2)} kg N/ha</span>
                    </div>
                  </div>
                  
                  <div>
                    {calculations.splitDiscrepancy === 0 ? (
                      <div className="bg-[#F9F8F6] dark:bg-[#151813] text-[#5A5A40] dark:text-[#9CB386] border border-[#E5E2D9] dark:border-[#2C3328] p-3 rounded-xl flex items-center gap-2.5 text-xs font-bold">
                        <CheckCircle2 className="h-4.5 w-4.5 text-[#5A5A40] dark:text-[#9CB386] shrink-0" />
                        <div>
                          <span>Balanço Fechado! (100% OK)</span>
                          <p className="text-[10px] text-[#8C897E] dark:text-[#9EA399] font-normal mt-0.5">A soma corresponde exatamente à meta.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#FDFBF7] dark:bg-[#201C16] text-[#8D6E63] dark:text-[#E0A96D] border border-[#E5E2D9] dark:border-[#2C3328] p-3 rounded-xl flex items-center gap-2.5 text-xs font-bold">
                        <AlertCircle className="h-4.5 w-4.5 text-[#8D6E63] dark:text-[#E0A96D] shrink-0" />
                        <div>
                          <span>Diferença de {calculations.splitDiscrepancy > 0 ? '+' : ''}{calculations.splitDiscrepancy.toFixed(2)} kg N/ha</span>
                          <p className="text-[10px] text-[#8C897E] dark:text-[#9EA399] font-normal mt-0.5">Ajuste as frações percentuais para obter um fechamento exato.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </section>

        </div>

        {/* DETAILED FORMULA AND MATHEMATICAL EXPLANATIONS PANEL */}
        <section id="detailed_math_panel" className="bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-6 shadow-sm transition-colors">
          <div className="border-b border-[#F0EDE5] dark:border-[#2C3328] pb-4 mb-6">
            <h3 className="text-sm font-bold text-[#5A5A40] dark:text-[#E8E6DF] uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[#5A5A40] dark:text-[#9CB386]" /> Memória de Cálculo Detalhada (Passo a Passo)
            </h3>
            <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-1">
              Confira como o algoritmo calculou cada um dos resultados passo a passo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm text-[#3D3D3D] dark:text-[#E8E6DF]">
            
            {/* Step 1: Extração */}
            <div className="space-y-2 bg-[#F9F8F6] dark:bg-[#151813] p-4 rounded-xl border border-[#E5E2D9] dark:border-[#2C3328]">
              <div className="flex items-center gap-1.5 text-[#5A5A40] dark:text-[#9CB386] font-bold">
                <span className="bg-[#5A5A40] dark:bg-[#384332] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                Extração pela Cultura
              </div>
              <p className="text-xs text-[#8C897E] dark:text-[#9EA399]">
                N total extraído para a produtividade planejada.
              </p>
              <div className="bg-white dark:bg-[#232821] p-2.5 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328] font-mono text-[11px] leading-relaxed mt-1 text-[#3D3D3D] dark:text-[#E8E6DF]">
                <div className="text-[#8C897E] dark:text-[#9EA399] font-semibold mb-1">FÓRMULA:</div>
                <div className="font-bold text-[#5A5A40] dark:text-[#9CB386]">E = sc/ha × N_saca</div>
                <div className="border-t border-[#F0EDE5] dark:border-[#2C3328] my-1 pt-1 text-[#8D6E63] dark:text-[#D4A373] font-bold">
                  {yieldGoal} × {nRequirementPerBag.toFixed(2)} = {calculations.totalExtraction.toFixed(2)} kg N/ha
                </div>
              </div>
            </div>

            {/* Step 2: N Liquido */}
            <div className="space-y-2 bg-[#F9F8F6] dark:bg-[#151813] p-4 rounded-xl border border-[#E5E2D9] dark:border-[#2C3328]">
              <div className="flex items-center gap-1.5 text-[#5A5A40] dark:text-[#9CB386] font-bold">
                <span className="bg-[#5A5A40] dark:bg-[#384332] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                Necessidade Líquida
              </div>
              <p className="text-xs text-[#8C897E] dark:text-[#9EA399]">
                Deduz as contribuições da M.O. e crédito de nitrogênio da soja.
              </p>
              <div className="bg-white dark:bg-[#232821] p-2.5 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328] font-mono text-[11px] leading-relaxed mt-1 text-[#3D3D3D] dark:text-[#E8E6DF]">
                <div className="text-[#8C897E] dark:text-[#9EA399] font-semibold mb-1">FÓRMULA:</div>
                <div className="font-bold text-[#5A5A40] dark:text-[#9CB386]">N_Liq = E - MOS - Soja</div>
                <div className="border-t border-[#F0EDE5] dark:border-[#2C3328] my-1 pt-1 text-[#8D6E63] dark:text-[#D4A373] font-bold">
                  {calculations.totalExtraction.toFixed(2)} - {mosNContribution} - {soyNContribution} = {calculations.liquidNeed.toFixed(2)} kg N/ha
                </div>
              </div>
            </div>

            {/* Step 3: Eficiência */}
            <div className="space-y-2 bg-[#F9F8F6] dark:bg-[#151813] p-4 rounded-xl border border-[#E5E2D9] dark:border-[#2C3328]">
              <div className="flex items-center gap-1.5 text-[#5A5A40] dark:text-[#9CB386] font-bold">
                <span className="bg-[#5A5A40] dark:bg-[#384332] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">3</span>
                Ajuste de Perdas
              </div>
              <p className="text-xs text-[#8C897E] dark:text-[#9EA399]">
                Dose corrigida considerando a eficiência de {efficiency}%.
              </p>
              <div className="bg-white dark:bg-[#232821] p-2.5 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328] font-mono text-[11px] leading-relaxed mt-1 text-[#3D3D3D] dark:text-[#E8E6DF]">
                <div className="text-[#8C897E] dark:text-[#9EA399] font-semibold mb-1">FÓRMULA:</div>
                <div className="font-bold text-[#5A5A40] dark:text-[#9CB386]">Dose = N_Liq ÷ Efic</div>
                <div className="border-t border-[#F0EDE5] dark:border-[#2C3328] my-1 pt-1 text-[#8D6E63] dark:text-[#D4A373] font-bold">
                  {calculations.liquidNeed.toFixed(2)} ÷ {efficiency / 100} = {calculations.recommendedDose.toFixed(2)} kg N/ha
                </div>
              </div>
            </div>

            {/* Step 4: Parcelamento */}
            <div className="space-y-2 bg-[#F9F8F6] dark:bg-[#151813] p-4 rounded-xl border border-[#E5E2D9] dark:border-[#2C3328]">
              <div className="flex items-center gap-1.5 text-[#5A5A40] dark:text-[#9CB386] font-bold">
                <span className="bg-[#5A5A40] dark:bg-[#384332] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">4</span>
                Valores de Parcelamento
              </div>
              <p className="text-xs text-[#8C897E] dark:text-[#9EA399]">
                Divisão baseada na meta escolhida ({calculations.targetSplitTotal.toFixed(2)} kg N/ha).
              </p>
              <div className="bg-white dark:bg-[#232821] p-2.5 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328] font-mono text-[11px] leading-relaxed mt-1 text-[#3D3D3D] dark:text-[#E8E6DF]">
                <div className="text-[#8C897E] dark:text-[#9EA399] font-semibold mb-1">APLICAÇÕES:</div>
                <div>Base: {baseDose.toFixed(2)} kg/ha</div>
                <div>V4-V6 ({v4v6Percent}%): {calculations.selectedV4V6Val.toFixed(2)} kg/ha</div>
                <div>V8-V10 ({v8v10Percent}%): {calculations.selectedV8V10Val.toFixed(2)} kg/ha</div>
                <div className="border-t border-[#F0EDE5] dark:border-[#2C3328] my-1 pt-1 text-[#8D6E63] dark:text-[#D4A373] font-bold">
                  Soma: {calculations.sumOfSplits.toFixed(2)} kg N/ha
                </div>
              </div>
            </div>

          </div>
          
          {/* DETAILED EXPLANATION CORNER */}
          <div className="mt-6 bg-[#FDFBF7] dark:bg-[#151813] border border-[#E5E2D9] dark:border-[#2C3328] p-5 rounded-xl text-xs text-[#3D3D3D] dark:text-[#E8E6DF] leading-relaxed space-y-2">
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
                <div>• <strong>Dose aplicada na Base:</strong> {baseDose.toFixed(2)} kg N/ha</div>
                <div>• <strong>Faixa V4-V6 (50% a 60%):</strong> {calculations.v4v6_50.toFixed(2)} a {calculations.v4v6_60.toFixed(2)} kg N/ha</div>
                <div>• <strong>Faixa V8-V10 (20% a 30%):</strong> {calculations.v8v10_20.toFixed(2)} a {calculations.v8v10_30.toFixed(2)} kg N/ha</div>
                <div>• <strong>Diferença de dose (V4-V6 vs V8-V10):</strong> {calculations.splitDifference.toFixed(2)} kg N/ha</div>
                <div>• <strong>Soma das parcelas aplicadas:</strong> {calculations.sumOfSplits.toFixed(2)} kg N/ha (Meta: {calculations.targetSplitTotal.toFixed(2)} kg N/ha)</div>
              </div>
            </div>
          </div>
        </section>
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
              v4v6Percent,
              v8v10Percent,
              splitBase,
              totalExtraction: calculations.totalExtraction,
              liquidNeed: calculations.liquidNeed,
              recommendedDose: calculations.recommendedDose,
              selectedV4V6Val: calculations.selectedV4V6Val,
              selectedV8V10Val: calculations.selectedV8V10Val,
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
            v4v6Percent,
            v8v10Percent,
            splitBase,
            totalExtraction: calculations.totalExtraction,
            liquidNeed: calculations.liquidNeed,
            recommendedDose: calculations.recommendedDose,
            selectedV4V6Val: calculations.selectedV4V6Val,
            selectedV8V10Val: calculations.selectedV8V10Val,
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
  );
}
