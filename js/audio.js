// Audio system — Web Audio API synthesized sounds and music
const Audio = (() => {
    let ctx = null;
    let masterGain = null;
    let musicGain = null;
    let sfxGain = null;
    let currentMusic = null;
    let musicEnabled = true;
    let sfxEnabled = true;

    function init() {
        if (ctx) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.5;
        masterGain.connect(ctx.destination);
        musicGain = ctx.createGain();
        musicGain.gain.value = 0.3;
        musicGain.connect(masterGain);
        sfxGain = ctx.createGain();
        sfxGain.gain.value = 0.5;
        sfxGain.connect(masterGain);
    }

    function ensureCtx() {
        if (!ctx) init();
        if (ctx.state === 'suspended') ctx.resume();
    }

    function playTone(freq, duration, type, gainNode, volume = 0.3, detune = 0) {
        ensureCtx();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type || 'square';
        osc.frequency.value = freq;
        if (detune) osc.detune.value = detune;
        g.gain.setValueAtTime(volume, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(g);
        g.connect(gainNode || sfxGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    }

    function noise(duration, gainNode, volume = 0.1) {
        ensureCtx();
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const g = ctx.createGain();
        g.gain.setValueAtTime(volume, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        src.connect(g);
        g.connect(gainNode || sfxGain);
        src.start(ctx.currentTime);
    }

    const sfx = {
        jump() {
            if (!sfxEnabled) return;
            playTone(300, 0.15, 'square', sfxGain, 0.2);
            playTone(500, 0.1, 'square', sfxGain, 0.15);
        },
        land() {
            if (!sfxEnabled) return;
            noise(0.05, sfxGain, 0.1);
        },
        attack() {
            if (!sfxEnabled) return;
            playTone(200, 0.08, 'sawtooth', sfxGain, 0.3);
            noise(0.06, sfxGain, 0.15);
        },
        hitEnemy() {
            if (!sfxEnabled) return;
            playTone(150, 0.1, 'square', sfxGain, 0.3);
            noise(0.08, sfxGain, 0.2);
            playTone(100, 0.15, 'sawtooth', sfxGain, 0.2);
        },
        takeDamage() {
            if (!sfxEnabled) return;
            playTone(100, 0.3, 'sawtooth', sfxGain, 0.3);
            playTone(80, 0.2, 'square', sfxGain, 0.2);
        },
        checkpoint() {
            if (!sfxEnabled) return;
            playTone(523, 0.1, 'sine', sfxGain, 0.2);
            setTimeout(() => playTone(659, 0.1, 'sine', sfxGain, 0.2), 100);
            setTimeout(() => playTone(784, 0.15, 'sine', sfxGain, 0.2), 200);
        },
        levelComplete() {
            if (!sfxEnabled) return;
            const notes = [523, 587, 659, 784, 880, 1047];
            notes.forEach((n, i) => {
                setTimeout(() => playTone(n, 0.2, 'sine', sfxGain, 0.2), i * 80);
            });
        },
        death() {
            if (!sfxEnabled) return;
            playTone(400, 0.1, 'square', sfxGain, 0.3);
            setTimeout(() => playTone(300, 0.15, 'square', sfxGain, 0.25), 100);
            setTimeout(() => playTone(200, 0.2, 'square', sfxGain, 0.2), 250);
            setTimeout(() => playTone(100, 0.4, 'sawtooth', sfxGain, 0.2), 400);
        },
        menuSelect() {
            if (!sfxEnabled) return;
            playTone(800, 0.05, 'square', sfxGain, 0.15);
        },
        menuConfirm() {
            if (!sfxEnabled) return;
            playTone(600, 0.08, 'square', sfxGain, 0.2);
            setTimeout(() => playTone(900, 0.1, 'square', sfxGain, 0.2), 60);
        },
        bossHit() {
            if (!sfxEnabled) return;
            playTone(80, 0.2, 'sawtooth', sfxGain, 0.4);
            noise(0.15, sfxGain, 0.3);
        },
        powerUp() {
            if (!sfxEnabled) return;
            [440, 554, 659, 880].forEach((n, i) => {
                setTimeout(() => playTone(n, 0.15, 'sine', sfxGain, 0.2), i * 60);
            });
        }
    };

    // Ambient music per level
    const levelMoods = [
        { baseFreq: 110, type: 'sine', lfoRate: 0.5, filterFreq: 400 },    // L1: quiet, lonely
        { baseFreq: 165, type: 'triangle', lfoRate: 2, filterFreq: 800 },   // L2: sterile neon
        { baseFreq: 82, type: 'sine', lfoRate: 0.3, filterFreq: 300 },      // L3: pastoral wrong
        { baseFreq: 55, type: 'sawtooth', lfoRate: 4, filterFreq: 600 },    // L4: industrial
        { baseFreq: 130, type: 'sine', lfoRate: 1, filterFreq: 500 },       // L5: uncanny
        { baseFreq: 73, type: 'square', lfoRate: 3, filterFreq: 400 },      // L6: oppressive
        { baseFreq: 196, type: 'sine', lfoRate: 0.8, filterFreq: 1000 },    // L7: reverent
        { baseFreq: 98, type: 'triangle', lfoRate: 0.4, filterFreq: 600 },  // L8: surreal
        { baseFreq: 65, type: 'sawtooth', lfoRate: 1.5, filterFreq: 350 },  // L9: grim
        { baseFreq: 146, type: 'sawtooth', lfoRate: 5, filterFreq: 900 },   // L10: climactic
    ];

    function startMusic(levelIndex) {
        if (!musicEnabled) return;
        stopMusic();
        ensureCtx();
        const mood = levelMoods[levelIndex] || levelMoods[0];

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();

        osc1.type = mood.type;
        osc1.frequency.value = mood.baseFreq;
        osc2.type = 'sine';
        osc2.frequency.value = mood.baseFreq * 1.5;

        lfo.type = 'sine';
        lfo.frequency.value = mood.lfoRate;
        lfoGain.gain.value = 20;
        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);

        filter.type = 'lowpass';
        filter.frequency.value = mood.filterFreq;
        filter.Q.value = 2;

        g.gain.value = 0;
        g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(g);
        g.connect(musicGain);

        osc1.start();
        osc2.start();
        lfo.start();

        currentMusic = { osc1, osc2, lfo, lfoGain, filter, gain: g };
    }

    function stopMusic() {
        if (currentMusic) {
            try {
                currentMusic.gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                setTimeout(() => {
                    try {
                        currentMusic.osc1.stop();
                        currentMusic.osc2.stop();
                        currentMusic.lfo.stop();
                    } catch(e) {}
                    currentMusic = null;
                }, 600);
            } catch(e) {
                currentMusic = null;
            }
        }
    }

    return { init, sfx, startMusic, stopMusic, ensureCtx };
})();
