import { v4 as uuidv4 } from 'uuid';
import {
  Spirit, SpiritSpecies, Skill, Rarity, ElementType, Player, Garden,
  PlantedPlant, WildSpiritEncounter, Weather, Rarity as RarityType
} from './types';
import {
  SPIRIT_SPECIES, PLANT_SPECIES, BALL_TYPES, getSpiritSpecies, getPlantSpecies,
  getBallType, RARITY_WEIGHTS, RARITY_MULTIPLIER, SKILLS
} from './gameData';

export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const randomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const weightedRandom = <T extends string>(weights: { [key in T]?: number }): T | null => {
  const entries = Object.entries(weights) as [T, number][];
  const totalWeight = entries.reduce((sum, [, w]) => sum + (w || 0), 0);
  if (totalWeight === 0) return null;
  let random = Math.random() * totalWeight;
  for (const [key, weight] of entries) {
    random -= weight || 0;
    if (random <= 0) return key;
  }
  return entries[0]?.[0] || null;
};

export const pickRandom = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const createSpirit = (
  speciesId: string,
  ownerId: string,
  level: number = 1,
  forcedRarity?: Rarity
): Spirit => {
  const species = getSpiritSpecies(speciesId);
  if (!species) throw new Error(`Species ${speciesId} not found`);

  const rarity = forcedRarity || rollRarity(species.baseRarity);
  const rarityMult = RARITY_MULTIPLIER[rarity];
  const levelMult = 1 + (level - 1) * 0.08;

  const baseStats = {
    hp: Math.floor(species.baseStats.hp * rarityMult * levelMult),
    maxHp: Math.floor(species.baseStats.hp * rarityMult * levelMult),
    energy: species.baseStats.energy,
    maxEnergy: species.baseStats.energy,
    attack: Math.floor(species.baseStats.attack * rarityMult * levelMult),
    defense: Math.floor(species.baseStats.defense * rarityMult * levelMult),
    speed: Math.floor(species.baseStats.speed * rarityMult * levelMult),
  };

  const evolutionStage = species.evolutionChain
    .filter(ec => ec.level <= level)
    .pop()?.stage || 1;

  const availableSkillIds = new Set<string>();
  species.evolutionChain
    .filter(ec => ec.stage <= evolutionStage)
    .forEach(ec => {
      ec.newSkills.forEach(s => availableSkillIds.add(s));
    });
  species.possibleSkills.forEach(s => availableSkillIds.add(s.id));

  const allSkills = Array.from(availableSkillIds)
    .map(id => SKILLS.find(s => s.id === id))
    .filter(Boolean) as Skill[];

  const skillCount = Math.min(4, allSkills.length);
  const selectedSkills: Skill[] = [];
  const shuffled = [...allSkills].sort(() => Math.random() - 0.5);
  for (let i = 0; i < skillCount; i++) {
    selectedSkills.push({ ...shuffled[i], currentCooldown: 0 });
  }

  const maxStage = species.evolutionChain[species.evolutionChain.length - 1].stage;
  const nextStage = species.evolutionChain.find(ec => ec.stage === evolutionStage + 1);

  return {
    id: uuidv4(),
    speciesId,
    name: species.name,
    ownerId,
    level,
    exp: 0,
    expToNextLevel: level * 100,
    rarity,
    element: species.element,
    stats: { ...baseStats },
    baseStats,
    skills: selectedSkills,
    evolutionStage,
    maxEvolutionStage: maxStage,
    canEvolve: !!nextStage && level >= nextStage.level,
    evolutionRequirements: {
      fruits: { [`${species.element}_fruit`]: evolutionStage * 5 },
      challenges: nextStage ? [`defeat_level_${nextStage.level}_spirit`] : [],
      completedChallenges: [],
    },
    breeding: {
      breedCount: 0,
      maxBreedCount: 5 - evolutionStage,
      lastBreedTime: 0,
    },
    isMutant: false,
    captureTime: Date.now(),
    battleScore: calculateBattleScore({
      ...baseStats,
      rarity,
      level,
      skillsCount: selectedSkills.length,
      evolutionStage,
    }),
  };
};

const rollRarity = (baseRarity: Rarity): Rarity => {
  const order: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
  const baseIndex = order.indexOf(baseRarity);
  const weights: { [key in Rarity]?: number } = {};

  order.forEach((r, i) => {
    const diff = Math.abs(i - baseIndex);
    const baseWeight = RARITY_WEIGHTS[r];
    weights[r] = baseWeight * Math.pow(0.3, diff);
  });

  return weightedRandom(weights) || baseRarity;
};

export const calculateBattleScore = (data: {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  rarity: Rarity;
  level: number;
  skillsCount: number;
  evolutionStage: number;
}): number => {
  return Math.floor(
    data.maxHp * 0.5 +
    data.attack * 2 +
    data.defense * 1.5 +
    data.speed * 1.2 +
    data.level * 10 +
    data.skillsCount * 15 +
    data.evolutionStage * 50 +
    RARITY_MULTIPLIER[data.rarity] * 100
  );
};

export const levelUpSpirit = (spirit: Spirit): Spirit => {
  const newLevel = spirit.level + 1;
  const species = getSpiritSpecies(spirit.speciesId)!;
  const rarityMult = RARITY_MULTIPLIER[spirit.rarity];
  const levelMult = 1 + (newLevel - 1) * 0.08;

  const newMaxHp = Math.floor(species.baseStats.hp * rarityMult * levelMult);
  const newAttack = Math.floor(species.baseStats.attack * rarityMult * levelMult);
  const newDefense = Math.floor(species.baseStats.defense * rarityMult * levelMult);
  const newSpeed = Math.floor(species.baseStats.speed * rarityMult * levelMult);

  const newStats = {
    hp: newMaxHp,
    maxHp: newMaxHp,
    energy: spirit.stats.maxEnergy,
    maxEnergy: spirit.stats.maxEnergy,
    attack: newAttack,
    defense: newDefense,
    speed: newSpeed,
  };

  const evolutionStage = species.evolutionChain
    .filter(ec => ec.level <= newLevel)
    .pop()?.stage || 1;

  let newSkills = [...spirit.skills];
  if (evolutionStage > spirit.evolutionStage) {
    const newStageSkills = species.evolutionChain
      .find(ec => ec.stage === evolutionStage)?.newSkills || [];
    newStageSkills.forEach(skillId => {
      const skill = SKILLS.find(s => s.id === skillId);
      if (skill && !newSkills.find(s => s.id === skillId)) {
        if (newSkills.length < 4) {
          newSkills.push({ ...skill, currentCooldown: 0 });
        } else {
          newSkills[newSkills.length - 1] = { ...skill, currentCooldown: 0 };
        }
      }
    });
  }

  const nextStage = species.evolutionChain.find(ec => ec.stage === evolutionStage + 1);

  return {
    ...spirit,
    level: newLevel,
    exp: spirit.exp - spirit.expToNextLevel,
    expToNextLevel: newLevel * 100,
    stats: newStats,
    baseStats: { ...newStats },
    skills: newSkills,
    evolutionStage,
    canEvolve: !!nextStage && newLevel >= nextStage.level,
    battleScore: calculateBattleScore({
      maxHp: newMaxHp,
      attack: newAttack,
      defense: newDefense,
      speed: newSpeed,
      rarity: spirit.rarity,
      level: newLevel,
      skillsCount: newSkills.length,
      evolutionStage,
    }),
  };
};

export const evolveSpirit = (spirit: Spirit): Spirit => {
  if (!spirit.canEvolve) return spirit;

  const species = getSpiritSpecies(spirit.speciesId)!;
  const newStage = spirit.evolutionStage + 1;
  const stageInfo = species.evolutionChain.find(ec => ec.stage === newStage)!;
  const rarityMult = RARITY_MULTIPLIER[spirit.rarity];
  const levelMult = 1 + (spirit.level - 1) * 0.08;

  const newMaxHp = Math.floor(species.baseStats.hp * rarityMult * levelMult * stageInfo.statMultiplier);
  const newAttack = Math.floor(species.baseStats.attack * rarityMult * levelMult * stageInfo.statMultiplier);
  const newDefense = Math.floor(species.baseStats.defense * rarityMult * levelMult * stageInfo.statMultiplier);
  const newSpeed = Math.floor(species.baseStats.speed * rarityMult * levelMult * stageInfo.statMultiplier);

  const newStats = {
    hp: newMaxHp,
    maxHp: newMaxHp,
    energy: spirit.stats.maxEnergy,
    maxEnergy: spirit.stats.maxEnergy,
    attack: newAttack,
    defense: newDefense,
    speed: newSpeed,
  };

  let newSkills = [...spirit.skills];
  stageInfo.newSkills.forEach(skillId => {
    const skill = SKILLS.find(s => s.id === skillId);
    if (skill && !newSkills.find(s => s.id === skillId)) {
      if (newSkills.length < 4) {
        newSkills.push({ ...skill, currentCooldown: 0 });
      }
    }
  });

  const nextStage = species.evolutionChain.find(ec => ec.stage === newStage + 1);

  return {
    ...spirit,
    name: stageInfo.formName,
    stats: newStats,
    baseStats: { ...newStats },
    skills: newSkills,
    evolutionStage: newStage,
    canEvolve: !!nextStage && spirit.level >= nextStage.level,
    battleScore: calculateBattleScore({
      maxHp: newMaxHp,
      attack: newAttack,
      defense: newDefense,
      speed: newSpeed,
      rarity: spirit.rarity,
      level: spirit.level,
      skillsCount: newSkills.length,
      evolutionStage: newStage,
    }),
  };
};

export const breedSpirits = (parent1: Spirit, parent2: Spirit): Spirit | null => {
  if (parent1.breeding.breedCount >= parent1.breeding.maxBreedCount) return null;
  if (parent2.breeding.breedCount >= parent2.breeding.maxBreedCount) return null;
  if (Date.now() - parent1.breeding.lastBreedTime < 3600000) return null;
  if (Date.now() - parent2.breeding.lastBreedTime < 3600000) return null;
  if (parent1.speciesId !== parent2.speciesId) return null;

  const species = getSpiritSpecies(parent1.speciesId)!;
  const ownerId = parent1.ownerId;

  const rarityWeights: { [key in Rarity]?: number } = {};
  const allRarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
  const p1Idx = allRarities.indexOf(parent1.rarity);
  const p2Idx = allRarities.indexOf(parent2.rarity);
  const avgIdx = Math.floor((p1Idx + p2Idx) / 2);

  allRarities.forEach((r, i) => {
    const diff = Math.abs(i - avgIdx);
    rarityWeights[r] = RARITY_WEIGHTS[r] * Math.pow(0.4, diff);
    if (i >= Math.min(p1Idx, p2Idx) && i <= Math.max(p1Idx, p2Idx)) {
      rarityWeights[r]! *= 2;
    }
  });

  const offspringRarity = weightedRandom(rarityWeights) || species.baseRarity;
  const isMutant = Math.random() < 0.05;

  const level = 1;
  const offspring = createSpirit(parent1.speciesId, ownerId, level, isMutant ? (allRarities[Math.min(allRarities.length - 1, avgIdx + 1)] as Rarity) : offspringRarity);

  const avgStats = {
    attack: Math.floor((parent1.baseStats.attack + parent2.baseStats.attack) / 2),
    defense: Math.floor((parent1.baseStats.defense + parent2.baseStats.defense) / 2),
    speed: Math.floor((parent1.baseStats.speed + parent2.baseStats.speed) / 2),
    maxHp: Math.floor((parent1.baseStats.maxHp + parent2.baseStats.maxHp) / 2),
  };

  const inheritBonus = 0.9;
  offspring.stats.attack = Math.floor(offspring.stats.attack * 0.3 + avgStats.attack * inheritBonus * 0.7);
  offspring.stats.defense = Math.floor(offspring.stats.defense * 0.3 + avgStats.defense * inheritBonus * 0.7);
  offspring.stats.speed = Math.floor(offspring.stats.speed * 0.3 + avgStats.speed * inheritBonus * 0.7);
  offspring.stats.maxHp = Math.floor(offspring.stats.maxHp * 0.3 + avgStats.maxHp * inheritBonus * 0.7);
  offspring.stats.hp = offspring.stats.maxHp;
  offspring.baseStats = { ...offspring.stats };
  offspring.baseStats.energy = offspring.stats.energy;
  offspring.baseStats.maxEnergy = offspring.stats.maxEnergy;

  const parentSkills = [...new Set([...parent1.skills.map(s => s.id), ...parent2.skills.map(s => s.id)])];
  const inheritedSkills: Skill[] = [];
  parentSkills.sort(() => Math.random() - 0.5).slice(0, 4).forEach(id => {
    const skill = SKILLS.find(s => s.id === id);
    if (skill) inheritedSkills.push({ ...skill, currentCooldown: 0 });
  });
  if (inheritedSkills.length > 0) {
    offspring.skills = inheritedSkills;
  }

  offspring.parentIds = [parent1.id, parent2.id];
  offspring.isMutant = isMutant;
  if (isMutant) {
    offspring.mutantTraits = ['异色皮肤', '属性强化'];
    offspring.stats.attack = Math.floor(offspring.stats.attack * 1.15);
    offspring.stats.defense = Math.floor(offspring.stats.defense * 1.15);
    offspring.stats.speed = Math.floor(offspring.stats.speed * 1.1);
    offspring.stats.maxHp = Math.floor(offspring.stats.maxHp * 1.1);
    offspring.stats.hp = offspring.stats.maxHp;
  }

  offspring.battleScore = calculateBattleScore({
    maxHp: offspring.stats.maxHp,
    attack: offspring.stats.attack,
    defense: offspring.stats.defense,
    speed: offspring.stats.speed,
    rarity: offspring.rarity,
    level: offspring.level,
    skillsCount: offspring.skills.length,
    evolutionStage: offspring.evolutionStage,
  });

  parent1.breeding.breedCount++;
  parent1.breeding.lastBreedTime = Date.now();
  parent2.breeding.breedCount++;
  parent2.breeding.lastBreedTime = Date.now();

  return offspring;
};

export const getRandomWeather = (): Weather => {
  const weathers: Weather[] = ['sunny', 'rainy', 'cloudy', 'thunderstorm', 'snowy', 'rainbow', 'magical'];
  const weights = [25, 20, 20, 10, 10, 8, 7];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < weathers.length; i++) {
    random -= weights[i];
    if (random <= 0) return weathers[i];
  }
  return 'sunny';
};

export const calculateSpiritAppearance = (garden: Garden): { species: SpiritSpecies; rarity: Rarity; probability: number }[] => {
  const results: { species: SpiritSpecies; rarity: Rarity; probability: number }[] = [];
  const plantedSpecies = garden.plants
    .filter(p => !p.harvested)
    .map(p => getPlantSpecies(p.speciesId))
    .filter(Boolean) as typeof PLANT_SPECIES;

  if (plantedSpecies.length === 0) return results;

  const weatherBonus: { [key in ElementType]?: number } = {};
  SPIRIT_SPECIES.forEach(sp => {
    if (sp.preferredWeather.includes(garden.currentWeather)) {
      weatherBonus[sp.element] = (weatherBonus[sp.element] || 1) * 1.5;
    }
  });

  const attractionScores: { [speciesId: string]: number } = {};

  plantedSpecies.forEach(plant => {
    plant.attractsSpirits.forEach(speciesId => {
      const species = getSpiritSpecies(speciesId);
      if (!species) return;

      let score = plant.attractionBonus;
      score *= plant.rarityBonus;
      score *= weatherBonus[species.element] || 1;
      score *= garden.captureRateBonus || 1;
      score *= 1 + plantedSpecies.filter(p => p.element === species.element).length * 0.2;

      attractionScores[speciesId] = (attractionScores[speciesId] || 0) + score;
    });
  });

  const totalScore = Object.values(attractionScores).reduce((a, b) => a + b, 0);

  Object.entries(attractionScores).forEach(([speciesId, score]) => {
    const species = getSpiritSpecies(speciesId);
    if (!species) return;

    const baseProb = score / totalScore;
    const allRarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    const baseIdx = allRarities.indexOf(species.baseRarity);

    allRarities.forEach((rarity, idx) => {
      const rarityMult = RARITY_WEIGHTS[rarity] * Math.pow(0.35, Math.abs(idx - baseIdx));
      const plantBonus = plantedSpecies.reduce((acc, p) => acc + (p.rarityBonus - 1), 0);
      const finalProb = baseProb * rarityMult * (1 + plantBonus * 0.5);
      if (finalProb > 0.001) {
        results.push({ species, rarity, probability: finalProb });
      }
    });
  });

  const sum = results.reduce((a, r) => a + r.probability, 0);
  results.forEach(r => r.probability /= sum);

  return results.sort((a, b) => b.probability - a.probability);
};

export const generateWildEncounter = (garden: Garden): WildSpiritEncounter | null => {
  const appearances = calculateSpiritAppearance(garden);
  if (appearances.length === 0) return null;

  let random = Math.random();
  let selected = appearances[0];
  for (const app of appearances) {
    random -= app.probability;
    if (random <= 0) {
      selected = app;
      break;
    }
  }

  const level = randomInt(1, Math.min(30, 1 + Math.floor(garden.plants.length * 2)));
  const rarityMult = RARITY_MULTIPLIER[selected.rarity];
  const captureDifficulty = clamp(0.1 + (level / 50) + (rarityMult / 5), 0.1, 0.95);

  return {
    id: uuidv4(),
    speciesId: selected.species.id,
    rarity: selected.rarity,
    level,
    appearedAt: Date.now(),
    expiresAt: Date.now() + 120000,
    captureDifficulty,
    isCaptured: false,
  };
};

export const attemptCapture = (
  encounter: WildSpiritEncounter,
  ballId: string
): { success: boolean; rate: number } => {
  const ball = getBallType(ballId);
  if (!ball) return { success: false, rate: 0 };

  const species = getSpiritSpecies(encounter.speciesId)!;
  let rate = ball.baseCaptureRate;

  const rarityBonus = ball.rarityBonus[encounter.rarity] || 0.5;
  rate *= rarityBonus;

  if (ball.elementBonus && ball.elementBonus[species.element]) {
    rate *= ball.elementBonus[species.element] as number;
  }

  rate *= (1 - encounter.captureDifficulty * 0.6);
  rate = clamp(rate, 0.02, 0.98);

  return {
    success: Math.random() < rate,
    rate,
  };
};

export const createGarden = (ownerId: string, ownerType: 'player' | 'guild', size: number = 6): Garden => {
  return {
    id: uuidv4(),
    ownerId,
    ownerType,
    size,
    plants: [],
    currentWeather: getRandomWeather(),
    weatherExpiryTime: Date.now() + 1800000,
    attractedSpirits: [],
    captureRateBonus: 1,
  };
};

export const plantSeed = (garden: Garden, plantSpeciesId: string): Garden | null => {
  const species = getPlantSpecies(plantSpeciesId);
  if (!species) return null;
  if (garden.plants.filter(p => !p.harvested).length >= garden.size) return null;

  const newPlant: PlantedPlant = {
    id: uuidv4(),
    speciesId: plantSpeciesId,
    plantedAt: Date.now(),
    growthProgress: 0,
    isReady: false,
    harvested: false,
  };

  return {
    ...garden,
    plants: [...garden.plants, newPlant],
  };
};

export const updatePlantGrowth = (garden: Garden): { garden: Garden; harvestedFruits: { [key: string]: number } } => {
  const harvestedFruits: { [key: string]: number } = {};

  const updatedPlants = garden.plants.map(plant => {
    if (plant.harvested) return plant;

    const species = getPlantSpecies(plant.speciesId)!;
    const elapsed = Date.now() - plant.plantedAt;
    const progress = clamp(elapsed / species.growthTime, 0, 1);

    if (progress >= 1 && !plant.isReady) {
      return { ...plant, growthProgress: 1, isReady: true };
    }

    return { ...plant, growthProgress: progress };
  });

  return {
    garden: { ...garden, plants: updatedPlants },
    harvestedFruits,
  };
};

export const harvestPlant = (garden: Garden, plantId: string): { garden: Garden; fruits: { [key: string]: number } } | null => {
  const plant = garden.plants.find(p => p.id === plantId);
  if (!plant || !plant.isReady || plant.harvested) return null;

  const species = getPlantSpecies(plant.speciesId)!;
  const fruits: { [key: string]: number } = {
    [species.fruitType]: species.fruitYield + randomInt(0, 1),
  };

  return {
    garden: {
      ...garden,
      plants: garden.plants.map(p =>
        p.id === plantId ? { ...p, harvested: true } : p
      ),
    },
    fruits,
  };
};

export const removeHarvestedPlant = (garden: Garden, plantId: string): Garden => {
  return {
    ...garden,
    plants: garden.plants.filter(p => p.id !== plantId || !p.harvested),
  };
};

export const createPlayer = (username: string): Player => {
  const id = uuidv4();
  const garden = createGarden(id, 'player');

  return {
    id,
    username,
    displayName: username,
    avatar: ['🧙', '🧚', '🧝', '🧛', '🧞', '🦸'][randomInt(0, 5)],
    level: 1,
    exp: 0,
    coins: 500,
    gems: 50,
    spirits: [
      createSpirit(pickRandom(['flame_wisp', 'aqua_sprite', 'leaf_fairy', 'spark_mouse']), id, 5),
    ],
    balls: {
      basic_ball: 20,
      great_ball: 5,
    },
    fruits: {},
    garden,
    guildId: null,
    guildRole: null,
    arenaScore: 1000,
    collectionScore: 0,
    collectedSpecies: new Set(),
    battleHistory: [],
    weeklyWins: 0,
    weeklyLosses: 0,
    lastDailyReward: 0,
  };
};
