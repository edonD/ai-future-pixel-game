// Rendering system — pixel art, sprites, backgrounds, effects
const Renderer = (() => {
    const particles = [];
    let screenFlash = 0;
    let screenFlashColor = '#fff';
    let transitionAlpha = 0;
    let transitionDir = 0; // 1 = fading in, -1 = fading out
    let transitionCallback = null;

    // Color palettes per level
    const palettes = [
        // L1: Abandoned District — muted greens, greys
        { bg: '#1a1a2e', wall: '#3d3d56', ground: '#4a4a6a', accent: '#6b8e6b', sky: ['#1a1a2e', '#2d2d44'] },
        // L2: Algorithm City — neon blue, white
        { bg: '#0a0a1a', wall: '#1a3a5c', ground: '#2a4a7c', accent: '#00ccff', sky: ['#0a0a1a', '#0d1b2a'] },
        // L3: Drone Fields — golden, grey
        { bg: '#2a2a1a', wall: '#5a5a3a', ground: '#6a6a4a', accent: '#ccaa44', sky: ['#3a3a2a', '#4a4a3a'] },
        // L4: Machine Factory — orange, red, dark
        { bg: '#1a0a0a', wall: '#4a2a1a', ground: '#5a3a2a', accent: '#ff6633', sky: ['#1a0a0a', '#2a1a0a'] },
        // L5: Synthetic Wilderness — artificial green
        { bg: '#0a1a0a', wall: '#2a4a2a', ground: '#3a5a3a', accent: '#44ff88', sky: ['#0a1a0a', '#1a2a1a'] },
        // L6: Surveillance Grid — red, black
        { bg: '#0a0a0a', wall: '#2a1a1a', ground: '#3a2a2a', accent: '#ff2244', sky: ['#0a0a0a', '#1a0a0a'] },
        // L7: Server Cathedral — blue-white
        { bg: '#0a0a2a', wall: '#1a2a5a', ground: '#2a3a6a', accent: '#aaccff', sky: ['#0a0a2a', '#0d1540'] },
        // L8: Data Ocean — purple, cyan
        { bg: '#0a0a1a', wall: '#2a1a3a', ground: '#3a2a4a', accent: '#aa44ff', sky: ['#0a0a1a', '#1a0a2a'] },
        // L9: Resistance Ruins — warm firelight
        { bg: '#1a1208', wall: '#4a3a2a', ground: '#5a4a3a', accent: '#ffaa44', sky: ['#1a1208', '#2a2218'] },
        // L10: The Core — all colors
        { bg: '#0a0a0a', wall: '#3a2a3a', ground: '#4a3a4a', accent: '#ff44ff', sky: ['#0a0a0a', '#1a1a2a'] },
    ];

    function getPalette(levelIdx) {
        return palettes[levelIdx] || palettes[0];
    }

    // Draw parallax background
    function drawBackground(ctx, levelIdx, camX, camY) {
        const pal = getPalette(levelIdx);
        const W = Engine.WIDTH;
        const H = Engine.HEIGHT;

        // Gradient sky
        const grd = ctx.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, pal.sky[0]);
        grd.addColorStop(1, pal.sky[1]);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);

        // Background layer 1 — distant shapes
        ctx.globalAlpha = 0.3;
        const scrollX1 = camX * 0.1;
        drawBgLayer(ctx, levelIdx, scrollX1, H, 0.3);
        ctx.globalAlpha = 0.5;
        // Background layer 2 — mid shapes
        const scrollX2 = camX * 0.3;
        drawBgLayer(ctx, levelIdx, scrollX2, H, 0.6);
        ctx.globalAlpha = 1;
    }

    function drawBgLayer(ctx, levelIdx, scrollX, H, scale) {
        const pal = getPalette(levelIdx);
        ctx.fillStyle = pal.wall;
        const offset = -scrollX % 80;
        for (let i = -1; i < 6; i++) {
            const x = offset + i * 80;
            const h = 30 + Math.sin(i * 2.3 + levelIdx) * 20;
            ctx.fillRect(x, H - h * scale, 40, h * scale);
            ctx.fillRect(x + 20, H - h * scale - 10 * scale, 20, 10 * scale);
        }
    }

    // Draw tile map
    function drawTiles(ctx, level, levelIdx, camX, camY) {
        const pal = getPalette(levelIdx);
        const T = Engine.TILE;
        const startX = Math.floor(camX / T);
        const startY = Math.floor(camY / T);
        const endX = startX + Math.ceil(Engine.WIDTH / T) + 1;
        const endY = startY + Math.ceil(Engine.HEIGHT / T) + 1;

        for (let ty = startY; ty <= endY; ty++) {
            for (let tx = startX; tx <= endX; tx++) {
                const tile = Engine.getTile(level, tx, ty);
                if (tile === 0) continue;
                const sx = tx * T - camX;
                const sy = ty * T - camY;

                switch (tile) {
                    case 1: // Solid wall
                        ctx.fillStyle = pal.wall;
                        ctx.fillRect(sx, sy, T, T);
                        // Edge detail
                        ctx.fillStyle = pal.ground;
                        ctx.fillRect(sx, sy, T, 2);
                        break;
                    case 2: // Ground
                        ctx.fillStyle = pal.ground;
                        ctx.fillRect(sx, sy, T, T);
                        // Grass/detail on top
                        ctx.fillStyle = pal.accent;
                        ctx.fillRect(sx, sy, T, 2);
                        ctx.fillRect(sx + 3, sy - 1, 2, 2);
                        ctx.fillRect(sx + 10, sy - 2, 2, 3);
                        break;
                    case 3: // Decorative solid
                        ctx.fillStyle = pal.accent;
                        ctx.fillRect(sx, sy, T, T);
                        ctx.fillStyle = pal.wall;
                        ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
                        break;
                    case 4: // Platform
                        ctx.fillStyle = pal.accent;
                        ctx.fillRect(sx, sy, T, 4);
                        ctx.fillStyle = pal.wall;
                        ctx.fillRect(sx + 2, sy + 4, T - 4, 2);
                        break;
                    case 5: // Hazard (spikes)
                        ctx.fillStyle = '#ff3333';
                        for (let i = 0; i < 4; i++) {
                            ctx.beginPath();
                            ctx.moveTo(sx + i * 4, sy + T);
                            ctx.lineTo(sx + i * 4 + 2, sy + 4);
                            ctx.lineTo(sx + i * 4 + 4, sy + T);
                            ctx.fill();
                        }
                        break;
                    case 6: // Checkpoint
                        ctx.fillStyle = '#44aaff';
                        ctx.fillRect(sx + 6, sy, 4, T);
                        ctx.fillStyle = '#88ccff';
                        ctx.fillRect(sx + 4, sy, 8, 4);
                        break;
                    case 7: // Exit
                        ctx.fillStyle = '#44ff88';
                        ctx.fillRect(sx + 2, sy, T - 4, T);
                        ctx.fillStyle = '#88ffaa';
                        ctx.fillRect(sx + 4, sy + 2, T - 8, T - 4);
                        // Pulsing glow
                        ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.2;
                        ctx.fillStyle = '#aaffcc';
                        ctx.fillRect(sx, sy, T, T);
                        ctx.globalAlpha = 1;
                        break;
                    case 8: // Terminal/story
                        ctx.fillStyle = '#333';
                        ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
                        ctx.fillStyle = '#0f0';
                        ctx.fillRect(sx + 3, sy + 3, T - 6, T - 6);
                        // Blinking cursor
                        if (Math.floor(Date.now() / 500) % 2) {
                            ctx.fillStyle = '#000';
                            ctx.fillRect(sx + 5, sy + 8, 4, 2);
                        }
                        break;
                    case 9: // Conveyor belt (right)
                        ctx.fillStyle = pal.ground;
                        ctx.fillRect(sx, sy, T, T);
                        ctx.fillStyle = pal.accent;
                        const coff = (Date.now() / 100) % T;
                        for (let i = 0; i < 3; i++) {
                            ctx.fillRect(sx + ((coff + i * 6) % T), sy + 6, 4, 2);
                        }
                        break;
                    case 10: // Moving platform marker (invisible, logic only)
                        break;
                }
            }
        }
    }

    // Draw player sprite procedurally
    function drawPlayer(ctx, player, camX, camY) {
        const px = Math.floor(player.x - camX);
        const py = Math.floor(player.y - camY);

        // Invincibility flash
        if (player.invincible > 0 && Math.floor(player.invincible * 10) % 2) return;

        ctx.save();
        if (player.facing < 0) {
            ctx.translate(px + player.w, py);
            ctx.scale(-1, 1);
        } else {
            ctx.translate(px, py);
        }

        // Body
        ctx.fillStyle = '#4488cc';
        ctx.fillRect(2, 4, 8, 10);
        // Head
        ctx.fillStyle = '#ffcc88';
        ctx.fillRect(3, 0, 6, 5);
        // Eye
        ctx.fillStyle = '#fff';
        ctx.fillRect(7, 1, 2, 2);
        ctx.fillStyle = '#222';
        ctx.fillRect(8, 2, 1, 1);
        // Legs animation
        ctx.fillStyle = '#335577';
        if (player.onGround) {
            const walk = Math.floor(player.animTimer * 8) % 2;
            if (Math.abs(player.vx) > 0.5) {
                ctx.fillRect(3, 14, 3, walk ? 4 : 3);
                ctx.fillRect(7, 14, 3, walk ? 3 : 4);
            } else {
                ctx.fillRect(3, 14, 3, 3);
                ctx.fillRect(7, 14, 3, 3);
            }
        } else {
            // In air
            ctx.fillRect(2, 13, 3, 3);
            ctx.fillRect(8, 13, 3, 3);
        }
        // Arm / attack
        if (player.attackTimer > 0) {
            ctx.fillStyle = '#aaddff';
            ctx.fillRect(10, 5, 6, 3);
            ctx.fillStyle = '#fff';
            ctx.fillRect(14, 4, 3, 5);
        } else {
            ctx.fillStyle = '#335577';
            ctx.fillRect(1, 6, 2, 5);
        }

        ctx.restore();
    }

    // Draw enemy
    function drawEnemy(ctx, enemy, camX, camY) {
        const ex = Math.floor(enemy.x - camX);
        const ey = Math.floor(enemy.y - camY);
        if (ex < -20 || ex > Engine.WIDTH + 20 || ey < -20 || ey > Engine.HEIGHT + 20) return;

        if (enemy.hitFlash > 0) {
            ctx.fillStyle = '#fff';
        } else {
            ctx.fillStyle = enemy.color || '#ff4444';
        }

        switch (enemy.type) {
            case 'patrol':
                // Robot body
                ctx.fillRect(ex + 2, ey + 2, 12, 10);
                ctx.fillStyle = enemy.hitFlash > 0 ? '#fff' : '#ff6666';
                ctx.fillRect(ex + 4, ey + 4, 3, 3);
                ctx.fillRect(ex + 9, ey + 4, 3, 3);
                // Legs
                ctx.fillStyle = enemy.hitFlash > 0 ? '#fff' : '#cc3333';
                ctx.fillRect(ex + 3, ey + 12, 3, 4);
                ctx.fillRect(ex + 10, ey + 12, 3, 4);
                break;
            case 'drone':
                // Flying drone
                ctx.fillRect(ex + 3, ey + 4, 10, 6);
                ctx.fillStyle = enemy.hitFlash > 0 ? '#fff' : '#ffaa00';
                ctx.fillRect(ex, ey + 2, 4, 3);
                ctx.fillRect(ex + 12, ey + 2, 4, 3);
                // Eye
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(ex + 6, ey + 6, 4, 2);
                // Scan cone
                if (enemy.scanning) {
                    ctx.globalAlpha = 0.15;
                    ctx.fillStyle = '#ff0000';
                    ctx.beginPath();
                    ctx.moveTo(ex + 8, ey + 10);
                    ctx.lineTo(ex - 16, ey + 50);
                    ctx.lineTo(ex + 32, ey + 50);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
                break;
            case 'turret':
                // Stationary turret
                ctx.fillRect(ex + 2, ey + 6, 12, 10);
                ctx.fillStyle = enemy.hitFlash > 0 ? '#fff' : '#ff2222';
                ctx.fillRect(ex + 5, ey + 2, 6, 6);
                // Barrel
                const angle = enemy.angle || 0;
                ctx.fillStyle = '#888';
                ctx.save();
                ctx.translate(ex + 8, ey + 5);
                ctx.rotate(angle);
                ctx.fillRect(0, -1, 10, 3);
                ctx.restore();
                break;
            case 'seeker':
                // Fast seeker enemy
                ctx.fillRect(ex + 1, ey + 2, 14, 10);
                ctx.fillStyle = enemy.hitFlash > 0 ? '#fff' : '#ff00ff';
                ctx.fillRect(ex + 4, ey + 4, 3, 3);
                ctx.fillRect(ex + 9, ey + 4, 3, 3);
                // Trail
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#ff00ff';
                ctx.fillRect(ex - enemy.facing * 4, ey + 4, 6, 6);
                ctx.globalAlpha = 1;
                break;
            case 'heavy':
                // Big heavy bot
                ctx.fillRect(ex, ey, 16, 14);
                ctx.fillStyle = enemy.hitFlash > 0 ? '#fff' : '#993333';
                ctx.fillRect(ex + 2, ey + 2, 12, 10);
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(ex + 4, ey + 3, 3, 3);
                ctx.fillRect(ex + 9, ey + 3, 3, 3);
                ctx.fillStyle = '#666';
                ctx.fillRect(ex + 1, ey + 14, 5, 4);
                ctx.fillRect(ex + 10, ey + 14, 5, 4);
                break;
            case 'boss':
                drawBoss(ctx, enemy, ex, ey);
                break;
            case 'glitch':
                // Glitchy enemy
                for (let i = 0; i < 4; i++) {
                    ctx.fillStyle = ['#ff00ff', '#00ffff', '#ff0', '#f00'][i];
                    const gx = Math.random() * 4 - 2;
                    const gy = Math.random() * 4 - 2;
                    ctx.fillRect(ex + 2 + gx, ey + 2 + gy, 12, 12);
                }
                break;
            case 'harvester':
                ctx.fillStyle = enemy.hitFlash > 0 ? '#fff' : '#887744';
                ctx.fillRect(ex, ey + 4, 16, 12);
                ctx.fillStyle = '#aaa';
                ctx.fillRect(ex + 2, ey, 4, 6);
                ctx.fillRect(ex + 10, ey, 4, 6);
                // Blades
                const rot = Date.now() / 100;
                ctx.fillStyle = '#ccc';
                ctx.fillRect(ex - 2 + Math.sin(rot) * 2, ey + 14, 6, 2);
                ctx.fillRect(ex + 12 + Math.cos(rot) * 2, ey + 14, 6, 2);
                break;
            default:
                ctx.fillRect(ex + 2, ey + 2, 12, 12);
                break;
        }
    }

    function drawBoss(ctx, boss, ex, ey) {
        const phase = boss.phase || 1;
        const scale = boss.w / 16;

        // Core body
        ctx.fillStyle = boss.hitFlash > 0 ? '#fff' : ['#ff44ff', '#ff2222', '#ffaa00'][phase - 1];
        ctx.fillRect(ex + 4 * scale, ey + 4 * scale, 8 * scale, 8 * scale);

        // Outer shell
        ctx.fillStyle = boss.hitFlash > 0 ? '#fff' : '#443355';
        ctx.fillRect(ex, ey + 2 * scale, 2 * scale, 12 * scale);
        ctx.fillRect(ex + 14 * scale, ey + 2 * scale, 2 * scale, 12 * scale);
        ctx.fillRect(ex + 2 * scale, ey, 12 * scale, 2 * scale);
        ctx.fillRect(ex + 2 * scale, ey + 14 * scale, 12 * scale, 2 * scale);

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(ex + 5 * scale, ey + 5 * scale, 2 * scale, 2 * scale);
        ctx.fillRect(ex + 9 * scale, ey + 5 * scale, 2 * scale, 2 * scale);

        // Phase-specific effects
        if (phase >= 2) {
            // Energy field
            ctx.globalAlpha = 0.2 + Math.sin(Date.now() / 100) * 0.1;
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(ex - 4, ey - 4, boss.w + 8, boss.h + 8);
            ctx.globalAlpha = 1;
        }
        if (phase >= 3) {
            // Desperation sparks
            ctx.fillStyle = '#ff0';
            for (let i = 0; i < 3; i++) {
                const sx = ex + Math.random() * boss.w;
                const sy = ey + Math.random() * boss.h;
                ctx.fillRect(sx, sy, 2, 2);
            }
        }

        // Health bar
        if (boss.hp !== undefined && boss.maxHp) {
            const barW = boss.w;
            const hpFrac = boss.hp / boss.maxHp;
            ctx.fillStyle = '#333';
            ctx.fillRect(ex, ey - 6, barW, 4);
            ctx.fillStyle = hpFrac > 0.3 ? '#ff44ff' : '#ff0000';
            ctx.fillRect(ex, ey - 6, barW * hpFrac, 4);
        }
    }

    // Projectile drawing
    function drawProjectile(ctx, proj, camX, camY) {
        const px = Math.floor(proj.x - camX);
        const py = Math.floor(proj.y - camY);
        ctx.fillStyle = proj.color || '#ff0';
        ctx.fillRect(px, py, proj.w || 4, proj.h || 4);
    }

    // Particles
    function addParticle(x, y, vx, vy, color, life, size) {
        if (particles.length > 200) return;
        particles.push({ x, y, vx, vy, color, life, maxLife: life, size: size || 2 });
    }

    function addDust(x, y) {
        for (let i = 0; i < 4; i++) {
            addParticle(x + Math.random() * 8, y, (Math.random() - 0.5) * 2, -Math.random() * 1.5, '#aaa', 0.3 + Math.random() * 0.2);
        }
    }

    function addHitSparks(x, y, color) {
        for (let i = 0; i < 6; i++) {
            addParticle(x, y, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, color || '#ff0', 0.2 + Math.random() * 0.2, 2);
        }
    }

    function addExplosion(x, y) {
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            addParticle(x, y, Math.cos(angle) * 3, Math.sin(angle) * 3, ['#ff4400', '#ff8800', '#ffcc00'][i % 3], 0.3 + Math.random() * 0.3, 3);
        }
    }

    function addAmbientParticles(camX, camY, levelIdx) {
        if (Math.random() > 0.05) return;
        const pal = getPalette(levelIdx);
        addParticle(
            camX + Math.random() * Engine.WIDTH,
            camY + Math.random() * Engine.HEIGHT,
            (Math.random() - 0.5) * 0.5,
            -Math.random() * 0.3 - 0.1,
            pal.accent,
            2 + Math.random() * 3,
            1
        );
    }

    function updateParticles(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.life -= dt;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function drawParticles(ctx, camX, camY) {
        for (const p of particles) {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.fillRect(Math.floor(p.x - camX), Math.floor(p.y - camY), p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    // Screen effects
    function flash(color) {
        screenFlash = 0.15;
        screenFlashColor = color || '#fff';
    }

    function drawFlash(ctx) {
        if (screenFlash > 0) {
            ctx.globalAlpha = screenFlash * 3;
            ctx.fillStyle = screenFlashColor;
            ctx.fillRect(0, 0, Engine.WIDTH, Engine.HEIGHT);
            ctx.globalAlpha = 1;
            screenFlash -= 0.016;
        }
    }

    // Screen transition
    function startTransition(callback) {
        transitionAlpha = 0;
        transitionDir = 1;
        transitionCallback = callback;
    }

    function updateTransition(dt) {
        if (transitionDir === 0) return false;
        transitionAlpha += transitionDir * dt * 3;
        if (transitionAlpha >= 1 && transitionDir === 1) {
            transitionAlpha = 1;
            transitionDir = -1;
            if (transitionCallback) {
                transitionCallback();
                transitionCallback = null;
            }
        }
        if (transitionAlpha <= 0 && transitionDir === -1) {
            transitionAlpha = 0;
            transitionDir = 0;
            return false;
        }
        return true;
    }

    function drawTransition(ctx) {
        if (transitionAlpha > 0) {
            ctx.globalAlpha = transitionAlpha;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, Engine.WIDTH, Engine.HEIGHT);
            ctx.globalAlpha = 1;
        }
    }

    // Text drawing (pixel font)
    function drawText(ctx, text, x, y, color, size, align) {
        ctx.fillStyle = color || '#fff';
        ctx.font = (size || 8) + 'px monospace';
        ctx.textAlign = align || 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(text, x, y);
    }

    function drawTextCentered(ctx, text, y, color, size) {
        drawText(ctx, text, Engine.WIDTH / 2, y, color, size, 'center');
    }

    return {
        getPalette, palettes,
        drawBackground, drawTiles, drawPlayer, drawEnemy, drawProjectile, drawBoss,
        addParticle, addDust, addHitSparks, addExplosion, addAmbientParticles,
        updateParticles, drawParticles,
        flash, drawFlash,
        startTransition, updateTransition, drawTransition,
        drawText, drawTextCentered
    };
})();
