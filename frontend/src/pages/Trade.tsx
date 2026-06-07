import { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { TradeListing, RARITY_COLORS, RARITY_NAMES, ELEMENT_COLORS, ELEMENT_NAMES } from '../types';

export default function Trade() {
  const { player, spiritSpecies, setPlayer } = useGameStore();
  const [listings, setListings] = useState<TradeListing[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSpiritId, setSelectedSpiritId] = useState<string | null>(null);
  const [price, setPrice] = useState(100);
  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const [filter, setFilter] = useState<'all' | 'spirit'>('all');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    const res = await fetch('/api/trades');
    if (res.ok) setListings(await res.json());
  };

  const handleCreateListing = async () => {
    if (!player || !selectedSpiritId) return;
    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId: player.id,
        itemType: 'spirit',
        itemId: selectedSpiritId,
        price,
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setSelectedSpiritId(null);
      fetchListings();
      alert('上架成功！');
    }
  };

  const getSuggested = async (spiritId: string) => {
    const spirit = player?.spirits.find(s => s.id === spiritId);
    if (!spirit) return;
    const res = await fetch(`/api/trades/suggested-price?itemType=spirit&itemId=${spiritId}&rarity=${spirit.rarity}&element=${spirit.element}`);
    if (res.ok) {
      const data = await res.json();
      setSuggestedPrice(data.suggestedPrice);
      setPrice(data.suggestedPrice);
    }
  };

  const handleBuy = async (listingId: string) => {
    if (!player) return;
    if (!confirm('确定购买？')) return;
    const res = await fetch(`/api/trades/${listingId}/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyerId: player.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlayer(data.buyer);
      fetchListings();
      alert('购买成功！');
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const filtered = filter === 'all' ? listings : listings.filter(l => l.itemType === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">💰 交易市场</h1>
          <p className="text-gray-400">全服精灵与物品交易平台</p>
        </div>
        <div className="flex gap-3">
          <select value={filter} onChange={e => setFilter(e.target.value as any)} className="magic-input">
            <option value="all">全部</option>
            <option value="spirit">精灵</option>
          </select>
          <button onClick={() => setShowCreate(true)} className="magic-btn magic-btn-success">
            📢 上架物品
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="magic-card p-12 text-center text-gray-500">
          <span className="text-6xl">📭</span>
          <p className="mt-4">暂无在售物品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(listing => {
            const spirit = listing.itemData;
            const species = spiritSpecies.find(s => s.id === spirit?.speciesId);
            return (
              <div key={listing.id} className="magic-card p-4">
                {spirit && (
                  <>
                    <div className="text-center mb-3">
                      <span className="text-6xl animate-float">{species?.sprite}</span>
                      <p className="font-bold mt-2" style={{ color: RARITY_COLORS[spirit.rarity as keyof typeof RARITY_COLORS] }}>
                        [{RARITY_NAMES[spirit.rarity as keyof typeof RARITY_NAMES]}] {spirit.name}
                      </p>
                      <p className="text-xs" style={{ color: ELEMENT_COLORS[spirit.element as keyof typeof ELEMENT_COLORS] }}>
                        [{ELEMENT_NAMES[spirit.element as keyof typeof ELEMENT_NAMES]}] Lv.{spirit.level}
                      </p>
                      <p className="text-xs text-magic-gold mt-1">⚔️ 战力: {spirit.battleScore}</p>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1 mb-3">
                      <p>HP: {spirit.stats.maxHp} · 攻击: {spirit.stats.attack}</p>
                      <p>防御: {spirit.stats.defense} · 速度: {spirit.stats.speed}</p>
                      <p>技能数: {spirit.skills?.length || 0}</p>
                      {spirit.isMutant && <p className="text-magic-pink">🧬 变异精灵</p>}
                    </div>
                  </>
                )}
                <div className="border-t border-dark-border pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">卖家</span>
                    <span className="text-sm">{listing.sellerName}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400">建议价</span>
                    <span className="text-sm text-gray-300">💰 {listing.suggestedPrice}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold">售价</span>
                    <span className="text-xl text-magic-gold font-bold">💰 {listing.price}</span>
                  </div>
                  <button
                    onClick={() => handleBuy(listing.id)}
                    disabled={!player || player.coins < listing.price || listing.sellerId === player.id}
                    className="w-full magic-btn magic-btn-success"
                  >
                    {listing.sellerId === player?.id ? '自己的商品' : player && player.coins >= listing.price ? '立即购买' : '金币不足'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && player && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="magic-card p-6 w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-4 text-center">📢 上架精灵</h3>
            {!selectedSpiritId ? (
              <div>
                <p className="text-gray-400 mb-4">选择要出售的精灵：</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-auto">
                  {player.spirits.filter(s => s.level > 1).map(s => {
                    const species = spiritSpecies.find(sp => sp.id === s.speciesId);
                    return (
                      <div
                        key={s.id}
                        onClick={() => { setSelectedSpiritId(s.id); getSuggested(s.id); }}
                        className="bg-dark-bg rounded-xl p-3 cursor-pointer hover:bg-magic-purple/20 transition-colors text-center"
                      >
                        <span className="text-4xl">{species?.sprite}</span>
                        <p className="text-sm font-bold truncate mt-1" style={{ color: RARITY_COLORS[s.rarity] }}>
                          {s.name}
                        </p>
                        <p className="text-xs text-gray-400">Lv.{s.level} · ⚔️{s.battleScore}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                {(() => {
                  const s = player.spirits.find(sp => sp.id === selectedSpiritId)!;
                  const species = spiritSpecies.find(sp => sp.id === s.speciesId);
                  return (
                    <div>
                      <div className="text-center mb-4">
                        <span className="text-6xl animate-float">{species?.sprite}</span>
                        <p className="font-bold text-xl mt-2" style={{ color: RARITY_COLORS[s.rarity] }}>
                          [{RARITY_NAMES[s.rarity]}] {s.name}
                        </p>
                        <p className="text-sm text-magic-gold">⚔️ 战力: {s.battleScore}</p>
                      </div>
                      <div className="bg-dark-bg rounded-xl p-4 mb-4">
                        <p className="text-sm text-gray-400 mb-2">系统建议售价（基于近7天成交均价）:</p>
                        <p className="text-2xl text-magic-gold font-bold text-center">💰 {suggestedPrice}</p>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">设定售价:</label>
                        <input
                          type="number"
                          value={price}
                          onChange={e => setPrice(Math.max(1, parseInt(e.target.value) || 0))}
                          className="magic-input w-full text-xl text-center font-bold text-magic-gold"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setSelectedSpiritId(null)} className="flex-1 magic-btn magic-btn-secondary">
                          返回选择
                        </button>
                        <button onClick={handleCreateListing} className="flex-1 magic-btn magic-btn-success">
                          确认上架
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            <button onClick={() => { setShowCreate(false); setSelectedSpiritId(null); }} className="mt-4 w-full magic-btn">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
