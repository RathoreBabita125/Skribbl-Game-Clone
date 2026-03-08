import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import './DrawingCanvas.css';

const COLORS = [
  '#000000', '#ffffff', '#e94560', '#f5a623', '#ffeb3b',
  '#4caf50', '#00d4aa', '#2196f3', '#7c3aed', '#e91e63',
  '#795548', '#9e9e9e', '#ff5722', '#8bc34a', '#00bcd4',
  '#3f51b5', '#9c27b0', '#ff9800', '#607d8b', '#ffc107'
];

const BRUSH_SIZES = [3, 6, 12, 20, 30];

export default function DrawingCanvas({ isDrawer }) {
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const currentStrokeRef = useRef([]);
  const { state, actions } = useGame();
  const { socket } = useSocket();

  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const activeColor = isEraser ? '#ffffff' : color;

  // Get canvas context
  const getCtx = () => canvasRef.current?.getContext('2d');

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      canvas.getContext('2d').putImageData(imageData, 0, 0);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw from received stroke data
  const applyStroke = useCallback((data) => {
    const ctx = getCtx();
    if (!ctx) return;

    if (data.type === 'start') {
      ctx.beginPath();
      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(data.x, data.y);
      lastPosRef.current = { x: data.x, y: data.y, color: data.color, size: data.size };
    } else if (data.type === 'move') {
      if (!lastPosRef.current) return;
      ctx.beginPath();
      ctx.strokeStyle = lastPosRef.current.color;
      ctx.lineWidth = lastPosRef.current.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
      lastPosRef.current = { ...lastPosRef.current, x: data.x, y: data.y };
    } else if (data.type === 'end') {
      ctx.stroke();
      lastPosRef.current = null;
    }
  }, []);

  // Replay all strokes (for undo / new players)
  const replayStrokes = useCallback((strokes) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    lastPosRef.current = null;

    strokes.forEach(stroke => applyStroke(stroke));
  }, [applyStroke]);

  // Listen for draw events from server
  useEffect(() => {
    if (!socket) return;
  }, [socket]);

  // Handle canvas_replay (undo)
  useEffect(() => {
    if (state.strokes !== undefined && !isDrawer) {
      // Only replay if we got a canvas_replay event (handled via strokes in state)
    }
  }, [state.strokes, isDrawer]);

  // Direct socket listener for draw_data
  useEffect(() => {
    if (!socket) return;

    const handleDrawData = (data) => {
      applyStroke(data);
    };

    const handleCanvasCleared = () => {
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (canvas && ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    const handleCanvasReplay = (data) => {
      replayStrokes(data.strokes);
    };

    socket.on('draw_data', handleDrawData);
    socket.on('canvas_cleared', handleCanvasCleared);
    socket.on('canvas_replay', handleCanvasReplay);

    return () => {
      socket.off('draw_data', handleDrawData);
      socket.off('canvas_cleared', handleCanvasCleared);
      socket.off('canvas_replay', handleCanvasReplay);
    };
  }, [socket, applyStroke, replayStrokes]);

  // Clear canvas on round start
  useEffect(() => {
    if (state.gameStatus === 'word_selection' || state.strokes?.length === 0) {
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (canvas && ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [state.gameStatus]);

  // Mouse/touch helpers
  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = useCallback((e) => {
    if (!isDrawer) return;
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getPos(e);

    const strokeData = { x: pos.x, y: pos.y, color: activeColor, size: brushSize };
    applyStroke({ type: 'start', ...strokeData });
    actions.drawStart(strokeData);

    currentStrokeRef.current = [{ type: 'start', ...strokeData }];
  }, [isDrawer, activeColor, brushSize, applyStroke, actions]);

  const draw = useCallback((e) => {
    if (!isDrawer || !isDrawingRef.current) return;
    e.preventDefault();
    const pos = getPos(e);

    applyStroke({ type: 'move', x: pos.x, y: pos.y });
    actions.drawMove({ x: pos.x, y: pos.y });
  }, [isDrawer, applyStroke, actions]);

  const endDrawing = useCallback(() => {
    if (!isDrawer || !isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPosRef.current = null;
    actions.drawEnd();
  }, [isDrawer, actions]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (canvas && ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    actions.clearCanvas();
  };

  const handleUndo = () => {
    actions.undoDraw();
  };

  return (
    <div className="drawing-area">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className={`drawing-canvas ${isDrawer ? 'can-draw' : ''}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
        {!isDrawer && (
          <div className="canvas-overlay-text">
            {state.gameStatus === 'word_selection' && (
              <div className="overlay-msg">
                <div className="spinner" />
                <span>{state.currentDrawerName} is choosing a word...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {isDrawer && (
        <div className="toolbar">
          {/* Colors */}
          <div className="toolbar-section">
            <div className="colors-grid">
              {COLORS.map(c => (
                <button
                  key={c}
                  className={`color-btn ${color === c && !isEraser ? 'selected' : ''}`}
                  style={{ background: c, border: c === '#ffffff' ? '1px solid #ddd' : 'none' }}
                  onClick={() => { setColor(c); setIsEraser(false); }}
                />
              ))}
            </div>
          </div>

          {/* Brush sizes */}
          <div className="toolbar-section">
            <div className="size-row">
              {BRUSH_SIZES.map(size => (
                <button
                  key={size}
                  className={`size-btn ${brushSize === size && !isEraser ? 'selected' : ''}`}
                  onClick={() => { setBrushSize(size); setIsEraser(false); }}
                >
                  <div className="size-dot" style={{ width: size, height: size, background: isEraser ? '#aaa' : color, maxWidth: 30, maxHeight: 30, minWidth: 3, minHeight: 3 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="toolbar-section tools-section">
            <button
              className={`tool-btn ${isEraser ? 'selected' : ''}`}
              onClick={() => setIsEraser(!isEraser)}
              title="Eraser"
            >🧹</button>
            <button
              className="tool-btn"
              onClick={handleUndo}
              title="Undo"
            >↩️</button>
            <button
              className="tool-btn danger"
              onClick={handleClear}
              title="Clear canvas"
            >🗑️</button>
          </div>

          {/* Current color indicator */}
          <div className="current-color" style={{ background: isEraser ? '#ffffff' : color }}>
            {isEraser && <span className="eraser-icon">🧹</span>}
          </div>
        </div>
      )}
    </div>
  );
}
