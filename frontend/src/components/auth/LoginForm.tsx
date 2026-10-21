import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button.js";
import { Input } from "../ui/input.js";
import { Label } from "../ui/label.js";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "../ui/tooltip.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Eye, EyeOff, Github, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ForgeAppIcon } from "../common/ForgeLogo.js";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog.js";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const { login, isLoggingIn } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    await login(data);
  };

  return (
    <div className="w-full max-w-[400px] rounded-2xl border border-hairline bg-paper p-8 shadow-none">
      <div className="mb-8 text-center flex flex-col items-center">
        <ForgeAppIcon size="lg" className="mb-4" />
        <h1 className="text-3xl font-normal tracking-tight text-ink">
          Sign in to Forge
        </h1>
        <p className="mt-2 text-xs text-ash font-normal leading-relaxed">
          Access your AI pair programming workspace and live container environments.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.05em] text-ash font-medium">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="developer@forge.dev"
            className="h-11 rounded-[10px] border-hairline bg-transparent px-4 text-sm focus-visible:ring-primary focus-visible:ring-offset-0"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-[10px] text-destructive font-normal">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-[10px] uppercase tracking-[0.05em] text-ash font-medium"
            >
              Password
            </Label>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-[10px] text-ash hover:text-ink font-normal underline underline-offset-2 transition-colors focus:outline-none"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="h-11 rounded-[10px] border-hairline bg-transparent pl-4 pr-11 text-sm focus-visible:ring-primary focus-visible:ring-offset-0"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ash hover:text-ink transition-colors focus:outline-none p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-[10px] text-destructive font-normal">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoggingIn}
          className="w-full h-11 rounded-[10px] bg-primary text-ink hover:bg-primary/90 font-bold text-sm transition-all active:scale-[0.98]"
        >
          {isLoggingIn ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Continue
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-hairline" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-[0.05em]">
          <span className="bg-paper px-4 text-ash/60">or continue with</span>
        </div>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled
              className="w-full h-11 rounded-[8px] border-hairline opacity-60 cursor-not-allowed text-ink text-sm font-normal gap-2"
            >
              <Github className="w-4 h-4 text-ash" />
              GitHub
            </Button>
          </TooltipTrigger>
          <TooltipContent className="rounded-xl border border-hairline bg-ink text-paper text-xs">
            GitHub OAuth coming in v2
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <p className="mt-8 text-center text-xs text-ash font-normal">
        New to Forge?{" "}
        <Link
          to="/register"
          className="text-ink font-medium underline underline-offset-4 hover:opacity-80"
        >
          Create an account
        </Link>
      </p>

      <ForgotPasswordDialog
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        defaultEmail={watch("email")}
        onSuccess={(resetEmail) => setValue("email", resetEmail)}
      />
    </div>
  );
}
