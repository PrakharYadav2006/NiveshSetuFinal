# NiveshSetu (निवेश सेतु): Project Context

> Paste this file at the start of a new chat or coding session to restore the full context of the project.
> Written 3 Oct 2026, after the "Sarvam only / ask once" revision. It covers the event, the product, every decision, the architecture, the guardrails, what was tested, what was not, and what is left.

---

## 1. The event and the team

| Item | Detail |
|---|---|
| Event | **SANGYAN Investor Resilience Hackathon**, IIT (BHU) Varanasi, with SEBI and NSDL |
| Dates | 1–4 Oct 2026 (the last message was on 3 Oct 2026) |
| Track | **Track C: Investor Education for Bharat** |
| Team name | **Ghotala Virodhi (घोटाला विरोधी)** |
| Builder / contact | Ash (Aryan Rath), B.Tech Mining Engineering, IIT (BHU), batch 2025–29. Direction: quant, data science and finance. |
| Team size | **Not confirmed. Do not state it anywhere** (slides, README, video, pitch). |
| Fictional company in the scam story | Gada Electronics |
| Persona in the scam story | Atmaram Tukaram Bhide |

**How Ash wants to be worked with:** direct, honest, no-fluff feedback. No validation, and say so when something is a bad use of time. Standing instruction: *"Do the changes and ask me if you have any doubts."*

---

## 2. The product in one paragraph

**NiveshSetu** is a free, no-login, Hindi + English **market simulator with pretend money**, built for first-time and low-literacy Indian investors. It teaches *how to think* before investing, not *what to buy*. Before every order, an AI checks the player's **reasoning** (never the stock), asks **one** pointed question, shows the **consequence** of the order in rupees, and then lets them decide. At the end, a **behaviour report** scores nine habits with written, deterministic rules. The AI only explains the scores and gives tips; it never decides a score. A second app, the **Telegram tip demo**, is a scripted scam story (tip → crash → debrief → new trick → recovery scam) used for the pitch video.

Name history: the app began as **"Ruko"**. The folder is still called `ruko/`, but the product name is **NiveshSetu (निवेश सेतु)**. The simulator's title is "निवेश सेतु बाज़ार / NiveshSetu Market". Ash chose the name himself after a long naming discussion (see §12).

---

## 3. Non-negotiable guardrails

These apply to every feature, prompt and screen. If a change breaks one of these, it is wrong.

1. **No stock tips and no buy/sell/hold advice**, from the AI or from fixed text.
2. **No monetisation, no broker links, no affiliate anything.**
3. **Fictional companies only.** Every company, index, person and price is invented. No live market data.
4. **No PII.** The player's name stays on the phone and is never sent to the AI. No login. Voice is transcribed and dropped.
5. **Never promise recovery of lost money.** (This matters in the recovery-scam part of the demo.)
6. **Scores come from deterministic rules, not AI.** The AI may write words around a score but never changes it.
7. **Every AI sentence is validated.** Advice phrases and any number that is not in the server-computed facts cause the reply to be rejected, and the app falls back to offline text.
8. **Reveal no future days of the game.**

---

## 4. Timeline of what was asked and built

### Phase 0: Original build (earlier sessions)
- Two apps, a shared look, a zero-dependency Node server, Bhashini + Gemini + Sarvam mix, an AI "gate" before buying.

### Phase 1: API key trouble and naming
- Ash photographed `.env` and reported "API key couldn't be connected". The photo showed a key with a `.env.example`-style layout.
- **Fix:** a tolerant env loader (`lib/env.js`) that accepts `.env`, `.env.txt` and `.env.local`, strips BOM/CRLF/quotes, and a key diagnostic that masks the key and checks its format.
- **Answer given:** the real file must be named exactly `.env`; `.env.example` is only a template.
- **Naming:** Ash asked for symbolic names, then said the earlier lists were not good, then said "like Zerodha, whose meaning is zero barrier", then "don't stress on the word pause or stop", then "only English names". He picked **NiveshSetu** in the next message.

### Phase 2: The 14-change request (`update.md`)
Ash wrote 14 changes. All were done:

| # | Ask | Outcome |
|---|---|---|
| 1 | AI said "AI isn't connected" inside the simulator even with the key in | Health endpoint, an "AI on / AI offline" pill, and a proper server-side AI layer |
| 2 | The buy check was hard-coded, not really questioning | A real AI reasoning check (`api/reason.js`) with server-computed facts |
| 3 | Behaviour analysis should be precise with an AI tip for each habit | 9-habit model (`metrics.js`) + AI insight and tip per habit (`api/report.js`) |
| 4 | Telegram demo needs the new UI, the simulator updates and English | Fully bilingual demo with a new look |
| 5 | Demo choices (8th pass vs 10th pass) had no consequence | Education changes the explanation level, quiz difficulty and debrief; work, source, experience and stake also change the story |
| 6 | Replace Bhashini with Gemini | Done at the time, **superseded** in Phase 3 |
| 7 | Make the user think more, but let them buy if the reason is proper | The reasoning check: a sound reason passes straight through |
| 8 | Rename Ruko → NiveshSetu | Done everywhere (UI, manifests, README, package name) |
| 9 | 24 s of thinking time got a tick, so check the metrics model | Thinking time is now the **median** seconds with thresholds; **24 s scores about 15 ("work on it")** |
| 10 | The AI's role in coaching should be bigger | `api/coach.js` writes notes about the player's actual portfolio |
| 11 | AI shouldn't be there just for simplification | Used for reasoning, coaching, reporting and the debrief |
| 12 | Use the Sarvam setup in `update.md`; female voice = Simran | Models and voices updated (see §7) |
| 13 | Dark and light mode | `theme.js` + CSS tokens |
| 14 | Watchlist | ★ on a stock page, a Watchlist tab, and it counts toward the research score |

`update.md` itself said: Sarvam chat model `sarvam-105b-conversations`, TTS `bulbul:v3`, speakers `aditya` and `priya` (Ash later said to use **simran** for the female voice), and the `.env` filename fix.

At that point Ash answered two design questions: **"Gemini thinks, Sarvam speaks"** and a **"soft gate"**. Both have since been replaced.

### Phase 3: The 6-change request (the latest)
1. AI doesn't simplify on the starting page → "✨ Explain it for me" now appears on the welcome card and on every coach card that has a lesson.
2. AI is too slow → `reasoning_effort: low`, one retry on bad JSON, a shorter flow.
3. AI should ask **only once** while buying, tell the **consequence**, then let them buy → implemented (see §6.3).
4. Remove Gemini, **Sarvam only** → `lib/gemini.js` and `lib/speech/bhashini.js` deleted, no Gemini references left in code.
5. "Sarvam is fast, we tried" (this is why 1–4 solve each other) → Sarvam is the single provider.
6. "It works without a name; minor bug fix" → capitalised English headings in the no-name path (they started with lowercase, such as "here is your setup"), and pressing **Skip** after typing a name now clears the name.

### Phase 4: Change Spec v0.4 (8 changes, 3 Oct afternoon)
1. **Name glitch.** The name was only saved when Next was pressed, so any re-render (for example the theme toggle) wiped what had been typed. It is now saved as you type, on Enter/Go and on Next, and stored on the phone (`ns_name`).
2. **"Welcome, name 👋"** greeting on Explore.
3. **First-time tips** on Explore, Portfolio and Orders. They show once, can be replayed with "?", use fixed text and make no AI call.
4. **Verdict card** after the reasoning check:
   - strength badge (fixed rule);
   - what is right and what is missing;
   - a tip whose category (`tip_type`) is chosen by the server;
   - the consequence.
   - It also appears for sound reasons. Each order stores `gate.tipType` and `flagsSeen`.
5. **Coach AI.** The shared advice filter rejected normal coach notes ("खरीद सकते हैं", quoted buzz text). The coach now has its own check that rejects only direct instructions. Every endpoint returns `{ok, source, why, ms}`, the client allows one coach call at a time with a 45 s timeout, and `test-ai.js` checks all 10 events.
6. **Sell starts at 0**, with ¼ / ½ / All buttons. Buy starts at 0 too. A 0-share order is rejected in the engine, the replay and `cleanOrders`.
7. **Old name.** There was no old name left in the code, so the cause was a stale cache. Caches were bumped to `niveshsetu-sim-v3` / `niveshsetu-demo-v4`, old caches are deleted, and the app registers its service worker with `updateViaCache: 'none'`. `scripts/check-brand.js` is now part of `npm test`.
8. **Flags → lessons → SEBI.** Company notes live in `COMPANY_FLAGS` in `simulator/data.js`:
   - Rocket Infra: pledged shares, high debt, rumour, watch list.
   - Vikram Ispat: high debt, pledged shares, delayed results.
   - Digital Dukaan: auditor remark.
   - `CAUSE_FLAG` links Rocket Infra on day 8 to the rumour and Vikram Ispat on day 14 to its debt.
   - `shared/lessons.js` holds the lessons and the unverified SEBI candidates. The report shows up to 3 lessons, and the demo debrief shows them too.
   - `scripts/check-links.js` checks the links. The sandbox gets a 403 from the SEBI site, so this has to be run on Ash's machine.

### Phase 5: Marathi and "Set an Alert" (3 Oct evening)
- Ash's decisions:
  - Alerts go to the app and the phone notification only. **No email**, because that would mean collecting PII.
  - **An ATO's reason is checked when the ATO is set.**
  - **Marathi covers the whole simulator; in the demo only the UI and the AI are Marathi**, and the scripted story stays Hindi.
- Language code `mr`:
  - `L()` falls back to Hindi for anything without Marathi.
  - The server uses `langOf` / `pickLang` in `lib/facts.js`, and `baseRules('mr')` tells the AI to write real Marathi.
  - Sarvam TTS and STT use `mr-IN`.
- `simulator/alerts.js` holds the conditions, `evaluate()` (one-shot, never on the day the alert was set) and the hi/en/mr strings.
- `engine.js` adds a deterministic `volume`, `avgVolume` and `sma`. Prices are unchanged.
- ATO orders carry `ato: true`. Caches are `niveshsetu-sim-v4` / `niveshsetu-demo-v5`.

### Deferred by Ash
- **The scam-message part of the demo** ("Forget about the scam message part now, we will do it afterwards when we are recording the video"). Do not start on it until he asks.

---

## 5. Architecture

### Stack
- **Node 18+, zero dependencies.** `server.js` serves `/public` and runs Vercel-style `(req, res)` handlers from `api/*`.
- **Plain ES modules** in the browser. No framework, no build step.
- **PWA**, with service workers that are network-first and fall back to the cache (`niveshsetu-sim-v2`, `niveshsetu-demo-v3`).
- **Deploy:** Vercel. `vercel.json` outputs `public/`. Add `SARVAM_API_KEY` as an environment variable.

### File map

```
ruko/
├─ server.js                 static server + /api router (try/catch, no-cache, logs "Sarvam key मिली")
├─ vercel.json               output directory = public/
├─ package.json              name niveshsetu 0.2.0; scripts: start, audio, test:ai, test:sarvam, test
├─ .env.example              template (SARVAM_API_KEY etc.)  |  .env = real key, git-ignored
├─ README.md                 setup, AI table, simulator + demo behaviour, guardrails, pre-demo checklist
├─ PROJECT_CONTEXT.md        this file
├─ api/
│  ├─ reason.js              reasoning check before an order (the "gate")
│  ├─ coach.js               AI coach notes by game event
│  ├─ report.js              AI insight + tip per habit, 3 next-time rules
│  ├─ debrief.js             AI debrief for the Telegram demo
│  ├─ explain.js, ask.js     "Explain it for me" and Q&A
│  ├─ tts.js, stt.js         Sarvam voice and speech-to-text
│  └─ health.js              ok, brain, voice, listen, sarvam; ?ping=1 makes a live call and returns ms
├─ lib/
│  ├─ sarvam.js              the Sarvam client: post, chat, tts, stt, stripThinking
│  ├─ ai.js                  think(), thinkJSON() with one retry, extractJSON, status, ping
│  ├─ speech/index.js        VOICES, canSpeak/canListen, tts, stt
│  ├─ safety.js              numbersGrounded, checkFields/Explain/Answer, per-IP-per-URL rateLimited, baseRules(lang)
│  ├─ facts.js               rebuilds the game from the order list and produces server-computed facts
│  └─ env.js                 loadEnv() (.env/.env.txt/.env.local), describeKey()
├─ public/
│  ├─ index.html             landing page
│  ├─ shared/                ui.css, theme.js, brand.js (LOGO), listen.js (mic → /api/stt), gate.js,
│  │                         reasoning.js (offline evaluator), profile.js (questions + buildProfile), safety.js (advice gate)
│  ├─ simulator/             app.js, engine.js (+replay), metrics.js, coach.js, data.js, i18n.js, chart.js, voice.js, sw.js …
│  └─ demo-run/              app.js, engine.js, content.js ({hi,en}), chart.js, voice.js, demo.css, sw.js …
└─ scripts/
   ├─ test-ai.js             checks key, chat (ms), Simran's voice (writes test-tts.wav), reasoning check
   ├─ test-safety.js         28 guardrail and behaviour-model tests
   └─ generate-audio.js      pre-generates hi+en voice lines (ids `${id}_${lang}`) and question audio
```

Deliverable: `/home/claude/niveshsetu.zip`. It had 68 files at its last build, **no `.env`**, and no Gemini references.

---

## 6. How each feature works

### 6.1 Onboarding (simulator)
Language first, then **10 questions**: name, age, education (7 levels), work, where they hear about stocks, past investments, goal, a stated reaction to a fall, starting amount, and listen or read. **Name is optional**, and Skip must really clear it.

Each answer changes something:

| Answer | Effect |
|---|---|
| Education | Explanation level: `basic` / `mid` / `fin` |
| Work | The everyday analogy domain the AI uses (farm, shop, etc.) |
| Where they hear about stocks | The channel through which the day-3 "buzz" arrives |
| Past investments | Whether margin (MTF) is offered |
| Stated reaction to a fall | Compared with real behaviour in the crash |
| Starting amount | Starting cash |
| Listen or read | Whether voice plays automatically |

### 6.2 Market screens
Explore → Watchlist → Portfolio → Orders → stock page (a draggable chart, fundamentals with ⓘ, news) → 20-day report. Light and dark theme (`data-theme` plus `prefers-color-scheme`, toggle ☀️/🌙). A watchlist ★ on a stock page. Watching a stock from an earlier day raises the research score.

### 6.3 The reasoning check (the "gate")
`public/shared/gate.js` ↔ `api/reason.js`, used by the simulator order sheet **and** the demo's Buy button.

Flow:
1. The player writes or speaks *why* (starter chips are available).
2. An **advice-request filter** runs first, in the browser and on the server. "Should I buy…" is refused without any AI call.
3. **Round 0:** the AI judges the reasoning only, never the stock. The verdict is `sound` / `partly` / `weak` / `advice`, with a score:
   - sound 70–100: business reason from visible facts, the downside was considered, the size fits.
   - partly 40–69: some of that is there, or the order carries an unaddressed risk (over 25% in one company, MTF, high debt, a 15% run in 5 days, an unconfirmed rumour).
   - weak 0–39: a tip, hype, "it's rising", FOMO, no reason.
   - A **sound** verdict goes straight through.
4. Otherwise it asks **exactly one** short, personal question that uses one specific fact (a number or news item).
5. After the player's answer (**final check**, `question: ''`), it shows **"📌 What this means for you"**, for example "You are putting in ₹2,366. If the price halves, you lose ₹1,183". With MTF: "just a 25% fall wipes out your own money, plus daily interest". For a sell: what locks in.
6. The **Buy button then unlocks** as a normal button (no "Buy anyway"). A weak reason is still recorded as `gate.overridden` and shows in the report.
7. The server keeps scores in range with clamps: sound ≥70, partly 40–69, weak ≤39. The number can't contradict the verdict.

Offline fallback: `public/shared/reasoning.js`, a rule-based evaluator that also produces flags and a computed consequence (`c_buy`, `c_w`, `c_lev`, `c_sell`).

### 6.4 AI coach (`api/coach.js`)
At key moments (welcome, the buzz, chasing a running price, concentration, a tip, MTF, the crash, a panic sell, a margin call, debt news) the AI writes a note about **this player's actual portfolio** and ends with a reflective question. The fixed lesson sits underneath it under "Learn". Any card with a `concept` has **"✨ Explain it for me"**.

### 6.5 Behaviour model (`public/simulator/metrics.js`)
Nine habits, each scored 0–100 by written thresholds, plus a weighted **Resilience score**. Every habit has a "How we measure" toggle.

| Habit | Weight |
|---|---|
| research | 0.17 |
| reasoning (quality of reasons) | 0.17 |
| thinking time | 0.10 |
| FOMO | 0.14 |
| concentration | 0.12 |
| crash behaviour | 0.15 |
| leverage | 0.07 |
| churn | 0.04 |
| pause | 0.04 |

**Thinking time** is the **median** seconds from opening a stock to placing the buy: ≤15 s = 0, 45 s = 50, ≥120 s = 100. So **24 s ≈ 15**, which is "work on it". This fixes Ash's bug where 24 s got a tick.
The AI (`api/report.js`) writes an insight and a tip per habit plus 3 next-time rules, **but never scores**.

### 6.6 Telegram tip demo (`public/demo-run/`)
Language → 7 questions → setup → chat / trade / quiz / crash / debrief / outcome2 / recovery / help / results. Fully bilingual (`content.js` uses `{hi,en}`). Consequences:

| Answer | What changes |
|---|---|
| Education | Explanation level, debrief text, quiz options (7 for basic, 10 for finance) |
| Work | A tailored line from the scammer; every red flag gets an example from the player's work |
| Where they hear tips | How the message reaches them (friend forward, YouTube link, group) |
| Experience | First-timers get a guide on the trading screen |
| Amount on a tip (`stake`) | All gains and losses are shown on that amount |
| Listen / read | Whether voice autoplays |

Buy goes through the same reasoning check; the debrief (`api/debrief.js`) is AI-written, answers the player's own reason, and explains the red flags they missed. Voices: **Aditya** = tipster (pace 1.2), **Simran** = calm guide (pace 0.95).

---

## 7. AI provider: Sarvam only

| Job | Model | Notes |
|---|---|---|
| Chat (reasoning check, coach, report, debrief, Q&A, explain) | `sarvam-105b-conversations`, then fallback `sarvam-105b` | `POST https://api.sarvam.ai/v1/chat/completions`, header `api-subscription-key`. `reasoning_effort: 'low'` by default (env `SARVAM_REASONING`; `default` turns it off). `max_tokens` is at least 1200 because reasoning can eat the budget. If the API returns 400/422 mentioning "reasoning", it retries without that field. An empty answer throws a 204-type error. |
| TTS | **Bulbul v3** (`bulbul:v3`) | Body field is `target_language_code`. v3 has no pitch or `enable_preprocessing`. Speakers: `simran` (guide), `aditya` (tipster). |
| STT | **Saarika v2.5** | Browser records audio → `/api/stt` → transcript. If it fails, the phone's own recognition, then typing. |

Other facts:
- `thinkJSON` appends a "return only one JSON object" instruction, parses with `extractJSON`, validates, and **retries once** on a bad answer. It does not retry on an HTTP error.
- The `SARVAM_BASE_URL` override exists so a local mock can be used for testing.
- **Gemini and Bhashini are gone.** `GEMINI_API_KEY` no longer exists in code or `.env.example`.

### Environment variables (`.env.example`)
```
SARVAM_API_KEY=
SARVAM_CHAT_MODEL=sarvam-105b-conversations
SARVAM_REASONING=low
SARVAM_TTS_MODEL=bulbul:v3
SARVAM_STT_MODEL=saarika:v2.5
TTS_SPEAKER_TIPSTER=aditya
TTS_SPEAKER_APP=simran
```

---

## 8. Safety and grounding

- **Server-side grounding:** `lib/facts.js` rebuilds the game from the submitted order list with `engine.replay`, so the AI only sees numbers the server computed (`stockFacts`, `portfolioFacts`, `orderFacts`, `reportState`, `demoFacts`). `orderFacts` includes "what if the price halves" and "25% fall with MTF" losses.
- **Output checks:** `checkFields` and `numbersGrounded` reject advice phrases and numbers not present in the facts or the player's own text. Failure → offline fallback.
- **Prompts:** `baseRules(lang)` → no advice, no future days, use only the given facts, answer in the player's language.
- **Privacy:** `safeProfile()` strips the name and free answers before anything is sent. Nothing is stored. Audio is passed through and dropped.
- **Rate limit:** per IP **and per URL** (a bug earlier let heavy `/api/tts` use block `/api/report`).

---

## 9. Testing: what is verified and what is not

### Verified (in the build sandbox)
- 28 guardrail and behaviour-model tests pass (`npm test`), including "24 s thinking is not rated good".
- Playwright at **360×760**, hi and en, light and dark, no JS errors:
  - the simulator with an AI mock and offline;
  - the no-name path;
  - the one-question check (about 0.85 s on the mock) → consequence → Buy enabled;
  - the AI report with per-habit insights;
  - the whole demo.

### NOT verified (needs Ash's machine)
- **Any live Sarvam call.** The sandbox gets `403 Host not in allowlist` for `api.sarvam.ai`, so all AI paths were tested only against a local mock (`mock-sarvam.mjs` on :4001 with `SARVAM_BASE_URL`).
- Real response time with `sarvam-105b-conversations` and whether `reasoning_effort: low` is accepted.
- Whether answers are too shallow at low effort (switch with `SARVAM_REASONING=default`).
- Voice quality (Simran, Aditya), Hindi and English copy by a native speaker, a cheap Android on 3G, and the Vercel deployment.

---

## 10. Errors met and how they were fixed

| Problem | Fix |
|---|---|
| "API key couldn't be connected" | Tolerant env loader plus a masked key check. The file must be named exactly `.env`. |
| Shared rate limiter blocked `/api/report` after TTS calls | Limit keyed on IP + URL |
| i18n placeholders (`{info}`, `{under30}`) showed raw in the offline report | Renamed to `{openedFundamentals}`, `{readNews}`, `{under30s}` |
| New API routes returned fallbacks until restart | Restart the server after adding routes |
| Header buttons stacked vertically | Wrapped in `.hb` flex |
| Offline demo check produced no tip question or flags | Added a `ctx.demo` flag |
| Shell exit 144 from `pkill`/`pgrep` patterns | Kill by PID via `ps | awk` |
| "Next time" rules rendered as one blob | `<ol class="rules">` |
| No-name path: lowercase English headings; Skip kept the typed name | Capitalised headings, `coach.js` lowercase fix, `qskip` clears the input |

---

## 11. Next steps for Ash

1. Put the real key in `.env` (exact name, project root). There is no `npm install` step (zero dependencies); run **`npm run test:ai`**. It prints the Sarvam response time, writes `test-tts.wav` for a listen, and runs the reasoning check. Also open `http://localhost:3000/api/health?ping=1`.
2. If the AI feels slow, check the `ms`; if answers feel shallow, set `SARVAM_REASONING=default` and compare.
3. Run **`npm run audio`** to pre-generate Hindi and English voice lines so the scripted audio works offline.
4. Have a **native speaker** read the Hindi and English copy (`shared/profile.js`, `simulator/data.js`, `simulator/i18n.js`, `demo-run/content.js`, `demo-run/app.js`).
5. Test on a cheap Android phone with the network throttled to 3G.
6. Deploy to Vercel with `SARVAM_API_KEY` as an environment variable.
7. **When recording the video:** the scam-message part of the demo, which Ash deferred.
8. **After the event:** rotate the Sarvam key.

---

## 12. Security and constraints that still apply

- **API keys were pasted into chat earlier.** Keep the key only in the git-ignored `.env`. Never put it in shipped files, the README, the zip or the pitch deck. Exclude `.env` when zipping (the last zip did). **Rotate it after the event.**
- **Team size:** one message said "4 people (don't use it, not confirmed)". It must not appear anywhere.
- No broker links, no monetisation, no real companies, no advice. Re-check these before every demo or recording.

### Naming discussion (for context)
Ash wanted an **English** name that is symbolic and has a meaning like **Zerodha ("zero barrier")**. He did not want names built around "pause" or "stop" (Ruko means "stop"). He rejected earlier lists as not good enough, then picked **NiveshSetu** himself ("Setu" = bridge: a bridge to investing).

---

## 13. How to continue from here

- Do not re-litigate decisions already made: **Sarvam only**, **ask once**, **consequence then Buy**, **scores by rules**, **no advice**.
- If a new change touches the gate, the rule is: judge the *reasoning*, never the stock; one question at most; always show the consequence; a weak reason is allowed but recorded.
- If a new AI feature is added, it needs: server-computed facts, a `checkFields`-style validation, an offline fallback, and a no-advice prompt using `baseRules(lang)`.
- Ask Ash before anything that is expensive to redo or irreversible. Otherwise act, and flag the gaps.
- Keep replies direct, with no flattery.
