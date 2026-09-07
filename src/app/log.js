import { AsyncLocalStorage } from 'node:async_hooks';

// Capture application messages for one run without replacing the global console.
const currentRun = new AsyncLocalStorage();
const MAX_LINES = 200;
const MAX_LINE_LENGTH = 500;
const MAX_BYTES = 32_000;
const encoder = new TextEncoder();

export function createRunLog(secrets = []) {
    let snapshot = { lines: [], omitted: 0 };
    let context = {
        snapshot,
        bytes: 0,
        secrets: secrets.filter(value => typeof value === 'string' && value.length >= 6),
    };

    return {
        snapshot,
        run: callback => currentRun.run(context, callback),
    };
}

export function logMessage(level, message, fields) {
    if (fields === undefined) {
        console[level](message);
    } else if (fields.updater) {
        console[level]({ message, ...fields });
    } else {
        console[level](message, fields);
    }

    let context = currentRun.getStore();
    if (!context)
        return;

    let text = message instanceof Error ? message.message : String(message);
    // Keep readable progress messages; the full structured result has its own JSON view.
    if (fields?.updater)
        text = `[${fields.updater}] ${text}`;
    if (fields?.error)
        text += `: ${fields.error}`;
    if (fields?.attempt)
        text += ` (retry ${fields.attempt})`;
    for (let secret of context.secrets)
        text = text.replaceAll(secret, '[redacted]');
    text = text.replace(/Bearer\s+[^\s,;]+/gi, 'Bearer [redacted]');
    const { snapshot } = context;
    snapshot.lines.push({
        at: Date.now(),
        level,
        text: text.length > MAX_LINE_LENGTH ? text.slice(0, MAX_LINE_LENGTH) + '…' : text,
    });
    context.bytes += encoder.encode(JSON.stringify(snapshot.lines.at(-1))).length;
    while (snapshot.lines.length > MAX_LINES || context.bytes > MAX_BYTES) {
        context.bytes -= encoder.encode(JSON.stringify(snapshot.lines.shift())).length;
        snapshot.omitted++;
    }
}
