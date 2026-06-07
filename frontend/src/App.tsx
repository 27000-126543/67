import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from './store';
import { Player, Announcement, ActiveBattle } from './types';
import Sidebar from './components/Sidebar';
import Garden from './pages/Garden';
import Spirits from './pages/Spirits';
import Arena from './pages/Arena';
import Trade from './pages/Trade';
import Guild from './pages/Guild';
import Leaderboard from './pages/Leaderboard';
import Report from './pages/Report';
import BattleArena from './pages/BattleArena';
import AnnouncementBar from './components/AnnouncementBar';
import LoginModal from './components/LoginModal';

let socket: Socket | null = null;

export default function App() {
  const {
    player, currentPage, activeBattle, setPlayer, setSpiritSpecies,
    setPlantSpecies, setBallTypes, setAnnouncements, addAnnouncement,
    setActiveBattle, setGuild,
  } = useGameStore();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/game-data');
        const data = await res.json();
        setSpiritSpecies(data.spiritSpecies);
        setPlantSpecies(data.plantSpecies);
        setBallTypes(data.ballTypes);

        const annRes = await fetch('/api/announcements');
        const annData = await annRes.json();
        setAnnouncements(annData);

        const savedPlayerId = localStorage.getItem('playerId');
        const savedUsername = localStorage.getItem('username');

        if (savedPlayerId) {
          const pRes = await fetch(`/api/players/${savedPlayerId}`);
          if (pRes.ok) {
            const pData: Player = await pRes.json();
            setPlayer(pData);
            initSocket(pData.id);
            if (pData.guildId) {
              fetchGuild(pData.guildId);
            }
            return;
          }
        }
        if (savedUsername) {
          handleLogin(savedUsername);
        } else {
          setShowLogin(true);
        }
      } catch (e) {
        console.error(e);
        setShowLogin(true);
      }
    };
    init();
  }, []);

  const initSocket = (playerId: string) => {
    socket = io({ transports: ['websocket', 'polling'] });
    socket.on('connect', () => {
      socket?.emit('register', playerId);
    });
    socket.on('player_data', (data: Player) => {
      setPlayer(data);
    });
    socket.on('announcement', (data: Announcement) => {
      addAnnouncement(data);
    });
    socket.on('battle_found', (data: { battle: ActiveBattle; opponentName: string }) => {
      console.log('战斗已找到:', data);
      if (data.battle) {
        setActiveBattle(data.battle);
      }
    });
    socket.on('battle_update', (battle: ActiveBattle) => {
      setActiveBattle(battle);
    });
    socket.on('battle_end', (data: any) => {
      console.log('战斗结束:', data);
      setTimeout(() => {
        if (player) fetchPlayer(player.id);
      }, 2000);
    });
    socket.on('matchmaking_joined', () => {
      console.log('已加入匹配队列');
    });
    socket.on('matchmaking_left', () => {
      console.log('已离开匹配队列');
    });
    socket.on('battle_error', (data: any) => {
      alert(data.message);
    });
    socket.on('spirit_appeared', () => {
      if (player) fetchPlayer(player.id);
    });
  };

  const fetchPlayer = async (id: string) => {
    const res = await fetch(`/api/players/${id}`);
    if (res.ok) {
      const data: Player = await res.json();
      setPlayer(data);
      if (data.guildId) fetchGuild(data.guildId);
    }
  };

  const fetchGuild = async (id: string) => {
    const res = await fetch('/api/guilds');
    if (res.ok) {
      const guilds = await res.json();
      setGuild(guilds.find((g: any) => g.id === id) || null);
    }
  };

  const handleLogin = async (username: string) => {
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data: Player = await res.json();
      setPlayer(data);
      localStorage.setItem('playerId', data.id);
      localStorage.setItem('username', data.username);
      setShowLogin(false);
      initSocket(data.id);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => fetchPlayer(player.id), 5000);
    return () => clearInterval(interval);
  }, [player?.id]);

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {showLogin && <LoginModal onLogin={handleLogin} />}
        <div className="text-center">
          <div className="text-6xl mb-4 animate-sparkle">✨🧚✨</div>
          <p className="text-xl text-purple-300">正在加载魔法世界...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    if (activeBattle) return <BattleArena socket={socket} onExit={() => setActiveBattle(null)} />;
    switch (currentPage) {
      case 'garden': return <Garden />;
      case 'spirits': return <Spirits />;
      case 'arena': return <Arena socket={socket} />;
      case 'trade': return <Trade />;
      case 'guild': return <Guild />;
      case 'leaderboard': return <Leaderboard />;
      case 'report': return <Report />;
      default: return <Garden />;
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <AnnouncementBar />
        <main className="flex-1 p-6 overflow-auto">
          {renderPage()}
        </main>
      </div>
      {showLogin && <LoginModal onLogin={handleLogin} />}
    </div>
  );
}
