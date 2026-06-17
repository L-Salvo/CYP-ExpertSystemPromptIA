import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '../components/atoms/Button';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Input } from '../shared/ui';
import { useLogin } from '../hooks/useAuth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: login, isPending } = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const from = (location.state as LocationState | null)?.from ?? '/';

  function validate() {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'El email es obligatorio';
    else if (!EMAIL_RE.test(email)) next.email = 'Formato de email inválido';
    if (!password) next.password = 'La contraseña es obligatoria';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    login(
      { email: email.trim(), password },
      {
        onSuccess: (data) =>
          navigate(data.onboardingComplete ? from : '/onboarding', { replace: true }),
      },
    );
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Sistema experto de prompts personalizados"
      footer={
        <>
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-[var(--color-aurora-2)] hover:underline font-medium">
            Crear cuenta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button type="submit" variant="primary" size="lg" loading={isPending} className="w-full mt-1">
          Entrar
        </Button>
      </form>
    </AuthLayout>
  );
}
