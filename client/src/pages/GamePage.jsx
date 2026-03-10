import React from 'react';
import { useGame } from '../context/GameContext';
import DrawingCanvas from '../components/DrawingCanvas';
import WordDisplay from '../components/WordDisplay';
import Chat from '../components/Chat';
import PlayerList from '../components/PlayerList';
import RoundEnd from '../components/RoundEnd';
import GameOver from '../components/GameOver';
import './GamePage.css';
import { useSocket } from '../context/SocketContext';

export default function GamePage() {
  const { state, actions } = useGame();
  const { socket } = useSocket();

  const {
    gameStatus,
    currentRound,
    totalRounds,
    currentDrawerId,
    currentDrawerName,
    myPlayer,
    wordHint,
    myWord,
    wordOptions,
    timeLeft,
    drawTime,
    lastWord,
    leaderboard,
    players,
    roundEndReason
  } = state;

  const isDrawer = myPlayer?.id === currentDrawerId;

  const timerPercent = drawTime > 0 ? (timeLeft / drawTime) * 100 : 0;
  const timerColor = timeLeft > drawTime * 0.5
    ? 'var(--accent-3)'
    : timeLeft > drawTime * 0.25
    ? 'var(--accent-2)'
    : 'var(--accent-1)';

  return (
    <div className='game-page '>
      <div className="game-page bg-dots">
        <div className="game-bg-gradient" />

        {/* Header */}
        <header className="game-header">
          <div className="game-logo">
            <img src="./logo.gif" alt="" />
          </div>

          <div className="game-status-bar">
            {currentRound > 0 && (
              <div className="round-indicator">
                Round <strong>{currentRound}</strong> / {totalRounds}
              </div>
            )}

            {gameStatus === 'drawing' && (
              <div className="timer-wrapper">
                <div className="timer-circle">
                  <img src="/clock.gif" alt="clock" />
                  <span className="timer-num" style={{ color: timerColor }}>
                    {timeLeft}
                  </span>
                </div>
              </div>
            )}

            {gameStatus === 'drawing' && (
              <div className="drawer-indicator">
                {isDrawer
                  ? <span className="drawing-you"><img src="/how.gif" alt="pen" /> You are drawing!</span>
                  : <span><img src="/how.gif" alt="pen" /> <strong>{currentDrawerName}</strong> is drawing</span>
                }
              </div>
            )}
          </div>

          <button className="btn btn-secondary game-leave-btn" onClick={actions.leaveRoom}>
            Leave
          </button>
        </header>

        {/* Main layout */}
        <div className="game-layout"> 
          <div className="game-sidebar game-sidebar-left card">
            <div className="sidebar-title">Players</div>
            <PlayerList />
          </div>

       
          <div className="game-center">

            {/* Word display */}
            <WordDisplay
              wordHint={wordHint}
              myWord={myWord}
              isDrawer={isDrawer}
              gameStatus={gameStatus}
              wordOptions={wordOptions}
              onChooseWord={actions.chooseWord}
              drawerName={currentDrawerName}
            />

            {/* Canvas */}
            <div className="canvas-container">
              <DrawingCanvas isDrawer={isDrawer} />
            </div>
          </div>

          {/* Right: Chat */}
          <div className="game-sidebar game-sidebar-right card">
            <div className="sidebar-title">
              {gameStatus === 'drawing' && !isDrawer ? <span><i class="fa-regular fa-comment"></i> Guess the word!</span> : <span><i class="fa-regular fa-comment"></i> Chat</span>}
            </div>
            <Chat />
          </div>
        </div>

        {/* Overlays */}
        {gameStatus === 'round_end' && (
          <RoundEnd
            word={lastWord}
            leaderboard={leaderboard}
            currentRound={currentRound}
            totalRounds={totalRounds}
            reason={roundEndReason}
          />
        )}

        {gameStatus === 'game_over' && <GameOver />}
      </div>
    </div>
  );
}
