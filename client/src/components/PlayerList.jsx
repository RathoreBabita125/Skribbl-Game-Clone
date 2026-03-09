import React from 'react';
import { useGame } from '../context/GameContext';
import { Avatar } from './AvatarRow';
import './PlayerList.css';

export default function PlayerList() {
  const { state } = useGame();
  const { players, myPlayer, currentDrawerId } = state;

  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="player-list">
      {sorted.map((player, i) => {
        const isMe     = player.id === myPlayer?.id;
        const isDrawer = player.id === currentDrawerId;

        return (
          <div
            key={player.id}
            className={`player-row ${isMe ? 'me' : ''} ${isDrawer ? 'drawing' : ''} ${player.hasGuessedCorrectly ? 'guessed' : ''}`}
          >
            <div className="player-rank">#{i + 1}</div>
            
            <div className="player-avatar-sm">
              <Avatar
                avatarIdx={player.avatar?.avatarIdx ?? 0}
                eyeIdx={player.avatar?.eyeIdx ?? 0}
                mouthIdx={player.avatar?.mouthIdx ?? 0}
                size={36}
              />
            </div>

            <div className="player-main-info">
              <div className="player-name-row">
                <span className="player-name-text">
                  {player.name}
                  {isMe && <span className="you-tag">(you)</span>}
                </span>
              </div>
              {isDrawer && (
                <span className="drawing-tag"> Drawing...</span>
              )}
              {player.hasGuessedCorrectly && !isDrawer && (
                <span className="guessed-tag"><img src="/thumbsup.gif" alt="correct" /> Guessed!</span>
              )}
            </div>

            <div className="player-score">{player.score}</div>
          </div>
        );
      })}
    </div>
  );
}