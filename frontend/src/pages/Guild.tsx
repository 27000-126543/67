import { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { Guild, GuildRole } from '../types';

export default function GuildPage() {
  const { player, guild, setGuild, setPlayer } = useGameStore();
  const [allGuilds, setAllGuilds] = useState<Guild[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildDesc, setNewGuildDesc] = useState('');
  const [contributeAmount, setContributeAmount] = useState(100);
  const [promoteTarget, setPromoteTarget] = useState<string | null>(null);

  useEffect(() => {
    fetchGuilds();
  }, []);

  const fetchGuilds = async () => {
    const res = await fetch('/api/guilds');
    if (res.ok) {
      const data = await res.json();
      setAllGuilds(data);
      if (player?.guildId) {
        setGuild(data.find((g: Guild) => g.id === player.guildId) || null);
      }
    }
  };

  const handleCreateGuild = async () => {
    if (!player || !newGuildName.trim()) return;
    const res = await fetch('/api/guilds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, name: newGuildName, description: newGuildDesc }),
    });
    if (res.ok) {
      const data = await res.json();
      setGuild(data.guild);
      setPlayer(data.player);
      setShowCreate(false);
      setNewGuildName('');
      fetchGuilds();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handleJoinGuild = async (guildId: string) => {
    if (!player) return;
    const res = await fetch(`/api/guilds/${guildId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setGuild(data.guild);
      setPlayer(data.player);
      fetchGuilds();
    }
  };

  const handleLeaveGuild = async () => {
    if (!player || !guild || !confirm('确定要离开公会吗？')) return;
    const res = await fetch(`/api/guilds/${guild.id}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id }),
    });
    if (res.ok) {
      setGuild(null);
      setPlayer({ ...player, guildId: null, guildRole: null });
      fetchGuilds();
    }
  };

  const handleContribute = async () => {
    if (!player || !guild) return;
    const res = await fetch(`/api/guilds/${guild.id}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, amount: contributeAmount }),
    });
    if (res.ok) {
      const data = await res.json();
      setGuild(data.guild);
      setPlayer(data.player);
      fetchGuilds();
    }
  };

  const handlePromote = async (targetId: string, role: GuildRole) => {
    if (!player || !guild || player.guildRole !== 'president') return;
    const res = await fetch(`/api/guilds/${guild.id}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presidentId: player.id, targetId, role }),
    });
    if (res.ok) {
      const data = await res.json();
      setGuild(data.guild);
      fetchGuilds();
      setPromoteTarget(null);
    }
  };

  if (!player) return null;

  if (!guild) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">🏰 公会系统</h1>
            <p className="text-gray-400">加入公会解锁联合花园和竞技场加成</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="magic-btn">
            ✨ 创建公会（10000金币）
          </button>
        </div>

        <div className="magic-card p-6">
          <h2 className="text-xl font-bold mb-4">可加入的公会</h2>
          {allGuilds.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无公会，创建第一个吧！</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allGuilds.map(g => (
                <div key={g.id} className="bg-dark-bg rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{g.logo}</span>
                    <div className="flex-1">
                      <p className="font-bold text-lg">{g.name}</p>
                      <p className="text-xs text-gray-400">Lv.{g.level} · {g.memberIds.length}人</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{g.description || '暂无描述'}</p>
                  <div className="text-xs text-gray-500 mb-3 grid grid-cols-3 gap-1">
                    <span>捕获+{((g.jointArena.bonuses.captureBonus) * 100).toFixed(0)}%</span>
                    <span>经验+{((g.jointArena.bonuses.expBonus) * 100).toFixed(0)}%</span>
                    <span>果实+{((g.jointArena.bonuses.fruitBonus) * 100).toFixed(0)}%</span>
                  </div>
                  <button onClick={() => handleJoinGuild(g.id)} className="w-full magic-btn magic-btn-success text-sm">
                    加入公会
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
            <div className="magic-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h3 className="text-2xl font-bold mb-4 text-center">✨ 创建公会</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">公会名称</label>
                  <input
                    type="text"
                    value={newGuildName}
                    onChange={e => setNewGuildName(e.target.value)}
                    placeholder="请输入公会名称"
                    className="magic-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">公会描述</label>
                  <textarea
                    value={newGuildDesc}
                    onChange={e => setNewGuildDesc(e.target.value)}
                    placeholder="介绍一下你的公会..."
                    className="magic-input w-full h-24 resize-none"
                  />
                </div>
                <p className="text-sm text-magic-gold text-center">创建费用: 💰 10,000 金币</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowCreate(false)} className="flex-1 magic-btn magic-btn-secondary">
                    取消
                  </button>
                  <button
                    onClick={handleCreateGuild}
                    disabled={!newGuildName.trim() || player.coins < 10000}
                    className="flex-1 magic-btn"
                  >
                    创建
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="magic-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <span className="text-6xl">{guild.logo}</span>
            <div>
              <h1 className="text-3xl font-bold">{guild.name}</h1>
              <p className="text-gray-400">Lv.{guild.level} · {guild.memberIds.length} 名成员</p>
              <p className="text-sm text-gray-500 mt-1">{guild.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">我的职位</p>
            <p className="text-lg font-bold text-magic-gold">
              {player.guildRole === 'president' ? '👑 会长' : player.guildRole === 'vice_president' ? '⚔️ 副会长' : '👤 成员'}
            </p>
            {player.guildRole !== 'president' && (
              <button onClick={handleLeaveGuild} className="mt-2 magic-btn magic-btn-danger text-sm">
                离开公会
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <GuildStat label="公会经验" value={`${guild.exp} / ${guild.level * 50000}`} />
          <GuildStat label="捕获加成" value={`+${((guild.jointArena.bonuses.captureBonus) * 100).toFixed(0)}%`} />
          <GuildStat label="经验加成" value={`+${((guild.jointArena.bonuses.expBonus) * 100).toFixed(0)}%`} />
          <GuildStat label="果实加成" value={`+${((guild.jointArena.bonuses.fruitBonus) * 100).toFixed(0)}%`} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="magic-card p-6">
          <h2 className="text-xl font-bold mb-4">💰 公会贡献</h2>
          <div className="bg-dark-bg rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-400 mb-2">我的贡献: <span className="text-magic-gold font-bold">{guild.contributions[player.id] || 0}</span></p>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={contributeAmount}
                onChange={e => setContributeAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="magic-input flex-1"
              />
              <button
                onClick={handleContribute}
                disabled={player.coins < contributeAmount}
                className="magic-btn magic-btn-success"
              >
                贡献金币
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500">贡献金币可提升公会等级，解锁更多加成和联合花园空间</p>
        </div>

        <div className="magic-card p-6">
          <h2 className="text-xl font-bold mb-4">🏰 联合花园</h2>
          <div className="bg-dark-bg rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400">花园容量</span>
              <span className="font-bold">{guild.jointGarden.size} 格</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400">当前植物</span>
              <span className="font-bold">{guild.jointGarden.plants.filter(p => !p.harvested).length} 株</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">捕获加成</span>
              <span className="font-bold text-magic-green">+{((guild.jointGarden.captureRateBonus - 1) * 100).toFixed(0)}%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">公会成员共同维护联合花园，可吸引更多稀有精灵</p>
        </div>
      </div>

      <div className="magic-card p-6">
        <h2 className="text-xl font-bold mb-4">👥 成员列表 ({guild.memberIds.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {guild.memberIds.map(mid => {
            const isPresident = mid === guild.presidentId;
            const isVice = guild.vicePresidentIds.includes(mid);
            const contrib = guild.contributions[mid] || 0;
            return (
              <div key={mid} className="bg-dark-bg rounded-xl p-3 flex items-center gap-3">
                <span className="text-3xl">🧙</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">
                    {isPresident ? '👑' : isVice ? '⚔️' : '👤'} 成员
                  </p>
                  <p className="text-xs text-gray-400">贡献: {contrib}</p>
                </div>
                {player.guildRole === 'president' && !isPresident && (
                  <button
                    onClick={() => setPromoteTarget(mid)}
                    className="text-xs magic-btn magic-btn-secondary py-1 px-2"
                  >
                    {isVice ? '降职' : '晋升'}
                  </button>
                )}
                {promoteTarget === mid && (
                  <div className="absolute mt-20 right-0 z-10">
                    <button onClick={() => handlePromote(mid, isVice ? 'member' : 'vice_president')}>
                      确认
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GuildStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-dark-bg rounded-xl p-4 text-center">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-lg font-bold text-magic-purple mt-1">{value}</p>
    </div>
  );
}
