import { AsyncLocalStorage } from 'node:async_hooks';

// Associate messages with their run across awaits, without replacing the global console.
const currentRunLog = new AsyncLocalStorage();

// Limits for retained admin-panel logs; console output is unaffected.
const MAX_STORED_LINES = 200;
const MAX_STORED_LINE_LENGTH = 500;
const MAX_STORED_BYTES = 32_000;
const encoder = new TextEncoder();

// The admin panel reads snapshot during the run and saves it with the final result.
export class RunLog {
    constructor(secrets = []) {
        this.snapshot = { lines: [], omitted: 0 };
        this.storedBytes = 0;
        this.secrets = secrets.filter(value => typeof value === 'string' && value.length >= 6);
    }

    run(callback) {
        return currentRunLog.run(this, callback);
    }

    append(level, message, fields) {
        let line = { at: Date.now(), level, text: this.formatStoredMessage(message, fields) };
        this.snapshot.lines.push(line);
        this.storedBytes += this.storedLineBytes(line);

        while (this.snapshot.lines.length > MAX_STORED_LINES || this.storedBytes > MAX_STORED_BYTES) {
            let removed = this.snapshot.lines.shift();
            this.storedBytes -= this.storedLineBytes(removed);
            this.snapshot.omitted++;
        }
    }

    formatStoredMessage(message, fields) {
        let text = message instanceof Error ? message.message : String(message);

        // Keep readable progress messages; the full structured result has its own JSON view.
        if (fields?.updater)
            text = `[${fields.updater}] ${text}`;
        if (fields?.error)
            text += `: ${fields.error}`;
        if (fields?.attempt)
            text += ` (retry ${fields.attempt})`;

        for (let secret of this.secrets)
            text = text.replaceAll(secret, '[redacted]');
        text = text.replace(/Bearer\s+[^\s,;]+/gi, 'Bearer [redacted]');

        if (text.length > MAX_STORED_LINE_LENGTH)
            text = text.slice(0, MAX_STORED_LINE_LENGTH) + '…';
        return text;
    }

    storedLineBytes(line) {
        return encoder.encode(JSON.stringify(line)).length;
    }
}

export function logMessage(level, message, fields) {
    if (fields === undefined) {
        console[level](message);
    } else if (fields.updater) {
        console[level]({ message, ...fields });
    } else {
        console[level](message, fields);
    }

    let runLog = currentRunLog.getStore();
    if (runLog)
        runLog.append(level, message, fields);
}
