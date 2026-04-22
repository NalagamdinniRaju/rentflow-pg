import { createQuery, createMutation } from 'react-query-kit';
import { supabase, unwrapSupabaseResponse } from './utils';
import { queryClient } from './client';
import { compareFloorLabels, compareRoomLabels } from '~/lib/utils';
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
  byAdmin: (adminId: string) => ['buildings', 'admin', adminId] as const,
  byId: (id: string) => ['buildings', 'detail', id] as const,
  ids: (adminId: string) => ['buildings', 'ids', adminId] as const,
  cities: ['buildings', 'cities'] as const,
  layout: (buildingId: string) => ['buildings', 'layout', buildingId] as const,
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
  queryKey: buildingKeys.ids(''),
  staleTime: 0,
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

/** Fetch cities with state info (used in dropdowns, supports search) */
export const useCities = createQuery<CityBasic[], { searchTerm?: string } | void>({
  queryKey: ['cities'],
  fetcher: async (variables) => {
    const term = variables?.searchTerm || '';
    console.log('[useCities] fetcher started. Term:', term);
    
    let query = supabase
      .from('cities')
      .select('id, name, state:states(name)')
      .order('name');
    
    if (term) {
      query = query.ilike('name', `%${term}%`);
    }

    const { data, error } = await query.limit(100);
    
    if (error) {
      console.error('[useCities] Supabase error:', error);
      throw error;
    }

    console.log(`[useCities] Found ${data?.length || 0} cities for "${term}"`);
    return data as unknown as CityBasic[];
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────

interface AddBuildingVariables {
  name: string;
  line_one: string;
  city_id: string;
  pincode?: string;
  admin_id: string | null;
  monthly_rent?: number;
  daily_rent?: number;
  deposit_amount?: number;
}

/** Create a new building with default rent settings */
export const useAddBuilding = createMutation<void, AddBuildingVariables>({
  mutationFn: async (variables) => {
    // 1. Create address
    const addrResp = await supabase.from('addresses').insert({
      line_one: variables.line_one,
      city_id: variables.city_id,
      pincode: variables.pincode || '000000',
    }).select('id').single();
    const addr = unwrapSupabaseResponse(addrResp);

    // 2. Create building with rent defaults
    const bldgResp = await supabase.from('buildings').insert({
      name: variables.name,
      address_id: addr.id,
      admin_id: variables.admin_id,
      status: 'ACTIVE',
      monthly_rent: variables.monthly_rent || null,
      daily_rent: variables.daily_rent || null,
      deposit_amount: variables.deposit_amount || null,
    }).select('id').single();
    unwrapSupabaseResponse(bldgResp);
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
  upi_id?: string | null;
  upi_name?: string | null;
  qr_code_url?: string | null;
  monthly_rent?: number | null;
  daily_rent?: number | null;
  deposit_amount?: number | null;
}

/** Update building details (name, admin, status) - super admin */
export const useUpdateBuilding = createMutation<void, UpdateBuildingVariables>({
  mutationFn: async (variables) => {
    const response = await supabase.from('buildings').update({
      name: variables.name,
      admin_id: variables.admin_id,
      status: variables.status,
      upi_id: variables.upi_id,
      upi_name: variables.upi_name,
      qr_code_url: variables.qr_code_url,
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

export const useBuildingLayout = createQuery<any[], { buildingId: string }>({
  queryKey: buildingKeys.layout(''),
  fetcher: async (variables) => {
    const response = await supabase
      .from('floors')
      .select('*, rooms(*, room_types(*), sharing_types(*), seats(*), custom_monthly_rent, custom_daily_rent, custom_deposit_amount)')
      .eq('building_id', variables.buildingId)
      .order('floor_number', { ascending: true });
    const data = unwrapSupabaseResponse(response);
    if (!Array.isArray(data)) return [];
    return data
      .sort((a: any, b: any) => compareFloorLabels(a.floor_number, b.floor_number))
      .map((floor: any) => ({
        ...floor,
        rooms: Array.isArray(floor.rooms)
          ? [...floor.rooms].sort((a: any, b: any) => compareRoomLabels(a.room_number, b.room_number))
          : floor.rooms,
      }));
  },
});

export interface FlatConfig {
  flatNumber: string;
  beds: number;
  useCustomRent: boolean;
  customMonthlyRent?: number;
  customDailyRent?: number;
  customDepositAmount?: number;
  roomTypeId?: string;
  sharingTypeId?: string;
}

interface AddFloorVariables {
  buildingId: string;
  floorNumber: string;
  flats: FlatConfig[];
}

export const useAddFloor = createMutation<void, AddFloorVariables>({
  mutationFn: async (variables) => {
    // 1. Create floor
    const floorResp = await supabase.from('floors').insert({
      building_id: variables.buildingId,
      floor_number: variables.floorNumber,
    }).select('id').single();
    const floor = unwrapSupabaseResponse(floorResp);

    // 2. Create each flat with its own config
    for (const flat of variables.flats) {
      const roomResp = await supabase.from('rooms').insert({
        floor_id: floor.id,
        room_number: flat.flatNumber,
        total_seats: flat.beds,
        room_type_id: flat.roomTypeId && flat.roomTypeId !== 'none' ? flat.roomTypeId : null,
        sharing_type_id: flat.sharingTypeId && flat.sharingTypeId !== 'none' ? flat.sharingTypeId : null,
        custom_monthly_rent: flat.useCustomRent && flat.customMonthlyRent ? flat.customMonthlyRent : null,
        custom_daily_rent: flat.useCustomRent && flat.customDailyRent ? flat.customDailyRent : null,
        custom_deposit_amount: flat.useCustomRent && flat.customDepositAmount ? flat.customDepositAmount : null,
      }).select('id').single();
      const room = unwrapSupabaseResponse(roomResp);

      if (flat.beds > 0) {
        const seats = Array.from({ length: flat.beds }).map((_, sIdx) => ({
          room_id: room.id,
          seat_number: `B${sIdx + 1}`,
          status: 'AVAILABLE'
        }));
        await supabase.from('seats').insert(seats);
      }
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: buildingKeys.all });
  },
});

interface AddRoomVariables {
  floorId: string;
  roomNumber: string;
  totalSeats: number;
  roomTypeId?: string;
  sharingTypeId?: string;
  customMonthlyRent?: number;
  customDailyRent?: number;
  customDepositAmount?: number;
}

export const useAddRoom = createMutation<void, AddRoomVariables>({
  mutationFn: async (variables) => {
    // 1. Get sharing type capacity if provided
    let capacity = variables.totalSeats;
    if (variables.sharingTypeId && variables.sharingTypeId !== 'none') {
      const { data: st } = await supabase.from('sharing_types').select('capacity').eq('id', variables.sharingTypeId).single();
      if (st) capacity = st.capacity;
    }

    // 2. Create Flat
    const roomResp = await supabase.from('rooms').insert({
      floor_id: variables.floorId,
      room_number: variables.roomNumber,
      total_seats: capacity,
      room_type_id: variables.roomTypeId === 'none' ? null : variables.roomTypeId,
      sharing_type_id: variables.sharingTypeId === 'none' ? null : variables.sharingTypeId,
      custom_monthly_rent: variables.customMonthlyRent || null,
      custom_daily_rent: variables.customDailyRent || null,
      custom_deposit_amount: variables.customDepositAmount || null,
    }).select('id').single();
    
    const room = unwrapSupabaseResponse(roomResp);

    // 3. Create Seats
    const seats = Array.from({ length: capacity }).map((_, i) => ({
      room_id: room.id,
      seat_number: `B${i + 1}`,
      status: 'AVAILABLE'
    }));
    const seatsResp = await supabase.from('seats').insert(seats);
    unwrapSupabaseResponse(seatsResp);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: buildingKeys.all });
  },
});

interface UpdateRoomVariables {
  roomId: string;
  roomNumber?: string;
  totalSeats?: number;
  roomTypeId?: string;
  sharingTypeId?: string;
  customMonthlyRent?: number | null;
  customDailyRent?: number | null;
  customDepositAmount?: number | null;
}

export const useUpdateRoom = createMutation<void, UpdateRoomVariables>({
  mutationFn: async (variables) => {
    const { roomId, roomNumber, roomTypeId, sharingTypeId } = variables;
    
    // 1. Fetch current room state including sharing type
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('*, seats(*)')
      .eq('id', roomId)
      .single();
    
    if (roomErr || !room) throw new Error("Flat not found");

    const updateData: any = {};
    if (roomNumber) {
      // Check for duplicate room number on the same floor
      const { data: dup } = await supabase.from('rooms').select('id').eq('floor_id', room.floor_id).eq('room_number', roomNumber).neq('id', roomId).maybeSingle();
      if (dup) throw new Error(`Flat number ${roomNumber} already exists on this floor`);
      updateData.room_number = roomNumber;
    }
    
    if (roomTypeId !== undefined) updateData.room_type_id = roomTypeId === 'none' ? null : roomTypeId;
    
    if (variables.totalSeats !== undefined && variables.totalSeats !== room.total_seats) {
      const newCap = variables.totalSeats;
      const currentSeats = room.seats || [];
      const currentCount = currentSeats.length;

      if (newCap > currentCount) {
        const toAdd = newCap - currentCount;
        const newSeats = Array.from({ length: toAdd }).map((_, i) => ({
          room_id: roomId,
          seat_number: `B${currentCount + i + 1}`,
          status: 'AVAILABLE'
        }));
        await supabase.from('seats').insert(newSeats);
      } else if (newCap < currentCount) {
        const toRemove = currentSeats
          .sort((a: any, b: any) => {
            const aNum = parseInt(a.seat_number.replace(/\D/g, '')) || 0;
            const bNum = parseInt(b.seat_number.replace(/\D/g, '')) || 0;
            return bNum - aNum;
          })
          .slice(0, currentCount - newCap);

        const occupied = toRemove.find((s: any) => s.status === 'OCCUPIED');
        if (occupied) {
          throw new Error(`Cannot reduce capacity: Bed ${occupied.seat_number} is occupied`);
        }

        await supabase.from('seats').delete().in('id', toRemove.map((s: any) => s.id));
      }
      updateData.total_seats = newCap;
    }

    if (sharingTypeId !== undefined && sharingTypeId !== room.sharing_type_id) {
      updateData.sharing_type_id = sharingTypeId === 'none' ? null : sharingTypeId;
      
      // Handle capacity change
      if (sharingTypeId !== 'none') {
        const { data: st } = await supabase.from('sharing_types').select('capacity').eq('id', sharingTypeId).single();
        if (st) {
          const newCap = st.capacity;
          const currentSeats = room.seats || [];
          const currentCount = currentSeats.length;
          
          if (newCap > currentCount) {
             // Add seats
             const toAdd = newCap - currentCount;
             const newSeats = Array.from({ length: toAdd }).map((_, i) => ({
               room_id: roomId,
               seat_number: `B${currentCount + i + 1}`,
               status: 'AVAILABLE'
             }));
             await supabase.from('seats').insert(newSeats);
          } else if (newCap < currentCount) {
             // Remove extra seats (last ones first)
             const toRemove = currentSeats
               .slice(newCap)
               .sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''));
             
             // Check if any toremove is occupied
             const occupied = toRemove.find((s: any) => s.status === 'OCCUPIED');
             if (occupied) {
                throw new Error(`Cannot reduce capacity: Bed ${occupied.seat_number} is occupied`);
             }
             
             await supabase.from('seats').delete().in('id', toRemove.map((s: any) => s.id));
          }
          updateData.total_seats = newCap;
        }
      }
    }

    // Handle per-flat rent and deposit
    if (variables.customMonthlyRent !== undefined) {
      updateData.custom_monthly_rent = variables.customMonthlyRent;
    }
    if (variables.customDailyRent !== undefined) {
      updateData.custom_daily_rent = variables.customDailyRent;
    }
    if (variables.customDepositAmount !== undefined) {
      updateData.custom_deposit_amount = variables.customDepositAmount;
    }
    
    const response = await supabase.from('rooms').update(updateData).eq('id', roomId);
    unwrapSupabaseResponse(response);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: buildingKeys.all });
  },
});

export const useDeleteRoom = createMutation<void, { roomId: string }>({
  mutationFn: async ({ roomId }) => {
    // 1. Fetch all seats in this room
    const { data: seats } = await supabase.from('seats').select('id, status').eq('room_id', roomId);
    if (!seats) return;

    const seatIds = seats.map(s => s.id);

    // 2. Unassign residents from these seats and set status to PENDING
    // We update residents where seat_id is in our list
    const { error: resErr } = await supabase
      .from('residents')
      .update({ 
        seat_id: null, 
        room_id: null, 
        floor_id: null,
        status: 'PENDING' 
      })
      .in('seat_id', seatIds);
    
    if (resErr) {
      console.error("Error unassigning residents:", resErr);
      throw new Error("Failed to unassign residents before flat deletion");
    }

    // 3. Delete all seats
    const { error: seatDelErr } = await supabase.from('seats').delete().in('room_id', [roomId]);
    if (seatDelErr) throw seatDelErr;

    // 4. Delete the room
    const { error: roomDelErr } = await supabase.from('rooms').delete().eq('id', roomId);
    if (roomDelErr) throw roomDelErr;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: buildingKeys.all });
  },
});

export const useBulkDeleteSeats = createMutation<void, { roomId: string, seatIds: string[] }>({
  mutationFn: async ({ roomId, seatIds }) => {
    // 1. Double check occupancy for safety
    const { data: seats } = await supabase.from('seats').select('status, seat_number').in('id', seatIds);
    const occupied = seats?.find(s => s.status === 'OCCUPIED');
    if (occupied) {
      throw new Error(`Cannot delete: Bed ${occupied.seat_number} is occupied`);
    }

    // 2. Delete seats
    const { error: delErr } = await supabase.from('seats').delete().in('id', seatIds);
    if (delErr) throw delErr;

    // 3. Update room total_seats count
    const { data: remainingSeats } = await supabase.from('seats').select('id').eq('room_id', roomId);
    const { error: updErr } = await supabase.from('rooms').update({ total_seats: remainingSeats?.length || 0 }).eq('id', roomId);
    if (updErr) throw updErr;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: buildingKeys.all });
  },
});

export const useUpdateBed = createMutation<void, { id: string; seat_number: string }>({
  mutationFn: async ({ id, seat_number }) => {
    const res = await supabase.from('seats').update({ seat_number }).eq('id', id);
    unwrapSupabaseResponse(res);
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: buildingKeys.all })
});

export const useDeleteBed = createMutation<void, string>({
  mutationFn: async (id) => {
    // Check occupancy
    const { data: seat } = await supabase.from('seats').select('status, seat_number').eq('id', id).single();
    if (seat?.status === 'OCCUPIED') {
      throw new Error(`Cannot delete bed ${seat.seat_number} as it is assigned to a resident`);
    }
    
    const res = await supabase.from('seats').delete().eq('id', id);
    unwrapSupabaseResponse(res);
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: buildingKeys.all })
});

// ─── Address Update ───────────────────────────────────────────────────────

interface UpdateAddressVariables {
  addressId: string;
  line_one?: string;
  line_two?: string;
  city_id?: string;
  pincode?: string;
}

export const useUpdateAddress = createMutation<void, UpdateAddressVariables>({
  mutationFn: async (variables) => {
    const { addressId, ...updates } = variables;
    const cleanUpdates: any = {};
    if (updates.line_one !== undefined) cleanUpdates.line_one = updates.line_one;
    if (updates.line_two !== undefined) cleanUpdates.line_two = updates.line_two;
    if (updates.city_id !== undefined) cleanUpdates.city_id = updates.city_id;
    if (updates.pincode !== undefined) cleanUpdates.pincode = updates.pincode;

    const response = await supabase.from('addresses').update(cleanUpdates).eq('id', addressId);
    unwrapSupabaseResponse(response);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: buildingKeys.all });
  },
});

// ─── Floor Update ─────────────────────────────────────────────────────────

interface UpdateFloorVariables {
  floorId: string;
  floorNumber: string;
}

export const useUpdateFloor = createMutation<void, UpdateFloorVariables>({
  mutationFn: async (variables) => {
    const response = await supabase
      .from('floors')
      .update({ floor_number: variables.floorNumber })
      .eq('id', variables.floorId);
    unwrapSupabaseResponse(response);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: buildingKeys.all });
  },
});

// ─── Add Seat to Existing Room ────────────────────────────────────────────

interface AddSeatVariables {
  roomId: string;
  seatNumber: string;
}

export const useAddSeat = createMutation<void, AddSeatVariables>({
  mutationFn: async (variables) => {
    // Check for duplicate seat number in the same room
    const { data: dup } = await supabase
      .from('seats')
      .select('id')
      .eq('room_id', variables.roomId)
      .eq('seat_number', variables.seatNumber)
      .maybeSingle();
    if (dup) throw new Error(`Seat ${variables.seatNumber} already exists in this flat`);

    const response = await supabase.from('seats').insert({
      room_id: variables.roomId,
      seat_number: variables.seatNumber,
      status: 'AVAILABLE',
    });
    unwrapSupabaseResponse(response);

    // Update room total_seats count
    const { data: seatsCount } = await supabase
      .from('seats')
      .select('id', { count: 'exact' })
      .eq('room_id', variables.roomId);
    
    await supabase
      .from('rooms')
      .update({ total_seats: seatsCount?.length || 0 })
      .eq('id', variables.roomId);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: buildingKeys.all });
  },
});

// ─── Invalidation helpers ─────────────────────────────────────────────────

export function invalidateBuildings() {
  queryClient.invalidateQueries({ queryKey: buildingKeys.all });
}
