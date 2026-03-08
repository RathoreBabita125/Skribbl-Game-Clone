import React from 'react';
import { useGame } from '../context/GameContext';
import './PlayerList.css';

const AVATAR_EMOJIS = ['🐱','🐶','🦊','🐺','🐻','🐼','🐨','🐯','🦁','🐸','🐧','🦋'];

export default function PlayerList() {
  const { state } = useGame();
  const { players, myPlayer, currentDrawerId } = state;

  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="player-list">
      {sorted.map((player, i) => {
        const isMe = player.id === myPlayer?.id;
        const isDrawer = player.id === currentDrawerId;
        const emoji = AVATAR_EMOJIS[(player.avatar || 1) % AVATAR_EMOJIS.length];

        return (
          <div
            key={player.id}
            className={`player-row ${isMe ? 'me' : ''} ${isDrawer ? 'drawing' : ''} ${player.hasGuessedCorrectly ? 'guessed' : ''}`}
          >
            <div className="player-rank">#{i + 1}</div>
            <div className="player-avatar-sm" style={{ background: `hsl(${(player.avatar || 1) * 30}, 70%, 50%)` }}>
              {emoji}
            </div>
            <div className="player-main-info">
              <div className="player-name-row">
                <span className="player-name-text">
                  {player.name}
                  {isMe && <span className="you-tag">(you)</span>}
                </span>
                {player.isHost && <span className="crown">👑</span>}
              </div>
              {isDrawer && (
                <span className="drawing-tag">✏️ Drawing...</span>
              )}
              {player.hasGuessedCorrectly && !isDrawer && (
                <span className="guessed-tag">✅ Guessed!</span>
              )}
            </div>
            <div className="player-score">{player.score}</div>
          </div>
        );
      })}
    </div>
  );
}
