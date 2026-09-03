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
import CalculationIsland from '@/components/CalculationIsland';
import CalculationMemoryPanel from '@/components/CalculationMemoryPanel';
import DarkMode3DToggle from '@/components/DarkMode3DToggle';
import SectionNav3D from '@/components/SectionNav3D';
import CornYieldCalculator from '@/components/CornYieldCalculator';
import CornAlert3D, { AgronomicValidationIssue } from '@/components/CornAlert3D';
import Input3D from '@/components/Input3D';
import Button3D from '@/components/Button3D';
import Select3D from '@/components/Select3D';
import { useGeminiLiveAgent } from '@/hooks/useGeminiLiveAgent';
import { useTheme } from '@/components/ThemeProvider';
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
  baseDose2: number; // 2nd value for range (0 = single value)
  v4v6Percent: number; // default 50 or 60
  v4v6Percent2: number; // 2nd % value for range (0 = single value)
  v8v10Percent: number; // default 20 or 30
  v8v10Percent2: number; // 2nd % value for range (0 = single value)
}

const PRESETS: Preset[] = [];

export default function Home() {
  const { isDark } = useTheme();

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

  // SQLike Local Storage states
  const savedRecords = useCalculationRecords();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculadora' | 'estimativa_milho' | 'comparador'>('calculadora');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Calculation memory panel toggles (per result container)
  const [showCalcExtracao, setShowCalcExtracao] = useState(false);
  const [showCalcLiquida, setShowCalcLiquida] = useState(false);
  const [showCalcDose, setShowCalcDose] = useState(false);
  const [showCalcParcelamento, setShowCalcParcelamento] = useState(false);
  const [showCalcBalanco, setShowCalcBalanco] = useState(false);

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
    setBaseDose2(preset.baseDose2);
    setBaseDoseMode(preset.baseDose2 > 0 ? 'range' : 'single');
    setV4v6Percent(preset.v4v6Percent);
    setV4v6Percent2(preset.v4v6Percent2);
    setV4v6Mode(preset.v4v6Percent2 > 0 ? 'range' : 'single');
    setV8v10Percent(preset.v8v10Percent);
    setV8v10Percent2(preset.v8v10Percent2);
    setV8v10Mode(preset.v8v10Percent2 > 0 ? 'range' : 'single');
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

    // 1st Application: kg N/ha (always absolute values)
    const base1 = baseDose;
    const base2 = baseDoseMode === 'range' ? baseDose2 : 0;
    const base1_kg = base1;
    const base2_kg = base2;

    // 2nd Application: % values
    const v4v6_1 = v4v6Percent;
    const v4v6_2 = v4v6Mode === 'range' ? v4v6Percent2 : 0;
    const v4v6_1_kg = Number((targetSplitTotal * (v4v6_1 / 100)).toFixed(2));
    const v4v6_2_kg = v4v6_2 > 0 ? Number((targetSplitTotal * (v4v6_2 / 100)).toFixed(2)) : 0;

    // 3rd Application: % values — AUTO-CALCULATED from what remains
    // If user provides values, use them. If not, calculate automatically.
    const v8v10_1 = v8v10Percent;
    const v8v10_2 = v8v10Mode === 'range' ? v8v10Percent2 : 0;
    
    // Calculate remaining after 1st + 2nd application
    const usedByBase1 = base1_kg;
    const usedByV4v6_1 = v4v6_1_kg;
    const usedByV4v6_2 = v4v6_2_kg;
    
    // Remaining N after 1st application and 2nd application (first value)
    const remaining_after_base1 = targetSplitTotal - usedByBase1;
    const remaining_after_v4v6_1 = remaining_after_base1 - usedByV4v6_1;
    
    // Auto-calculate 3rd application % from remaining
    const v8v10_1_auto = remaining_after_v4v6_1 > 0
      ? Number(((remaining_after_v4v6_1 / targetSplitTotal) * 100).toFixed(1))
      : 0;
    
    // For range mode: 2nd value of 3rd application = remaining after both 2nd app values
    const remaining_after_v4v6_both = remaining_after_base1 - usedByV4v6_1 - usedByV4v6_2;
    const v8v10_2_auto = (v8v10_2 > 0 && v4v6_2 > 0)
      ? Number(((remaining_after_v4v6_both / targetSplitTotal) * 100).toFixed(1))
      : 0;

    // Use user-provided or auto-calculated
    const v8v10_1_final = v8v10_1 > 0 ? v8v10_1 : v8v10_1_auto;
    const v8v10_2_final = v8v10_2 > 0 ? v8v10_2 : v8v10_2_auto;

    const v8v10_1_kg = Number((targetSplitTotal * (v8v10_1_final / 100)).toFixed(2));
    const v8v10_2_kg = v8v10_2_final > 0 ? Number((targetSplitTotal * (v8v10_2_final / 100)).toFixed(2)) : 0;

    // Reference ranges for comparison
    const v4v6_50 = Number((targetSplitTotal * 0.50).toFixed(2));
    const v4v6_60 = Number((targetSplitTotal * 0.60).toFixed(2));
    const v8v10_20 = Number((targetSplitTotal * 0.20).toFixed(2));
    const v8v10_30 = Number((targetSplitTotal * 0.30).toFixed(2));

    // Total of the three applications (summing first values + optional ranges)
    const sumOfSplits = Number((base1_kg + v4v6_1_kg + v8v10_1_kg).toFixed(2));
    
    // Sum with ranges if applicable
    const sumOfSplitsRange = (baseDoseMode === 'range' && base2_kg > 0)
      ? Number((base2_kg + v4v6_2_kg + v8v10_2_kg).toFixed(2))
      : 0;
    
    const splitDiscrepancy = Number((sumOfSplits - targetSplitTotal).toFixed(2));
    const splitDifference = Number(Math.abs(v4v6_1_kg - v8v10_1_kg).toFixed(2));

    return {
      totalExtraction,
      liquidNeed,
      recommendedDose,
      targetSplitTotal,
      base1_kg,
      base2_kg,
      v4v6_1,
      v4v6_2,
      v4v6_1_kg,
      v4v6_2_kg,
      v4v6_50,
      v4v6_60,
      v8v10_1_final,
      v8v10_2_final,
      v8v10_1_kg,
      v8v10_2_kg,
      v8v10_20,
      v8v10_30,
      v8v10_1_auto,
      v8v10_2_auto,
      sumOfSplits,
      sumOfSplitsRange,
      splitDiscrepancy,
      splitDifference
    };
  }, [yieldGoal, nRequirementPerBag, mosNContribution, soyNContribution, efficiency, baseDose, baseDose2, baseDoseMode, v4v6Percent, v4v6Percent2, v4v6Mode, v8v10Percent, v8v10Percent2, v8v10Mode, splitBase]);

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
        </header>

        {/* TOP NAVIGATION / MODE SWITCHER BAR */}
        <nav id="app_mode_nav" className="bg-white dark:bg-[#1C201A] p-2 rounded-2xl border border-[#E5E2D9] dark:border-[#2C3328] shadow-sm flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
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
          <div className="flex items-center gap-3">
            {/* 3D Section Navigation Indicator */}
            <SectionNav3D activeTab={activeTab} />
            <div className="hidden sm:flex items-center gap-2 px-3 text-xs text-[#8C897E] dark:text-[#9EA399]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#2E6F40] animate-pulse" />
              <span>Puck Live Assistant Ativo</span>
            </div>
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
                <Input3D
                  id="input_group_yield_goal"
                  label="Produtividade Alvo"
                  unit="sc/ha"
                  value={yieldGoal}
                  onChange={(v) => handleCustomInputChange(() => setYieldGoal(v))}
                  step={5}
                  min={50}
                  max={250}
                  isDark={isDark}
                  accentColor="#5A5A40"
                  hint="Meta de rendimento em sacas de 60kg por hectare."
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
                  isDark={isDark}
                  accentColor="#5A5A40"
                  hint="Extração unitária: 1.2 a 1.5 kg N por saca (padrão: 1.35)."
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
                  isDark={isDark}
                  accentColor="#5A5A40"
                  hint="Mineralização da Matéria Orgânica do Solo."
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
                  isDark={isDark}
                  accentColor="#5A5A40"
                  hint="Crédito de N da soja: 15 a 30 kg N/ha na sucessão Soja-Milho."
                />

                {/* Efficiency rate */}
                <Input3D
                  id="input_group_efficiency"
                  label="Eficiência de Aplicação (%)"
                  unit="%"
                  value={efficiency}
                  onChange={(v) => handleCustomInputChange(() => setEfficiency(Math.min(100, Math.max(10, v))))}
                  step={1}
                  min={10}
                  max={100}
                  isDark={isDark}
                  accentColor="#5A5A40"
                  hint="Eficiência padrão: 80% (fator 0.8). Perdas por volatilização/lixiviação."
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

                {/* 1st Application — Base/Semeadura (kg N/ha) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#3D3D3D] dark:text-[#E8E6DF]">
                      1ª Aplicação (Base / Semeadura)
                    </span>
                    <Select3D
                      value={baseDoseMode}
                      onChange={(v) => handleCustomInputChange(() => {
                        setBaseDoseMode(v as 'single' | 'range');
                        if (v === 'single') setBaseDose2(0);
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
                  
                  <div className="flex gap-3 items-end">
                    <Input3D
                      label="Valor (kg N/ha)"
                      unit="kg N/ha"
                      value={baseDose}
                      onChange={(v) => handleCustomInputChange(() => setBaseDose(v))}
                      step={1}
                      min={0}
                      max={100}
                      isDark={isDark}
                      accentColor="#D4A373"
                    />
                    {baseDoseMode === 'range' && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1"
                      >
                        <Input3D
                          label="2º Valor (kg N/ha)"
                          unit="kg N/ha"
                          value={baseDose2}
                          onChange={(v) => handleCustomInputChange(() => setBaseDose2(v))}
                          step={1}
                          min={0}
                          max={100}
                          isDark={isDark}
                          accentColor="#D4A373"
                        />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8C897E] dark:text-[#9EA399] mt-1 leading-relaxed">
                    * Faixa agronômica típica: 30 a 40 kg N/ha.
                  </p>
                </div>

                {/* 2nd Application — V4-V6 (% values) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#3D3D3D] dark:text-[#E8E6DF]">
                      2ª Aplicação (V4-V6) — Percentual
                    </span>
                    <Select3D
                      value={v4v6Mode}
                      onChange={(v) => handleCustomInputChange(() => {
                        setV4v6Mode(v as 'single' | 'range');
                        if (v === 'single') setV4v6Percent2(0);
                      })}
                      isDark={isDark}
                      accentColor="#5A5A40"
                      options={[
                        { value: 'single', label: '1 valor %' },
                        { value: 'range', label: '2 valores %' },
                      ]}
                      className="!inline-flex !w-auto"
                    />
                  </div>

                  <div className="flex gap-3 items-end">
                    <Input3D
                      label={`${v4v6Mode === 'range' ? 'Min %' : '% do total'}`}
                      unit="%"
                      value={v4v6Percent}
                      onChange={(v) => handleCustomInputChange(() => setV4v6Percent(v))}
                      step={1}
                      min={0}
                      max={100}
                      isDark={isDark}
                      accentColor="#5A5A40"
                    />
                    {v4v6Mode === 'range' && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1"
                      >
                        <Input3D
                          label="Max %"
                          unit="%"
                          value={v4v6Percent2}
                          onChange={(v) => handleCustomInputChange(() => setV4v6Percent2(v))}
                          step={1}
                          min={0}
                          max={100}
                          isDark={isDark}
                          accentColor="#5A5A40"
                        />
                      </motion.div>
                    )}
                  </div>

                  <div className={`p-3 rounded-xl border text-xs font-semibold ${
                    isDark ? 'bg-[#242720] border-[#393E32]' : 'bg-[#FAF9F5] border-[#E5E2D9]'
                  }`}>
                    <span className="text-[#8C897E] dark:text-[#9EA399]">Resultado: </span>
                    <span className="text-[#5A5A40] dark:text-[#9CB386]">
                      {calculations.v4v6_1_kg} kg N/ha
                      {calculations.v4v6_2_kg > 0 && ` a ${calculations.v4v6_2_kg} kg N/ha`}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8C897E] dark:text-[#9EA399] leading-relaxed">
                    * Faixa agronômica padrão: 50% a 60% do total.
                  </p>
                </div>

                {/* 3rd Application — V8-V10 (% values, auto-calculated) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#3D3D3D] dark:text-[#E8E6DF]">
                      3ª Aplicação (V8-V10) — Percentual
                    </span>
                    <Select3D
                      value={v8v10Mode}
                      onChange={(v) => handleCustomInputChange(() => {
                        setV8v10Mode(v as 'single' | 'range');
                        if (v === 'single') setV8v10Percent2(0);
                      })}
                      isDark={isDark}
                      accentColor="#8D6E63"
                      options={[
                        { value: 'single', label: '1 valor %' },
                        { value: 'range', label: '2 valores %' },
                      ]}
                      className="!inline-flex !w-auto"
                    />
                  </div>

                  <div className="flex gap-3 items-end">
                    <Input3D
                      label={v8v10Mode === 'range' ? 'Min %' : '% do total'}
                      unit="%"
                      value={v8v10Percent}
                      onChange={(v) => handleCustomInputChange(() => setV8v10Percent(v))}
                      step={1}
                      min={0}
                      max={100}
                      isDark={isDark}
                      accentColor="#8D6E63"
                      derived={v8v10Percent === 0}
                      hint={v8v10Percent === 0 ? `Auto-calculado: ${calculations.v8v10_1_auto}%` : undefined}
                    />
                    {v8v10Mode === 'range' && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1"
                      >
                        <Input3D
                          label="Max %"
                          unit="%"
                          value={v8v10Percent2}
                          onChange={(v) => handleCustomInputChange(() => setV8v10Percent2(v))}
                          step={1}
                          min={0}
                          max={100}
                          isDark={isDark}
                          accentColor="#8D6E63"
                          derived={v8v10Percent2 === 0 && v4v6Percent2 > 0}
                          hint={v8v10Percent2 === 0 && v4v6Percent2 > 0 ? `Auto-calculado: ${calculations.v8v10_2_auto}%` : undefined}
                        />
                      </motion.div>
                    )}
                  </div>

                  <div className={`p-3 rounded-xl border text-xs font-semibold ${
                    isDark ? 'bg-[#242720] border-[#393E32]' : 'bg-[#FAF9F5] border-[#E5E2D9]'
                  }`}>
                    <span className="text-[#8C897E] dark:text-[#9EA399]">Resultado: </span>
                    <span className="text-[#8D6E63] dark:text-[#D4A373]">
                      {calculations.v8v10_1_kg} kg N/ha
                      {calculations.v8v10_2_kg > 0 && ` a ${calculations.v8v10_2_kg} kg N/ha`}
                    </span>
                    {v8v10Percent === 0 && (
                      <span className="ml-2 text-[10px] text-[#8C897E] dark:text-[#9EA399]">
                        (Calculado automaticamente para fechar o balanço)
                      </span>
                    )}
                  </div>
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
              
              {/* Metric 1: Necessidade Total */}
              <div className="calc-island-scoop bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px] transition-colors">
                <CalculationIsland
                  isVisible={showCalcExtracao}
                  onToggle={() => setShowCalcExtracao(!showCalcExtracao)}
                  accentColor="#5A5A40"
                  darkAccentColor="#9CB386"
                  isDark={isDark}
                />
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
                <CalculationMemoryPanel isVisible={showCalcExtracao} isDark={isDark}>
                  <div className={`p-2.5 rounded-lg border font-mono text-[11px] leading-relaxed ${
                    isDark ? 'bg-[#232821] border-[#2C3328] text-[#E8E6DF]' : 'bg-white border-[#E5E2D9] text-[#3D3D3D]'
                  }`}>
                    <div className={`font-semibold mb-1 ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>FÓRMULA:</div>
                    <div className={`font-bold ${isDark ? 'text-[#9CB386]' : 'text-[#5A5A40]'}`}>E = sc/ha × N_saca</div>
                    <div className={`border-t my-1 pt-1 font-bold ${isDark ? 'border-[#2C3328] text-[#D4A373]' : 'border-[#F0EDE5] text-[#8D6E63]'}`}>
                      {yieldGoal} × {nRequirementPerBag.toFixed(2)} = {calculations.totalExtraction.toFixed(2)} kg N/ha
                    </div>
                    <p className={`mt-1 ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>
                      N total extraído pela cultura para a produtividade planejada.
                    </p>
                  </div>
                </CalculationMemoryPanel>
              </div>

              {/* Metric 2: Necessidade Líquida */}
              <div className="calc-island-scoop bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px] transition-colors">
                <CalculationIsland
                  isVisible={showCalcLiquida}
                  onToggle={() => setShowCalcLiquida(!showCalcLiquida)}
                  accentColor="#5A5A40"
                  darkAccentColor="#9CB386"
                  isDark={isDark}
                />
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
                <CalculationMemoryPanel isVisible={showCalcLiquida} isDark={isDark}>
                  <div className={`p-2.5 rounded-lg border font-mono text-[11px] leading-relaxed ${
                    isDark ? 'bg-[#232821] border-[#2C3328] text-[#E8E6DF]' : 'bg-white border-[#E5E2D9] text-[#3D3D3D]'
                  }`}>
                    <div className={`font-semibold mb-1 ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>FÓRMULA:</div>
                    <div className={`font-bold ${isDark ? 'text-[#9CB386]' : 'text-[#5A5A40]'}`}>N_Liq = E - MOS - Soja</div>
                    <div className={`border-t my-1 pt-1 font-bold ${isDark ? 'border-[#2C3328] text-[#D4A373]' : 'border-[#F0EDE5] text-[#8D6E63]'}`}>
                      {calculations.totalExtraction.toFixed(2)} - {mosNContribution} - {soyNContribution} = {calculations.liquidNeed.toFixed(2)} kg N/ha
                    </div>
                    <p className={`mt-1 ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>
                      Deduz as contribuições da M.O. e crédito de nitrogênio da soja.
                    </p>
                  </div>
                </CalculationMemoryPanel>
              </div>

              {/* Metric 3: Dose Recomendada com Perdas */}
              <div id="card_dose_total" className="calc-island-scoop bg-[#5A5A40] dark:bg-[#263122] text-white rounded-3xl p-5 shadow-md flex flex-col justify-between min-h-[120px] col-span-2 sm:col-span-1 border border-transparent dark:border-[#3D4C37] transition-colors relative">
                <CalculationIsland
                  isVisible={showCalcDose}
                  onToggle={() => setShowCalcDose(!showCalcDose)}
                  accentColor="#8D6E63"
                  darkAccentColor="#D4A373"
                  isDark={isDark}
                />
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
                <CalculationMemoryPanel isVisible={showCalcDose} isDark={isDark}>
                  <div className="p-2.5 rounded-lg border font-mono text-[11px] leading-relaxed bg-[#232821] border-[#2C3328] text-[#E8E6DF]">
                    <div className="text-[#9EA399] font-semibold mb-1">FÓRMULA:</div>
                    <div className="font-bold text-[#9CB386]">Dose = N_Liq ÷ Efic</div>
                    <div className="border-t border-[#2C3328] my-1 pt-1 text-[#D4A373] font-bold">
                      {calculations.liquidNeed.toFixed(2)} ÷ {efficiency / 100} = {calculations.recommendedDose.toFixed(2)} kg N/ha
                    </div>
                    <p className="mt-1 text-[#9EA399]">
                      Dose corrigida considerando a eficiência de {efficiency}%. Perdas estimadas: {100 - efficiency}%.
                    </p>
                  </div>
                </CalculationMemoryPanel>
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
            <div id="parceling_section" className="calc-island-scoop bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-6 shadow-sm space-y-6 transition-colors relative">
              <CalculationIsland
                isVisible={showCalcParcelamento}
                onToggle={() => setShowCalcParcelamento(!showCalcParcelamento)}
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
                        2ª Aplicação: V4-V6
                      </span>
                      <p className="text-xs text-[#8C897E] dark:text-[#9EA399] mt-0.5">
                        Padrão agronômico: <strong>50% a 60%</strong> da meta ({splitBase === 'dose_perdas' ? 'Dose com perdas' : 'N Líquido'})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[#5A5A40] dark:text-[#9CB386] bg-[#FDFBF7] dark:bg-[#232821] border border-[#E5E2D9] dark:border-[#2C3328] px-2.5 py-1 rounded-md">
                        {calculations.v4v6_1}% ({calculations.v4v6_1_kg} kg N/ha)
                        {calculations.v4v6_2 > 0 && ` a ${calculations.v4v6_2}% (${calculations.v4v6_2_kg} kg N/ha)`}
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
                        {calculations.v8v10_1_final}% ({calculations.v8v10_1_kg} kg N/ha)
                        {calculations.v8v10_2_final > 0 && ` a ${calculations.v8v10_2_final}% (${calculations.v8v10_2_kg} kg N/ha)`}
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

              <CalculationMemoryPanel isVisible={showCalcParcelamento} isDark={isDark}>
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
            <div className="calc-island-scoop bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-6 shadow-sm space-y-4 transition-colors relative">
              <CalculationIsland
                isVisible={showCalcBalanco}
                onToggle={() => setShowCalcBalanco(!showCalcBalanco)}
                accentColor="#2E6F40"
                darkAccentColor="#86efac"
                isDark={isDark}
              />
              
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
                    style={{ width: `${Math.min(100, (calculations.base1_kg / calculations.targetSplitTotal) * 100)}%` }} 
                    className="bg-[#8C897E] h-full transition-all duration-300" 
                    title={`Base: ${calculations.base1_kg} kg N/ha`}
                  />
                  <div 
                    style={{ width: `${Math.min(100, (calculations.v4v6_1_kg / calculations.targetSplitTotal) * 100)}%` }} 
                    className="bg-[#5A5A40] dark:bg-[#9CB386] h-full transition-all duration-300" 
                    title={`V4-V6: ${calculations.v4v6_1_kg} kg N/ha`}
                  />
                  <div 
                    style={{ width: `${Math.min(100, (calculations.v8v10_1_kg / calculations.targetSplitTotal) * 100)}%` }} 
                    className="bg-[#8D6E63] dark:bg-[#D4A373] h-full transition-all duration-300" 
                    title={`V8-V10: ${calculations.v8v10_1_kg} kg N/ha`}
                  />
                </div>

                <div className="flex flex-wrap gap-4 text-xs font-semibold text-[#8C897E] dark:text-[#9EA399] justify-between border-b border-[#F0EDE5] dark:border-[#2C3328] pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#8C897E] rounded-sm" />
                    <span>1ª Base: {calculations.base1_kg} kg/ha</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#5A5A40] dark:bg-[#9CB386] rounded-sm" />
                    <span>2ª V4-V6: {calculations.v4v6_1_kg} kg/ha ({calculations.v4v6_1}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#8D6E63] dark:bg-[#D4A373] rounded-sm" />
                    <span>3ª V8-V10: {calculations.v8v10_1_kg} kg/ha ({calculations.v8v10_1_final}%)</span>
                  </div>
                </div>

                {/* RESULTS INTEGRITY COMPOSER */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-2">
                  <div className="space-y-1">
                    <div className="text-xs text-[#8C897E] dark:text-[#9EA399]">Soma das Três Aplicações:</div>
                    <div className="text-sm font-bold text-[#3D3D3D] dark:text-[#E8E6DF]">
                      {calculations.base1_kg} + {calculations.v4v6_1_kg} + {calculations.v8v10_1_kg} = <span className="font-extrabold text-[#5A5A40] dark:text-[#9CB386] text-lg">{calculations.sumOfSplits} kg N/ha</span>
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

              <CalculationMemoryPanel isVisible={showCalcBalanco} isDark={isDark}>
                <div className={`p-3 rounded-lg border text-[11px] leading-relaxed space-y-1.5 ${
                  isDark ? 'bg-[#232821] border-[#2C3328] text-[#E8E6DF]' : 'bg-white border-[#E5E2D9] text-[#3D3D3D]'
                }`}>
                  <div className={`font-bold text-xs mb-2 ${isDark ? 'text-[#9CB386]' : 'text-[#5A5A40]'}`}>Fechamento de Balanço:</div>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Meta:</span> {calculations.targetSplitTotal.toFixed(2)} kg N/ha</div>
                  <div><span className={`font-semibold ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>Soma:</span> {calculations.base1_kg} + {calculations.v4v6_1_kg} + {calculations.v8v10_1_kg} = {calculations.sumOfSplits} kg N/ha</div>
                  <div className={`border-t pt-1.5 mt-1.5 font-bold ${isDark ? 'border-[#2C3328]' : 'border-[#F0EDE5]'}`}>
                    {calculations.splitDiscrepancy === 0 ? (
                      <span className={isDark ? 'text-[#86efac]' : 'text-[#2E6F40]'}>Balanço Fechado! (100% OK) — A soma corresponde exatamente à meta.</span>
                    ) : (
                      <span className={isDark ? 'text-[#E0A96D]' : 'text-[#8D6E63]'}>Diferença de {calculations.splitDiscrepancy > 0 ? '+' : ''}{calculations.splitDiscrepancy.toFixed(2)} kg N/ha — Ajuste as frações percentuais para fechamento exato.</span>
                    )}
                  </div>
                </div>
              </CalculationMemoryPanel>

            </div>

          </section>

        </div>

        {/* DETAILED FORMULA AND MATHEMATICAL EXPLANATIONS PANEL */}
        <section id="detailed_math_panel" className="bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-6 shadow-sm transition-colors">
          
          {/* DETAILED EXPLANATION CORNER */}
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
  );
}
