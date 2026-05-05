import { createQuery, createMutation } from 'react-query-kit';
import { supabase, unwrapSupabaseResponse } from './utils';

export const roomTypeKeys = {
  all: ['room-types'] as const,
  sharingTypes: ['sharing-types'] as const,
};

// --- Room Types Queries & Mutations ---

export const useRoomTypes = createQuery<{ id: string; name: string }[]>({
  queryKey: roomTypeKeys.all,
  fetcher: async () => {
    const response = await supabase.from('room_types').select('*').order('name');
    return unwrapSupabaseResponse(response) as { id: string; name: string }[];
  },
});

export const useCreateRoomType = createMutation<void, { name: string }>({
  mutationFn: async (variables) => {
    const response = await supabase.from('room_types').insert({ name: variables.name });
    unwrapSupabaseResponse(response);
  },
});

export const useDeleteRoomType = createMutation<void, { id: string }>({
  mutationFn: async (variables) => {
    const response = await supabase.from('room_types').delete().eq('id', variables.id);
    unwrapSupabaseResponse(response);
  },
});

// --- Sharing Types Queries & Mutations ---

export const useSharingTypes = createQuery<{ id: string; name: string; capacity: number }[]>({
  queryKey: roomTypeKeys.sharingTypes,
  fetcher: async () => {
    const response = await supabase.from('sharing_types').select('*').order('capacity');
    return unwrapSupabaseResponse(response) as { id: string; name: string; capacity: number }[];
  },
});

export const useCreateSharingType = createMutation<void, { name: string; capacity: number }>({
  mutationFn: async (variables) => {
    const response = await supabase.from('sharing_types').insert({ 
      name: variables.name, 
      capacity: variables.capacity 
    });
    unwrapSupabaseResponse(response);
  },
});

export const useDeleteSharingType = createMutation<void, { id: string }>({
  mutationFn: async (variables) => {
    const response = await supabase.from('sharing_types').delete().eq('id', variables.id);
    unwrapSupabaseResponse(response);
  },
});
