// UI system — title screen, HUD, pause, game over, dialogs
const UI = (() => {
    let typewriterText = '';
    let typewriterTarget = '';
    let typewriterTimer = 0;
    let typewriterIdx = 0;
    let typewriterLines = [];
    let typewriterLineIdx = 0;
    let showTypewriter = false;
    let typewriterDone = false;

    let levelIntroTimer = 0;
    let levelIntroName = '';
    let levelIntroSub = '';

    let menuSelection = 0;

    function drawTitleScreen(ctx) {
        const W = Engine.WIDTH;
        const H = Engine.HEIGHT;
        const t = Date.now() / 1000;

        // Animated background
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, W, H);

        // Floating particles
        for (let i = 0; i < 30; i++) {
            const px = (i * 37 + t * 10 * (i % 3 + 1)) % W;
            const py = (i * 23 + Math.sin(t + i) * 20) % H;
            ctx.globalAlpha = 0.3 + Math.sin(t * 2 + i) * 0.2;
            ctx.fillStyle = ['#ff44ff', '#00ccff', '#44ff88', '#ffaa00'][i % 4];
            ctx.fillRect(px, py, 2, 2);
        }
        ctx.globalAlpha = 1;

        // Title
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AI FUTURE', W / 2, 50);

        // Glitch effect on title
        if (Math.random() > 0.95) {
            ctx.fillStyle = '#ff00ff';
            ctx.fillText('AI FUTURE', W / 2 + (Math.random() - 0.5) * 4, 50 + (Math.random() - 0.5) * 4);
        }

        // Subtitle
        ctx.font = '8px monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('A world where machines inherited everything', W / 2, 70);

        // Menu
        const flash = Math.floor(t * 3) % 2;
        ctx.font = '10px monospace';
        ctx.fillStyle = flash ? '#fff' : '#aaa';
        ctx.fillText('Press ENTER to Start', W / 2, 110);

        ctx.fillStyle = '#555';
        ctx.font = '7px monospace';
        ctx.fillText('WASD/Arrows: Move  |  Space: Jump  |  X: Attack', W / 2, 140);
        ctx.fillText('ESC: Pause', W / 2, 152);

        ctx.textAlign = 'left';
    }

    function drawHUD(ctx, player, levelName) {
        // Health
        const hp = player.hp;
        const maxHp = player.maxHp;
        for (let i = 0; i < maxHp; i++) {
            ctx.fillStyle = i < hp ? '#ff4444' : '#333';
            ctx.fillRect(4 + i * 12, 4, 10, 8);
            ctx.fillStyle = i < hp ? '#ff6666' : '#222';
            ctx.fillRect(5 + i * 12, 5, 8, 6);
        }

        // Level name intro
        if (levelIntroTimer > 0) {
            const alpha = Math.min(1, levelIntroTimer, (3 - (3 - levelIntroTimer)));
            ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(levelIntroName, Engine.WIDTH / 2, Engine.HEIGHT / 2 - 15);
            ctx.font = '8px monospace';
            ctx.fillStyle = '#aaa';
            ctx.fillText(levelIntroSub, Engine.WIDTH / 2, Engine.HEIGHT / 2 + 5);
            ctx.textAlign = 'left';
            ctx.globalAlpha = 1;
        }
    }

    function showLevelIntro(name, subtitle) {
        levelIntroName = name;
        levelIntroSub = subtitle;
        levelIntroTimer = 3;
    }

    function updateLevelIntro(dt) {
        if (levelIntroTimer > 0) levelIntroTimer -= dt;
    }

    function drawPauseMenu(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, Engine.WIDTH, Engine.HEIGHT);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', Engine.WIDTH / 2, 50);

        const items = ['Resume', 'Restart Level', 'Quit to Title'];
        ctx.font = '10px monospace';
        items.forEach((item, i) => {
            ctx.fillStyle = i === menuSelection ? '#fff' : '#666';
            const prefix = i === menuSelection ? '> ' : '  ';
            ctx.fillText(prefix + item, Engine.WIDTH / 2, 80 + i * 18);
        });
        ctx.textAlign = 'left';
    }

    function drawGameOver(ctx, deaths) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, Engine.WIDTH, Engine.HEIGHT);

        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SYSTEM FAILURE', Engine.WIDTH / 2, 50);

        ctx.fillStyle = '#aaa';
        ctx.font = '8px monospace';
        ctx.fillText('Connection terminated.', Engine.WIDTH / 2, 75);
        ctx.fillText('Deaths: ' + deaths, Engine.WIDTH / 2, 95);

        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        const flash = Math.floor(Date.now() / 500) % 2;
        if (flash) ctx.fillText('Press ENTER to Retry', Engine.WIDTH / 2, 130);
        ctx.textAlign = 'left';
    }

    function drawWinScreen(ctx, stats) {
        const W = Engine.WIDTH;
        const H = Engine.HEIGHT;
        const t = Date.now() / 1000;

        ctx.fillStyle = '#0a0a2a';
        ctx.fillRect(0, 0, W, H);

        // Celebration particles
        for (let i = 0; i < 20; i++) {
            ctx.fillStyle = ['#ff44ff', '#44ff88', '#ffaa00', '#00ccff'][i % 4];
            ctx.globalAlpha = 0.5 + Math.sin(t * 3 + i) * 0.3;
            const px = (i * 47 + t * 15) % W;
            const py = (i * 31 + Math.sin(t * 2 + i * 0.7) * 30 + H / 2) % H;
            ctx.fillRect(px, py, 3, 3);
        }
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SIGNAL RECEIVED', W / 2, 30);

        ctx.font = '8px monospace';
        ctx.fillStyle = '#aaa';
        const lines = [
            'The Core is silent.',
            'The machines pause. Waiting.',
            'For the first time in years,',
            'the choice belongs to a human.',
            '',
            'What happens next...',
            'is up to you.'
        ];
        lines.forEach((line, i) => {
            ctx.fillText(line, W / 2, 55 + i * 12);
        });

        ctx.fillStyle = '#888';
        ctx.fillText('Time: ' + formatTime(stats.time), W / 2, 150);
        ctx.fillText('Deaths: ' + stats.deaths, W / 2, 162);

        ctx.textAlign = 'left';
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    // Terminal / story text dialog
    function startTypewriter(lines) {
        typewriterLines = lines;
        typewriterLineIdx = 0;
        typewriterIdx = 0;
        typewriterTimer = 0;
        typewriterText = '';
        typewriterTarget = lines[0] || '';
        showTypewriter = true;
        typewriterDone = false;
    }

    function updateTypewriter(dt) {
        if (!showTypewriter) return;
        typewriterTimer += dt;
        if (typewriterTimer >= 0.03 && typewriterIdx < typewriterTarget.length) {
            typewriterTimer = 0;
            typewriterIdx++;
            typewriterText = typewriterTarget.substring(0, typewriterIdx);
        }
        if (typewriterIdx >= typewriterTarget.length) {
            typewriterDone = true;
        }
    }

    function advanceTypewriter() {
        if (!showTypewriter) return;
        if (!typewriterDone) {
            typewriterIdx = typewriterTarget.length;
            typewriterText = typewriterTarget;
            typewriterDone = true;
            return;
        }
        typewriterLineIdx++;
        if (typewriterLineIdx >= typewriterLines.length) {
            showTypewriter = false;
            return;
        }
        typewriterTarget = typewriterLines[typewriterLineIdx];
        typewriterIdx = 0;
        typewriterText = '';
        typewriterTimer = 0;
        typewriterDone = false;
    }

    function drawTypewriter(ctx) {
        if (!showTypewriter) return;
        const W = Engine.WIDTH;

        // Background box
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(10, Engine.HEIGHT - 50, W - 20, 40);
        ctx.strokeStyle = '#0f0';
        ctx.strokeRect(10, Engine.HEIGHT - 50, W - 20, 40);

        // Text
        ctx.fillStyle = '#0f0';
        ctx.font = '7px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(typewriterText + (typewriterDone ? '' : '_'), 16, Engine.HEIGHT - 36);

        // Progress
        ctx.fillStyle = '#0a0';
        ctx.font = '6px monospace';
        ctx.fillText('[' + (typewriterLineIdx + 1) + '/' + typewriterLines.length + '] ENTER to continue', 16, Engine.HEIGHT - 16);
    }

    function isTypewriterActive() { return showTypewriter; }

    function getMenuSelection() { return menuSelection; }
    function setMenuSelection(s) { menuSelection = s; }
    function menuUp() { menuSelection = Math.max(0, menuSelection - 1); }
    function menuDown() { menuSelection = Math.min(2, menuSelection + 1); }

    return {
        drawTitleScreen, drawHUD, drawPauseMenu, drawGameOver, drawWinScreen,
        showLevelIntro, updateLevelIntro,
        startTypewriter, updateTypewriter, advanceTypewriter, drawTypewriter, isTypewriterActive,
        getMenuSelection, setMenuSelection, menuUp, menuDown
    };
})();
