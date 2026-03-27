import { createQuery, createMutation } from 'react-query-kit';
import { supabase, unwrapSupabaseResponse } from './utils';
import { queryClient } from './client';
import type { Database } from '~/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────

type ResidentRow = Database['public']['Tables']['residents']['Row'];

export interface ResidentWithRelations extends ResidentRow {
  building: { name: string } | null;
  floor: { floor_number: string } | null;
  room: { room_number: string } | null;
  seat: { seat_number: string } | null;
}

export interface ResidentFull extends ResidentRow {
  building: {
    name: string;
    address: {
      line_one: string;
      line_two: string | null;
      city: { name: string; id: string } | null;
    } | null;
  } | null;
  floor: { floor_number: string } | null;
  room: { room_number: string } | null;
  seat: { seat_number: string; status: string } | null;
}

export interface ResidentBasicInfo {
  id: string;
  name: string;
  phone: string;
  room: { room_number: string } | null;
}

// ─── Query Keys ───────────────────────────────────────────────────────────

export const residentKeys = {
  all: ['residents'] as const,
  byBuildings: (buildingIds: string[]) => [...residentKeys.all, 'buildings', ...buildingIds] as const,
  byId: (id: string) => [...residentKeys.all, id] as const,
  byUserId: (userId: string) => [...residentKeys.all, 'user', userId] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────

/** Fetch all residents across admin's buildings */
export const useAdminResidents = createQuery<ResidentWithRelations[], { buildingIds: string[] }>({
  queryKey: residentKeys.all,
  fetcher: async (variables) => {
    if (variables.buildingIds.length === 0) return [];
    const response = await supabase
      .from('residents')
      .select(`
        *,
        building:buildings(name),
        floor:floors(floor_number),
        room:rooms(room_number),
        seat:seats(seat_number)
      `)
      .in('building_id', variables.buildingIds)
      .order('created_at', { ascending: false });
    return unwrapSupabaseResponse(response) as ResidentWithRelations[];
  },
});

/** Fetch a single resident by ID with full relations */
export const useResidentById = createQuery<ResidentFull, { residentId: string }>({
  queryKey: residentKeys.all,
  fetcher: async (variables) => {
    const response = await supabase
      .from('residents')
      .select(`
        *,
        building:buildings(*, address:addresses(*, city:cities(*))),
        floor:floors(*),
        room:rooms(*),
        seat:seats(*)
      `)
      .eq('id', variables.residentId)
      .single();
    return unwrapSupabaseResponse(response) as ResidentFull;
  },
});

/** Fetch resident for resident's own view (by user_id) */
export const useMyResident = createQuery<any | null, { userId: string }>({
  queryKey: residentKeys.all,
  fetcher: async (variables) => {
    const response = await supabase
      .from('residents')
      .select('*, floor:floors(floor_number), room:rooms(room_number), seat:seats(seat_number), building:buildings(*, address:addresses(*, city:cities(*)))')
      .eq('user_id', variables.userId)
      .maybeSingle();
    if (response.error) throw response.error;
    return response.data;
  },
});

/** Fetch resident for edit page */
export const useResidentForEdit = createQuery<
  ResidentWithRelations & { building: { name: string } | null },
  { residentId: string }
>({
  queryKey: residentKeys.all,
  fetcher: async (variables) => {
    const response = await supabase
      .from('residents')
      .select('*, building:buildings(name), room:rooms(room_number), seat:seats(seat_number)')
      .eq('id', variables.residentId)
      .single();
    return unwrapSupabaseResponse(response);
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────

interface AddResidentVariables {
  name: string;
  phone: string;
  email: string | null;
  building_id: string;
  floor_id: string;
  room_id: string;
  seat_id: string;
  stay_type: 'MONTHLY' | 'DAILY';
  monthly_rent: number | null;
  daily_rent: number | null;
  deposit_amount: number | null;
}

export const useAddResident = createMutation<void, AddResidentVariables>({
  mutationFn: async (variables) => {
    const insertResp = await supabase.from('residents').insert({
      name: variables.name,
      phone: variables.phone,
      email: variables.email,
      building_id: variables.building_id,
      floor_id: variables.floor_id,
      room_id: variables.room_id,
      seat_id: variables.seat_id,
      stay_type: variables.stay_type,
      monthly_rent: variables.stay_type === 'MONTHLY' ? variables.monthly_rent : null,
      daily_rent: variables.stay_type === 'DAILY' ? variables.daily_rent : null,
      deposit_amount: variables.deposit_amount,
      status: 'ACTIVE',
      join_date: new Date().toISOString(),
    }).select('id').single();
    unwrapSupabaseResponse(insertResp);

    // Mark seat as occupied
    await supabase.from('seats').update({ status: 'OCCUPIED' }).eq('id', variables.seat_id);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: residentKeys.all });
  },
});

interface UpdateResidentVariables {
  residentId: string;
  data: {
    name: string;
    phone: string;
    email: string;
    status: string;
    stay_type: string;
    monthly_rent: number;
    daily_rent: number;
    deposit_amount: number;
  };
  seatId?: string;
}

export const useUpdateResident = createMutation<void, UpdateResidentVariables>({
  mutationFn: async (variables) => {
    const response = await supabase.from('residents').update({
      ...variables.data,
      updated_at: new Date().toISOString(),
    }).eq('id', variables.residentId);
    unwrapSupabaseResponse(response);

    // Free seat if vacated
    if (variables.data.status === 'VACATED' && variables.seatId) {
      await supabase.from('seats').update({ status: 'AVAILABLE' }).eq('id', variables.seatId);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: residentKeys.all });
  },
});

interface UpdateResidentStatusVariables {
  residentId: string;
  status: 'ACTIVE' | 'REJECTED' | 'VACATED';
}

export const useUpdateResidentStatus = createMutation<void, UpdateResidentStatusVariables>({
  mutationFn: async (variables) => {
    const response = await supabase
      .from('residents')
      .update({ status: variables.status })
      .eq('id', variables.residentId);
    unwrapSupabaseResponse(response);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: residentKeys.all });
  },
});

interface UploadResidentDocumentVariables {
  residentId: string;
  field: 'photo' | 'aadhar_photo';
  file: File;
}

export const useUploadResidentDocument = createMutation<void, UploadResidentDocumentVariables>({
  mutationFn: async (variables) => {
    const fileExt = variables.file.name.split('.').pop();
    const filePath = `documents/${variables.residentId}/${variables.field}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('resident-documents')
      .upload(filePath, variables.file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('resident-documents')
      .getPublicUrl(filePath);

    const updateResp = await supabase
      .from('residents')
      .update({ [variables.field]: publicUrl })
      .eq('id', variables.residentId);
    unwrapSupabaseResponse(updateResp);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: residentKeys.all });
  },
});

interface UpdateEmergencyContactVariables {
  residentId: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

export const useUpdateEmergencyContact = createMutation<void, UpdateEmergencyContactVariables>({
  mutationFn: async (variables) => {
    const response = await supabase
      .from('residents')
      .update({
        emergency_contact_name: variables.emergency_contact_name,
        emergency_contact_phone: variables.emergency_contact_phone,
      })
      .eq('id', variables.residentId);
    unwrapSupabaseResponse(response);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: residentKeys.all });
  },
});

// ─── Invalidation helpers ─────────────────────────────────────────────────

export function invalidateResidents() {
  queryClient.invalidateQueries({ queryKey: residentKeys.all });
}
