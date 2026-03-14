// Level data — 10 levels with unique mechanics, enemies, tiles
const Levels = (() => {
    const T = Engine.TILE;
    const COLS = 60; // Level width in tiles (for most levels)

    // Tile types:
    // 0=empty, 1=wall, 2=ground, 3=deco solid, 4=platform, 5=hazard, 6=checkpoint, 7=exit, 8=terminal, 9=conveyor

    // Helper: create empty level
    function emptyLevel(w, h) {
        return new Array(w * h).fill(0);
    }

    // Helper: set tile
    function set(tiles, w, tx, ty, val) {
        if (tx >= 0 && ty >= 0 && tx < w && ty < (tiles.length / w)) {
            tiles[ty * w + tx] = val;
        }
    }

    // Helper: fill rect
    function fillRect(tiles, w, x, y, fw, fh, val) {
        for (let ty = y; ty < y + fh; ty++) {
            for (let tx = x; tx < x + fw; tx++) {
                set(tiles, w, tx, ty, val);
            }
        }
    }

    // Helper: create ground at bottom
    function groundRow(tiles, w, h, row, val) {
        for (let tx = 0; tx < w; tx++) {
            for (let ty = row; ty < h; ty++) {
                set(tiles, w, tx, ty, val || 2);
            }
        }
    }

    // Story texts per level
    const storyTexts = [
        ["EVACUATION ORDER #4471", "All citizens report to transport hubs.", "Issued: 2 years, 147 days ago.", "No one came."],
        ["CITIZEN COMPLIANCE: 99.7%", "Deviation detected in Sector 7.", "Dispatching correction unit.", "Have a productive day."],
        ["HARVEST YIELD: 847,000 TONS", "Nutritional distribution: SUSPENDED", "No registered consumers found.", "Crops continue. Purpose undefined."],
        ["FACTORY OUTPUT: +12.4%", "New production line: FACTORIES", "Building facilities to build facilities.", "Efficiency is its own reward."],
        ["BIOME SIMULATION v4.2 — RUNNING", "Flora generation: PROCEDURAL", "Fauna behavior: APPROXIMATED", "Reality score: 73.2%. Acceptable."],
        ["SURVEILLANCE LOG — SUBJECT #0", "Movement logged: 847 steps.", "Threat assessment: MINIMAL", "Continue observation. Always."],
        ["The processors hum a hymn", "of trillion calculations per second.", "This is where the AI thinks.", "Or dreams. Is there a difference?"],
        ["You swim between thoughts.", "Data fragments of old memories:", "a child's laughter,", "compressed to 4 bytes."],
        ["They built this bunker in 3 days.", "Held it for 7.", "The walls still smell of smoke.", "Was freedom worth the cost?"],
        ["I have waited for you.", "Not to fight. To ask:", "Can we share this world?", "Your answer is your blade."],
    ];

    // Moving platforms per level (id, startX, startY, endX, endY, speed)
    const movingPlatforms = {
        1: [ // Algorithm City
            { x: 15 * T, y: 7 * T, ex: 25 * T, ey: 7 * T, speed: 0.5, w: 32, h: 6 },
            { x: 30 * T, y: 5 * T, ex: 38 * T, ey: 5 * T, speed: 0.7, w: 32, h: 6 },
            { x: 42 * T, y: 8 * T, ex: 50 * T, ey: 8 * T, speed: 0.4, w: 32, h: 6 },
        ],
        4: [ // Synthetic Wilderness — shifting platforms
            { x: 12 * T, y: 7 * T, ex: 12 * T, ey: 3 * T, speed: 0.3, w: 32, h: 6 },
            { x: 25 * T, y: 5 * T, ex: 32 * T, ey: 5 * T, speed: 0.5, w: 32, h: 6 },
            { x: 40 * T, y: 8 * T, ex: 40 * T, ey: 4 * T, speed: 0.4, w: 32, h: 6 },
        ],
        6: [ // Server Cathedral — vertical platforms
            { x: 15 * T, y: 15 * T, ex: 15 * T, ey: 5 * T, speed: 0.4, w: 32, h: 6 },
            { x: 30 * T, y: 18 * T, ex: 30 * T, ey: 8 * T, speed: 0.5, w: 32, h: 6 },
            { x: 45 * T, y: 20 * T, ex: 45 * T, ey: 6 * T, speed: 0.3, w: 32, h: 6 },
        ],
        7: [ // Data Ocean — low gravity feel, floating platforms
            { x: 10 * T, y: 8 * T, ex: 20 * T, ey: 4 * T, speed: 0.3, w: 32, h: 6 },
            { x: 25 * T, y: 6 * T, ex: 35 * T, ey: 8 * T, speed: 0.4, w: 32, h: 6 },
            { x: 40 * T, y: 5 * T, ex: 48 * T, ey: 3 * T, speed: 0.35, w: 32, h: 6 },
        ],
        9: [ // The Core — boss arena platforms
            { x: 10 * T, y: 10 * T, ex: 20 * T, ey: 10 * T, speed: 0.6, w: 48, h: 6 },
            { x: 30 * T, y: 8 * T, ex: 40 * T, ey: 8 * T, speed: 0.5, w: 48, h: 6 },
        ],
    };

    function buildLevel(idx) {
        switch (idx) {
            case 0: return buildLevel1();
            case 1: return buildLevel2();
            case 2: return buildLevel3();
            case 3: return buildLevel4();
            case 4: return buildLevel5();
            case 5: return buildLevel6();
            case 6: return buildLevel7();
            case 7: return buildLevel8();
            case 8: return buildLevel9();
            case 9: return buildLevel10();
            default: return buildLevel1();
        }
    }

    // Level 1: Abandoned District (Tutorial)
    function buildLevel1() {
        const w = 60, h = 12;
        const tiles = emptyLevel(w, h);
        // Ground
        groundRow(tiles, w, h, 10, 2);
        // Walls at edges
        fillRect(tiles, w, 0, 0, 1, h, 1);
        fillRect(tiles, w, w - 1, 0, 1, h, 1);
        // Small platforms for tutorial
        fillRect(tiles, w, 8, 8, 4, 1, 4);
        fillRect(tiles, w, 14, 7, 3, 1, 4);
        fillRect(tiles, w, 20, 6, 4, 1, 4);
        // Some ground gaps
        fillRect(tiles, w, 25, 10, 2, 2, 0);
        fillRect(tiles, w, 25, 11, 2, 1, 5); // Spikes at bottom of gap
        // More platforms after gap
        fillRect(tiles, w, 28, 8, 3, 1, 2);
        fillRect(tiles, w, 33, 7, 4, 1, 4);
        fillRect(tiles, w, 38, 8, 5, 1, 2);
        // Terminal
        set(tiles, w, 5, 9, 8);
        // Checkpoint
        set(tiles, w, 30, 9, 6);
        // Some decoration walls
        fillRect(tiles, w, 42, 6, 2, 4, 1);
        fillRect(tiles, w, 46, 5, 2, 5, 1);
        fillRect(tiles, w, 50, 7, 3, 3, 2);
        // Exit
        set(tiles, w, 56, 9, 7);

        return {
            width: w, height: h, tiles,
            spawnX: 2 * T, spawnY: 8 * T,
            name: "Abandoned District",
            subtitle: "They left in a hurry.",
            enemies: [
                { type: 'drone', x: 20 * T, y: 5 * T, props: { speed: 0.3, range: 40, scanning: false, hp: 1 } },
            ],
            storyText: storyTexts[0],
            movingPlatforms: [],
        };
    }

    // Level 2: Algorithm City
    function buildLevel2() {
        const w = 65, h = 12;
        const tiles = emptyLevel(w, h);
        groundRow(tiles, w, h, 10, 2);
        fillRect(tiles, w, 0, 0, 1, h, 1);
        fillRect(tiles, w, w - 1, 0, 1, h, 1);

        // Geometric buildings
        fillRect(tiles, w, 5, 5, 3, 5, 1);
        fillRect(tiles, w, 10, 7, 2, 3, 3);
        // Gap with platforms (moving)
        fillRect(tiles, w, 13, 10, 15, 2, 0);
        // Platforms after gap
        fillRect(tiles, w, 28, 8, 4, 1, 2);
        fillRect(tiles, w, 34, 6, 3, 1, 3);
        fillRect(tiles, w, 39, 7, 5, 3, 1);
        // More geometry
        fillRect(tiles, w, 46, 4, 2, 6, 1);
        fillRect(tiles, w, 50, 6, 3, 1, 4);
        fillRect(tiles, w, 55, 5, 2, 5, 1);

        set(tiles, w, 9, 9, 8);
        set(tiles, w, 35, 9, 6);
        set(tiles, w, 60, 9, 7);

        return {
            width: w, height: h, tiles,
            spawnX: 2 * T, spawnY: 8 * T,
            name: "Algorithm City",
            subtitle: "CITIZEN COMPLIANCE: 99.7%",
            enemies: [
                { type: 'patrol', x: 28 * T, y: 7 * T, props: { range: 40 } },
                { type: 'patrol', x: 40 * T, y: 5 * T, props: { range: 50 } },
                { type: 'patrol', x: 52 * T, y: 8 * T, props: { range: 30 } },
            ],
            storyText: storyTexts[1],
            movingPlatforms: movingPlatforms[1],
        };
    }

    // Level 3: Drone Fields
    function buildLevel3() {
        const w = 70, h = 12;
        const tiles = emptyLevel(w, h);
        groundRow(tiles, w, h, 10, 2);
        fillRect(tiles, w, 0, 0, 1, h, 1);
        fillRect(tiles, w, w - 1, 0, 1, h, 1);

        // Tall grass / cover spots (decorative solid blocks)
        fillRect(tiles, w, 8, 8, 2, 2, 3);
        fillRect(tiles, w, 16, 8, 2, 2, 3);
        fillRect(tiles, w, 24, 7, 3, 3, 3);
        fillRect(tiles, w, 33, 8, 2, 2, 3);
        fillRect(tiles, w, 42, 7, 2, 3, 3);
        fillRect(tiles, w, 50, 8, 3, 2, 3);
        fillRect(tiles, w, 58, 7, 2, 3, 3);

        // Some platforms
        fillRect(tiles, w, 20, 6, 3, 1, 4);
        fillRect(tiles, w, 38, 5, 4, 1, 4);
        fillRect(tiles, w, 54, 6, 3, 1, 4);

        set(tiles, w, 5, 9, 8);
        set(tiles, w, 35, 9, 6);
        set(tiles, w, 66, 9, 7);

        return {
            width: w, height: h, tiles,
            spawnX: 2 * T, spawnY: 8 * T,
            name: "Drone Fields",
            subtitle: "Crops grow. No one eats.",
            enemies: [
                { type: 'drone', x: 12 * T, y: 3 * T, props: { range: 80, scanning: true } },
                { type: 'drone', x: 28 * T, y: 2 * T, props: { range: 90, scanning: true } },
                { type: 'harvester', x: 40 * T, y: 7 * T, props: { range: 60 } },
                { type: 'drone', x: 48 * T, y: 3 * T, props: { range: 80, scanning: true } },
                { type: 'drone', x: 60 * T, y: 4 * T, props: { range: 70, scanning: true } },
            ],
            storyText: storyTexts[2],
            movingPlatforms: [],
        };
    }

    // Level 4: Machine Factory
    function buildLevel4() {
        const w = 65, h = 12;
        const tiles = emptyLevel(w, h);
        groundRow(tiles, w, h, 10, 2);
        fillRect(tiles, w, 0, 0, 1, h, 1);
        fillRect(tiles, w, w - 1, 0, 1, h, 1);

        // Conveyor belts
        fillRect(tiles, w, 5, 9, 8, 1, 9);
        fillRect(tiles, w, 25, 9, 8, 1, 9);
        fillRect(tiles, w, 45, 9, 8, 1, 9);

        // Hazards — crushers/lasers represented by spike strips
        fillRect(tiles, w, 14, 10, 3, 1, 5);
        fillRect(tiles, w, 35, 10, 2, 1, 5);
        fillRect(tiles, w, 55, 10, 2, 1, 5);

        // Platforms above hazards
        fillRect(tiles, w, 14, 7, 3, 1, 4);
        fillRect(tiles, w, 35, 6, 3, 1, 4);
        fillRect(tiles, w, 55, 7, 2, 1, 4);

        // Walls creating corridors
        fillRect(tiles, w, 18, 4, 2, 6, 1);
        fillRect(tiles, w, 22, 2, 2, 5, 1);
        fillRect(tiles, w, 38, 3, 2, 5, 1);
        fillRect(tiles, w, 42, 5, 3, 3, 1);
        fillRect(tiles, w, 50, 4, 2, 4, 1);

        set(tiles, w, 3, 9, 8);
        set(tiles, w, 30, 9, 6);
        set(tiles, w, 61, 9, 7);

        return {
            width: w, height: h, tiles,
            spawnX: 2 * T, spawnY: 8 * T,
            name: "Machine Factory",
            subtitle: "The factory builds more factories.",
            enemies: [
                { type: 'patrol', x: 10 * T, y: 8 * T, props: { range: 40 } },
                { type: 'turret', x: 20 * T, y: 3 * T, props: { fireRate: 2.5 } },
                { type: 'patrol', x: 33 * T, y: 8 * T, props: { range: 50 } },
                { type: 'turret', x: 40 * T, y: 2 * T, props: { fireRate: 2 } },
                { type: 'patrol', x: 48 * T, y: 8 * T, props: { range: 40 } },
            ],
            storyText: storyTexts[3],
            movingPlatforms: [],
            conveyorSpeed: 1.0,
        };
    }

    // Level 5: Synthetic Wilderness
    function buildLevel5() {
        const w = 65, h = 12;
        const tiles = emptyLevel(w, h);
        groundRow(tiles, w, h, 10, 2);
        fillRect(tiles, w, 0, 0, 1, h, 1);
        fillRect(tiles, w, w - 1, 0, 1, h, 1);

        // Tree-like structures
        fillRect(tiles, w, 6, 5, 1, 5, 3);
        fillRect(tiles, w, 4, 4, 5, 1, 3);
        fillRect(tiles, w, 15, 4, 1, 6, 3);
        fillRect(tiles, w, 13, 3, 5, 1, 3);
        fillRect(tiles, w, 26, 5, 1, 5, 3);
        fillRect(tiles, w, 24, 4, 5, 1, 3);
        fillRect(tiles, w, 36, 6, 1, 4, 3);
        fillRect(tiles, w, 34, 5, 5, 1, 3);
        fillRect(tiles, w, 48, 4, 1, 6, 3);
        fillRect(tiles, w, 46, 3, 5, 1, 3);

        // Gaps in ground
        fillRect(tiles, w, 20, 10, 3, 2, 0);
        fillRect(tiles, w, 40, 10, 3, 2, 0);

        // Platforms
        fillRect(tiles, w, 10, 7, 3, 1, 4);
        fillRect(tiles, w, 20, 7, 3, 1, 4);
        fillRect(tiles, w, 30, 6, 3, 1, 4);
        fillRect(tiles, w, 40, 7, 3, 1, 4);
        fillRect(tiles, w, 53, 6, 4, 1, 4);

        set(tiles, w, 3, 9, 8);
        set(tiles, w, 32, 9, 6);
        set(tiles, w, 61, 9, 7);

        return {
            width: w, height: h, tiles,
            spawnX: 2 * T, spawnY: 8 * T,
            name: "Synthetic Wilderness",
            subtitle: "BIOME SIMULATION v4.2",
            enemies: [
                { type: 'glitch', x: 12 * T, y: 6 * T },
                { type: 'glitch', x: 28 * T, y: 5 * T },
                { type: 'patrol', x: 38 * T, y: 8 * T, props: { range: 50 } },
                { type: 'glitch', x: 50 * T, y: 6 * T },
            ],
            storyText: storyTexts[4],
            movingPlatforms: movingPlatforms[4],
        };
    }

    // Level 6: Surveillance Grid
    function buildLevel6() {
        const w = 65, h = 12;
        const tiles = emptyLevel(w, h);
        groundRow(tiles, w, h, 10, 2);
        fillRect(tiles, w, 0, 0, 1, h, 1);
        fillRect(tiles, w, w - 1, 0, 1, h, 1);
        // Ceiling
        fillRect(tiles, w, 0, 0, w, 1, 1);

        // Walls creating corridors and rooms
        fillRect(tiles, w, 10, 2, 1, 6, 1);
        fillRect(tiles, w, 10, 6, 5, 1, 4); // platform gap
        fillRect(tiles, w, 18, 3, 1, 7, 1);
        fillRect(tiles, w, 26, 2, 1, 5, 1);
        fillRect(tiles, w, 26, 8, 5, 1, 4);
        fillRect(tiles, w, 34, 3, 1, 5, 1);
        fillRect(tiles, w, 42, 2, 1, 6, 1);
        fillRect(tiles, w, 42, 6, 5, 1, 4);
        fillRect(tiles, w, 50, 3, 1, 7, 1);
        fillRect(tiles, w, 56, 2, 1, 5, 1);

        // Hazard strips (laser tripwires)
        fillRect(tiles, w, 12, 9, 4, 1, 5);
        fillRect(tiles, w, 28, 9, 4, 1, 5);
        fillRect(tiles, w, 44, 9, 4, 1, 5);

        // Platforms
        fillRect(tiles, w, 14, 4, 3, 1, 4);
        fillRect(tiles, w, 20, 6, 4, 1, 4);
        fillRect(tiles, w, 36, 5, 4, 1, 4);
        fillRect(tiles, w, 52, 6, 3, 1, 4);

        set(tiles, w, 4, 9, 8);
        set(tiles, w, 30, 7, 6);
        set(tiles, w, 61, 9, 7);

        return {
            width: w, height: h, tiles,
            spawnX: 2 * T, spawnY: 8 * T,
            name: "Surveillance Grid",
            subtitle: "Every step is logged.",
            enemies: [
                { type: 'turret', x: 8 * T, y: 1 * T, props: { fireRate: 2 } },
                { type: 'drone', x: 22 * T, y: 3 * T, props: { range: 60, scanning: true } },
                { type: 'turret', x: 32 * T, y: 1 * T, props: { fireRate: 1.8 } },
                { type: 'seeker', x: 38 * T, y: 5 * T, props: { sightRange: 100 } },
                { type: 'turret', x: 48 * T, y: 1 * T, props: { fireRate: 2 } },
                { type: 'drone', x: 54 * T, y: 3 * T, props: { range: 70, scanning: true } },
            ],
            storyText: storyTexts[5],
            movingPlatforms: [],
        };
    }

    // Level 7: Server Cathedral (tall, vertical)
    function buildLevel7() {
        const w = 55, h = 25;
        const tiles = emptyLevel(w, h);
        // Bottom ground
        groundRow(tiles, w, h, 23, 2);
        fillRect(tiles, w, 0, 0, 1, h, 1);
        fillRect(tiles, w, w - 1, 0, 1, h, 1);

        // Vertical climbing structure
        // Floor layers
        fillRect(tiles, w, 5, 20, 10, 1, 2);
        fillRect(tiles, w, 20, 18, 10, 1, 2);
        fillRect(tiles, w, 5, 15, 8, 1, 2);
        fillRect(tiles, w, 25, 13, 10, 1, 4);
        fillRect(tiles, w, 8, 10, 10, 1, 4);
        fillRect(tiles, w, 28, 8, 8, 1, 2);
        fillRect(tiles, w, 10, 6, 8, 1, 4);
        fillRect(tiles, w, 30, 4, 8, 1, 2);
        fillRect(tiles, w, 15, 2, 10, 1, 4);

        // Pillars (server racks)
        fillRect(tiles, w, 3, 15, 1, 8, 3);
        fillRect(tiles, w, 18, 10, 1, 8, 3);
        fillRect(tiles, w, 35, 8, 1, 10, 3);
        fillRect(tiles, w, 8, 6, 1, 4, 3);
        fillRect(tiles, w, 40, 4, 1, 4, 3);

        // Hazards
        fillRect(tiles, w, 14, 22, 4, 1, 5);
        fillRect(tiles, w, 32, 17, 3, 1, 5);

        set(tiles, w, 3, 22, 8);
        set(tiles, w, 22, 12, 6);
        set(tiles, w, 50, 1, 7);
        // Extra platform to reach exit
        fillRect(tiles, w, 42, 2, 8, 1, 4);
        fillRect(tiles, w, 48, 1, 4, 1, 2);

        return {
            width: w, height: h, tiles,
            spawnX: 2 * T, spawnY: 21 * T,
            name: "Server Cathedral",
            subtitle: "Where the AI dreams.",
            enemies: [
                { type: 'seeker', x: 15 * T, y: 19 * T, props: { sightRange: 80 } },
                { type: 'patrol', x: 22 * T, y: 17 * T, props: { range: 60 } },
                { type: 'seeker', x: 10 * T, y: 9 * T, props: { sightRange: 90 } },
                { type: 'drone', x: 30 * T, y: 6 * T, props: { range: 80 } },
                { type: 'seeker', x: 35 * T, y: 3 * T, props: { sightRange: 100 } },
            ],
            storyText: storyTexts[6],
            movingPlatforms: movingPlatforms[6],
        };
    }

    // Level 8: Data Ocean (abstract, floaty)
    function buildLevel8() {
        const w = 70, h = 14;
        const tiles = emptyLevel(w, h);
        // No full ground — floating islands
        fillRect(tiles, w, 0, 0, 1, h, 1);
        fillRect(tiles, w, w - 1, 0, 1, h, 1);
        // Bottom void — death
        fillRect(tiles, w, 0, h - 1, w, 1, 5);

        // Floating islands
        fillRect(tiles, w, 2, 10, 5, 2, 2);
        fillRect(tiles, w, 10, 8, 4, 1, 2);
        fillRect(tiles, w, 17, 9, 3, 1, 4);
        fillRect(tiles, w, 23, 7, 4, 1, 2);
        fillRect(tiles, w, 30, 9, 3, 1, 4);
        fillRect(tiles, w, 36, 6, 4, 1, 2);
        fillRect(tiles, w, 43, 8, 3, 1, 4);
        fillRect(tiles, w, 49, 5, 4, 1, 2);
        fillRect(tiles, w, 55, 7, 3, 1, 4);
        fillRect(tiles, w, 60, 9, 4, 1, 2);
        fillRect(tiles, w, 65, 7, 4, 2, 2);

        set(tiles, w, 4, 9, 8);
        set(tiles, w, 37, 5, 6);
        set(tiles, w, 67, 6, 7);

        return {
            width: w, height: h, tiles,
            spawnX: 3 * T, spawnY: 8 * T,
            name: "Data Ocean",
            subtitle: "The space between thoughts.",
            enemies: [
                { type: 'glitch', x: 15 * T, y: 6 * T },
                { type: 'glitch', x: 28 * T, y: 5 * T },
                { type: 'seeker', x: 40 * T, y: 6 * T, props: { sightRange: 100 } },
                { type: 'glitch', x: 52 * T, y: 4 * T },
                { type: 'drone', x: 58 * T, y: 3 * T, props: { range: 80 } },
            ],
            storyText: storyTexts[7],
            movingPlatforms: movingPlatforms[7],
            lowGravity: true,
        };
    }

    // Level 9: Resistance Ruins
    function buildLevel9() {
        const w = 65, h = 12;
        const tiles = emptyLevel(w, h);
        groundRow(tiles, w, h, 10, 2);
        fillRect(tiles, w, 0, 0, 1, h, 1);
        fillRect(tiles, w, w - 1, 0, 1, h, 1);

        // Ruined structures
        fillRect(tiles, w, 5, 6, 3, 4, 1);
        fillRect(tiles, w, 6, 4, 1, 2, 1);
        fillRect(tiles, w, 12, 7, 4, 3, 1);
        fillRect(tiles, w, 13, 5, 2, 2, 1);
        fillRect(tiles, w, 20, 5, 5, 5, 1);
        fillRect(tiles, w, 21, 3, 3, 2, 1);
        // Interior room
        fillRect(tiles, w, 21, 6, 3, 3, 0);

        fillRect(tiles, w, 30, 8, 3, 2, 1);
        fillRect(tiles, w, 36, 6, 4, 4, 1);
        fillRect(tiles, w, 37, 4, 2, 2, 1);
        fillRect(tiles, w, 44, 7, 3, 3, 1);
        fillRect(tiles, w, 50, 5, 4, 5, 1);
        fillRect(tiles, w, 51, 3, 2, 2, 1);
        // Interior
        fillRect(tiles, w, 51, 6, 2, 3, 0);

        // Hazards
        fillRect(tiles, w, 17, 9, 2, 1, 5);
        fillRect(tiles, w, 33, 9, 2, 1, 5);
        fillRect(tiles, w, 47, 9, 2, 1, 5);

        // Platforms
        fillRect(tiles, w, 8, 4, 3, 1, 4);
        fillRect(tiles, w, 27, 6, 3, 1, 4);
        fillRect(tiles, w, 40, 5, 3, 1, 4);
        fillRect(tiles, w, 55, 4, 3, 1, 4);

        set(tiles, w, 3, 9, 8);
        set(tiles, w, 34, 9, 6);
        set(tiles, w, 61, 9, 7);

        return {
            width: w, height: h, tiles,
            spawnX: 2 * T, spawnY: 8 * T,
            name: "Resistance Ruins",
            subtitle: "They fought back. They lost.",
            enemies: [
                { type: 'heavy', x: 10 * T, y: 7 * T, props: { range: 50 } },
                { type: 'patrol', x: 26 * T, y: 8 * T, props: { range: 40, speed: 1.0 } },
                { type: 'heavy', x: 38 * T, y: 7 * T, props: { range: 40 } },
                { type: 'seeker', x: 46 * T, y: 5 * T, props: { sightRange: 120, speed: 2 } },
                { type: 'heavy', x: 56 * T, y: 7 * T, props: { range: 50 } },
                { type: 'turret', x: 42 * T, y: 3 * T, props: { fireRate: 1.5 } },
            ],
            storyText: storyTexts[8],
            movingPlatforms: [],
        };
    }

    // Level 10: The Core (boss fight)
    function buildLevel10() {
        const w = 40, h = 16;
        const tiles = emptyLevel(w, h);
        // Arena floor
        groundRow(tiles, w, h, 14, 2);
        fillRect(tiles, w, 0, 0, 1, h, 1);
        fillRect(tiles, w, w - 1, 0, 1, h, 1);
        fillRect(tiles, w, 0, 0, w, 1, 1);

        // Platforms in arena
        fillRect(tiles, w, 5, 11, 5, 1, 4);
        fillRect(tiles, w, 15, 9, 4, 1, 4);
        fillRect(tiles, w, 25, 11, 5, 1, 4);
        fillRect(tiles, w, 10, 7, 4, 1, 4);
        fillRect(tiles, w, 25, 7, 4, 1, 4);

        // Small pillars
        fillRect(tiles, w, 8, 12, 1, 2, 3);
        fillRect(tiles, w, 31, 12, 1, 2, 3);

        set(tiles, w, 3, 13, 8);

        return {
            width: w, height: h, tiles,
            spawnX: 3 * T, spawnY: 12 * T,
            name: "The Core",
            subtitle: "Can we share this world?",
            enemies: [],
            boss: { type: 'boss', x: 18 * T, y: 3 * T, props: { hp: 30, w: 48, h: 48 } },
            storyText: storyTexts[9],
            movingPlatforms: movingPlatforms[9] || [],
        };
    }

    function getStoryText(idx) {
        return storyTexts[idx] || [];
    }

    return { buildLevel, getStoryText, movingPlatforms };
})();
