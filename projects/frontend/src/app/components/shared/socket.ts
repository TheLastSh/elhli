import { io } from 'socket.io-client';
import { environment } from '../../../environments/environment';

const socket = io(`${environment.wsBase}`, { withCredentials: true });

export function initializeSocket() {
  return socket;
}
