import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  Player, Spirit, Guild, GuildRole, TradeListing, Announcement,
  ElementType, Rarity
} from './types';
import { gameState } from './gameState';
import {
  createPlayer, plantSeed, updatePlantGrowth, harvestPlant, removeHarvestedPlant,
  createSpirit, generateWildEncounter, attemptCapture, levelUpSpirit,
  evolveSpirit, breedSpirits, createGarden, getRandomWeather, calculateSpiritAppearance,
  randomInt,
} from './gameEngine';
import {
  createActiveBattle, executeSkill, calculateScoreChange, createBattleRecord, simulateAIAction,
} from './battleEngine';
import { generateWeeklyReport, exportReportToPDF } from './reportGenerator';
import { PLANT_SPECIES, SPIRIT_SPECIES, BALL_TYPES, getPlantSpecies, getSpiritSpecies, getBallType } from './gameData';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' },
});

const PORT = process.env.PORT || 3001;

const broadcastAnnouncement = (announcement: Announcement) => {
  gameState.addAnnouncement(announcement);
  io.emit('announcement', announcement);
};

setInterval(() => {
  const allPlayers = gameState.getAllPlayers();
  allPlayers.forEach(player => {
    const growthResult = updatePlantGrowth(player.garden);
    if (player.guildId) {
      const guild = gameState.getGuild(player.guildId);
      if (guild) {
        updatePlantGrowth(guild.jointGarden);
      }
    }
    if (Date.now() > player.garden.weatherExpiryTime) {
      player.garden.currentWeather = getRandomWeather();
      player.garden.weatherExpiryTime = Date.now() + 1800000;
    }
    const readyPlants = player.garden.plants.filter(p => p.isReady && !p.harvested);
    if (readyPlants.length > 0 && player.garden.attractedSpirits.filter(e => !e.isCaptured && Date.now() < e.expiresAt).length < 3) {
      if (Math.random() < 0.3) {
        const encounter = generateWildEncounter(player.garden);
        if (encounter) {
          player.garden.attractedSpirits.push(encounter);
          io.to(player.id).emit('spirit_appeared', encounter);
        }
      }
    }
    player.garden.attractedSpirits = player.garden.attractedSpirits.filter(e => Date.now() < e.expiresAt || e.isCaptured);
    gameState.updatePlayer(player);
  });
}, 5000);

setInterval(() => {
  const queue = gameState.getMatchmakingQueue();
  const now = Date.now();

  for (let i = 0; i < queue.length; i++) {
    for (let j = i + 1; j < queue.length; j++) {
      const p1 = gameState.getPlayer(queue[i].playerId);
      const p2 = gameState.getPlayer(queue[j].playerId);
      if (!p1 || !p2) continue;

      const scoreDiff = Math.abs(p1.arenaScore - p2.arenaScore);
      const timeWaiting = now - Math.min(queue[i].timestamp, queue[j].timestamp);

      if (scoreDiff < 200 + timeWaiting / 100) {
        const spirit1 = p1.spirits.find(s => s.id === queue[i].spiritId);
        const spirit2 = p2.spirits.find(s => s.id === queue[j].spiritId);
        if (!spirit1 || !spirit2) continue;

        const battle = createActiveBattle(p1.id, p2.id, spirit1, spirit2);
        gameState.addActiveBattle(battle);
        gameState.removeFromMatchmakingQueue(p1.id);
        gameState.removeFromMatchmakingQueue(p2.id);

        io.to(p1.id).emit('battle_found', { battleId: battle.id, opponentName: p2.displayName });
        io.to(p2.id).emit('battle_found', { battleId: battle.id, opponentName: p1.displayName });
      }
    }
  }
}, 3000);

app.get('/api/game-data', (req, res) => {
  res.json({
    spiritSpecies: SPIRIT_SPECIES,
    plantSpecies: PLANT_SPECIES,
    ballTypes: BALL_TYPES,
  });
});

app.post('/api/players', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: '用户名不能为空' });

  const existing = gameState.getPlayerByUsername(username);
  if (existing) return res.json(existing);

  const player = createPlayer(username);
  gameState.addPlayer(player);
  res.json(player);
});

app.get('/api/players/:id', (req, res) => {
  const player = gameState.getPlayer(req.params.id);
  if (!player) return res.status(404).json({ error: '玩家不存在' });
  res.json(player);
});

app.post('/api/garden/plant', (req, res) => {
  const { playerId, plantSpeciesId } = req.body;
  const player = gameState.getPlayer(playerId);
  if (!player) return res.status(404).json({ error: '玩家不存在' });

  const plantSpecies = getPlantSpecies(plantSpeciesId);
  if (!plantSpecies) return res.status(400).json({ error: '植物不存在' });
  if (player.coins < plantSpecies.cost) return res.status(400).json({ error: '金币不足' });

  const newGarden = plantSeed(player.garden, plantSpeciesId);
  if (!newGarden) return res.status(400).json({ error: '花园已满' });

  player.garden = newGarden;
  player.coins -= plantSpecies.cost;
  gameState.updatePlayer(player);
  res.json(player);
});

app.post('/api/garden/harvest', (req, res) => {
  const { playerId, plantId } = req.body;
  const player = gameState.getPlayer(playerId);
  if (!player) return res.status(404).json({ error: '玩家不存在' });

  const result = harvestPlant(player.garden, plantId);
  if (!result) return res.status(400).json({ error: '无法收获' });

  player.garden = result.garden;
  Object.entries(result.fruits).forEach(([fruitId, count]) => {
    player.fruits[fruitId] = (player.fruits[fruitId] || 0) + count;
  });
  gameState.updatePlayer(player);
  res.json({ player, harvested: result.fruits });
});

app.post('/api/garden/remove-plant', (req, res) => {
  const { playerId, plantId } = req.body;
  const player = gameState.getPlayer(playerId);
  if (!player) return res.status(404).json({ error: '玩家不存在' });

  player.garden = removeHarvestedPlant(player.garden, plantId);
  gameState.updatePlayer(player);
  res.json(player);
});

app.get('/api/garden/:playerId/appearances', (req, res) => {
  const player = gameState.getPlayer(req.params.playerId);
  if (!player) return res.status(404).json({ error: '玩家不存在' });

  const appearances = calculateSpiritAppearance(player.garden);
  res.json(appearances);
});

app.post('/api/capture', (req, res) => {
  const { playerId, encounterId, ballId } = req.body;
  const player = gameState.getPlayer(playerId);
  if (!player) return res.status(404).json({ error: '玩家不存在' });

  const ballCount = player.balls[ballId] || 0;
  if (ballCount <= 0) return res.status(400).json({ error: '精灵球不足' });

  const encounter = player.garden.attractedSpirits.find(e => e.id === encounterId);
  if (!encounter || encounter.isCaptured) return res.status(400).json({ error: '无法捕获' });

  player.balls[ballId]--;

  const result = attemptCapture(encounter, ballId);

  if (result.success) {
    const spirit = createSpirit(encounter.speciesId, playerId, encounter.level, encounter.rarity);
    player.spirits.push(spirit);
    player.collectedSpecies.add(encounter.speciesId);
    player.collectionScore += (encounter.rarity === 'mythic' ? 500 : encounter.rarity === 'legendary' ? 200 : encounter.rarity === 'epic' ? 100 : encounter.rarity === 'rare' ? 50 : encounter.rarity === 'uncommon' ? 20 : 10);
    encounter.isCaptured = true;

    if (['rare', 'epic', 'legendary', 'mythic'].includes(encounter.rarity)) {
      const species = getSpiritSpecies(encounter.speciesId)!;
      broadcastAnnouncement({
        id: uuidv4(),
        type: 'capture',
        message: `🎉 ${player.displayName} 成功捕获了 [${encounter.rarity}] ${species.name}！`,
        timestamp: Date.now(),
        data: { playerId, spiritName: species.name, rarity: encounter.rarity },
      });
    }
  }

  gameState.updatePlayer(player);
  res.json({ success: result.success, rate: result.rate, player });
});

app.post('/api/spirits/feed', (req, res) => {
  const { playerId, spiritId, fruitId, amount } = req.body;
  const player = gameState.getPlayer(playerId);
  if (!player) return res.status(404).json({ error: '玩家不存在' });

  const spirit = player.spirits.find(s => s.id === spiritId);
  if (!spirit) return res.status(404).json({ error: '精灵不存在' });

  const fruitCount = player.fruits[fruitId] || 0;
  if (fruitCount < amount) return res.status(400).json({ error: '果实不足' });

  const expGain = amount * 50;
  player.fruits[fruitId] -= amount;
  spirit.exp += expGain;

  while (spirit.exp >= spirit.expToNextLevel && spirit.level < 100) {
    const leveled = levelUpSpirit(spirit);
    Object.assign(spirit, leveled);
  }

  gameState.updatePlayer(player);
  res.json(player);
});

app.post('/api/spirits/evolve', (req, res) => {
  const { playerId, spiritId } = req.body;
  const player = gameState.getPlayer(playerId);
  if (!player) return res.status(404).json({ error: '玩家不存在' });

  const spirit = player.spirits.find(s => s.id === spiritId);
  if (!spirit) return res.status(404).json({ error: '精灵不存在' });
  if (!spirit.canEvolve) return res.status(400).json({ error: '无法进化' });

  const fruitReqs = spirit.evolutionRequirements.fruits;
  for (const [fruitId, count] of Object.entries(fruitReqs)) {
    if ((player.fruits[fruitId] || 0) < count) {
      return res.status(400).json({ error: `果实不足: ${fruitId}` });
    }
  }

  for (const [fruitId, count] of Object.entries(fruitReqs)) {
    player.fruits[fruitId] -= count;
  }

  const evolved = evolveSpirit(spirit);
  const idx = player.spirits.findIndex(s => s.id === spiritId);
  player.spirits[idx] = evolved;

  const species = getSpiritSpecies(spirit.speciesId)!;
  broadcastAnnouncement({
    id: uuidv4(),
    type: 'evolution',
    message: `✨ ${player.displayName} 的 ${species.name} 进化成了 ${evolved.name}！`,
    timestamp: Date.now(),
    data: { playerId, oldName: species.name, newName: evolved.name },
  });

  gameState.updatePlayer(player);
  res.json(player);
});

app.post('/api/spirits/breed', (req, res) => {
  const { playerId, spirit1Id, spirit2Id } = req.body;
  const player = gameState.getPlayer(playerId);
  if (!player) return res.status(404).json({ error: '玩家不存在' });

  const s1 = player.spirits.find(s => s.id === spirit1Id);
  const s2 = player.spirits.find(s => s.id === spirit2Id);
  if (!s1 || !s2) return res.status(404).json({ error: '精灵不存在' });

  const offspring = breedSpirits(s1, s2);
  if (!offspring) return res.status(400).json({ error: '无法配种' });

  player.spirits.push(offspring);
  player.collectedSpecies.add(offspring.speciesId);

  if (offspring.isMutant) {
    broadcastAnnouncement({
      id: uuidv4(),
      type: 'evolution',
      message: `🧬 ${player.displayName} 配种成功，诞生了变异精灵！`,
      timestamp: Date.now(),
    });
  }

  gameState.updatePlayer(player);
  res.json({ player, offspring });
});

app.get('/api/guilds', (req, res) => {
  res.json(gameState.getAllGuilds());
});

app.post('/api/guilds', (req, res) => {
  const { playerId, name, description } = req.body;
  const player = gameState.getPlayer(playerId);
  if (!player) return res.status(404).json({ error: '玩家不存在' });
  if (player.guildId) return res.status(400).json({ error: '已加入公会' });
  if (player.coins < 10000) return res.status(400).json({ error: '金币不足（需要10000）' });

  const guild: Guild = {
    id: uuidv4(),
    name,
    description: description || '',
    logo: '🏰',
    level: 1,
    exp: 0,
    presidentId: playerId,
    vicePresidentIds: [],
    memberIds: [playerId],
    contributions: { [playerId]: 0 },
    jointGarden: createGarden(uuidv4(), 'guild', 12),
    jointArena: {
      level: 1,
      bonuses: { captureBonus: 0.05, expBonus: 0.05, fruitBonus: 0.05 },
    },
    upgradeRequests: [],
    createdAt: Date.now(),
  };

  player.coins -= 10000;
  player.guildId = guild.id;
  player.guildRole = 'president';

  gameState.addGuild(guild);
  gameState.updatePlayer(player);
  res.json({ guild, player });
});

app.post('/api/guilds/:id/join', (req, res) => {
  const guild = gameState.getGuild(req.params.id);
  const player = gameState.getPlayer(req.body.playerId);
  if (!guild || !player) return res.status(404).json({ error: '不存在' });
  if (player.guildId) return res.status(400).json({ error: '已加入公会' });

  guild.memberIds.push(player.id);
  guild.contributions[player.id] = 0;
  player.guildId = guild.id;
  player.guildRole = 'member';

  gameState.updateGuild(guild);
  gameState.updatePlayer(player);
  res.json({ guild, player });
});

app.post('/api/guilds/:id/leave', (req, res) => {
  const guild = gameState.getGuild(req.params.id);
  const player = gameState.getPlayer(req.body.playerId);
  if (!guild || !player) return res.status(404).json({ error: '不存在' });

  guild.memberIds = guild.memberIds.filter(id => id !== player.id);
  guild.vicePresidentIds = guild.vicePresidentIds.filter(id => id !== player.id);
  delete guild.contributions[player.id];
  player.guildId = null;
  player.guildRole = null;

  if (guild.presidentId === player.id) {
    const newPresident = guild.memberIds[0];
    if (newPresident) {
      guild.presidentId = newPresident;
      const newPresPlayer = gameState.getPlayer(newPresident);
      if (newPresPlayer) {
        newPresPlayer.guildRole = 'president';
        gameState.updatePlayer(newPresPlayer);
      }
    } else {
      gameState.deleteGuild(guild.id);
    }
  } else {
    gameState.updateGuild(guild);
  }
  gameState.updatePlayer(player);
  res.json({ success: true });
});

app.post('/api/guilds/:id/contribute', (req, res) => {
  const { playerId, amount } = req.body;
  const guild = gameState.getGuild(req.params.id);
  const player = gameState.getPlayer(playerId);
  if (!guild || !player) return res.status(404).json({ error: '不存在' });
  if (player.coins < amount) return res.status(400).json({ error: '金币不足' });

  player.coins -= amount;
  guild.contributions[playerId] = (guild.contributions[playerId] || 0) + amount;
  guild.exp += amount;

  const expNeeded = guild.level * 50000;
  if (guild.exp >= expNeeded) {
    guild.exp -= expNeeded;
    guild.level++;
    guild.jointArena.bonuses.captureBonus += 0.02;
    guild.jointArena.bonuses.expBonus += 0.02;
    guild.jointArena.bonuses.fruitBonus += 0.02;
  }

  gameState.updateGuild(guild);
  gameState.updatePlayer(player);
  res.json({ guild, player });
});

app.post('/api/guilds/:id/promote', (req, res) => {
  const { presidentId, targetId, role } = req.body;
  const guild = gameState.getGuild(req.params.id);
  const president = gameState.getPlayer(presidentId);
  const target = gameState.getPlayer(targetId);
  if (!guild || !president || !target) return res.status(404).json({ error: '不存在' });
  if (president.guildRole !== 'president') return res.status(403).json({ error: '无权限' });

  if (role === 'vice_president') {
    if (!guild.vicePresidentIds.includes(targetId)) {
      guild.vicePresidentIds.push(targetId);
    }
    target.guildRole = 'vice_president';
  } else if (role === 'member') {
    guild.vicePresidentIds = guild.vicePresidentIds.filter(id => id !== targetId);
    target.guildRole = 'member';
  }

  gameState.updateGuild(guild);
  gameState.updatePlayer(target);
  res.json({ guild, player: target });
});

app.get('/api/trades', (req, res) => {
  res.json(gameState.getAllTradeListings());
});

app.get('/api/trades/suggested-price', (req, res) => {
  const { itemType, itemId, rarity, element } = req.query;
  const price = gameState.getSuggestedPrice(
    itemType as string,
    itemId as string,
    rarity as Rarity | undefined,
    element as ElementType | undefined
  );
  res.json({ suggestedPrice: price });
});

app.post('/api/trades', (req, res) => {
  const { sellerId, itemType, itemId, price } = req.body;
  const seller = gameState.getPlayer(sellerId);
  if (!seller) return res.status(404).json({ error: '玩家不存在' });

  let itemData: any = null;
  if (itemType === 'spirit') {
    const spirit = seller.spirits.find(s => s.id === itemId);
    if (!spirit) return res.status(404).json({ error: '精灵不存在' });
    itemData = spirit;
  }

  const suggestedPrice = gameState.getSuggestedPrice(itemType, itemId, itemData?.rarity, itemData?.element);

  const listing: TradeListing = {
    id: uuidv4(),
    sellerId,
    sellerName: seller.displayName,
    itemType,
    itemId,
    itemData,
    price,
    suggestedPrice,
    listedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };

  gameState.addTradeListing(listing);
  res.json(listing);
});

app.post('/api/trades/:id/buy', (req, res) => {
  const { buyerId } = req.body;
  const listing = gameState.getTradeListing(req.params.id);
  const buyer = gameState.getPlayer(buyerId);
  if (!listing || !buyer) return res.status(404).json({ error: '不存在' });
  if (buyerId === listing.sellerId) return res.status(400).json({ error: '不能购买自己的物品' });
  if (buyer.coins < listing.price) return res.status(400).json({ error: '金币不足' });

  const seller = gameState.getPlayer(listing.sellerId);
  if (!seller) return res.status(404).json({ error: '卖家不存在' });

  if (listing.itemType === 'spirit') {
    const spiritIdx = seller.spirits.findIndex(s => s.id === listing.itemId);
    if (spiritIdx === -1) {
      gameState.removeTradeListing(listing.id);
      return res.status(400).json({ error: '精灵已不存在' });
    }
    const spirit = seller.spirits.splice(spiritIdx, 1)[0];
    spirit.ownerId = buyerId;
    buyer.spirits.push(spirit);
    buyer.collectedSpecies.add(spirit.speciesId);
  }

  buyer.coins -= listing.price;
  seller.coins += Math.floor(listing.price * 0.95);

  gameState.addTradeHistory({
    id: uuidv4(),
    itemType: listing.itemType,
    itemId: listing.itemId,
    price: listing.price,
    buyerId,
    sellerId: listing.sellerId,
    timestamp: Date.now(),
  });

  gameState.removeTradeListing(listing.id);
  gameState.updatePlayer(buyer);
  gameState.updatePlayer(seller);

  broadcastAnnouncement({
    id: uuidv4(),
    type: 'trade',
    message: `💰 ${buyer.displayName} 从 ${seller.displayName} 处购买了 ${listing.itemType === 'spirit' ? listing.itemData?.name : listing.itemId}，花费 ${listing.price} 金币！`,
    timestamp: Date.now(),
  });

  res.json({ success: true, buyer, seller });
});

app.get('/api/leaderboards/collection', (req, res) => {
  res.json(gameState.getCollectionLeaderboard(20));
});

app.get('/api/leaderboards/arena', (req, res) => {
  res.json(gameState.getArenaLeaderboard(20));
});

app.get('/api/leaderboards/guild', (req, res) => {
  res.json(gameState.getGuildLeaderboard(20));
});

app.get('/api/announcements', (req, res) => {
  res.json(gameState.getAnnouncements(50));
});

app.get('/api/reports/latest', (req, res) => {
  const reports = gameState.getWeeklyReports();
  if (reports.length === 0) {
    const report = generateWeeklyReport();
    return res.json(report);
  }
  res.json(reports[reports.length - 1]);
});

app.get('/api/reports/:id/pdf', async (req, res) => {
  const reports = gameState.getWeeklyReports();
  const report = reports.find(r => r.id === req.params.id) || reports[reports.length - 1];
  if (!report) return res.status(404).json({ error: '报告不存在' });

  const pdfBuffer = await exportReportToPDF(report);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="weekly-report-${report.id}.pdf"`);
  res.send(pdfBuffer);
});

app.post('/api/shop/buy-ball', (req, res) => {
  const { playerId, ballId, amount } = req.body;
  const player = gameState.getPlayer(playerId);
  const ball = getBallType(ballId);
  if (!player || !ball) return res.status(404).json({ error: '不存在' });

  const totalCost = ball.cost * amount;
  if (player.coins < totalCost) return res.status(400).json({ error: '金币不足' });

  player.coins -= totalCost;
  player.balls[ballId] = (player.balls[ballId] || 0) + amount;
  gameState.updatePlayer(player);
  res.json(player);
});

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  socket.on('register', (playerId: string) => {
    socket.join(playerId);
    const player = gameState.getPlayer(playerId);
    if (player) {
      io.to(playerId).emit('player_data', player);
    }
  });

  socket.on('join_matchmaking', ({ playerId, spiritId }) => {
    gameState.addToMatchmakingQueue({ playerId, spiritId, timestamp: Date.now() });
    io.to(playerId).emit('matchmaking_joined');
  });

  socket.on('leave_matchmaking', ({ playerId }) => {
    gameState.removeFromMatchmakingQueue(playerId);
    io.to(playerId).emit('matchmaking_left');
  });

  socket.on('battle_action', ({ battleId, playerId, skillId }) => {
    const battle = gameState.getActiveBattle(battleId);
    if (!battle) return;

    try {
      const result = executeSkill(battle, playerId, skillId);
      gameState.updateActiveBattle(result.battle);

      io.to(battle.player1Id).emit('battle_update', result.battle);
      io.to(battle.player2Id).emit('battle_update', result.battle);

      if (result.battle.isFinished && result.battle.winnerId) {
        const winnerId = result.battle.winnerId;
        const loserId = winnerId === battle.player1Id ? battle.player2Id : battle.player1Id;
        const winner = gameState.getPlayer(winnerId);
        const loser = gameState.getPlayer(loserId);

        if (winner && loser) {
          const { winnerChange, loserChange } = calculateScoreChange(winner.arenaScore, loser.arenaScore);
          winner.arenaScore = Math.max(0, winner.arenaScore + winnerChange);
          loser.arenaScore = Math.max(0, loser.arenaScore + loserChange);
          winner.weeklyWins++;
          loser.weeklyLosses++;
          winner.coins += 100;
          winner.balls['basic_ball'] = (winner.balls['basic_ball'] || 0) + 2;
          loser.coins += 30;

          const winningSpirit = winner.spirits.find(s =>
            s.id === (winnerId === battle.player1Id ? battle.player1Spirit.id : battle.player2Spirit.id)
          );
          if (winningSpirit) {
            winningSpirit.exp += 200;
            while (winningSpirit.exp >= winningSpirit.expToNextLevel && winningSpirit.level < 100) {
              const leveled = levelUpSpirit(winningSpirit);
              Object.assign(winningSpirit, leveled);
            }
          }

          const record = createBattleRecord(result.battle, winnerChange, loserChange);
          gameState.addBattleRecord(record);
          gameState.updatePlayer(winner);
          gameState.updatePlayer(loser);
          gameState.removeActiveBattle(battleId);

          io.to(winnerId).emit('battle_end', { victory: true, scoreChange: winnerChange, coins: 100, balls: 2 });
          io.to(loserId).emit('battle_end', { victory: false, scoreChange: loserChange, coins: 30, balls: 0 });
        }
      } else {
        const aiPlayerId = battle.player1Id === playerId ? battle.player2Id : battle.player1Id;
        const otherPlayer = gameState.getPlayer(aiPlayerId);
        if (otherPlayer?.username.startsWith('AI_') || otherPlayer === undefined) {
          setTimeout(() => {
            const currentBattle = gameState.getActiveBattle(battleId);
            if (!currentBattle || currentBattle.isFinished) return;
            const aiSkillId = simulateAIAction(currentBattle, aiPlayerId);
            if (aiSkillId) {
              try {
                const aiResult = executeSkill(currentBattle, aiPlayerId, aiSkillId);
                gameState.updateActiveBattle(aiResult.battle);
                io.to(battle.player1Id).emit('battle_update', aiResult.battle);
                io.to(battle.player2Id).emit('battle_update', aiResult.battle);

                if (aiResult.battle.isFinished && aiResult.battle.winnerId) {
                  const wId = aiResult.battle.winnerId;
                  const lId = wId === battle.player1Id ? battle.player2Id : battle.player1Id;
                  const winPlayer = gameState.getPlayer(wId);
                  const losePlayer = gameState.getPlayer(lId);
                  if (winPlayer && losePlayer) {
                    const { winnerChange, loserChange } = calculateScoreChange(winPlayer.arenaScore, losePlayer.arenaScore);
                    winPlayer.arenaScore += winnerChange;
                    losePlayer.arenaScore += loserChange;
                    gameState.updatePlayer(winPlayer);
                    gameState.updatePlayer(losePlayer);
                    gameState.removeActiveBattle(battleId);
                  }
                }
              } catch (e) { }
            }
          }, 800);
        }
      }
    } catch (e: any) {
      io.to(playerId).emit('battle_error', { message: e.message });
    }
  });

  socket.on('request_ai_battle', ({ playerId, spiritId }) => {
    const player = gameState.getPlayer(playerId);
    if (!player) return;
    const spirit = player.spirits.find(s => s.id === spiritId);
    if (!spirit) return;

    const aiId = 'AI_' + uuidv4();
    const aiSpirit = createSpirit(spirit.speciesId, aiId, Math.max(1, spirit.level + randomInt(-2, 2)));
    const aiPlayer: any = {
      id: aiId,
      username: 'AI_' + aiId.slice(0, 4),
      displayName: 'AI对手',
      arenaScore: player.arenaScore + randomInt(-50, 50),
      spirits: [aiSpirit],
    };
    gameState.addPlayer(aiPlayer);

    const battle = createActiveBattle(playerId, aiId, spirit, aiSpirit);
    gameState.addActiveBattle(battle);
    io.to(playerId).emit('battle_found', { battleId: battle.id, opponentName: 'AI对手' });
  });

  socket.on('disconnect', () => {
    console.log('用户断开:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`魔法精灵世界服务器运行在端口 ${PORT}`);
  console.log(`REST API: http://localhost:${PORT}/api`);
  console.log(`Socket.io: ws://localhost:${PORT}`);
});
