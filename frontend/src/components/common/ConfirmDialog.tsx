import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog.js";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border border-hairline bg-paper dark:bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-normal text-ink dark:text-paper">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-ash font-sans">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-md border-hairline text-ink dark:text-paper">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            className={
              destructive
                ? "rounded-md bg-destructive text-white hover:bg-destructive/90"
                : "rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
