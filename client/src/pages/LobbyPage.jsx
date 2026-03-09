import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import './LobbyPage.css';

import PlayerAvatar from '../components/PlayerAvatar';

export default function LobbyPage() {
  const { state, actions } = useGame();
  const { roomId, players, myPlayer, roomSettings, isPrivate, amHost } = state;
  const [copied, setCopied] = useState(false);

  // Derive isHost: check myPlayer directly AND also check players list as fallback
  const isHost = amHost === true;
  const canStart = players.length >= 2;

  const inviteLink = `${window.location.origin}?room=${roomId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='lobby-page'>
      <div className="lobby-page bg-dots">
        <div className="home-bg-gradient" style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 20% -20%, rgba(124,58,237,0.15) 0%,transparent 60%),radial-gradient(ellipse 60% 40% at 80% 110%, rgba(0,212,170,0.1) 0%,transparent 60%)', pointerEvents: 'none' }} />

        <header className="lobby-header">
          <div className="lobby-logo">
            <div className="game-logo">
              <img src="./logo.gif" alt="" />
            </div>
          </div>
          <button className="btn btn-secondary leave-btn" onClick={actions.leaveRoom}>
            ← Leave
          </button>
        </header>

        <div className="lobby-content">
          <div className="lobby-main">
            {/* Room Info */}
            <div className="room-info-card card">
              <div className="room-code-section">
                <span className="room-label">Room Code</span>
                <div className="room-code-display">
                  <span className="code-text">{roomId}</span>
                  <button className="copy-btn" onClick={copyCode} title="Copy code">
                    {copied ? <i class="fa-solid fa-check white"></i> : <i class="fa-solid fa-link"></i>}
                  </button>
                </div>
              </div>
              <div className="invite-section">
                <button className="btn btn-secondary invite-link-btn" onClick={copyLink}>
                  🔗 {copied ? 'Copied!' : 'Copy Invite Link'}
                </button>
                {isPrivate && <span className="badge" style={{ background: 'rgba(233,69,96,0.2)', color: '#e94560' }}>🔒 Private</span>}
              </div>
            </div>

            {/* Settings Summary */}
            {roomSettings && (
              <div className="settings-summary card">
                <h3>Room Settings</h3>
                <div className="settings-pills">
                  <span className="pill"> <img src="/setting_1.gif" alt="player" />  <div>{roomSettings.maxPlayers} players</div> </span>
                  <span className="pill"> <img src="/setting_3.gif" alt="round" />  <div>{roomSettings.rounds} rounds</div></span>
                  <span className="pill"> <img src="/setting_2.gif" alt="time" />  <div>{roomSettings.drawTime}s</div></span>
                  <span className="pill"> <img src="/setting_5.gif" alt="hint" />  <div>{roomSettings.hints === 0 ? 'No hints' : `${roomSettings.hints} hints`}</div></span>
                  <span className="pill"> <img src="/setting_6.gif" alt="word" />  <div>{roomSettings.wordCount} words</div></span>
                </div>
              </div>
            )}

            {/* Players */}
            <div className="players-section card">
              <h3>Players ({players.length}/{roomSettings?.maxPlayers || 8})</h3>
              <div className="players-grid">
                {players.map((player, i) => (
                  <div key={player.id} className={`player-card ${player.id === myPlayer?.id ? 'me' : ''}`} style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="player-avatar">
                      <PlayerAvatar avatarIdx={player.avatar || 0} size={52} />
                    </div>
                    <div className="player-info">
                      <span className="player-name">
                        {player.name}
                        {player.id === myPlayer?.id && <span className="you-badge">(you)</span>}
                      </span>
                      {player.isHost && <span className="host-badge"><img src="crown.gif" alt="host" /> Host</span>}
                    </div>
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: Math.max(0, (roomSettings?.maxPlayers || 8) - players.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="player-card empty">
                    <div className="player-avatar empty-avatar">?</div>
                    <span className="empty-label">Waiting...</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Button — always show for host */}
            <div className="lobby-actions">
              {isHost ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    className="btn btn-primary start-btn"
                    onClick={actions.startGame}
                    disabled={!canStart}
                    style={{ opacity: canStart ? 1 : 0.5 }}
                  >
                    {canStart ? '🎮 Start Game!' : `⏳ Need ${2 - players.length} more player(s) to start`}
                  </button>
                  {!canStart && (
                    <p style={{ textAlign: 'center', color: 'var(--accent-2)', fontSize: '13px', fontWeight: 700 }}>
                      Share the room code <strong style={{ color: 'var(--accent-3)' }}>{roomId}</strong> with a friend to start!
                    </p>
                  )}
                </div>
              ) : (
                <div className="waiting-for-host">
                  <div className="waiting-dot" /><div className="waiting-dot" /><div className="waiting-dot" />
                  <span>Waiting for host to start...</span>
                </div>
              )}
            </div>
          </div>

          {/* Chat in lobby */}
          <div className="lobby-chat card">
            <h3>Chat</h3>
            <LobbyChat />
          </div>
        </div>
      </div>
    </div>
  );
}

function LobbyChat() {
  const { state, actions } = useGame();
  const [text, setText] = useState('');
  const messagesEndRef = React.useRef(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const send = () => {
    if (!text.trim()) return;
    actions.sendChat(text.trim());
    setText('');
  };

  return (
    <div className="lobby-chat-inner">
      <div className="messages">
        {state.messages.map(msg => (
          <div key={msg.id} className={`msg msg-${msg.type || 'chat'}`}>
            {msg.type !== 'system' && <span className="msg-name">{msg.playerName}: </span>}
            <span className="msg-text">{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-row">
        <input
          className="input chat-input"
          placeholder="Say something..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          maxLength={100}
        />
        <button className="btn btn-primary send-btn" onClick={send}>Send</button>
      </div>
    </div>
  );
}