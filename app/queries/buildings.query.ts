import { createQuery, createMutation } from 'react-query-kit';
import { supabase, unwrapSupabaseResponse } from './utils';
import { queryClient } from './client';
import type { Database } from '~/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────

type BuildingRow = Database['public']['Tables']['buildings']['Row'];

export interface BuildingWithAddress extends BuildingRow {
  address: {
    id: string;
    line_one: string;
    line_two: string | null;
    pincode: string | null;
    city_id: string;
    city: { name: string } | null;
  } | null;
}

export interface BuildingWithFullAddress extends BuildingRow {
  address: {
    id: string;
    line_one: string;
    line_two: string | null;
    pincode: string | null;
    city_id: string;
    city: { name: string; state: { name: string } | null } | null;
  } | null;
  admin: { name: string } | null;
}

export interface BuildingBasic {
  id: string;
  name: string;
  monthly_rent?: number;
  daily_rent?: number;
  deposit_amount?: number;
}

export interface CityBasic {
  id: string;
  name: string;
  state?: { name: string } | null;
}

// ─── Query Keys ───────────────────────────────────────────────────────────

export const buildingKeys = {
  all: ['buildings'] as const,
  byAdmin: (adminId: string) => [...buildingKeys.all, 'admin', adminId] as const,
  byId: (id: string) => [...buildingKeys.all, id] as const,
  ids: (adminId: string) => [...buildingKeys.all, 'ids', adminId] as const,
  cities: ['buildings', 'cities'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────

/** Fetch buildings managed by a specific admin (with address + city) */
export const useAdminBuildings = createQuery<BuildingWithAddress[], { adminId: string }>({
  queryKey: buildingKeys.all,
  fetcher: async (variables) => {
    const response = await supabase
      .from('buildings')
      .select('*, address:addresses(*, city:cities(name))')
      .eq('admin_id', variables.adminId);
    return unwrapSupabaseResponse(response) as BuildingWithAddress[];
  },
});

/** Fetch building IDs for an admin (lightweight, for dependent queries) */
export const useAdminBuildingIds = createQuery<string[], { adminId: string }>({
  queryKey: buildingKeys.all,
  fetcher: async (variables) => {
    const response = await supabase
      .from('buildings')
      .select('id')
      .eq('admin_id', variables.adminId);
    const data = unwrapSupabaseResponse(response) as { id: string }[];
    return data.map((b) => b.id);
  },
});

/** Fetch admin buildings with basic info (id, name, rents) */
export const useAdminBuildingsBasic = createQuery<BuildingBasic[], { adminId: string }>({
  queryKey: buildingKeys.all,
  fetcher: async (variables) => {
    const response = await supabase
      .from('buildings')
      .select('id, name, monthly_rent, daily_rent, deposit_amount')
      .eq('admin_id', variables.adminId);
    return unwrapSupabaseResponse(response) as BuildingBasic[];
  },
});

/** Fetch all buildings (super admin view - with full address + admin) */
export const useAllBuildings = createQuery<BuildingWithFullAddress[]>({
  queryKey: buildingKeys.all,
  fetcher: async () => {
    const response = await supabase
      .from('buildings')
      .select('*, address:addresses(*, city:cities(name, state:states(name))), admin:user_roles(name)')
      .order('created_at', { ascending: false });
    return unwrapSupabaseResponse(response) as BuildingWithFullAddress[];
  },
});

/** Fetch a single building by ID (with full nested relations) */
export const useBuildingById = createQuery<BuildingWithAddress, { buildingId: string }>({
  queryKey: buildingKeys.all,
  fetcher: async (variables) => {
    const response = await supabase
      .from('buildings')
      .select('*, address:addresses(*, city:cities(name))')
      .eq('id', variables.buildingId)
      .single();
    return unwrapSupabaseResponse(response) as BuildingWithAddress;
  },
});

/** Fetch all cities with state info (used in dropdowns) */
export const useCities = createQuery<CityBasic[]>({
  queryKey: buildingKeys.cities,
  fetcher: async () => {
    const response = await supabase
      .from('cities')
      .select('id, name, state:states(name)')
      .order('name');
    return unwrapSupabaseResponse(response) as unknown as CityBasic[];
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────

interface AddBuildingVariables {
  name: string;
  line_one: string;
  city_id: string;
  pincode?: string;
  admin_id: string | null;
  floors: number;
  seats_per_floor: number;
}

/** Create a new building with auto-generated layout (floors, single room per floor, seats) */
export const useAddBuilding = createMutation<void, AddBuildingVariables>({
  mutationFn: async (variables) => {
    // 1. Create address
    const addrResp = await supabase.from('addresses').insert({
      line_one: variables.line_one,
      city_id: variables.city_id,
      pincode: variables.pincode || '000000',
    }).select('id').single();
    const addr = unwrapSupabaseResponse(addrResp);

    // 2. Create building
    const bldgResp = await supabase.from('buildings').insert({
      name: variables.name,
      address_id: addr.id,
      admin_id: variables.admin_id,
      status: 'ACTIVE',
    }).select('id').single();
    const bldg = unwrapSupabaseResponse(bldgResp);

    // 3. Auto-generate layout
    for (let i = 1; i <= variables.floors; i++) {
      const floorResp = await supabase.from('floors').insert({
        building_id: bldg.id,
        floor_number: i === 0 ? 'Ground Floor' : `Floor ${i}`,
      }).select('id').single();
      const floor = unwrapSupabaseResponse(floorResp);

      const roomResp = await supabase.from('rooms').insert({
        floor_id: floor.id,
        room_number: `${i}01`,
        total_seats: variables.seats_per_floor,
      }).select('id').single();
      const room = unwrapSupabaseResponse(roomResp);

      const seats = Array.from({ length: variables.seats_per_floor }).map((_, sIdx) => ({
        room_id: room.id,
        seat_number: `B${sIdx + 1}`,
      }));
      await supabase.from('seats').insert(seats);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: buildingKeys.all });
  },
});

interface UpdateBuildingSettingsVariables {
  buildingId: string;
  monthly_rent: number;
  daily_rent: number;
  deposit_amount: number;
}

/** Update building rental settings */
export const useUpdateBuildingSettings = createMutation<void, UpdateBuildingSettingsVariables>({
  mutationFn: async (variables) => {
    const response = await supabase.from('buildings').update({
      monthly_rent: variables.monthly_rent,
      daily_rent: variables.daily_rent,
      deposit_amount: variables.deposit_amount,
    }).eq('id', variables.buildingId);
    unwrapSupabaseResponse(response);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: buildingKeys.all });
  },
});

interface UpdateBuildingVariables {
  buildingId: string;
  name: string;
  admin_id: string | null;
  status: string;
}

/** Update building details (name, admin, status) - super admin */
export const useUpdateBuilding = createMutation<void, UpdateBuildingVariables>({
  mutationFn: async (variables) => {
    const response = await supabase.from('buildings').update({
      name: variables.name,
      admin_id: variables.admin_id,
      status: variables.status,
    }).eq('id', variables.buildingId);
    unwrapSupabaseResponse(response);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: buildingKeys.all });
  },
});

export const useBuildingLayout = createQuery<any[], { buildingId: string }>({
  queryKey: buildingKeys.all,
  fetcher: async (variables) => {
    const response = await supabase
      .from('floors')
      .select('*, rooms(*, seats(*))')
      .eq('building_id', variables.buildingId)
      .order('floor_number', { ascending: true });
    return unwrapSupabaseResponse(response) as any[];
  },
});

interface AddFloorVariables {
  buildingId: string;
  floorNumber: string;
}

export const useAddFloor = createMutation<void, AddFloorVariables>({
  mutationFn: async (variables) => {
    const response = await supabase.from('floors').insert({
      building_id: variables.buildingId,
      floor_number: variables.floorNumber,
    });
    unwrapSupabaseResponse(response);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: buildingKeys.all });
  },
});

interface AddRoomVariables {
  floorId: string;
  roomNumber: string;
  totalSeats: number;
}

export const useAddRoom = createMutation<void, AddRoomVariables>({
  mutationFn: async (variables) => {
    // 1. Create Room
    const roomResp = await supabase.from('rooms').insert({
      floor_id: variables.floorId,
      room_number: variables.roomNumber,
      total_seats: variables.totalSeats,
    }).select('id').single();
    
    const room = unwrapSupabaseResponse(roomResp);

    // 2. Create Seats
    const seats = Array.from({ length: variables.totalSeats }).map((_, i) => ({
      room_id: room.id,
      seat_number: `B${i + 1}`,
    }));
    const seatsResp = await supabase.from('seats').insert(seats);
    unwrapSupabaseResponse(seatsResp);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: buildingKeys.all });
  },
});

// ─── Invalidation helpers ─────────────────────────────────────────────────

export function invalidateBuildings() {
  queryClient.invalidateQueries({ queryKey: buildingKeys.all });
}
