import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TeamStoreState {
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string | null) => void;
}

export const useTeamStore = create<TeamStoreState>()(
  persist(
    (set) => ({
      selectedTeamId: null,
      setSelectedTeamId: (id) => set({ selectedTeamId: id }),
    }),
    {
      name: 'team-selection',
      partialize: (state) => ({ selectedTeamId: state.selectedTeamId }),
    }
  )
);
