'use client';

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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  X,
  Heart,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const USER_POSITIONS = [
  { value: 'developer-individual', label: 'Developer (Individual)' },
  { value: 'developer-team', label: 'Developer (Team)' },
  { value: 'designer', label: 'Designer' },
  { value: 'influencer', label: 'Influencer' },
  { value: 'content-creator', label: 'Content Creator' },
  { value: 'entrepreneur', label: 'Entrepreneur' },
  { value: 'student', label: 'Student' },
  { value: 'researcher', label: 'Researcher' },
  { value: 'product-manager', label: 'Product Manager' },
  { value: 'marketing', label: 'Marketing Professional' },
  { value: 'business-owner', label: 'Business Owner' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'other', label: 'Other' },
];

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (userPosition: string, feedbackText: string) => Promise<void>;
  showToasts?: boolean;
}

export function FeedbackDialog({
  open,
  onOpenChange,
  onSubmit,
  showToasts = false,
}: FeedbackDialogProps) {
  const [userPosition, setUserPosition] = useState<string>('');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = async () => {
    if (!userPosition || !feedbackText.trim()) {
      if (showToasts) {
        toast.error('Please fill in all fields');
      }
      return;
    }

    if (feedbackText.trim().length < 10) {
      if (showToasts) {
        toast.error('Feedback must be at least 10 characters long');
      }
      return;
    }

    setSubmissionStatus('submitting');

    try {
      await onSubmit(userPosition, feedbackText.trim());
      setSubmissionStatus('success');
      
      if (showToasts) {
        toast.success('Feedback submitted successfully!');
      }

      // Auto-close after showing thank you message for 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmissionStatus('idle');
      
      if (showToasts) {
        toast.error('Failed to submit feedback. Please try again.');
      }
    }
  };

  const handleClose = () => {
    // Reset form state
    setUserPosition('');
    setFeedbackText('');
    setSubmissionStatus('idle');
    onOpenChange(false);
  };

  const isFormValid = userPosition && feedbackText.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            {submissionStatus === 'success' ? 'Thank You!' : 'Share Your Feedback'}
          </DialogTitle>
          <DialogDescription>
            {submissionStatus === 'success' 
              ? 'Your feedback has been received and will help us improve our service.'
              : 'Help us improve by sharing your thoughts and suggestions.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Feedback Form */}
        <div className={`space-y-4 transition-all duration-500 ease-in-out ${
          submissionStatus === 'success' 
            ? 'opacity-0 transform translate-y-4 pointer-events-none absolute' 
            : 'opacity-100 transform translate-y-0'
        }`}>
          <div className="space-y-2">
            <Label htmlFor="user-position">Your Role/Position</Label>
            <Select
              value={userPosition}
              onValueChange={setUserPosition}
              disabled={submissionStatus === 'submitting'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your role or position" />
              </SelectTrigger>
              <SelectContent>
                {USER_POSITIONS.map((position) => (
                  <SelectItem key={position.value} value={position.value}>
                    {position.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-text">Your Feedback</Label>
            <Textarea
              id="feedback-text"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Share your thoughts, suggestions, or report any issues..."
              className="min-h-[120px] resize-none"
              disabled={submissionStatus === 'submitting'}
              maxLength={1000}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum 10 characters</span>
              <span>{feedbackText.length}/1000</span>
            </div>
          </div>
        </div>

        {/* Thank You Message */}
        <div className={`space-y-4 transition-all duration-500 ease-in-out ${
          submissionStatus === 'success' 
            ? 'opacity-100 transform translate-y-0' 
            : 'opacity-0 transform translate-y-4 pointer-events-none absolute'
        }`}>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
              Feedback Received! 
              <Heart className="w-5 h-5 text-red-500" />
            </h3>
            <p className="text-muted-foreground mb-4">
              Thank you for taking the time to share your thoughts with us. Your feedback is valuable and helps us create a better experience for everyone.
            </p>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span>This dialog will close automatically</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          {submissionStatus === 'success' ? (
            <Button onClick={handleClose} className="w-full">
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={submissionStatus === 'submitting'}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || submissionStatus === 'submitting'}
                className="flex-1"
              >
                {submissionStatus === 'submitting' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}