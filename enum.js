(function(){
    const E = {};

    E.DISCORD_INFO = {
        CHANNEL_ID: 'channel_id',
        GUILD_ID: 'guild_id',
        SESSION_ID: 'session_id'
    };
    
    E.AUTOMUDAE_STATE = {
        INJECT: 'inject',
        SETUP: 'setup',
        ERROR: 'error',
        IDLE: 'idle',
        RUN: 'run',
    };
    
    E.MUDAE_INFO = {
        ROLLS_MAX: 'rolls_max',
        ROLLS_LEFT: 'rolls_left',
        POWER: 'power',
        CAN_RT: 'can_rt',
        CAN_MARRY: 'can_marry',
        CONSUMPTION: 'kakera_consumption'
    };
    
    E.EMOJI = {
        PEOPLE_HUGGING: '%F0%9F%AB%82',
        kakeraP: 'kakeraP%3A609264156347990016',
        kakera: 'kakera%3A469791929106956298',
        kakeraT: 'kakeraT%3A609264180851376132',
        kakeraG: 'kakeraG%3A609264166381027329',
        kakeraY: 'kakeraY%3A605112931168026629',
        kakeraO: 'kakeraO%3A605112954391887888',
        kakeraR: 'kakeraR%3A605112980295647242',
        kakeraW: 'kakeraW%3A608192076286263297',
        kakeraL: 'kakeraL%3A815961697918779422',
    };
    
    E.KAKERA = {
        PURPLE: 'kakeraP',
        BLUE: 'kakera',
        CYAN: 'kakeraT',
        GREEN: 'kakeraG',
        YELLOW: 'kakeraY',
        ORANGE: 'kakeraO',
        RED: 'kakeraR',
        RAINBOW: 'kakeraW',
        LIGHT: 'kakeraL',
    };

    E.GMVALUE = {
        PREFERENCES: 'preferences',
        VERSION: 'version'
    };

    E.PREFERENCES = {
        KAKERA: 'kakera',
        MENTIONS: 'mentions',
        ROLL: 'roll',
        SOUND: 'sound',
        EXTRA: 'extra'
    };

    unsafeWindow.AUTOMUDAE ??= {};
    unsafeWindow.AUTOMUDAE.E = E;
    console.info("[AUTO MUDAE][i] Loaded ENUM.");
})();