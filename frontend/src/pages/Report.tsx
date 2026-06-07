import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { WeeklyReport, ELEMENT_NAMES, ELEMENT_COLORS, RARITY_NAMES } from '../types';

export default function Report() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    const res = await fetch('/api/reports/latest');
    if (res.ok) setReport(await res.json());
    setLoading(false);
  };

  const exportPDF = async () => {
    if (!report) return;
    window.open(`/api/reports/${report.id}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">📊</div>
          <p className="text-xl text-gray-400">生成周报中...</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const distributionData = Object.entries(report.spiritDistribution).map(([el, count]) => ({
    name: ELEMENT_NAMES[el as keyof typeof ELEMENT_NAMES] || el,
    value: count,
    fill: ELEMENT_COLORS[el as keyof typeof ELEMENT_COLORS] || '#888',
  }));

  const winRateData = Object.entries(report.arenaWinRates).map(([el, rate]) => ({
    name: ELEMENT_NAMES[el as keyof typeof ELEMENT_NAMES] || el,
    胜率: Math.round(rate * 100),
    fill: ELEMENT_COLORS[el as keyof typeof ELEMENT_COLORS] || '#888',
  }));

  const heatmapData = Object.entries(report.spiritHeatmap).map(([area, count]) => ({
    area,
    count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">📊 周报中心</h1>
          <p className="text-gray-400">
            {new Date(report.weekStart).toLocaleDateString()} - {new Date(report.weekEnd).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchReport} className="magic-btn magic-btn-secondary">
            🔄 刷新报告
          </button>
          <button onClick={exportPDF} className="magic-btn">
            📄 导出PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="总战斗数" value={report.totalBattles} icon="⚔️" color="text-red-400" />
        <StatCard title="总进化数" value={report.totalEvolutions} icon="✨" color="text-magic-purple" />
        <StatCard title="进化率" value={`${(report.evolutionRate * 100).toFixed(1)}%`} icon="📈" color="text-green-400" />
        <StatCard title="稀有捕获" value={report.rareCaptures.length} icon="🏆" color="text-magic-gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="magic-card p-6">
          <h2 className="text-xl font-bold mb-4">🧚 精灵元素分布</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {distributionData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="magic-card p-6">
          <h2 className="text-xl font-bold mb-4">⚔️ 元素竞技胜率</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={winRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#1A1033', border: '1px solid #8B5CF6' }}
                  labelStyle={{ color: 'white' }}
                />
                <Bar dataKey="胜率" radius={[8, 8, 0, 0]}>
                  {winRateData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="magic-card p-6">
        <h2 className="text-xl font-bold mb-4">🗺️ 精灵分布热力图</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={heatmapData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#888" />
              <YAxis type="category" dataKey="area" stroke="#888" width={100} />
              <Tooltip
                contentStyle={{ background: '#1A1033', border: '1px solid #8B5CF6' }}
                labelStyle={{ color: 'white' }}
              />
              <Bar dataKey="count" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="magic-card p-6">
          <h2 className="text-xl font-bold mb-4">🏆 玩家排行榜 Top 10</h2>
          <div className="space-y-2">
            {report.topPlayers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 bg-dark-bg rounded-lg p-3">
                <span className={`w-8 text-center font-bold ${
                  i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'
                }`}>
                  #{i + 1}
                </span>
                <span className="flex-1 font-medium">{p.name}</span>
                <span className="text-magic-gold font-bold">{p.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="magic-card p-6">
          <h2 className="text-xl font-bold mb-4">✨ 本周稀有捕获</h2>
          {report.rareCaptures.length === 0 ? (
            <p className="text-gray-500 text-center py-8">本周暂无稀有捕获记录</p>
          ) : (
            <div className="space-y-2">
              {report.rareCaptures.map((cap, i) => (
                <div key={i} className="flex items-center gap-3 bg-dark-bg rounded-lg p-3">
                  <span className="text-2xl">🧚</span>
                  <div className="flex-1">
                    <p className="font-medium">{cap.playerName}</p>
                    <p className="text-xs text-gray-400">捕获了</p>
                  </div>
                  <span className={`font-bold px-3 py-1 rounded-full text-sm`} style={{
                    background: `linear-gradient(135deg, ${
                      cap.rarity === 'legendary' ? '#F59E0B' : cap.rarity === 'epic' ? '#8B5CF6' : '#EC4899'
                    }33, transparent)`,
                    color: cap.rarity === 'legendary' ? '#F59E0B' : cap.rarity === 'epic' ? '#8B5CF6' : '#EC4899',
                  }}>
                    [{RARITY_NAMES[cap.rarity]}] {cap.spiritName}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {report.topGuilds.length > 0 && (
        <div className="magic-card p-6">
          <h2 className="text-xl font-bold mb-4">🏰 公会排行榜 Top 10</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.topGuilds.map((g, i) => (
              <div key={g.id} className="flex items-center gap-3 bg-dark-bg rounded-lg p-3">
                <span className={`w-8 text-center font-bold ${
                  i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'
                }`}>
                  #{i + 1}
                </span>
                <span className="text-2xl">🏰</span>
                <span className="flex-1 font-medium">{g.name}</span>
                <span className="text-magic-purple font-bold">{g.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: any; icon: string; color: string }) {
  return (
    <div className="magic-card p-6">
      <div className="flex items-center gap-4">
        <span className="text-4xl">{icon}</span>
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
