import type { TestType } from '@playwright/test';
import { AsyncLocalStorage } from 'node:async_hooks';

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
    const { file, line, column } = ctx.info();
    return ctx.step(title, () => commandScope.run(true, run) as any, { location: { file, line, column } }) as T;
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
