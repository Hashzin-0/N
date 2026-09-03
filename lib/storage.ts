'use client';

import { useSyncExternalStore } from 'react';

export interface CalculationRecord {
  id: string;
  name: string;
  created_at: string;
  yield_goal: number; // sc/ha
  n_req_per_bag: number; // kg N/sc
  mos_n: number; // kg N/ha
  soy_n: number; // kg N/ha
  efficiency: number; // %
  base_dose: number; // kg N/ha
  v4v6_percent: number; // %
  v8v10_percent: number; // %
  split_base: 'dose_perdas' | 'necessidade_liquida';
  total_extraction: number; // kg N/ha
  liquid_need: number; // kg N/ha
  recommended_dose: number; // kg N/ha
  selected_v4v6_val: number; // kg N/ha
  selected_v8v10_val: number; // kg N/ha
  sum_of_splits: number; // kg N/ha
  notes?: string;
}

const STORAGE_KEY = 'agronomic_n_pro_calculations_v1';
const STORAGE_EVENT = 'agronomic_db_update';

// Initial preloaded benchmark scenarios ordered by created_at desc
export const DEFAULT_SAVED_SCENARIOS: CalculationRecord[] = [
  {
    id: 'sc-seed-2',
    name: 'Cenário Alta Produtividade (180 sc/ha)',
    created_at: '2026-09-02T14:30:00.000Z',
    yield_goal: 180,
    n_req_per_bag: 1.40,
    mos_n: 25,
    soy_n: 25,
    efficiency: 80,
    base_dose: 40,
    v4v6_percent: 55,
    v8v10_percent: 25,
    split_base: 'dose_perdas',
    total_extraction: 252.0,
    liquid_need: 202.0,
    recommended_dose: 252.5,
    selected_v4v6_val: 138.88,
    selected_v8v10_val: 63.13,
    sum_of_splits: 242.01,
    notes: 'Híbrido de alto investimento e espaçamento adensado.',
  },
  {
    id: 'sc-seed-1',
    name: 'Cenário Médio (150 sc/ha)',
    created_at: '2026-09-02T11:00:00.000Z',
    yield_goal: 150,
    n_req_per_bag: 1.35,
    mos_n: 30,
    soy_n: 20,
    efficiency: 80,
    base_dose: 30,
    v4v6_percent: 50,
    v8v10_percent: 30,
    split_base: 'dose_perdas',
    total_extraction: 202.5,
    liquid_need: 152.5,
    recommended_dose: 190.63,
    selected_v4v6_val: 95.31,
    selected_v8v10_val: 57.19,
    sum_of_splits: 182.5,
    notes: 'Fertilidade padrão, safra verão pós-soja.',
  },
  {
    id: 'sc-seed-3',
    name: 'Cenário Econômico / Baixa M.O. (120 sc/ha)',
    created_at: '2026-09-02T09:15:00.000Z',
    yield_goal: 120,
    n_req_per_bag: 1.30,
    mos_n: 15,
    soy_n: 15,
    efficiency: 80,
    base_dose: 30,
    v4v6_percent: 60,
    v8v10_percent: 20,
    split_base: 'dose_perdas',
    total_extraction: 156.0,
    liquid_need: 126.0,
    recommended_dose: 157.5,
    selected_v4v6_val: 94.5,
    selected_v8v10_val: 31.5,
    sum_of_splits: 156.0,
    notes: 'Solo mais arenoso com menor reserva natural.',
  },
];

export interface QueryOptions {
  orderBy?: 'created_at' | 'yield_goal' | 'recommended_dose' | 'name';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  search?: string;
}

export function notifyStorageChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }
}

// In-memory cache for useSyncExternalStore to guarantee stable reference equality
let cachedRaw: string | null = null;
let cachedRecords: CalculationRecord[] = DEFAULT_SAVED_SCENARIOS;

function getRecordsSnapshot(): CalculationRecord[] {
  if (typeof window === 'undefined') return DEFAULT_SAVED_SCENARIOS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      if (cachedRaw !== null) {
        cachedRaw = null;
        cachedRecords = DEFAULT_SAVED_SCENARIOS;
      }
      return cachedRecords;
    }
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      const parsed = JSON.parse(raw);
      cachedRecords = Array.isArray(parsed) ? parsed : DEFAULT_SAVED_SCENARIOS;
    }
    return cachedRecords;
  } catch {
    return DEFAULT_SAVED_SCENARIOS;
  }
}

function getServerSnapshot(): CalculationRecord[] {
  return DEFAULT_SAVED_SCENARIOS;
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener(STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

/**
 * React hook using useSyncExternalStore to guarantee 100% hydration consistency
 * without cascading renders or SSR mismatches.
 */
export function useCalculationRecords(): CalculationRecord[] {
  return useSyncExternalStore(subscribe, getRecordsSnapshot, getServerSnapshot);
}

/**
 * SQLike local repository interface providing structured table operations
 * over browser localStorage with schema safety and error handling.
 */
export const SQLikeCalculationDB = {
  /**
   * SELECT * FROM calculations WHERE ... ORDER BY ... LIMIT ...
   */
  select(options?: QueryOptions): CalculationRecord[] {
    let records: CalculationRecord[];

    if (typeof window === 'undefined') {
      records = [...DEFAULT_SAVED_SCENARIOS];
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          records = [...DEFAULT_SAVED_SCENARIOS];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        } else {
          const parsed = JSON.parse(raw);
          records = Array.isArray(parsed) ? parsed : [...DEFAULT_SAVED_SCENARIOS];
        }
      } catch (e) {
        console.error('Failed to read from localStorage:', e);
        records = [...DEFAULT_SAVED_SCENARIOS];
      }
    }

    // Filter / Search
    if (options?.search) {
      const query = options.search.toLowerCase();
      records = records.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.yield_goal.toString().includes(query) ||
          (r.notes && r.notes.toLowerCase().includes(query))
      );
    }

    // Sort
    const orderBy = options?.orderBy || 'created_at';
    const direction = options?.orderDirection || 'desc';

    records.sort((a, b) => {
      const valA = a[orderBy];
      const valB = b[orderBy];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return direction === 'asc' ? numA - numB : numB - numA;
    });

    if (options?.limit && options.limit > 0) {
      records = records.slice(0, options.limit);
    }

    return records;
  },

  /**
   * SELECT * FROM calculations WHERE id = :id
   */
  findById(id: string): CalculationRecord | null {
    const list = this.select();
    return list.find((item) => item.id === id) || null;
  },

  /**
   * INSERT INTO calculations VALUES (...)
   */
  insert(record: Omit<CalculationRecord, 'id' | 'created_at'> & { id?: string; created_at?: string }): CalculationRecord {
    const records = this.select();
    const newRecord: CalculationRecord = {
      ...record,
      id: record.id || `sc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: record.created_at || new Date().toISOString(),
    };

    const updated = [newRecord, ...records.filter((r) => r.id !== newRecord.id)];
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        cachedRaw = null;
        notifyStorageChange();
      } catch (e) {
        console.error('Failed to persist to localStorage:', e);
      }
    }

    return newRecord;
  },

  /**
   * DELETE FROM calculations WHERE id = :id
   */
  delete(id: string): boolean {
    const records = this.select();
    const updated = records.filter((r) => r.id !== id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        cachedRaw = null;
        notifyStorageChange();
        return true;
      } catch (e) {
        console.error('Failed to delete record from localStorage:', e);
      }
    }
    return false;
  },

  /**
   * TRUNCATE TABLE calculations (or reset to default seed)
   */
  resetToDefaults(): CalculationRecord[] {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SAVED_SCENARIOS));
        cachedRaw = null;
        notifyStorageChange();
      } catch (e) {
        console.error('Failed to reset storage:', e);
      }
    }
    return DEFAULT_SAVED_SCENARIOS;
  },

  /**
   * DELETE FROM calculations
   */
  clear(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        cachedRaw = null;
        notifyStorageChange();
      } catch (e) {
        console.error('Failed to clear storage:', e);
      }
    }
  }
};
