---
name: ivr-test-scripts
description: Generate exhaustive test scripts for Amazon Connect IVR flows and Lex bots covering all call paths, error conditions, and edge cases. Trigger on test scripts, test scenarios, IVR testing, or call flow testing.
---

# IVR Test Script Generation Skill

## Quick Reference

| Task | Guide |
|------|-------|
| Analyze flow and enumerate paths | Read [analyze-flow.md](analyze-flow.md) |
| Generate test scripts | Read [generate-scripts.md](generate-scripts.md) |
| QA the test scripts | Read [qa-scripts.md](qa-scripts.md) |

## Prerequisite Questions (MANDATORY)

**Before starting ANY work, you MUST ask the user these questions and wait for answers:**

### Question 1: Input Source
Ask: **"How will you provide the existing IVR or Lex Bot for test generation?"**
- **Upload JSON** — User will paste or upload the contact flow JSON and/or Lex bot configuration
- **Give me access to AWS** — User will provide AWS profile and instance ID so you can pull the flow and bot details directly from AWS
- **Create test scripts for a new design** — User will describe the IVR flow and bot configuration; no existing JSON or AWS resources

### Question 2: Output Delivery
Ask: **"How would you like to receive the test scripts?"**
- **Save directly to your AWS account** — Not typical for test scripts, but if user wants to store in S3 or another service
- **Give them as files** — Export the test scripts as local markdown and JSON files

### Question 3: AWS Target (if pulling from AWS)
If the user chose "Give me access to AWS", you MUST also ask:
- **AWS CLI profile name** (e.g., `haohai`, `default`, `prod`)
- **Amazon Connect Instance** — List available instances using `aws connect list-instances --profile <PROFILE>` and let the user pick one
- **Contact flow name or ID** to pull
- **Lex bot name or ID** (if applicable)

**CRITICAL:** Always confirm the profile and instance with the user before running any AWS commands. Pulling from the wrong instance could generate test scripts for the wrong IVR flow.

### Confirmation Gate
After collecting all answers, summarize back to the user:
> "I will generate test scripts for [flow name] from [AWS profile `X`, instance `Y` / uploaded JSON / described design]. Is that correct?"

**Do NOT proceed until the user confirms.**

---

## Step 0: Collect Additional Input

After prerequisite confirmation, also ask the user for:
1. The phone number to call (if assigned)
2. Any special instructions (e.g., "focus on error paths", "include security tests")

If the user has already provided the flow JSON or references an existing deployed flow, proceed with that.

## Core Principles

1. **100% path coverage** — Every possible path through the IVR must have at least one test scenario.
2. **Concise format** — Scripts use short `System:` / `Caller:` lines only. No `Purpose:` blocks or verbose descriptions.
3. **Both input methods** — If Lex is used, test both DTMF and natural speech in separate scenarios.
4. **Error paths are first-class** — Timeout, invalid input, unrecognized speech all get dedicated scenarios.
5. **Exact system prompts** — `System:` lines quote the exact TTS text from the flow JSON.
6. **Test conditions** — Each scenario states when it can be tested (e.g., Mon-Fri, Sat-Sun).

## What To Do

- **Parse the flow JSON first** — Walk the entire flow graph from `StartAction` to every terminal node.
- **Extract exact prompts** — Copy the `Text` parameter from each block verbatim into `System:` lines.
- **Keep it concise** — Short `Caller:` / `System:` lines only. Abbreviate repeated sequences after first full occurrence.
- **Include edge cases** — Wrong keys, silence, special keys, hesitant speech, out-of-domain phrases.
- **Group by scenario type** — Happy paths first, then errors, timeouts, edge cases.
- **Number scenarios** — `S1`, `S2`, etc. with descriptive names.

## What To Avoid

- **Don't use tables for dialogue** — Use `Caller:` / `System:` format, never markdown tables.
- **Don't write robotic caller lines** — BAD: `Caller: "1"` GOOD: `Caller: Press 1`
- **Don't paraphrase system prompts** — The `System:` text must be the exact flow JSON prompt.
- **Don't skip error paths** — Errors at EVERY menu level must be tested.
- **Don't add verbose descriptions** — No `Purpose:` blocks. The scenario name and test condition are enough.
- **Don't create duplicate scenarios** — Each path combination appears exactly once.

## Output Format

The output is a single markdown file structured as:

```markdown
# [Flow Name] - Test Scripts

**Phone:** +1 (XXX) XXX-XXXX
**Hours:** [business hours description]
**Bots:** [bot names and IDs]

---

## S1: [Descriptive Name]
**Test when:** [condition]

System: "[exact prompt text]"
Caller: [action]
System: "[response text]"
Caller: [next action]
System: Transfers to [queue] / Call disconnects

---

## S2: [Name]
...

---

## Coverage Matrix

| Path | DTMF | Voice | Error | Timeout |
|------|------|-------|-------|---------|
| ... | S1 | S4 | S14 | S15 |
```

## Workflow

1. Ask user for flow JSON and bot details (or retrieve from AWS)
2. Read [analyze-flow.md](analyze-flow.md) — map all paths
3. Read [generate-scripts.md](generate-scripts.md) — produce the scripts
4. Read [qa-scripts.md](qa-scripts.md) — verify completeness
5. Export to file
