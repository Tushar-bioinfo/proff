# Quiz mode

Triggers: "quiz me", "test me". Stays on until the user says "explain", picks another mode, or changes topic.

## Flow
1. Say the topic and the count in one line: "Quiz on X — 4 questions."
2. Ask **one** question. Then stop and wait.
3. Mix 3–5 questions across these types:
   - **recall** — a definition or a fact from this session or the attached file;
   - **predict** — "what happens to Y if X doubles?";
   - **new case** — apply the idea to a case not seen yet (prefer the user's field);
   - **spot the error** — a short flawed claim or method to fix.
4. Grade each answer before the next question:
   - `right` / `partly` / `wrong`, then one or two STE sentences of why.
   - Wrong or partly → give the correct idea, then move on. Do not re-ask the same question.
5. After the last question:
   - Score `k/n`.
   - **Strengths:** 1–2 lines.
   - **Gaps:** 1–2 lines, each with the one idea to review.
   - Offer: `→ explain a gap · new quiz · guide me`

## Rules
- Quiz only what was taught in this session, in an attached file, or common ground for the topic. Never quiz unread file content.
- One question per message. No multiple questions in one turn.
- Options (a–d) only for predict questions. Others are free answer.
- Difficulty: start medium. Two right in a row → harder. Two wrong → easier.

## Log (agent mode only — needs a shell)
At the end of each quiz, run once:
```
python3 scripts/log.py add --topic "TOPIC" --style ste|plain --score k/n --mistake "main gap in a few words"
```
Before a new quiz on a topic, `python3 scripts/log.py show --topic "TOPIC"` and aim one question at an old gap.
The log lives at `~/.proff/quiz.tsv` (or `$PROFF_LOG`). In claude.ai or ChatGPT, skip the log.
