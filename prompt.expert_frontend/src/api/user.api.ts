import client from './client';
import type {
  RegisterUserRequest,
  RegisterUserResponse,
  LoginRequest,
  LoginResponse,
  OnboardingRequest,
  UserResponse,
} from '../types/api.types';

/** POST /api/users/register — Registro con credenciales (demo, password en texto plano) */
export async function registerUser(payload: RegisterUserRequest): Promise<RegisterUserResponse> {
  const { data } = await client.post<RegisterUserResponse>('/users/register', payload);
  return data;
}

/** POST /api/users/login — Login por email + password. Devuelve userId (sin token) */
export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>('/users/login', payload);
  return data;
}

/** GET /api/users/{id} — Datos del usuario + estado de onboarding */
export async function getUser(userId: number): Promise<UserResponse> {
  const { data } = await client.get<UserResponse>(`/users/${userId}`);
  return data;
}

/** PUT /api/users/{id}/onboarding — Completa el perfil; reemplaza por completo las skills */
export async function completeOnboarding(
  userId: number,
  payload: OnboardingRequest,
): Promise<UserResponse> {
  const { data } = await client.put<UserResponse>(`/users/${userId}/onboarding`, payload);
  return data;
}
