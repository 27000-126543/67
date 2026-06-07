import { useGameStore } from '../store';

export default function AnnouncementBar() {
  const { announcements } = useGameStore();

  return (
    <div className="bg-dark-card border-b border-dark-border px-6 py-3">
      <div className="flex items-center gap-4">
        <span className="text-2xl animate-sparkle">📢</span>
        <div className="flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap" style={{ animation: 'marquee 30s linear infinite' }}>
            {announcements.length > 0 ? (
              announcements.slice(0, 5).map((a, i) => (
                <span key={a.id} className="mr-12">
                  <span className="text-magic-gold">[{i === 0 ? '最新' : '公告'}]</span>
                  <span className="ml-2 text-gray-300">{a.message}</span>
                </span>
              ))
            ) : (
              <span className="text-gray-500">欢迎来到魔法精灵世界！</span>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
