export enum AuthStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  error: string | null;
}