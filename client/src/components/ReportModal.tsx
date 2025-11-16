import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
}

const REPORT_REASONS = [
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'spam', label: 'Spam or repetitive behavior' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'threatening', label: 'Threatening or violent' },
  { value: 'other', label: 'Other' },
];

export function ReportModal({ isOpen, onClose, onSubmit }: ReportModalProps) {
  const [reason, setReason] = useState('harassment');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(reason, details);
      setDetails('');
      setReason('harassment');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="modal-report">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Report User
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe. Your report will be reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="mb-3">Reason for report</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} data-testid={`radio-reason-${r.value}`} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="details" className="mb-2">
              Additional details (optional)
            </Label>
            <Textarea
              id="details"
              placeholder="Provide more context about what happened..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="resize-none h-24"
              data-testid="textarea-report-details"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} data-testid="button-cancel-report">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
            data-testid="button-submit-report"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
