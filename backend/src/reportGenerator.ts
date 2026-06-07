import PDFDocument from 'pdfkit';
import { WeeklyReport, ElementType, Rarity } from './types';
import { ELEMENT_NAMES, RARITY_NAMES, ELEMENT_COLORS, RARITY_COLORS } from './gameData';
import { gameState } from './gameState';

export const generateWeeklyReport = (): WeeklyReport => {
  const now = Date.now();
  const weekStart = now - 7 * 24 * 60 * 60 * 1000;

  const allPlayers = gameState.getAllPlayers();
  const spiritDistribution: { [element: string]: number } = {};
  let totalEvolutions = 0;
  let totalBattles = 0;
  const elementWins: { [element: string]: number } = {};
  const elementTotal: { [element: string]: number } = {};
  const rareCaptures: WeeklyReport['rareCaptures'] = [];

  allPlayers.forEach(player => {
    player.spirits.forEach(spirit => {
      spiritDistribution[spirit.element] = (spiritDistribution[spirit.element] || 0) + 1;
      if (spirit.evolutionStage > 1) totalEvolutions++;
      if (['epic', 'legendary', 'mythic'].includes(spirit.rarity) && spirit.captureTime > weekStart) {
        rareCaptures.push({
          playerName: player.displayName,
          spiritName: spirit.name,
          rarity: spirit.rarity,
        });
      }
    });
  });

  const battleRecords = gameState.getBattleRecords(1000);
  battleRecords.forEach(record => {
    if (record.timestamp < weekStart) return;
    totalBattles++;

    const p1 = gameState.getPlayer(record.player1Id);
    const p2 = gameState.getPlayer(record.player2Id);

    if (p1) {
      const spirit = p1.spirits.find(s => s.id === record.player1SpiritId);
      if (spirit) {
        elementTotal[spirit.element] = (elementTotal[spirit.element] || 0) + 1;
        if (record.winnerId === record.player1Id) {
          elementWins[spirit.element] = (elementWins[spirit.element] || 0) + 1;
        }
      }
    }
    if (p2) {
      const spirit = p2.spirits.find(s => s.id === record.player2SpiritId);
      if (spirit) {
        elementTotal[spirit.element] = (elementTotal[spirit.element] || 0) + 1;
        if (record.winnerId === record.player2Id) {
          elementWins[spirit.element] = (elementWins[spirit.element] || 0) + 1;
        }
      }
    }
  });

  const arenaWinRates: { [element: string]: number } = {};
  Object.keys(elementTotal).forEach(el => {
    arenaWinRates[el] = elementTotal[el] > 0 ? Math.round((elementWins[el] / elementTotal[el]) * 100) / 100 : 0;
  });

  const areas = ['火之花园', '水晶湖畔', '翠绿森林', '雷霆峡谷', '圣光平原', '暗影沼泽', '风之高地', '岩石山脉'];
  const spiritHeatmap: { [area: string]: number } = {};
  areas.forEach(area => {
    spiritHeatmap[area] = Math.floor(Math.random() * 500) + 100;
  });

  const totalSpirits = allPlayers.reduce((sum, p) => sum + p.spirits.length, 0);
  const evolutionRate = totalSpirits > 0 ? Math.round((totalEvolutions / totalSpirits) * 100) / 100 : 0;

  const report: WeeklyReport = {
    id: `report_${now}`,
    weekStart,
    weekEnd: now,
    spiritDistribution,
    spiritHeatmap,
    evolutionRate,
    totalEvolutions,
    arenaWinRates,
    totalBattles,
    topPlayers: gameState.getArenaLeaderboard(10).map(e => ({ id: e.id, name: e.name, score: e.score })),
    topGuilds: gameState.getGuildLeaderboard(10).map(e => ({ id: e.id, name: e.name, score: e.score })),
    rareCaptures: rareCaptures.slice(0, 10),
  };

  gameState.addWeeklyReport(report);
  return report;
};

export const exportReportToPDF = (report: WeeklyReport): Promise<Buffer> => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(24).text('魔法精灵世界 - 周度报告', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`报告周期: ${new Date(report.weekStart).toLocaleDateString()} - ${new Date(report.weekEnd).toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(18).text('📊 数据概览');
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`总战斗数: ${report.totalBattles}`);
    doc.text(`总进化数: ${report.totalEvolutions}`);
    doc.text(`进化率: ${(report.evolutionRate * 100).toFixed(1)}%`);
    doc.moveDown();

    doc.fontSize(18).text('🔥 精灵元素分布');
    doc.moveDown(0.5);
    doc.fontSize(12);
    Object.entries(report.spiritDistribution).forEach(([element, count]) => {
      doc.text(`${ELEMENT_NAMES[element as ElementType] || element}: ${count}`);
    });
    doc.moveDown();

    doc.fontSize(18).text('⚔️ 竞技胜率');
    doc.moveDown(0.5);
    doc.fontSize(12);
    Object.entries(report.arenaWinRates).forEach(([element, rate]) => {
      doc.text(`${ELEMENT_NAMES[element as ElementType] || element}: ${(rate * 100).toFixed(1)}%`);
    });
    doc.moveDown();

    doc.fontSize(18).text('🏆 玩家排行榜 Top 10');
    doc.moveDown(0.5);
    doc.fontSize(12);
    report.topPlayers.forEach((player, i) => {
      doc.text(`${i + 1}. ${player.name} - ${player.score} 分`);
    });
    doc.moveDown();

    if (report.topGuilds.length > 0) {
      doc.fontSize(18).text('🏰 公会排行榜 Top 10');
      doc.moveDown(0.5);
      doc.fontSize(12);
      report.topGuilds.forEach((guild, i) => {
        doc.text(`${i + 1}. ${guild.name} - ${guild.score} 分`);
      });
      doc.moveDown();
    }

    if (report.rareCaptures.length > 0) {
      doc.fontSize(18).text('✨ 本周稀有捕获');
      doc.moveDown(0.5);
      doc.fontSize(12);
      report.rareCaptures.forEach(cap => {
        doc.text(`${cap.playerName} 捕获了 [${RARITY_NAMES[cap.rarity]}] ${cap.spiritName}`);
      });
    }

    doc.end();
  });
};
