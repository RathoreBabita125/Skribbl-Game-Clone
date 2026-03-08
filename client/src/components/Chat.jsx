import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import './Chat.css';

export default function Chat() {
  const { state, actions } = useGame();
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isDrawer = state.myPlayer?.id === state.currentDrawerId;
  const hasGuessed = state.players.find(p => p.id === state.myPlayer?.id)?.hasGuessedCorrectly;
  const isDrawingPhase = state.gameStatus === 'drawing';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const send = () => {
    if (!text.trim()) return;
    actions.sendGuess(text.trim());
    setText('');
    inputRef.current?.focus();
  };

  const getPlaceholder = () => {
    if (isDrawer) return 'Chat (you\'re drawing)...';
    if (hasGuessed && isDrawingPhase) return 'Chat (already guessed!)...';
    if (isDrawingPhase) return 'Type your guess here...';
    return 'Say something...';
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {state.messages.length === 0 && (
          <div className="chat-empty">Chat messages will appear here...</div>
        )}
        {state.messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-msg chat-msg-${msg.type || 'chat'} ${msg.playerId === state.myPlayer?.id ? 'mine' : ''}`}
          >
            {msg.type === 'system' || msg.type === 'correct' ? (
              <span className="sys-msg">{msg.text}</span>
            ) : (
              <>
                <span className="chat-name" style={{ color: nameColor(msg.playerName) }}>
                  {msg.playerName}:
                </span>
                <span className="chat-text">{msg.text}</span>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          ref={inputRef}
          className={`input chat-guess-input ${isDrawingPhase && !isDrawer && !hasGuessed ? 'guessing' : ''}`}
          placeholder={getPlaceholder()}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          maxLength={100}
          disabled={hasGuessed && isDrawingPhase && !isDrawer}
        />
        <button
          className="btn btn-primary chat-send"
          onClick={send}
          disabled={!text.trim() || (hasGuessed && isDrawingPhase && !isDrawer)}
        >
          ▶
        </button>
      </div>
    </div>
  );
}

function nameColor(name) {
  const colors = ['#e94560','#f5a623','#00d4aa','#7c3aed','#3b82f6','#ec4899','#10b981'];
  let hash = 0;
  for (const c of name || '') hash = c.charCodeAt(0) + hash * 31;
  return colors[Math.abs(hash) % colors.length];
}
