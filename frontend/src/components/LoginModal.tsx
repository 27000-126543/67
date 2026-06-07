import { useState } from 'react';

interface Props {
  onLogin: (username: string) => void;
}

export default function LoginModal({ onLogin }: Props) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) onLogin(username.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="magic-card p-8 w-96 text-center">
        <div className="text-6xl mb-4 animate-float">🧚✨</div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-magic-purple to-magic-pink bg-clip-text text-transparent">
          欢迎来到魔法精灵世界
        </h2>
        <p className="text-gray-400 mb-6">开启你的精灵收集与竞技之旅</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入你的魔法师名字"
            className="magic-input w-full mb-4"
            autoFocus
          />
          <button type="submit" className="magic-btn w-full" disabled={!username.trim()}>
            进入魔法世界
          </button>
        </form>
        <div className="mt-6 text-sm text-gray-500">
          <p>🌸 开辟精灵花园种植魔法植物</p>
          <p>🧚 捕获稀有精灵培养进化</p>
          <p>⚔️ 参加竞技联赛争夺荣耀</p>
        </div>
      </div>
    </div>
  );
}
