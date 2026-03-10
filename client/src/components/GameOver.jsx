import React from 'react';
import { useGame } from '../context/GameContext';
import './GameOver.css';

export default function GameOver() {
  const { state, actions } = useGame();
  const { leaderboard, myPlayer } = state;
  const winner = leaderboard[0];
  const isWinner = winner?.id === myPlayer?.id;

  return (
    <div className="game-over-overlay">
      <div className="game-over-card pop-in">
        <div className="confetti-area">
          {Array.from({length: 20}).map((_,i) => (
            <div key={i} className="confetti-piece" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 1}s`,
              background: ['#e94560','#f5a623','#00d4aa','#7c3aed','#3b82f6'][i % 5]
            }} />
          ))}
        </div>

        <div className="game-over-header">
          <div className="game-over-icon">{isWinner ? <img src="/cup.gif" alt="cup" /> : <img src="/cup.gif" alt="cup" />}</div>
          <h1>Game Over!</h1>
          {winner && (
            <div className="winner-announcement">
              <span className="winner-crown"><img src="/winner.gif" alt="winner" /></span>
              <span className="winner-name">{winner.name}</span>
              <span className="winner-wins">won the game!</span>
            </div>
          )}
        </div>

        <div className="final-leaderboard">
          <h3>Final Scores</h3>
          {leaderboard.map((player, i) => (
            <div key={player.id} className={`final-row rank-${i+1} ${player.id === myPlayer?.id ? 'me' : ''}`}>
              <span className="final-rank">
                {i === 0 ? <img src="/medal_1.gif" alt="first" /> : i === 1 ? <img src="/medal_2.gif" alt="second" /> : i === 2 ? <img src="/medal_3.gif" alt="third" /> : `#${i+1}`}
              </span>
              <span className="final-name">
                {player.name}
                {player.id === myPlayer?.id && <span className="you-tag">(you)</span>}
              </span>
              <span className="final-score">{player.score} pts</span>
            </div>
          ))}
        </div>

        <div className="game-over-actions">
          <button className="btn btn-primary play-again-btn" onClick={actions.leaveRoom}>
            <img src="/home.gif" alt="" /> <div>Back to Home</div>
          </button>
        </div>
      </div>
    </div>
  );
}
