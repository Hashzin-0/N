'use client';

import React, { useMemo } from 'react';
import { Layers, TrendingUp, Minus, TrendingDown } from 'lucide-react';
import { MultiButton, type MultiButtonItem } from './multi-button';

const PRESET_ICONS = [TrendingUp, Minus, TrendingDown];

interface PresetMultiButtonProps<T extends { id: string; name: string }> {
  presets: T[];
  activePreset: string;
  onPresetClick: (preset: T) => void;
  isDark: boolean;
  id?: string;
}

export default function PresetMultiButton<T extends { id: string; name: string }>({
  presets,
  activePreset,
  onPresetClick,
  isDark,
  id,
}: PresetMultiButtonProps<T>) {
  const items: MultiButtonItem[] = useMemo(
    () =>
      presets.map((p, i) => {
        const Icon = PRESET_ICONS[i] ?? Layers;
        return {
          id: p.id,
          icon: ({ className }: { className?: string }) => (
            <Icon className={className} />
          ),
          label: p.name.split(' ')[0],
          ariaLabel: p.name,
          onClick: () => onPresetClick(p),
        };
      }),
    [presets, onPresetClick],
  );

  return (
    <div
      id={id}
      className="flex items-center gap-3 flex-wrap pb-4 border-b border-[#F0EDE5] dark:border-[#2C3328]"
    >
      <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase tracking-wider flex items-center gap-1.5">
        <Layers className="h-3 w-3" /> Cenários:
      </span>
      <MultiButton
        gooey
        variant="ghost"
        size="sm"
        items={items}
        highlightColor={isDark ? '#9CB386' : '#5A5A40'}
      />
    </div>
  );
}
