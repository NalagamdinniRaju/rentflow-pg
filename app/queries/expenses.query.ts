import { createQuery, createMutation } from 'react-query-kit';
import { supabase, unwrapSupabaseResponse } from './utils';
import { queryClient } from './client';
import type { Database } from '~/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────

type ExpenseRow = Database['public']['Tables']['expenses']['Row'];

export interface ExpenseWithBuilding extends ExpenseRow {
  building: { name: string } | null;
}

// ─── Query Keys ───────────────────────────────────────────────────────────

export const expenseKeys = {
  all: ['expenses'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────

/** Fetch all expenses for admin's buildings */
export const useAdminExpenses = createQuery<ExpenseWithBuilding[], { buildingIds: string[] }>({
  queryKey: expenseKeys.all,
  fetcher: async (variables) => {
    if (variables.buildingIds.length === 0) return [];
    const response = await supabase
      .from('expenses')
      .select('*, building:buildings(name)')
      .in('building_id', variables.buildingIds)
      .order('date', { ascending: false });
    return unwrapSupabaseResponse(response) as ExpenseWithBuilding[];
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────

interface AddExpenseVariables {
  building_id: string;
  type: string;
  amount: number;
  date: string;
  description: string | null;
}

export const useAddExpense = createMutation<void, AddExpenseVariables>({
  mutationFn: async (variables) => {
    const response = await supabase.from('expenses').insert({
      building_id: variables.building_id,
      type: variables.type,
      amount: variables.amount,
      date: variables.date,
      description: variables.description,
    });
    unwrapSupabaseResponse(response);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: expenseKeys.all });
  },
});

// ─── Invalidation helpers ─────────────────────────────────────────────────

export function invalidateExpenses() {
  queryClient.invalidateQueries({ queryKey: expenseKeys.all });
}
