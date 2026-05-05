import { createQuery, createMutation } from 'react-query-kit';
import { supabase, unwrapSupabaseResponse } from './utils';
import { queryClient } from './client';

export const locationKeys = {
  all: ['locations'] as const,
  states: ['locations', 'states'] as const,
  cities: ['locations', 'cities'] as const,
};

export const useStates = createQuery<any[]>({
  queryKey: locationKeys.states,
  fetcher: async () => {
    const response = await supabase.from('states').select('*').order('name');
    return unwrapSupabaseResponse(response) || [];
  },
});

export const useLocationCities = createQuery<any[]>({
  queryKey: locationKeys.cities,
  fetcher: async () => {
    const response = await supabase.from('cities').select('*, state:states(*)').order('name');
    return unwrapSupabaseResponse(response) || [];
  },
});

export const useCreateState = createMutation<void, { name: string }>({
  mutationFn: async (variables) => {
    const response = await supabase.from('states').insert({ name: variables.name });
    unwrapSupabaseResponse(response);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: locationKeys.states });
  },
});

export const useCreateCity = createMutation<void, { name: string; state_id: string }>({
  mutationFn: async (variables) => {
    const response = await supabase.from('cities').insert({ name: variables.name, state_id: variables.state_id });
    unwrapSupabaseResponse(response);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: locationKeys.cities });
  },
});
