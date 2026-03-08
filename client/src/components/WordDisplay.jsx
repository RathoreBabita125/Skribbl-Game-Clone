import React from 'react';
import './WordDisplay.css';

export default function WordDisplay({ wordHint, myWord, isDrawer, gameStatus, wordOptions, onChooseWord, drawerName }) {
  if (gameStatus === 'word_selection') {
    if (isDrawer && wordOptions?.length > 0) {
      return (
        <div className="word-selection pop-in">
          <h3>Choose a word to draw!</h3>
          <div className="word-options">
            {wordOptions.map(word => (
              <button key={word} className="word-option-btn" onClick={() => onChooseWord(word)}>
                {word}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="word-waiting">
        <span className="pulse-dot" />
        <span>{drawerName} is choosing a word...</span>
      </div>
    );
  }

  if (gameStatus === 'drawing') {
    if (isDrawer && myWord) {
      return (
        <div className="word-reveal">
          <span className="draw-label">Draw this:</span>
          <span className="my-word">{myWord}</span>
        </div>
      );
    }

    return (
      <div className="word-hint-display">
        {wordHint.map((char, i) => (
          <span
            key={i}
            className={`hint-char ${char === '_' ? 'blank' : char === ' ' ? 'space' : 'revealed'}`}
          >
            {char === ' ' ? '\u00A0\u00A0' : char === '_' ? '_' : char}
          </span>
        ))}
      </div>
    );
  }

  return null;
}
