import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { RunLog, logMessage } from '../../src/app/log.js';

test('bounds retained logs, redacts secrets, and preserves normal console output', async () => {
  const consoleLog = mock.method(console, 'info', () => {});
  try {
    const capture = new RunLog(['secret-value']);
    await capture.run(async () => {
      for (let i = 0; i < 205; i++) logMessage('info', `line ${i}`);
      logMessage('info', 'secret-value Bearer sensitive-token');
    });
    assert.equal(capture.snapshot.lines.length, 200);
    assert.equal(capture.snapshot.omitted, 6);
    assert.equal(capture.snapshot.lines.at(-1).text, '[redacted] Bearer [redacted]');
    assert.equal(consoleLog.mock.callCount(), 206);
  } finally {
    mock.restoreAll();
  }
});
test('concurrent run contexts do not capture each other or unrelated messages', async () => {
  mock.method(console, 'info', () => {});
  try {
    const a = new RunLog(),
      b = new RunLog();
    await Promise.all([
      a.run(async () => {
        await Promise.resolve();
        logMessage('info', 'a');
      }),
      b.run(async () => {
        logMessage('info', 'b');
      }),
    ]);
    logMessage('info', 'outside');
    assert.deepEqual(
      a.snapshot.lines.map((l) => l.text),
      ['a'],
    );
    assert.deepEqual(
      b.snapshot.lines.map((l) => l.text),
      ['b'],
    );
  } finally {
    mock.restoreAll();
  }
});
