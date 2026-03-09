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

// Flood fill algorithm
function floodFill(ctx, startX, startY, fillColor) {
  const canvas = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const toIndex = (x, y) => (y * canvas.width + x) * 4;

  const startIdx = toIndex(Math.floor(startX), Math.floor(startY));
  const startR = data[startIdx];
  const startG = data[startIdx + 1];
  const startB = data[startIdx + 2];
  const startA = data[startIdx + 3];

  // Parse fill color
  const tmp = document.createElement('canvas');
  tmp.width = tmp.height = 1;
  const tmpCtx = tmp.getContext('2d');
  tmpCtx.fillStyle = fillColor;
  tmpCtx.fillRect(0, 0, 1, 1);
  const [fillR, fillG, fillB, fillA] = tmpCtx.getImageData(0, 0, 1, 1).data;

  // If clicking same color, do nothing
  if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) return;

  const matchesStart = (idx) =>
    data[idx]     === startR &&
    data[idx + 1] === startG &&
    data[idx + 2] === startB &&
    data[idx + 3] === startA;

  const stack = [[Math.floor(startX), Math.floor(startY)]];
  const visited = new Uint8Array(canvas.width * canvas.height);

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
    const idx = toIndex(x, y);
    const visitIdx = y * canvas.width + x;
    if (visited[visitIdx]) continue;
    if (!matchesStart(idx)) continue;

    visited[visitIdx] = 1;
    data[idx]     = fillR;
    data[idx + 1] = fillG;
    data[idx + 2] = fillB;
    data[idx + 3] = fillA;

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  ctx.putImageData(imageData, 0, 0);
}

export default function DrawingCanvas({ isDrawer }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const { state, actions } = useGame();
  const { socket } = useSocket();

  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(6);
  const [tool, setTool] = useState('brush'); // 'brush' | 'eraser' | 'fill'

  const isEraser = tool === 'eraser';
  const isFill = tool === 'fill';
  const activeColor = isEraser ? '#ffffff' : color;

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
    } else if (data.type === 'fill') {
      floodFill(ctx, data.x, data.y, data.color);
    }
  }, []);

  const replayStrokes = useCallback((strokes) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    lastPosRef.current = null;
    strokes.forEach(stroke => applyStroke(stroke));
  }, [applyStroke]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleDrawData = (data) => applyStroke(data);

    const handleCanvasCleared = () => {
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (canvas && ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    const handleCanvasReplay = (data) => replayStrokes(data.strokes);

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
    const pos = getPos(e);

    if (isFill) {
      // Apply fill locally
      const ctx = getCtx();
      if (ctx) floodFill(ctx, pos.x, pos.y, activeColor);
      // Broadcast as a fill stroke so server stores it & others see it
      const fillData = { type: 'fill', x: pos.x, y: pos.y, color: activeColor };
      actions.drawStart(fillData);
      actions.drawEnd();
      return;
    }

    isDrawingRef.current = true;
    const strokeData = { x: pos.x, y: pos.y, color: activeColor, size: brushSize };
    applyStroke({ type: 'start', ...strokeData });
    actions.drawStart(strokeData);
  }, [isDrawer, isFill, activeColor, brushSize, applyStroke, actions]);

  const draw = useCallback((e) => {
    if (!isDrawer || !isDrawingRef.current || isFill) return;
    e.preventDefault();
    const pos = getPos(e);
    applyStroke({ type: 'move', x: pos.x, y: pos.y });
    actions.drawMove({ x: pos.x, y: pos.y });
  }, [isDrawer, isFill, applyStroke, actions]);

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

  return (
    <div className="drawing-area">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className={`drawing-canvas ${isDrawer ? 'can-draw' : ''} ${isFill ? 'fill-cursor' : ''}`}
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
                  className={`color-btn ${color === c && tool === 'brush' ? 'selected' : ''}`}
                  style={{ background: c, border: c === '#ffffff' ? '1px solid #ddd' : 'none' }}
                  onClick={() => { setColor(c); setTool('brush'); }}
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
                  className={`size-btn ${brushSize === size && tool === 'brush' ? 'selected' : ''}`}
                  onClick={() => { setBrushSize(size); setTool('brush'); }}
                >
                  <div className="size-dot" style={{ width: size, height: size, background: tool === 'eraser' ? '#aaa' : color, maxWidth: 30, maxHeight: 30, minWidth: 3, minHeight: 3 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="toolbar-section tools-section">
            <button
              className={`tool-btn ${tool === 'fill' ? 'selected' : ''}`}
              onClick={() => setTool(tool === 'fill' ? 'brush' : 'fill')}
              title="Fill"
            ><img src="/fill.gif" alt="fill" /></button>
            <button
              className={`tool-btn ${tool === 'eraser' ? 'selected' : ''}`}
              onClick={() => setTool(tool === 'eraser' ? 'brush' : 'eraser')}
              title="Eraser"
            ><img src="/size.gif" alt="eraser" /></button>
            <button
              className="tool-btn"
              onClick={actions.undoDraw}
              title="Undo"
            ><img src="/undo.gif" alt="undo" /></button>
            <button
              className="tool-btn danger"
              onClick={handleClear}
              title="Clear canvas"
            ><img src="/clear.gif" alt="clear" /></button>
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