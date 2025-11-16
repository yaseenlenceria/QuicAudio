import { useEffect, useState } from 'react';

interface AudioVisualizerProps {
  levels: number[];
  isSpeaking: boolean;
  className?: string;
}

export function AudioVisualizer({ levels, isSpeaking, className = '' }: AudioVisualizerProps) {
  return (
    <div className={`flex items-center justify-center gap-1 ${className}`} data-testid="audio-visualizer">
      {levels.map((level, index) => {
        const height = Math.max(8, level * 100);
        return (
          <div
            key={index}
            className={`w-2 rounded-full transition-all duration-75 ${
              isSpeaking ? 'bg-primary' : 'bg-muted'
            }`}
            style={{ height: `${height}%` }}
            data-testid={`audio-bar-${index}`}
          />
        );
      })}
    </div>
  );
}

interface PulsingCircleProps {
  size?: number;
}

export function PulsingCircle({ size = 128 }: PulsingCircleProps) {
  return (
    <div className="relative flex items-center justify-center" data-testid="pulsing-circle">
      <div
        className="absolute rounded-full bg-primary/20 animate-pulse"
        style={{ width: size * 1.5, height: size * 1.5 }}
      />
      <div
        className="absolute rounded-full bg-primary/30 animate-pulse"
        style={{ width: size * 1.2, height: size * 1.2, animationDelay: '0.5s' }}
      />
      <div
        className="rounded-full bg-primary flex items-center justify-center"
        style={{ width: size, height: size }}
        data-testid="pulsing-circle-core"
      >
        <svg
          className="w-12 h-12 text-primary-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </div>
    </div>
  );
}
