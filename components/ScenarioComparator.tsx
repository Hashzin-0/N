'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  Columns,
  Trash2,
  Download,
  RotateCcw,
  Search,
  CheckCircle2,
  ArrowRightLeft,
  Calendar,
  Sparkles,
  TrendingUp,
  Scale,
  Check,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { CalculationRecord, SQLikeCalculationDB } from '@/lib/storage';

interface ScenarioComparatorProps {
  records: CalculationRecord[];
  onReloadRecords: () => void;
  onLoadIntoCalculator: (record: CalculationRecord) => void;
  activeCalculationData?: {
    yieldGoal: number;
    nRequirementPerBag: number;
    mosNContribution: number;
    soyNContribution: number;
    efficiency: number;
    baseDose: number;
    v4v6Percent: number;
    v8v10Percent: number;
    splitBase: 'dose_perdas' | 'necessidade_liquida';
    totalExtraction: number;
    liquidNeed: number;
    recommendedDose: number;
    selectedV4V6Val: number;
    selectedV8V10Val: number;
    sumOfSplits: number;
    [key: string]: number | string; // Allow extra fields
  };
}

export default function ScenarioComparator({
  records,
  onReloadRecords,
  onLoadIntoCalculator,
  activeCalculationData,
}: ScenarioComparatorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'yield_goal' | 'recommended_dose'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Selected IDs for side-by-side comparison (multi-select)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    // Default select first two records if available
    return records.slice(0, 2).map((r) => r.id);
  });

  // Include live active calculation in comparison
  const [includeActiveCalculation, setIncludeActiveCalculation] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      } else {
        if (prev.length >= 3) {
          showToast('Máximo de 3 cenários simultâneos para comparação.');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  // Delete scenario
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir "${name}" do banco local?`)) {
      SQLikeCalculationDB.delete(id);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      onReloadRecords();
      showToast(`Cenário "${name}" removido.`);
    }
  };

  // Restore defaults
  const handleResetDefaults = () => {
    if (confirm('Restaurar os cenários agronômicos padrão no banco local?')) {
      const defs = SQLikeCalculationDB.resetToDefaults();
      setSelectedIds(defs.slice(0, 2).map((d) => d.id));
      onReloadRecords();
      showToast('Cenários de referência restaurados com sucesso.');
    }
  };

  // Clear all
  const handleClearAll = () => {
    if (confirm('Atenção: deseja limpar todos os registros do armazenamento local?')) {
      SQLikeCalculationDB.clear();
      setSelectedIds([]);
      onReloadRecords();
      showToast('Histórico local limpo.');
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cenarios_adubacao_milho_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exportação concluída com sucesso.');
  };

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.notes || '').toLowerCase().includes(q) ||
          r.yield_goal.toString().includes(q)
      );
    }
    result.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (typeof valA === 'string') {
        return sortDirection === 'asc'
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      }
      return sortDirection === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
    return result;
  }, [records, searchTerm, sortBy, sortDirection]);

  // Gather items to compare
  const comparisonItems = useMemo(() => {
    const items: Array<{
      id: string;
      name: string;
      date: string;
      isLive?: boolean;
      yieldGoal: number;
      nReq: number;
      mos: number;
      soy: number;
      efficiency: number;
      totalExtraction: number;
      liquidNeed: number;
      recommendedDose: number;
      baseDose: number;
      v4v6Dose: number;
      v8v10Dose: number;
      v4v6Pct: number;
      v8v10Pct: number;
      sumSplits: number;
    }> = [];

    // Add selected saved records
    records
      .filter((r) => selectedIds.includes(r.id))
      .forEach((r) => {
        items.push({
          id: r.id,
          name: r.name,
          date: new Date(r.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          isLive: false,
          yieldGoal: r.yield_goal,
          nReq: r.n_req_per_bag,
          mos: r.mos_n,
          soy: r.soy_n,
          efficiency: r.efficiency,
          totalExtraction: r.total_extraction,
          liquidNeed: r.liquid_need,
          recommendedDose: r.recommended_dose,
          baseDose: r.base_dose,
          v4v6Dose: r.selected_v4v6_val,
          v8v10Dose: r.selected_v8v10_val,
          v4v6Pct: r.v4v6_percent,
          v8v10Pct: r.v8v10_percent,
          sumSplits: r.sum_of_splits,
        });
      });

    // Optionally include active live calculation
    if (includeActiveCalculation && activeCalculationData) {
      items.unshift({
        id: 'live-current',
        name: '★ Cálculo Atual Ativo',
        date: 'Ao Vivo',
        isLive: true,
        yieldGoal: activeCalculationData.yieldGoal,
        nReq: activeCalculationData.nRequirementPerBag,
        mos: activeCalculationData.mosNContribution,
        soy: activeCalculationData.soyNContribution,
        efficiency: activeCalculationData.efficiency,
        totalExtraction: activeCalculationData.totalExtraction,
        liquidNeed: activeCalculationData.liquidNeed,
        recommendedDose: activeCalculationData.recommendedDose,
        baseDose: activeCalculationData.baseDose,
        v4v6Dose: activeCalculationData.selectedV4V6Val,
        v8v10Dose: activeCalculationData.selectedV8V10Val,
        v4v6Pct: activeCalculationData.v4v6Percent,
        v8v10Pct: activeCalculationData.v8v10Percent,
        sumSplits: activeCalculationData.sumOfSplits,
      });
    }

    return items;
  }, [records, selectedIds, includeActiveCalculation, activeCalculationData]);

  // Pairwise Delta calculation if exactly 2 items compared
  const pairDelta = useMemo(() => {
    if (comparisonItems.length !== 2) return null;
    const [itemA, itemB] = comparisonItems;

    const diffYield = Number((itemB.yieldGoal - itemA.yieldGoal).toFixed(1));
    const diffYieldPct = itemA.yieldGoal > 0 ? Number(((diffYield / itemA.yieldGoal) * 100).toFixed(1)) : 0;

    const diffExtraction = Number((itemB.totalExtraction - itemA.totalExtraction).toFixed(2));
    const diffLiquid = Number((itemB.liquidNeed - itemA.liquidNeed).toFixed(2));
    const diffDose = Number((itemB.recommendedDose - itemA.recommendedDose).toFixed(2));
    const diffDosePct = itemA.recommendedDose > 0 ? Number(((diffDose / itemA.recommendedDose) * 100).toFixed(1)) : 0;

    // Marginal N cost per extra bag produced: kg N extra / sc extra
    const marginalNCost = diffYield !== 0 ? Number((diffDose / diffYield).toFixed(2)) : null;

    return {
      diffYield,
      diffYieldPct,
      diffExtraction,
      diffLiquid,
      diffDose,
      diffDosePct,
      marginalNCost,
      itemAName: itemA.name,
      itemBName: itemB.name,
    };
  }, [comparisonItems]);

  return (
    <section id="scenario_comparator_section" className="bg-white dark:bg-[#1C1E19] rounded-3xl border border-[#E5E2D9] dark:border-[#2E3326] p-6 sm:p-8 shadow-sm space-y-6 transition-colors">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-[#5A5A40] dark:bg-[#252820] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-md"
          >
            <CheckCircle2 className="h-4 w-4 text-[#D4A373]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER WITH SQLIKE BADGE & ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#F0EDE5] dark:border-[#2F3329] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#F9F8F6] dark:bg-[#242720] text-[#5A5A40] dark:text-[#A3B18A] rounded-xl border border-[#E5E2D9] dark:border-[#383D31]">
              <Database className="h-5 w-5 text-[#5A5A40] dark:text-[#A3B18A]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#5A5A40] dark:text-[#E8E7DF] flex items-center gap-2">
                Comparador de Cenários & Histórico Local
                <span className="text-[11px] font-bold bg-[#F9F8F6] dark:bg-[#242720] text-[#8C897E] dark:text-[#A6A395] border border-[#E5E2D9] dark:border-[#383D31] px-2 py-0.5 rounded-full">
                  SQLike ({records.length} {records.length === 1 ? 'registro' : 'registros'})
                </span>
              </h2>
              <p className="text-xs text-[#8C897E] dark:text-[#A6A395] mt-0.5">
                Armazenamento estruturado no navegador com análise comparativa de produtividade e adubação
              </p>
            </div>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            id="btn_export_json"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#5A5A40] dark:text-[#E8E7DF] bg-[#F9F8F6] dark:bg-[#242720] hover:bg-[#F0EDE5] dark:hover:bg-[#2F3329] border border-[#E5E2D9] dark:border-[#383D31] px-3 py-2 rounded-xl transition-all"
            title="Exportar registros salvos em formato JSON"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar JSON
          </button>
          <button
            id="btn_reset_defaults"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#8C897E] hover:text-[#5A5A40] dark:hover:text-[#E8E7DF] bg-[#F9F8F6] dark:bg-[#242720] hover:bg-[#F0EDE5] dark:hover:bg-[#2F3329] border border-[#E5E2D9] dark:border-[#383D31] px-3 py-2 rounded-xl transition-all"
            title="Restaurar cenários padrão de referência"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar Exemplos
          </button>
          {records.length > 0 && (
            <button
              id="btn_clear_all_storage"
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#8D6E63] hover:text-red-700 dark:hover:text-red-400 bg-[#F9F8F6] dark:bg-[#242720] hover:bg-[#F0EDE5] dark:hover:bg-[#2F3329] border border-[#E5E2D9] dark:border-[#383D31] px-3 py-2 rounded-xl transition-all"
              title="Excluir todos os cenários locais"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* FILTER & SELECTION BAR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-[#F9F8F6] dark:bg-[#20231C] p-3.5 rounded-2xl border border-[#E5E2D9] dark:border-[#333829]">
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="h-4 w-4 text-[#8C897E] dark:text-[#A6A395] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, sacas/ha ou notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-[#282B22] border border-[#E5E2D9] dark:border-[#3C4232] rounded-xl text-[#3D3D3D] dark:text-[#F4F3EE] focus:outline-none neonFocusClasses focus:ring-2 focus:ring-[#5A5A40]/30 dark:focus:ring-[#8C976D]/40"
          />
        </div>

        {/* Sort Select */}
        <div className="md:col-span-4 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-[#8C897E] dark:text-[#A6A395] whitespace-nowrap">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full text-xs bg-white dark:bg-[#282B22] border border-[#E5E2D9] dark:border-[#3C4232] rounded-xl px-2.5 py-2 font-medium text-[#3D3D3D] dark:text-[#F4F3EE] focus:outline-none neonFocusClasses"
          >
            <option value="created_at">Data de Registro</option>
            <option value="yield_goal">Produtividade Alvo (sc/ha)</option>
            <option value="recommended_dose">Dose Recomendada de N</option>
          </select>
          <button
            onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
            className="p-2 bg-white dark:bg-[#282B22] border border-[#E5E2D9] dark:border-[#3C4232] rounded-xl text-[#8C897E] dark:text-[#A6A395] hover:text-[#5A5A40] dark:hover:text-[#E8E7DF]"
            title={sortDirection === 'asc' ? 'Crescente' : 'Decrescente'}
          >
            {sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Toggle Live Active Calculation in comparison */}
        <div className="md:col-span-3 flex justify-end">
          <label className="flex items-center gap-2 text-xs font-semibold text-[#5A5A40] dark:text-[#E8E7DF] cursor-pointer select-none bg-white dark:bg-[#282B22] px-3 py-2 rounded-xl border border-[#E5E2D9] dark:border-[#3C4232] hover:border-[#8C897E] transition-all">
            <input
              type="checkbox"
              checked={includeActiveCalculation}
              onChange={(e) => setIncludeActiveCalculation(e.target.checked)}
              className="accent-[#5A5A40] dark:accent-[#7D8861] rounded"
            />
            <span>Incluir Cálculo Ativo</span>
          </label>
        </div>
      </div>

      {/* SQLIKE DATA TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-[#E5E2D9] dark:border-[#333829]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F9F8F6] dark:bg-[#20231C] text-[#8C897E] dark:text-[#A6A395] font-bold uppercase text-[10px] tracking-wider border-b border-[#E5E2D9] dark:border-[#333829]">
              <th className="p-3.5 text-center w-12">Comparar</th>
              <th className="p-3.5">Cenário / Data</th>
              <th className="p-3.5 text-right">Produtividade</th>
              <th className="p-3.5 text-right">Extração Total</th>
              <th className="p-3.5 text-right">N Líquido</th>
              <th className="p-3.5 text-right">Dose a Aplicar</th>
              <th className="p-3.5 text-center">Parcelamento (B / V4 / V8)</th>
              <th className="p-3.5 text-center w-36">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EDE5] dark:divide-[#2F3329] bg-white dark:bg-[#1A1C16]">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-xs text-[#8C897E] dark:text-[#A6A395]">
                  Nenhum registro encontrado no banco de dados local. Salve o cálculo atual ou clique em &quot;Restaurar Exemplos&quot;.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => {
                const isSelected = selectedIds.includes(r.id);
                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-[#FDFBF7] dark:hover:bg-[#242720] transition-colors ${
                      isSelected ? 'bg-[#F9F8F6]/80 dark:bg-[#252820] font-medium' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(r.id)}
                        className="accent-[#5A5A40] dark:accent-[#7D8861] h-4 w-4 cursor-pointer rounded"
                        title="Marcar para comparar lado a lado"
                      />
                    </td>

                    {/* Name & Date */}
                    <td className="p-3.5">
                      <div className="font-bold text-[#3D3D3D] dark:text-[#F4F3EE] flex items-center gap-1.5">
                        {r.name}
                        {isSelected && (
                          <span className="text-[9px] bg-[#5A5A40] dark:bg-[#7D8861] text-white px-1.5 py-0.2 rounded font-bold">
                            Selecionado
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#8C897E] dark:text-[#A6A395] flex items-center gap-1 mt-0.5" suppressHydrationWarning>
                        <Calendar className="h-3 w-3" />
                        <span suppressHydrationWarning>
                          {new Date(r.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {r.notes && <span className="italic ml-1">· {r.notes}</span>}
                      </div>
                    </td>

                    {/* Productivity */}
                    <td className="p-3.5 text-right font-bold text-[#5A5A40] dark:text-[#A3B18A]">
                      {r.yield_goal} <span className="text-[10px] font-normal text-[#8C897E] dark:text-[#A6A395]">sc/ha</span>
                    </td>

                    {/* Total Extraction */}
                    <td className="p-3.5 text-right text-[#3D3D3D] dark:text-[#E8E7DF]">
                      {r.total_extraction.toFixed(1)} <span className="text-[10px] text-[#8C897E] dark:text-[#A6A395]">kg/ha</span>
                    </td>

                    {/* Liquid Need */}
                    <td className="p-3.5 text-right text-[#3D3D3D] dark:text-[#E8E7DF]">
                      {r.liquid_need.toFixed(1)} <span className="text-[10px] text-[#8C897E] dark:text-[#A6A395]">kg/ha</span>
                    </td>

                    {/* Recommended Dose */}
                    <td className="p-3.5 text-right font-bold text-[#D4A373]">
                      {r.recommended_dose.toFixed(1)} <span className="text-[10px] font-normal text-[#8C897E] dark:text-[#A6A395]">kg/ha</span>
                    </td>

                    {/* Splits */}
                    <td className="p-3.5 text-center text-[10px] text-[#8C897E] dark:text-[#A6A395]">
                      <span className="font-semibold text-[#3D3D3D] dark:text-[#F4F3EE]">{r.base_dose}</span> /{' '}
                      <span className="font-semibold text-[#5A5A40] dark:text-[#A3B18A]">{r.selected_v4v6_val.toFixed(0)}</span> ({r.v4v6_percent}%) /{' '}
                      <span className="font-semibold text-[#8D6E63] dark:text-[#D4A373]">{r.selected_v8v10_val.toFixed(0)}</span> ({r.v8v10_percent}%)
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            onLoadIntoCalculator(r);
                            showToast(`Cenário "${r.name}" carregado na calculadora!`);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-[#5A5A40] dark:text-[#E8E7DF] bg-[#F9F8F6] dark:bg-[#242720] hover:bg-[#5A5A40] dark:hover:bg-[#7D8861] hover:text-white border border-[#E5E2D9] dark:border-[#383D31] rounded-lg transition-all"
                          title="Preencher calculadora com estes valores"
                        >
                          Carregar
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.name)}
                          className="p-1 text-[#8C897E] hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-[#F9F8F6] dark:hover:bg-[#242720] transition-colors"
                          title="Excluir este registro"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* SIDE-BY-SIDE COMPARATOR SECTION */}
      <div className="bg-[#FDFBF7] dark:bg-[#1A1C16] rounded-3xl border border-[#E5E2D9] dark:border-[#333829] p-6 space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#F0EDE5] dark:border-[#2F3329] pb-4">
          <div className="flex items-center gap-2">
            <Columns className="h-5 w-5 text-[#5A5A40] dark:text-[#A3B18A]" />
            <div>
              <h3 className="text-sm font-bold text-[#5A5A40] dark:text-[#E8E7DF] uppercase tracking-wider">
                Matriz de Comparação Lado a Lado
              </h3>
              <p className="text-xs text-[#8C897E] dark:text-[#A6A395]">
                {comparisonItems.length === 0
                  ? 'Selecione caixas de seleção na tabela acima para comparar cenários.'
                  : `Comparando ${comparisonItems.length} ${comparisonItems.length === 1 ? 'cenário' : 'cenários'} simultâneos.`}
              </p>
            </div>
          </div>

          {comparisonItems.length >= 2 && (
            <div className="text-xs text-[#5A5A40] dark:text-[#A3B18A] font-semibold bg-white dark:bg-[#242720] border border-[#E5E2D9] dark:border-[#383D31] px-3 py-1 rounded-xl">
              ⚖ Análise Comparativa Ativa
            </div>
          )}
        </div>

        {comparisonItems.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#8C897E] dark:text-[#A6A395] bg-white dark:bg-[#20231C] rounded-2xl border border-dashed border-[#E5E2D9] dark:border-[#333829] p-6">
            <Scale className="h-8 w-8 text-[#8C897E]/50 mx-auto mb-2" />
            <p className="font-semibold text-[#3D3D3D] dark:text-[#F4F3EE]">Nenhum cenário selecionado para comparação.</p>
            <p className="text-[11px] text-[#8C897E] dark:text-[#A6A395] mt-1">
              Marque 2 ou 3 caixas de seleção na tabela acima ou ative o &quot;Incluir Cálculo Ativo&quot; para analisar as diferenças.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* COMPARISON CARDS / GRID */}
            <div className={`grid grid-cols-1 ${comparisonItems.length === 2 ? 'md:grid-cols-2' : comparisonItems.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4`}>
              {comparisonItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-[#20231C] rounded-2xl border p-5 space-y-4 shadow-sm relative overflow-hidden ${
                    item.isLive ? 'border-[#D4A373] ring-1 ring-[#D4A373]' : 'border-[#E5E2D9] dark:border-[#333829]'
                  }`}
                >
                  {/* Card Title */}
                  <div className="border-b border-[#F0EDE5] dark:border-[#2F3329] pb-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold uppercase text-[#8C897E] dark:text-[#A6A395] tracking-wider">
                        {item.isLive ? 'Em Edição' : `Cenário #${idx + 1}`}
                      </span>
                      <span className="text-[10px] text-[#8C897E] dark:text-[#A6A395]" suppressHydrationWarning>{item.date}</span>
                    </div>
                    <h4 className="font-bold text-sm text-[#5A5A40] dark:text-[#E8E7DF] mt-0.5">{item.name}</h4>
                  </div>

                  {/* Primary Metric: Yield Goal */}
                  <div className="bg-[#F9F8F6] dark:bg-[#282B22] p-3 rounded-xl border border-[#E5E2D9] dark:border-[#3C4232] flex justify-between items-center">
                    <span className="text-xs text-[#8C897E] dark:text-[#A6A395] font-medium">Produtividade Alvo:</span>
                    <span className="text-lg font-bold text-[#5A5A40] dark:text-[#A3B18A]">{item.yieldGoal} sc/ha</span>
                  </div>

                  {/* Key Metrics Breakdown */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#F0EDE5] dark:border-[#2F3329]">
                      <span className="text-[#8C897E] dark:text-[#A6A395]">Extração Total de N:</span>
                      <strong className="text-[#3D3D3D] dark:text-[#F4F3EE]">{item.totalExtraction.toFixed(2)} kg/ha</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#F0EDE5] dark:border-[#2F3329]">
                      <span className="text-[#8C897E] dark:text-[#A6A395]">Abatimento MOS + Soja:</span>
                      <strong className="text-[#8D6E63] dark:text-[#D4A373] font-medium">-{(item.mos + item.soy).toFixed(1)} kg/ha</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#F0EDE5] dark:border-[#2F3329]">
                      <span className="text-[#8C897E] dark:text-[#A6A395]">Necessidade Líquida:</span>
                      <strong className="text-[#3D3D3D] dark:text-[#F4F3EE]">{item.liquidNeed.toFixed(2)} kg/ha</strong>
                    </div>
                    <div className="flex justify-between py-1.5 bg-[#FDFBF7] dark:bg-[#282B22] px-2 rounded-lg font-bold">
                      <span className="text-[#5A5A40] dark:text-[#A3B18A]">Dose Total a Aplicar:</span>
                      <span className="text-[#D4A373] text-sm">{item.recommendedDose.toFixed(2)} kg N/ha</span>
                    </div>
                  </div>

                  {/* Split distribution bars */}
                  <div className="space-y-2 pt-2 border-t border-[#F0EDE5] dark:border-[#2F3329]">
                    <span className="text-[10px] font-bold uppercase text-[#8C897E] dark:text-[#A6A395] block">
                      Cronograma de Aplicação
                    </span>
                    <div className="h-2.5 bg-[#F0EDE5] dark:bg-[#333829] rounded-full flex overflow-hidden">
                      <div
                        style={{ width: `${(item.baseDose / item.recommendedDose) * 100}%` }}
                        className="bg-[#8C897E] h-full"
                        title={`Base: ${item.baseDose} kg/ha`}
                      />
                      <div
                        style={{ width: `${(item.v4v6Dose / item.recommendedDose) * 100}%` }}
                        className="bg-[#5A5A40] dark:bg-[#7D8861] h-full"
                        title={`V4-V6: ${item.v4v6Dose.toFixed(1)} kg/ha`}
                      />
                      <div
                        style={{ width: `${(item.v8v10Dose / item.recommendedDose) * 100}%` }}
                        className="bg-[#8D6E63] dark:text-[#D4A373] h-full"
                        title={`V8-V10: ${item.v8v10Dose.toFixed(1)} kg/ha`}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-center pt-1">
                      <div className="bg-[#F9F8F6] dark:bg-[#282B22] p-1 rounded">
                        <span className="text-[#8C897E] dark:text-[#A6A395] block text-[9px]">1ª Base</span>
                        <strong className="dark:text-[#E8E7DF]">{item.baseDose} kg</strong>
                      </div>
                      <div className="bg-[#F9F8F6] dark:bg-[#282B22] p-1 rounded">
                        <span className="text-[#8C897E] dark:text-[#A6A395] block text-[9px]">2ª V4-V6</span>
                        <strong className="dark:text-[#E8E7DF]">{item.v4v6Dose.toFixed(1)} kg</strong>
                      </div>
                      <div className="bg-[#F9F8F6] dark:bg-[#282B22] p-1 rounded">
                        <span className="text-[#8C897E] dark:text-[#A6A395] block text-[9px]">3ª V8-V10</span>
                        <strong className="dark:text-[#E8E7DF]">{item.v8v10Dose.toFixed(1)} kg</strong>
                      </div>
                    </div>
                  </div>

                  {/* Load button if not live */}
                  {!item.isLive && (
                    <button
                      onClick={() => {
                        const original = records.find((r) => r.id === item.id);
                        if (original) {
                          onLoadIntoCalculator(original);
                          showToast(`Cenário "${original.name}" carregado!`);
                        }
                      }}
                      className="w-full py-2 text-xs font-bold text-[#5A5A40] dark:text-[#E8E7DF] bg-[#F9F8F6] dark:bg-[#282B22] hover:bg-[#5A5A40] dark:hover:bg-[#7D8861] hover:text-white border border-[#E5E2D9] dark:border-[#3C4232] rounded-xl transition-all"
                    >
                      Carregar este cenário na calculadora
                    </button>
                  )}

                </div>
              ))}
            </div>

            {/* PAIRWISE AGRONOMIC DELTA ANALYSIS (WHEN EXACTLY 2 SELECTED) */}
            {pairDelta && (
              <div className="bg-white dark:bg-[#20231C] rounded-2xl border border-[#E5E2D9] dark:border-[#333829] p-5 space-y-4">
                <div className="flex items-center gap-2 text-[#5A5A40] dark:text-[#A3B18A] font-bold text-xs uppercase tracking-wider border-b border-[#F0EDE5] dark:border-[#2F3329] pb-2">
                  <ArrowRightLeft className="h-4 w-4 text-[#D4A373]" />
                  <span>Diferença Agronômica Direta ({pairDelta.itemAName} ➔ {pairDelta.itemBName})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Delta Produtividade */}
                  <div className="bg-[#F9F8F6] dark:bg-[#282B22] p-3 rounded-xl border border-[#E5E2D9] dark:border-[#3C4232]">
                    <span className="text-[10px] font-bold uppercase text-[#8C897E] dark:text-[#A6A395] block">
                      Variação de Produtividade
                    </span>
                    <div className="text-lg font-bold text-[#5A5A40] dark:text-[#A3B18A] mt-1">
                      {pairDelta.diffYield > 0 ? `+${pairDelta.diffYield}` : pairDelta.diffYield} sc/ha
                      <span className="text-xs font-normal text-[#8C897E] dark:text-[#A6A395] ml-1">
                        ({pairDelta.diffYieldPct > 0 ? `+${pairDelta.diffYieldPct}` : pairDelta.diffYieldPct}%)
                      </span>
                    </div>
                  </div>

                  {/* Delta Dose de N */}
                  <div className="bg-[#F9F8F6] dark:bg-[#282B22] p-3 rounded-xl border border-[#E5E2D9] dark:border-[#3C4232]">
                    <span className="text-[10px] font-bold uppercase text-[#8C897E] dark:text-[#A6A395] block">
                      Variação de Dose de N a Aplicar
                    </span>
                    <div className="text-lg font-bold text-[#D4A373] mt-1">
                      {pairDelta.diffDose > 0 ? `+${pairDelta.diffDose}` : pairDelta.diffDose} kg N/ha
                      <span className="text-xs font-normal text-[#8C897E] dark:text-[#A6A395] ml-1">
                        ({pairDelta.diffDosePct > 0 ? `+${pairDelta.diffDosePct}` : pairDelta.diffDosePct}%)
                      </span>
                    </div>
                  </div>

                  {/* Marginal Nitrogen Efficiency */}
                  <div className="bg-[#F9F8F6] dark:bg-[#282B22] p-3 rounded-xl border border-[#E5E2D9] dark:border-[#3C4232]">
                    <span className="text-[10px] font-bold uppercase text-[#8C897E] dark:text-[#A6A395] block">
                      Custo Marginal de Nitrogênio
                    </span>
                    <div className="text-lg font-bold text-[#5A5A40] dark:text-[#A3B18A] mt-1">
                      {pairDelta.marginalNCost !== null
                        ? `${pairDelta.marginalNCost} kg N`
                        : '0 kg N'}
                      <span className="text-xs font-normal text-[#8C897E] dark:text-[#A6A395] ml-1">/ saca extra</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-[#8C897E] dark:text-[#A6A395] bg-[#FDFBF7] dark:bg-[#1A1C16] p-3 rounded-xl border border-[#E5E2D9] dark:border-[#333829] leading-relaxed">
                  💡 <strong>Conclusão Técnica:</strong> Para elevar a produtividade em{' '}
                  <strong>{Math.abs(pairDelta.diffYield)} sc/ha</strong>, é necessário ajustar a fertilização em{' '}
                  <strong>{pairDelta.diffDose > 0 ? `+${pairDelta.diffDose}` : pairDelta.diffDose} kg N/ha</strong>.
                  {pairDelta.marginalNCost !== null && (
                    <span>
                      {' '}Isso representa uma demanda de <strong>{pairDelta.marginalNCost} kg de nitrogênio comercial a cada saca adicional colhida</strong> (já computadas as eficiências e perdas).
                    </span>
                  )}
                </p>
              </div>
            )}

          </div>
        )}

      </div>

    </section>
  );
}
