export type ElementType = 'fire' | 'water' | 'grass' | 'thunder' | 'light' | 'dark' | 'wind' | 'earth';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type Weather = 'sunny' | 'rainy' | 'cloudy' | 'thunderstorm' | 'snowy' | 'rainbow' | 'magical';
export type SkillType = 'attack' | 'defense' | 'heal' | 'buff' | 'debuff';
export type GuildRole = 'member' | 'vice_president' | 'president';

export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  element: ElementType;
  power: number;
  energyCost: number;
  cooldown: number;
  currentCooldown: number;
  description: string;
  effect?: any;
}

export interface SpiritStats {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface Spirit {
  id: string;
  speciesId: string;
  name: string;
  ownerId: string;
  level: number;
  exp: number;
  expToNextLevel: number;
  rarity: Rarity;
  element: ElementType;
  stats: SpiritStats;
  baseStats: SpiritStats;
  skills: Skill[];
  evolutionStage: number;
  maxEvolutionStage: number;
  canEvolve: boolean;
  evolutionRequirements: any;
  breeding: any;
  parentIds?: string[];
  isMutant: boolean;
  mutantTraits?: string[];
  captureTime: number;
  battleScore: number;
}

export interface SpiritSpecies {
  id: string;
  name: string;
  description: string;
  element: ElementType;
  baseRarity: Rarity;
  baseStats: SpiritStats;
  possibleSkills: Skill[];
  evolutionChain: any[];
  preferredWeather: Weather[];
  preferredPlants: string[];
  sprite: string;
}

export interface PlantSpecies {
  id: string;
  name: string;
  description: string;
  element: ElementType;
  growthTime: number;
  fruitYield: number;
  fruitType: string;
  attractsSpirits: string[];
  attractionBonus: number;
  rarityBonus: number;
  cost: number;
  sprite: string;
}

export interface PlantedPlant {
  id: string;
  speciesId: string;
  plantedAt: number;
  growthProgress: number;
  isReady: boolean;
  harvested: boolean;
}

export interface Garden {
  id: string;
  ownerId: string;
  ownerType: 'player' | 'guild';
  size: number;
  plants: PlantedPlant[];
  currentWeather: Weather;
  weatherExpiryTime: number;
  attractedSpirits: WildSpiritEncounter[];
  captureRateBonus: number;
}

export interface WildSpiritEncounter {
  id: string;
  speciesId: string;
  rarity: Rarity;
  level: number;
  appearedAt: number;
  expiresAt: number;
  captureDifficulty: number;
  isCaptured: boolean;
}

export interface BallType {
  id: string;
  name: string;
  baseCaptureRate: number;
  rarityBonus: any;
  elementBonus?: any;
  description: string;
  cost: number;
  sprite: string;
}

export interface Player {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  level: number;
  exp: number;
  coins: number;
  gems: number;
  spirits: Spirit[];
  balls: { [ballId: string]: number };
  fruits: { [fruitId: string]: number };
  garden: Garden;
  guildId: string | null;
  guildRole: GuildRole | null;
  arenaScore: number;
  collectionScore: number;
  battleHistory: any[];
  weeklyWins: number;
  weeklyLosses: number;
  lastDailyReward: number;
}

export interface Guild {
  id: string;
  name: string;
  description: string;
  logo: string;
  level: number;
  exp: number;
  presidentId: string;
  vicePresidentIds: string[];
  memberIds: string[];
  contributions: { [playerId: string]: number };
  jointGarden: Garden;
  jointArena: any;
  upgradeRequests: any[];
  createdAt: number;
}

export interface TradeListing {
  id: string;
  sellerId: string;
  sellerName: string;
  itemType: 'spirit' | 'plant_blueprint' | 'ball' | 'fruit';
  itemId: string;
  itemData?: any;
  price: number;
  suggestedPrice: number;
  listedAt: number;
  expiresAt: number;
}

export interface ActiveBattle {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Spirit: Spirit;
  player2Spirit: Spirit;
  currentTurn: number;
  activePlayerId: string;
  battleLog: any[];
  startTime: number;
  isFinished: boolean;
  winnerId: string | null;
  effects: any;
}

export interface Announcement {
  id: string;
  type: 'trade' | 'capture' | 'evolution' | 'arena' | 'system';
  message: string;
  timestamp: number;
  data?: any;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  score: number;
  previousRank: number;
  change: 'up' | 'down' | 'same';
}

export interface WeeklyReport {
  id: string;
  weekStart: number;
  weekEnd: number;
  spiritDistribution: { [element: string]: number };
  spiritHeatmap: { [area: string]: number };
  evolutionRate: number;
  totalEvolutions: number;
  arenaWinRates: { [element: string]: number };
  totalBattles: number;
  topPlayers: { id: string; name: string; score: number }[];
  topGuilds: { id: string; name: string; score: number }[];
  rareCaptures: { playerName: string; spiritName: string; rarity: Rarity }[];
}

export const RARITY_COLORS: { [key in Rarity]: string } = {
  common: '#9CA3AF',
  uncommon: '#10B981',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
  mythic: '#EC4899'
};

export const RARITY_NAMES: { [key in Rarity]: string } = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
  mythic: '神话'
};

export const ELEMENT_COLORS: { [key in ElementType]: string } = {
  fire: '#EF4444',
  water: '#3B82F6',
  grass: '#10B981',
  thunder: '#F59E0B',
  light: '#FCD34D',
  dark: '#6B21A8',
  wind: '#67E8F9',
  earth: '#92400E'
};

export const ELEMENT_NAMES: { [key in ElementType]: string } = {
  fire: '火',
  water: '水',
  grass: '草',
  thunder: '雷',
  light: '光',
  dark: '暗',
  wind: '风',
  earth: '土'
};

export const WEATHER_NAMES: { [key in Weather]: string } = {
  sunny: '☀️ 晴朗',
  rainy: '🌧️ 雨天',
  cloudy: '☁️ 多云',
  thunderstorm: '⛈️ 雷暴',
  snowy: '❄️ 雪天',
  rainbow: '🌈 彩虹',
  magical: '✨ 魔法风暴'
};

export const FRUIT_NAMES: { [key: string]: string } = {
  fire_fruit: '火焰果',
  water_fruit: '水晶果',
  grass_fruit: '翠叶果',
  thunder_fruit: '雷电果',
  light_fruit: '光辉果',
  dark_fruit: '暗影果',
  wind_fruit: '疾风果',
  earth_fruit: '岩石果'
};

export const FRUIT_SPRITES: { [key: string]: string } = {
  fire_fruit: '🍎',
  water_fruit: '💧',
  grass_fruit: '🍏',
  thunder_fruit: '⚡',
  light_fruit: '✨',
  dark_fruit: '🌑',
  wind_fruit: '💨',
  earth_fruit: '🪨'
};
