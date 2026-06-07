import { useState } from 'react';
import { useGameStore } from '../store';
import {
  RARITY_COLORS, RARITY_NAMES, ELEMENT_COLORS, ELEMENT_NAMES,
  FRUIT_NAMES, FRUIT_SPRITES, Spirit,
} from '../types';

export default function Spirits() {
  const { player, spiritSpecies, setPlayer, selectedSpirit, setSelectedSpirit } = useGameStore();
  const [showBreed, setShowBreed] = useState(false);
  const [breedFirst, setBreedFirst] = useState<string | null>(null);

  if (!player) return null;

  const selected = player.spirits.find(s => s.id === selectedSpirit);

  const handleFeed = async (fruitId: string, amount: number = 1) => {
    if (!selected) return;
    const res = await fetch('/api/spirits/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, spiritId: selected.id, fruitId, amount }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlayer(data);
    }
  };

  const handleEvolve = async () => {
    if (!selected || !selected.canEvolve) return;
    if (!confirm(`确定要让 ${selected.name} 进化吗？`)) return;
    const res = await fetch('/api/spirits/evolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, spiritId: selected.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlayer(data);
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handleBreed = async (secondId: string) => {
    if (!breedFirst) return;
    const res = await fetch('/api/spirits/breed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, spirit1Id: breedFirst, spirit2Id: secondId }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlayer(data.player);
      setShowBreed(false);
      setBreedFirst(null);
      alert(data.offspring.isMutant ? '🧬 诞生了变异精灵！' : '🎉 配种成功！');
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const renderSpiritCard = (s: Spirit, onClick?: () => void) => {
    const species = spiritSpecies.find(sp => sp.id === s.speciesId);
    const isSelected = selectedSpirit === s.id;
    return (
      <div
        key={s.id}
        onClick={onClick}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${
          isSelected ? 'border-magic-purple bg-magic-purple/20' : 'border-transparent bg-dark-bg'
        } rarity-glow-${s.rarity}`}
        style={{ borderColor: isSelected ? '#8B5CF6' : 'transparent' }}
      >
        <div className="text-center">
          <div className="text-5xl mb-2 animate-float" style={{ color: ELEMENT_COLORS[s.element] }}>
            {species?.sprite || '🧚'}
            {s.isMutant && <span className="absolute text-xl">🧬</span>}
          </div>
          <p className="font-bold truncate" style={{ color: RARITY_COLORS[s.rarity] }}>
            {s.name}
          </p>
          <p className="text-xs" style={{ color: ELEMENT_COLORS[s.element] }}>
            [{ELEMENT_NAMES[s.element]}] Lv.{s.level}
          </p>
          <p className="text-xs text-gray-500 mt-1">战力: {s.battleScore}</p>
          <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div className="exp-bar h-full" style={{ width: `${(s.exp / s.expToNextLevel) * 100}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{s.exp}/{s.expToNextLevel} EXP</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">🧚 我的精灵</h1>
          <p className="text-gray-400">共 {player.spirits.length} 只精灵 · 收集度: {player.collectionScore}</p>
        </div>
        <button onClick={() => setShowBreed(true)} className="magic-btn magic-btn-secondary">
          💞 精灵配种
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="magic-card p-6">
            <h2 className="text-xl font-bold mb-4">精灵列表</h2>
            {player.spirits.length === 0 ? (
              <p className="text-gray-500 text-center py-8">还没有精灵，去花园捕获吧！</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {player.spirits.map(s => renderSpiritCard(s, () => setSelectedSpirit(s.id)))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="magic-card p-6 sticky top-6">
            {selected ? (() => {
              const species = spiritSpecies.find(sp => sp.id === selected.speciesId);
              return (
                <div>
                  <div className="text-center mb-4">
                    <div className="text-7xl mb-2 animate-float">{species?.sprite || '🧚'}</div>
                    <h3 className="text-2xl font-bold" style={{ color: RARITY_COLORS[selected.rarity] }}>
                      [{RARITY_NAMES[selected.rarity]}] {selected.name}
                    </h3>
                    <p className="text-sm mt-1">
                      <span style={{ color: ELEMENT_COLORS[selected.element] }}>[{ELEMENT_NAMES[selected.element]}]</span>
                      <span className="text-gray-400 ml-2">进化阶段: {selected.evolutionStage}/{selected.maxEvolutionStage}</span>
                      {selected.isMutant && <span className="text-magic-pink ml-2">🧬 变异</span>}
                    </p>
                    <p className="text-magic-gold font-bold text-lg mt-2">⚔️ 战力: {selected.battleScore}</p>
                  </div>

                  <div className="space-y-3 mb-4">
                    <StatBar label="生命值" value={selected.stats.hp} max={selected.stats.maxHp} color="bg-green-500" />
                    <StatBar label="能量" value={selected.stats.energy} max={selected.stats.maxEnergy} color="bg-blue-500" />
                    <StatBar label="经验" value={selected.exp} max={selected.expToNextLevel} color="bg-yellow-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <Stat label="攻击" value={selected.stats.attack} />
                    <Stat label="防御" value={selected.stats.defense} />
                    <Stat label="速度" value={selected.stats.speed} />
                    <Stat label="等级" value={`Lv.${selected.level}`} />
                  </div>

                  <div className="mb-4">
                    <h4 className="font-bold mb-2">技能</h4>
                    <div className="space-y-2">
                      {selected.skills.map(skill => (
                        <div key={skill.id} className="bg-dark-bg rounded-lg p-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-semibold" style={{ color: ELEMENT_COLORS[skill.element] }}>
                              {skill.name}
                            </span>
                            <span className="text-gray-400 text-xs">
                              威力:{skill.power} 耗能:{skill.energyCost}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{skill.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-bold mb-2">🍎 喂食升级</h4>
                    {Object.keys(player.fruits).length === 0 ? (
                      <p className="text-xs text-gray-500">没有果实，去花园种植吧</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(player.fruits).map(([fid, count]) => (
                          <button
                            key={fid}
                            onClick={() => handleFeed(fid)}
                            disabled={count <= 0}
                            className="bg-dark-bg rounded-lg p-2 text-center hover:bg-magic-purple/20 transition-colors disabled:opacity-50"
                            title={FRUIT_NAMES[fid]}
                          >
                            <span className="text-2xl">{FRUIT_SPRITES[fid] || '🍎'}</span>
                            <p className="text-xs text-magic-gold">x{count}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selected.canEvolve && (
                    <button onClick={handleEvolve} className="w-full magic-btn animate-glow">
                      ✨ 进化！
                    </button>
                  )}

                  {!selected.canEvolve && selected.evolutionStage < selected.maxEvolutionStage && (
                    <div className="bg-dark-bg rounded-lg p-3 text-sm">
                      <p className="text-gray-400 mb-2">进化条件:</p>
                      <ul className="space-y-1 text-xs">
                        {Object.entries(selected.evolutionRequirements.fruits).map(([fid, count]) => (
                          <li key={fid} className={((player.fruits[fid] || 0) >= (count as number)) ? 'text-green-400' : 'text-red-400'}>
                            {FRUIT_SPRITES[fid]} {FRUIT_NAMES[fid] || fid}: {player.fruits[fid] || 0}/{count as number}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })() : (
              <div className="text-center py-12 text-gray-500">
                <span className="text-6xl">👆</span>
                <p className="mt-4">点击左侧精灵查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBreed && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowBreed(false); setBreedFirst(null); }}>
          <div className="magic-card p-6 w-full max-w-3xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-2 text-center">💞 精灵配种</h3>
            <p className="text-center text-gray-400 mb-4">
              {breedFirst ? '请选择第二只精灵（需同种类）' : '请选择第一只精灵'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {player.spirits.filter(s => {
                if (!breedFirst) return true;
                const first = player.spirits.find(sp => sp.id === breedFirst);
                return first && s.speciesId === first.speciesId && s.id !== breedFirst;
              }).map(s => (
                <div
                  key={s.id}
                  onClick={() => {
                    if (breedFirst) handleBreed(s.id);
                    else setBreedFirst(s.id);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    breedFirst === s.id ? 'bg-magic-purple/30 border border-magic-purple' : 'bg-dark-bg hover:bg-magic-purple/20'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-4xl">{spiritSpecies.find(sp => sp.id === s.speciesId)?.sprite}</span>
                    <p className="text-sm font-bold truncate mt-1" style={{ color: RARITY_COLORS[s.rarity] }}>
                      {s.name}
                    </p>
                    <p className="text-xs text-gray-400">Lv.{s.level} · 配种:{s.breeding.breedCount}/{s.breeding.maxBreedCount}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowBreed(false); setBreedFirst(null); }} className="mt-6 w-full magic-btn magic-btn-secondary">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`${color} h-full transition-all`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-dark-bg rounded-lg p-2 text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}
