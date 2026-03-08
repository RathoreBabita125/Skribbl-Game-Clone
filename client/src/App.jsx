import React from 'react';
import { SocketProvider } from './context/SocketContext';
import { GameProvider, useGame } from './context/GameContext';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';

function AppContent() {
  const { state } = useGame();

  if (!state.roomId) {
    return <HomePage />;
  }

  if (state.gameStatus === 'lobby') {
    return <LobbyPage />;
  }

  return <GamePage />;
}

export default function App() {
  return (
    <SocketProvider>
      <GameProvider>
        <div className="noise">
          <AppContent />
        </div>
      </GameProvider>
    </SocketProvider>
  );
}
