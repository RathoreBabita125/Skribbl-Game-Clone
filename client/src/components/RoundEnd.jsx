import React from 'react';
import './RoundEnd.css';

export default function RoundEnd({ word, leaderboard, reason, currentRound, totalRounds }) {
  return (
    <div className="round-end-overlay">
      <div className="round-end-card pop-in">
        <div className="round-end-header">
          <span className="round-badge">Round {currentRound} / {totalRounds}</span>
          <h2>
            {reason === 'all_guessed' ? ' Everyone guessed it!' : ' Time\'s up!'}
          </h2>
          <div className="the-word">
            The word was: <span className="word-reveal-text">{word}</span>
          </div>
        </div>

        <div className="leaderboard">
          <h3>Leaderboard</h3>
          {leaderboard.map((player, i) => (
            <div key={player.id} className={`lb-row rank-${i + 1}`}>
              <span className="lb-rank">
                {i === 0 ? <img src="/medal_1.gif" alt="first" /> : i === 1 ? <img src="/medal_2.gif" alt="second" /> : i === 2 ? <img src="/medal_3.gif" alt="third" /> : `#${i + 1}`}
              </span>
              <span className="lb-name">{player.name}</span>
              <span className="lb-score">{player.score}</span>
            </div>
          ))}
        </div>

        <div className="next-round-msg">
          <div className="spinner" style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
          <span>Next round starting...</span>
        </div>
      </div>
    </div>
  );
}
