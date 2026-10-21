import { Link } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm.js";
import { ThemeToggle } from "../components/layout/ThemeToggle.js";
import { ForgeAppIcon } from "../components/common/ForgeLogo.js";

export function LoginPage() {
  return (
    <div className="min-h-screen bg-bone flex flex-col justify-between p-6">
      <div className="flex items-center justify-between max-w-[1400px] w-full mx-auto">
        <Link to="/" className="flex items-center gap-2.5 group">
          <ForgeAppIcon size="sm" />
          <span className="font-extrabold tracking-tight text-base text-ink group-hover:opacity-85 transition-opacity">
            Forge
          </span>
        </Link>
        <div className="flex text-center gap-4">
          <Link to="/register" className="text-xs hover:text-ink transition-colors font-medium bg-gray-200 text-gray-800 px-4 py-2 rounded-md">
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
