import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Loader2 } from "lucide-react";

interface ConfirmResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export const ConfirmResetDialog: React.FC<ConfirmResetDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        // Prevent closing if loading
        if (!open && isLoading) {
          return;
        }
        onOpenChange(open);
      }}
    >
      <DialogContent
        onInteractOutside={(e) => {
          // Prevent closing by clicking outside if loading
          if (isLoading) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing by pressing escape if loading
          if (isLoading) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Confirm Reset
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to reset all AI profile settings to their default values? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};