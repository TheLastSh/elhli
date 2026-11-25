import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

const socket: Socket = io(environment.wsBase, {
  withCredentials: true,
  auth: { token: localStorage.getItem('edu_access_token') }
} as any);

export function initializeSocket() {
  // R 457: pasa el token fresco en el handshake del socket
  (socket.io.opts as any).auth = { token: localStorage.getItem('edu_access_token') };
  return socket;
}

export default socket;
