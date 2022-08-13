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

    .automudae-category-panel {
        margin-bottom: 5px;
    }

    .automudae-category-panel > div {
        display: flex;
        padding: 4px;
        flex-wrap: wrap;
    }

    .automudae-category-panel > div > div:hover {
        background-color: var(--button-secondary-background-hover);
    }

    .automudae-category-panel > div > div {
        display: flex;
        padding-inline: 3px;
        border-radius: 5px;
    }

    #automudae-config-category-kakera > div {
        justify-content: space-between;
    }

    #automudae-config-category-kakera > div > div {
        flex-direction: column;
        padding: 0;
    }

    #automudae-panel-info .automudae-category-panel > div > div {
        width: 100%;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }

    #automudae-panel-info .automudae-category-panel > div > div > div {
        display: flex;
        align-items: center;
    }

    #automudae-panel-info .automudae-category-panel > div {
        gap: 8px;
    }

    [id^=automudae-panel] > div {
        max-height: 300px;
        transition: max-height 200ms linear;
    }

    [id^=automudae-panel].collapsed {
        gap: 0px;
    }
    
    [id^=automudae-panel].collapsed > div {
        max-height: 0px;
    }
    `;

    unsafeWindow.AUTOMUDAE ??= {};
    unsafeWindow.AUTOMUDAE.CSS = Object.values(CSS).join(' ');
    console.info("[AUTO MUDAE][i] Loaded CSS.");
})();