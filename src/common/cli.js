// Minimal replacement for make-runnable: run one of the exported actions by name.
export async function runAction(actions, [name, ...args]) {
    if (!name || !Object.hasOwn(actions, name)) {
        console.error(`Usage: <action> [args...]\nAvailable actions: ${Object.keys(actions).join(', ')}`);
        process.exitCode = 1;

        return;
    }

    let result = await actions[name](...args);

    if (result !== undefined)
        console.log(result);
}
