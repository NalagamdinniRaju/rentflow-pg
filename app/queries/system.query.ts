import { createQuery, createMutation } from 'react-query-kit';
import { supabase, unwrapSupabaseResponse } from './utils';
import { queryClient } from './client';
import type { Database } from '~/lib/supabase';

type SystemSettingsRow = Database['public']['Tables']['system_settings']['Row'];

export const systemKeys = {
  settings: ['system', 'settings'] as const,
};

/** Fetch global system settings */
export const useSystemSettings = createQuery<SystemSettingsRow>({
  queryKey: systemKeys.settings,
  fetcher: async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .maybeSingle();
    
    if (error) throw error;
    return data as SystemSettingsRow;
  },
});

interface UpdateSystemSettingsVariables {
  upi_id?: string | null;
  upi_name?: string | null;
  qr_code_url?: string | null;
  reminder_days?: number;
}

/** Update global system settings */
export const useUpdateSystemSettings = createMutation<void, UpdateSystemSettingsVariables>({
  mutationFn: async (variables) => {
    // Check if a record exists first
    const { data: existing } = await supabase.from('system_settings').select('id').maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('system_settings')
        .update(variables)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      // Create first record with default values + variables
      const { error } = await supabase
        .from('system_settings')
        .insert([variables]);
      if (error) throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: systemKeys.settings });
  },
});
