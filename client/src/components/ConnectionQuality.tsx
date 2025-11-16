import { Signal, SignalHigh, SignalLow, SignalMedium } from 'lucide-react';

interface ConnectionQualityProps {
  quality: 'strong' | 'medium' | 'weak' | 'connecting';
  className?: string;
}

export function ConnectionQuality({ quality, className = '' }: ConnectionQualityProps) {
  const getIcon = () => {
    switch (quality) {
      case 'strong':
        return <SignalHigh className="w-5 h-5 text-status-online" />;
      case 'medium':
        return <SignalMedium className="w-5 h-5 text-status-away" />;
      case 'weak':
        return <SignalLow className="w-5 h-5 text-status-busy" />;
      case 'connecting':
        return <Signal className="w-5 h-5 text-muted-foreground animate-pulse" />;
    }
  };

  const getLabel = () => {
    switch (quality) {
      case 'strong':
        return 'Strong';
      case 'medium':
        return 'Medium';
      case 'weak':
        return 'Weak';
      case 'connecting':
        return 'Connecting...';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`} data-testid="connection-quality">
      {getIcon()}
      <span className="text-sm font-medium">{getLabel()}</span>
    </div>
  );
}
