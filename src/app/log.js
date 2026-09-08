import { AsyncLocalStorage } from 'node:async_hooks';

// Associate messages with their run across awaits, without replacing the global console.
const currentRun = new AsyncLocalStorage();
const MAX_LINES = 200;
const MAX_LINE_LENGTH = 500;
const MAX_BYTES = 32_000;
const encoder = new TextEncoder();

// The admin panel reads snapshot during the run and saves it with the final result.
export class RunLog {
    constructor(secrets = []) {
        this.snapshot = { lines: [], omitted: 0 };
        this.bytes = 0;
        this.secrets = secrets.filter(value => typeof value === 'string' && value.length >= 6);
    }

    run(callback) {
        return currentRun.run(this, callback);
    }

    append(level, message, fields) {
        let line = { at: Date.now(), level, text: this.formatMessage(message, fields) };
        this.snapshot.lines.push(line);
        this.bytes += this.lineSize(line);

        while (this.snapshot.lines.length > MAX_LINES || this.bytes > MAX_BYTES) {
            let removed = this.snapshot.lines.shift();
            this.bytes -= this.lineSize(removed);
            this.snapshot.omitted++;
        }
    }

    formatMessage(message, fields) {
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

        if (text.length > MAX_LINE_LENGTH)
            text = text.slice(0, MAX_LINE_LENGTH) + '…';
        return text;
    }

    lineSize(line) {
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

    let run = currentRun.getStore();
    if (run)
        run.append(level, message, fields);
}
