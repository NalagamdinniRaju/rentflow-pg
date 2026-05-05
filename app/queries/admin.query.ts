import { createQuery, createMutation } from 'react-query-kit';
import { supabase, unwrapSupabaseResponse, supabaseUrl } from './utils';
import { queryClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  name: string | null;
  phone: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  email?: string;
}

export interface AdminBuilding {
  name: string;
  location: string | null;
  status: string;
}

export interface StateItem {
  id: string;
  name: string;
}

export interface CityWithState {
  id: string;
  name: string;
  state_id: string;
  state: StateItem | null;
}

// ─── Query Keys ───────────────────────────────────────────────────────────

export const adminKeys = {
  all: ['admins'] as const,
  buildings: (userId: string) => [...adminKeys.all, 'buildings', userId] as const,
};

export const locationKeys = {
  states: ['states'] as const,
  cities: ['cities'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────

/** Fetch all admin users */
export const useAdmins = createQuery<AdminUser[]>({
  queryKey: adminKeys.all,
  fetcher: async () => {
    const response = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'ADMIN')
      .order('created_at', { ascending: false });
    return unwrapSupabaseResponse(response) as AdminUser[];
  },
});

/** Fetch buildings managed by a specific admin (super admin detail view) */
export const useAdminManagedBuildings = createQuery<AdminBuilding[], { userId: string }>({
  queryKey: adminKeys.all,
  fetcher: async (variables) => {
    const response = await supabase
      .from('buildings')
      .select('name, location, status')
      .eq('admin_id', variables.userId);
    return unwrapSupabaseResponse(response) as AdminBuilding[];
  },
});

/** Fetch all states */
export const useStates = createQuery<StateItem[]>({
  queryKey: locationKeys.states,
  fetcher: async () => {
    const response = await supabase.from('states').select('*').order('name');
    return unwrapSupabaseResponse(response) as StateItem[];
  },
});

/** Fetch all cities with state relation */
export const useCitiesWithState = createQuery<CityWithState[]>({
  queryKey: locationKeys.cities,
  fetcher: async () => {
    const response = await supabase.from('cities').select('*, state:states(*)').order('name');
    return unwrapSupabaseResponse(response) as CityWithState[];
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────

interface CreateAdminVariables {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export const useCreateAdmin = createMutation<void, CreateAdminVariables>({
  mutationFn: async (variables) => {
    const resp = await fetch(`${supabaseUrl}/functions/v1/create_admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variables),
    });
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || 'Failed to create admin');
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.all });
  },
});

interface ToggleAdminStatusVariables {
  userId: string;
  currentStatus: string;
}

export const useToggleAdminStatus = createMutation<void, ToggleAdminStatusVariables>({
  mutationFn: async (variables) => {
    const response = await supabase
      .from('user_roles')
      .update({ status: variables.currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })
      .eq('user_id', variables.userId);
    unwrapSupabaseResponse(response);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.all });
  },
});

interface AddStateVariables {
  name: string;
}

export const useAddState = createMutation<void, AddStateVariables>({
  mutationFn: async (variables) => {
    const response = await supabase.from('states').insert({ name: variables.name });
    unwrapSupabaseResponse(response);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: locationKeys.states });
    queryClient.invalidateQueries({ queryKey: locationKeys.cities });
  },
});

interface AddCityVariables {
  name: string;
  state_id: string;
}

export const useAddCity = createMutation<void, AddCityVariables>({
  mutationFn: async (variables) => {
    const response = await supabase.from('cities').insert({
      name: variables.name,
      state_id: variables.state_id,
    });
    unwrapSupabaseResponse(response);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: locationKeys.cities });
  },
});

/** Create building from super admin (with full layout generation) */
interface CreateBuildingFullVariables {
  name: string;
  admin_id: string | null;
  city_id: string;
  line_one: string;
  pincode: string;
  floors: number;
  seats_per_floor: number;
}

export const useCreateBuildingFull = createMutation<void, CreateBuildingFullVariables>({
  mutationFn: async (variables) => {
    // 1. Create Address
    const addrResp = await supabase.from('addresses').insert({
      line_one: variables.line_one,
      pincode: variables.pincode,
      city_id: variables.city_id,
    }).select('id').single();
    const addr = unwrapSupabaseResponse(addrResp);

    // 2. Create Building
    const bldResp = await supabase.from('buildings').insert({
      name: variables.name,
      admin_id: variables.admin_id,
      address_id: addr.id,
      status: 'ACTIVE',
    }).select('id').single();
    const bld = unwrapSupabaseResponse(bldResp);

    // 3. Auto-generate floors/rooms/seats
    for (let i = 1; i <= variables.floors; i++) {
      const floorResp = await supabase.from('floors').insert({
        building_id: bld.id,
        floor_number: i === 0 ? 'Ground Floor' : `Floor ${i}`,
      }).select('id').single();
      const floorData = unwrapSupabaseResponse(floorResp);

      const roomResp = await supabase.from('rooms').insert({
        floor_id: floorData.id,
        room_number: `${i}01`,
        total_seats: variables.seats_per_floor,
      }).select('id').single();
      const roomData = unwrapSupabaseResponse(roomResp);

      const seatsToInsert = Array.from({ length: variables.seats_per_floor }).map((_, idx) => ({
        room_id: roomData.id,
        seat_number: `B${idx + 1}`,
      }));
      await supabase.from('seats').insert(seatsToInsert);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['buildings'] });
  },
});
