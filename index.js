// ==UserScript==
// @name         AutoMudae
// @namespace    nxve
// @version      0.2
// @description  Automates the use of Mudae bot in Discord
// @author       Nxve
// @updateURL    https://raw.githubusercontent.com/Nxve/AutoMudae/main/index.js?token=GHSAT0AAAAAABXS5FZFFJDYFMIBJKU3GSLGYXWWEKA
// @downloadURL  https://raw.githubusercontent.com/Nxve/AutoMudae/main/index.js?token=GHSAT0AAAAAABXS5FZFFJDYFMIBJKU3GSLGYXWWEKA
// @supportURL   https://github.com/Nxve/AutoMudae/issues
// @match        https://discord.com/channels/*
// @exclude      https://discord.com/channels/@me
// @run-at       document-start
// @icon         https://icons.duckduckgo.com/ip2/discord.com.ico
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://raw.githubusercontent.com/Nxve/AutoMudae/main/enum.js?token=GHSAT0AAAAAABXS5FZFFJDYFMIBJKU3GSLGYXWWEKA
// ==/UserScript==

(function () {
    /// Require
    const window = unsafeWindow;
    const E = window.AUTOMUDAE_ENUM;
    const localStorage = window.localStorage;

    /// SOUND
    const audioCtx = new AudioContext();

    function beep(gain, hz, ms, times = 1){
        for (let i = 0; i < times; i++) {
            const v = audioCtx.createOscillator();
            const u = audioCtx.createGain();
            v.connect(u);
            v.frequency.value = hz;
            v.type = "square";
            u.connect(audioCtx.destination);
            u.gain.value = gain * 0.01;
            const durationInSeconds = ms * .001;
            v.start(audioCtx.currentTime + i * (durationInSeconds*1.5));
            v.stop(audioCtx.currentTime + durationInSeconds + i * (durationInSeconds*1.5));
        }
    };

    const SOUND = {
        marry: () => {beep(10, 400, 100, 1)},
        cantMarry: () => {beep(15, 70, 80, 6)}
    };

    /// DOM
    const DOM = {
        el_ChannelList: null,
        el_MemberList: null,
        el_Chat: null,
        el_MainButton: null,
        el_MainText: null,
        el_FieldKakera: null,
        el_FieldCharactersList: null,
        el_FieldRollsLeft: null,
        el_FieldRollsMax: null,
        el_FieldPower: null,
        el_FieldMarry: null,
        el_FieldRT: null,
        el_FieldConsumption: null
    };

    /// Forbidden Act, don't do this at home
    Array.prototype.pickRandom = function () { return this[this.length * Math.random() | 0] };
    Array.prototype.last = function () { return this[this.length - 1] };

    /// Logger
    const _logger = {
        _preffix: '%c[AUTO MUDAE]',
        _symbols: { error: '[!]', info: '[i]', log: '[*]', new: '[+]', debug: '[!]', warn: '[!]' },
        _color: { error: 'red', info: 'cyan', log: 'white', new: 'lime', debug: 'cyan', warn: 'gold' },
        _history: [],
        _lastMessageHash: null,
        _hash: s => s.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0),
        _print: function (type, ...etc) {
            const hash = [...arguments].toString();
            // if (hash === this._lastMessageHash) return;

            console.log(`${this._preffix}%c${this._symbols[type]}`, 'background: black; color: magenta;', `background: black; color: ${this._color[type]}`, ...etc);

            if (type !== 'debug') this._history.push([type, [...etc]]);
            this._lastMessageHash = hash;
        },
        reprompt: function () {
            this._history.forEach(log => this[log[0]](...log[1]));
        }
    };

    const logger = {};

    ['error', 'info', 'log', 'new', 'debug', 'warn'].forEach(method => {
        logger[method] = function () { this._print(method, ...arguments) };
    });

    /// Inject CSS
    const cssDecorators = `
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

    const cssMainButton = `
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

    const cssSidePanels = `
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

    #automudae-panel-info > .automudae-category-panel > div > div {
        width: 100%;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }

    .automudae-panel-info > div > div {
        gap: 8px;
    }

    [id^=automudae-panel].collapsed {
        height: 0;
    }

    [id^=automudae-panel].collapsed h1 {
        position: absolute;
        width: 100%;
    }

    #automudae-panel-info > .automudae-category-panel > div > div > div {
        display: flex;
        align-items: center;
    }

    #automudae-panel-info > .automudae-category-panel > div {
        gap: 8px;
    }
    `;

    GM_addStyle(cssDecorators + cssMainButton + cssSidePanels);

    GM_addStyle(':root{--hm:0;}' || `
    #automudae-toggle-button{
        position: absolute;
        left: 0;
        right: 0;
        top: 14px;
        margin-inline: auto;
        width: fit-content;
        padding: 5px 10px 5px 10px;
        display: inline-flex;
        gap: 10px;
        align-items: center;
        font-weight: 500;
        border-bottom: 1px solid black;
        background-color: #d7d7d7;
        box-shadow: 1px 1px 5px rgb(0 0 0 / 50%);
        transition: 200ms;
        z-index: 9999;
    }

    #automudae-toggle-button::after{
        content: '';
        position: absolute;
        bottom: -3px;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: white;
    }

    #automudae-toggle-button.${E.AUTOMUDAE_STATE.ERROR}::after {
        background-color: red;
    }

    #automudae-toggle-button.${E.AUTOMUDAE_STATE.RUN}::after {
        background-color: lime;
    }

    #automudae-toggle-button:is(.${E.AUTOMUDAE_STATE.IDLE}, .${E.AUTOMUDAE_STATE.RUN}):hover{
        transform: scale(1.05);
        cursor: pointer;
    }

    [id^=automudae-panel] {
        position: absolute;
        width: 285px;
        padding: 5px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        font-weight: 500;
        background-color: #737672;
        z-index: 9999;
    }

    #automudae-panel-config {
        right: 0;
    }

    [id^=automudae-panel] :is(h1, h2) {
        --border-color: #00ff2b;
        background-color: #000000;
        height: 40px;
        display: grid;
        justify-items: center;
        align-items: center;
        font-size: x-large;
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
        border-bottom: 1px solid var(--border-color);
        color: white;
    }

    #automudae-panel-info h2 {
        --border-color: #ff8d00;
        height: 30px;
        font-size: large;
    }

    .automudae-inner-panel {
        background-color: #cccdcc;
        border-radius: 4px;
        padding: 5px;
    }

    #resume > div, #mudae-status > div > div {
        padding: 3px;
        padding-inline: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    #resume ul {
        background-color: white;
        height: fit-content;
        max-height: 3rem;
        overflow-y: auto;
        overflow-x: clip;
    }

    #resume li:nth-child(even) {
        background-color: rgb(0 0 0 / 20%);
    }

    #resume > #collected-kakera > div {
        display: flex;
        align-items: center;
    }

    #resume > #collected-characters {
        flex-direction: column;
        align-items: normal;
        gap: 5px;
    }

    #mudae-status-inner-panel {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    #mudae-status-inner-panel > div:nth-child(odd) {
        background-color: rgb(0 0 0 / 25%);
    }

    #mudae-status-inner-panel > div:nth-child(even) {
        background-color: rgb(255 255 255 / 40%);
    }
    `);

    /// CONSTS
    const DEBUG = false;
    const INTERVAL_SEND_MESSAGE = 1500;
    const INTERVAL_ROLL = 2000;
    const LOOKUP_MESSAGE_COUNT = 100;
    const INTERVAL_THINK = 200;
    const MUDAE_USER_ID = '432610292342587392';

    /// USER CONFIG
    const REPLACE_NATIVE_CONSOLE_WITH_AUTOMUDAE_LOGGER = true;
    const INTERESTED_MENTIONS = ['9', 'Dezoit', 'Vintset', 'Trinteiseis'];
    const INTERESTED_KAKERA = [E.KAKERA.RAINBOW, E.KAKERA.RED, E.KAKERA.ORANGE, E.KAKERA.LIGHT, E.KAKERA.YELLOW, E.KAKERA.PURPLE];

    Object.setPrototypeOf(logger, _logger);

    /// Discord Data & Utils
    const Discord = {
        info: new Map(),

        lastMessageTime: 0,

        getLastMessages: (count = LOOKUP_MESSAGE_COUNT) => [...document.querySelectorAll("li[id^='chat-messages']")].slice(-(count > LOOKUP_MESSAGE_COUNT ? LOOKUP_MESSAGE_COUNT : (count < 1 ? 1 : count))),

        Message: {
            _cdSend: 0,
            _nonce: Math.floor(Math.random() * 1000000),

            getDate: (el_Message) => {
                const messageDate = new Date(this.el_Message.querySelector("time[id^='message-timestamp']")?.dateTime);

                if (messageDate.toString() === "Invalid Date") {
                    logger.error("Couldn't retrieve timestamp for this Discord message:", el_Message);
                    return;
                }

                return messageDate;
            },

            getAuthorId: (el_Message) => {
                let el_TargetMessage = el_Message;
                let el_Avatar;

                while (!el_Avatar) {
                    el_Avatar = el_TargetMessage.querySelector(`img[class^='avatar']`);
                    if (el_Avatar) break;

                    el_TargetMessage = el_TargetMessage.previousElementSibling;

                    while (el_TargetMessage !== undefined && el_TargetMessage.tagName !== "LI") {
                        el_TargetMessage = el_TargetMessage.previousElementSibling;
                    }

                    if (!el_Avatar && !el_TargetMessage) return logger.error("Couldn't get authorId for this Discord message:", el_Message);
                }

                const match = /avatars\/(\d+)\//.exec(el_Avatar.src);

                if (match) return match[1];
            },

            getId: (el_Message) => el_Message.id.split('-').last(),

            isFromMudae: function (el_Message) { return this.getAuthorId(el_Message) === MUDAE_USER_ID },
            isFromMe: function (el_Message) { return this.getAuthorId(el_Message) === Discord.info.get(E.DISCORD_INFO.USER_ID) },

            send: function (content) {
                const now = performance.now();

                if (now - this._cdSend < INTERVAL_SEND_MESSAGE) return;

                fetch(`https://discord.com/api/v9/channels/${Discord.info.get(E.DISCORD_INFO.CHANNEL_ID)}/messages`, {
                    "method": "POST",
                    "headers": {
                        "authorization": Discord.info.get(E.DISCORD_INFO.TOKEN),
                        "content-type": "application/json"
                    },
                    "body": `{"content":"${content || '?'}","nonce":"${++this._nonce}","tts":false}`
                });

                this._cdSend = now;
            },

            react: function (el_Message, E_emoji) {
                fetch(`https://discord.com/api/v9/channels/${Discord.info.get(E.DISCORD_INFO.CHANNEL_ID)}/messages/${this.getId(el_Message)}/reactions/${E_emoji}/%40me`, {
                    "method": "PUT",
                    "headers": {
                        "authorization": Discord.info.get(E.DISCORD_INFO.TOKEN),
                    }
                });
            }
        }

    };

    window.Discord = Discord;
    /// AutoMudae
    const AutoMudae = {
        info: new Map(),
        state: E.AUTOMUDAE_STATE.INJECT,
        chatObserver: new MutationObserver(ms => ms.forEach(m => { if (m.addedNodes.length) { handleNewChatAppend(m.addedNodes) } })),
        cdGatherInfo: 0,
        cdRoll: 0,

        isRunning: function () { return this.state === E.AUTOMUDAE_STATE.RUN },
        isLastReset: function () { const now = new Date(), h = now.getHours(), m = now.getMinutes(); return (h % 3 == 2 && m >= 36) || (h % 3 == 0 && m < 36) },

        hasBasicInfo: function () { return [E.MUDAE_INFO.ROLLS_MAX, E.MUDAE_INFO.ROLLS_LEFT, E.MUDAE_INFO.POWER, E.MUDAE_INFO.CAN_RT, E.MUDAE_INFO.CAN_MARRY, E.MUDAE_INFO.CONSUMPTION].every(info => AutoMudae.info.has(info)) },

        mudaeTimeToMs: function (timeString) {
            if (!timeString.includes('h')) return Number(timeString) * 60 * 1000;

            const match = /(\d+h)?\s?(\d+)?/.exec(timeString);

            if (!match) return;

            const h = match[1];
            const m = match[2];
            let totalMs = 0;

            if (h) totalMs += Number(h.replace(/\D/g, '')) * 60 * 60 * 1000;
            if (m) totalMs += Number(m) * 60 * 1000;

            return totalMs;
        },

        Timers: {
            _t: new Map(),
            set: function (identifier, callback, ms, isInterval = false) {
                if (this._t.has(identifier)) clearTimeout(identifier);
                const timer = isInterval ? setInterval(callback, ms) : setTimeout(callback, ms);
                this._t.set(identifier, timer);
                if (DEBUG) logger.debug(`Added timer [${identifier}][${ms}]`);
            },
            clear: function () { [...this._t.values()].forEach(t => { clearTimeout(t); clearInterval(t) }); this._t.clear(); }
        }
    };
    window.AutoMudae = AutoMudae;

    AutoMudae.toggle = function () {
        if (AutoMudae.state === E.AUTOMUDAE_STATE.IDLE) {
            let msToStartResetHandler = 1;
            const now = new Date();

            if (now.getMinutes() !== 37) {
                const nextReset = new Date(now);
                nextReset.setHours(now.getMinutes() > 37 ? now.getHours() + 1 : now.getHours(), 37);
                msToStartResetHandler = nextReset - now;
            }

            AutoMudae.Timers.set('think', think, INTERVAL_THINK, true);
            AutoMudae.Timers.set('initHourlyResetHandler', () => { handleHourlyReset(); AutoMudae.Timers.set('HandleHourlyReset', handleHourlyReset, 1 * 60 * 60 * 1000, true) }, msToStartResetHandler);
            AutoMudae.chatObserver.observe(DOM.el_Chat, { childList: true });
            AutoMudae.setState(E.AUTOMUDAE_STATE.RUN);
            logger.log("Running..");
            return;
        }

        AutoMudae.chatObserver.disconnect();
        AutoMudae.Timers.clear();
        AutoMudae.info.clear();
        AutoMudae.setState(E.AUTOMUDAE_STATE.IDLE);
        logger.log("Turned off.");
    };

    AutoMudae.setState = function (E_state) {
        if (DOM.el_MainButton.classList.contains(AutoMudae.state)){
            DOM.el_MainButton.classList.replace(AutoMudae.state, E_state);
        } else {
            DOM.el_MainButton.classList.add(E_state);
        }

        AutoMudae.state = E_state;

        const stateTexts = {};
        stateTexts[E.AUTOMUDAE_STATE.SETUP] = "Setting up...";
        stateTexts[E.AUTOMUDAE_STATE.ERROR] = "Error!";
        stateTexts[E.AUTOMUDAE_STATE.IDLE] = "Run Auto-Mudae";
        stateTexts[E.AUTOMUDAE_STATE.RUN] = "Running...";

        DOM.el_MainText.innerText = stateTexts[E_state];
    };

    AutoMudae.setup = function () {
        DOM.el_ChannelList = document.querySelector("#channels > ul");
        DOM.el_MemberList = document.querySelector("div[class^='members'] > div");
        DOM.el_Chat = document.querySelector("ol[class^='scrollerInner']");

        const username = document.querySelector("[class^='nameTag'] [class*='title']")?.innerText;

        if (!DOM.el_Chat || !DOM.el_MemberList || !DOM.el_ChannelList || !username) {
            return "Make sure you're viewing the desired channel and the page is fully loaded.";
        }

        if (!localStorage || !localStorage.token || !localStorage.SelectedChannelStore || !localStorage.user_id_cache) {
            return "Couldn't retrieve information from Discord.";
        }

        let guildId, channelId;

        try {
            const SelectedChannelStore = JSON.parse(localStorage.SelectedChannelStore);
            channelId = SelectedChannelStore.selectedChannelId;

            for (const guild in SelectedChannelStore.selectedChannelIds) {
                if (SelectedChannelStore.selectedChannelIds[guild] === channelId) guildId = guild;
            }
        } catch (_err) {
            return "Couldn't retrieve active guild.";
        }

        if (!guildId || !channelId) {
            return "Couldn't retrieve active guild or channel.";
        }

        Discord.info.set(E.DISCORD_INFO.TOKEN, localStorage.token.replace(/\"/g, ''));
        Discord.info.set(E.DISCORD_INFO.CHANNEL_ID, channelId);
        Discord.info.set(E.DISCORD_INFO.GUILD_ID, guildId);
        Discord.info.set(E.DISCORD_INFO.USER_ID, localStorage.user_id_cache.replace(/\D/g, ''));
        Discord.info.set(E.DISCORD_INFO.USER_USERNAME, username);
    };

    AutoMudae.inject = function(){
        logger.info("Injecting...");
        const err = AutoMudae.setup();

        if (err){
            //# Error in DOM
            logger.error(err);
            return;
        }

        DOM.el_MainButton.onclick = null;

        AutoMudae.render();
        AutoMudae.tryEnable();
    };

    AutoMudae.tryEnable = function () {
        if (AutoMudae.state !== E.AUTOMUDAE_STATE.SETUP) return;
        if (![...Object.values(E.DISCORD_INFO)].every(info => Discord.info.has(info))) return;

        AutoMudae.setState(E.AUTOMUDAE_STATE.IDLE);
        DOM.el_MainButton.onclick = (_e) => AutoMudae.toggle();
        logger.new("Ready to go!");

        if (REPLACE_NATIVE_CONSOLE_WITH_AUTOMUDAE_LOGGER) {
            ['debug', 'log', 'info', 'warn', 'error'].forEach(method => { window.console[method] = () => { } });
            console.clear();
            window.logger = logger; // Exposing logger so it becomes accessible in devTools

            logger.debug("Turned off native console. Use logger instead. I recommend disabling network log, since Discord usualy prompt a lot of these.");
            logger.reprompt();
        }
    };

    AutoMudae.renderMainButton = function () {
        const el_MainButton = document.createElement('div');
        el_MainButton.id = 'automudae-main-button';

        el_MainButton.classList.add(E.AUTOMUDAE_STATE.INJECT);

        const el_MainText = document.createElement('span');
        el_MainText.appendChild(document.createTextNode('Inject Auto-Mudae'));

        el_MainButton.appendChild(el_MainText);

        el_MainButton.onclick = (_e) => AutoMudae.inject();

        DOM.el_MainButton = el_MainButton;
        DOM.el_MainText = el_MainText;

        document.body.appendChild(el_MainButton);
    }

    AutoMudae.render = function () {
        logger.info("Rendering...");
        const el_AutoMudaeInfoPanel = document.createElement("div");
        el_AutoMudaeInfoPanel.id = "automudae-panel-info";

        el_AutoMudaeInfoPanel.innerHTML = `
        <h1>Auto-Mudae Info</h1>
        <div class="automudae-category-panel">
            <h2>Collected</h2>
            <div id="automudae-info-category-resume">
                <div>
                    <span>Kakera:</span>
                    <div><img class="emoji" src="https://cdn.discordapp.com/emojis/469835869059153940.webp?quality=lossless"><span id="automudae-field-kakera">0</span></div>
                </div>
                <div>
                    <span>Characters:</span>
                    <ul id="collected-characters"></ul>
                </div>
            </div>
        </div>
        <div class="automudae-category-panel">
            <h2>Status</h2>
            <div>
                <div>
                    <span>Rolls:</span>
                    <div><span>(</span><span id="automudae-field-rolls-left">?</span><span>/</span><span id="automudae-field-rolls-max">?</span><span>)</span></div>
                </div>
                <div>
                    <span>Power:</span>
                    <div><span id="automudae-field-power">?</span><span>%</span></div>
                </div>
                <div>
                    <span>Kakera Power Consumption:</span>
                    <div><span id="automudae-field-consumption">?</span><span>%</span></div>
                </div>
                <div>
                    <span>Can Marry?</span>
                    <span id="automudae-field-marry">?</span>
                </div>
                <div>
                    <span>Can RT?</span>
                    <span id="automudae-field-rt">?</span>
                </div>
            </div>
        </div>`;

        const el_AutoMudaeConfigPanel = document.createElement("div");
        el_AutoMudaeConfigPanel.id = "automudae-panel-config";
        el_AutoMudaeConfigPanel.innerHTML = `
        <h1>Auto-Mudae Config</h1>
        <div class="automudae-category-panel" id="automudae-config-category-kakera">
            <h2>Kakera to Collect</h2>
            <div>
                <div><input type="checkbox" id="opt_kakera_p"><label for="opt_kakera_p"><img class="emoji" src="https://cdn.discordapp.com/emojis/609264156347990016.webp?quality=lossless"></label></div>
                <div><input type="checkbox" id="opt_kakera_default"><label for="opt_kakera_default"><img class="emoji" src="https://cdn.discordapp.com/emojis/469835869059153940.webp?quality=lossless"></label></div>
                <div><input type="checkbox" id="opt_kakera_t"><label for="opt_kakera_t"><img class="emoji" src="https://cdn.discordapp.com/emojis/609264180851376132.webp?quality=lossless"></label></div>
                <div><input type="checkbox" id="opt_kakera_g"><label for="opt_kakera_g"><img class="emoji" src="https://cdn.discordapp.com/emojis/609264166381027329.webp?quality=lossless"></label></div>
                <div><input type="checkbox" id="opt_kakera_y"><label for="opt_kakera_y"><img class="emoji" src="https://cdn.discordapp.com/emojis/605112931168026629.webp?quality=lossless"></label></div>
                <div><input type="checkbox" id="opt_kakera_o"><label for="opt_kakera_o"><img class="emoji" src="https://cdn.discordapp.com/emojis/605112954391887888.webp?quality=lossless"></label></div>
                <div><input type="checkbox" id="opt_kakera_r"><label for="opt_kakera_r"><img class="emoji" src="https://cdn.discordapp.com/emojis/605112980295647242.webp?quality=lossless"></label></div>
                <div><input type="checkbox" id="opt_kakera_w"><label for="opt_kakera_w"><img class="emoji" src="https://cdn.discordapp.com/emojis/608192076286263297.webp?quality=lossless"></label></div>
                <div><input type="checkbox" id="opt_kakera_l"><label for="opt_kakera_l"><img class="emoji" src="https://cdn.discordapp.com/emojis/815961697918779422.webp?quality=lossless"></label></div>
            </div>
        </div>
        <div class="automudae-category-panel">
            <h2>Interesting Mentions</h2>
            <div>
                <textarea spellcheck="false"></textarea>
            </div>
        </div>
        <div class="automudae-category-panel">
            <h2>Roll Type</h2>
            <div>
                <div>
                    <select><option>hx</option><option>ha</option><option>hg</option><option>wx</option><option>wa</option><option>wg</option></select></div><div>
                    <input type="checkbox" id="opt_roll_slash"><label for="opt_roll_slash"><span>Use slash command</span></label>
                </div>
            </div>
        </div>
        <div class="automudae-category-panel">
            <h2>Sound</h2>
            <div>
                <div>
                    <input type="checkbox" id="opt_sound_marry"><label for="opt_sound_marry"><span>When marry</span></label>
                </div>
                <div>
                    <input type="checkbox" id="opt_sound_cantmarry"><label for="opt_sound_cantmarry"><span>When can't marry</span></label>
                </div>
            </div>
        </div>
        <div class="automudae-category-panel">
            <h2>Extra</h2>
            <div>
                <div>
                    <input type="checkbox" id="opt_extra_logger"><label for="opt_extra_logger"><span>Replace Console with Logger</span></label>
                </div>
            </div>
        </div>
        `;

        //# config dom
            //# Make collapsable

        DOM.el_ChannelList.prepend(el_AutoMudaeInfoPanel);
        DOM.el_MemberList.prepend(el_AutoMudaeConfigPanel);

        DOM.el_FieldKakera = document.getElementById("automudae-field-kakera");
        DOM.el_FieldCharactersList = document.getElementById("collected-characters");
        DOM.el_FieldRollsLeft = document.getElementById("automudae-field-rolls-left");
        DOM.el_FieldRollsMax = document.getElementById("automudae-field-rolls-max");
        DOM.el_FieldPower = document.getElementById("automudae-field-power");
        DOM.el_FieldMarry = document.getElementById("automudae-field-marry");
        DOM.el_FieldRT = document.getElementById("automudae-field-rt");
        DOM.el_FieldConsumption = document.getElementById("automudae-field-consumption");

        AutoMudae.setState(E.AUTOMUDAE_STATE.SETUP);
    };

    AutoMudae.roll = function () {
        //# Adapt to user config, right now is sending only /wa

        fetch("https://discord.com/api/v9/interactions", {
            "method": "POST",
            "headers": {
                "authorization": Discord.info.get(E.DISCORD_INFO.TOKEN),
                "content-type": "multipart/form-data; boundary=----WebKitFormBoundaryVAJ0Szw02nobXJyN",
            },
            "body": `------WebKitFormBoundaryVAJ0Szw02nobXJyN\r\nContent-Disposition: form-data; name="payload_json"\r\n\r\n{"type":2,"application_id":"${MUDAE_USER_ID}","guild_id":"${Discord.info.get(E.DISCORD_INFO.GUILD_ID)}","channel_id":"${Discord.info.get(E.DISCORD_INFO.CHANNEL_ID)}","session_id":"${Discord.info.get(E.DISCORD_INFO.SESSION_ID)}","data":{"version":"832172151729422418","id":"832172151729422417","name":"wa","type":1,"options":[],"application_command":{"id":"832172151729422417","application_id":"${MUDAE_USER_ID}","version":"832172151729422418","default_permission":true,"default_member_permissions":null,"type":1,"name":"wa","description":"Roll a random animanga waifu.","dm_permission":true},"attachments":[]},"nonce":"${++Discord.Message._nonce}"}\r\n------WebKitFormBoundaryVAJ0Szw02nobXJyN--\r\n`
        });
    };

    /// Bot Inner Thinking
    function handleRTUResponse(mudaeResponse) {
        if (!/\$rt/.test(mudaeResponse)) return false;

        const cooldownRTMatch = /: (.+) min. \(\$rtu\)/.exec(mudaeResponse);

        AutoMudae.info.set(E.MUDAE_INFO.CAN_RT, !cooldownRTMatch);

        if (cooldownRTMatch) {
            logger.log(`Scheduled a RT check. [${cooldownRTMatch[1]}]`);

            AutoMudae.Timers.set('send_tu', () => { Discord.Message.send("$tu") }, AutoMudae.mudaeTimeToMs(cooldownRTMatch[1]) + 500)
        }

        return true;
    };

    function handleHourlyReset() {
        if (!AutoMudae.hasBasicInfo()) return;

        logger.log("Hourly reset. Sending $tu..");

        Discord.Message.send("$tu");
    };

    function handleNewChatAppend(el_Children) {
        document.querySelector("div[class^='scrollerSpacer']")?.scrollIntoView();

        el_Children.forEach(el_Child => {
            if (el_Child.tagName !== "LI") return;
            Discord.lastMessageTime = performance.now();

            const el_Message = el_Child;

            if (!Discord.Message.isFromMudae(el_Message)) return;

            const el_PreviousElement = el_Message.previousElementSibling
                ? (el_Message.previousElementSibling.id === "---new-messages-bar" ? el_Message.previousElementSibling.previousElementSibling : el_Message.previousElementSibling)
                : null;

            /// Handle player commands
            if (el_PreviousElement) {
                const el_PreviousMessage = el_PreviousElement;

                if (Discord.Message.isFromMe(el_PreviousMessage)) {
                    const command = el_PreviousMessage.querySelector("div[id^='message-content']")?.innerText;
                    const mudaeResponse = el_Message.querySelector("div[id^='message-content']")?.innerText;

                    if (command && mudaeResponse){
                        if (command === "$tu") {
                            const matchRolls = /tem (\d+) rolls/.exec(mudaeResponse);
                            if (matchRolls) {
                                const rolls = Number(matchRolls[1]);


                                const hasRollsMax = AutoMudae.info.has(E.MUDAE_INFO.ROLLS_MAX);

                                if (!hasRollsMax || !AutoMudae.info.has(E.MUDAE_INFO.ROLLS_LEFT)) logger.info(`Got max rolls. You have ${rolls}.`);

                                if (!hasRollsMax || hasRollsMax && AutoMudae.info.get(E.MUDAE_INFO.ROLLS_MAX) < rolls){
                                    AutoMudae.info.set(E.MUDAE_INFO.ROLLS_MAX, rolls);
                                    DOM.el_FieldRollsMax.innerText = rolls;
                                }

                                AutoMudae.info.set(E.MUDAE_INFO.ROLLS_LEFT, rolls);
                                DOM.el_FieldRollsLeft.innerText = rolls;
                            }

                            const matchPower = /Power: (\d+)%/.exec(mudaeResponse);
                            if (matchPower) {
                                const power = Number(matchPower[1]);

                                if (!AutoMudae.info.has(E.MUDAE_INFO.POWER)) logger.info(`Got power. You have ${power}%.`);

                                AutoMudae.info.set(E.MUDAE_INFO.POWER, power);
                                DOM.el_FieldPower.innerText = power;
                            }

                            if (/\$rt/.test(mudaeResponse)) {
                                const hadRT = AutoMudae.info.has(E.MUDAE_INFO.CAN_RT);

                                handleRTUResponse(mudaeResponse);

                                const canRT = AutoMudae.info.get(E.MUDAE_INFO.CAN_RT);

                                if (!hadRT) {
                                    logger.info(`Got RT availability. RT is ${AutoMudae.info.get(E.MUDAE_INFO.CAN_RT) ? '' : 'un'}available.`);
                                } else if (canRT) {
                                    logger.info("You can RT again.");
                                }

                                DOM.el_FieldRT.innerText = canRT ? 'Yes' : "No";
                            }

                            if (/casar/.test(mudaeResponse)) {
                                const cantMarry = /se casar novamente (.+) min/.exec(mudaeResponse);

                                const hadMarry = AutoMudae.info.has(E.MUDAE_INFO.CAN_MARRY);

                                AutoMudae.info.set(E.MUDAE_INFO.CAN_MARRY, !cantMarry);

                                if (!hadMarry) {
                                    logger.info('Got marry availability.' + (cantMarry ? `You can't marry for ${cantMarry[1]}.` : ' You can marry right now.'));
                                } else if (!cantMarry) {
                                    logger.info("You can marry again.");
                                }

                                DOM.el_FieldMarry.innerText = cantMarry ? 'No' : "Yes";
                            }

                            const matchKakeraConsumption = /kakera consume (\d+)%/.exec(mudaeResponse);
                            if (matchKakeraConsumption) {
                                const consumption = Number(matchKakeraConsumption[1]);

                                if (!AutoMudae.info.has(E.MUDAE_INFO.CONSUMPTION)) logger.info(`Got kakera consumption. You consume ${consumption}% per kakera reaction.`);

                                AutoMudae.info.set(E.MUDAE_INFO.CONSUMPTION, consumption);
                                DOM.el_FieldConsumption.innerText = consumption;
                            }

                            if (!AutoMudae.hasBasicInfo()) {
                                AutoMudae.toggle();
                                logger.error("Couldn't retrieve needed info from Mudae. Make sure your $tu configuration exposes your rolls count, power, RT availability and Marry availability, then try again.\nRecommended config: $ta claim rolls kakerapower rt");
                                return;
                            }

                            logger.info("All done! Thinking process running now..")
                            return;
                        };
                    }
                }
            }

            if (!AutoMudae.hasBasicInfo()) return;

            const el_Strong = el_Message.querySelector("div[id^='message-content'] span[class^='emojiContainer'] ~ strong");

            /// Handle kakera collect feedback
            if (el_Strong) {
                const match = /^(.+)\s\+(\d+)$/.exec(el_Strong.innerText);

                if (match) {
                    const [_, username, kakeraQuantity] = match;

                    if (username === Discord.info.get(E.DISCORD_INFO.USER_USERNAME)) {
                        const kakeraType = el_Strong.previousElementSibling?.firstElementChild?.alt.replace(':', '');

                        //# Detect if it has 10+keys, so the cost is halved
                        const powerCost = kakeraType === E.KAKERA.PURPLE ? 0 : AutoMudae.info.get(E.MUDAE_INFO.CONSUMPTION);

                        if (powerCost > 0){
                            const newPower = AutoMudae.info.get(E.MUDAE_INFO.POWER) - powerCost;

                            AutoMudae.info.set(E.MUDAE_INFO.POWER, newPower);
                            DOM.el_FieldPower.innerText = newPower;
                        }

                        el_Message.classList.add('plus');
                        DOM.el_FieldKakera.innerText = Number(DOM.el_FieldKakera.innerText) + Number(kakeraQuantity);
                        logger.new(`+${kakeraQuantity} kakera! [Remaining Power: ${AutoMudae.info.get(E.MUDAE_INFO.POWER)}%]`);
                        return;
                    }
                }
            }

            /// Handle character marry feedback
            const messageContent = el_Message.querySelector("div[id^='message-content']")?.innerText;

            if (messageContent) {
                const match = /(.+) e (.+) agora são casados!/.exec(messageContent.trim());

                if (match) {
                    const [_, username, characterName] = match;

                    if (username === Discord.info.get(E.DISCORD_INFO.USER_USERNAME)) {
                        AutoMudae.info.set(E.MUDAE_INFO.CAN_MARRY, false);
                        DOM.el_FieldMarry.innerText = "No";
                        el_Message.classList.add('plus');

                        const el_CharacterListItem = document.createElement('li');
                        el_CharacterListItem.appendChild(document.createTextNode(characterName));
                        DOM.el_FieldCharactersList.appendChild(el_CharacterListItem);

                        SOUND.marry(); //# Config
                        logger.new(`Got character ${characterName}!`);
                        return;
                    }
                }
            }

            const el_ImageWrapper = el_Message.querySelector("div[class^='embedDescription'] ~ div[class^='imageContent'] div[class^='imageWrapper']");

            /// Handle character messages
            if (el_ImageWrapper) {
                const el_Footer = el_Message.querySelector("span[class^='embedFooterText']");

                const isCharacterLookupMessage = (el_Footer && (/^\d+ \/ \d+$/.test(el_Footer.innerText) || /^Pertence a .+ ~~ \d+ \/ \d+$/.test(el_Footer.innerText)));

                if (isCharacterLookupMessage) return;

                const el_ReplyAvatar = el_Message.querySelector("img[class^='executedCommandAvatar']");

                if (el_ReplyAvatar){
                    const matchReplyUserId = /avatars\/(\d+)\//.exec(el_ReplyAvatar.src);
                    if (!matchReplyUserId) return logger.error("Couldn't get reply user ID for", el_Message);

                    if (Discord.info.get(E.DISCORD_INFO.USER_ID) === matchReplyUserId[1]){
                        const newRollsLeft = AutoMudae.info.get(E.MUDAE_INFO.ROLLS_LEFT) - 1;
                        AutoMudae.info.set(E.MUDAE_INFO.ROLLS_LEFT, newRollsLeft);
                        DOM.el_FieldRollsLeft.innerText = newRollsLeft;
                    }
                }

                if (!el_Footer || el_Footer.innerText.includes("2 ROLLS RESTANTES") && !el_Footer.innerText.includes("Pertence")) {
                    let el_InterestingCharacter;

                    const el_Mentions = [...el_Message.querySelectorAll("span.mention")];

                    for (let i = 0; i < el_Mentions.length; i++) {
                        const mentionedUser = el_Mentions[i].innerText.substr(1);

                        if (INTERESTED_MENTIONS.includes(mentionedUser)) {
                            el_InterestingCharacter = el_Message;
                            break;
                        }
                    }

                    if (!el_InterestingCharacter && AutoMudae.isLastReset() && Discord.info.get(E.DISCORD_INFO.CAN_MARRY)) {
                        const characterName = el_Message.querySelector("span[class^='embedAuthorName']")?.innerText;

                        //# Search in a database
                        if (characterName && characterName === "hmm") {
                            //# Marry and log
                            el_InterestingCharacter = el_Message;
                        };
                    }

                    if (el_InterestingCharacter) {
                        const characterName = el_Message.querySelector("span[class^='embedAuthorName']")?.innerText;

                        logger.info(`Found character [${characterName || '?'}]`);

                        if (AutoMudae.info.get(E.MUDAE_INFO.CAN_MARRY)) {
                            //# Should somehow detect when it's able to react
                            setTimeout(() => Discord.Message.react(el_Message, E.EMOJI.PEOPLE_HUGGING), 1000);
                            return;
                        }

                        SOUND.cantMarry(); //# Config
                        logger.warn(`Can't marry right now. You may lose character [${characterName}]`);
                    }

                    return;
                }

                /// Observe kakera reactions append
                if (el_Footer.innerText.includes("Pertence")) {
                    const el_MessageAccessories = el_Message.querySelector("div[id^='message-accessories']");

                    if (!el_MessageAccessories) return logger.error("Couldn't observe for reactions append in this character:", el_Message);

                    el_Message.kakeraCollectInterval = setInterval(() => {
                        if (!el_Message) return;

                        el_Message.retryCount ??= 1;
                        el_Message.retryCount++;

                        const el_KakeraReactionImg = el_Message.querySelector("div[class^='reactionInner'][aria-label^='kakera'][aria-label*='1 rea'] img");

                        if (el_KakeraReactionImg || el_Message.retryCount >= 20) {
                            clearInterval(el_Message.kakeraCollectInterval);
                            delete el_Message.kakeraCollectInterval;
                            delete el_Message.retryCount;
                        }

                        if (!el_KakeraReactionImg) return;

                        const kakeraCode = el_KakeraReactionImg.alt;

                        const hasEnoughPower = kakeraCode === E.KAKERA.PURPLE || AutoMudae.info.get(E.MUDAE_INFO.POWER) > AutoMudae.info.get(E.MUDAE_INFO.CONSUMPTION);

                        if (INTERESTED_KAKERA.includes(kakeraCode) && hasEnoughPower) {
                            Discord.Message.react(el_Message, E.EMOJI[kakeraCode]);
                        }
                    }, 100);
                }

                return;
            }
        });
    }

    function think() {
        const now = performance.now();

        if (!AutoMudae.hasBasicInfo()) {
            if (now - AutoMudae.cdGatherInfo < 1000) return;
            logger.log("Gathering needed info from Mudae..");

            Discord.Message.send("$tu");

            AutoMudae.cdGatherInfo = now;
            return;
        }

        if (AutoMudae.info.get(E.MUDAE_INFO.ROLLS_LEFT) > 0 && now - Discord.lastMessageTime > (INTERVAL_ROLL * 1.5) && now - AutoMudae.cdRoll > INTERVAL_ROLL) {
            AutoMudae.roll();
            AutoMudae.cdRoll = now;
        }

    };

    /// SessionId Hook
    window.console.info = function () {
        for (const arg of arguments) {
            const match = /\[READY\] (?:.+) as (.+)/.exec(arg) || /resuming session (.+),/.exec(arg);

            if (match) {
                window.console.info = console.info; // No need to track anymore
                Discord.info.set(E.DISCORD_INFO.SESSION_ID, match[1]);
                AutoMudae.tryEnable();
            }
        }
        console.info(...arguments);
    };

    /// Main
    window.addEventListener('load', main, false);

    function main() {
        AutoMudae.renderMainButton();
    };
})();


