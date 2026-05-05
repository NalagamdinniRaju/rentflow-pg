import { useAuthStore } from '~/store/auth.store';
import { useSuperAdminStore } from '~/store/super-admin.store';
import { useAdminBuildingIds } from '~/queries/buildings.query';

/**
 * Returns the context for management (e.g. building IDs to filter by)
 * based on user role and impersonation state.
 */
export function useManagementContext() {
  const { user } = useAuthStore();
  const { selectedBuildingId, isImpersonating } = useSuperAdminStore();
  
  // Fetch the buildings this user normally manages (if they are an ADMIN)
  const { data: myBuildingIds = [] } = useAdminBuildingIds({ 
    variables: { adminId: user?.id || '' },
    enabled: !!user?.id && user.role === 'ADMIN'
  });

  // If SUPER_ADMIN and impersonating a building
  if (user?.role === 'SUPER_ADMIN' && isImpersonating && selectedBuildingId) {
    return {
      buildingIds: [selectedBuildingId],
      isImpersonating: true,
      currentBuildingId: selectedBuildingId,
    };
  }

  // If regular ADMIN
  if (user?.role === 'ADMIN') {
    return {
      buildingIds: myBuildingIds,
      isImpersonating: false,
      currentBuildingId: myBuildingIds[0] || null, // Primary building
    };
  }

  // Default / Global View (Super Admin not impersonating)
  return {
    buildingIds: [], // Empty means "all" in some queries or need special handling
    isImpersonating: false,
    currentBuildingId: null,
  };
}
