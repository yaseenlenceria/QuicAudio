import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, X } from 'lucide-react';

export function SafetyBanner() {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('safety_banner_dismissed') === 'true';
  });

  const handleDismiss = () => {
    localStorage.setItem('safety_banner_dismissed', 'true');
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <Alert className="mb-6 relative" data-testid="alert-safety-banner">
      <Shield className="h-4 w-4" />
      <AlertDescription className="pr-8">
        <strong>Stay safe:</strong> Never share personal information. If someone makes you uncomfortable, use the report button.
        {' '}
        <a href="#" className="underline text-sm" data-testid="link-safety-guidelines">
          Safety Guidelines
        </a>
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6"
        onClick={handleDismiss}
        data-testid="button-dismiss-safety-banner"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}
