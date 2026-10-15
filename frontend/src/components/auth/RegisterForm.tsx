import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button.js";
import { Input } from "../ui/input.js";
import { Label } from "../ui/label.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { register: registerUser, isRegistering } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    await registerUser(data);
  };

  return (
    <div className="w-full max-w-sm rounded-2xl border border-hairline bg-paper dark:bg-card p-6 shadow-none">
      <div className="mb-6">
        <h1 className="text-2xl font-normal tracking-tight text-ink dark:text-paper">
          Create your Forge account
        </h1>
        <p className="mt-1 text-sm text-ash font-sans">
          Deploy backends with AI. Test endpoints instantly.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs uppercase tracking-[0.018em] text-ash">
            Full Name
          </Label>
          <Input
            id="name"
            placeholder="Jane Developer"
            className="rounded-[10px] border-hairline bg-transparent"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs uppercase tracking-[0.018em] text-ash">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="jane@company.com"
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
            placeholder="At least 8 characters"
            className="rounded-[10px] border-hairline bg-transparent"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isRegistering}
          className="w-full h-11 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          {isRegistering ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-ash">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-ink dark:text-paper underline underline-offset-4 hover:opacity-80"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
