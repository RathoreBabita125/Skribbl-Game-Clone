
import React from 'react';


import COLOR_ATLAS from '../../public/color_atlas.gif'
import EYES_ATLAS from '../../public/eyes_atlas.gif'
import MOUTH_ATLAS from '../../public/mouth_atlas.gif'


const CELL        = 48;
const ATLAS_SIZE  = 480;
const ATLAS_COLS  = 10;
const TOTAL_AVATARS = 28;
const TOTAL_EYES    = 57;
const TOTAL_MOUTHS  = 51;

// Overlay positions inside the 48px avatar cell 
const EYE_Y_PX   = 12;
const MOUTH_Y_PX = 26;
const SPR_SIZE   = 28;  


function getEyeIdx(avatarIdx)   { return (avatarIdx * 7 + 3)  % TOTAL_EYES;   }
function getMouthIdx(avatarIdx) { return (avatarIdx * 11 + 5) % TOTAL_MOUTHS; }

function Sprite({ atlas, index, size }) {
  const scale = size / CELL;
  const bg    = ATLAS_SIZE * scale;
  const col   = index % ATLAS_COLS;
  const row   = Math.floor(index / ATLAS_COLS);
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      backgroundImage:    `url(${atlas})`,
      backgroundSize:     `${bg}px ${bg}px`,
      backgroundPosition: `${-(col * CELL * scale)}px ${-(row * CELL * scale)}px`,
      backgroundRepeat:   'no-repeat',
      imageRendering:     'pixelated',
    }} />
  );
}

export default function PlayerAvatar({ avatarIdx = 0, size = 40 }) {
  const idx      = Math.abs(Math.floor(avatarIdx)) % TOTAL_AVATARS;
  const eyeIdx   = getEyeIdx(idx);
  const mouthIdx = getMouthIdx(idx);

  const scale    = size / CELL;
  const bg       = ATLAS_SIZE * scale;
  const col      = idx % ATLAS_COLS;
  const row      = Math.floor(idx / ATLAS_COLS);
  const sprSz    = Math.max(4, Math.round(SPR_SIZE * scale));
  const eyeTop   = Math.round(EYE_Y_PX   * scale);
  const mouthTop = Math.round(MOUTH_Y_PX * scale);
  const faceLeft = Math.round((size - sprSz) / 2);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Color body */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage:    `url(${COLOR_ATLAS})`,
        backgroundSize:     `${bg}px ${bg}px`,
        backgroundPosition: `${-(col * CELL * scale)}px ${-(row * CELL * scale)}px`,
        backgroundRepeat:   'no-repeat',
        imageRendering:     'pixelated',
      }} />
      {/* Eyes */}
      <div style={{
        position: 'absolute', top: eyeTop, left: faceLeft,
        mixBlendMode: 'multiply',
        filter: 'brightness(0)',
        imageRendering: 'pixelated',
      }}>
        <Sprite atlas={EYES_ATLAS} index={eyeIdx} size={sprSz} />
      </div>
      {/* Mouth */}
      <div style={{
        position: 'absolute', top: mouthTop, left: faceLeft,
        mixBlendMode: 'multiply',
        filter: 'brightness(0)',
        imageRendering: 'pixelated',
      }}>
        <Sprite atlas={MOUTH_ATLAS} index={mouthIdx} size={sprSz} />
      </div>
    </div>
  );
}

export { TOTAL_AVATARS };