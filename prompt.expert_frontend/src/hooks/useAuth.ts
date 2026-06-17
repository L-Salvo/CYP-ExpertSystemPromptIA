import { useMutation, useQueryClient } from '@tanstack/react-query';
import { registerUser, loginUser, completeOnboarding } from '../api/user.api';
import { useSessionStore } from '../store/session.store';
import { toast } from '../shared/ui';
import { PROFILE_KEY } from './useProfile';
import type {
  RegisterUserRequest,
  LoginRequest,
  OnboardingRequest,
} from '../types/api.types';

/** POST /api/users/login */
export function useLogin() {
  const login = useSessionStore((s) => s.login);
  return useMutation({
    mutationFn: (payload: LoginRequest) => loginUser(payload),
    onSuccess: (data) => {
      login(data);
      toast.success(`Bienvenido, ${data.name}`);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message ?? 'No se pudo iniciar sesión');
    },
  });
}

/** POST /api/users/register */
export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterUserRequest) => registerUser(payload),
    onError: (err: { message?: string }) => {
      toast.error(err.message ?? 'No se pudo crear la cuenta');
    },
  });
}

/** PUT /api/users/{id}/onboarding */
export function useOnboarding() {
  const qc = useQueryClient();
  const setOnboardingComplete = useSessionStore((s) => s.setOnboardingComplete);
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: OnboardingRequest }) =>
      completeOnboarding(userId, payload),
    onSuccess: (user) => {
      setOnboardingComplete(user.onboardingComplete);
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
      toast.success('Perfil completado');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message ?? 'No se pudo completar el onboarding');
    },
  });
}
