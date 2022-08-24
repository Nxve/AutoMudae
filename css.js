(function () {
    const E = unsafeWindow.AUTOMUDAE?.E;

    if (!E) {
        console.error("[AUTO MUDAE][!] Couldn't load CSS. ENUM is missing.");
        return;
    }

    const CSS = {};

    CSS.decorators = `
    li[id^=chat-message]:is(.plus, .critical){
        position: relative;
    }

    li[id^=chat-message]:is(.plus, .critical)::after{
        position: absolute;
        bottom: 0;
        width: 22px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    li[id^=chat-message].plus{
        background-color: hsl(138deg 100% 50% / 10%);
    }

    li[id^=chat-message].plus::after {
        content: '+';
        background-color: hsl(109deg 45% 18%);
        color: lime;
    }

    li[id^=chat-message].critical{
        background-color: hsl(0deg 100% 50% / 10%);
    }

    li[id^=chat-message].critical::after {
        content: '!';
        background-color: hsl(0deg 45% 18%);
        color: red;
    }
    `;

    CSS.mainButtonAndError = `
    #automudae-main-button,
    #automudae-error {
        position: absolute;
        inset: auto 0;
        top: 8px;
        width: fit-content;
        margin-inline: auto;
        padding: 5px;
        z-index: 9999;
    }

    #automudae-main-button {
        background-color: var(--button-outline-brand-background-active);
        color: var(--text-normal);
        font-weight: 500;
        transition: 200ms;
    }

    #automudae-main-button:is(.${E.AUTOMUDAE_STATE.INJECT}, .${E.AUTOMUDAE_STATE.IDLE}, .${E.AUTOMUDAE_STATE.RUN}):hover {
        transform: scale(1.1);
        cursor: pointer;
        /* background-color: var(--button-outline-brand-background-hover); */
    }

    #automudae-error {
        background-color: var(--button-danger-background);
        color: white;
        animation: popIn 150ms forwards;
        transform: scale(0);
    }

    @keyframes popIn {
        to {
            top: 40px;
            transform: scale(1);
        }
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
        max-height: 10rem;
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
        align-items: center;
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
        pointer-events: none;
    }
    `;

    CSS.toasters = `
    #automudae-toasters-wrapper {
        position: absolute;
        right: 15px;
        width: 37%;
        height: 97%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: flex-end;
        gap: 8px;
        z-index: 9;
    }
    
    .automudae-toaster {
        background-color: white;
        padding: 5px;
        font-weight: 500;
        animation: slide-in-blurred-left 0.6s cubic-bezier(0.230, 1.000, 0.320, 1.000) both;
    }
    
    .automudae-toaster.info {
        --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='20' fill='%235865f2' viewBox='0 0 16 16'%3E%3Cpath d='M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm8.93 4.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM8 5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'/%3E%3C/svg%3E");
        background-color: var(--button-outline-brand-border);
    }
    
    .automudae-toaster.kakera {
        --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='20' fill='%23dee0fc' viewBox='0 0 16 16'%3E%3Cpath d='M3.1.7a.5.5 0 0 1 .4-.2h9a.5.5 0 0 1 .4.2l2.976 3.974c.149.185.156.45.01.644L8.4 15.3a.5.5 0 0 1-.8 0L.1 5.3a.5.5 0 0 1 0-.6l3-4zm11.386 3.785-1.806-2.41-.776 2.413 2.582-.003zm-3.633.004.961-2.989H4.186l.963 2.995 5.704-.006zM5.47 5.495 8 13.366l2.532-7.876-5.062.005zm-1.371-.999-.78-2.422-1.818 2.425 2.598-.003zM1.499 5.5l5.113 6.817-2.192-6.82L1.5 5.5zm7.889 6.817 5.123-6.83-2.928.002-2.195 6.828z'/%3E%3C/svg%3E");
        background-color: var(--brand-experiment-200);
    }
    
    .automudae-toaster.charclaim {
        --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='20' fill='%2346c46e' viewBox='0 0 16 16'%3E%3Cpath d='M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1z'/%3E%3C/svg%3E");
        background-color: var(--text-positive);
    }
    
    .automudae-toaster.soulmate {
        --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='20' fill='violet' viewBox='0 0 16 16'%3E%3Cpath d='M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828l.645-1.937zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.734 1.734 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.734 1.734 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.734 1.734 0 0 0 3.407 2.31l.387-1.162zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L10.863.1z'/%3E%3C/svg%3E");
        background-color: violet;
    }
    
    .automudae-toaster.warn{
        --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='20' fill='%23faa81a' class='bi bi-exclamation-diamond-fill' viewBox='0 0 16 16'%3E%3Cpath d='M9.05.435c-.58-.58-1.52-.58-2.1 0L.436 6.95c-.58.58-.58 1.519 0 2.098l6.516 6.516c.58.58 1.519.58 2.098 0l6.516-6.516c.58-.58.58-1.519 0-2.098L9.05.435zM8 4c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995A.905.905 0 0 1 8 4zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z'/%3E%3C/svg%3E");
        background-color: var(--text-warning);
    }
    
    .automudae-toaster.critical{
        --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='20' fill='%23ed4245' class='bi bi-exclamation-diamond-fill' viewBox='0 0 16 16'%3E%3Cpath d='M9.05.435c-.58-.58-1.52-.58-2.1 0L.436 6.95c-.58.58-.58 1.519 0 2.098l6.516 6.516c.58.58 1.519.58 2.098 0l6.516-6.516c.58-.58.58-1.519 0-2.098L9.05.435zM8 4c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995A.905.905 0 0 1 8 4zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z'/%3E%3C/svg%3E");
        background-color: var(--status-danger);
    }

    .automudae-toaster:hover::before {
        --width: 18px;
        --height: 100;
        content: var(--svg);
        position: absolute;
        left: calc(calc(-1 * var(--width)) - 5px);
        top: calc(.5% * calc(100 - var(--height)));
        height: calc(1% * var(--height));
        width: var(--width);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: flipHorz 1s cubic-bezier(0.455, 0.030, 0.515, 0.955) both;
        pointer-events: none;
    }
    
    .automudae-toaster:nth-last-child(12) {
        opacity: 0.6;
    }
    .automudae-toaster:nth-last-child(13) {
        opacity: 0.5;
    }
    .automudae-toaster:nth-last-child(14) {
        opacity: 0.4;
    }
    .automudae-toaster:nth-last-child(15) {
        opacity: 0.3;
    }
    .automudae-toaster:nth-last-child(16) {
        opacity: 0.2;
    }
    .automudae-toaster:nth-last-child(17) {
        opacity: 0.1;
    }

    @keyframes flipHorz {
        0% {
            transform: rotateY(0);
        }
        100% {
            transform: rotateY(-360deg);
        }
    }

    @keyframes slide-in-blurred-left {
        0% {
            transform: translateX(-1000px) scaleX(2.5) scaleY(0.2);
            transform-origin: 100% 50%;
            filter: blur(40px);
        }
        100% {
          transform: translateX(0) scaleY(1) scaleX(1);
          transform-origin: 50% 50%;
          filter: blur(0);
        }
    }
      
    `;

    unsafeWindow.AUTOMUDAE ??= {};
    unsafeWindow.AUTOMUDAE.CSS = Object.values(CSS).join(' ');
    console.info("[AUTO MUDAE][i] Loaded CSS.");
})();