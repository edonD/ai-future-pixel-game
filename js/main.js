// Main — bootstrap, state management, game orchestration
(() => {
    // Game states
    const STATE = { TITLE: 0, PLAYING: 1, PAUSED: 2, GAME_OVER: 3, WIN: 4 };
    let state = STATE.TITLE;
    let currentLevel = 0;
    let level = null;
    let player = null;
    let movingPlatforms = [];
    let totalDeaths = 0;
    let totalTime = 0;
    let transitioning = false;
    let terminalInteracted = {}; // track which terminals were read
    let bossDefeated = false;
    let audioStarted = false;

    function startGame() {
        currentLevel = 0;
        totalDeaths = 0;
        totalTime = 0;
        bossDefeated = false;
        terminalInteracted = {};
        loadLevel(0);
        state = STATE.PLAYING;
        if (!audioStarted) {
            Audio.init();
            audioStarted = true;
        }
        Audio.startMusic(0);
    }

    function loadLevel(idx) {
        currentLevel = idx;
        const data = Levels.buildLevel(idx);
        level = {
            width: data.width,
            height: data.height,
            tiles: data.tiles,
            name: data.name,
            subtitle: data.subtitle,
            storyText: data.storyText,
            conveyorSpeed: data.conveyorSpeed || 0,
            lowGravity: data.lowGravity || false,
            boss: data.boss || null,
        };

        // Create player
        player = Player.create(data.spawnX, data.spawnY);

        // Reset enemies
        Enemies.reset();

        // Spawn enemies
        if (data.enemies) {
            data.enemies.forEach(e => {
                Enemies.spawn(e.type, e.x, e.y, e.props || {});
            });
        }

        // Spawn boss
        if (data.boss) {
            Enemies.spawn(data.boss.type, data.boss.x, data.boss.y, data.boss.props || {});
        }

        // Setup moving platforms
        movingPlatforms = (data.movingPlatforms || []).map(p => ({
            ...p,
            cx: p.x,
            cy: p.y,
            progress: 0,
            dir: 1,
        }));

        // Show level intro
        UI.showLevelIntro(data.name, data.subtitle);

        // Start music
        Audio.startMusic(idx);

        transitioning = false;
    }

    function update(dt) {
        switch (state) {
            case STATE.TITLE:
                if (Engine.enter()) {
                    if (!audioStarted) {
                        Audio.init();
                        audioStarted = true;
                    }
                    Audio.sfx.menuConfirm();
                    startGame();
                }
                break;

            case STATE.PLAYING:
                updatePlaying(dt);
                break;

            case STATE.PAUSED:
                updatePaused();
                break;

            case STATE.GAME_OVER:
                if (Engine.enter()) {
                    Audio.sfx.menuConfirm();
                    loadLevel(currentLevel);
                    state = STATE.PLAYING;
                }
                break;

            case STATE.WIN:
                if (Engine.enter()) {
                    Audio.sfx.menuConfirm();
                    state = STATE.TITLE;
                    Audio.stopMusic();
                }
                break;
        }
    }

    function updatePlaying(dt) {
        if (transitioning) {
            const still = Renderer.updateTransition(dt);
            if (!still) transitioning = false;
            return;
        }

        // Pause
        if (Engine.pause()) {
            state = STATE.PAUSED;
            UI.setMenuSelection(0);
            Audio.sfx.menuSelect();
            return;
        }

        // Typewriter dialog
        if (UI.isTypewriterActive()) {
            UI.updateTypewriter(dt);
            if (Engine.enter()) {
                UI.advanceTypewriter();
                Audio.sfx.menuSelect();
            }
            return; // Don't update game while reading
        }

        // Update timer
        totalTime += dt;

        // Update player
        Player.update(dt, level, level.lowGravity);
        player = Player.get();

        // Conveyor belt effect
        if (level.conveyorSpeed && player.onGround) {
            const tx = Math.floor((player.x + player.w / 2) / Engine.TILE);
            const ty = Math.floor((player.y + player.h) / Engine.TILE);
            const tile = Engine.getTile(level, tx, ty);
            if (tile === 9) {
                player.x += level.conveyorSpeed;
            }
        }

        // Update moving platforms
        updateMovingPlatforms(dt);

        // Check player on moving platform
        for (const mp of movingPlatforms) {
            const onTop = player.vy >= 0 &&
                player.x + player.w > mp.cx + 2 &&
                player.x < mp.cx + mp.w - 2 &&
                player.y + player.h >= mp.cy - 2 &&
                player.y + player.h <= mp.cy + mp.h + 6;
            if (onTop) {
                player.y = mp.cy - player.h;
                player.vy = 0;
                player.onGround = true;
                player.x += mp.dx || 0;
            }
        }

        // Update enemies
        Enemies.update(dt, player, level);

        // Player-enemy collision
        const attackBox = Player.getAttackBox();
        for (const enemy of Enemies.getAll()) {
            if (!enemy.active) continue;

            // Attack hits enemy
            if (attackBox && !player.attackHit && Engine.aabb(attackBox, enemy)) {
                Enemies.hitEnemy(enemy, 1);
                player.attackHit = true;
            }

            // Enemy touches player
            if (Engine.aabb(
                { x: player.x + 2, y: player.y + 2, w: player.w - 4, h: player.h - 4 },
                { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h }
            )) {
                Player.takeDamage(1);
            }
        }

        // Projectile already handled in Enemies.update

        // Check tile interactions
        checkTileInteractions();

        // Check boss defeated
        if (level.boss && !bossDefeated) {
            const bossEnemy = Enemies.getAll().find(e => e.type === 'boss');
            if (bossEnemy && (bossEnemy.hp <= 0 || !bossEnemy.active)) {
                bossDefeated = true;
                // Place exit at center of arena floor
                const tx = Math.floor(level.width / 2);
                const ty = level.height - 3;
                if (ty >= 0 && tx >= 0 && ty * level.width + tx < level.tiles.length) {
                    level.tiles[ty * level.width + tx] = 7;
                }
                Audio.sfx.levelComplete();
                Renderer.flash('#fff');
                Engine.shakeCamera(15);
            }
        }

        // Track deaths
        if (player.dead) {
            totalDeaths = player.deaths;
        }

        // Update camera
        Engine.updateCamera(
            player.x + player.w / 2,
            player.y + player.h / 2,
            level.width * Engine.TILE,
            level.height * Engine.TILE
        );

        // Update level intro
        UI.updateLevelIntro(dt);

        // Ambient particles
        const cam = Engine.getCameraOffset();
        Renderer.addAmbientParticles(cam.x, cam.y, currentLevel);
        Renderer.updateParticles(dt);
    }

    function updateMovingPlatforms(dt) {
        for (const mp of movingPlatforms) {
            const prevX = mp.cx;
            const prevY = mp.cy;

            mp.progress += mp.speed * dt * mp.dir;
            if (mp.progress >= 1) { mp.progress = 1; mp.dir = -1; }
            if (mp.progress <= 0) { mp.progress = 0; mp.dir = 1; }

            mp.cx = mp.x + (mp.ex - mp.x) * mp.progress;
            mp.cy = mp.y + (mp.ey - mp.y) * mp.progress;

            mp.dx = mp.cx - prevX;
            mp.dy = mp.cy - prevY;
        }
    }

    function checkTileInteractions() {
        const px = Math.floor((player.x + player.w / 2) / Engine.TILE);
        const py = Math.floor((player.y + player.h / 2) / Engine.TILE);

        // Check adjacent tiles
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = px + dx;
                const ty = py + dy;
                const tile = Engine.getTile(level, tx, ty);

                // Checkpoint
                if (tile === 6) {
                    const key = currentLevel + '_' + tx + '_' + ty;
                    if (!terminalInteracted[key + '_cp']) {
                        terminalInteracted[key + '_cp'] = true;
                        Player.setCheckpoint(tx * Engine.TILE, ty * Engine.TILE - player.h);
                        Audio.sfx.checkpoint();
                    }
                }

                // Exit — check player center is near exit tile center
                if (tile === 7 &&
                    Math.abs((player.x + player.w / 2) - (tx * Engine.TILE + 8)) < 16 &&
                    Math.abs((player.y + player.h / 2) - (ty * Engine.TILE + 8)) < 20) {
                    nextLevel();
                    return;
                }

                // Terminal / story
                if (tile === 8 && Engine.enter()) {
                    const key = currentLevel + '_' + tx + '_' + ty;
                    if (!terminalInteracted[key]) {
                        terminalInteracted[key] = true;
                        UI.startTypewriter(level.storyText || ["No data found."]);
                        Audio.sfx.menuSelect();
                    }
                }
            }
        }
    }

    function nextLevel() {
        if (currentLevel >= 9) {
            // Win!
            state = STATE.WIN;
            Audio.sfx.levelComplete();
            Audio.stopMusic();
            return;
        }

        Audio.sfx.levelComplete();
        transitioning = true;
        Renderer.startTransition(() => {
            loadLevel(currentLevel + 1);
        });
    }

    function updatePaused() {
        if (Engine.pause()) {
            state = STATE.PLAYING;
            Audio.sfx.menuSelect();
            return;
        }
        if (Engine.wasJustPressed('ArrowUp') || Engine.wasJustPressed('KeyW')) {
            UI.menuUp();
            Audio.sfx.menuSelect();
        }
        if (Engine.wasJustPressed('ArrowDown') || Engine.wasJustPressed('KeyS')) {
            UI.menuDown();
            Audio.sfx.menuSelect();
        }
        if (Engine.enter()) {
            const sel = UI.getMenuSelection();
            Audio.sfx.menuConfirm();
            if (sel === 0) {
                state = STATE.PLAYING;
            } else if (sel === 1) {
                loadLevel(currentLevel);
                state = STATE.PLAYING;
            } else if (sel === 2) {
                state = STATE.TITLE;
                Audio.stopMusic();
            }
        }
    }

    function render(ctx) {
        switch (state) {
            case STATE.TITLE:
                UI.drawTitleScreen(ctx);
                break;

            case STATE.PLAYING:
            case STATE.PAUSED:
                renderGame(ctx);
                if (state === STATE.PAUSED) {
                    UI.drawPauseMenu(ctx);
                }
                break;

            case STATE.GAME_OVER:
                renderGame(ctx);
                UI.drawGameOver(ctx, totalDeaths);
                break;

            case STATE.WIN:
                UI.drawWinScreen(ctx, { time: totalTime, deaths: totalDeaths });
                break;
        }
    }

    function renderGame(ctx) {
        const cam = Engine.getCameraOffset();

        // Background
        Renderer.drawBackground(ctx, currentLevel, cam.x, cam.y);

        // Tiles
        Renderer.drawTiles(ctx, level, currentLevel, cam.x, cam.y);

        // Moving platforms
        for (const mp of movingPlatforms) {
            const pal = Renderer.getPalette(currentLevel);
            ctx.fillStyle = pal.accent;
            ctx.fillRect(Math.floor(mp.cx - cam.x), Math.floor(mp.cy - cam.y), mp.w, mp.h);
            ctx.fillStyle = pal.wall;
            ctx.fillRect(Math.floor(mp.cx - cam.x) + 2, Math.floor(mp.cy - cam.y) + 2, mp.w - 4, mp.h - 4);
        }

        // Enemies
        for (const enemy of Enemies.getAll()) {
            if (enemy.active) Renderer.drawEnemy(ctx, enemy, cam.x, cam.y);
        }

        // Projectiles
        for (const proj of Enemies.getProjectiles()) {
            Renderer.drawProjectile(ctx, proj, cam.x, cam.y);
        }

        // Player
        if (player && !player.dead) {
            Renderer.drawPlayer(ctx, player, cam.x, cam.y);
        }

        // Particles
        Renderer.drawParticles(ctx, cam.x, cam.y);

        // Terminal proximity prompt
        if (player && level && !UI.isTypewriterActive()) {
            const px = Math.floor((player.x + player.w / 2) / Engine.TILE);
            const py = Math.floor((player.y + player.h / 2) / Engine.TILE);
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const tile = Engine.getTile(level, px + dx, py + dy);
                    if (tile === 8) {
                        const sx = (px + dx) * Engine.TILE - cam.x;
                        const sy = (py + dy) * Engine.TILE - cam.y - 10;
                        ctx.fillStyle = '#0f0';
                        ctx.font = '6px monospace';
                        ctx.textAlign = 'center';
                        ctx.fillText('ENTER', sx + 8, sy);
                        ctx.textAlign = 'left';
                    }
                }
            }
        }

        // HUD
        UI.drawHUD(ctx, player || { hp: 0, maxHp: 5 }, level ? level.name : '');

        // Typewriter dialog
        UI.drawTypewriter(ctx);

        // Screen effects
        Renderer.drawFlash(ctx);
        Renderer.drawTransition(ctx);
    }

    // Initialize and start
    Engine.init();
    Engine.start(update, render);
})();
