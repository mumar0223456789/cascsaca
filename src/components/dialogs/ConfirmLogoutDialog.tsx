import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface ConfirmLogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export const ConfirmLogoutDialog: React.FC<ConfirmLogoutDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
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
            <LogOut className="w-5 h-5" />
            Confirm Logout
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to log out of your account?
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
            {isLoading ? "Logging out..." : "Logout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
