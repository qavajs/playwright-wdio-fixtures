import { test as baseTest, expect as baseExpect } from '../src';
import { Browser } from 'webdriverio';

export default class App {
    constructor(private $: Browser['$'], private $$: Browser['$$']) {}

    get simpleTextElement() {
        return this.$('#textValue');
    }

    get simpleTextListItems() {
        return this.$$('#textValueList li');
    }

    get simpleTextInput() {
        return this.$('#textInput');
    }

    get fileInput() {
        return this.$('#fileInput');
    }

    get action() {
        return this.$('#action');
    }

    get alertButton() {
        return this.$('#confirm');
    }

    get promptButton() {
        return this.$('#prompt');
    }

    get body() {
        return this.$('body');
    }

    get button() {
        return this.$('#button');
    }

    get buttonTap() {
        return this.$('#buttonTap');
    }

    get buttonHover() {
        return this.$('#buttonHover');
    }

    get input() {
        return this.$('#input');
    }

    get select() {
        return this.$('#select');
    }

    get buttons() {
        return this.$('.button');
    }

    get iFrame() {
        return this.$('iframe#firstIframe');
    }

    get innerIFrame() {
        return this.$('iframe#innerIframe');
    }

    get frameElement() {
        return this.$('#frameElement');
    }

    get innerFrameElement() {
        return this.$('#innerFrameElement');
    }

    get newTabLink() {
        return this.$('#newTabLink');
    }

    get enabledButton() {
        return this.$('#enabledButton');
    }

    get disabledButton() {
        return this.$('#disabledButton');
    }

    get presentElement() {
        return this.$('#present');
    }

    get presentCollection() {
        return this.$('#present');
    }

    get detachElement() {
        return this.$('#detach');
    }

    get visibleElement() {
        return this.$('#visible');
    }

    get hiddenElement() {
        return this.$('#hidden');
    }

    get infiniteScroll() {
        return this.$('#infiniteScroll');
    }

    get loading() {
        return this.$('#loading');
    }

    get loadingInput() {
        return this.$('#loadingInput');
    }

    get waitCollection() {
        return this.$('#waitCollection > div');
    }

    get pressCounter() {
        return this.$('#pressCounter');
    }

    get overflowContainer() {
        return this.$('#overflowContainer');
    }

    get keyDump() {
        return this.$('#keywordevent');
    }

    get cookie() {
        return this.$('#cookie');
    }

    get localStorage() {
        return this.$('#localStorage');
    }

    get sessionStorage() {
        return this.$('#sessionStorage');
    }

    get dropZone() {
        return this.$('div#div1');
    }

    get dragElement() {
        return this.$('div#drag1');
    }

    get dragElementInDropZone() {
        return this.$('div#div1 div#drag1');
    }

    get eventHandler() {
        return this.$('#mouseEvent');
    }

    get keyboardEventHandler() {
        return this.$('#keyboardEvent');
    }

    get scrollElement() {
        return this.$('#scrollElement');
    }
}

export const expect = baseExpect;

type Fixture = {
    app: App;
}
export const test = baseTest.extend<Fixture>({
    app: async ({ $, $$ }, use) => {
        await use(new App($, $$))
    }
});