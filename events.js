

// Gameplay announces changes; UI modules subscribe during initialization.
const listeners = new Map();
function on(event, listener) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(listener);
  return () => listeners.get(event)?.delete(listener);
}
function emit(event, detail) {
  for (const listener of listeners.get(event) ?? []) listener(detail);
}

export { on, emit };
