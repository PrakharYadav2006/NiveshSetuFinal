# निवेश सेतु · NiveshSetu

**Team घोटाला विरोधी · SANGYAN 2026 · Track C (Investor Education for Bharat)**

Two apps share one small backend:

| Folder | What it is |
|---|---|
| `public/simulator/` | **NiveshSetu Market**: the main product. A 20-day market simulator with pretend money, an AI reasoning check before every order, an AI coach and an AI behaviour report. |
| `public/demo-run/` | **Telegram tip demo**: a scripted story (tip → crash → debrief → new trick → recovery scam), now in Hindi and English and personalised. Used for the video. |
| `public/shared/` | Look and theme (`ui.css`, `theme.js`), onboarding questions (`profile.js`), the reasoning check (`gate.js`, `reasoning.js`), the advice filter (`safety.js`) |
| `api/`, `lib/` | Sarvam (AI + voice), guardrails, and a facts builder |

Every company, index, person and price is **fictional**. There is no login, no live market data and there are no broker links.

## Run it

```bash
cp .env.example .env     # Windows: copy .env.example .env  — the file must be named exactly ".env"
# put SARVAM_API_KEY into .env
npm start                # http://localhost:3000  (Node 18+, zero dependencies)
```

| Command | What it does |
|---|---|
| `npm run test:ai` | Checks the key, the model (with response time), Simran's voice and the reasoning check. It tells you why a call failed. |
| `http://localhost:3000/api/health?ping=1` | The same check in the browser. |
| `npm run audio` | Pre-generates voice lines (Hindi + English). |
| `npm test` | Runs the guardrail, behaviour-model, lesson, name and brand tests (65 + brand check). |
| `npm run check:links` | Checks every SEBI video link in `shared/lessons.js` (needs normal internet; run before recording). |

The **AI on / AI offline** pill at the top of the simulator shows whether the server can reach an AI.

**Deploy:** import the repo in Vercel, add `SARVAM_API_KEY` as an environment variable, and deploy.

> 🔐 Rotate the key after the event. Never commit `.env`.

## AI: Sarvam only

| Job | Model | If it fails |
|---|---|---|
| Reasoning check, coach notes, behaviour report, Q&A, explanations | `sarvam-105b-conversations` with `reasoning_effort: low` for speed (falls back to `sarvam-105b`) | Offline rule-based check and fixed text |
| Voice | Bulbul v3: Simran (guide), Aditya (tipster) | Pre-generated audio, then the phone's own voice |
| Speech-to-text | Saarika v2.5 | The phone's recognition. Typing always works. |

## Simulator

1. **Language first**, then **10 questions**: name, age, education (7 levels), work, where they hear about stocks, past investments, goal, a stated reaction to a fall, starting amount, and listen or read. Each answer changes something:
   - education sets the explanation level;
   - work sets which everyday examples the coach uses;
   - the source decides which channel the day-3 buzz arrives in;
   - experience decides whether margin (MTF) is offered;
   - the stated reaction is compared with real behaviour in the crash.
2. **Market**: a trading-app layout with a light/dark theme. It has Explore, Watchlist (★ on any stock), Portfolio and Orders tabs, and a stock page with a chart you can drag, fundamentals with ⓘ, and news.
3. **Reasoning check before every order** (`shared/gate.js` → `api/reason.js`):
   - The player writes or speaks why. The AI judges the **reasoning, never the stock**, against facts the server computes (sales, debt, 5-day run, position size, MTF).
   - A sound reason lets the order through immediately, with the consequence shown.
   - Otherwise it asks **one** pointed question. After the answer it shows **what this order means for them** (e.g. "If the price halves, you lose ₹1,183"), and the Buy button unlocks. A weak reason is noted in the report.
4. **AI coach** (`api/coach.js`): at key moments (welcome, the buzz, chasing a running price, concentration, a tip, MTF, the crash, a panic sell, a margin call, debt news), the AI writes a note about **this player's actual portfolio** and ends with a reflective question. The fixed lesson sits underneath it, under "Learn".
5. **Behaviour report** (`metrics.js` → `api/report.js`):
   - Nine habits, each scored 0–100 from written thresholds, plus a weighted **Resilience score**. Every habit has a "How we measure" toggle.
   - Thinking time is the **median** number of seconds from opening a stock to placing the buy: 15 s or less scores 0, 45 s scores 50, 2 minutes or more scores 100. **24 s scores about 15 ("work on it").**
   - the AI writes a personal insight and a next-time tip for every habit, plus three rules. It never changes a score.

## v0.5: Marathi and alerts

- **Marathi (मराठी)** is the third language.
  - The simulator is fully in Marathi: the onboarding questions, every screen, the coach cards, the reasoning check, tips, lessons and alerts.
  - The AI replies in Marathi, and Sarvam speaks and listens in `mr-IN`.
  - In the Telegram demo the buttons and the AI are in Marathi, but the scripted chat story stays Hindi for now.
  - The advice filter knows Marathi phrasings, both for questions ("घ्यावा का?") and for AI output ("आत्ताच खरेदी करा").
  - **The Marathi was machine-written. A native speaker must read it.**
- **Set an Alert 🔔:** use the stock page, or the bell in the top bar for the list.
  - Rules: price above/below, a one-day % rise/fall, a volume spike against the 20-day average, crossing the 20-day average, or a new 3-month high/low.
  - The rules are checked the moment a new day opens. Each alert fires once.
  - **Simple alert:** an in-app alert card plus the phone's own notification (if allowed). There is no email, so no email address is ever collected.
  - **Alert Trigger Order (ATO):** when the rule hits, the buy or sell runs on its own at that day's price.
    - The reason is checked **when the ATO is set**, with the same one-question check and verdict card. The decision is made calmly, in advance.
    - ATO orders use your own money only (no MTF). They are tagged "ATO" in Orders and count in the report like any other order.
  - Volume is now simulated, and is the same for every player. Rocket Infra's rumour days show a volume spike.

## v0.4 changes

- **Name:** one helper (`setPlayerName` / `getPlayerName` in `shared/profile.js`). It saves the name as you type, on Enter/Go and on Next, and keeps it on the phone (`ns_name`). It is never sent to the AI.
- **Greeting:** "Welcome, Ravi 👋" / "नमस्ते, Ravi 👋" at the top of Explore. It is set as text, never HTML.
- **First-time tips** (`shared/tips.js`) on Explore, Portfolio and Orders. Each shows once, and **?** replays it. The text is fixed and makes no AI call. With listen mode on, it plays a pre-made recording (`tip_<tab>_<lang>`).
- **Verdict card** after the reasoning check:
  - strength badge (decided by a fixed rule, not the AI);
  - what is right;
  - what is missing;
  - **one tip for next time**, chosen from a list of categories the server allows for this order;
  - what this order means for you.
  - The AI only words the tip. Advice, judging the company, a category outside the allowed list, or an invented number all mean the AI's card is thrown away and the fixed card is shown.
- **Coach fix:** the shared advice filter was rejecting normal coach notes (for example "आप खरीद सकते हैं", or quoting the friend's "You should buy too").
  - The coach now has its own check, which rejects only direct instructions.
  - Every AI endpoint now returns `source` / `why` / `ms`. On localhost the coach card shows why the AI note was unavailable.
- **Sell quantity starts at 0**, with ¼ / ½ / All buttons. Buy also starts at 0. The engine and the server-side replay never record a 0-share order.
- **Old-name cleanup:** service-worker caches are at `-sim-v3` / `-demo-v4`, and old caches are deleted on update. `scripts/check-brand.js` runs as part of `npm test`.
- **Flags → lessons → SEBI:**
  - Before a buy, "Things to know" lists the notes on the fictional company (pledged shares, auditor remark, rumour, watch list, delayed results, high debt) plus this order's own risks.
  - The report shows up to 3 lessons for flags you saw and went ahead anyway, whether that holding gained or lost.
  - Video links come only from SEBI's investor video page and stay hidden until `verified: true`.

## Telegram demo

Language, then 7 questions, then a summary screen. The choices now have visible consequences:

| Answer | What changes |
|---|---|
| Education | Explanation level, the debrief text, and quiz difficulty (7 options for basic, 10 for finance) |
| Work | A tailored line from the scammer in the chat; every red flag gets an example from your work |
| Where you hear tips | How the message reaches you (friend forward, YouTube link, group…) |
| Experience | First-timers get a guide on the trading screen |
| Amount on a tip | All gains and losses are shown on that amount |
| Listen / read | Whether the voice plays automatically |

"Buy" goes through the same AI reasoning check. After each run, the AI writes a personal debrief (`api/debrief.js`) that answers the player's own reason and explains the red flags they missed.

## Guardrails

- **No advice:**
  - An advice request ("should I buy…") is refused by a deterministic filter, in the browser and on the server, before any AI call.
  - Every prompt forbids buy, sell and hold calls, predictions, and revealing future days of the game.
  - Every AI string is checked for advice phrases.
- **Grounding:** the server rebuilds the portfolio from the order list (`engine.replay`) and builds the facts itself. Any number in an AI reply that is not in those facts makes the reply fail, and the fallback is used.
- **Privacy:** the player's name never leaves the phone. Only answers and game decisions are sent, and nothing is stored. Voice is transcribed and dropped.
- **Scores are rules, not AI:** `metrics.js` (simulator) and `engine.js` (demo).

## Before the demo
- [ ] `npm run test:ai` passes on your laptop. The build sandbox could not reach Google or Sarvam, so the live calls were tested against a local mock.
- [ ] Run `npm run audio` so the scripted lines play offline in Simran's voice.
- [ ] A native speaker reads the Hindi and English text (`shared/profile.js`, `simulator/data.js`, `simulator/i18n.js`, `demo-run/content.js`, `demo-run/app.js`).
- [ ] Test on a cheap Android phone with the network throttled to 3G.
- [ ] `npm run test:ai` step 4: all 10 coach events come back from the AI. If one doesn't, it prints why.
- [ ] `npm run check:links`, then watch each candidate video and set `verified: true`, `watchedBy` and `checkedOn` in `shared/lessons.js`. Also open the SEBI page tabs that did not load the first time.
- [ ] Testers who used an old install: reinstall the app, or reload twice, so the new name shows.
"# NiveshSetuFinal" 
