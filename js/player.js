// Player entity — movement, combat, animation
const Player = (() => {
    const ACCEL = 0.6;
    const FRICTION = 0.75;
    const MAX_SPEED = 2.5;
    const JUMP_POWER = -6.5;
    const JUMP_CUT = 0.4; // Multiply vy when jump released
    const COYOTE_TIME = 6; // frames
    const JUMP_BUFFER = 6; // frames
    const ATTACK_DURATION = 0.2;
    const ATTACK_COOLDOWN = 0.3;
    const INVINCIBLE_TIME = 1.0;
    const MAX_HP = 5;

    let player;

    function create(x, y) {
        player = {
            x, y,
            w: 12, h: 17,
            vx: 0, vy: 0,
            facing: 1,
            onGround: false,
            wallLeft: false,
            wallRight: false,
            hitCeiling: false,
            onHazard: false,

            hp: MAX_HP,
            maxHp: MAX_HP,
            invincible: 0,
            dead: false,
            deathTimer: 0,

            coyoteCounter: 0,
            jumpBufferCounter: 0,
            wasOnGround: false,

            attackTimer: 0,
            attackCooldown: 0,
            attackHit: false,

            animTimer: 0,
            state: 'idle', // idle, walk, jump, fall, attack, dead

            checkpointX: x,
            checkpointY: y,

            deaths: 0,
            levelStartTime: 0,
        };
        return player;
    }

    function update(dt, level, lowGravity) {
        if (player.dead) {
            player.deathTimer -= dt;
            if (player.deathTimer <= 0) {
                respawn();
            }
            return;
        }

        // Invincibility
        if (player.invincible > 0) player.invincible -= dt;

        // Attack cooldown
        if (player.attackCooldown > 0) player.attackCooldown -= dt;
        if (player.attackTimer > 0) {
            player.attackTimer -= dt;
            if (player.attackTimer <= 0) player.attackHit = false;
        }

        // Horizontal movement
        if (Engine.left()) {
            player.vx -= ACCEL;
            player.facing = -1;
        } else if (Engine.right()) {
            player.vx += ACCEL;
            player.facing = 1;
        } else {
            player.vx *= FRICTION;
            if (Math.abs(player.vx) < 0.1) player.vx = 0;
        }
        player.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, player.vx));

        // Coyote time
        if (player.onGround) {
            player.coyoteCounter = COYOTE_TIME;
        } else {
            if (player.coyoteCounter > 0) player.coyoteCounter--;
        }

        // Jump buffer
        if (Engine.jump()) {
            player.jumpBufferCounter = JUMP_BUFFER;
        } else {
            if (player.jumpBufferCounter > 0) player.jumpBufferCounter--;
        }

        // Jump
        if (player.jumpBufferCounter > 0 && player.coyoteCounter > 0) {
            player.vy = JUMP_POWER;
            player.coyoteCounter = 0;
            player.jumpBufferCounter = 0;
            player.onGround = false;
            Audio.sfx.jump();
        }

        // Variable jump height
        if (!Engine.jumpHeld() && player.vy < 0) {
            player.vy *= JUMP_CUT;
        }

        // Gravity (reduced in low-gravity levels)
        const grav = lowGravity ? Engine.GRAVITY * 0.35 : Engine.GRAVITY;
        const maxFall = lowGravity ? Engine.MAX_FALL * 0.5 : Engine.MAX_FALL;
        player.vy += grav;
        if (player.vy > maxFall) player.vy = maxFall;

        // Reset wall flags
        player.wallLeft = false;
        player.wallRight = false;

        // Resolve collisions
        const wasOnGround = player.onGround;
        Engine.resolveCollisions(player, level);

        // Landing dust
        if (player.onGround && !wasOnGround && player.vy === 0) {
            Renderer.addDust(player.x, player.y + player.h);
            Audio.sfx.land();
        }

        // Hazard check
        if (player.onHazard) {
            takeDamage(1);
        }

        // Attack
        if (Engine.attack() && player.attackCooldown <= 0) {
            player.attackTimer = ATTACK_DURATION;
            player.attackCooldown = ATTACK_COOLDOWN;
            player.attackHit = false;
            Audio.sfx.attack();
        }

        // Animation timer
        player.animTimer += dt;

        // State
        if (player.attackTimer > 0) {
            player.state = 'attack';
        } else if (!player.onGround) {
            player.state = player.vy < 0 ? 'jump' : 'fall';
        } else if (Math.abs(player.vx) > 0.5) {
            player.state = 'walk';
        } else {
            player.state = 'idle';
        }

        // Fall out of level
        if (player.y > level.height * Engine.TILE + 32) {
            die();
        }
    }

    function getAttackBox() {
        if (player.attackTimer <= 0) return null;
        return {
            x: player.facing > 0 ? player.x + player.w : player.x - 16,
            y: player.y + 2,
            w: 16,
            h: 12
        };
    }

    function takeDamage(amount) {
        if (player.invincible > 0 || player.dead) return;
        player.hp -= amount;
        player.invincible = INVINCIBLE_TIME;
        Audio.sfx.takeDamage();
        Renderer.flash('#ff0000');
        Engine.shakeCamera(6);
        if (player.hp <= 0) {
            die();
        }
    }

    function die() {
        if (player.dead) return;
        player.dead = true;
        player.deathTimer = 1.5;
        player.deaths++;
        player.vx = 0;
        player.vy = 0;
        Audio.sfx.death();
        Renderer.addExplosion(player.x + player.w / 2, player.y + player.h / 2);
        Engine.shakeCamera(10);
    }

    function respawn() {
        player.x = player.checkpointX;
        player.y = player.checkpointY;
        player.vx = 0;
        player.vy = 0;
        player.hp = player.maxHp;
        player.dead = false;
        player.invincible = INVINCIBLE_TIME;
        player.attackTimer = 0;
        player.attackCooldown = 0;
    }

    function setCheckpoint(x, y) {
        player.checkpointX = x;
        player.checkpointY = y;
    }

    function heal(amount) {
        player.hp = Math.min(player.maxHp, player.hp + amount);
    }

    function get() { return player; }

    return { create, update, get, getAttackBox, takeDamage, die, respawn, setCheckpoint, heal };
})();
