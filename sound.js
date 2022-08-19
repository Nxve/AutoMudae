(function(){
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
        foundCharacter: () => {beep(5, 400, 100, 1)},
        marry: () => {beep(10, 600, 100, 1)},
        cantMarry: () => {beep(15, 70, 80, 6)},
        lastResetNoRolls: () => {beep(10, 60, 250, 2)}
    };

    unsafeWindow.AUTOMUDAE ??= {};
    unsafeWindow.AUTOMUDAE.SOUND = SOUND;
    console.info("[AUTO MUDAE][i] Loaded SOUND.");
})();