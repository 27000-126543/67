import {
  Player, Spirit, Guild, TradeListing, TradeHistory, ActiveBattle,
  BattleRecord, WeeklyReport, Announcement, Rarity, ElementType
} from './types';
import { createPlayer } from './gameEngine';

class GameState {
  private players: Map<string, Player> = new Map();
  private guilds: Map<string, Guild> = new Map();
  private tradeListings: Map<string, TradeListing> = new Map();
  private tradeHistory: TradeHistory[] = [];
  private activeBattles: Map<string, ActiveBattle> = new Map();
  private battleRecords: BattleRecord[] = [];
  private weeklyReports: WeeklyReport[] = [];
  private announcements: Announcement[] = [];
  private matchmakingQueue: { playerId: string; spiritId: string; timestamp: number }[] = [];

  constructor() {
    this.initializeWithSampleData();
  }

  private initializeWithSampleData() {
    const samplePlayers = ['魔法师小明', '精灵大师阿花', '驯兽师老王', '元素使莉莉', '暗影猎手阿杰'];
    samplePlayers.forEach((name, i) => {
      const player = createPlayer(name);
      player.coins += i * 200;
      player.gems += i * 10;
      player.arenaScore += i * 50;
      this.players.set(player.id, player);
    });

    this.addAnnouncement({
      id: 'sys_1',
      type: 'system',
      message: '🎮 欢迎来到魔法精灵世界！精灵花园竞技系统已启动！',
      timestamp: Date.now(),
    });
  }

  getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  getPlayerByUsername(username: string): Player | undefined {
    for (const player of this.players.values()) {
      if (player.username === username) return player;
    }
    return undefined;
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  addPlayer(player: Player): void {
    this.players.set(player.id, player);
  }

  updatePlayer(player: Player): void {
    this.players.set(player.id, player);
  }

  getGuild(id: string): Guild | undefined {
    return this.guilds.get(id);
  }

  getAllGuilds(): Guild[] {
    return Array.from(this.guilds.values());
  }

  addGuild(guild: Guild): void {
    this.guilds.set(guild.id, guild);
  }

  updateGuild(guild: Guild): void {
    this.guilds.set(guild.id, guild);
  }

  deleteGuild(id: string): void {
    this.guilds.delete(id);
  }

  getTradeListing(id: string): TradeListing | undefined {
    return this.tradeListings.get(id);
  }

  getAllTradeListings(): TradeListing[] {
    return Array.from(this.tradeListings.values());
  }

  addTradeListing(listing: TradeListing): void {
    this.tradeListings.set(listing.id, listing);
  }

  removeTradeListing(id: string): void {
    this.tradeListings.delete(id);
  }

  getTradeHistory(itemType?: string): TradeHistory[] {
    if (!itemType) return [...this.tradeHistory];
    return this.tradeHistory.filter(t => t.itemType === itemType);
  }

  addTradeHistory(record: TradeHistory): void {
    this.tradeHistory.push(record);
    if (this.tradeHistory.length > 10000) {
      this.tradeHistory = this.tradeHistory.slice(-10000);
    }
  }

  getActiveBattle(id: string): ActiveBattle | undefined {
    return this.activeBattles.get(id);
  }

  getAllActiveBattles(): ActiveBattle[] {
    return Array.from(this.activeBattles.values());
  }

  addActiveBattle(battle: ActiveBattle): void {
    this.activeBattles.set(battle.id, battle);
  }

  updateActiveBattle(battle: ActiveBattle): void {
    this.activeBattles.set(battle.id, battle);
  }

  removeActiveBattle(id: string): void {
    this.activeBattles.delete(id);
  }

  getBattleRecords(limit: number = 100): BattleRecord[] {
    return this.battleRecords.slice(-limit);
  }

  addBattleRecord(record: BattleRecord): void {
    this.battleRecords.push(record);
    if (this.battleRecords.length > 5000) {
      this.battleRecords = this.battleRecords.slice(-5000);
    }
  }

  getWeeklyReports(): WeeklyReport[] {
    return [...this.weeklyReports];
  }

  addWeeklyReport(report: WeeklyReport): void {
    this.weeklyReports.push(report);
  }

  getAnnouncements(limit: number = 50): Announcement[] {
    return this.announcements.slice(-limit).reverse();
  }

  addAnnouncement(announcement: Announcement): void {
    this.announcements.push(announcement);
    if (this.announcements.length > 200) {
      this.announcements = this.announcements.slice(-200);
    }
  }

  getMatchmakingQueue(): typeof this.matchmakingQueue {
    return [...this.matchmakingQueue];
  }

  addToMatchmakingQueue(entry: { playerId: string; spiritId: string; timestamp: number }): void {
    this.matchmakingQueue.push(entry);
  }

  removeFromMatchmakingQueue(playerId: string): void {
    this.matchmakingQueue = this.matchmakingQueue.filter(e => e.playerId !== playerId);
  }

  getSuggestedPrice(itemType: string, itemId: string, spiritRarity?: Rarity, spiritElement?: ElementType): number {
    const relevantHistory = this.tradeHistory.filter(t => {
      if (t.itemType !== itemType) return false;
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return t.timestamp > sevenDaysAgo;
    });

    if (relevantHistory.length === 0) {
      if (itemType === 'spirit' && spiritRarity) {
        const basePrices: { [key in Rarity]: number } = {
          common: 100,
          uncommon: 300,
          rare: 1000,
          epic: 5000,
          legendary: 20000,
          mythic: 100000,
        };
        return basePrices[spiritRarity] || 100;
      }
      return 100;
    }

    const avg = relevantHistory.reduce((sum, t) => sum + t.price, 0) / relevantHistory.length;
    return Math.round(avg);
  }

  getCollectionLeaderboard(limit: number = 20) {
    return this.getAllPlayers()
      .map(p => ({
        id: p.id,
        name: p.displayName,
        avatar: p.avatar,
        score: p.collectionScore + p.collectedSpecies.size * 100,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((e, i, arr) => ({
        ...e,
        rank: i + 1,
        previousRank: i + 1,
        change: 'same' as const,
      }));
  }

  getArenaLeaderboard(limit: number = 20) {
    return this.getAllPlayers()
      .map(p => ({
        id: p.id,
        name: p.displayName,
        avatar: p.avatar,
        score: p.arenaScore,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((e, i, arr) => ({
        ...e,
        rank: i + 1,
        previousRank: i + 1,
        change: 'same' as const,
      }));
  }

  getGuildLeaderboard(limit: number = 20) {
    return this.getAllGuilds()
      .map(g => ({
        id: g.id,
        name: g.name,
        avatar: '🏰',
        score: g.level * 1000 + g.memberIds.length * 100 + g.jointArena.level * 500,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((e, i, arr) => ({
        ...e,
        rank: i + 1,
        previousRank: i + 1,
        change: 'same' as const,
      }));
  }
}

export const gameState = new GameState();
