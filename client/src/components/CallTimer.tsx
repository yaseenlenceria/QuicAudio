import { useEffect, useState } from 'react';

interface CallTimerProps {
  startTime: number;
  className?: string;
}

export function CallTimer({ startTime, className = '' }: CallTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`font-mono text-sm font-medium ${className}`} data-testid="call-timer">
      {formatTime(elapsed)}
    </div>
  );
}
