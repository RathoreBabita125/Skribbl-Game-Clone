import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import './HomePage.css';

const AVATAR_COLORS = ['#e94560','#f5a623','#00d4aa','#7c3aed','#3b82f6','#ec4899','#10b981','#f59e0b'];

export default function HomePage() {
  const { state, actions } = useGame();
  const [tab, setTab] = useState('home'); // home, create, join
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [settings, setSettings] = useState({
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    wordCount: 3,
    hints: 2
  });
  const [publicRooms, setPublicRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Check URL for room code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setRoomCode(code.toUpperCase());
      setTab('join');
    }
  }, []);

  const fetchPublicRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setPublicRooms(data);
    } catch (e) {
      console.error('Failed to fetch rooms', e);
    }
    setLoadingRooms(false);
  };

  useEffect(() => {
    if (tab === 'join') fetchPublicRooms();
  }, [tab]);

  const handleCreate = () => {
    if (!playerName.trim()) return;
    actions.createRoom(playerName.trim(), settings, isPrivate);
  };

  const handleJoin = (code) => {
    if (!playerName.trim() || !(code || roomCode).trim()) return;
    actions.joinRoom((code || roomCode).trim().toUpperCase(), playerName.trim());
  };

  return (
    <div className="home-page bg-dots">
      <div className="home-bg-gradient" />

      <header className="home-header">
        <div className="home-logo">
          <span className="logo-icon">✏️</span>
          <h1>Sketchly</h1>
        </div>
        <p className="home-tagline">Draw, guess, and have a blast!</p>
      </header>

      <main className="home-main">
        <div className="home-card card">
          {/* Name input always visible */}
          <div className="name-section">
            <label className="form-label">Your name</label>
            <input
              className="input"
              placeholder="Enter your name..."
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && tab === 'join' && handleJoin()}
            />
          </div>

          {state.error && (
            <div className="error-banner fade-in">
              ⚠️ {state.error}
              <button onClick={actions.clearError} className="error-close">✕</button>
            </div>
          )}

          {tab === 'home' && (
            <div className="home-buttons fade-in">
              <button className="btn btn-primary home-btn" onClick={() => setTab('create')}>
                🎨 Create Room
              </button>
              <button className="btn btn-secondary home-btn" onClick={() => setTab('join')}>
                🚪 Join Room
              </button>
            </div>
          )}

          {tab === 'create' && (
            <div className="create-section fade-in">
              <div className="section-header">
                <button className="back-btn" onClick={() => setTab('home')}>← Back</button>
                <h2>Create Room</h2>
              </div>

              <div className="settings-grid">
                <div className="setting-item">
                  <label className="form-label">Max Players</label>
                  <div className="range-row">
                    <input
                      type="range" min="2" max="20"
                      value={settings.maxPlayers}
                      onChange={e => setSettings(s => ({ ...s, maxPlayers: +e.target.value }))}
                    />
                    <span className="range-val">{settings.maxPlayers}</span>
                  </div>
                </div>

                <div className="setting-item">
                  <label className="form-label">Rounds</label>
                  <div className="range-row">
                    <input
                      type="range" min="2" max="10"
                      value={settings.rounds}
                      onChange={e => setSettings(s => ({ ...s, rounds: +e.target.value }))}
                    />
                    <span className="range-val">{settings.rounds}</span>
                  </div>
                </div>

                <div className="setting-item">
                  <label className="form-label">Draw Time (seconds)</label>
                  <div className="range-row">
                    <input
                      type="range" min="15" max="240" step="5"
                      value={settings.drawTime}
                      onChange={e => setSettings(s => ({ ...s, drawTime: +e.target.value }))}
                    />
                    <span className="range-val">{settings.drawTime}s</span>
                  </div>
                </div>

                <div className="setting-item">
                  <label className="form-label">Word Choices</label>
                  <div className="range-row">
                    <input
                      type="range" min="1" max="5"
                      value={settings.wordCount}
                      onChange={e => setSettings(s => ({ ...s, wordCount: +e.target.value }))}
                    />
                    <span className="range-val">{settings.wordCount}</span>
                  </div>
                </div>

                <div className="setting-item">
                  <label className="form-label">Hints</label>
                  <div className="range-row">
                    <input
                      type="range" min="0" max="5"
                      value={settings.hints}
                      onChange={e => setSettings(s => ({ ...s, hints: +e.target.value }))}
                    />
                    <span className="range-val">{settings.hints === 0 ? 'Off' : settings.hints}</span>
                  </div>
                </div>

                <div className="setting-item">
                  <label className="form-label">Room Type</label>
                  <div className="toggle-row">
                    <button
                      className={`toggle-btn ${!isPrivate ? 'active' : ''}`}
                      onClick={() => setIsPrivate(false)}
                    >🌍 Public</button>
                    <button
                      className={`toggle-btn ${isPrivate ? 'active' : ''}`}
                      onClick={() => setIsPrivate(true)}
                    >🔒 Private</button>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary home-btn"
                onClick={handleCreate}
                disabled={!playerName.trim()}
              >
                🎨 Create Room
              </button>
            </div>
          )}

          {tab === 'join' && (
            <div className="join-section fade-in">
              <div className="section-header">
                <button className="back-btn" onClick={() => setTab('home')}>← Back</button>
                <h2>Join Room</h2>
              </div>

              <div className="join-code-row">
                <input
                  className="input"
                  placeholder="Enter room code..."
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => handleJoin()}
                  disabled={!playerName.trim() || !roomCode.trim()}
                >
                  Join
                </button>
              </div>

              <div className="public-rooms">
                <div className="rooms-header">
                  <span>Public Rooms</span>
                  <button className="refresh-btn" onClick={fetchPublicRooms}>↻ Refresh</button>
                </div>

                {loadingRooms ? (
                  <div className="loading-rooms">Loading rooms...</div>
                ) : publicRooms.length === 0 ? (
                  <div className="no-rooms">No public rooms available. Create one!</div>
                ) : (
                  <div className="rooms-list">
                    {publicRooms.map(room => (
                      <div key={room.id} className="room-item">
                        <div className="room-info">
                          <span className="room-code">{room.id}</span>
                          <span className="room-players">
                            {room.playerCount}/{room.maxPlayers} players
                          </span>
                          <span className="room-details">{room.rounds} rounds · {room.drawTime}s</span>
                        </div>
                        <button
                          className="btn btn-success room-join-btn"
                          onClick={() => handleJoin(room.id)}
                          disabled={!playerName.trim()}
                        >
                          Join
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="home-features">
          <div className="feature-item">🎨 Real-time drawing</div>
          <div className="feature-item">💬 Live chat & guessing</div>
          <div className="feature-item">🏆 Score & leaderboard</div>
          <div className="feature-item">🔒 Private rooms</div>
        </div>
      </main>
    </div>
  );
}
