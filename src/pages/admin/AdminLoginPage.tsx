import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, LogIn, Mail, UtensilsCrossed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const authenticated = await authService.adminLogin(email, password);
    setLoading(false);

    if (authenticated) {
      navigate(authService.getAdminStartPath());
      return;
    }

    setError('E-mail ou senha inválidos. Confira os dados e tente novamente.');
  }

  return (
    <main className="talabi-login min-h-screen overflow-hidden bg-[#fff8f2]">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-orange-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-orange-300/50 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-2 lg:px-10">
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-bold text-orange-700 shadow-sm">
            <UtensilsCrossed size={17} /> Gestão simples para seu delivery
          </div>
          <h2 className="mt-7 max-w-xl text-5xl font-black leading-[1.05] text-slate-900">
            Seu cardápio, pedidos e equipe em um só lugar.
          </h2>
          <p className="mt-5 max-w-lg text-lg text-slate-600">
            Entre no painel para acompanhar sua operação e deixar tudo pronto para vender mais.
          </p>
        </section>

        <form onSubmit={submit} className="mx-auto w-full max-w-md rounded-[2rem] border border-orange-100 bg-white/95 p-6 shadow-[0_28px_80px_-28px_rgba(234,88,12,.45)] backdrop-blur sm:p-9">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200">
              <UtensilsCrossed size={30} />
            </div>
            <h1 className="talabi-brand mt-5 text-5xl font-black tracking-tight text-orange-600">Talabi</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">Acesse o painel administrativo</p>
          </div>

          <div className="mt-8 space-y-5">
            <label className="grid gap-2 text-sm font-extrabold text-slate-700">
              E-mail
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={19} />
                <input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />
              </div>
            </label>

            <label className="grid gap-2 text-sm font-extrabold text-slate-700">
              Senha
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={19} />
                <input required type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 hover:bg-orange-50 hover:text-orange-600" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </label>

            {error && <p className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-4 font-black text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60">
              <LogIn size={19} /> {loading ? 'Entrando...' : 'Entrar no painel'}
            </button>
          </div>

          <div className="mt-6 rounded-2xl bg-orange-50 p-4 text-center text-xs text-orange-800">
            <strong>Acesso temporário:</strong> admin@talabi.site / talabi123
          </div>
        </form>
      </div>
    </main>
  );
}