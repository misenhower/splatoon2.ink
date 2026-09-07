// A deadline covers both receiving headers and consuming the response body.
export function fetchWithTimeout(input, init = {}, timeoutMs = 30_000) {
    let timeout = AbortSignal.timeout(timeoutMs);
    let existing = init.signal ?? (input instanceof Request ? input.signal : null);
    let signal = existing ? AbortSignal.any([existing, timeout]) : timeout;
    return fetch(input, { ...init, signal });
}
