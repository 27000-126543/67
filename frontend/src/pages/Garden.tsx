import { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import {
  WEATHER_NAMES, RARITY_COLORS, RARITY_NAMES, FRUIT_NAMES, FRUIT_SPRITES
} from '../types';

export default function Garden() {
  const { player, plantSpecies, ballTypes, spiritSpecies, setPlayer } = useGameStore();
  const [showPlantShop, setShowPlantShop] = useState(false);
  const [showBallShop, setShowBallShop] = useState(false);
  const [captureTarget, setCaptureTarget] = useState<string | null>(null);
  const [captureResult, setCaptureResult] = useState<any>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  if (!player) return null;

  const garden = player.garden;
  const activeEncounters = garden.attractedSpirits.filter(e => !e.isCaptured && Date.now() < e.expiresAt);

  const handlePlant = async (plantId: string) => {
    const res = await fetch('/api/garden/plant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, plantSpeciesId: plantId }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlayer(data);
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handleHarvest = async (plantId: string) => {
    const res = await fetch('/api/garden/harvest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, plantId }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlayer(data.player);
    }
  };

  const handleRemove = async (plantId: string) => {
    const res = await fetch('/api/garden/remove-plant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, plantId }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlayer(data);
    }
  };

  const handleCapture = async (encounterId: string, ballId: string) => {
    const res = await fetch('/api/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, encounterId, ballId }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlayer(data.player);
      setCaptureResult(data);
      setCaptureTarget(null);
      setTimeout(() => setCaptureResult(null), 3000);
    }
  };

  const handleBuyBall = async (ballId: string) => {
    const ball = ballTypes.find(b => b.id === ballId);
    if (!ball) return;
    const amount = prompt(`购买 ${ball.name}（单价 ${ball.cost} 金币），请输入数量：`, '1');
    if (!amount) return;
    const res = await fetch('/api/shop/buy-ball', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, ballId, amount: parseInt(amount) }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlayer(data);
    }
  };

  const plantSlots = Array.from({ length: garden.size }, (_, i) => garden.plants.filter(p => !p.harvested)[i]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">🌸 我的精灵花园</h1>
          <p className="text-gray-400">种植魔法植物，吸引野生精灵降临</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowPlantShop(true)} className="magic-btn magic-btn-success">
            🌱 植物商店
          </button>
          <button onClick={() => setShowBallShop(true)} className="magic-btn">
            🔴 精灵球商店
          </button>
        </div>
      </div>

      {captureResult && (
        <div className={`p-4 rounded-xl text-center text-xl font-bold animate-pulse ${
          captureResult.success ? 'bg-green-500/20 border border-green-500 text-green-400' : 'bg-red-500/20 border border-red-500 text-red-400'
        }`}>
          {captureResult.success ? '🎉 捕获成功！精灵已加入你的队伍！' : `💔 捕获失败...（成功率: ${(captureResult.rate * 100).toFixed(1)}%）`}
        </div>
      )}

      <div className="magic-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-4xl">{WEATHER_NAMES[garden.currentWeather].split(' ')[0]}</div>
          <div>
            <p className="font-bold">当前天气：{WEATHER_NAMES[garden.currentWeather]}</p>
            <p className="text-sm text-gray-400">天气会影响不同属性精灵的出现概率</p>
          </div>
        </div>
        <div className="text-right text-sm text-gray-400">
          <p>花园容量：{garden.plants.filter(p => !p.harvested).length} / {garden.size}</p>
          <p>捕获加成：+{((garden.captureRateBonus - 1) * 100).toFixed(0)}%</p>
        </div>
      </div>

      {activeEncounters.length > 0 && (
        <div className="magic-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="animate-sparkle">✨</span> 野生精灵出没！
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEncounters.map(enc => {
              const species = spiritSpecies.find(s => s.id === enc.speciesId);
              const timeLeft = Math.max(0, Math.floor((enc.expiresAt - Date.now()) / 1000));
              return (
                <div
                  key={enc.id}
                  className={`p-4 rounded-xl border-2 rarity-glow-${enc.rarity} cursor-pointer hover:scale-105 transition-transform`}
                  style={{ borderColor: RARITY_COLORS[enc.rarity], background: `linear-gradient(145deg, ${RARITY_COLORS[enc.rarity]}20, transparent)` }}
                  onClick={() => setCaptureTarget(enc.id)}
                >
                  <div className="text-center">
                    <div className="text-6xl mb-2 animate-float">{species?.sprite || '🧚'}</div>
                    <p className="font-bold" style={{ color: RARITY_COLORS[enc.rarity] }}>
                      [{RARITY_NAMES[enc.rarity]}] {species?.name}
                    </p>
                    <p className="text-sm text-gray-400">Lv.{enc.level} · 捕获难度: {(enc.captureDifficulty * 100).toFixed(0)}%</p>
                    <p className="text-xs text-yellow-400 mt-2">⏱️ 剩余 {timeLeft}s</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {captureTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setCaptureTarget(null)}>
          <div className="magic-card p-6 w-96" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-center">选择精灵球</h3>
            <div className="space-y-2">
              {ballTypes.map(ball => {
                const count = player.balls[ball.id] || 0;
                return (
                  <button
                    key={ball.id}
                    onClick={() => count > 0 && handleCapture(captureTarget, ball.id)}
                    disabled={count <= 0}
                    className={`w-full p-3 rounded-lg flex items-center justify-between transition-all ${
                      count > 0 ? 'bg-dark-bg hover:bg-magic-purple/20 cursor-pointer' : 'bg-dark-bg opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{ball.sprite}</span>
                      <div className="text-left">
                        <p className="font-semibold">{ball.name}</p>
                        <p className="text-xs text-gray-400">{ball.description}</p>
                      </div>
                    </div>
                    <span className="text-magic-gold font-bold">x{count}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setCaptureTarget(null)} className="mt-4 w-full magic-btn magic-btn-secondary">
              取消
            </button>
          </div>
        </div>
      )}

      <div className="magic-card p-6">
        <h2 className="text-xl font-bold mb-4">🌱 种植区</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {plantSlots.map((plant, i) => {
            if (!plant) {
              return (
                <div
                  key={i}
                  onClick={() => setShowPlantShop(true)}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-magic-purple hover:text-magic-purple transition-colors"
                >
                  <span className="text-4xl mb-1">➕</span>
                  <p className="text-sm">空位</p>
                </div>
              );
            }
            const species = plantSpecies.find(s => s.id === plant.speciesId);
            const elapsed = Date.now() - plant.plantedAt;
            const total = species?.growthTime || 60000;
            const progress = Math.min(100, (elapsed / total) * 100);
            return (
              <div key={plant.id} className="aspect-square rounded-xl bg-dark-bg p-3 flex flex-col items-center justify-between">
                {plant.harvested ? (
                  <div className="text-center" onClick={() => handleRemove(plant.id)}>
                    <p className="text-gray-500 text-sm">已收获</p>
                    <p className="text-xs text-magic-purple cursor-pointer">点击清理</p>
                  </div>
                ) : (
                  <>
                    <span className={`text-4xl ${plant.isReady ? 'animate-sparkle' : ''}`} style={{ opacity: 0.3 + progress * 0.007 }}>
                      {species?.sprite || '🌱'}
                    </span>
                    <div className="w-full text-center">
                      <p className="text-xs font-medium truncate">{species?.name}</p>
                      <div className="h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full ${plant.isReady ? 'bg-magic-green' : 'bg-magic-purple'} transition-all`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {plant.isReady ? (
                        <button
                          onClick={() => handleHarvest(plant.id)}
                          className="mt-1 text-xs magic-btn magic-btn-success py-1 px-2 w-full"
                        >
                          收获
                        </button>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">{Math.ceil((total - elapsed) / 1000)}s</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="magic-card p-6">
        <h2 className="text-xl font-bold mb-4">🍎 果实仓库</h2>
        {Object.keys(player.fruits).length === 0 ? (
          <p className="text-gray-500 text-center py-4">还没有果实，去种植魔法植物吧！</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {Object.entries(player.fruits).map(([fruitId, count]) => (
              <div key={fruitId} className="bg-dark-bg rounded-xl p-3 text-center">
                <span className="text-3xl">{FRUIT_SPRITES[fruitId] || '🍎'}</span>
                <p className="text-sm mt-1">{FRUIT_NAMES[fruitId] || fruitId}</p>
                <p className="text-magic-gold font-bold">x{count}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPlantShop && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPlantShop(false)}>
          <div className="magic-card p-6 w-full max-w-3xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-4 text-center">🌱 植物商店</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plantSpecies.map(p => (
                <div key={p.id} className="bg-dark-bg rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">{p.sprite}</span>
                    <div className="flex-1">
                      <p className="font-bold">{p.name}</p>
                      <p className="text-xs text-gray-400">{(p.growthTime / 1000).toFixed(0)}秒成熟 · 产{p.fruitYield}个果实</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-3 h-8 overflow-hidden">{p.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-magic-gold font-bold">💰 {p.cost}</span>
                    <button
                      onClick={() => handlePlant(p.id)}
                      disabled={player.coins < p.cost}
                      className="magic-btn magic-btn-success py-1.5 px-4 text-sm"
                    >
                      种植
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowPlantShop(false)} className="mt-6 w-full magic-btn magic-btn-secondary">
              关闭
            </button>
          </div>
        </div>
      )}

      {showBallShop && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBallShop(false)}>
          <div className="magic-card p-6 w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-4 text-center">🔴 精灵球商店</h3>
            <div className="space-y-3">
              {ballTypes.map(b => {
                const owned = player.balls[b.id] || 0;
                return (
                  <div key={b.id} className="bg-dark-bg rounded-xl p-4 flex items-center gap-4">
                    <span className="text-4xl">{b.sprite}</span>
                    <div className="flex-1">
                      <p className="font-bold">{b.name} <span className="text-xs text-gray-400 ml-2">已拥有: {owned}</span></p>
                      <p className="text-sm text-gray-400">{b.description}</p>
                      <p className="text-xs text-magic-green">基础捕获率: {(b.baseCaptureRate * 100).toFixed(0)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-magic-gold font-bold mb-1">💰 {b.cost}</p>
                      <button
                        onClick={() => handleBuyBall(b.id)}
                        disabled={player.coins < b.cost}
                        className="magic-btn py-1 px-4 text-sm"
                      >
                        购买
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowBallShop(false)} className="mt-6 w-full magic-btn magic-btn-secondary">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
