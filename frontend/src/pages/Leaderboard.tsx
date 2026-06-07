import { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';

export default function Leaderboard() {
  const [tab, setTab] = useState<'collection' | 'arena' | 'guild'>('arena');
  const [data, setData] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    const res = await fetch(`/api/leaderboards/${tab}`);
    if (res.ok) setData(await res.json());
  };

  const tabs = [
    { id: 'arena', name: '竞技积分', icon: '⚔️' },
    { id: 'collection', name: '精灵收集', icon: '🧚' },
    { id: 'guild', name: '公会实力', icon: '🏰' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">🏆 全服排行榜</h1>
        <p className="text-gray-400">实时更新全服排名</p>
      </div>

      <div className="flex gap-3">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              tab === t.id
                ? 'bg-gradient-to-r from-magic-purple to-magic-pink text-white'
                : 'bg-dark-card text-gray-400 hover:text-white'
            }`}
          >
            <span className="mr-2">{t.icon}</span>
            {t.name}
          </button>
        ))}
      </div>

      <div className="magic-card p-6">
        {data.length === 0 ? (
          <p className="text-gray-500 text-center py-12">暂无数据</p>
        ) : (
          <div className="space-y-3">
            {data.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  i < 3
                    ? 'bg-gradient-to-r from-magic-purple/20 to-transparent border border-magic-purple/30'
                    : 'bg-dark-bg hover:bg-dark-bg/80'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
                  i === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                  i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                  i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                  'bg-gray-700 text-gray-300'
                }`}>
                  {i < 3 ? (i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉') : `#${i + 1}`}
                </div>
                <span className="text-4xl">{entry.avatar}</span>
                <div className="flex-1">
                  <p className="text-xl font-bold">{entry.name}</p>
                  <p className="text-sm text-gray-400">
                    {entry.change === 'up' ? '📈' : entry.change === 'down' ? '📉' : '➡️'}
                    &nbsp;排名 {entry.previousRank === entry.rank ? '不变' : `从 #${entry.previousRank}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-magic-gold">{entry.score.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">
                    {tab === 'arena' ? '竞技积分' : tab === 'collection' ? '收集积分' : '公会实力'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
