import type { Browser } from 'webdriverio';
import { randomUUID } from 'node:crypto';
import type { TestInfo } from '@playwright/test';

export function attachScreenshot(testInfo: TestInfo & { _tracing: any }, data: string) {
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
}
export async function takeScreenshot(this: Browser, testInfo: TestInfo & { _tracing: any }) {
    const screenshot = await this.takeScreenshot();
    attachScreenshot(testInfo, screenshot);
    return screenshot;
}