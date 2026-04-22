import { createQuery, createMutation } from 'react-query-kit';
import { supabase, unwrapSupabaseResponse } from './utils';
import { useQueryClient } from '@tanstack/react-query';

export const registerKeys = {
  states: ['register', 'states'] as const,
  cities: (stateId: string) => ['register', 'cities', stateId] as const,
  buildings: ['register', 'buildings'] as const,
  floors: (buildingId: string) => ['register', 'floors', buildingId] as const,
  roomTypes: ['register', 'room-types'] as const,
  sharingTypes: ['register', 'sharing-types'] as const,
  rooms: (floorId: string, roomTypeId?: string, sharingTypeId?: string) => ['register', 'rooms', floorId, roomTypeId, sharingTypeId] as const,
  seats: (roomId: string) => ['register', 'seats', roomId] as const,
};

export const useRegistrationStates = createQuery<{id: string; name: string}[]>({
  queryKey: registerKeys.states,
  fetcher: async () => {
    const res = await supabase.from('states').select('id,name').order('name');
    return unwrapSupabaseResponse(res) as {id: string; name: string}[];
  }
});

export const useRegistrationCities = createQuery<{id: string; name: string; state_id: string}[], {stateId: string}>({
  queryKey: ['register', 'cities'],
  fetcher: async (variables) => {
    const res = await supabase.from('cities').select('id,name,state_id').eq('state_id', variables.stateId).order('name');
    return unwrapSupabaseResponse(res) as {id: string; name: string; state_id: string}[];
  }
});

export const useRegistrationBuildings = createQuery<{id: string; name: string; monthly_rent: number | null; daily_rent: number | null; deposit_amount: number | null}[]>({
  queryKey: registerKeys.buildings,
  fetcher: async () => {
    const res = await supabase.from('buildings').select('id,name,monthly_rent,daily_rent,deposit_amount').eq('status', 'ACTIVE').order('name');
    return unwrapSupabaseResponse(res) as {id: string; name: string; monthly_rent: number | null; daily_rent: number | null; deposit_amount: number | null}[];
  }
});

export const useRegistrationRoomTypes = createQuery<{id: string; name: string}[]>({
  queryKey: registerKeys.roomTypes,
  fetcher: async () => {
    const res = await supabase.from('room_types').select('id,name').order('name');
    return unwrapSupabaseResponse(res) as {id: string; name: string}[];
  }
});

export const useRegistrationSharingTypes = createQuery<{id: string; name: string; capacity: number}[]>({
  queryKey: registerKeys.sharingTypes,
  fetcher: async () => {
    const res = await supabase.from('sharing_types').select('id,name,capacity').order('capacity');
    return unwrapSupabaseResponse(res) as {id: string; name: string; capacity: number}[];
  }
});

export const useRegistrationFloors = createQuery<{id: string; floor_number: string}[], {buildingId: string}>({
  queryKey: ['register', 'floors'],
  fetcher: async (variables) => {
    const res = await supabase.from('floors').select('id, floor_number').eq('building_id', variables.buildingId);
    return unwrapSupabaseResponse(res) as {id: string; floor_number: string}[];
  }
});

export const useRegistrationRooms = createQuery<{id: string; room_number: string; custom_monthly_rent: number | null; custom_daily_rent: number | null; custom_deposit_amount: number | null}[], {floorId: string; roomTypeId?: string; sharingTypeId?: string}>({
  queryKey: ['register', 'rooms'],
  fetcher: async (variables) => {
    let query = supabase.from('rooms').select('id, room_number, custom_monthly_rent, custom_daily_rent, custom_deposit_amount').eq('floor_id', variables.floorId);
    if (variables.roomTypeId && variables.roomTypeId !== 'none') {
      query = query.eq('room_type_id', variables.roomTypeId);
    }
    if (variables.sharingTypeId && variables.sharingTypeId !== 'none') {
      query = query.eq('sharing_type_id', variables.sharingTypeId);
    }
    const res = await query;
    return unwrapSupabaseResponse(res) as {id: string; room_number: string; custom_monthly_rent: number | null; custom_daily_rent: number | null; custom_deposit_amount: number | null}[];
  }
});

export const useRegistrationSeats = createQuery<{id: string; seat_number: string}[], {roomId: string}>({
  queryKey: ['register', 'seats'],
  fetcher: async (variables) => {
    const res = await supabase.from('seats').select('id, seat_number').eq('room_id', variables.roomId).eq('status', 'AVAILABLE');
    return unwrapSupabaseResponse(res) as {id: string; seat_number: string}[];
  }
});

export const useRegisterUser = createMutation<void, any>({
  mutationFn: async (variables) => {
    const { 
      email, password, name, phone, line_one, line_two, pincode, city_id, 
      building_id, floor_id, room_id, seat_id, age, gender, aadhar_file,
      stay_type, deposit_amount, monthly_rent, daily_rent
    } = variables;

    // 1. Auth creation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (authError) throw authError;
    if (!authData.user) throw new Error('Registration failed');
    const userId = authData.user.id;

    // 2. Upload Aadhar if exists
    let aadharUrl = null;
    if (aadhar_file) {
      const fileExt = aadhar_file.name.split('.').pop();
      const filePath = `documents/${userId}/aadhar_registration_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('resident-documents')
        .upload(filePath, aadhar_file);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resident-documents')
        .getPublicUrl(filePath);
      aadharUrl = publicUrl;
    }

    // 3. Insert address
    const { data: addrData, error: addrError } = await supabase
      .from('addresses')
      .insert({ line_one, line_two: line_two || null, pincode, city_id })
      .select('id')
      .single();
    if (addrError) throw addrError;

    // 4. User Role mapping
    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: userId,
      role: 'RESIDENT',
      name,
      phone,
      email,
    });
    if (roleError) throw roleError;

    // 5. Resident Record creation
    const { error: resError } = await supabase.from('residents').insert({
      user_id: userId,
      building_id,
      floor_id,
      room_id,
      seat_id,
      name,
      phone,
      email,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      stay_type: stay_type || 'MONTHLY',
      monthly_rent: monthly_rent != null ? Number(monthly_rent) : null,
      daily_rent: daily_rent != null ? Number(daily_rent) : null,
      deposit_amount: deposit_amount != null ? Number(deposit_amount) : null,
      status: 'PENDING',
      address_id: addrData.id,
      aadhar_photo: aadharUrl,
    });
    if (resError) throw resError;
  }
});
