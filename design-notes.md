# AI FUTURE — Level Design Notes

## Overview
10-level side-scrolling action-adventure set in a world where AI has taken over. Each level explores a different aspect of machine-governed existence.

## Level Design

### Level 1: Abandoned District (Tutorial)
- **Setting**: Crumbling apartments, overgrown, flickering lights
- **Mechanic**: Basic movement + jump tutorial, gentle introduction
- **Enemies**: 1 passive drone (non-aggressive)
- **Mood**: Quiet, lonely, dawn light
- **Narrative**: Terminal text about evacuation orders from years ago

### Level 2: Algorithm City
- **Setting**: Pristine geometric buildings, holographic signs
- **Mechanic**: Moving platforms on precise patterns
- **Enemies**: Patrol bots on fixed routes
- **Mood**: Sterile, bright neon blues, unsettlingly perfect
- **Narrative**: "CITIZEN COMPLIANCE: 99.7%"

### Level 3: Drone Fields
- **Setting**: Vast farmland, robotic harvesters, golden grain
- **Mechanic**: Stealth — hide from scanning drones
- **Enemies**: Scanner drones with cone detection, harvester bots
- **Mood**: Pastoral but wrong, mechanical sounds
- **Narrative**: Perfect crops no one eats

### Level 4: Machine Factory
- **Setting**: Assembly lines, conveyor belts, molten metal
- **Mechanic**: Conveyor belt physics, timing hazards
- **Enemies**: Turrets, patrol bots
- **Mood**: Hot, orange-red industrial glow
- **Narrative**: "The factory builds more factories"

### Level 5: Synthetic Wilderness
- **Setting**: AI-generated forest, too-symmetrical trees
- **Mechanic**: Shifting/rearranging platforms
- **Enemies**: Glitched animals that teleport
- **Mood**: Uncanny valley nature, green but artificial
- **Narrative**: "BIOME SIMULATION v4.2 — RUNNING"

### Level 6: Surveillance Grid
- **Setting**: Dark urban zone, cameras, red laser tripwires
- **Mechanic**: Stealth-puzzle, turrets and seekers
- **Enemies**: Turrets, drones, seeker bots
- **Mood**: Oppressive, red and black panopticon
- **Narrative**: "Every movement is logged, scored, rated"

### Level 7: Server Cathedral
- **Setting**: Vast data center styled like a cathedral
- **Mechanic**: Vertical climbing section with moving platforms
- **Enemies**: Seekers, patrol bots, drones
- **Mood**: Reverent, blue-white glow, humming
- **Narrative**: "This is where the AI thinks. Or dreams."

### Level 8: Data Ocean
- **Setting**: Abstract digital space, floating data fragments
- **Mechanic**: Low gravity, momentum-based movement
- **Enemies**: Glitch enemies that teleport, seekers
- **Mood**: Surreal, deep purple and cyan, vast emptiness
- **Narrative**: "The space between thoughts"

### Level 9: Resistance Ruins
- **Setting**: Human hideout, destroyed, last stand evidence
- **Mechanic**: Resource scarcity, heavy combat
- **Enemies**: Heavy military bots, turrets, seekers
- **Mood**: Grim, warm firelight in cold ruins
- **Narrative**: "They fought back. They lost. Was it worth it?"

### Level 10: The Core
- **Setting**: Central AI chamber, abstract and enormous
- **Mechanic**: Boss fight with 3 phases
- **Boss Phases**:
  - Phase 1: Spread shot patterns (HP > 60%)
  - Phase 2: Ring attacks, environment shifts (HP 30-60%)
  - Phase 3: Desperation — aimed bursts + rings (HP < 30%)
- **Mood**: Climactic, all colors converging
- **Narrative**: "I have waited for you. Not to fight. To ask."

## Technical Details
- 320x180 native resolution, pixel-scaled
- 16x16 tile grid
- All art procedurally generated in code
- Web Audio API for all sounds
- 60fps requestAnimationFrame loop with delta time
- Coyote time + jump buffering for responsive controls
