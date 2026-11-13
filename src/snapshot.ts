import { randomUUID } from 'node:crypto';
import type { TestInfo } from '@playwright/test';

/** Viewport used when the screenshot's dimensions cannot be read from its PNG header. */
const DEFAULT_VIEWPORT = { width: 1280, height: 720 };

/**
 * Reads the pixel dimensions from a base64-encoded PNG's IHDR chunk, so the trace viewer frames the
 * screenshot at its real size. Falls back to {@link DEFAULT_VIEWPORT} for anything that isn't a PNG.
 */
function pngSize(data: string): { width: number, height: number } {
    // signature (8 bytes) + IHDR length/type (8 bytes) + width (4) + height (4) = first 24 bytes
    const header = Buffer.from(data.slice(0, 32), 'base64');
    if (header.length < 24 || header.toString('latin1', 12, 16) !== 'IHDR') return DEFAULT_VIEWPORT;
    const width = header.readUInt32BE(16);
    const height = header.readUInt32BE(20);
    return width > 0 && height > 0 ? { width, height } : DEFAULT_VIEWPORT;
}

/**
 * Shows a base64-encoded PNG screenshot in the Playwright report.
 *
 * When Playwright is recording a trace, the screenshot is injected into its internal trace event
 * stream (`TestInfo._tracing._traceEvents`): this function synthesises the three events Playwright
 * needs to display a screenshot frame inside the trace viewer, attaching it at the point
 * immediately after the most-recently-completed step.
 *
 * That stream is a private API. If it is unavailable (a Playwright version that changed it) or no
 * trace is being recorded, the screenshot is attached with the public `testInfo.attach()` instead,
 * so it still appears in the HTML report.
 *
 * @param testInfo - The Playwright `TestInfo` object for the currently-running test.
 * @param data - Base64-encoded PNG image data (without the `data:image/png;base64,` prefix).
 */
export async function attachScreenshot(testInfo: TestInfo, data: string) {
    if (!injectIntoTrace(testInfo, data)) {
        await testInfo.attach('screenshot', { body: Buffer.from(data, 'base64'), contentType: 'image/png' });
    }
}

/**
 * Injects the screenshot into Playwright's private trace event stream.
 *
 * @returns `true` when the screenshot was injected, `false` when the internals are unavailable or
 *   no trace is being recorded for this test.
 */
function injectIntoTrace(testInfo: TestInfo, data: string): boolean {
    try {
        const tracing = (testInfo as TestInfo & { _tracing?: any })._tracing;
        const traceEvents: unknown = tracing?._traceEvents;
        if (!Array.isArray(traceEvents)) return false;
        // `traceOptions()` is undefined when the configured trace mode doesn't record this test
        if (typeof tracing.traceOptions === 'function' && !tracing.traceOptions()) return false;

        const id = randomUUID();
        const lastEvent = traceEvents.findLast(trace => trace.type === 'after') ?? { endTime: 0 };
        const parent = traceEvents.findLast(
            (beforeTrace, index, arr) => beforeTrace.type === 'before' && !arr.some(afterTrace => afterTrace.type === 'after' && beforeTrace.callId === afterTrace.callId)
        );
        traceEvents.push({
            type: 'before',
            callId: `screenshot@${id}`,
            startTime: lastEvent.endTime + 1,
            class: 'Test',
            method: 'Attachment',
            title: 'Screenshot',
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
                // trace v9 (playwright >= 1.63) links snapshots to actions via `phase`
                phase: 'after',
                // `snapshotName` is the v8 link, kept for older playwright versions
                snapshotName: `after@screenshot@${id}`,
                pageId: 'page@1',
                frameId: 'frame@1',
                frameUrl: 'Screenshot',
                doctype: 'html',
                html: ['HTML', { 'lang': 'en' },
                    ['HEAD', {},
                        ['BASE', { 'href': 'Screenshot' }],
                        ['META', { 'charset': 'utf-8' }],
                        ['TITLE', {}, 'Screenshot']
                    ],
                    ['BODY', { 'style': `margin: 0; display:flex; justify-content:center; align-items:center; height:100vh;` },
                        ['DIV', { 'style': `display: flex; justify-content: center; align-items: center; height: 100vh;` },
                            ['IMG', { '__playwright_current_src__': `data:image/png;base64,${data}`, 'style': 'display: block; object-fit: cover; height: 100%; width: 100%;' }]
                        ],
                    ]
                ],
                viewport: pngSize(data),
                timestamp: 1,
                wallTime: 1,
                collectionTime: 1,
                resourceOverrides: [],
                isMainFrame: true
            }
        });
        return true;
    } catch {
        return false;
    }
}
