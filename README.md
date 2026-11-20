# CaseCoach: app code

CaseCoach is a consulting case-interview practice coach built in Google AI Studio Build. The AI plays the interviewer for a fictional case and scores five skills at the end. This repository holds the code exported from Build.

ARIN 121 final project, Queen's University, Fall 2026. Group: Section 001 - 6 (Léo Cluzet-Abreu, Yohann Le Bray).

- **Published app:** https://casecoach.ai.studio
- **Prompts (system prompt versions and Build prompt):** https://github.com/Not-So-Fake/casecoach-prompts

## How it works

- `src/systemPrompt.ts` holds the final system prompt (Cycle 4) word for word, plus a short `APP_ADDENDUM`. The addendum asks the model to end each message with a stage tag such as `[STAGE: Analyse]`. The interface uses the tag to drive the stage tracker, then strips it before display.
- `server.ts` is an Express server that keeps one Gemini chat per session and calls `gemini-3.8-flash`, the model the prompt was tested on in the Playground. If that model returns a 503 (high demand) or 429 (quota) error, the server retries once on `gemini-4-hydrogen` with the same system instruction and history. The API key stays on the server.
- `src/utils/caseParser.ts` builds the first message when a case starts. For a profitability case it picks the root cause **at random in code** and appends it as a hidden instruction the student never sees. For a market entry case it picks whether the economics are attractive or not. Playground testing showed that the model, left alone, built every profitability case around the same cause.
- `src/components/` holds the interface: setup screen, stage tracker, chat, exhibit panel, scratchpad, timer (in the header), and scorecard view with colour-coded ratings and a "Drill my weakest skill" button.

## Run locally

Prerequisite: Node.js.

1. `npm install`
2. Create `.env.local` with `GEMINI_API_KEY=<your key>`
3. `npm run dev`, then open http://localhost:3000
