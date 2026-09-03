'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookmarkPlus, Check, Sparkles } from 'lucide-react';
import { CalculationRecord } from '@/lib/storage';

interface SaveScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, notes: string) => void;
  currentData: {
    yieldGoal: number;
    nRequirementPerBag?: number;
    totalExtraction: number;
    liquidNeed: number;
    recommendedDose: number;
    mosNContribution: number;
    soyNContribution: number;
    efficiency?: number;
    baseDose: number;
    v4v6Percent?: number;
    v8v10Percent?: number;
    splitBase?: string;
    selectedV4V6Val: number;
    selectedV8V10Val: number;
    sumOfSplits?: number;
  };
}

export default function SaveScenarioModal({
  isOpen,
  onClose,
  onSave,
  currentData,
}: SaveScenarioModalProps) {
  if (!isOpen) return null;

  return <SaveScenarioModalContent onClose={onClose} onSave={onSave} currentData={currentData} />;
}

function SaveScenarioModalContent({
  onClose,
  onSave,
  currentData,
}: {
  onClose: () => void;
  onSave: (name: string, notes: string) => void;
  currentData: SaveScenarioModalProps['currentData'];
}) {
  const [name, setName] = useState(() => 
    `Cenário ${currentData.yieldGoal} sc/ha (${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`
  );
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), notes.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#FDFBF7] dark:bg-[#1A1C16] border border-[#E5E2D9] dark:border-[#333829] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="bg-[#5A5A40] dark:bg-[#252820] text-white p-5 flex justify-between items-center border-b dark:border-[#383D30]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl">
                <BookmarkPlus className="h-5 w-5 text-[#D4A373]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Salvar Cenário no Banco Local</h3>
                <p className="text-xs text-white/80">Armazenamento SQLike em localStorage</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Quick Metrics preview card */}
            <div className="bg-[#F9F8F6] dark:bg-[#20231C] p-4 rounded-2xl border border-[#E5E2D9] dark:border-[#333829] space-y-2">
              <span className="text-[10px] font-bold uppercase text-[#8C897E] dark:text-[#A6A395] tracking-wider block">
                Resumo dos Parâmetros a Salvar
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white dark:bg-[#282B22] p-2 rounded-xl border border-[#E5E2D9] dark:border-[#3C4232]">
                  <span className="text-[10px] text-[#8C897E] dark:text-[#A6A395] block">Produtividade</span>
                  <strong className="text-[#5A5A40] dark:text-[#E8E7DF] font-bold">{currentData.yieldGoal} sc/ha</strong>
                </div>
                <div className="bg-white dark:bg-[#282B22] p-2 rounded-xl border border-[#E5E2D9] dark:border-[#3C4232]">
                  <span className="text-[10px] text-[#8C897E] dark:text-[#A6A395] block">Extração N</span>
                  <strong className="text-[#5A5A40] dark:text-[#E8E7DF] font-bold">{currentData.totalExtraction.toFixed(1)} kg</strong>
                </div>
                <div className="bg-white dark:bg-[#282B22] p-2 rounded-xl border border-[#E5E2D9] dark:border-[#3C4232]">
                  <span className="text-[10px] text-[#8C897E] dark:text-[#A6A395] block">N Líquido</span>
                  <strong className="text-[#5A5A40] dark:text-[#E8E7DF] font-bold">{currentData.liquidNeed.toFixed(1)} kg</strong>
                </div>
                <div className="bg-white dark:bg-[#282B22] p-2 rounded-xl border border-[#E5E2D9] dark:border-[#3C4232]">
                  <span className="text-[10px] text-[#8C897E] dark:text-[#A6A395] block">Dose Final</span>
                  <strong className="text-[#D4A373] font-bold">{currentData.recommendedDose.toFixed(1)} kg</strong>
                </div>
              </div>
            </div>

            {/* Input Name */}
            <div className="space-y-1.5">
              <label htmlFor="scenario_name_input" className="block text-xs font-bold uppercase text-[#8C897E] dark:text-[#A6A395] tracking-wider">
                Nome do Cenário *
              </label>
              <input
                id="scenario_name_input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Milho Safrinha 160 sc/ha - Talhão 02"
                className="w-full text-sm bg-white dark:bg-[#20231C] border border-[#E5E2D9] dark:border-[#333829] rounded-xl px-4 py-2.5 font-semibold text-[#3D3D3D] dark:text-[#F4F3EE] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 dark:focus:ring-[#8C976D]/40"
              />
            </div>

            {/* Optional Notes */}
            <div className="space-y-1.5">
              <label htmlFor="scenario_notes_input" className="block text-xs font-bold uppercase text-[#8C897E] dark:text-[#A6A395] tracking-wider">
                Observações Agronômicas (Opcional)
              </label>
              <textarea
                id="scenario_notes_input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Híbrido responsivo, solo argiloso após soja precoce..."
                className="w-full text-xs bg-white dark:bg-[#20231C] border border-[#E5E2D9] dark:border-[#333829] rounded-xl p-3 text-[#3D3D3D] dark:text-[#F4F3EE] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 dark:focus:ring-[#8C976D]/40 resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-[#8C897E] dark:text-[#A6A395] hover:text-[#3D3D3D] dark:hover:text-[#F4F3EE] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn_confirm_save_scenario"
                className="flex items-center gap-2 bg-[#5A5A40] hover:bg-[#4a4a35] dark:bg-[#7D8861] dark:hover:bg-[#6D7752] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
              >
                <Check className="h-4 w-4" />
                Confirmar e Gravar
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
