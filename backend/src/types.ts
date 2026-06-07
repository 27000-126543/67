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
  effect?: {
    stat?: 'attack' | 'defense' | 'speed';
    value?: number;
    duration?: number;
    healAmount?: number;
    dotDamage?: number;
    dotDuration?: number;
  };
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
  evolutionRequirements: {
    fruits: { [key: string]: number };
    challenges: string[];
    completedChallenges: string[];
  };
  breeding: {
    breedCount: number;
    maxBreedCount: number;
    lastBreedTime: number;
  };
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
  evolutionChain: {
    stage: number;
    level: number;
    formName: string;
    newSkills: string[];
    statMultiplier: number;
  }[];
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
  rarityBonus: { [key in Rarity]?: number };
  elementBonus?: { [key in ElementType]?: number };
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
  collectedSpecies: Set<string>;
  battleHistory: BattleRecord[];
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
  jointArena: {
    level: number;
    bonuses: {
      captureBonus: number;
      expBonus: number;
      fruitBonus: number;
    };
  };
  upgradeRequests: UpgradeRequest[];
  createdAt: number;
}

export interface UpgradeRequest {
  id: string;
  type: 'guild_level' | 'garden' | 'arena';
  targetLevel: number;
  cost: number;
  proposerId: string;
  approvals: string[];
  rejections: string[];
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

export interface TradeHistory {
  id: string;
  itemType: 'spirit' | 'plant_blueprint' | 'ball' | 'fruit';
  itemId: string;
  price: number;
  buyerId: string;
  sellerId: string;
  timestamp: number;
}

export interface BattleRecord {
  id: string;
  player1Id: string;
  player2Id: string;
  player1SpiritId: string;
  player2SpiritId: string;
  winnerId: string;
  player1ScoreChange: number;
  player2ScoreChange: number;
  timestamp: number;
  turns: BattleTurn[];
}

export interface BattleTurn {
  turnNumber: number;
  actorId: string;
  action: 'skill' | 'wait';
  skillId?: string;
  damage?: number;
  heal?: number;
  effectsApplied?: string[];
}

export interface ActiveBattle {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Spirit: Spirit;
  player2Spirit: Spirit;
  currentTurn: number;
  activePlayerId: string;
  battleLog: BattleTurn[];
  startTime: number;
  isFinished: boolean;
  winnerId: string | null;
  effects: {
    player1: { [stat: string]: { value: number; remainingTurns: number } };
    player2: { [stat: string]: { value: number; remainingTurns: number } };
  };
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

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  score: number;
  previousRank: number;
  change: 'up' | 'down' | 'same';
}

export interface Announcement {
  id: string;
  type: 'trade' | 'capture' | 'evolution' | 'arena' | 'system';
  message: string;
  timestamp: number;
  data?: any;
}
