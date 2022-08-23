(function(){
    const _logger = {
        _preffix: '%c[AUTO MUDAE]',
        _symbols: { error: '[!]', info: '[i]', log: '[*]', plus: '[+]', debug: '[!]', warn: '[!]' },
        _color: { error: 'red', info: 'cyan', log: 'white', plus: 'lime', debug: 'cyan', warn: 'gold' },
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
        _reprompt: function () {
            this._history.forEach(log => this[log[0]](...log[1]));
        }
    };

    const logger = {};

    ['error', 'info', 'log', 'plus', 'debug', 'warn'].forEach(method => {
        logger[method] = function () { this._print(method, ...arguments) };
    });

    /// I use prototype here to prevent exposing private properties in DevTools.
    Object.setPrototypeOf(logger, _logger);

    unsafeWindow.logger = logger;
    console.info("[AUTO-MUDAE][i] Loaded Logger.");
})();