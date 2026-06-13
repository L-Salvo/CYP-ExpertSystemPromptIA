import axios, { AxiosError } from 'axios';
import type { ErrorResponse } from '../types/api.types';
import { mockAdapter } from './mocks';

const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
  adapter: useMocks ? mockAdapter : undefined,
});

// Response interceptor — normalizes errors to ErrorResponse shape
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    const apiError: ErrorResponse = error.response?.data ?? {
      status: error.response?.status ?? 500,
      error: 'Network Error',
      message: error.message,
      timestamp: new Date().toISOString(),
    };
    return Promise.reject(apiError);
  }
);

export default client;
