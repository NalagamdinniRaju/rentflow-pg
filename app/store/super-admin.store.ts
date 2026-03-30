import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SuperAdminState {
  selectedBuildingId: string | null;
  setSelectedBuildingId: (id: string | null) => void;
  isImpersonating: boolean;
  setImpersonating: (value: boolean) => void;
}

export const useSuperAdminStore = create<SuperAdminState>()(
  persist(
    (set) => ({
      selectedBuildingId: null,
      setSelectedBuildingId: (id) => set({ selectedBuildingId: id }),
      isImpersonating: false,
      setImpersonating: (value) => set({ isImpersonating: value }),
    }),
    {
      name: 'rentflow-super-admin-storage',
    }
  )
);
