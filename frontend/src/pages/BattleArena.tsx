import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useGameStore } from '../store';
import { RARITY_COLORS, ELEMENT_COLORS, ELEMENT_NAMES } from '../types';

interface Props {
  socket: Socket | null;
  onExit: () => void;
}

export default function BattleArena({ socket, onExit }: Props) {
  const { player, activeBattle, spiritSpecies, setActiveBattle } = useGameStore();
  const [result, setResult] = useState<{ victory: boolean; scoreChange: number; coins: number; balls: number } | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!socket || !player) return;
    const battleEndHandler = (data: any) => setResult(data);
    socket.on('battle_end', battleEndHandler);
    return () => {
      socket.off('battle_end', battleEndHandler);
    };
  }, [socket, player?.id]);

  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(i);
  }, []);

  if (!player || !activeBattle) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⚔️</div>
          <p className="text-xl text-gray-400">战斗加载中...</p>
        </div>
      </div>
    );
  }

  const isPlayer1 = activeBattle.player1Id === player.id;
  const mySpirit = isPlayer1 ? activeBattle.player1Spirit : activeBattle.player2Spirit;
  const oppSpirit = isPlayer1 ? activeBattle.player2Spirit : activeBattle.player1Spirit;
  const mySpecies = spiritSpecies.find(s => s.id === mySpirit.speciesId);
  const oppSpecies = spiritSpecies.find(s => s.id === oppSpirit.speciesId);
  const isMyTurn = activeBattle.activePlayerId === player.id;

  const useSkill = (skillId: string) => {
    if (!isMyTurn || activeBattle.isFinished || !socket) return;
    socket.emit('battle_action', { battleId: activeBattle.id, playerId: player.id, skillId });
  };

  if (result) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="magic-card p-8 text-center max-w-md w-full">
          <div className="text-8xl mb-4 animate-bounce">
            {result.victory ? '🏆' : '💔'}
          </div>
          <h2 className={`text-4xl font-bold mb-4 ${result.victory ? 'text-magic-gold' : 'text-gray-400'}`}>
            {result.victory ? '胜利！' : '失败...'}
          </h2>
          <div className="space-y-3 mb-6 text-lg">
            <p>竞技积分: <span className={result.scoreChange >= 0 ? 'text-green-400' : 'text-red-400'}>
              {result.scoreChange >= 0 ? '+' : ''}{result.scoreChange}
            </span></p>
            <p>获得金币: <span className="text-magic-gold">+{result.coins}</span></p>
            {result.balls > 0 && <p>精灵球: <span className="text-red-400">+{result.balls}个</span></p>}
          </div>
          <button
            onClick={() => { setResult(null); setActiveBattle(null); onExit(); }}
            className="magic-btn w-full text-lg"
          >
            返回竞技场
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onExit} className="magic-btn magic-btn-secondary px-4 py-2 text-sm">
          ← 退出战斗
        </button>
        <div className="text-center">
          <p className="text-sm text-gray-400">回合 {activeBattle.currentTurn}</p>
          <p className={`font-bold ${isMyTurn ? 'text-magic-green animate-pulse' : 'text-gray-400'}`}>
            {activeBattle.isFinished ? '战斗结束' : isMyTurn ? '⚡ 你的回合' : '⏳ 对手回合'}
          </p>
        </div>
        <div className="w-24"></div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div className="magic-card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-400">对手</p>
              <p className="font-bold text-xl" style={{ color: RARITY_COLORS[oppSpirit.rarity] }}>
                {oppSpirit.name}
              </p>
              <p className="text-sm" style={{ color: ELEMENT_COLORS[oppSpirit.element] }}>
                [{ELEMENT_NAMES[oppSpirit.element]}] Lv.{oppSpirit.level}
              </p>
            </div>
            <span className="text-8xl animate-float" style={{ filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.5))' }}>
              {oppSpecies?.sprite}
            </span>
          </div>
          <div className="space-y-2">
            <StatBar label="HP" value={oppSpirit.stats.hp} max={oppSpirit.stats.maxHp} color="bg-red-500" />
            <StatBar label="能量" value={oppSpirit.stats.energy} max={oppSpirit.stats.maxEnergy} color="bg-blue-500" />
          </div>
        </div>

        <div className="magic-card p-6 border-2 border-magic-purple/50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-magic-purple">我方</p>
              <p className="font-bold text-xl" style={{ color: RARITY_COLORS[mySpirit.rarity] }}>
                {mySpirit.name}
              </p>
              <p className="text-sm" style={{ color: ELEMENT_COLORS[mySpirit.element] }}>
                [{ELEMENT_NAMES[mySpirit.element]}] Lv.{mySpirit.level}
              </p>
            </div>
            <span className="text-8xl animate-float" style={{ filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.5))' }}>
              {mySpecies?.sprite}
            </span>
          </div>
          <div className="space-y-2 mb-4">
            <StatBar label="HP" value={mySpirit.stats.hp} max={mySpirit.stats.maxHp} color="hp-bar" />
            <StatBar label="能量" value={mySpirit.stats.energy} max={mySpirit.stats.maxEnergy} color="energy-bar" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {mySpirit.skills.map(skill => {
              const canUse = isMyTurn && !activeBattle.isFinished && skill.currentCooldown === 0 && mySpirit.stats.energy >= skill.energyCost;
              return (
                <button
                  key={skill.id}
                  onClick={() => useSkill(skill.id)}
                  disabled={!canUse}
                  className={`p-3 rounded-xl text-left transition-all ${
                    canUse
                      ? 'bg-gradient-to-br from-magic-purple/30 to-magic-pink/30 hover:from-magic-purple/50 hover:to-magic-pink/50 cursor-pointer border border-magic-purple/30'
                      : 'bg-gray-800/50 opacity-50 cursor-not-allowed border border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold" style={{ color: ELEMENT_COLORS[skill.element] }}>
                      {skill.name}
                    </span>
                    <span className="text-xs">
                      {skill.currentCooldown > 0 ? (
                        <span className="text-red-400">CD:{skill.currentCooldown}</span>
                      ) : (
                        <span className="text-blue-400">⚡{skill.energyCost}</span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{skill.description}</p>
                  <p className="text-xs mt-1">
                    <span className="text-red-400">威力:{skill.power}</span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="magic-card p-4 mt-4 max-h-32 overflow-auto">
        <h3 className="text-sm font-bold text-gray-400 mb-2">战斗日志</h3>
        <div className="space-y-1 text-sm">
          {activeBattle.battleLog.slice(-5).reverse().map((turn: any, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-gray-500">回合{turn.turnNumber}:</span>
              {turn.skillId && <span className="text-magic-purple">使用 {turn.skillId}</span>}
              {turn.damage && <span className="text-red-400">造成{turn.damage}点伤害</span>}
              {turn.heal && <span className="text-green-400">恢复{turn.heal}点生命</span>}
              {turn.effectsApplied?.map((e: string, j: number) => (
                <span key={j} className="text-magic-gold">[{e}]</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono">{value}/{max}</span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${Math.max(0, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}
