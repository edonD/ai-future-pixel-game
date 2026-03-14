// Core engine — game loop, input, camera, collision
const Engine = (() => {
    // Native resolution
    const WIDTH = 320;
    const HEIGHT = 180;
    const TILE = 16;
    const GRAVITY = 0.5;
    const MAX_FALL = 8;

    let canvas, ctxCanvas;
    let lastTime = 0;
    let running = false;
    let updateFn = null;
    let renderFn = null;

    // Camera
    const camera = { x: 0, y: 0, targetX: 0, targetY: 0, shake: 0 };

    // Input state
    const keys = {};
    const justPressed = {};
    const prevKeys = {};

    function init() {
        canvas = document.getElementById('gameCanvas');
        ctxCanvas = canvas.getContext('2d');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        resize();
        window.addEventListener('resize', resize);

        // Keyboard
        window.addEventListener('keydown', e => {
            e.preventDefault();
            keys[e.code] = true;
        });
        window.addEventListener('keyup', e => {
            e.preventDefault();
            keys[e.code] = false;
        });

        // Touch controls
        setupTouch();
    }

    function setupTouch() {
        const map = {
            'btn-up': 'ArrowUp',
            'btn-down': 'ArrowDown',
            'btn-left': 'ArrowLeft',
            'btn-right': 'ArrowRight',
            'btn-jump': 'Space',
            'btn-attack': 'KeyX'
        };
        for (const [id, code] of Object.entries(map)) {
            const el = document.getElementById(id);
            if (!el) continue;
            el.addEventListener('touchstart', e => { e.preventDefault(); keys[code] = true; }, { passive: false });
            el.addEventListener('touchend', e => { e.preventDefault(); keys[code] = false; }, { passive: false });
            el.addEventListener('touchcancel', e => { keys[code] = false; });
        }
    }

    function resize() {
        const scaleX = window.innerWidth / WIDTH;
        const scaleY = window.innerHeight / HEIGHT;
        const scale = Math.floor(Math.min(scaleX, scaleY)) || 1;
        canvas.style.width = (WIDTH * scale) + 'px';
        canvas.style.height = (HEIGHT * scale) + 'px';
    }

    function isPressed(code) {
        return !!keys[code];
    }

    function wasJustPressed(code) {
        return !!justPressed[code];
    }

    function left() { return isPressed('ArrowLeft') || isPressed('KeyA'); }
    function right() { return isPressed('ArrowRight') || isPressed('KeyD'); }
    function up() { return isPressed('ArrowUp') || isPressed('KeyW'); }
    function down() { return isPressed('ArrowDown') || isPressed('KeyS'); }
    function jump() { return wasJustPressed('Space') || wasJustPressed('ArrowUp') || wasJustPressed('KeyW') || wasJustPressed('KeyZ'); }
    function jumpHeld() { return isPressed('Space') || isPressed('ArrowUp') || isPressed('KeyW') || isPressed('KeyZ'); }
    function attack() { return wasJustPressed('KeyX') || wasJustPressed('ShiftLeft') || wasJustPressed('ShiftRight'); }
    function pause() { return wasJustPressed('Escape') || wasJustPressed('KeyP'); }
    function enter() { return wasJustPressed('Enter') || wasJustPressed('Space'); }

    function updateInput() {
        for (const code in keys) {
            justPressed[code] = keys[code] && !prevKeys[code];
        }
        Object.assign(prevKeys, keys);
    }

    // Camera
    function updateCamera(targetX, targetY, levelW, levelH) {
        camera.targetX = targetX - WIDTH / 2;
        camera.targetY = targetY - HEIGHT / 2;

        camera.x += (camera.targetX - camera.x) * 0.1;
        camera.y += (camera.targetY - camera.y) * 0.1;

        // Clamp
        camera.x = Math.max(0, Math.min(camera.x, levelW - WIDTH));
        camera.y = Math.max(0, Math.min(camera.y, levelH - HEIGHT));

        // Shake
        if (camera.shake > 0) {
            camera.shake *= 0.9;
            if (camera.shake < 0.5) camera.shake = 0;
        }
    }

    function shakeCamera(amount) {
        camera.shake = amount;
    }

    function getCameraOffset() {
        let sx = camera.shake > 0 ? (Math.random() - 0.5) * camera.shake : 0;
        let sy = camera.shake > 0 ? (Math.random() - 0.5) * camera.shake : 0;
        return { x: Math.floor(camera.x + sx), y: Math.floor(camera.y + sy) };
    }

    // AABB collision
    function aabb(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    // Tile collision
    function getTile(level, tx, ty) {
        if (tx < 0 || ty < 0 || tx >= level.width || ty >= level.height) return 1;
        return level.tiles[ty * level.width + tx] || 0;
    }

    function isSolid(tileId) {
        return tileId === 1 || tileId === 2 || tileId === 3;
    }

    function isPlatform(tileId) {
        return tileId === 4;
    }

    function isHazard(tileId) {
        return tileId === 5;
    }

    function resolveCollisions(entity, level) {
        // Horizontal
        entity.x += entity.vx;
        const left = Math.floor(entity.x / TILE);
        const right = Math.floor((entity.x + entity.w - 1) / TILE);
        const top = Math.floor(entity.y / TILE);
        const bottom = Math.floor((entity.y + entity.h - 1) / TILE);

        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                const t = getTile(level, tx, ty);
                if (isSolid(t)) {
                    if (entity.vx > 0) {
                        entity.x = tx * TILE - entity.w;
                        entity.vx = 0;
                        entity.wallRight = true;
                    } else if (entity.vx < 0) {
                        entity.x = (tx + 1) * TILE;
                        entity.vx = 0;
                        entity.wallLeft = true;
                    }
                }
            }
        }

        // Vertical
        entity.y += entity.vy;
        const left2 = Math.floor(entity.x / TILE);
        const right2 = Math.floor((entity.x + entity.w - 1) / TILE);
        const top2 = Math.floor(entity.y / TILE);
        const bottom2 = Math.floor((entity.y + entity.h - 1) / TILE);

        entity.onGround = false;
        entity.hitCeiling = false;
        entity.onHazard = false;

        for (let ty = top2; ty <= bottom2; ty++) {
            for (let tx = left2; tx <= right2; tx++) {
                const t = getTile(level, tx, ty);
                if (isHazard(t)) {
                    entity.onHazard = true;
                }
                const solid = isSolid(t);
                const platform = isPlatform(t);
                if (solid || (platform && entity.vy >= 0 && (entity.y + entity.h - entity.vy) <= ty * TILE + 2)) {
                    if (entity.vy > 0) {
                        entity.y = ty * TILE - entity.h;
                        entity.vy = 0;
                        entity.onGround = true;
                    } else if (entity.vy < 0 && solid) {
                        entity.y = (ty + 1) * TILE;
                        entity.vy = 0;
                        entity.hitCeiling = true;
                    }
                }
            }
        }
    }

    // Game loop
    function gameLoop(timestamp) {
        if (!running) return;
        const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
        lastTime = timestamp;

        updateInput();
        if (updateFn) updateFn(dt);

        ctxCanvas.clearRect(0, 0, WIDTH, HEIGHT);
        if (renderFn) renderFn(ctxCanvas);

        requestAnimationFrame(gameLoop);
    }

    function start(update, render) {
        updateFn = update;
        renderFn = render;
        running = true;
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    function stop() {
        running = false;
    }

    return {
        WIDTH, HEIGHT, TILE, GRAVITY, MAX_FALL,
        init, start, stop, resize,
        left, right, up, down, jump, jumpHeld, attack, pause, enter,
        isPressed, wasJustPressed,
        updateCamera, shakeCamera, getCameraOffset, camera,
        aabb, getTile, isSolid, isPlatform, isHazard, resolveCollisions,
        get canvas() { return canvas; },
        get ctx() { return ctxCanvas; }
    };
})();
