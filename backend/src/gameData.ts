import {
  SpiritSpecies, PlantSpecies, BallType, ElementType, Rarity, Skill, Weather
} from './types';

export const RARITY_COLORS: { [key in Rarity]: string } = {
  common: '#9CA3AF',
  uncommon: '#10B981',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
  mythic: '#EC4899'
};

export const RARITY_MULTIPLIER: { [key in Rarity]: number } = {
  common: 1,
  uncommon: 1.2,
  rare: 1.5,
  epic: 2,
  legendary: 3,
  mythic: 5
};

export const RARITY_WEIGHTS: { [key in Rarity]: number } = {
  common: 50,
  uncommon: 25,
  rare: 15,
  epic: 7,
  legendary: 2.5,
  mythic: 0.5
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

export const RARITY_NAMES: { [key in Rarity]: string } = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
  mythic: '神话'
};

export const WEATHER_NAMES: { [key in Weather]: string } = {
  sunny: '晴朗',
  rainy: '雨天',
  cloudy: '多云',
  thunderstorm: '雷暴',
  snowy: '雪天',
  rainbow: '彩虹',
  magical: '魔法风暴'
};

const createSkill = (
  id: string, name: string, type: Skill['type'], element: ElementType,
  power: number, energyCost: number, cooldown: number, description: string,
  effect?: Skill['effect']
): Skill => ({
  id, name, type, element, power, energyCost, cooldown, currentCooldown: 0, description, effect
});

export const SKILLS: Skill[] = [
  createSkill('fireball', '火球术', 'attack', 'fire', 35, 20, 2, '释放灼热火球造成伤害'),
  createSkill('flame_burst', '烈焰爆发', 'attack', 'fire', 60, 40, 4, '强力火焰攻击，可能造成持续灼烧', { dotDamage: 10, dotDuration: 3 }),
  createSkill('water_gun', '水枪', 'attack', 'water', 30, 15, 1, '高压水流攻击'),
  createSkill('tidal_wave', '海啸', 'attack', 'water', 55, 45, 4, '召唤巨浪冲击敌人'),
  createSkill('vine_whip', '藤鞭', 'attack', 'grass', 32, 18, 2, '藤蔓鞭打攻击'),
  createSkill('solar_beam', '阳光烈焰', 'attack', 'grass', 70, 50, 5, '凝聚阳光的毁灭性光束'),
  createSkill('thunder_shock', '电击', 'attack', 'thunder', 33, 18, 2, '释放电流攻击'),
  createSkill('thunder_storm', '雷暴', 'attack', 'thunder', 65, 48, 5, '召唤雷电风暴'),
  createSkill('holy_light', '圣光', 'attack', 'light', 40, 25, 3, '神圣光芒攻击黑暗属性'),
  createSkill('shadow_strike', '暗影突袭', 'attack', 'dark', 38, 22, 2, '从暗影中突袭'),
  createSkill('gust', '疾风', 'attack', 'wind', 28, 15, 1, '快速风刃攻击'),
  createSkill('rock_throw', '岩石投掷', 'attack', 'earth', 35, 20, 2, '投掷巨石攻击'),
  createSkill('fire_shield', '火焰护盾', 'defense', 'fire', 0, 30, 4, '提升防御力并反弹少量伤害', { stat: 'defense', value: 30, duration: 3 }),
  createSkill('water_barrier', '水之屏障', 'defense', 'water', 0, 25, 3, '水墙提升防御', { stat: 'defense', value: 25, duration: 3 }),
  createSkill('spikes', '尖刺防御', 'defense', 'grass', 0, 25, 3, '植物尖刺提升防御', { stat: 'defense', value: 25, duration: 3 }),
  createSkill('iron_wall', '钢铁壁垒', 'defense', 'earth', 0, 35, 5, '大幅提升防御', { stat: 'defense', value: 50, duration: 3 }),
  createSkill('heal', '治愈之光', 'heal', 'light', 0, 30, 3, '恢复40点生命值', { healAmount: 40 }),
  createSkill('nature_blessing', '自然祝福', 'heal', 'grass', 0, 40, 4, '恢复60点生命值', { healAmount: 60 }),
  createSkill('life_steal', '生命汲取', 'heal', 'dark', 25, 35, 4, '造成伤害并回复生命', { healAmount: 20 }),
  createSkill('battle_cry', '战吼', 'buff', 'fire', 0, 25, 4, '提升自身攻击力', { stat: 'attack', value: 25, duration: 3 }),
  createSkill('focus_energy', '聚气', 'buff', 'thunder', 0, 20, 3, '提升攻击力', { stat: 'attack', value: 20, duration: 3 }),
  createSkill('haste', '疾风步', 'buff', 'wind', 0, 20, 3, '提升速度', { stat: 'speed', value: 30, duration: 3 }),
  createSkill('weaken', '虚弱', 'debuff', 'dark', 0, 25, 4, '降低敌人攻击力', { stat: 'attack', value: -20, duration: 3 }),
  createSkill('slow', '减速', 'debuff', 'water', 0, 20, 3, '降低敌人速度', { stat: 'speed', value: -25, duration: 3 }),
];

export const getSkill = (id: string): Skill | undefined => {
  return SKILLS.find(s => s.id === id);
};

const createSpecies = (
  id: string, name: string, description: string, element: ElementType,
  baseRarity: Rarity, baseStats: SpiritSpecies['baseStats'],
  possibleSkills: string[], evolutionChain: SpiritSpecies['evolutionChain'],
  preferredWeather: Weather[], preferredPlants: string[], sprite: string
): SpiritSpecies => ({
  id, name, description, element, baseRarity, baseStats,
  possibleSkills: possibleSkills.map(id => SKILLS.find(s => s.id === id)!).filter(Boolean),
  evolutionChain, preferredWeather, preferredPlants, sprite
});

export const SPIRIT_SPECIES: SpiritSpecies[] = [
  createSpecies('flame_wisp', '火焰小精灵', '由火焰凝聚而成的小精灵', 'fire', 'common',
    { hp: 80, maxHp: 80, energy: 100, maxEnergy: 100, attack: 22, defense: 15, speed: 20 },
    ['fireball', 'battle_cry'],
    [{ stage: 1, level: 1, formName: '火焰小精灵', newSkills: [], statMultiplier: 1 },
     { stage: 2, level: 15, formName: '烈焰精灵', newSkills: ['flame_burst'], statMultiplier: 1.5 },
     { stage: 3, level: 35, formName: '炎魔', newSkills: ['fire_shield'], statMultiplier: 2.2 }],
    ['sunny', 'magical'], ['fire_flower', 'ember_rose'], '🔥'),
  createSpecies('aqua_sprite', '水滴精灵', '清澈水灵的水之精灵', 'water', 'common',
    { hp: 90, maxHp: 90, energy: 100, maxEnergy: 100, attack: 18, defense: 20, speed: 18 },
    ['water_gun', 'slow'],
    [{ stage: 1, level: 1, formName: '水滴精灵', newSkills: [], statMultiplier: 1 },
     { stage: 2, level: 15, formName: '涌泉精灵', newSkills: ['water_barrier'], statMultiplier: 1.5 },
     { stage: 3, level: 35, formName: '海皇', newSkills: ['tidal_wave'], statMultiplier: 2.2 }],
    ['rainy', 'rainbow'], ['water_lily', 'blue_bloom'], '💧'),
  createSpecies('leaf_fairy', '叶之妖精', '森林中的植物精灵', 'grass', 'common',
    { hp: 85, maxHp: 85, energy: 100, maxEnergy: 100, attack: 19, defense: 19, speed: 19 },
    ['vine_whip', 'nature_blessing'],
    [{ stage: 1, level: 1, formName: '叶之妖精', newSkills: [], statMultiplier: 1 },
     { stage: 2, level: 15, formName: '花之精灵', newSkills: ['spikes'], statMultiplier: 1.5 },
     { stage: 3, level: 35, formName: '森林守护者', newSkills: ['solar_beam'], statMultiplier: 2.2 }],
    ['sunny', 'rainy'], ['sunflower', 'green_vine'], '🌿'),
  createSpecies('spark_mouse', '雷电小鼠', '带电的活泼小生物', 'thunder', 'common',
    { hp: 75, maxHp: 75, energy: 100, maxEnergy: 100, attack: 24, defense: 14, speed: 25 },
    ['thunder_shock', 'focus_energy'],
    [{ stage: 1, level: 1, formName: '雷电小鼠', newSkills: [], statMultiplier: 1 },
     { stage: 2, level: 15, formName: '闪电兽', newSkills: ['haste'], statMultiplier: 1.5 },
     { stage: 3, level: 35, formName: '雷神', newSkills: ['thunder_storm'], statMultiplier: 2.2 }],
    ['thunderstorm'], ['thunder_plant', 'static_bloom'], '⚡'),
  createSpecies('light_spirit', '光明精灵', '散发圣光的神圣精灵', 'light', 'uncommon',
    { hp: 88, maxHp: 88, energy: 110, maxEnergy: 110, attack: 21, defense: 21, speed: 20 },
    ['holy_light', 'heal'],
    [{ stage: 1, level: 1, formName: '光明精灵', newSkills: [], statMultiplier: 1 },
     { stage: 2, level: 20, formName: '圣光使者', newSkills: ['fire_shield'], statMultiplier: 1.6 },
     { stage: 3, level: 40, formName: '炽天使', newSkills: ['nature_blessing'], statMultiplier: 2.4 }],
    ['sunny', 'rainbow'], ['light_flower', 'sacred_bloom'], '✨'),
  createSpecies('shadow_cat', '暗影猫', '潜伏在黑暗中的神秘精灵', 'dark', 'uncommon',
    { hp: 82, maxHp: 82, energy: 105, maxEnergy: 105, attack: 25, defense: 16, speed: 23 },
    ['shadow_strike', 'weaken'],
    [{ stage: 1, level: 1, formName: '暗影猫', newSkills: [], statMultiplier: 1 },
     { stage: 2, level: 20, formName: '夜行者', newSkills: ['life_steal'], statMultiplier: 1.6 },
     { stage: 3, level: 40, formName: '虚空领主', newSkills: ['thunder_storm'], statMultiplier: 2.4 }],
    ['cloudy', 'magical'], ['dark_rose', 'void_mushroom'], '🌑'),
  createSpecies('wind_bird', '风之鸟', '翱翔天空的自由精灵', 'wind', 'uncommon',
    { hp: 78, maxHp: 78, energy: 100, maxEnergy: 100, attack: 22, defense: 15, speed: 30 },
    ['gust', 'haste'],
    [{ stage: 1, level: 1, formName: '风之鸟', newSkills: [], statMultiplier: 1 },
     { stage: 2, level: 18, formName: '疾风之翼', newSkills: ['slow'], statMultiplier: 1.55 },
     { stage: 3, level: 38, formName: '风暴神鹰', newSkills: ['tidal_wave'], statMultiplier: 2.3 }],
    ['sunny', 'cloudy'], ['wind_flower', 'sky_herb'], '🪶'),
  createSpecies('rock_golem', '岩石傀儡', '由山石凝聚的强壮精灵', 'earth', 'uncommon',
    { hp: 110, maxHp: 110, energy: 90, maxEnergy: 90, attack: 20, defense: 28, speed: 12 },
    ['rock_throw', 'iron_wall'],
    [{ stage: 1, level: 1, formName: '岩石傀儡', newSkills: [], statMultiplier: 1 },
     { stage: 2, level: 20, formName: '山岳巨人', newSkills: ['spikes'], statMultiplier: 1.6 },
     { stage: 3, level: 40, formName: '大地泰坦', newSkills: ['flame_burst'], statMultiplier: 2.4 }],
    ['snowy', 'cloudy'], ['stone_fruit', 'earth_root'], '🗿'),
  createSpecies('phoenix_chick', '凤凰雏鸟', '传说中不死鸟的幼体', 'fire', 'rare',
    { hp: 100, maxHp: 100, energy: 120, maxEnergy: 120, attack: 28, defense: 20, speed: 24 },
    ['fireball', 'flame_burst', 'heal'],
    [{ stage: 1, level: 1, formName: '凤凰雏鸟', newSkills: [], statMultiplier: 1 },
     { stage: 2, level: 25, formName: '火凤凰', newSkills: ['fire_shield', 'battle_cry'], statMultiplier: 1.8 },
     { stage: 3, level: 45, formName: '不死鸟', newSkills: ['nature_blessing'], statMultiplier: 2.8 }],
    ['sunny', 'magical', 'rainbow'], ['fire_flower', 'ember_rose', 'phoenix_feather_plant'], '🐦‍🔥'),
  createSpecies('dragon_whelp', '幼龙', '远古巨龙的后裔', 'fire', 'epic',
    { hp: 130, maxHp: 130, energy: 130, maxEnergy: 130, attack: 35, defense: 25, speed: 22 },
    ['fireball', 'flame_burst', 'battle_cry', 'iron_wall'],
    [{ stage: 1, level: 1, formName: '幼龙', newSkills: [], statMultiplier: 1 },
     { stage: 2, level: 30, formName: '飞龙', newSkills: ['thunder_storm'], statMultiplier: 2 },
     { stage: 3, level: 50, formName: '远古巨龙', newSkills: ['solar_beam'], statMultiplier: 3.2 }],
    ['magical', 'sunny'], ['dragon_scale_plant', 'ember_rose', 'phoenix_feather_plant'], '🐉'),
  createSpecies('celestial_stag', '星辰天鹿', '来自星空的神秘生物', 'light', 'legendary',
    { hp: 150, maxHp: 150, energy: 150, maxEnergy: 150, attack: 40, defense: 35, speed: 35 },
    ['holy_light', 'heal', 'nature_blessing', 'haste', 'focus_energy'],
    [{ stage: 1, level: 1, formName: '星辰天鹿', newSkills: [], statMultiplier: 1 },
     { stage: 2, level: 40, formName: '银河神兽', newSkills: ['solar_beam', 'flame_burst'], statMultiplier: 2.5 },
     { stage: 3, level: 60, formName: '宇宙之王', newSkills: ['thunder_storm', 'tidal_wave'], statMultiplier: 4 }],
    ['rainbow', 'magical'], ['sacred_bloom', 'light_flower', 'starlight_orchid'], '🦌'),
];

export const getSpiritSpecies = (id: string): SpiritSpecies | undefined => {
  return SPIRIT_SPECIES.find(s => s.id === id);
};

export const PLANT_SPECIES: PlantSpecies[] = [
  { id: 'fire_flower', name: '火焰花', description: '散发温暖的魔法花朵', element: 'fire', growthTime: 60000, fruitYield: 2, fruitType: 'fire_fruit', attractsSpirits: ['flame_wisp'], attractionBonus: 1.5, rarityBonus: 1.1, cost: 50, sprite: '🌺' },
  { id: 'water_lily', name: '水莲', description: '漂浮在魔法水面上的莲花', element: 'water', growthTime: 60000, fruitYield: 2, fruitType: 'water_fruit', attractsSpirits: ['aqua_sprite'], attractionBonus: 1.5, rarityBonus: 1.1, cost: 50, sprite: '🪷' },
  { id: 'sunflower', name: '魔法向日葵', description: '追踪阳光的金黄花朵', element: 'grass', growthTime: 50000, fruitYield: 3, fruitType: 'grass_fruit', attractsSpirits: ['leaf_fairy'], attractionBonus: 1.4, rarityBonus: 1.1, cost: 40, sprite: '🌻' },
  { id: 'green_vine', name: '翠绿藤蔓', description: '快速生长的魔法藤蔓', element: 'grass', growthTime: 40000, fruitYield: 2, fruitType: 'grass_fruit', attractsSpirits: ['leaf_fairy'], attractionBonus: 1.3, rarityBonus: 1.0, cost: 30, sprite: '🌱' },
  { id: 'thunder_plant', name: '雷电草', description: '带静电的神奇植物', element: 'thunder', growthTime: 70000, fruitYield: 2, fruitType: 'thunder_fruit', attractsSpirits: ['spark_mouse'], attractionBonus: 1.5, rarityBonus: 1.15, cost: 60, sprite: '🌵' },
  { id: 'light_flower', name: '光绽花', description: '在黑暗中发光的花朵', element: 'light', growthTime: 90000, fruitYield: 1, fruitType: 'light_fruit', attractsSpirits: ['light_spirit'], attractionBonus: 1.6, rarityBonus: 1.25, cost: 120, sprite: '🌸' },
  { id: 'dark_rose', name: '暗影玫瑰', description: '吸收光线的神秘玫瑰', element: 'dark', growthTime: 90000, fruitYield: 1, fruitType: 'dark_fruit', attractsSpirits: ['shadow_cat'], attractionBonus: 1.6, rarityBonus: 1.25, cost: 120, sprite: '🥀' },
  { id: 'wind_flower', name: '风信子', description: '随风摇曳的魔法花朵', element: 'wind', growthTime: 55000, fruitYield: 2, fruitType: 'wind_fruit', attractsSpirits: ['wind_bird'], attractionBonus: 1.5, rarityBonus: 1.1, cost: 55, sprite: '💐' },
  { id: 'stone_fruit', name: '石果树', description: '结出坚硬果实的树', element: 'earth', growthTime: 80000, fruitYield: 2, fruitType: 'earth_fruit', attractsSpirits: ['rock_golem'], attractionBonus: 1.5, rarityBonus: 1.2, cost: 80, sprite: '🌳' },
  { id: 'ember_rose', name: '余烬蔷薇', description: '稀有火焰蔷薇', element: 'fire', growthTime: 120000, fruitYield: 1, fruitType: 'fire_fruit', attractsSpirits: ['flame_wisp', 'phoenix_chick', 'dragon_whelp'], attractionBonus: 2.0, rarityBonus: 1.5, cost: 300, sprite: '🌹' },
  { id: 'blue_bloom', name: '碧蓝花苞', description: '深海绽放的稀有花朵', element: 'water', growthTime: 120000, fruitYield: 1, fruitType: 'water_fruit', attractsSpirits: ['aqua_sprite'], attractionBonus: 2.0, rarityBonus: 1.4, cost: 250, sprite: '💎' },
  { id: 'static_bloom', name: '静电磁花', description: '雷电属性稀有花朵', element: 'thunder', growthTime: 120000, fruitYield: 1, fruitType: 'thunder_fruit', attractsSpirits: ['spark_mouse', 'dragon_whelp'], attractionBonus: 1.9, rarityBonus: 1.45, cost: 280, sprite: '💠' },
  { id: 'sacred_bloom', name: '圣辉花', description: '神圣属性的传说之花', element: 'light', growthTime: 180000, fruitYield: 1, fruitType: 'light_fruit', attractsSpirits: ['light_spirit', 'celestial_stag'], attractionBonus: 2.5, rarityBonus: 2.0, cost: 800, sprite: '🌟' },
  { id: 'void_mushroom', name: '虚空蘑菇', description: '来自虚空的神秘蘑菇', element: 'dark', growthTime: 150000, fruitYield: 1, fruitType: 'dark_fruit', attractsSpirits: ['shadow_cat'], attractionBonus: 2.2, rarityBonus: 1.7, cost: 500, sprite: '🍄' },
  { id: 'sky_herb', name: '天空草药', description: '只在高空生长的草药', element: 'wind', growthTime: 100000, fruitYield: 2, fruitType: 'wind_fruit', attractsSpirits: ['wind_bird'], attractionBonus: 1.8, rarityBonus: 1.3, cost: 180, sprite: '☁️' },
  { id: 'earth_root', name: '大地之根', description: '深入地底的古老根系', element: 'earth', growthTime: 130000, fruitYield: 1, fruitType: 'earth_fruit', attractsSpirits: ['rock_golem'], attractionBonus: 1.9, rarityBonus: 1.4, cost: 220, sprite: '🪨' },
  { id: 'phoenix_feather_plant', name: '凤凰羽草', description: '如凤凰羽毛般的神草', element: 'fire', growthTime: 240000, fruitYield: 1, fruitType: 'fire_fruit', attractsSpirits: ['phoenix_chick', 'dragon_whelp'], attractionBonus: 3.0, rarityBonus: 2.5, cost: 1500, sprite: '🪶' },
  { id: 'dragon_scale_plant', name: '龙鳞蕨', description: '如龙鳞般的远古蕨类', element: 'fire', growthTime: 300000, fruitYield: 1, fruitType: 'fire_fruit', attractsSpirits: ['dragon_whelp'], attractionBonus: 3.5, rarityBonus: 3.0, cost: 3000, sprite: '🐲' },
  { id: 'starlight_orchid', name: '星光兰花', description: '星辰之力凝聚的兰花', element: 'light', growthTime: 360000, fruitYield: 1, fruitType: 'light_fruit', attractsSpirits: ['celestial_stag'], attractionBonus: 4.0, rarityBonus: 3.5, cost: 5000, sprite: '🌠' },
];

export const getPlantSpecies = (id: string): PlantSpecies | undefined => {
  return PLANT_SPECIES.find(p => p.id === id);
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

export const BALL_TYPES: BallType[] = [
  { id: 'basic_ball', name: '普通精灵球', baseCaptureRate: 0.3, rarityBonus: { common: 1, uncommon: 0.8, rare: 0.5, epic: 0.3, legendary: 0.1, mythic: 0.05 }, description: '基础的精灵捕获球', cost: 50, sprite: '🔴' },
  { id: 'great_ball', name: '高级球', baseCaptureRate: 0.5, rarityBonus: { common: 1.2, uncommon: 1, rare: 0.7, epic: 0.45, legendary: 0.2, mythic: 0.08 }, description: '捕获率提升的高级球', cost: 200, sprite: '🔵' },
  { id: 'ultra_ball', name: '究极球', baseCaptureRate: 0.7, rarityBonus: { common: 1.5, uncommon: 1.3, rare: 1, epic: 0.7, legendary: 0.35, mythic: 0.15 }, description: '高捕获率的究极球', cost: 600, sprite: '⚫' },
  { id: 'master_ball', name: '大师球', baseCaptureRate: 0.95, rarityBonus: { common: 1, uncommon: 1, rare: 1, epic: 1, legendary: 0.9, mythic: 0.7 }, description: '几乎必定捕获的大师球', cost: 5000, sprite: '🟣' },
  { id: 'fire_ball', name: '火焰球', baseCaptureRate: 0.4, rarityBonus: { common: 1, uncommon: 0.9, rare: 0.6, epic: 0.35, legendary: 0.15, mythic: 0.06 }, elementBonus: { fire: 1.8 }, description: '对火属性精灵效果拔群', cost: 150, sprite: '🔴' },
  { id: 'water_ball', name: '水珠球', baseCaptureRate: 0.4, rarityBonus: { common: 1, uncommon: 0.9, rare: 0.6, epic: 0.35, legendary: 0.15, mythic: 0.06 }, elementBonus: { water: 1.8 }, description: '对水属性精灵效果拔群', cost: 150, sprite: '🔵' },
  { id: 'grass_ball', name: '草叶球', baseCaptureRate: 0.4, rarityBonus: { common: 1, uncommon: 0.9, rare: 0.6, epic: 0.35, legendary: 0.15, mythic: 0.06 }, elementBonus: { grass: 1.8 }, description: '对草属性精灵效果拔群', cost: 150, sprite: '🟢' },
  { id: 'thunder_ball', name: '雷电球', baseCaptureRate: 0.4, rarityBonus: { common: 1, uncommon: 0.9, rare: 0.6, epic: 0.35, legendary: 0.15, mythic: 0.06 }, elementBonus: { thunder: 1.8 }, description: '对雷属性精灵效果拔群', cost: 150, sprite: '🟡' },
];

export const getBallType = (id: string): BallType | undefined => {
  return BALL_TYPES.find(b => b.id === id);
};
