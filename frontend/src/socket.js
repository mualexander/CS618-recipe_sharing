import { io } from 'socket.io-client'

// Same-origin: the Vite dev server and nginx both proxy /socket.io to the backend.
export const socket = io()
