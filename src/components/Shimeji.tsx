import React, { useState, useEffect, useRef } from "react";
import { Zap, Settings, X } from "lucide-react";

interface ShimejiProps {
  onFeatureSelect: (feature: "code-fixer" | "environment" | "organizer" | "help" | "settings") => void;
  onMinimizeToTray: () => void;
  onShowMenu: () => void;
  currentProjectPath?: string;
}

const Shimeji: React.FC<ShimejiProps> = ({
  onFeatureSelect,
  onMinimizeToTray,
  onShowMenu,
  currentProjectPath,
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [position, setPosition] = useState(() => ({
    x: Math.max(0, window.innerWidth - 100),
    y: 20,
  }));
  const [isDragging, setIsDragging] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const shimejiRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(position);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isPointerDownRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);

  // Load saved position and keep it visible inside the window bounds
  useEffect(() => {
    const saved = localStorage.getItem("shimeji-position");
    if (saved) {
      try {
        const savedPos = JSON.parse(saved);
        const clampedPos = {
          x: Math.max(0, Math.min(savedPos.x ?? 0, window.innerWidth - 64)),
          y: Math.max(0, Math.min(savedPos.y ?? 20, window.innerHeight - 64)),
        };
        setPosition(clampedPos);
        positionRef.current = clampedPos;
      } catch (e) {}
    }
  }, []);

  // Update position ref when position changes
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Wandering animation when not dragging
  useEffect(() => {
    if (isDragging || showContextMenu) return;

    const interval = setInterval(() => {
      setPosition((prev) => {
        const vx = (Math.random() - 0.5) * 4;
        const vy = (Math.random() - 0.5) * 4;
        const newX = Math.max(0, Math.min(prev.x + vx, window.innerWidth - 64));
        const newY = Math.max(0, Math.min(prev.y + vy, window.innerHeight - 64));
        return { x: newX, y: newY };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isDragging, showContextMenu]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || e.pointerId !== activePointerIdRef.current) return;

    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    pointerMovedRef.current = true;

    const clampedPos = {
      x: Math.max(0, Math.min(newX, window.innerWidth - 64)),
      y: Math.max(0, Math.min(newY, window.innerHeight - 64)),
    };
    setPosition(clampedPos);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || e.pointerId !== activePointerIdRef.current) return;

    isPointerDownRef.current = false;
    setIsDragging(false);
    activePointerIdRef.current = null;

    if (!pointerMovedRef.current) {
      onShowMenu();
    } else {
      localStorage.setItem("shimeji-position", JSON.stringify(positionRef.current));
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button === 2) {
      e.preventDefault();
      setShowContextMenu(!showContextMenu);
      return;
    }

    if (e.button !== 0) return;

    activePointerIdRef.current = e.pointerId;
    isPointerDownRef.current = true;
    setIsDragging(true);
    pointerMovedRef.current = false;
    dragStartRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    if (showContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showContextMenu]);

  const clampedX = Math.max(0, Math.min(position.x, window.innerWidth - 64));
  const clampedY = Math.max(0, Math.min(position.y, window.innerHeight - 64));

  return (
    <div
      ref={shimejiRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowContextMenu(!showContextMenu);
      }}
      onClick={() => {
        if (!isDragging && !isPointerDownRef.current) {
          onShowMenu();
        }
      }}
      style={{
        position: "fixed",
        left: `${clampedX}px`,
        top: `${clampedY}px`,
        zIndex: 9999,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        transition: isDragging ? "none" : "all 0.3s ease-out",
        touchAction: "none",
      }}
      className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg hover:shadow-xl transition-all flex items-center justify-center group active:scale-110"
      title="DevOps Lite - Click to open menu | Right-click for options"
    >
      <Zap className="w-8 h-8 text-white group-hover:animate-pulse" />

      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="absolute top-16 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-48 z-50"
        >
          <button
            onClick={() => {
              onMinimizeToTray();
              setShowContextMenu(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Minimize to Tray
          </button>
          <button
            onClick={() => {
              onFeatureSelect("settings");
              setShowContextMenu(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          <div className="border-t border-gray-200 my-1" />
          <div className="px-4 py-2 text-xs text-gray-500">
            {currentProjectPath && <div className="truncate">📁 {currentProjectPath}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Shimeji;
