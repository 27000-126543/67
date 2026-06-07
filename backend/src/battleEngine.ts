import { v4 as uuidv4 } from 'uuid';
import { Spirit, ActiveBattle, BattleTurn, Skill, BattleRecord } from './types';
import { clamp, randomInt } from './gameEngine';

export const createActiveBattle = (
  player1Id: string,
  player2Id: string,
  spirit1: Spirit,
  spirit2: Spirit
): ActiveBattle => {
  const spirit1Copy = JSON.parse(JSON.stringify(spirit1)) as Spirit;
  const spirit2Copy = JSON.parse(JSON.stringify(spirit2)) as Spirit;
  spirit1Copy.stats.hp = spirit1Copy.stats.maxHp;
  spirit1Copy.stats.energy = spirit1Copy.stats.maxEnergy;
  spirit1Copy.skills.forEach(s => s.currentCooldown = 0);
  spirit2Copy.stats.hp = spirit2Copy.stats.maxHp;
  spirit2Copy.stats.energy = spirit2Copy.stats.maxEnergy;
  spirit2Copy.skills.forEach(s => s.currentCooldown = 0);

  const firstPlayer = spirit1Copy.stats.speed >= spirit2Copy.stats.speed ? player1Id : player2Id;

  return {
    id: uuidv4(),
    player1Id,
    player2Id,
    player1Spirit: spirit1Copy,
    player2Spirit: spirit2Copy,
    currentTurn: 1,
    activePlayerId: firstPlayer,
    battleLog: [],
    startTime: Date.now(),
    isFinished: false,
    winnerId: null,
    effects: {
      player1: {},
      player2: {},
    },
  };
};

const getActiveSpirit = (battle: ActiveBattle, playerId: string): Spirit => {
  return playerId === battle.player1Id ? battle.player1Spirit : battle.player2Spirit;
};

const getOpponentSpirit = (battle: ActiveBattle, playerId: string): Spirit => {
  return playerId === battle.player1Id ? battle.player2Spirit : battle.player1Spirit;
};

const applyStatEffects = (spirit: Spirit, effects: { [stat: string]: { value: number; remainingTurns: number } }): Spirit => {
  const modified = { ...spirit, stats: { ...spirit.stats } };
  Object.entries(effects).forEach(([stat, effect]) => {
    if (effect.remainingTurns > 0) {
      if (stat === 'attack') modified.stats.attack = clamp(modified.stats.attack + effect.value, 1, 9999);
      if (stat === 'defense') modified.stats.defense = clamp(modified.stats.defense + effect.value, 1, 9999);
      if (stat === 'speed') modified.stats.speed = clamp(modified.stats.speed + effect.value, 1, 9999);
    }
  });
  return modified;
};

const getElementMultiplier = (attackElement: string, defenseElement: string): number => {
  const advantages: { [key: string]: string[] } = {
    fire: ['grass', 'wind'],
    water: ['fire', 'earth'],
    grass: ['water', 'earth'],
    thunder: ['water', 'wind'],
    light: ['dark'],
    dark: ['light'],
    wind: ['grass', 'earth'],
    earth: ['thunder', 'fire'],
  };
  const disadvantages: { [key: string]: string[] } = {
    fire: ['water', 'earth'],
    water: ['thunder', 'grass'],
    grass: ['fire', 'wind'],
    thunder: ['earth', 'grass'],
    light: [],
    dark: [],
    wind: ['thunder', 'fire'],
    earth: ['water', 'grass'],
  };

  if (advantages[attackElement]?.includes(defenseElement)) return 1.5;
  if (disadvantages[attackElement]?.includes(defenseElement)) return 0.7;
  return 1;
};

export const executeSkill = (
  battle: ActiveBattle,
  playerId: string,
  skillId: string
): { battle: ActiveBattle; turn: BattleTurn } => {
  if (battle.isFinished) throw new Error('战斗已结束');
  if (battle.activePlayerId !== playerId) throw new Error('不是你的回合');

  const activeSpirit = getActiveSpirit(battle, playerId);
  const opponentSpirit = getOpponentSpirit(battle, playerId);
  const skill = activeSpirit.skills.find(s => s.id === skillId);

  if (!skill) throw new Error('技能不存在');
  if (skill.currentCooldown > 0) throw new Error('技能冷却中');
  if (activeSpirit.stats.energy < skill.energyCost) throw new Error('能量不足');

  const playerKey = playerId === battle.player1Id ? 'player1' : 'player2';
  const opponentKey = playerId === battle.player1Id ? 'player2' : 'player1';

  const activeWithEffects = applyStatEffects(activeSpirit, battle.effects[playerKey]);
  const opponentWithEffects = applyStatEffects(opponentSpirit, battle.effects[opponentKey]);

  const turn: BattleTurn = {
    turnNumber: battle.currentTurn,
    actorId: playerId,
    action: 'skill',
    skillId,
  };

  const elementMult = getElementMultiplier(skill.element, opponentWithEffects.element);

  if (skill.type === 'attack') {
    const baseDamage = skill.power + activeWithEffects.stats.attack * 0.5;
    const defense = opponentWithEffects.stats.defense * 0.4;
    const variance = 0.9 + Math.random() * 0.2;
    const damage = Math.max(1, Math.floor((baseDamage - defense) * elementMult * variance));
    opponentSpirit.stats.hp = clamp(opponentSpirit.stats.hp - damage, 0, opponentSpirit.stats.maxHp);
    turn.damage = damage;

    if (skill.effect?.dotDamage && skill.effect.dotDuration) {
      if (!battle.effects[opponentKey]['dot']) {
        battle.effects[opponentKey]['dot'] = { value: skill.effect.dotDamage, remainingTurns: skill.effect.dotDuration };
      }
      turn.effectsApplied = turn.effectsApplied || [];
      turn.effectsApplied.push('灼烧');
    }
  } else if (skill.type === 'heal') {
    const healAmount = skill.effect?.healAmount || skill.power;
    activeSpirit.stats.hp = clamp(activeSpirit.stats.hp + healAmount, 0, activeSpirit.stats.maxHp);
    turn.heal = healAmount;
  } else if (skill.type === 'buff' && skill.effect?.stat && skill.effect.value && skill.effect.duration) {
    battle.effects[playerKey][skill.effect.stat] = {
      value: skill.effect.value,
      remainingTurns: skill.effect.duration,
    };
    turn.effectsApplied = turn.effectsApplied || [];
    turn.effectsApplied.push(`${skill.effect.stat}提升`);
  } else if (skill.type === 'defense' && skill.effect?.stat && skill.effect.value && skill.effect.duration) {
    battle.effects[playerKey][skill.effect.stat] = {
      value: skill.effect.value,
      remainingTurns: skill.effect.duration,
    };
    turn.effectsApplied = turn.effectsApplied || [];
    turn.effectsApplied.push(`防御提升`);
  } else if (skill.type === 'debuff' && skill.effect?.stat && skill.effect.value && skill.effect.duration) {
    battle.effects[opponentKey][skill.effect.stat] = {
      value: skill.effect.value,
      remainingTurns: skill.effect.duration,
    };
    turn.effectsApplied = turn.effectsApplied || [];
    turn.effectsApplied.push(`敌方${skill.effect.stat}下降`);
  }

  activeSpirit.stats.energy -= skill.energyCost;
  skill.currentCooldown = skill.cooldown;

  if (opponentSpirit.stats.hp <= 0) {
    battle.isFinished = true;
    battle.winnerId = playerId;
  }

  battle.battleLog.push(turn);

  if (!battle.isFinished) {
    battle.currentTurn++;
    battle.activePlayerId = battle.activePlayerId === battle.player1Id ? battle.player2Id : battle.player1Id;

    const nextActive = getActiveSpirit(battle, battle.activePlayerId);
    const nextKey = battle.activePlayerId === battle.player1Id ? 'player1' : 'player2';

    const dotEffect = battle.effects[nextKey]['dot'];
    if (dotEffect && dotEffect.remainingTurns > 0) {
      nextActive.stats.hp = clamp(nextActive.stats.hp - dotEffect.value, 0, nextActive.stats.maxHp);
      dotEffect.remainingTurns--;
      if (nextActive.stats.hp <= 0) {
        battle.isFinished = true;
        battle.winnerId = battle.activePlayerId === battle.player1Id ? battle.player2Id : battle.player1Id;
      }
    }

    battle.player1Spirit.skills.forEach(s => {
      if (s.currentCooldown > 0) s.currentCooldown--;
    });
    battle.player2Spirit.skills.forEach(s => {
      if (s.currentCooldown > 0) s.currentCooldown--;
    });

    battle.player1Spirit.stats.energy = clamp(battle.player1Spirit.stats.energy + 15, 0, battle.player1Spirit.stats.maxEnergy);
    battle.player2Spirit.stats.energy = clamp(battle.player2Spirit.stats.energy + 15, 0, battle.player2Spirit.stats.maxEnergy);

    Object.keys(battle.effects.player1).forEach(k => {
      if (k !== 'dot' && battle.effects.player1[k].remainingTurns > 0) {
        battle.effects.player1[k].remainingTurns--;
      }
    });
    Object.keys(battle.effects.player2).forEach(k => {
      if (k !== 'dot' && battle.effects.player2[k].remainingTurns > 0) {
        battle.effects.player2[k].remainingTurns--;
      }
    });
  }

  return { battle, turn };
};

export const calculateScoreChange = (winnerScore: number, loserScore: number): { winnerChange: number; loserChange: number } => {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserScore - winnerScore) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerScore - loserScore) / 400));
  const k = 32;

  const winnerChange = Math.round(k * (1 - expectedWinner));
  const loserChange = Math.round(k * (0 - expectedLoser));

  return { winnerChange, loserChange };
};

export const createBattleRecord = (
  battle: ActiveBattle,
  winnerScoreChange: number,
  loserScoreChange: number
): BattleRecord => {
  const loserId = battle.winnerId === battle.player1Id ? battle.player2Id : battle.player1Id;
  return {
    id: uuidv4(),
    player1Id: battle.player1Id,
    player2Id: battle.player2Id,
    player1SpiritId: battle.player1Spirit.id,
    player2SpiritId: battle.player2Spirit.id,
    winnerId: battle.winnerId!,
    player1ScoreChange: battle.winnerId === battle.player1Id ? winnerScoreChange : loserScoreChange,
    player2ScoreChange: battle.winnerId === battle.player2Id ? winnerScoreChange : loserScoreChange,
    timestamp: Date.now(),
    turns: battle.battleLog,
  };
};

export const simulateAIAction = (battle: ActiveBattle, aiPlayerId: string): string => {
  const spirit = getActiveSpirit(battle, aiPlayerId);
  const availableSkills = spirit.skills.filter(s => s.currentCooldown === 0 && spirit.stats.energy >= s.energyCost);

  if (availableSkills.length === 0) return '';

  const hpPercent = spirit.stats.hp / spirit.stats.maxHp;
  const healSkills = availableSkills.filter(s => s.type === 'heal');
  const attackSkills = availableSkills.filter(s => s.type === 'attack');
  const buffSkills = availableSkills.filter(s => s.type === 'buff' || s.type === 'defense');

  if (hpPercent < 0.35 && healSkills.length > 0) {
    return healSkills[randomInt(0, healSkills.length - 1)].id;
  }

  if (Math.random() < 0.15 && buffSkills.length > 0) {
    return buffSkills[randomInt(0, buffSkills.length - 1)].id;
  }

  if (attackSkills.length > 0) {
    return attackSkills.sort((a, b) => b.power - a.power)[0].id;
  }

  return availableSkills[randomInt(0, availableSkills.length - 1)].id;
};
