// ==UserScript==
// @name         AutoMudae_Multi
// @namespace    nxve
// @version      0.7.7
// @description  Automates the use of Mudae bot in Discord
// @author       Nxve
// @updateURL    https://raw.githubusercontent.com/Nxve/AutoMudae/multiaccount/index.js
// @downloadURL  https://raw.githubusercontent.com/Nxve/AutoMudae/multiaccount/index.js
// @supportURL   https://github.com/Nxve/AutoMudae/issues
// @match        https://discord.com/channels/*
// @exclude      https://discord.com/channels/@me
// @run-at       document-start
// @icon         https://icons.duckduckgo.com/ip2/discord.com.ico
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_info
// @require      https://raw.githubusercontent.com/Nxve/AutoMudae/multiaccount/logger.js
// @require      https://raw.githubusercontent.com/Nxve/AutoMudae/multiaccount/enum.js
// @require      https://raw.githubusercontent.com/Nxve/AutoMudae/multiaccount/css.js
// @require      https://raw.githubusercontent.com/Nxve/AutoMudae/multiaccount/sound.js
// ==/UserScript==

(function () {
    /// Require
    const window = unsafeWindow;
    const logger = window.logger;
    const E = window.AUTOMUDAE?.E;
    const CSS = window.AUTOMUDAE?.CSS;
    const SOUND = window.AUTOMUDAE?.SOUND;
    const localStorage = window.localStorage;

    if (!logger || !E || !CSS || !SOUND || !localStorage) {
        console.error("[AUTO MUDAE][!] One or more requirement is missing. Reload the page.");
        return;
    }

    GM_addStyle(CSS);

    /// Utils
    const pickRandomFromArray = (arr) => arr[arr.length * Math.random() | 0];
    const getLastFromArray = (arr) => arr[arr.length - 1];

    /// DOM Elements
    const DOM = {
        el_ChannelList: null,
        el_MemberList: null,
        el_Chat: null,
        el_ChatWrapper: null,
        el_ToastsWrapper: null,
        el_MainButton: null,
        el_MainText: null,
        el_ErrorPopup: null
    };

    /// CONSTS
    const LOOKUP_MESSAGE_COUNT = 100;
    const INTERVAL_SEND_MESSAGE = 1500;
    const INTERVAL_ROLL = 2000;
    const INTERVAL_THINK = 200;
    const MUDAE_USER_ID = '432610292342587392';
    const SLASH_COMMANDS = {
        "wx": { version: "832172261968314389", id: "832172261968314388" },
        "wa": { version: "832172151729422418", id: "832172151729422417" },
        "wg": { version: "832172216665374751", id: "832172216665374750" },
        "hx": { version: "832172373536669707", id: "832172373536669706" },
        "ha": { version: "832172457028747337", id: "832172457028747336" },
        "hg": { version: "832172416192872459", id: "832172416192872458" },
    };

    /// Discord Data & Utils
    const Discord = {
        info: new Map(), /// Map<E.DISCORD_INFO, >()
        lastMessageTime: 0,
        cdSendMessage: 0,
        nonce: Math.floor(Math.random() * 1000000),

        getLastMessages: (count = LOOKUP_MESSAGE_COUNT) => [...document.querySelectorAll("li[id^='chat-messages']")].slice(-(count > LOOKUP_MESSAGE_COUNT ? LOOKUP_MESSAGE_COUNT : (count < 1 ? 1 : count))),

        Message: {
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

                    while (el_TargetMessage && el_TargetMessage.tagName !== "LI") {
                        el_TargetMessage = el_TargetMessage.previousElementSibling;
                    }

                    if (!el_Avatar && !el_TargetMessage) return logger.error("Couldn't get authorId for this Discord message:", el_Message);
                }

                const match = /avatars\/(\d+)\//.exec(el_Avatar.src);

                if (match) return match[1];
            },

            getId: (el_Message) => getLastFromArray(el_Message.id.split("-")),

            isFromMudae: function (el_Message) {
                return this.getAuthorId(el_Message) === MUDAE_USER_ID
            },

            isFromMe: function (el_Message) {
                return AutoMudae.users.find(user => user.id === this.getAuthorId(el_Message), this);
            }
        }

    };

    /// AutoMudae
    class MudaeUser {
        id
        username
        avatar
        token
        nick
        info
        sendTUTimer

        constructor(id, username, avatar, token) {
            this.id = id;
            this.username = username;
            this.avatar = avatar;
            this.token = token;
            this.info = new Map();

            const guildId = window.location.pathname.split("/")[2];

            fetch(`https://discord.com/api/v9/users/${id}/profile?guild_id=${guildId}`, {
                "headers": {
                    "authorization": token
                }
            })
                .then(response => response.json())
                .then(data => {
                    const { guild_member: { nick } } = data;
                    this.nick = nick;
                })
                .catch(err => logger.error(`Couldn't retrieve the nick for user [${username}]`, err));
        }

        hasNeededInfo() {
            return [E.MUDAE_INFO.ROLLS_MAX, E.MUDAE_INFO.ROLLS_LEFT, E.MUDAE_INFO.POWER, E.MUDAE_INFO.CAN_RT, E.MUDAE_INFO.CAN_MARRY, E.MUDAE_INFO.CONSUMPTION].every(info => this.info.has(info), this);
        }

        send(content) {
            const now = performance.now();

            if (now - Discord.cdSendMessage < INTERVAL_SEND_MESSAGE) return;

            fetch(`https://discord.com/api/v9/channels/${Discord.info.get(E.DISCORD_INFO.CHANNEL_ID)}/messages`, {
                "method": "POST",
                "headers": {
                    "authorization": this.token,
                    "content-type": "application/json"
                },
                "body": `{"content":"${content || '?'}","nonce":"${++Discord.nonce}","tts":false}`
            });

            Discord.cdSendMessage = now;
        }

        react(el_Message, E_EMOJI) {
            fetch(`https://discord.com/api/v9/channels/${Discord.info.get(E.DISCORD_INFO.CHANNEL_ID)}/messages/${Discord.Message.getId(el_Message)}/reactions/${E_EMOJI}/%40me`, {
                "method": "PUT",
                "headers": {
                    "authorization": this.token,
                }
            });
        }

        setTUTimer(ms) {
            if (this.sendTUTimer) clearTimeout(this.sendTUTimer);

            this.sendTUTimer = setTimeout((user) => { user.send("$tu") }, ms, this);
        }

        roll() {
            const rollPreferences = AutoMudae.preferences.get(E.PREFERENCES.ROLL);

            const command = SLASH_COMMANDS[rollPreferences.type];

            fetch("https://discord.com/api/v9/interactions", {
                "method": "POST",
                "headers": {
                    "authorization": this.token,
                    "content-type": "multipart/form-data; boundary=----BDR",
                },
                "body": `------BDR\r\nContent-Disposition: form-data; name="payload_json"\r\n\r\n{"type":2,"application_id":"${MUDAE_USER_ID}","guild_id":"${Discord.info.get(E.DISCORD_INFO.GUILD_ID)}","channel_id":"${Discord.info.get(E.DISCORD_INFO.CHANNEL_ID)}","session_id":"${Discord.info.get(E.DISCORD_INFO.SESSION_ID)}","data":{"version":"${command.version}","id":"${command.id}","name":"${rollPreferences.type}","type":1},"nonce":"${++Discord.nonce}"}\r\n------BDR--\r\n`
            });
        }
    }

    const AutoMudae = {
        users: [], /// MudaeUser[]
        preferences: null, /// Map<string, any>
        state: E.AUTOMUDAE_STATE.INJECT,
        chatObserver: new MutationObserver(ms => ms.forEach(m => { if (m.addedNodes.length) { handleNewChatAppend(m.addedNodes) } })),
        cdGatherInfo: 0,
        cdRoll: 0,
        lastResetHash: '',

        timers: {
            _t: new Map(),
            set(identifier, callback, ms, isInterval = false) {
                if (this._t.has(identifier)) clearTimeout(identifier);
                const timer = isInterval ? setInterval(callback, ms) : setTimeout(callback, ms);
                this._t.set(identifier, timer);
            },
            clear() { [...this._t.values()].forEach(t => { clearTimeout(t); clearInterval(t) }); this._t.clear(); }
        },

        toasts: {
            add(E_TOAST, formattableText, el_SubjectMessage = null) {
                if (!DOM.el_ToastsWrapper) return;

                const text = formattableText.replace(/\[(.+?)\]/g, "<strong>$1</strong>");

                const el_Toast = document.createElement("div");
                el_Toast.classList.add("automudae-toast", E_TOAST);
                el_Toast.innerHTML = `<span>${text}</span>`;

                if (el_SubjectMessage){
                    el_Toast.classList.add("link");

                    el_Toast.onclick = function(){
                        if (this.classList.contains("missing")){
                            this.classList.remove("missing");
                            void this.offsetWidth;
                            this.classList.add("missing");  
                            return;
                        }

                        if (!el_SubjectMessage) return this.classList.add("missing");;

                        const loadedMessages = [...el_SubjectMessage.parentElement.children];
                        const messageIndex = loadedMessages.indexOf(el_SubjectMessage);
                        const distanceFromBottom = loadedMessages.length - messageIndex;
                        const quantityMargin = 19;

                        if (messageIndex >= quantityMargin && distanceFromBottom <= quantityMargin){
                            el_SubjectMessage.scrollIntoView();
                            return;
                        }

                        this.classList.add("missing");
                    };
                }

                DOM.el_ToastsWrapper.appendChild(el_Toast);
            },
            clear() {
                if (DOM.el_ToastsWrapper) DOM.el_ToastsWrapper.innerHTML = "";
            }
        },

        /// Info
        hasNeededInfo() {
            return this.users.every(user => user.hasNeededInfo());
        },

        isLastReset() {
            const now = new Date(), h = now.getHours(), m = now.getMinutes();
            return (h % 3 == 2 && m >= 36) || (h % 3 == 0 && m < 36)
        },

        /// Utils
        mudaeTimeToMs(timeString) {
            if (!timeString.includes("h")) return Number(timeString) * 60 * 1000;

            const match = /(\d+h)?\s?(\d+)?/.exec(timeString);

            if (!match) return;

            const h = match[1];
            const m = match[2];
            let totalMs = 0;

            if (h) totalMs += Number(h.replace(/\D/g, '')) * 60 * 60 * 1000;
            if (m) totalMs += Number(m) * 60 * 1000;

            return totalMs;
        },

        getMarriageableUser(preferableNicknames) {
            if (!preferableNicknames || preferableNicknames.length === 0){
                return this.users.find(user => user.info.get(E.MUDAE_INFO.CAN_MARRY));
            }

            let marriageableUser;

            for (let i = 0; i < this.users.length; i++) {
                const user = this.users[i];
                
                if (user.info.get(E.MUDAE_INFO.CAN_MARRY)){
                    marriageableUser = user;

                    if (preferableNicknames.includes(user.nick)) break;                    
                }
            }

            return marriageableUser;
        },

        clearError(){
            if (DOM.el_ErrorPopup) DOM.el_ErrorPopup = DOM.el_ErrorPopup.remove();
        },

        error(msg) {
            this.clearError();
            if (!msg) return;

            const el_ErrorPopup = document.createElement("div");
            el_ErrorPopup.id = "automudae-error";
            el_ErrorPopup.innerHTML = `<span>${msg}</span>`;
            document.body.appendChild(el_ErrorPopup);

            DOM.el_ErrorPopup = el_ErrorPopup;
        },

        /// Workflow
        renderMainButton() {
            const el_MainButton = document.createElement("div");
            el_MainButton.id = 'automudae-main-button';

            el_MainButton.classList.add(E.AUTOMUDAE_STATE.INJECT);

            const el_MainText = document.createElement("span");
            el_MainText.appendChild(document.createTextNode("Inject Auto-Mudae"));

            el_MainButton.appendChild(el_MainText);

            el_MainButton.onclick = (_e) => AutoMudae.inject();

            DOM.el_MainButton = el_MainButton;
            DOM.el_MainText = el_MainText;

            document.body.appendChild(el_MainButton);
        },

        inject() {
            logger.info("Injecting...");
            const err = AutoMudae.setup();

            if (err) {
                logger.error(err);
                this.error(err);
                return;
            }

            DOM.el_MainButton.onclick = null;

            this.clearError();

            const requirements = "Required:\n- Arrange your $TU to expose all needed information: $ta claim rolls daily keys kakerareact kakerapower kakerainfo kakerastock rt dk rollsreset\n- Set your claim feedback to default: $rc none\n- Set your rolls left message to default: $rollsleft 0\nCan only roll with slash commands.\nDon't search for messages in Discord.\n- Don't scroll up the channel.";
            const recommendations = "Recommended:\n- Use slash rolls.\n- Don't use non-slash rolls while the channel is in peak usage by other members.\n- Set your user order priorizing roll and kakera claiming.";

            const exposeLogger = this.preferences.get(E.PREFERENCES.EXTRA).logger;

            if (exposeLogger) {
                const doNothing = () => { };

                for (const method in logger) {
                    if (!Object.hasOwn(logger, method)) continue;

                    window.console[method] = doNothing;
                }

                console.clear();
                window.logger = logger;
                logger.debug("Turned off native console. Use logger instead. I recommend disabling network log, since Discord usualy prompt a lot of these.");
                logger.debug(requirements);
                logger.debug(recommendations);
                logger._reprompt();
            }

            this.render();
            this.tryEnable();

            if (!exposeLogger) {
                logger.info(requirements);
                logger.info(recommendations);
            }
        },

        setup() {
            const windowPathname = window.location?.pathname;

            if (!windowPathname) {
                return "Couldn't retrieve current window URL.";
            }

            const [_, pathDiscriminator, guildId, channelId] = windowPathname.split("/");

            if (pathDiscriminator !== "channels") {
                return "You must be viewing the desired channel.";
            }

            if (!guildId || !channelId) {
                return "Couldn't retrieve active guild or channel.";
            }

            DOM.el_ChannelList = document.querySelector("#channels > ul");
            DOM.el_MemberList = document.querySelector("div[class^='members'] > div");
            DOM.el_Chat = document.querySelector("ol[class^='scrollerInner']");
            DOM.el_ChatWrapper = document.querySelector("main[class^='chatContent']");

            if (!DOM.el_Chat || !DOM.el_MemberList || !DOM.el_ChannelList || !DOM.el_ChatWrapper) {
                return "Make sure you're viewing the desired channel and the page is fully loaded.";
            }

            if (!localStorage || !localStorage.MultiAccountStore || !localStorage.tokens) {
                return "Couldn't retrieve information from Discord.";
            }

            const storeUsers = JSON.parse(localStorage.MultiAccountStore)?._state.users;
            const tokens = JSON.parse(localStorage.tokens);

            if (!storeUsers || !tokens) {
                return "Couldn't retrieve information about your accounts.";
            }

            const users = [];

            for (let i = 0; i < storeUsers.length; i++) {
                const { id, username, avatar } = storeUsers[i];

                const token = tokens[id];

                if (!token) {
                    return `Couldn't retrieve information about user [${username}]`;
                }

                users.push(new MudaeUser(id, username, avatar, token));
            }

            this.users = users;
            Discord.info.set(E.DISCORD_INFO.CHANNEL_ID, channelId);
            Discord.info.set(E.DISCORD_INFO.GUILD_ID, guildId);

            const defaultPreferences = `[
                ["${E.PREFERENCES.KAKERA}", {"kakeraP": false, "kakera": false, "kakeraT": false, "kakeraG": false, "kakeraY": false, "kakeraO": false, "kakeraR": false, "kakeraW": false, "kakeraL": false}],
                ["${E.PREFERENCES.MENTIONS}", ""],
                ["${E.PREFERENCES.ROLL}", {"enabled":true,"type":"wx"}],
                ["${E.PREFERENCES.SOUND}", {"foundcharacter":true,"marry":true,"cantmarry":true, "lastresetnorolls":true,"soulmate":true,"wishsteal":true}],
                ["${E.PREFERENCES.EXTRA}", {"logger":true}]
            ]`;

            const savedVersion = GM_getValue(E.GMVALUE.VERSION, null);

            const isPreferencesOutdated = !savedVersion || savedVersion !== GM_info.script.version;

            const stringifiedPreferences = isPreferencesOutdated ? defaultPreferences : GM_getValue(E.GMVALUE.PREFERENCES, defaultPreferences);

            this.preferences = new Map(JSON.parse(stringifiedPreferences));

            GM_setValue(E.GMVALUE.VERSION, GM_info.script.version);
        },

        render() {
            logger.info("Rendering...");
            const el_InfoPanel = document.createElement("div");
            el_InfoPanel.id = "automudae-panel-info";
            el_InfoPanel.innerHTML = `
            <h1>Auto-Mudae Info</h1>
            <div>
                <div class="automudae-section">
                    <h2>Collected</h2>
                    <div class="automudae-section-body">
                        <div class="automudae-row">
                            <span>Kakera:</span>
                            <div><img class="emoji" src="https://cdn.discordapp.com/emojis/469835869059153940.webp?quality=lossless"><span id="automudae-field-${E.INFO_FIELD.KAKERA}">0</span></div>
                        </div>
                        <div class="automudae-row">
                            <span>Characters:</span>
                        </div>
                        <ul id="automudae-field-${E.INFO_FIELD.COLLECTED_CHARACTERS}"></ul>
                    </div>
                </div>
                <div class="automudae-section" id="automudae-section-status">
                    <h2>Status</h2>
                    <div class="automudae-section-body">
                        <div class="automudae-row-expandable">
                            <div class="automudae-row">
                                <span>Rolls:</span>
                                <div><span>(</span><span id="automudae-field-${E.INFO_FIELD.ROLLS_LEFT}">?</span><span>/</span><span id="automudae-field-${E.INFO_FIELD.ROLLS_MAX}">?</span><span>)</span></div>
                            </div>
                            <div>
                                ${this.users.map(user => `<div class="automudae-row"><span>${user.username}:</span><div><span>(</span><span id="automudae-field-${E.INFO_FIELD.ROLLS_LEFT}-${user.id}">?</span><span>/</span><span id="automudae-field-${E.INFO_FIELD.ROLLS_MAX}-${user.id}">?</span><span>)</span></div></div>`).join("")}
                            </div>
                        </div>
                        <div class="automudae-row-expandable">
                            <div class="automudae-row">
                                <span>Power:</span>
                                <div><span id="automudae-field-${E.INFO_FIELD.POWER}">?</span><span>%</span></div>
                            </div>
                            <div>
                                ${this.users.map(user => `<div class="automudae-row"><span>${user.username}:</span><div><div><span id="automudae-field-${E.INFO_FIELD.POWER}-${user.id}">?</span><span>%</span></div></div></div>`).join("")}
                            </div>
                        </div>
                        <div class="automudae-row-expandable">
                            <div class="automudae-row">
                                <span>Kakera Power Consumption:</span>
                                <div><span id="automudae-field-${E.INFO_FIELD.POWER_CONSUMPTION}">?</span><span>%</span></div>
                            </div>
                            <div>
                                ${this.users.map(user => `<div class="automudae-row"><span>${user.username}:</span><div><div><span id="automudae-field-${E.INFO_FIELD.POWER_CONSUMPTION}-${user.id}">?</span><span>%</span></div></div></div>`).join("")}
                            </div>
                        </div>
                        <div class="automudae-row-expandable">
                            <div class="automudae-row">
                                <span>Can Marry?</span>
                                <span id="automudae-field-${E.INFO_FIELD.CAN_MARRY}">?</span>
                            </div>
                            <div>
                                ${this.users.map(user => `<div class="automudae-row"><span>${user.username}:</span><div><span id="automudae-field-${E.INFO_FIELD.CAN_MARRY}-${user.id}">?</span></div></div>`).join("")}
                            </div>
                        </div>
                        <div class="automudae-row-expandable">
                            <div class="automudae-row">
                                <span>Can RT?</span>
                                <span id="automudae-field-${E.INFO_FIELD.CAN_RT}">?</span>
                            </div>
                            <div>
                                ${this.users.map(user => `<div class="automudae-row"><span>${user.username}:</span><div><span id="automudae-field-${E.INFO_FIELD.CAN_RT}-${user.id}">?</span></div></div>`).join("")}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;

            const el_ConfigPanel = document.createElement("div");
            el_ConfigPanel.id = "automudae-panel-config";
            el_ConfigPanel.innerHTML = `
            <h1>Auto-Mudae Config</h1>
            <div>
                <div class="automudae-section" id="automudae-section-kakera">
                    <h2>Kakera to Collect</h2>
                    <div class="automudae-section-body">
                        <div><input type="checkbox" id="opt-kakera-kakeraP"><label for="opt-kakera-kakeraP"><img class="emoji" src="https://cdn.discordapp.com/emojis/609264156347990016.webp?quality=lossless"></label></div>
                        <div><input type="checkbox" id="opt-kakera-kakera"><label for="opt-kakera-kakera"><img class="emoji" src="https://cdn.discordapp.com/emojis/469835869059153940.webp?quality=lossless"></label></div>
                        <div><input type="checkbox" id="opt-kakera-kakeraT"><label for="opt-kakera-kakeraT"><img class="emoji" src="https://cdn.discordapp.com/emojis/609264180851376132.webp?quality=lossless"></label></div>
                        <div><input type="checkbox" id="opt-kakera-kakeraG"><label for="opt-kakera-kakeraG"><img class="emoji" src="https://cdn.discordapp.com/emojis/609264166381027329.webp?quality=lossless"></label></div>
                        <div><input type="checkbox" id="opt-kakera-kakeraY"><label for="opt-kakera-kakeraY"><img class="emoji" src="https://cdn.discordapp.com/emojis/605112931168026629.webp?quality=lossless"></label></div>
                        <div><input type="checkbox" id="opt-kakera-kakeraO"><label for="opt-kakera-kakeraO"><img class="emoji" src="https://cdn.discordapp.com/emojis/605112954391887888.webp?quality=lossless"></label></div>
                        <div><input type="checkbox" id="opt-kakera-kakeraR"><label for="opt-kakera-kakeraR"><img class="emoji" src="https://cdn.discordapp.com/emojis/605112980295647242.webp?quality=lossless"></label></div>
                        <div><input type="checkbox" id="opt-kakera-kakeraW"><label for="opt-kakera-kakeraW"><img class="emoji" src="https://cdn.discordapp.com/emojis/608192076286263297.webp?quality=lossless"></label></div>
                        <div><input type="checkbox" id="opt-kakera-kakeraL"><label for="opt-kakera-kakeraL"><img class="emoji" src="https://cdn.discordapp.com/emojis/815961697918779422.webp?quality=lossless"></label></div>
                    </div>
                </div>
                <div class="automudae-section">
                    <h2>Interesting Mentions</h2>
                    <div class="automudae-section-body">
                        <textarea spellcheck="false" id="opt-mentions"></textarea>
                    </div>
                </div>
                <div class="automudae-section">
                    <h2>Roll</h2>
                    <div class="automudae-section-body">
                        <div>
                            <input type="checkbox" id="opt-roll-enabled"><label for="opt-roll-enabled"><span>Enabled</span></label>
                        </div>
                        <div>
                            <select id="opt-roll-type">
                                <option value="wx">wx</option>
                                <option value="wa">wa</option>
                                <option value="wg">wg</option>
                                <option value="hx">hx</option>
                                <option value="ha">ha</option>
                                <option value="hg">hg</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="automudae-section">
                    <h2>Sound</h2>
                    <div class="automudae-section-body">
                        <div>
                            <input type="checkbox" id="opt-sound-foundcharacter"><label for="opt-sound-foundcharacter"><span>Found character</span></label>
                        </div>
                        <div>
                            <input type="checkbox" id="opt-sound-marry"><label for="opt-sound-marry"><span>Marry</span></label>
                        </div>
                        <div>
                            <input type="checkbox" id="opt-sound-cantmarry"><label for="opt-sound-cantmarry"><span>Can't marry</span></label>
                        </div>
                        <div>
                            <input type="checkbox" id="opt-sound-lastresetnorolls"><label for="opt-sound-lastresetnorolls"><span>Can't roll in the last reset</span></label>
                        </div>
                        <div>
                            <input type="checkbox" id="opt-sound-soulmate"><label for="opt-sound-soulmate"><span>New soulmates</span></label>
                        </div>
                        <div>
                            <input type="checkbox" id="opt-sound-wishsteal"><label for="opt-sound-wishsteal"><span>Wish steals</span></label>
                        </div>
                    </div>
                </div>
                <div class="automudae-section">
                    <h2>Extra</h2>
                    <div class="automudae-section-body">
                        <div data-requirerestart>
                            <input type="checkbox" id="opt-extra-logger"><label for="opt-extra-logger"><span>Replace Console with Logger</span></label>
                        </div>
                    </div>
                </div>
            </div>
            `;

            const el_ToastsWrapper = document.createElement("div");
            el_ToastsWrapper.id = "automudae-toasts-wrapper";

            DOM.el_ChannelList.prepend(el_InfoPanel);
            DOM.el_MemberList.prepend(el_ConfigPanel);
            DOM.el_ChatWrapper.prepend(el_ToastsWrapper);

            DOM.el_ToastsWrapper = el_ToastsWrapper;

            document.querySelector("[class^='channelTextArea']").style.width = "60%";

            /// Make side panels collapsable
            function collapse() { this.parentElement.classList.toggle("collapsed") };

            document.querySelectorAll("[id^='automudae-panel'] > h1").forEach(el_Header => el_Header.onclick = collapse);

            /// Config Update & Functionality
            function handleCheckboxPreference() {
                const [_, category, key] = this.id.split("-");
                const categoryPreferences = AutoMudae.preferences.get(category);

                categoryPreferences[key] = this.checked;

                AutoMudae.preferences.set(category, categoryPreferences);
                AutoMudae.savePreferences();
            };

            document.querySelectorAll("input[type='checkbox'][id^='opt-']").forEach(el_OptCheckbox => {
                const [_, category, key] = el_OptCheckbox.id.split("-");

                el_OptCheckbox.checked = AutoMudae.preferences.get(category)[key];
                el_OptCheckbox.onchange = handleCheckboxPreference;
            });

            const el_OptMentions = document.getElementById("opt-mentions");

            el_OptMentions.value = this.preferences.get(E.PREFERENCES.MENTIONS);

            el_OptMentions.onblur = function () {
                AutoMudae.preferences.set(E.PREFERENCES.MENTIONS, this.value);
                AutoMudae.savePreferences();
            };

            const el_OptRollType = document.getElementById("opt-roll-type");

            el_OptRollType.value = this.preferences.get(E.PREFERENCES.ROLL).type;

            el_OptRollType.onchange = function () {
                const rollPreferences = AutoMudae.preferences.get(E.PREFERENCES.ROLL);

                rollPreferences.type = this.value;

                AutoMudae.preferences.set(E.PREFERENCES.ROLL, rollPreferences);
                AutoMudae.savePreferences();
            };

            this.setState(E.AUTOMUDAE_STATE.SETUP);
        },

        tryEnable() {
            if (this.state !== E.AUTOMUDAE_STATE.SETUP) return;
            if (!Object.values(E.DISCORD_INFO).every(info => Discord.info.has(info))) return;

            this.setState(E.AUTOMUDAE_STATE.IDLE);
            DOM.el_MainButton.onclick = (_e) => AutoMudae.toggle();
            logger.plus("Ready to go!");
        },

        toggle() {
            if (this.state === E.AUTOMUDAE_STATE.IDLE) {
                this.clearError();

                let msToStartResetHandler = 1;
                const now = new Date();

                if (now.getMinutes() !== 37) {
                    const nextReset = new Date(now);
                    nextReset.setHours(now.getMinutes() > 37 ? now.getHours() + 1 : now.getHours(), 37);
                    msToStartResetHandler = nextReset - now;
                }

                this.timers.set("think", this.think, INTERVAL_THINK, true);
                this.timers.set("initHourlyResetHandler", () => { AutoMudae.handleHourlyReset(); AutoMudae.timers.set("HandleHourlyReset", AutoMudae.handleHourlyReset, 1 * 60 * 60 * 1000, true) }, msToStartResetHandler);
                this.chatObserver.observe(DOM.el_Chat, { childList: true });
                this.setState(E.AUTOMUDAE_STATE.RUN);
                logger.log("Running..");
                return;
            }

            this.chatObserver.disconnect();
            this.timers.clear();
            this.users.forEach(user => {
                if (user.sendTUTimer) clearTimeout(user.sendTUTimer);
                user.info.clear();
            });
            this.setState(E.AUTOMUDAE_STATE.IDLE);
            logger.log("Turned off.");
        },

        setState(E_STATE) {
            if (DOM.el_MainButton.classList.contains(this.state)) {
                DOM.el_MainButton.classList.replace(this.state, E_STATE);
            } else {
                DOM.el_MainButton.classList.add(E_STATE);
            }

            this.state = E_STATE;

            const stateTexts = {};
            stateTexts[E.AUTOMUDAE_STATE.SETUP] = "Setting up...";
            stateTexts[E.AUTOMUDAE_STATE.ERROR] = "Error!";
            stateTexts[E.AUTOMUDAE_STATE.IDLE] = "Run Auto-Mudae";
            stateTexts[E.AUTOMUDAE_STATE.RUN] = "Running...";

            DOM.el_MainText.innerText = stateTexts[E_STATE];
        },

        think() {
            const now = performance.now();
            const dateNow = new Date(), h = dateNow.getHours(), m = dateNow.getMinutes();

            if (!AutoMudae.hasNeededInfo()) {
                if (now - AutoMudae.cdGatherInfo < 1000) return;

                for (let i = 0; i < AutoMudae.users.length; i++) {
                    const user = AutoMudae.users[i];

                    if (!user.hasNeededInfo()) {
                        logger.log(`Gathering needed info for user [${user.username}]..`);

                        user.send("$tu");

                        break;
                    }

                }

                AutoMudae.cdGatherInfo = now;
                return;
            }

            const userWithRolls = AutoMudae.users.find(user => user.info.get(E.MUDAE_INFO.ROLLS_LEFT) > 0);

            if (AutoMudae.preferences.get(E.PREFERENCES.ROLL).enabled) {
                if (userWithRolls && now - Discord.lastMessageTime > INTERVAL_ROLL && now - AutoMudae.cdRoll > (INTERVAL_ROLL * .5)) {
                    userWithRolls.roll();
                    AutoMudae.cdRoll = now;
                }
            }

            if (!userWithRolls && m > 38 && AutoMudae.isLastReset() && AutoMudae.getMarriageableUser()) {
                const currentResetHash = `${dateNow.toDateString()} ${h}`;

                if (AutoMudae.lastResetHash !== currentResetHash) {
                    AutoMudae.lastResetHash = currentResetHash;

                    //# Add option to auto-use $us or $rolls

                    const warnMessage = "You have no more rolls, can still marry and it's the last reset. You could use $us or $rolls, then $tu.";

                    logger.warn(warnMessage);
                    AutoMudae.toasts.add(E.TOAST.WARN, warnMessage);
                    if (AutoMudae.preferences.get(E.PREFERENCES.SOUND).lastresetnorolls) SOUND.lastResetNoRolls();
                }
                
            }

        },

        savePreferences() {
            GM_setValue(E.GMVALUE.PREFERENCES, JSON.stringify(this.preferences));
        },

        updateInfoPanel(E_INFO_FIELD, content, user) {
            const el_OverallField = document.getElementById(`automudae-field-${E_INFO_FIELD}`);

            if (E_INFO_FIELD === E.INFO_FIELD.KAKERA) {
                const newKakera = Number(el_OverallField.innerText) + Number(content);

                el_OverallField.innerText = newKakera;
                return;
            }

            if (E_INFO_FIELD === E.INFO_FIELD.COLLECTED_CHARACTERS) {
                const el_CharacterItem = document.createElement("li");
                el_CharacterItem.appendChild(document.createTextNode((user ? `[${user.username}] ` : '') + content));
                el_OverallField.appendChild(el_CharacterItem);

                return;
            }

            const el_UserField = document.getElementById(`automudae-field-${E_INFO_FIELD}-${user.id}`);

            el_UserField.innerText = content;

            if (E_INFO_FIELD === E.INFO_FIELD.ROLLS_LEFT || E_INFO_FIELD === E.INFO_FIELD.ROLLS_MAX) {
                const numeralFields = [...document.querySelectorAll(`[id^='automudae-field-${E_INFO_FIELD}-']`)].map(el_UserField => el_UserField.innerText).filter(text => /\d+/.test(text));

                if (numeralFields.length > 0) el_OverallField.innerText = numeralFields.reduce((total, current) => Number(total) + Number(current));

                return;
            }

            if (E_INFO_FIELD === E.INFO_FIELD.POWER) {
                const highestPower = getLastFromArray([...document.querySelectorAll(`[id^='automudae-field-${E_INFO_FIELD}-']`)].map(el_UserField => el_UserField.innerText).filter(text => /\d+/.test(text)).sort((a, b) => Number(a) - Number(b)));

                if (highestPower) el_OverallField.innerText = `↓ ${highestPower}`;

                return;
            }

            if (E_INFO_FIELD === E.INFO_FIELD.POWER_CONSUMPTION) {
                const lowestConsumption = [...document.querySelectorAll(`[id^='automudae-field-${E_INFO_FIELD}-']`)].map(el_UserField => el_UserField.innerText).filter(text => /\d+/.test(text)).sort((a, b) => Number(a) - Number(b))[0];

                if (lowestConsumption) el_OverallField.innerText = `↑ ${lowestConsumption}`;

                return;
            }

            if (E_INFO_FIELD === E.INFO_FIELD.CAN_MARRY || E_INFO_FIELD === E.INFO_FIELD.CAN_RT) {
                const hasAny = [...document.querySelectorAll(`[id^='automudae-field-${E_INFO_FIELD}-']`)].some(el_UserField => el_UserField.innerText === "Yes");

                el_OverallField.innerText = hasAny ? "Yes" : "No";

                return;
            }
        },

        handleHourlyReset() {
            if (!AutoMudae.hasNeededInfo()) return;

            logger.log("Hourly reset. Gathering updated status..");

            AutoMudae.users.forEach(user => user.info.delete(E.MUDAE_INFO.ROLLS_LEFT));
        }
    };

    //# Remove this exposure
    window.Discord = Discord;
    window.AutoMudae = AutoMudae;

    /// Bot Inner Thinking
    function observeToReact(el_Message, kakeraReactionOrUserToReact) {
        const isKakera = typeof kakeraReactionOrUserToReact === "boolean";
        const user = isKakera ? null : kakeraReactionOrUserToReact;

        let runs = 0;

        const observer = setInterval(() => {
            if (!el_Message || runs++ >= 30) return clearInterval(observer);

            const el_ReactionImg = el_Message.querySelector(`div[class^='reactionInner']${isKakera ? "[aria-label^='kakera']" : ""}[aria-label*='1 rea'] img`);

            if (!el_ReactionImg) return;

            clearInterval(observer);

            if (!isKakera) {
                const emoji = E.EMOJI[el_ReactionImg.alt];

                if (!emoji) {
                    const errMessage = `Couldn't find emoji code for [${el_ReactionImg.alt}]. Address this to AutoMudae's creator, please.`;
                    logger.error(errMessage);
                    AutoMudae.toasts.add(E.TOAST.CRITICAL, errMessage, el_Message);
                    return;
                }

                user.react(el_Message, emoji);
                return;
            }

            if (isKakera) {
                const kakeraCode = el_ReactionImg.alt;

                if (!AutoMudae.preferences.get(E.PREFERENCES.KAKERA)[kakeraCode]) return;

                const userWithEnoughPower = kakeraCode === E.KAKERA.PURPLE
                    ? AutoMudae.users[0]
                    : AutoMudae.users.find(user => user.info.get(E.MUDAE_INFO.POWER) > user.info.get(E.MUDAE_INFO.CONSUMPTION));

                if (userWithEnoughPower) userWithEnoughPower.react(el_Message, E.EMOJI[kakeraCode]);
            }

        }, 100);
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

                const user = Discord.Message.isFromMe(el_PreviousMessage);

                if (user) {
                    const command = el_PreviousMessage.querySelector("div[id^='message-content']")?.innerText;
                    const mudaeResponse = el_Message.querySelector("div[id^='message-content']")?.innerText;

                    if (command && mudaeResponse && mudaeResponse.startsWith(`${user.username}, `)) {
                        if (command === "$tu") {
                            const matchRolls = /tem (\d+) rolls/.exec(mudaeResponse);
                            if (matchRolls) {
                                const rolls = Number(matchRolls[1]);

                                const hasRollsMax = user.info.has(E.MUDAE_INFO.ROLLS_MAX);

                                if (!hasRollsMax || user.info.get(E.MUDAE_INFO.ROLLS_MAX) < rolls) {
                                    user.info.set(E.MUDAE_INFO.ROLLS_MAX, rolls);

                                    AutoMudae.updateInfoPanel(E.INFO_FIELD.ROLLS_MAX, rolls, user);
                                }

                                user.info.set(E.MUDAE_INFO.ROLLS_LEFT, rolls);
                                AutoMudae.updateInfoPanel(E.INFO_FIELD.ROLLS_LEFT, rolls, user);
                            }

                            const matchPower = /Power: (\d+)%/.exec(mudaeResponse);
                            if (matchPower) {
                                const power = Number(matchPower[1]);

                                user.info.set(E.MUDAE_INFO.POWER, power);
                                AutoMudae.updateInfoPanel(E.INFO_FIELD.POWER, power, user);
                            }

                            if (/\$rt/.test(mudaeResponse)) {
                                const cooldownRTMatch = /: (.+) min. \(\$rtu\)/.exec(mudaeResponse);

                                user.info.set(E.MUDAE_INFO.CAN_RT, !cooldownRTMatch);

                                if (cooldownRTMatch) {
                                    logger.log(`Scheduled a RT check for user [${user.username}]. [${cooldownRTMatch[1]}]`);

                                    user.setTUTimer(AutoMudae.mudaeTimeToMs(cooldownRTMatch[1]) + 500);
                                }

                                const canRT = user.info.get(E.MUDAE_INFO.CAN_RT);
                                AutoMudae.updateInfoPanel(E.INFO_FIELD.CAN_RT, canRT ? "Yes" : "No", user);
                            }

                            if (/casar/.test(mudaeResponse)) {
                                const cantMarry = /se casar novamente (.+) min/.exec(mudaeResponse);

                                user.info.set(E.MUDAE_INFO.CAN_MARRY, !cantMarry);

                                AutoMudae.updateInfoPanel(E.INFO_FIELD.CAN_MARRY, cantMarry ? "No" : "Yes", user);
                            }

                            const matchKakeraConsumption = /kakera consume (\d+)%/.exec(mudaeResponse);
                            if (matchKakeraConsumption) {
                                const consumption = Number(matchKakeraConsumption[1]);

                                user.info.set(E.MUDAE_INFO.CONSUMPTION, consumption);

                                AutoMudae.updateInfoPanel(E.INFO_FIELD.POWER_CONSUMPTION, consumption, user);
                            }

                            if (!user.hasNeededInfo()) {
                                AutoMudae.toggle();

                                const errMsg = `Couldn't retrieve needed info for user [${user.username}]. Make sure your $tu configuration exposes every information.`;
                                logger.error(errMsg);
                                AutoMudae.error(errMsg);
                                return;
                            }

                            logger.info(`Got all needed info for user [${user.username}].`);
                            return;
                        };
                    }
                }
            }

            if (!AutoMudae.hasNeededInfo()) return;

            const el_MessageContent = el_Message.querySelector("div[id^='message-content']");

            if (el_MessageContent) {
                const messageContent = el_MessageContent.innerText;

                /// Handle character claims & steals
                const characterClaimMatch = /(.+) e (.+) agora são casados!/.exec(messageContent.trim());

                if (characterClaimMatch || messageContent.includes("(Silver IV Bônus)")) {
                    let usernameThatClaimed, characterName;

                    if (characterClaimMatch) {
                        [_, usernameThatClaimed, characterName] = characterClaimMatch;
                    }

                    let user;

                    if (usernameThatClaimed) {
                        user = AutoMudae.users.find(user => user.username === usernameThatClaimed);
                    }

                    /// Claim
                    if (user) {
                        user.info.set(E.MUDAE_INFO.CAN_MARRY, false);

                        AutoMudae.updateInfoPanel(E.INFO_FIELD.CAN_MARRY, "No", user);
                        AutoMudae.updateInfoPanel(E.INFO_FIELD.COLLECTED_CHARACTERS, characterName, user);

                        if (AutoMudae.preferences.get(E.PREFERENCES.SOUND).marry) SOUND.marry();

                        const logMessage = `User [${usernameThatClaimed}] claimed character [${characterName}]!`;
                        logger.plus(logMessage);
                        AutoMudae.toasts.add(E.TOAST.CHARCLAIM, logMessage, el_Message);

                        el_Message.classList.add("plus");

                        document.querySelectorAll("[class^='embedAuthorName']").forEach(el_AuthorName => {
                            if (el_AuthorName.innerText === characterName) {
                                const el_ParentMessage = el_AuthorName.closest("li");
                                el_ParentMessage.classList.add("plus");
                            }
                        });
                    } else {
                        const el_Mentions = el_Message.querySelectorAll("span.mention");

                        let isIncludingMe = false;

                        for (let i = 0; i < el_Mentions.length; i++) {
                            const mentionedNick = el_Mentions[i].innerText.substr(1);

                            if (AutoMudae.users.some(user => user.nick === mentionedNick)) {
                                isIncludingMe = true;
                                break;
                            }
                        }

                        /// Steal
                        if (isIncludingMe) {
                            if (AutoMudae.preferences.get(E.PREFERENCES.SOUND).wishsteal) SOUND.critical();

                            el_Message.classList.add("critical");

                            if (characterName) {
                                document.querySelectorAll("[class^='embedAuthorName']").forEach(el_AuthorName => {
                                    if (el_AuthorName.innerText === characterName) {
                                        const el_ParentMessage = el_AuthorName.closest("li");
                                        el_ParentMessage.classList.add("critical");
                                    }
                                });
                            }

                            const stealWarn = characterClaimMatch
                                ? `User [${usernameThatClaimed}] claimed character [${characterName}] wished by you.`
                                : "A character wished by you was claimed by another user.";

                            logger.warn(stealWarn);
                            AutoMudae.toasts.add(E.TOAST.CRITICAL, stealWarn, el_Message);
                        }
                    }

                    return;
                }

                /// Handle "no more rolls" messages
                const noMoreRollsMatch = /(.+), os rolls são limitado/.exec(messageContent);

                if (noMoreRollsMatch) {
                    const user = AutoMudae.users.find(user => user.username === noMoreRollsMatch[1]);

                    return user && setTimeout(() => user.send("$tu"), 250);;
                }

                const el_KakeraClaimStrong = el_Message.querySelector("div[id^='message-content'] span[class^='emojiContainer'] + strong");

                /// Handle kakera claiming
                if (el_KakeraClaimStrong) {
                    const kakeraClaimMatch = /^(.+)\s\+(\d+)$/.exec(el_KakeraClaimStrong.innerText);

                    if (kakeraClaimMatch) {
                        const [_, messageUsername, kakeraQuantity] = kakeraClaimMatch;

                        const user = AutoMudae.users.find(user => user.username === messageUsername);

                        if (user) {
                            const kakeraType = el_KakeraClaimStrong.previousElementSibling?.firstElementChild?.alt.replace(/:/g, '');

                            const powerCost = kakeraType === E.KAKERA.PURPLE ? 0 : user.info.get(E.MUDAE_INFO.CONSUMPTION);

                            if (powerCost > 0) {
                                const newPower = user.info.get(E.MUDAE_INFO.POWER) - powerCost;

                                user.info.set(E.MUDAE_INFO.POWER, newPower);
                                AutoMudae.updateInfoPanel(E.INFO_FIELD.POWER, newPower, user);
                            }

                            el_Message.classList.add("plus");
                            AutoMudae.updateInfoPanel(E.INFO_FIELD.KAKERA, kakeraQuantity);
                            logger.plus(`+${kakeraQuantity} kakera! [Remaining Power for user [${user.username}]: ${user.info.get(E.MUDAE_INFO.POWER)}%]`);
                            AutoMudae.toasts.add(E.TOAST.KAKERA, `+[${kakeraQuantity}] Kakera`, el_Message);
                        }

                        return;
                    }
                }
            }

            const el_ImageWrapper = el_Message.querySelector("div[class^='embedDescription'] + div[class^='imageContent'] div[class^='imageWrapper']");

            /// Handle character messages
            if (el_ImageWrapper) {
                const el_Footer = el_Message.querySelector("span[class^='embedFooterText']");

                const isCharacterLookupMessage = (el_Footer && (/^\d+ \/ \d+$/.test(el_Footer.innerText) || /^Pertence a .+ ~~ \d+ \/ \d+$/.test(el_Footer.innerText)));

                if (isCharacterLookupMessage) return;

                const characterName = el_Message.querySelector("span[class^='embedAuthorName']").innerText;
                const el_ReplyAvatar = el_Message.querySelector("img[class^='executedCommandAvatar']");

                if (el_ReplyAvatar) {
                    const matchReplyUserId = /avatars\/(\d+)\//.exec(el_ReplyAvatar.src);

                    if (!matchReplyUserId) return logger.error("Couldn't get reply user ID for", el_Message);

                    const user = AutoMudae.users.find(user => user.id === matchReplyUserId[1]);

                    if (user) {
                        const rollsLeft = user.info.get(E.MUDAE_INFO.ROLLS_LEFT) - 1;
                        user.info.set(E.MUDAE_INFO.ROLLS_LEFT, rollsLeft);
                        AutoMudae.updateInfoPanel(E.INFO_FIELD.ROLLS_LEFT, rollsLeft, user);

                        if (el_Message.querySelector("div[class^='embedDescription']").innerText.includes("Sua nova ALMA")) {
                            if (AutoMudae.preferences.get(E.PREFERENCES.SOUND).soulmate) SOUND.newSoulmate();

                            const logMessage = `New soulmate: [${characterName}]!`;
                            logger.plus(logMessage);
                            AutoMudae.toasts.add(E.TOAST.SOULMATE, logMessage, el_Message);
                        }
                    }
                }

                if (!el_Footer || el_Footer.innerText.includes("2 ROLLS RESTANTES") && !el_Footer.innerText.includes("Pertence")) {
                    let el_InterestingCharacter, isWished;

                    const mentionedNicknames = [...el_Message.querySelectorAll("span.mention")].map(el_Mention => el_Mention.innerText.substr(1));

                    for (let i = 0; i < mentionedNicknames.length; i++) {
                        const mentionedNick = mentionedNicknames[i];

                        if (AutoMudae.users.some(user => user.nick === mentionedNick) || AutoMudae.preferences.get(E.PREFERENCES.MENTIONS).split(",").map(nick => nick.trim()).includes(mentionedNick)) {
                            el_InterestingCharacter = el_Message;
                            isWished = true;
                            break;
                        }
                    }

                    const marriageableUser = AutoMudae.getMarriageableUser(mentionedNicknames);

                    if (marriageableUser && !el_InterestingCharacter && AutoMudae.isLastReset()) {
                        //# Search in a database
                        if (characterName === "hmm") {
                            el_InterestingCharacter = el_Message;
                        };
                    }

                    if (el_InterestingCharacter) {
                        const logMessage = `Found character [${characterName}]`;
                        logger.info(logMessage);
                        AutoMudae.toasts.add(E.TOAST.INFO, logMessage, el_Message)

                        if (marriageableUser) {
                            if (AutoMudae.preferences.get(E.PREFERENCES.SOUND).foundcharacter) SOUND.foundCharacter();

                            if (isWished) {
                                observeToReact(el_Message, marriageableUser);
                            } else {
                                setTimeout(() => marriageableUser.react(el_Message, E.EMOJI.PEOPLE_HUGGING), 8500);
                            }

                            return;
                        }

                        if (AutoMudae.preferences.get(E.PREFERENCES.SOUND).cantmarry) SOUND.critical();

                        const warnMessage = `Can't marry right now. You may lose character [${characterName}]`;
                        logger.warn(warnMessage);
                        AutoMudae.toasts.add(E.TOAST.WARN, warnMessage, el_Message);
                    }

                    return;
                }

                /// Owned characters
                if (el_Footer.innerText.includes("Pertence")) {
                    /// Observe kakera reactions append
                    observeToReact(el_Message, true);
                }

                return;
            }
        });
    }

    /// SessionId Hook
    window.console.info = function () {
        for (const arg of arguments) {
            const match = /\[READY\] (?:.+) as (.+)/.exec(arg) || /resuming session (.+),/.exec(arg);

            if (match) {
                window.console.info = console.info;
                Discord.info.set(E.DISCORD_INFO.SESSION_ID, match[1]);
                AutoMudae.tryEnable();
            }
        }
        console.info(...arguments);
    };

    /// Main
    window.addEventListener("load", main, false);

    function main() {
        AutoMudae.renderMainButton();
    };
})();


