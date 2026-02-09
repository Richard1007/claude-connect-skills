---
name: ivr-test-scripts
description: Use this skill to generate complete test scripts for Amazon Connect IVR flows and Lex bots. Given an IVR flow JSON and optional Lex bot configuration, this skill produces exhaustive test scenarios covering every call path — including all valid selections (DTMF and voice), error conditions, timeouts, and edge cases. Each scenario uses a natural conversational dialogue format showing Caller actions and Expected system responses. Trigger whenever the user mentions "test script," "test scenarios," "IVR testing," "call flow testing," or needs QA scripts for an IVR.
---

# IVR Test Script Generation Skill

## Quick Reference

| Task | Guide |
|------|-------|
| Analyze flow and enumerate paths | Read [analyze-flow.md](analyze-flow.md) |
| Generate test scripts | Read [generate-scripts.md](generate-scripts.md) |
| QA the test scripts | Read [qa-scripts.md](qa-scripts.md) |

## Step 0: Ask for Input

Before generating anything, **ask the user for:**
1. The IVR flow JSON (file path or inline)
2. The Lex bot details (bot IDs, intent names, sample utterances) — or offer to pull from AWS
3. The phone number to call (if assigned)
4. Any special instructions (e.g., "focus on error paths", "include security tests")

If the user has already provided the flow JSON or references an existing deployed flow, proceed with that.

## Core Principles

1. **100% path coverage** — Every possible path through the IVR must have at least one test scenario.
2. **Conversational format** — Scripts use natural `Caller:` / `Expected:` dialogue, NOT tables.
3. **Both input methods** — If Lex is used, test both DTMF and natural speech in separate scenarios.
4. **Error paths are first-class** — Timeout, invalid input, unrecognized speech all get dedicated scenarios.
5. **Exact system prompts** — The `Expected:` lines quote the exact TTS text from the flow JSON.
6. **Purpose-driven** — Each scenario states a clear purpose explaining what it tests.

## What To Do

- **Parse the flow JSON first** — Walk the entire flow graph from `StartAction` to every terminal node.
- **Extract exact prompts** — Copy the `Text` parameter from each block verbatim into `Expected:` lines.
- **Write natural caller dialogue** — Callers speak naturally, not robotically. Use varied phrasings.
- **Include creative edge cases** — Caller changes mind, says something ambiguous, presses wrong key, stays silent, tries special keys.
- **Group by scenario type** — Happy paths first, then errors, timeouts, edge cases, security tests.
- **Number scenarios** — `Scenario 1`, `Scenario 2`, etc.

## What To Avoid

- **Don't use tables for dialogue** — Use `Caller:` / `Expected:` format, never markdown tables.
- **Don't write robotic caller lines** — BAD: `Caller: "1"` GOOD: `Caller: Presses 1 on keypad`
- **Don't paraphrase system prompts** — The `Expected:` text must be the exact flow JSON prompt.
- **Don't skip error paths** — Errors at EVERY menu level must be tested.
- **Don't forget to state the purpose** — Every scenario needs a `Purpose:` line.
- **Don't create duplicate scenarios** — Each path combination appears exactly once.

## Output Format

The output is a single markdown file structured as:

```markdown
# [Flow Name] - Test Scenarios

## Overview
Brief description of what the IVR does and what's being tested.

## Test Configuration
- Phone number: ...
- Bots: ...
- Voice: ...

## Scenario 1: [Descriptive Name]

**Purpose:** What this scenario tests

Caller: [natural action or speech]

Expected: [exact system prompt from flow JSON]

Caller: [next action]

Expected: [next system prompt]

...

Expected: [final prompt — call ends]

---

## Scenario 2: ...
```

## Workflow

1. Ask user for flow JSON and bot details (or retrieve from AWS)
2. Read [analyze-flow.md](analyze-flow.md) — map all paths
3. Read [generate-scripts.md](generate-scripts.md) — produce the scripts
4. Read [qa-scripts.md](qa-scripts.md) — verify completeness
5. Export to file
