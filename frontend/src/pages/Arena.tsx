import { useState } from 'react';
import { useGameStore } from '../store';
import { Socket } from 'socket.io-client';
import { RARITY_COLORS, ELEMENT_COLORS, ELEMENT_NAMES } from '../types';

interface Props {
  socket: Socket | null;
}

export default function Arena({ socket }: Props) {
  const { player, spiritSpecies, setActiveBattle } = useGameStore();
  const [selectedSpiritId, setSelectedSpiritId] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  if (!player) return null;

  const selectedSpirit = player.spirits.find(s => s.id === selectedSpiritId);

  const joinMatchmaking = () => {
    if (!selectedSpiritId || !socket) return;
    setIsMatching(true);
    socket.emit('join_matchmaking', { playerId: player.id, spiritId: selectedSpiritId });
  };

  const startAIBattle = () => {
    if (!selectedSpiritId || !socket) return;
    socket.emit('request_ai_battle', { playerId: player.id, spiritId: selectedSpiritId });
  };

  const cancelMatchmaking = () => {
    if (!socket) return;
    setIsMatching(false);
    socket.emit('leave_matchmaking', { playerId: player.id });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">⚔️ 竞技联赛</h1>
        <p className="text-gray-400">每日开放，选择精灵挑战其他玩家</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="magic-card p-6 lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">选择出战精灵</h2>
          {player.spirits.length === 0 ? (
            <p className="text-gray-500 text-center py-8">还没有精灵，先去花园捕获吧！</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {player.spirits.map(s => {
                const species = spiritSpecies.find(sp => sp.id === s.speciesId);
                const isSelected = selectedSpiritId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSpiritId(s.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${
                      isSelected ? 'border-magic-gold bg-magic-gold/10' : 'border-transparent bg-dark-bg'
                    } rarity-glow-${s.rarity}`}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-2">{species?.sprite}</div>
                      <p className="font-bold truncate" style={{ color: RARITY_COLORS[s.rarity] }}>{s.name}</p>
                      <p className="text-xs" style={{ color: ELEMENT_COLORS[s.element] }}>[{ELEMENT_NAMES[s.element]}] Lv.{s.level}</p>
                      <p className="text-xs text-magic-gold mt-1">⚔️ {s.battleScore}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="magic-card p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-4 text-center">竞技信息</h2>

            <div className="bg-dark-bg rounded-xl p-4 mb-4 text-center">
              <p className="text-4xl font-bold text-magic-gold">{player.arenaScore}</p>
              <p className="text-sm text-gray-400">竞技积分</p>
              <div className="mt-3 flex justify-around text-sm">
                <div>
                  <p className="text-green-400 font-bold">{player.weeklyWins}</p>
                  <p className="text-xs text-gray-500">本周胜</p>
                </div>
                <div>
                  <p className="text-red-400 font-bold">{player.weeklyLosses}</p>
                  <p className="text-xs text-gray-500">本周负</p>
                </div>
                <div>
                  <p className="text-blue-400 font-bold">
                    {player.weeklyWins + player.weeklyLosses > 0
                      ? ((player.weeklyWins / (player.weeklyWins + player.weeklyLosses)) * 100).toFixed(0) + '%'
                      : '-'}
                  </p>
                  <p className="text-xs text-gray-500">胜率</p>
                </div>
              </div>
            </div>

            {selectedSpirit ? (
              <div className="bg-dark-bg rounded-xl p-4 mb-4">
                <p className="text-center font-bold mb-2">出战精灵</p>
                <div className="text-center">
                  <span className="text-5xl">{spiritSpecies.find(sp => sp.id === selectedSpirit.speciesId)?.sprite}</span>
                  <p className="font-bold mt-2" style={{ color: RARITY_COLORS[selectedSpirit.rarity] }}>
                    {selectedSpirit.name}
                  </p>
                  <p className="text-sm text-gray-400">Lv.{selectedSpirit.level} · ⚔️{selectedSpirit.battleScore}</p>
                </div>
              </div>
            ) : (
              <div className="bg-dark-bg rounded-xl p-6 mb-4 text-center text-gray-500">
                请选择出战精灵
              </div>
            )}

            <div className="space-y-3">
              {!isMatching ? (
                <>
                  <button
                    onClick={joinMatchmaking}
                    disabled={!selectedSpiritId}
                    className="w-full magic-btn"
                  >
                    ⚔️ 匹配玩家对战
                  </button>
                  <button
                    onClick={startAIBattle}
                    disabled={!selectedSpiritId}
                    className="w-full magic-btn magic-btn-secondary"
                  >
                    🤖 挑战AI对手
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <div className="animate-spin text-4xl mb-2">⏳</div>
                  <p className="text-magic-purple mb-3">正在匹配对手...</p>
                  <button onClick={cancelMatchmaking} className="magic-btn magic-btn-danger w-full">
                    取消匹配
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 text-xs text-gray-500">
              <p className="font-bold text-gray-400 mb-1">🏆 对战奖励：</p>
              <p>• 胜利：+100金币、2个普通精灵球、竞技积分</p>
              <p>• 失败：+30金币、竞技积分变化</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
