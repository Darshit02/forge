import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "../../lib/api/auth.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog.js";
import { Button } from "../ui/button.js";
import { Input } from "../ui/input.js";
import { Label } from "../ui/label.js";
import { KeyRound, CheckCircle2, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
  onSuccess?: (email: string) => void;
}

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  defaultEmail = "",
  onSuccess,
}: ForgotPasswordDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState(defaultEmail);
  const [resetToken, setResetToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: defaultEmail },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const handleEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authApi.forgotPassword({ email: data.email });
      setEmail(data.email);
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setStep(2);
      } else {
        toast.info(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process password reset request");
      toast.error(err.message || "Failed to process request");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authApi.resetPassword({
        email,
        resetToken,
        newPassword: data.newPassword,
      });

      toast.success(res.message || "Password updated successfully");
      onSuccess?.(email);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reset password");
      toast.error(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after transition
    setTimeout(() => {
      setStep(1);
      setResetToken("");
      setErrorMessage(null);
      emailForm.reset();
      passwordForm.reset();
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl border border-hairline bg-paper p-6 shadow-none font-sans">
        <DialogHeader className="mb-4 text-left">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-bone border border-hairline/80 flex items-center justify-center text-primary">
              <KeyRound className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-normal text-ink">
              {step === 1 ? "Reset your password" : "Create new password"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-ash font-normal leading-relaxed">
            {step === 1
              ? "Enter your registered email address to verify your account and set a new password."
              : `Enter a new secure password for ${email}.`}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-xl border border-destructive/30 bg-destructive/10 text-xs text-destructive">
            {errorMessage}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email" className="text-[10px] uppercase tracking-[0.05em] text-ash font-medium">
                Email Address
              </Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="developer@forge.dev"
                className="h-10 rounded-[10px] border-hairline bg-transparent px-3 text-xs focus-visible:ring-primary"
                {...emailForm.register("email")}
              />
              {emailForm.formState.errors.email && (
                <p className="text-[10px] text-destructive">{emailForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="rounded-[10px] border-hairline text-xs font-normal"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="rounded-[10px] bg-primary text-ink hover:bg-primary/90 text-xs font-medium px-4"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Continue
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-[10px] uppercase tracking-[0.05em] text-ash font-medium">
                New Password (min 8 chars)
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-10 rounded-[10px] border-hairline bg-transparent pl-3 pr-10 text-xs focus-visible:ring-primary"
                  {...passwordForm.register("newPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ash hover:text-ink p-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {passwordForm.formState.errors.newPassword && (
                <p className="text-[10px] text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-[10px] uppercase tracking-[0.05em] text-ash font-medium">
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-10 rounded-[10px] border-hairline bg-transparent px-3 text-xs focus-visible:ring-primary"
                {...passwordForm.register("confirmPassword")}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-[10px] text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="text-ash hover:text-ink text-xs font-normal px-2"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  className="rounded-[10px] border-hairline text-xs font-normal"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading}
                  className="rounded-[10px] bg-primary text-ink hover:bg-primary/90 text-xs font-medium px-4"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  Update Password
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
