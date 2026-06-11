import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiLogin } from "../api";
import { useAuth } from "../useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

interface AdminLoginProps {
  onLogin: (token: string, username: string, full_name?: string, role?: string) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { token, username: user, full_name, role } = await apiLogin(username, password);
      onLogin(token, user, full_name, role);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-shell min-h-screen bg-[hsl(var(--admin-background))] flex items-center justify-center p-4">
      <div className="absolute right-4 top-4 rounded-full border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-card))]">
        <ThemeToggle className="h-10 w-10 border-[hsl(var(--admin-border))] text-[hsl(var(--admin-muted-foreground))] hover:border-[hsl(var(--admin-foreground))]/30 hover:bg-[hsl(var(--admin-hover))] hover:text-[hsl(var(--admin-foreground))]" />
      </div>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[hsl(var(--admin-primary))] rounded-2xl mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-[hsl(var(--admin-primary-foreground))]" />
          </div>
          <h1 className="text-2xl font-bold text-[hsl(var(--admin-foreground))] tracking-tight">Силуэт Admin</h1>
          <p className="text-[hsl(var(--admin-muted-foreground))] mt-1 text-sm">Панель управления</p>
        </div>

        {/* Card */}
        <div className="bg-[hsl(var(--admin-card))] border border-[hsl(var(--admin-border))] rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[hsl(var(--admin-foreground))] text-sm font-medium">
                Логин
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--admin-muted-foreground))]" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите логин"
                  className="pl-10 bg-[hsl(var(--admin-input))] border-[hsl(var(--admin-border))] text-[hsl(var(--admin-foreground))] placeholder:text-[hsl(var(--admin-muted-foreground))] focus:border-[hsl(var(--admin-foreground))] focus:ring-0 h-11"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[hsl(var(--admin-foreground))] text-sm font-medium">
                Пароль
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--admin-muted-foreground))]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="pl-10 pr-10 bg-[hsl(var(--admin-input))] border-[hsl(var(--admin-border))] text-[hsl(var(--admin-foreground))] placeholder:text-[hsl(var(--admin-muted-foreground))] focus:border-[hsl(var(--admin-foreground))] focus:ring-0 h-11"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--admin-muted-foreground))] hover:text-[hsl(var(--admin-foreground))] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[hsl(var(--admin-primary))] text-[hsl(var(--admin-primary-foreground))] hover:bg-[hsl(var(--admin-primary))]/90 font-semibold text-sm transition-colors"
            >
              {loading ? "Вход..." : "Войти"}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[hsl(var(--admin-border))]">
            <p className="text-xs text-[hsl(var(--admin-muted-foreground))] text-center">
              Доступ только для авторизованных администраторов
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
