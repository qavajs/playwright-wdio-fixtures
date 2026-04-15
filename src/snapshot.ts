import type { Browser } from 'webdriverio';
import { randomUUID } from 'node:crypto';
import type { TestInfo } from '@playwright/test';

/**
 * Injects a base64-encoded PNG screenshot into Playwright's internal trace event stream.
 *
 * Playwright traces are built from a list of `before`/`after`/`frame-snapshot` events stored in
 * `TestInfo._tracing._traceEvents`. This function synthesises the three events Playwright needs to
 * display a screenshot frame inside the trace viewer, attaching it at the point immediately after
 * the most-recently-completed step.
 *
 * @param testInfo - The Playwright `TestInfo` object for the currently-running test, augmented with
 *   the internal `_tracing` handle that exposes the raw trace-event array.
 * @param data - Base64-encoded PNG image data (without the `data:image/png;base64,` prefix).
 */
export function attachScreenshot(testInfo: TestInfo & { _tracing: any }, data: string) {
    try {
    const id = randomUUID();
    const traceEvents: any[] = testInfo._tracing._traceEvents;
    const lastEvent = traceEvents.findLast(trace => trace.type === 'after') ?? {endTime: 0};
    const parent = traceEvents.findLast(
        (beforeTrace, index, arr) => beforeTrace.type === 'before' && !arr.some(afterTrace => afterTrace.type === 'after' && beforeTrace.callId === afterTrace.callId)
    );
    traceEvents.push({
        type: 'before',
        callId: `screenshot@${id}`,
        startTime: lastEvent.endTime + 1,
        class: 'Test',
        method: 'Attachment',
        params: {},
        stepId: id,
        pageId: 'page@1',
        parentId: parent?.callId
    });
    traceEvents.push({
        type: 'after',
        callId: `screenshot@${id}`,
        endTime: lastEvent.endTime + 1,
        result: {},
        afterSnapshot: `after@screenshot@${id}`
    });
    traceEvents.push({
        type: 'frame-snapshot',
        snapshot: {
            callId: `screenshot@${id}`,
            snapshotName: `after@screenshot@${id}`,
            pageId: 'page@1',
            frameId: 'frame@1',
            frameUrl: 'Screenshot',
            doctype: 'html',
            html: ['HTML', {'lang': 'en'},
                ['HEAD', {},
                    ['BASE', {'href': 'Screenshot'}],
                    ['META', {'charset': 'utf-8'}],
                    ['TITLE', {}, 'Screenshot']
                ],
                ['BODY', {'style': `margin: 0; display:flex; justify-content:center; align-items:center; height:100vh;`},
                    ['DIV', {'style': `display: flex; justify-content: center; align-items: center; height: 100vh;`},
                        ['IMG', { '__playwright_current_src__': `data:image/png;base64,${data}`, 'style': 'display: block; object-fit: cover; height: 100%; width: 100%;' }]
                    ],
                ]
            ],
            viewport: {
                'width': 1280, 'height': 720
            },
            timestamp: 1,
            wallTime: 1,
            collectionTime: 1,
            resourceOverrides: [],
            isMainFrame: true
        }
    });
    } catch {
        console.warn('Playwright internal tracing API unavailable; screenshot attachment skipped.');
    }
}
/**
 * Takes a screenshot via WebdriverIO and attaches it to the Playwright trace.
 *
 * Intended to be bound as a method on a WebdriverIO `Browser` instance (the `this` context).
 * Calls `browser.takeScreenshot()` and forwards the resulting base64 data to {@link attachScreenshot}.
 *
 * @param this - The WebdriverIO `Browser` instance used to capture the screenshot.
 * @param testInfo - The Playwright `TestInfo` object for the currently-running test.
 * @returns The base64-encoded PNG string returned by WebdriverIO.
 */
export async function takeScreenshot(this: Browser, testInfo: TestInfo & { _tracing: any }) {
    const screenshot = await this.takeScreenshot();
    attachScreenshot(testInfo, screenshot);
    return screenshot;
}