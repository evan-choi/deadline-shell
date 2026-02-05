# DEADLINE SHELL - Game Design Document

> Terminal Survival / Typing Action / Puzzle  
> A survival game played entirely in a terminal UI, where every command costs time and noise while you manage systems and escape.

---

## 1. Core Direction

### Genre & Identity
- **Web-based** keyboard-only terminal game
- **8–12 minute runs** with roguelike meta-progression
- **Real-time survival pressure** + command-based interaction

### Core Fun Factors
1. **Typing = Action** - Every keystroke matters
2. **Information is limited** - Discover through exploration
3. **Risk vs Progress trade-offs** - Every command has cost

### Addiction Hook: Run-based Roguelike + Meta Progression
- Short runs encourage "one more try"
- Permanent unlocks provide growth between runs
- Run variance keeps gameplay fresh

---

## 2. Meta Progression System

### Unlock Type: Permission / Starting Conditions
- Unlocks expand **choices**, not power
- Admin is **never** a starting option (must earn via `su` during run)

### Currency: DATA
| Action | DATA Earned |
|--------|-------------|
| Complete 1 objective | +15 |
| Escape success (2 objectives) | +30 bonus |
| Collect log (each, max 5/run) | +3 |
| Danger escape (survive at distance 1) | +5 (max 3/run) |
| **On death** | Keep **50%** of earned |

### Unlock Shop
| Unlock | Cost | Effect |
|--------|------|--------|
| Engineer Start Option | 80 DATA | Can select engineer at run start |
| Temp SU Token | 40 DATA | Start with 1-use `su` command |
| Engineer Keycard | 30 DATA | Instantly unlock 1 locked door |
| Emergency O2 Can | 25 DATA | +30 O2 (1 use) |
| Early Drain Relief | 50 DATA | No O2 drain for first 30 seconds |
| Shortcut Path Chance | 60 DATA | +20% chance of hub↔airlock direct path |

### Balance Target
- First clear: 3–5 runs
- Engineer start unlock: 5–8 runs

---

## 3. Permission System

### Permission Levels
| Level | Start | How to Obtain |
|-------|-------|---------------|
| guest | Default | - |
| engineer | Unlockable | Meta unlock or `login engineer` |
| admin | Never start | `su` during run only |

### Permission → Command Access
| Command | guest | engineer | admin |
|---------|-------|----------|-------|
| status, ls, cd, scan, logs | ✅ | ✅ | ✅ |
| hide, lock door | ✅ (slow) | ✅ | ✅ |
| repair, reroute power, diagnose | ❌ | ✅ | ✅ |
| override, unlock sector, purge logs | ❌ | ❌ | ✅ |

### Permission → Difficulty Scaling (Trade-off)
| Level | Advantage | Disadvantage |
|-------|-----------|--------------|
| guest | Basic enemy speed | Slow repairs, low scan accuracy |
| engineer | Full repair access, better scans | Enemy reacts to power usage |
| admin | Override access, danger prediction | Security alert events increase |

---

## 4. Run Variance System

### Objective Shuffle
- 3 objectives: Reactor Repair / Security Override / Airlock Prep
- **2 of 3** required for escape
- Each run:
  - Part/keycard **locations randomized** (spread across 2–3 rooms)
  - **Order constraints** vary (e.g., "Security must be done before Reactor access")

### Random Events (5 types for MVP)
| Event | Trigger | Effect | Counter |
|-------|---------|--------|---------|
| **Blackout** | Tick probability | Power -20, `scan` disabled 3s | `reroute power` or wait |
| **O2 Leak** | Enter specific room | O2 drain 2x in that room | `repair vent` or move fast |
| **Locked Sector** | Run start (1–2 rooms) | `cd` blocked | `unlock` (engineer+) or detour |
| **Noise Spike** | Noise 60+ sustained | Enemy speed 2x temporarily | `hide` or reduce Noise |
| **System Glitch** | Random | Next command 30% fail chance | Re-enter or `diagnose` |

### Event Rules
- **2–4 events per run**
- Higher permission = higher event intensity/frequency (balance trade-off)
- Events trigger **terminal warning + CRT glitch effect**

---

## 5. Visual Design

### Tone: Retro CRT Hacker (Green/Amber)
- Primary text: `#9CFF9C` (bright CRT green)
- Background: `#050B05` (very dark green)
- Accent (OK): `#D8FFD8`
- Warning: `#FFE66D`
- Danger: `#FF4D4D`
- Border/lines: `#1A3D1A`

### CRT Effect Intensity: Medium
- Readable text preserved
- Effects scale with game state

### Effect Mapping
| Trigger | Scanline | Noise | Glow | Shake | Vignette | Pulse |
|---------|----------|-------|------|-------|----------|-------|
| Safe (default) | 0.08 | 0.04 | 2px | 0 | 0.18 | - |
| Noise 50+ | 0.10 | 0.06 | 3px | 0.3px | 0.22 | 0.8Hz |
| Noise 80+ | 0.12 | 0.08 | 4px | 0.6px | 0.28 | 1.2Hz |
| Enemy dist 3–4 | 0.10 | 0.06 | 3px | 0.4px | 0.26 | 1.0Hz |
| Enemy dist 1–2 | 0.12 | 0.08 | 4px | 0.8px | 0.35 | 1.6Hz |
| Encounter (0) | 0.14 | 0.10 | 5px | 1.2px | 0.45 | 2.0Hz |
| Error (200ms) | +0.03 | +0.06 | +2px | +1.0px | +0.05 | flash |

### Key Visual Moments
- **Objective complete**: "STAMP" overlay (0.6s) + screen clarity boost
- **`su` success**: Prompt changes `$` → `#` + glow surge (1s)
- **Enemy distance 1**: Red flash (single) + vignette squeeze

---

## 6. Technical Stack

### Architecture
- **Vite + Vanilla JS**
- **DOM**: Terminal text/input/cursor (clarity)
- **Canvas 2D overlay**: CRT effects (scanlines, noise, vignette, pulse, glitch)

### Deployment
- **GitHub Pages** via GitHub Actions
- URL: `https://evan-choi.github.io/deadline-shell/`

### Browser Constraints (per web-games skill)
- Pause on tab hidden (`visibilitychange`)
- Audio requires user interaction (start AudioContext on first input)
- Initial load < 2MB

---

## 7. MVP Scope

### Content
- 6 areas (hub, reactor, medbay, storage, security, airlock)
- 1 enemy type (Stalker)
- 15–20 commands
- 1 ending (escape)
- 5 random event types
- Meta shop with 6 unlocks

### Playtime
- 8–12 minutes per run

---

## 8. Development Phases

### Phase 1 (1–2 weeks)
- Terminal UI (DOM)
- Command parser
- Tick system
- Basic CRT overlay (Canvas)

### Phase 2 (2 weeks)
- Enemy AI
- Resource balance
- Escape logic
- Permission system
- Random events

### Phase 3 (1 week)
- Meta progression (DATA, shop)
- Run variance (objective shuffle)
- Polish CRT effects

### Phase 4 (Polish)
- Sound effects
- Story logs
- Difficulty modes

---

## 9. Design Philosophy

- Commands must feel **meaningful**
- Mistakes are part of **tension**
- Player learns by **dying**
- Interface is part of **gameplay**
- Death is not failure, it's **progress** (DATA carries over)

---

*Document generated: 2026-02-05*
