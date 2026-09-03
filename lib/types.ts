export interface Calculations {
  totalExtraction: number;
  liquidNeed: number;
  recommendedDose: number;
  targetSplitTotal: number;
  base1_kg: number;
  base2_kg: number;
  v4v6_1: number;
  v4v6_2: number;
  v4v6_1_kg: number;
  v4v6_2_kg: number;
  v4v6_50: number;
  v4v6_60: number;
  v8v10_1_final: number;
  v8v10_2_final: number;
  v8v10_1_kg: number;
  v8v10_2_kg: number;
  v8v10_20: number;
  v8v10_30: number;
  v8v10_1_auto: number;
  v8v10_2_auto: number;
  sumOfSplits: number;
  sumOfSplitsRange: number;
  splitDiscrepancy: number;
  splitDifference: number;
}

export interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  formulaSummary: string;
  isDark: boolean;
  accentColor?: string;
  darkAccentColor?: string;
  variant?: 'default' | 'hero';
  saveAction?: { label: string; onClick: () => void };
  children: React.ReactNode;
}
