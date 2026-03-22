import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  volume: number;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isListening, isSpeaking, volume }) => {
  const bars = Array.from({ length: 20 });
  
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-full ${isSpeaking ? 'bg-emerald-500' : isListening ? 'bg-rose-500' : 'bg-zinc-700'}`}
          animate={{
            height: (isListening || isSpeaking) ? [10, Math.random() * 40 + 10, 10] : 4,
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.05,
          }}
        />
      ))}
    </div>
  );
};

interface VoiceControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
  isActive: boolean;
  onToggleActive: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({ isMuted, onToggleMute, isActive, onToggleActive }) => {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onToggleActive}
        className={`p-4 rounded-full transition-all ${
          isActive ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/20' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
        }`}
      >
        {isActive ? <Mic size={24} /> : <MicOff size={24} />}
      </button>
      <button
        onClick={onToggleMute}
        className={`p-4 rounded-full transition-all ${
          isMuted ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
        }`}
      >
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>
    </div>
  );
};
