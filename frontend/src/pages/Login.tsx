import { Link } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm.js";
import { ThemeToggle } from "../components/layout/ThemeToggle.js";

export function LoginPage() {
  return (
    <div className="min-h-screen bg-bone flex flex-col justify-between p-6">
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-[4px] bg-primary flex items-center justify-center font-normal text-ink text-xs leading-none">
            F
          </div>
          <span className="font-normal tracking-tight text-base text-ink">
            Forge
          </span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-center my-8">
        <LoginForm />
      </div>

      <div className="text-center text-xs text-ash">
        <span>© 2026 Forge. All rights reserved.</span>
      </div>
    </div>
  );
}
