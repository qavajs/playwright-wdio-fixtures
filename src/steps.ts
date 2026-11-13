import type { TestType } from '@playwright/test';
import { AsyncLocalStorage } from 'node:async_hooks';
import { isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Set while a WebdriverIO command is executing.
 *
 * WebdriverIO commands call each other internally — `setValue` runs `clearValue` + `addValue`,
 * `getHTML` runs `execute` → `waitForExist` → `waitUntil` → `isExisting` — and every one of those
 * calls goes through the same `overwriteCommand` wrapper. Tracking the scope lets the wrapper
 * report only the outermost command, so the trace shows what the test asked for instead of
 * WebdriverIO's internals.
 *
 * `AsyncLocalStorage` rather than a plain boolean: commands run concurrently (`Promise.all`,
 * iterating a `$$` collection), and a shared flag would swallow sibling top-level commands too.
 */
const commandScope = new AsyncLocalStorage<true>();

/**
 * Reports `run` as a Playwright step titled `title`, unless another WebdriverIO command is already
 * in progress — in that case `run` is invoked directly and contributes no step.
 *
 * @param ctx - The Playwright `TestType` context used for step registration and location info.
 * @param title - Human-readable step title.
 * @param run - The command invocation to execute and time.
 */
export function reportStep<T>(ctx: TestType<any, any>, title: string, run: () => T): T {
    if (commandScope.getStore()) return run();
    const location = callerLocation() ?? testLocation(ctx);
    return ctx.step(title, () => commandScope.run(true, run) as any, { location }) as T;
}

type Location = { file: string, line: number, column: number };

/** This package's own directory (`src/` in development, `lib/` once installed). */
const ownDir = __dirname + sep;

/** Matches a V8 stack frame such as `at fn (/path/file.ts:1:2)` or `at file:///path/file.ts:1:2`. */
const FRAME = /^\s*at (?:.*?\()?(.+?):(\d+):(\d+)\)?$/;

/**
 * Finds the line in user code that issued the current WebdriverIO command, so the step links to
 * that call in the trace viewer and HTML report instead of to the `test(...)` declaration.
 *
 * The wrapper runs synchronously beneath the user's call (via WebdriverIO's command chain), so the
 * first frame that is not Node internals, a dependency, or this package is the call site.
 */
function callerLocation(): Location | undefined {
    const limit = Error.stackTraceLimit;
    Error.stackTraceLimit = 50;
    const stack = new Error().stack ?? '';
    Error.stackTraceLimit = limit;
    for (const frame of stack.split('\n').slice(1)) {
        const match = FRAME.exec(frame);
        if (!match) continue;
        let file = match[1];
        if (file.startsWith('file://')) file = fileURLToPath(file);
        if (!isAbsolute(file) || file.includes(`${sep}node_modules${sep}`) || file.startsWith(ownDir)) continue;
        return { file, line: Number(match[2]), column: Number(match[3]) };
    }
    return undefined;
}

/** Fallback location: the current test's declaration. */
function testLocation(ctx: TestType<any, any>): Location {
    const { file, line, column } = ctx.info();
    return { file, line, column };
}

/**
 * Runs `run` with step reporting disabled for every WebdriverIO command it triggers.
 *
 * Used by the polling assertions, which would otherwise emit a full set of command steps on every
 * retry — a single `expect(el).toBeDisplayed()` that waits a second produces five of them.
 */
export function withoutSteps<T>(run: () => Promise<T>): Promise<T> {
    return commandScope.run(true, run);
}
