import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button.js";
import { Input } from "../ui/input.js";
import { Label } from "../ui/label.js";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "../ui/tooltip.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Github, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isLoggingIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    await login(data);
  };

  return (
    <div className="w-full max-w-sm rounded-2xl border border-hairline bg-paper dark:bg-card p-6 shadow-none">
      <div className="mb-6">
        <h1 className="text-2xl font-normal tracking-tight text-ink dark:text-paper">
          Sign in to Forge
        </h1>
        <p className="mt-1 text-sm text-ash font-sans">
          Access your AI pair programming workspace
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs uppercase tracking-[0.018em] text-ash">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="developer@forge.dev"
            className="rounded-[10px] border-hairline bg-transparent"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="password"
            className="text-xs uppercase tracking-[0.018em] text-ash"
          >
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="rounded-[10px] border-hairline bg-transparent"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoggingIn}
          className="w-full h-11 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          {isLoggingIn ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Continue
        </Button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-hairline" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-[0.018em]">
          <span className="bg-paper dark:bg-card px-2 text-ash">or</span>
        </div>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled
              className="w-full h-11 rounded-md border-hairline opacity-60 cursor-not-allowed text-ink dark:text-paper"
            >
              <Github className="w-4 h-4 mr-2" />
              Continue with GitHub (v2)
            </Button>
          </TooltipTrigger>
          <TooltipContent className="rounded-md border-hairline bg-obsidian text-paper text-xs">
            GitHub OAuth coming in v2
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <p className="mt-6 text-center text-xs text-ash">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="text-ink dark:text-paper underline underline-offset-4 hover:opacity-80"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
