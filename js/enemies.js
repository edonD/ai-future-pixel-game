// Enemy types, AI patterns, spawning, projectiles
const Enemies = (() => {
    let enemies = [];
    let projectiles = [];

    function reset() {
        enemies = [];
        projectiles = [];
    }

    function spawn(type, x, y, props = {}) {
        const base = {
            x, y,
            w: 16, h: 16,
            vx: 0, vy: 0,
            type,
            hp: 2,
            maxHp: 2,
            facing: props.facing || 1,
            hitFlash: 0,
            active: true,
            startX: x,
            startY: y,
            timer: 0,
            color: '#ff4444',
            scanning: false,
            angle: 0,
            phase: 1,
            ...props
        };

        switch (type) {
            case 'patrol':
                base.hp = 2;
                base.speed = props.speed || 0.8;
                base.range = props.range || 80;
                base.color = '#ff4444';
                break;
            case 'drone':
                base.hp = 1;
                base.speed = props.speed || 0.5;
                base.range = props.range || 100;
                base.color = '#ffaa00';
                base.scanning = true;
                base.w = 16;
                base.h = 12;
                break;
            case 'turret':
                base.hp = 3;
                base.speed = 0;
                base.color = '#cc2222';
                base.fireRate = props.fireRate || 2;
                base.fireTimer = 0;
                break;
            case 'seeker':
                base.hp = 2;
                base.speed = props.speed || 1.5;
                base.color = '#ff00ff';
                base.sightRange = props.sightRange || 120;
                break;
            case 'heavy':
                base.hp = 5;
                base.speed = props.speed || 0.4;
                base.range = props.range || 60;
                base.color = '#993333';
                base.w = 16;
                base.h = 18;
                break;
            case 'glitch':
                base.hp = 2;
                base.speed = props.speed || 1;
                base.color = '#ff00ff';
                base.teleportTimer = 0;
                break;
            case 'harvester':
                base.hp = 4;
                base.speed = props.speed || 0.3;
                base.range = props.range || 120;
                base.color = '#887744';
                base.w = 16;
                base.h = 16;
                break;
            case 'boss':
                base.hp = props.hp || 30;
                base.maxHp = base.hp;
                base.speed = 1;
                base.w = props.w || 48;
                base.h = props.h || 48;
                base.phase = 1;
                base.attackTimer = 0;
                base.pattern = 0;
                base.color = '#ff44ff';
                break;
        }

        enemies.push(base);
        return base;
    }

    function update(dt, player, level) {
        const p = player;

        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (!e.active) continue;

            e.timer += dt;
            if (e.hitFlash > 0) e.hitFlash -= dt;

            switch (e.type) {
                case 'patrol':
                    updatePatrol(e, dt, level);
                    break;
                case 'drone':
                    updateDrone(e, dt, p);
                    break;
                case 'turret':
                    updateTurret(e, dt, p);
                    break;
                case 'seeker':
                    updateSeeker(e, dt, p, level);
                    break;
                case 'heavy':
                    updateHeavy(e, dt, p, level);
                    break;
                case 'glitch':
                    updateGlitch(e, dt, p, level);
                    break;
                case 'harvester':
                    updateHarvester(e, dt, level);
                    break;
                case 'boss':
                    updateBoss(e, dt, p, level);
                    break;
            }

            // Remove dead enemies
            if (e.hp <= 0 && e.type !== 'boss') {
                e.active = false;
                Renderer.addExplosion(e.x + e.w / 2, e.y + e.h / 2);
                Audio.sfx.hitEnemy();
            }
        }

        // Update projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const proj = projectiles[i];
            proj.x += proj.vx;
            proj.y += proj.vy;
            proj.life -= dt;

            // Check wall collision
            const tx = Math.floor(proj.x / Engine.TILE);
            const ty = Math.floor(proj.y / Engine.TILE);
            if (Engine.isSolid(Engine.getTile(level, tx, ty))) {
                projectiles.splice(i, 1);
                Renderer.addHitSparks(proj.x, proj.y, '#ff0');
                continue;
            }

            // Check player collision
            if (Engine.aabb(proj, { x: p.x, y: p.y, w: p.w, h: p.h })) {
                Player.takeDamage(1);
                projectiles.splice(i, 1);
                continue;
            }

            if (proj.life <= 0) {
                projectiles.splice(i, 1);
            }
        }

        // Clean up dead
        enemies = enemies.filter(e => e.active || e.type === 'boss');
    }

    function updatePatrol(e, dt, level) {
        e.x += e.speed * e.facing;
        // Check boundaries
        const dist = Math.abs(e.x - e.startX);
        if (dist > e.range) {
            e.facing *= -1;
            e.x = e.startX + e.range * e.facing;
        }
        // Check wall ahead
        const ahead = Math.floor((e.x + (e.facing > 0 ? e.w : 0)) / Engine.TILE);
        const feet = Math.floor((e.y + e.h) / Engine.TILE);
        if (Engine.isSolid(Engine.getTile(level, ahead, Math.floor(e.y / Engine.TILE)))) {
            e.facing *= -1;
        }
        // Don't walk off edges
        if (!Engine.isSolid(Engine.getTile(level, ahead, feet)) && !Engine.isPlatform(Engine.getTile(level, ahead, feet))) {
            e.facing *= -1;
        }
        // Gravity
        e.vy += Engine.GRAVITY;
        if (e.vy > Engine.MAX_FALL) e.vy = Engine.MAX_FALL;
        e.y += e.vy;
        const groundTile = Math.floor((e.y + e.h) / Engine.TILE);
        const ex = Math.floor(e.x / Engine.TILE);
        const ex2 = Math.floor((e.x + e.w - 1) / Engine.TILE);
        for (let tx = ex; tx <= ex2; tx++) {
            if (Engine.isSolid(Engine.getTile(level, tx, groundTile)) || Engine.isPlatform(Engine.getTile(level, tx, groundTile))) {
                e.y = groundTile * Engine.TILE - e.h;
                e.vy = 0;
            }
        }
    }

    function updateDrone(e, dt, p) {
        e.x += e.speed * e.facing;
        const dist = Math.abs(e.x - e.startX);
        if (dist > e.range) e.facing *= -1;
        // Bob up and down
        e.y = e.startY + Math.sin(e.timer * 2) * 8;
    }

    function updateTurret(e, dt, p) {
        // Aim at player
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        e.angle = Math.atan2(dy, dx);

        e.fireTimer += dt;
        if (e.fireTimer >= e.fireRate && dist < 150) {
            e.fireTimer = 0;
            const speed = 2;
            projectiles.push({
                x: e.x + 8,
                y: e.y + 5,
                w: 4,
                h: 4,
                vx: Math.cos(e.angle) * speed,
                vy: Math.sin(e.angle) * speed,
                life: 3,
                color: '#ff4400'
            });
        }
    }

    function updateSeeker(e, dt, p, level) {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < e.sightRange) {
            e.vx += (dx > 0 ? 1 : -1) * 0.1;
            e.vy += (dy > 0 ? 1 : -1) * 0.05;
            e.facing = dx > 0 ? 1 : -1;
        }

        e.vx *= 0.95;
        e.vy *= 0.95;
        e.vx = Math.max(-e.speed, Math.min(e.speed, e.vx));
        e.vy = Math.max(-e.speed, Math.min(e.speed, e.vy));

        e.x += e.vx;
        e.y += e.vy;
    }

    function updateHeavy(e, dt, p, level) {
        updatePatrol(e, dt, level);
        // Occasionally shoot at player
        e.fireTimer = (e.fireTimer || 0) + dt;
        const dx = p.x - e.x;
        const dist = Math.abs(dx);
        if (e.fireTimer >= 3 && dist < 120) {
            e.fireTimer = 0;
            projectiles.push({
                x: e.x + 8,
                y: e.y + 6,
                w: 6,
                h: 6,
                vx: dx > 0 ? 2 : -2,
                vy: -0.5,
                life: 2,
                color: '#ff2222'
            });
        }
    }

    function updateGlitch(e, dt, p, level) {
        e.teleportTimer += dt;
        if (e.teleportTimer >= 2) {
            e.teleportTimer = 0;
            // Teleport near player
            const dx = p.x - e.x;
            const dy = p.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                e.x = p.x + (Math.random() - 0.5) * 60;
                e.y = p.y + (Math.random() - 0.5) * 40;
                Renderer.addHitSparks(e.x + 8, e.y + 8, '#00ffff');
            }
        }
        // Gravity
        e.vy += Engine.GRAVITY * 0.5;
        e.y += e.vy;
        const gy = Math.floor((e.y + e.h) / Engine.TILE);
        const gx = Math.floor((e.x + 8) / Engine.TILE);
        if (Engine.isSolid(Engine.getTile(level, gx, gy))) {
            e.y = gy * Engine.TILE - e.h;
            e.vy = 0;
        }
    }

    function updateHarvester(e, dt, level) {
        updatePatrol(e, dt, level);
    }

    function updateBoss(e, dt, p, level) {
        e.attackTimer += dt;

        // Phase transitions
        const hpPct = e.hp / e.maxHp;
        if (hpPct <= 0.3 && e.phase < 3) {
            e.phase = 3;
            Renderer.flash('#ff0');
            Engine.shakeCamera(15);
        } else if (hpPct <= 0.6 && e.phase < 2) {
            e.phase = 2;
            Renderer.flash('#ff00ff');
            Engine.shakeCamera(10);
        }

        // Movement
        const dx = p.x - e.x;
        const targetX = p.x - e.w / 2;
        e.x += (targetX - e.x) * 0.01 * e.phase;

        // Keep in bounds
        e.y = e.startY + Math.sin(e.timer * (0.5 + e.phase * 0.3)) * 20;

        // Attack patterns based on phase
        const fireRate = [2, 1.5, 0.8][e.phase - 1];
        if (e.attackTimer >= fireRate) {
            e.attackTimer = 0;
            fireBossAttack(e, p);
        }

        // Death
        if (e.hp <= 0) {
            e.active = false;
            Renderer.addExplosion(e.x + e.w / 2, e.y + e.h / 2);
            Engine.shakeCamera(20);
            Audio.sfx.bossHit();
        }
    }

    function fireBossAttack(boss, p) {
        const cx = boss.x + boss.w / 2;
        const cy = boss.y + boss.h / 2;

        switch (boss.phase) {
            case 1:
                // Spread shot
                for (let i = -2; i <= 2; i++) {
                    const angle = Math.atan2(p.y - cy, p.x - cx) + i * 0.3;
                    projectiles.push({
                        x: cx, y: cy,
                        w: 4, h: 4,
                        vx: Math.cos(angle) * 2,
                        vy: Math.sin(angle) * 2,
                        life: 3,
                        color: '#ff44ff'
                    });
                }
                break;
            case 2:
                // Ring attack
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + boss.timer;
                    projectiles.push({
                        x: cx, y: cy,
                        w: 5, h: 5,
                        vx: Math.cos(angle) * 1.8,
                        vy: Math.sin(angle) * 1.8,
                        life: 4,
                        color: '#ff2222'
                    });
                }
                break;
            case 3:
                // Desperation — aimed bursts + ring
                const aim = Math.atan2(p.y - cy, p.x - cx);
                for (let i = 0; i < 3; i++) {
                    projectiles.push({
                        x: cx, y: cy,
                        w: 4, h: 4,
                        vx: Math.cos(aim) * (2 + i * 0.5),
                        vy: Math.sin(aim) * (2 + i * 0.5),
                        life: 3,
                        color: '#ffaa00'
                    });
                }
                // Also ring
                for (let i = 0; i < 6; i++) {
                    const a2 = (i / 6) * Math.PI * 2 + boss.timer * 2;
                    projectiles.push({
                        x: cx, y: cy,
                        w: 3, h: 3,
                        vx: Math.cos(a2) * 1.5,
                        vy: Math.sin(a2) * 1.5,
                        life: 3,
                        color: '#ff0'
                    });
                }
                break;
        }
    }

    function hitEnemy(enemy, damage) {
        enemy.hp -= damage;
        enemy.hitFlash = 0.1;
        Renderer.addHitSparks(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#fff');
        Audio.sfx.hitEnemy();
        if (enemy.type === 'boss') Audio.sfx.bossHit();
    }

    function getAll() { return enemies; }
    function getProjectiles() { return projectiles; }

    return { reset, spawn, update, hitEnemy, getAll, getProjectiles };
})();
