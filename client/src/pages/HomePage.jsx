import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import AvatarRow, { Avatar, TOTAL_AVATARS, TOTAL_EYES, TOTAL_MOUTHS } from '../components/AvatarRow';
import './HomePage.css';


export default function HomePage() {
  const { state, actions } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [showPrivate, setShowPrivate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [logoError, setLogoError] = useState(false);


  const [selIdx, setSelIdx] = useState(0);
  const [eyeIdx, setEyeIdx] = useState(0);
  const [mouthIdx, setMouthIdx] = useState(0);

  const [settings, setSettings] = useState({
    maxPlayers: 8, rounds: 3, drawTime: 80, wordCount: 3, hints: 2,
  });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const c = p.get('room');
    if (c) { setRoomCode(c.toUpperCase()); setShowJoin(true); }
  }, []);

  const play = () => playerName.trim() && actions.createRoom(playerName.trim(), settings, false, { avatarIdx: selIdx, eyeIdx, mouthIdx });
  const create = () => { if (!playerName.trim()) return; actions.createRoom(playerName.trim(), settings, true, { avatarIdx: selIdx, eyeIdx, mouthIdx }); setShowPrivate(false); };
  const join = () => { if (!playerName.trim() || !roomCode.trim()) return; actions.joinRoom(roomCode.trim().toUpperCase(), playerName.trim(), { avatarIdx: selIdx, eyeIdx, mouthIdx }); setShowJoin(false); };

  const adj = (setter, total, dir) => setter(i => (i + dir + total) % total);
  const randomize = () => {
    setSelIdx(Math.floor(Math.random() * TOTAL_AVATARS));
    setEyeIdx(Math.floor(Math.random() * TOTAL_EYES));
    setMouthIdx(Math.floor(Math.random() * TOTAL_MOUTHS));
  };

  const LOGO_COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c', '#3498db', '#9b59b6', '#e91e63'];

  return (
    <div className="skribbl-home">
      <div className="doodle-bg" >

        {/* Logo */}
        <div className="logo-area">
          <div className="logo-img-wrap">
            {!logoError
              ? <img src="./logo.gif" alt="skribbl" className="logo-gif" onError={() => setLogoError(true)} />
              : <h1 className="logo-text">
                {'skribbl.io'.split('').map((c, i) => (
                  <span key={i} className="logo-letter" style={{ color: LOGO_COLORS[i] }}>{c}</span>
                ))}
                <span className="logo-pencil"><img src="/how.gif" alt="pen" /></span>
              </h1>
            }
          </div>

          {/* 8 avatar heads */}
          <AvatarRow selectedIndex={selIdx} onSelect={setSelIdx} />
        </div>

        {/* Main card */}
        <div className="home-card">
          <input
            className="name-input"
            placeholder="Enter your name"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            maxLength={20}
            onKeyDown={e => e.key === 'Enter' && play()}
            autoFocus
          />

          {/* Big avatar */}
          <div className="av-picker">
            <div className="av-arrows left">
              <button className="arr-btn" onClick={() => adj(setSelIdx, TOTAL_AVATARS, -1)}>
                <img src="arrow_left.gif" alt="arrow" />
              </button>
              <button className="arr-btn" onClick={() => adj(setEyeIdx, TOTAL_EYES, -1)}>
                <img src="arrow_left.gif" alt="arrow" />
              </button>
              <button className="arr-btn" onClick={() => adj(setMouthIdx, TOTAL_MOUTHS, -1)}>
                <img src="arrow_left.gif" alt="arrow" />
              </button>
            </div>

            <div className="av-big">
              <Avatar avatarIdx={selIdx} eyeIdx={eyeIdx} mouthIdx={mouthIdx} size={90} />
            </div>

            <div className="av-arrows right">
              <button className="arr-btn" onClick={() => adj(setSelIdx, TOTAL_AVATARS, +1)}>
                <img src="arrow_right.gif" alt="arrow" />
              </button>
              <button className="arr-btn" onClick={() => adj(setEyeIdx, TOTAL_EYES, +1)}>
                <img src="arrow_right.gif" alt="arrow" />
              </button>
              <button className="arr-btn" onClick={() => adj(setMouthIdx, TOTAL_MOUTHS, +1)}>
                <img src="arrow_right.gif" alt="arrow" />
              </button>
            </div>

            <button className="dice-btn" onClick={randomize} title="Randomize"><img src="/randomize.gif" alt="random" /></button>
          </div>

          {state.error && (
            <div className="home-error">⚠️ {state.error}
              <button onClick={actions.clearError}>✕</button>
            </div>
          )}

          <button className="btn-play" onClick={play} disabled={!playerName.trim()}>Play!</button>
          <button className="btn-private" onClick={() => setShowPrivate(true)}>Create Private Room</button>
          <button className="btn-join" onClick={() => setShowJoin(true)}> Join with Room Code</button>
        </div>

        {/* Private room modal */}
        {showPrivate && (
          <div className="modal-bg" onClick={() => setShowPrivate(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Create Private Room</h2>
              <button className="modal-x" onClick={() => setShowPrivate(false)}>✕</button>
              <div className="modal-settings">
                {[
                  { label: 'Players', k: 'maxPlayers', min: 2, max: 20, step: 1, sfx: '' },
                  { label: 'Draw Time', k: 'drawTime', min: 15, max: 240, step: 10, sfx: 's' },
                  { label: 'Rounds', k: 'rounds', min: 2, max: 10, step: 1, sfx: '' },
                  { label: 'Word Count', k: 'wordCount', min: 1, max: 5, step: 1, sfx: '' },
                  { label: 'Hints', k: 'hints', min: 0, max: 5, step: 1, sfx: '' },
                ].map(({ label, k, min, max, step, sfx }) => (
                  <div className="ms-row" key={k}>
                    <span>{label}</span>
                    <div className="ms-ctrl">
                      <button onClick={() => setSettings(s => ({ ...s, [k]: Math.max(min, s[k] - step) }))}>−</button>
                      <span>{k === 'hints' && settings[k] === 0 ? 'Off' : `${settings[k]}${sfx}`}</span>
                      <button onClick={() => setSettings(s => ({ ...s, [k]: Math.min(max, s[k] + step) }))}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-play" onClick={create} disabled={!playerName.trim()}>Create Room!</button>
            </div>
          </div>
        )}

        {/* Join modal */}
        {showJoin && (
          <div className="modal-bg" onClick={() => setShowJoin(false)}>
            <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
              <h2>Join Room</h2>
              <button className="modal-x" onClick={() => setShowJoin(false)}>✕</button>
              <input
                id="join-name-input"
                className="name-input"
                placeholder="Room code..."
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                onKeyDown={e => e.key === 'Enter' && join()}
                style={{ letterSpacing: '0.2em', fontWeight: 800, fontSize: 20, textAlign: 'center' }}
              />
              <button className="btn-play" onClick={join} disabled={!playerName.trim() || !roomCode.trim()}>Join!</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}