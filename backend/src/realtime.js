// Thin wrapper so services can publish events without depending on
// Socket.IO directly. When no server is attached (e.g. in tests) every
// call is a no-op.
let io = null

export function attachIo(server) {
  io = server
}

export const rooms = {
  user: (id) => `user:${id}`,
}

export function broadcast(event, payload) {
  io?.emit(event, payload)
}

export function emitTo(room, event, payload) {
  io?.to(room).emit(event, payload)
}
