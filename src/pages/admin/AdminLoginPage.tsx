import { useState } from 'react';
import { Eye, EyeOff, LogIn, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { authService } from '../../services/authService';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

 async function submit(
  event: React.FormEvent<HTMLFormElement>,
): Promise<void> {
  event.preventDefault();
  setError('');
  setLoading(true);

  const authenticated = await authService.adminLogin(
    email,
    password,
  );

  setLoading(false);

  if (authenticated) {
    navigate(authService.getAdminStartPath());
    return;
  }

  setError(
    'E-mail ou senha inválidos, ou o backend está indisponível.',
  );
}

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border bg-white p-8 shadow-xl"
      >
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <UserRound size={28} />
        </div>

        <h1 className="text-2xl font-black">Login administrativo</h1>
        <p className="mt-1 text-sm text-slate-500">
          Entre com o e-mail e a senha cadastrados no backend.
        </p>

        <div className="mt-6 space-y-4">
          <label className="grid gap-2 text-sm font-bold">
            E-mail
            <Input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@empresa.com"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold">
            Senha
            <div className="relative">
              <Input
                required
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <Button
  type="submit"
  disabled={loading}
  className="flex w-full items-center justify-center gap-2"
>
            <LogIn size={18} /> {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
