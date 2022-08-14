(function(){
    const E = unsafeWindow.AUTOMUDAE?.E;

    if (!E){
        console.error("[AUTO MUDAE][!] Couldn't load CSS. ENUM is missing.");
        return;
    }

    const CSS = {};

    CSS.decorators = `
    li[id^=chat-message].plus{
        position: relative;
        background-color: rgb(0 255 78 / 10%);
    }

    li[id^=chat-message].plus::after {
        content: '+';
        position: absolute;
        bottom: 0;
        width: 22px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #22441a;
        color: lime;
    }
    `;

    CSS.mainButton = `
    #automudae-main-button {
        position: absolute;
        inset: 8px 0 auto 0;
        width: fit-content;
        margin-inline: auto;
        padding: 5px;
        background-color: var(--button-outline-brand-background-active);
        color: var(--text-normal);
        font-weight: 500;
        transition: 200ms;
        z-index: 9999;
    }

    #automudae-main-button:is(.${E.AUTOMUDAE_STATE.INJECT}, .${E.AUTOMUDAE_STATE.IDLE}, .${E.AUTOMUDAE_STATE.RUN}):hover {
        transform: scale(1.1);
        cursor: pointer;
        /* background-color: var(--button-outline-brand-background-hover); */
    }
    `;

    CSS.sidePanels = `
    [id^=automudae-panel] {
        background-color: var(--background-primary);
        font-weight: 500;
        display: flex;
        flex-direction: column;
        gap: 10px;
        transition: 500ms;
        overflow: hidden;
        height: fit-content;
    }

    [id^=automudae-panel] > * {
        background-color: var(--interactive-muted);
    }

    [id^=automudae-panel] :is(h1, h2) {
        background-color: var(--background-tertiary);
        color: var(--text-normal);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    [id^=automudae-panel] h1 {
        font-size: large;
        height: 1.5rem;
        background-color: var(--button-outline-brand-background-active);
        cursor: pointer;
    }

    [id^=automudae-panel] h1:hover {
        background-color: var(--button-outline-brand-background-hover) !important;
    }

    [id^=automudae-panel] h2 {
        font-size: medium;
        height: 1rem;
    }

    [id^=automudae-panel] textarea {
        font-weight: 900;
        max-height: 100px;
    }

    [id^=automudae-panel] span {
        font-size: small;
        color: var(--text-normal);
    }

    [id^=automudae-panel] ul {
        width: 100%;
        font-size: small;
        color: var(--text-normal);
        max-height: 2rem;
        overflow-x: clip;
        overflow-y: auto;
    }

    [id^=automudae-panel] li:nth-child(odd) {
        background-color: var(--background-primary);
    }

    .automudae-section {
        margin-bottom: 5px;
    }

    .automudae-section-body {
        display: flex;
        padding: 4px;
        flex-wrap: wrap;
    }

    .automudae-section-body > div {
        display: flex;
        padding-inline: 3px;
        border-radius: 5px;
    }

    .automudae-section-body > div:hover {
        background-color: var(--button-secondary-background-hover);
    }

    #automudae-panel-info .automudae-section-body {
        flex-direction: column;
        gap: 8px;
    }

    #automudae-section-kakera > div {
        justify-content: space-between;
    }

    #automudae-section-kakera > div > div {
        flex-direction: column;
        padding: 0;
    }

    #automudae-section-status .automudae-section-body {
        padding: 0;
    }

    .automudae-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }

    .automudae-row > div {
        display: flex;
        align-items: center;
    }
    
    .automudae-row-expandable {
        padding: 3px;
        display: block !important;
    }

    .automudae-row-expandable > div:not(:first-child) {
        margin-top: 2px;
        background-color: var(--background-primary);
        max-height: 0px;
        overflow: hidden;
        transition: max-height 300ms linear;
    }
    
    .automudae-row-expandable:hover > div:not(:first-child) {
        max-height: 300px;
    }
    
    .automudae-row-expandable > div:not(:first-child) > .automudae-row:hover {
        background-color: var(--background-accent);
    }

    [id^=automudae-panel] > div {
        max-height: 600px;
        transition: max-height 400ms cubic-bezier(0, 1, 1, 1);
    }

    [id^=automudae-panel].collapsed {
        gap: 0px;
    }
    
    [id^=automudae-panel].collapsed > div {
        max-height: 0px;
    }

    [data-requirerestart] {
        position: relative;
    }
    
    [data-requirerestart]::before {
        content: '*';
        color: yellow;
        position: absolute;
        left: 0px;
    }
    
    [data-requirerestart]:hover::before {
        content: '* Require restart to work!';
        position: absolute;
        bottom: 20px;
        background-color: var(--background-tertiary);
        font-size: x-small;
        padding: 2px 10px;
        color: yellow;
        border-radius: 5px;
    }
    `;

    unsafeWindow.AUTOMUDAE ??= {};
    unsafeWindow.AUTOMUDAE.CSS = Object.values(CSS).join(' ');
    console.info("[AUTO MUDAE][i] Loaded CSS.");
})();