import { Link } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm.js";
import { ThemeToggle } from "../components/layout/ThemeToggle.js";

export function LoginPage() {
  return (
    <div className="min-h-screen bg-bone flex flex-col justify-between p-6">
      <div className="flex items-center justify-between max-w-[1400px] w-full mx-auto">
        <Link to="/" className="flex items-center gap-2">

          <span className="font-extrabold tracking-tight text-base text-ink">
            Forge
          </span>
        </Link>
        <div className="flex text-center gap-4">
          <Link to="/register" className="text-xs text-ash hover:text-ink transition-colors font-normal">
            Create account
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center py-12">
        <LoginForm />
      </div>

      <div className="text-center text-[10px] uppercase tracking-[0.018em] text-ash">
        <span>© 2026 Forge. All rights reserved.</span>
      </div>
    </div>
  );
}
