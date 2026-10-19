import { Link } from "react-router-dom";
import { RegisterForm } from "../components/auth/RegisterForm.js";
import { ThemeToggle } from "../components/layout/ThemeToggle.js";
import { ForgeAppIcon } from "../components/common/ForgeLogo.js";

export function RegisterPage() {
  return (
    <div className="min-h-screen bg-bone flex flex-col justify-between p-6">
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
        <Link to="/" className="flex items-center gap-2.5 group">
          <ForgeAppIcon size="sm" />
          <span className="font-normal tracking-tight text-base text-ink group-hover:opacity-85 transition-opacity">
            Forge
          </span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-center my-8">
        <RegisterForm />
      </div>

      <div className="text-center text-xs text-ash">
        <span>© 2026 Forge. All rights reserved.</span>
      </div>
    </div>
  );
}
