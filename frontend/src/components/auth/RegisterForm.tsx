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
    <div className="w-full max-w-[400px] rounded-2xl border border-hairline bg-paper p-8 shadow-none">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-normal tracking-tight text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-xs text-ash font-normal leading-relaxed">
          Start building and deploying backend services with AI-native workflows.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-[10px] uppercase tracking-[0.05em] text-ash font-medium">
            Full Name
          </Label>
          <Input
            id="name"
            placeholder="Jane Developer"
            className="h-11 rounded-[10px] border-hairline bg-transparent px-4 text-sm focus-visible:ring-primary focus-visible:ring-offset-0"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-[10px] text-destructive font-normal">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.05em] text-ash font-medium">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="jane@company.com"
            className="h-11 rounded-[10px] border-hairline bg-transparent px-4 text-sm focus-visible:ring-primary focus-visible:ring-offset-0"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-[10px] text-destructive font-normal">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-[10px] uppercase tracking-[0.05em] text-ash font-medium"
          >
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            className="h-11 rounded-[10px] border-hairline bg-transparent px-4 text-sm focus-visible:ring-primary focus-visible:ring-offset-0"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-[10px] text-destructive font-normal">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isRegistering}
          className="w-full h-11 rounded-[10px] bg-primary text-ink hover:bg-primary/90 font-bold text-sm transition-all active:scale-[0.98]"
        >
          {isRegistering ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-ash font-normal">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-ink font-medium underline underline-offset-4 hover:opacity-80"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
