import { create } from 'zustand';
import { Player, SpiritSpecies, PlantSpecies, BallType, Announcement, ActiveBattle, Guild } from './types';

interface GameStore {
  player: Player | null;
  spiritSpecies: SpiritSpecies[];
  plantSpecies: PlantSpecies[];
  ballTypes: BallType[];
  announcements: Announcement[];
  activeBattle: ActiveBattle | null;
  guild: Guild | null;
  currentPage: string;
  selectedSpirit: string | null;

  setPlayer: (player: Player | null) => void;
  setSpiritSpecies: (species: SpiritSpecies[]) => void;
  setPlantSpecies: (species: PlantSpecies[]) => void;
  setBallTypes: (balls: BallType[]) => void;
  setAnnouncements: (announcements: Announcement[]) => void;
  addAnnouncement: (announcement: Announcement) => void;
  setActiveBattle: (battle: ActiveBattle | null) => void;
  setGuild: (guild: Guild | null) => void;
  setCurrentPage: (page: string) => void;
  setSelectedSpirit: (id: string | null) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  player: null,
  spiritSpecies: [],
  plantSpecies: [],
  ballTypes: [],
  announcements: [],
  activeBattle: null,
  guild: null,
  currentPage: 'garden',
  selectedSpirit: null,

  setPlayer: (player) => set({ player }),
  setSpiritSpecies: (spiritSpecies) => set({ spiritSpecies }),
  setPlantSpecies: (plantSpecies) => set({ plantSpecies }),
  setBallTypes: (ballTypes) => set({ ballTypes }),
  setAnnouncements: (announcements) => set({ announcements }),
  addAnnouncement: (announcement) => set((state) => ({
    announcements: [announcement, ...state.announcements].slice(0, 50),
  })),
  setActiveBattle: (activeBattle) => set({ activeBattle }),
  setGuild: (guild) => set({ guild }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setSelectedSpirit: (selectedSpirit) => set({ selectedSpirit }),
}));
