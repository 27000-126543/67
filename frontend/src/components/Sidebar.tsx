import { useGameStore } from '../store';

const navItems = [
  { id: 'garden', name: '精灵花园', icon: '🌸' },
  { id: 'spirits', name: '我的精灵', icon: '🧚' },
  { id: 'arena', name: '竞技联赛', icon: '⚔️' },
  { id: 'trade', name: '交易市场', icon: '💰' },
  { id: 'guild', name: '公会系统', icon: '🏰' },
  { id: 'leaderboard', name: '全服排行榜', icon: '🏆' },
  { id: 'report', name: '周报中心', icon: '📊' },
];

export default function Sidebar() {
  const { player, currentPage, setCurrentPage } = useGameStore();

  return (
    <aside className="w-64 bg-dark-card border-r border-dark-border flex flex-col">
      <div className="p-6 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <span className="text-4xl animate-float">✨</span>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-magic-purple to-magic-pink bg-clip-text text-transparent">
              魔法精灵世界
            </h1>
            <p className="text-xs text-gray-400">Magic Spirit World</p>
          </div>
        </div>
      </div>

      {player && (
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{player.avatar}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{player.displayName}</p>
              <p className="text-xs text-gray-400">Lv.{player.level}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-dark-bg rounded-lg p-2 text-center">
              <p className="text-yellow-400 font-bold">{player.coins}</p>
              <p className="text-xs text-gray-400">金币</p>
            </div>
            <div className="bg-dark-bg rounded-lg p-2 text-center">
              <p className="text-purple-400 font-bold">{player.gems}</p>
              <p className="text-xs text-gray-400">宝石</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <p className="text-blue-400 font-semibold">{player.spirits.length}</p>
              <p className="text-gray-500">精灵</p>
            </div>
            <div className="text-center">
              <p className="text-red-400 font-semibold">{player.arenaScore}</p>
              <p className="text-gray-500">竞技分</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 p-3 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-200 ${
              currentPage === item.id
                ? 'bg-gradient-to-r from-magic-purple/30 to-magic-pink/30 border border-magic-purple/50 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-dark-border text-center text-xs text-gray-500">
        <p>v1.0.0 · 魔法世界</p>
      </div>
    </aside>
  );
}
