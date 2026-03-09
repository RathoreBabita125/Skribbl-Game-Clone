import React, { useState, useCallback } from 'react';
import './AvatarRow.css';

import COLOR_ATLAS from '../../public/color_atlas.gif'
import EYES_ATLAS from '../../public/eyes_atlas.gif'
import MOUTH_ATLAS from '../../public/mouth_atlas.gif'

export const TOTAL_AVATARS = 28;
export const TOTAL_EYES    = 57;
export const TOTAL_MOUTHS  = 51;

const CELL       = 48;
const ATLAS_SIZE = 480;
const ATLAS_COLS = 10;
const SPR_SIZE   = 28;
const EYE_Y      = 12;
const MOUTH_Y    = 26;


function Sprite({ atlas, index, size }) {
  const scale = size / CELL;
  const col   = index % ATLAS_COLS;
  const row   = Math.floor(index / ATLAS_COLS);

  return (
    <div
      className="av-sprite"
      style={{
        '--spr-url':  `url(${atlas})`,
        '--spr-size': `${ATLAS_SIZE * scale}px`,
        '--spr-x':    `${-(col * CELL * scale)}px`,
        '--spr-y':    `${-(row * CELL * scale)}px`,
        '--spr-wh':   `${size}px`,
      }}
    />
  );
}

export function Avatar({ avatarIdx, eyeIdx, mouthIdx, size = 48 }) {
  const scale    = size / CELL;
  const col      = avatarIdx % ATLAS_COLS;
  const row      = Math.floor(avatarIdx / ATLAS_COLS);
  const sprSz    = Math.round(SPR_SIZE * scale);
  const eyeTop   = Math.round((EYE_Y - 5) * scale);
  const mouthTop = Math.round((MOUTH_Y - 15) * scale);
  const faceLeft = Math.round((size - sprSz) / 2);

  return (
    <div className="av-body-wrap" style={{ '--av-size': `${size}px` }}>

      {/* Color body */}
      <div
        className="av-sprite av-body-sprite"
        style={{
          '--spr-url':  `url(${COLOR_ATLAS})`,
          '--spr-size': `${ATLAS_SIZE * scale}px`,
          '--spr-x':    `${-(col * CELL * scale)}px`,
          '--spr-y':    `${-(row * CELL * scale)}px`,
          '--spr-wh':   `${size}px`,
        }}
      />

      {/* Eyes */}
      <div
        className="av-face-sprite av-eyes"
        style={{ top: eyeTop, left: faceLeft }}
      >
        <Sprite atlas={EYES_ATLAS} index={eyeIdx} size={sprSz} />
      </div>

      {/* Mouth */}
      <div
        className="av-face-sprite av-mouth"
        style={{ top: mouthTop, left: faceLeft }}
      >
        <Sprite atlas={MOUTH_ATLAS} index={mouthIdx} size={sprSz} />
      </div>

    </div>
  );
}

// 8 avatars 
export default function AvatarRow({ selectedIndex, onSelect }) {
  const NUM = 8;

  const [avatars, setAvatars] = useState(() =>
    Array.from({ length: NUM }, (_, i) => ({
      avatarIdx: i,
      eyeIdx:    Math.floor(Math.random() * TOTAL_EYES),
      mouthIdx:  Math.floor(Math.random() * TOTAL_MOUTHS),
      tick: 0,
    }))
  );

  const handleClick = useCallback((i) => {
    if (i !== selectedIndex) {
      onSelect(i);
      return;
    }
    setAvatars(prev => prev.map((av, idx) => {
      if (idx !== i) return av;
      const tick = av.tick + 1;
      return {
        ...av, tick,
        eyeIdx:   tick % 2 === 1 ? (av.eyeIdx   + 1) % TOTAL_EYES   : av.eyeIdx,
        mouthIdx: tick % 2 === 0 ? (av.mouthIdx + 1) % TOTAL_MOUTHS : av.mouthIdx,
      };
    }));
  }, [selectedIndex, onSelect]);

  return (
    <div className="avrow-wrap">
      <div className="avrow">
        {avatars.map((av, i) => (
          <div
            key={i}
            className={`avrow-slot ${selectedIndex === i ? 'avrow-selected' : ''}`}
            onClick={() => handleClick(i)}
            title={selectedIndex === i ? 'Click to change eyes / mouth' : 'Click to select'}
          >
            {i === 0 && (
              <span className="avrow-crown">
                <img src="crown.gif" alt="crown" />
              </span>
            )}
            <Avatar
              avatarIdx={av.avatarIdx}
              eyeIdx={av.eyeIdx}
              mouthIdx={av.mouthIdx}
              size={52}
            />
          </div>
        ))}
      </div>
    </div>
  );
}