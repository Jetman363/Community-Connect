/**
 * Client socket hook stub — Phase 2.
 * Returns disconnected state until Socket.io is wired.
 */
export function useSocket() {
  return { connected: false, emit: () => {}, on: () => () => {} };
}
