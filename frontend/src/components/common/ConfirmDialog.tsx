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
      <AlertDialogContent className="rounded-2xl  bg-paper">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-normal text-ink">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-ash font-sans font-normal">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-[10px] border-hairline text-ink font-normal">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            className={
              destructive
                ? "rounded-[10px] bg-destructive text-white hover:bg-destructive/90 font-normal"
                : "rounded-[10px] bg-primary text-ink hover:bg-primary/90 font-normal"
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
