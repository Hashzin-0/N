'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [fillWidth, setFillWidth] = useState<number>(0);

  const measure = useCallback(() => {
    const card = containerRef.current?.closest('#form_section');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const pl = parseFloat(getComputedStyle(card).paddingLeft) || 0;
    const pr = parseFloat(getComputedStyle(card).paddingRight) || 0;
    setFillWidth(rect.width - pl - pr);
  }, []);

  useEffect(() => {
    measure();
    const card = containerRef.current?.closest('#form_section');
    if (!card) return;
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    return () => observer.disconnect();
  }, [measure]);

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
      ref={containerRef}
      className="flex items-center gap-2 pb-4 border-b border-[#F0EDE5] dark:border-[#2C3328]"
    >
      <span className="flex-shrink-0 whitespace-nowrap text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase tracking-wider flex items-center gap-1.5">
        <Layers className="h-3 w-3" /> Cenários:
      </span>
      <div className="flex-1 min-w-0">
        <MultiButton
          gooey
          variant="ghost"
          size="sm"
          items={items}
          fillWidth={fillWidth}
          highlightColor={isDark ? '#9CB386' : '#5A5A40'}
        />
      </div>
    </div>
  );
}
