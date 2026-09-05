// Structured logging for Workers Logs. Objects (not JSON strings) are logged so the
// dashboard extracts and indexes each field, e.g. filter on driftMs or updater.
export function createLogger(updater) {
  function emit(level, message, fields) {
    console[level]({ updater, message, ...fields });
  }

  return {
    info: (message, fields = {}) => emit('info', message, fields),
    warn: (message, fields = {}) => emit('warn', message, fields),
    error: (message, fields = {}) => emit('error', message, fields),
  };
}

export function describeError(error) {
  return error instanceof Error
    ? { error: error.message, stack: error.stack }
    : { error: String(error) };
}
