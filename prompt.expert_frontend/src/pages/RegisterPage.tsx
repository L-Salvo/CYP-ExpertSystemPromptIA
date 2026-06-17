import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/atoms/Button';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Input } from '../shared/ui';
import { useRegister, useLogin } from '../hooks/useAuth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { mutate: register, isPending: registering } = useRegister();
  const { mutate: login, isPending: loggingIn } = useLogin();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate() {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = 'El nombre es obligatorio';
    if (!email.trim()) next.email = 'El email es obligatorio';
    else if (!EMAIL_RE.test(email)) next.email = 'Formato de email inválido';
    if (!password) next.password = 'La contraseña es obligatoria';
    else if (password.length < 4) next.password = 'Mínimo 4 caracteres';
    if (confirm !== password) next.confirm = 'Las contraseñas no coinciden';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const credentials = { name: name.trim(), email: email.trim(), password };
    register(credentials, {
      // Tras registrar, iniciamos sesión automáticamente y vamos al onboarding (perfil vacío).
      onSuccess: () =>
        login(
          { email: credentials.email, password },
          { onSuccess: () => navigate('/onboarding', { replace: true }) },
        ),
    });
  }

  const isPending = registering || loggingIn;

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Empezá a personalizar tus prompts en minutos"
      footer={
        <>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-[var(--color-aurora-2)] hover:underline font-medium">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Nombre"
          autoComplete="name"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
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
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <Button type="submit" variant="primary" size="lg" loading={isPending} className="w-full mt-1">
          Crear cuenta
        </Button>
      </form>
    </AuthLayout>
  );
}
