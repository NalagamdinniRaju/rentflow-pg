import { createQuery, createMutation } from 'react-query-kit';
import { supabase, supabaseUrl, unwrapSupabaseResponse } from './utils';
import { queryClient } from './client';

export const adminKeys = {
  all: ['admins'] as const,
  buildings: (adminId: string) => [...adminKeys.all, 'buildings', adminId] as const,
};

export const useAdmins = createQuery<any[]>({
  queryKey: adminKeys.all,
  fetcher: async () => {
    const response = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'ADMIN')
      .order('created_at', { ascending: false });
    return unwrapSupabaseResponse(response);
  },
});

export const useAdminBuildingsByAdminId = createQuery<any[], { adminId: string }>({
  queryKey: adminKeys.buildings(''), // We override queryKey dynamically or pass variables.
  fetcher: async (variables) => {
    const response = await supabase
      .from('buildings')
      .select('name, location, status')
      .eq('admin_id', variables.adminId);
    return unwrapSupabaseResponse(response) || [];
  },
});

export const useCreateAdmin = createMutation<void, { name: string; email: string; phone: string; password?: string }>({
  mutationFn: async (variables) => {
    const resp = await fetch(`${supabaseUrl}/functions/v1/create_admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variables)
    });
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || 'Failed to create admin');
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.all });
  },
});

export const useToggleAdminStatus = createMutation<void, { userId: string; currentStatus: string }>({
  mutationFn: async ({ userId, currentStatus }) => {
    const response = await supabase
      .from('user_roles')
      .update({ status: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })
      .eq('user_id', userId);
    unwrapSupabaseResponse(response);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.all });
  },
});

export const useAvailableBuildings = createQuery<any[], { adminId: string }>({
  queryKey: ['available-buildings'],
  fetcher: async (variables) => {
    // Get buildings that are either unassigned OR assigned to THIS admin
    const { data, error } = await supabase
      .from('buildings')
      .select('id, name, admin_id, status')
      .or(`admin_id.is.null, admin_id.eq.${variables.adminId}`);
    
    if (error) throw error;
    return data || [];
  }
});

export const useUpdateBuildingAssignments = createMutation<void, { adminId: string; buildingIds: string[] }>({
  mutationFn: async ({ adminId, buildingIds }) => {
    // 1. Unassign all buildings currently assigned to this admin
    const { error: unassignError } = await supabase
      .from('buildings')
      .update({ admin_id: null })
      .eq('admin_id', adminId);
    
    if (unassignError) throw unassignError;

    // 2. Assign selected buildings to this admin
    if (buildingIds.length > 0) {
      const { error: assignError } = await supabase
        .from('buildings')
        .update({ admin_id: adminId })
        .in('id', buildingIds);
      
      if (assignError) throw assignError;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.all });
    queryClient.invalidateQueries({ queryKey: ['available-buildings'] });
  }
});
