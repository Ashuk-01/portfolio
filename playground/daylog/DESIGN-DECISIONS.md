# DayLog — Design Decisions Document

## What is DayLog?

A daily health tracking app for someone with IBD (Inflammatory Bowel Disease). Replaces a Google Sheets workflow where 9 health categories are tracked daily: meals (breakfast, lunch, dinner), snacks, fruits, water, tea, sleep, gym, and mental health.

---

## The Problem

### Why Google Sheets doesn't work
- Opening a laptop every time to log is a hassle
- Google Sheets is not clearly visible on mobile
- No way to see weather alongside health data
- No quick-entry — every cell requires navigation

### Why existing apps fail (Bearable competitive analysis)

Researched 15+ health tracking apps. Bearable is the closest competitor but has major issues confirmed by thousands of users:

1. **Overwhelming interface** — Bearable's own support team created a page titled "Make Bearable less overwhelming." Users report 10+ minutes to log a full day. The founder acknowledged on Reddit that navigation between sections is frustrating.

2. **No weather auto-tracking** — 947 votes on their roadmap, requested for 5+ years, still not built. Users with IBD need to correlate health with weather.

3. **Primitive food logging** — Only yes/no or 1-3 rating toggles. No simple text input for "what I ate." Users say "manually entering each ingredient is too time consuming" and stopped using the app.

4. **No day-at-a-glance view** — Data scattered across input screens and separate report pages. No single screen showing your whole day.

5. **Weak insights** — Users tracking for 3+ years report no useful correlations. The stats aren't real statistical correlation, just co-occurrence.

6. **No food-to-bowel-movement correlation** — The #1 thing an IBD user needs. Doesn't exist.

7. **No home screen widgets** (583 votes), no Apple Watch app (205 votes) — users forget to log because opening the full app is too much friction.

8. **Data loss** — Switching to another app mid-entry causes Bearable to lose all entered data.

### Other apps reviewed
- Cara Care, My IBD Care, GI Monitor, myColitis — too focused on IBD symptoms, missing food detail, weather, gym, sleep
- Daylio — mood-focused, not health-comprehensive
- CareClinic — no auto weather
- Exist.io — good correlations but tag-based food logging
- Flaredown — free but less polished
- Notion templates — still a database, not a health app

---

## Core Design Philosophy

### "One Screen, One Minute"

The fundamental insight: Bearable's problem is not missing features — it's too many interactions per feature. DayLog inverts this.

- **The whole day fits on one screen.** No tabs, no scrolling through 10 sections.
- **Every input is 1-2 interactions max.** Tap to type food. Tap +/- for water. Tap a pill for mood.
- **Weather is invisible.** Shown automatically, zero user effort.
- **No save button.** Everything auto-saves on change (in the full app version).
- **Opening the app = you're already on the right screen.**

**Target: Under 60 seconds for a full day's log. Under 30 seconds for a quick log.**

---

## Layout Decisions

### Three options considered

**Option A: "The Stack" — Vertical card stack** (CHOSEN)
- 4 section cards: Mind, Meals, Intake, Body
- Each card is a visual container with a label
- UX principles: Miller's Law (4 chunks, well within 7±2), Gestalt Proximity (related items grouped), Progressive Disclosure
- Why chosen: Familiar pattern (Jakob's Law — users expect card-based layouts), safest for portfolio (interviewers understand it immediately), easiest to build, best for edge cases

**Option B: "The Timeline" — Morning/Afternoon/Evening**
- Organized by time of day, like a journal
- Rejected: IBD users eat irregularly — time slots feel rigid. Empty "morning" section causes guilt. Water split across sections loses the simple counter.

**Option C: "The Quick Log" — Compact grid**
- Dense, minimal chrome, icons doing heavy lifting
- Rejected: Too dense for small phones, harder to find specific items, icons need to be perfectly clear or users get confused.

### Section order (backed by research)

| Order | Section | Why here | UX Principle |
|-------|---------|----------|-------------|
| 1 | Header (Date + Weather) | Passive — zero effort, grounds the user in today | — |
| 2 | Mind (Mood) | Fastest input (1 tap). Creates momentum. | Endowed Progress Effect — user feels "started" immediately |
| 3 | Meals | Most important for IBD food correlation. High daily variance. | Serial Position Effect — most important thing early |
| 4 | Intake (Water + Tea) | Quick counters. Palate cleanser after text inputs. | Effort curve: easy → hard → easy → easy |
| 5 | Body (Sleep + Gym) | Logged once per day. Low daily variance. | Less-changed items lower |

The effort curve is deliberate: start with 1-tap (mood), then text input (meals — hardest), then counters (easy again), then time pickers + toggle (easy). The user never hits two high-effort sections in a row.

---

## Interaction Decisions

### Meal text input
- **Pattern chosen:** Tap-to-expand inline input
- Tap the row → inline text input appears in place → type → tap away or hit enter → text shows
- Empty state shows "—" (a dash), NOT "tap to add..." — dashes are neutral, non-judgmental. "Tap to add" creates obligation.
- UX principle: Psychological Reactance — when people feel their freedom of choice is threatened, they resist. Pressure language causes app abandonment.

### Water/Tea counters
- **Pattern chosen:** [- N +] stepper buttons
- Large 44px circular tap targets (minimum recommended by Apple HIG)
- Number animates with a scale(1.15) "bump" on change — the Oura/Whoop premium feedback pattern
- Optional haptic: navigator.vibrate(10) — 10ms micro-buzz
- UX principle: Fitts's Law — large targets close together are fastest to acquire

### Mood selector
- **Pattern chosen:** Word pills ("Great" / "Good" / "OK" / "Low" / "Bad")
- NOT emoji — emoji faces feel childish for someone dealing with IBD. Words are precise and respectful.
- NOT a slider — research consistently shows sliders are imprecise on mobile (fat finger problem), slow, and cause anxiety about "exact" placement.
- Pills fill with their mood color on selection. Others stay default — no dimming (dimming implies unselected states are "wrong").
- Optional note field appears below after selection — not before.
- UX principle: Hick's Law — 5 choices is manageable. More than 7 would slow decisions.

### Sleep
- Native `<input type="time">` — gives the native scrolling wheel picker on iOS/Android
- Auto-calculates duration displayed below
- Handles overnight correctly (bedtime 11:30 PM, wake 7:00 AM = 7.5 hours)

### Gym
- Toggle switch (on/off) — simplest possible input for a binary question
- When toggled on, a text input slides in below for "What did you do?"
- When toggled off, text input slides out but data is preserved (in case of accidental toggle)

### Weather
- Hardcoded in prototype (no API call)
- In full app: auto-fetched via geolocation + OpenWeatherMap API, stored per day
- The key use case: "I got sick on Jan 6 — what was the weather that day?"

---

## Emotional Design Decisions

### Why no red in the mood scale
The mood colors go from sage (great) through neutral to terracotta (bad):
- Great: #6B8F71 (sage)
- Good: #8BAF91 (light sage)
- OK: #B8B4AE (warm neutral)
- Low: #C4907C (muted terracotta)
- Bad: #B07264 (deep terracotta)

This is a **temperature shift, NOT a traffic light.** Red triggers medical/alarm associations. For someone with a chronic condition, seeing red on their health tracker feels like "DANGER" — that's emotionally harmful. Deep terracotta communicates "this is hard" without screaming.

An interviewer would notice this. It demonstrates understanding of emotional design for chronic illness (Don Norman's three levels: visceral, behavioral, reflective).

### Empty states use dashes, not "tap to add"
- Research (Epstein et al., 2015): Empty fields in health apps cause guilt and are a known cause of app abandonment
- A dash (—) is neutral — it's not asking anything. "Tap to add..." implies you should.
- Every field is optional. The app works fine with 0 fields filled.

### Reassurance text
At the bottom of the empty screen:
> "Log what feels right. Everything here is optional."

This sets the emotional tone. A user with IBD reads this and feels: this app isn't going to judge me.

### No streaks, no completion tracking
- No "You've logged mood 12 days in a row!" — because day 13 will feel like failure if skipped
- No progress bars showing "3/5 categories filled" — incomplete tasks create tension (Zeigarnik Effect) which is harmful for chronic illness users
- Partial data is infinitely more valuable than no data (user quits)

---

## Visual Design Decisions

### Design quality target
Premium minimal — inspired by Linear, Cursor, Mercury, Ramp. The app should feel like a user paid for it. Should feel designed by a senior UX designer with 15 years experience.

### What makes Linear/Cursor/Mercury feel premium (research findings)

1. **One foreground color at varying opacities** — Cursor uses #26251e at 100%, 60%, 50%, 40% for entire text hierarchy. Creates perfect tonal harmony.
2. **Extremely subtle borders** — 2-6% opacity, barely visible.
3. **Generous spacing between sections, tight within** — 32-40px between groups, 8px inside.
4. **One accent color, used sparingly** — everything else is grayscale.
5. **Active state = scale(0.97)** — not opacity change. The subtle shrink on press is THE premium touch feel.
6. **No Bold (700) in content** — Medium (500) and Semibold (600) max.
7. **4 text sizes max** — huge jumps create hierarchy. Juniors use 8 sizes, seniors use 4.
8. **No shadows** — layered backgrounds and subtle borders instead.
9. **Custom easing** — cubic-bezier(0.16, 1, 0.3, 1) for smooth animations.

### Color Palette

**Sage accent chosen over terracotta because:**
- Research: sage/muted green is the #1 most calming color across studies (Kaya & Epps, 2004)
- For someone suffering from IBD, sage says "healing, growth"
- Most health apps use blue/teal — sage is distinctive for portfolio
- Warm cream + sage mirrors Cursor's warm palette approach

```
Background:      #F6F4F0   (warm cream, never pure white — pure white feels clinical)
Surface:         #EDEAE4   (card backgrounds, one step darker)
Surface hover:   #E5E2DC   (interactive hover state)

Text primary:    #2C2B28                    (warm near-black, never cool)
Text secondary:  #2C2B28 at 55% opacity     (labels, supporting text)
Text tertiary:   #2C2B28 at 35% opacity     (placeholders, hints, dashes)
Text quaternary: #2C2B28 at 20% opacity     (ghost elements)

Accent:          #6B8F71   (muted sage)
Accent hover:    #5A7D60   (darker sage for hover states)
Accent soft:     #6B8F71 at 10% opacity     (background tints)

Borders:         #2C2B28 at 6% opacity      (barely visible — Cursor pattern)
Dividers:        #2C2B28 at 4% opacity      (even more subtle)
```

**Why warm cream not white:** Pure white (#FFFFFF) feels clinical, like a hospital form. Research on emotional affect (Piepenbrock et al., 2013) shows warm off-white backgrounds feel more open, calm, and positive. Cursor uses #f7f7f4 for the same reason.

### Typography — Plus Jakarta Sans

**Why Plus Jakarta Sans over Space Grotesk (portfolio font):**
- Rounded terminals + open apertures = warm and approachable (research-backed for health apps)
- Space Grotesk is geometric sans — functional but slightly cold for someone who's suffering
- The app having its own font makes it feel like a "real product" in the portfolio case study
- Plus Jakarta Sans is free on Google Fonts

**Type scale — 4 sizes only (senior pattern):**
```
11px  — weight 500, uppercase, tracked +0.05em → section labels
13px  — weight 400 → secondary info, weather, durations
15px  — weight 400/500 → primary content, meal text, data values
20px  — weight 600, tracked -0.02em → date header
```

**Key typography decisions:**
- Never use Bold (700) — heaviest is Semibold (600). Bold feels aggressive for a health app.
- Negative letter-spacing on 20px+ (tight tracking at large sizes = premium)
- Positive letter-spacing + uppercase on 11px labels (the Linear/Mercury section label pattern)
- tabular-nums on all numbers (counters, sleep times, dates) — numbers align vertically, feels engineered
- Line-height 1.4 for body, tighter for headings

### Spacing System — 8px grid, strict multiples

```
4px   — between icon and label
8px   — within a component
12px  — between related items (meal rows)
16px  — card internal padding
20px  — screen horizontal padding
24px  — between components within a section
32px  — between section cards
40px  — screen top/bottom breathing room
```

The rule: generous spacing BETWEEN sections (32px), tight spacing WITHIN (8-12px). This is the Linear pattern — creates clear grouping (Gestalt Proximity) while keeping pages compact.

### Cards and Borders
- Cards: #EDEAE4 background + 1px border at 6% opacity + border-radius 12px
- No shadows anywhere — Linear uses zero shadows in dark mode. We use layered backgrounds instead.
- Inner elements: border-radius 8px (nested radius rule: inner = outer - gap)
- Pills/buttons: border-radius 100px (full pill)

### Micro-Interactions
- Easing: cubic-bezier(0.16, 1, 0.3, 1) — Linear's signature ease-out
- Press state: scale(0.98) on cards, scale(0.95) on buttons — 100ms (not opacity change)
- Counter bump: scale(1.15) → scale(1.0) on number change — 250ms with spring easing
- Transitions: 200ms for all state changes
- Page load: sections stagger in with 50ms delay between each, 400ms fadeUp animation
- Doherty Threshold: all feedback under 400ms feels instantaneous

---

## Edge Cases Considered

| Edge Case | Problem | Solution | Principle |
|-----------|---------|----------|-----------|
| Skipped meal | Empty field causes guilt | Show "—" not "empty" or "tap to add" | Psychological Reactance |
| Irregular eating | "Breakfast" at 2pm feels wrong | Labels are slots, not times — accepts any food | Flexibility |
| Mood skip | User doesn't want to rate mood | Section works without selection, no "required" indicator | Every field skippable |
| Late night logging | Ate at 11pm, logging at 12:30am | Full app: configurable day boundary (default 4am) | Midnight boundary |
| Counter overshoot | Tapped +1 too many | Immediate -1 button, number clearly visible, sub-400ms response | Error Recovery (Nielsen) |
| Partial completion | Only 2 of 5 categories logged | No progress bars, no "X% complete." Any entry = valid day. | No guilt |
| First time user | Empty screen is intimidating | Dashes show structure, reassurance text at bottom, fields teach what to do | Empty state = onboarding |

---

## Screens Built

### Screen 1: Today View (main screen)
- Header: date + hardcoded weather
- Mind: 5 mood pills + optional note
- Meals: 5 rows (breakfast, lunch, dinner, snacks, fruits) with inline editing
- Intake: water + tea counters with +/- buttons
- Body: sleep time pickers + gym toggle
- Reassurance text at bottom

### Screen 2: History View (calendar)
- Month grid with prev/next navigation
- Mood-colored dots on days with data (using the sage → terracotta scale)
- Days without data: no dot, no highlight, no guilt
- Hardcoded sample data (~2 weeks, mixed moods — not all positive)
- Toggle between Today and History via tapping the date

---

## UX Principles Referenced

| Principle | How Applied |
|-----------|------------|
| Fitts's Law | 44px minimum tap targets, counters close together |
| Hick's Law | 5 mood options, 5 meal slots — manageable choices |
| Miller's Law | 4 section cards — well within 7±2 chunks |
| Jakob's Law | Card-based layout — familiar from other health apps |
| Serial Position Effect | Most important (mood, meals) at top |
| Endowed Progress Effect | Mood first — 1 tap makes user feel "started" |
| Zeigarnik Effect | Avoided — no progress bars that create completion anxiety |
| Gestalt Proximity | Related items grouped in cards |
| Progressive Disclosure | Note fields appear only after mood/gym selection |
| Recognition over Recall | Visible labels on every field, no hidden features |
| Psychological Reactance | Everything skippable, no guilt language |
| Doherty Threshold | All feedback under 400ms |
| Don Norman's Emotional Design | Visceral: calm colors. Behavioral: fast logging. Reflective: empowerment, not surveillance. |
| Aesthetic-Usability Effect | Minimal design perceived as easier to use |
| Tesler's Law | Complexity moved to interactions, visual surface stays simple |

---

## Technical Decisions

- **HTML/CSS/JS only** — no frameworks, matches portfolio tech stack
- **No LocalStorage in prototype** — refresh resets. Fine for portfolio demo.
- **Plus Jakarta Sans via Google Fonts** — variable font for refined weight control
- **CSS custom properties** for all design tokens
- **BEM-inspired naming** — consistent with portfolio codebase
- **Mobile-first** — designed for 375-430px, scales up

---

## What's Next (Future Iterations)

If converting to a full working app:
- LocalStorage for data persistence
- OpenWeatherMap API for auto weather
- PWA setup (manifest.json, service worker) for home screen install
- Offline support
- Data export (JSON download)
- Simple correlations ("On days you slept 7+ hours, your mood was better")
- Configurable day boundary (default 4am for midnight edge case)

---

## Portfolio Integration Plan

- Case study page (`health-tracker-case-study.html`) following existing CleverX pattern
- Sections: Problem (Bearable analysis), Principles ("One Screen, One Minute"), Solution (screenshots), Interaction Design, Reflections
- Add as project 04 on portfolio homepage
- GSAP scroll animations auto-apply from existing script.js
