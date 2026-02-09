# Generate Test Scripts

## Dialogue Format

Every scenario uses this conversational format:

```markdown
## Scenario N: [Descriptive Name]

**Purpose:** [What this scenario specifically tests]

Caller: [Dials +1 (800) 555-0100]

Expected: System plays greeting: "[exact greeting text from flow JSON]"

Expected: System plays menu prompt: "[exact menu text from flow JSON]"

Caller: [Action — e.g., Says "provider" / Presses 1 on keypad]

Expected: System plays: "[exact response text from flow JSON]"

Expected: System plays sub-menu prompt: "[exact sub-menu text from flow JSON]"

Caller: [Next action]

Expected: System plays: "[exact final prompt from flow JSON]"

Expected: Call disconnects.
```

## Rules

### Caller Lines
Write caller actions naturally and descriptively:

**DTMF actions:**
- `Caller: Dials +1 (800) 555-0100`
- `Caller: Presses 1 on keypad`
- `Caller: Presses # on keypad`
- `Caller: Rapidly presses 5, 5, 5 on keypad`

**Voice actions:**
- `Caller: Says "provider"`
- `Caller: Says "I'm a doctor calling about a patient"`
- `Caller: Says "I need to schedule an appointment please"`
- `Caller: Says "um... I think I need... a prescription refill?"`

**Silence / timeout:**
- `Caller: [Remains silent — no input for 10+ seconds]`

**Ambiguous / invalid:**
- `Caller: Says "blue elephant sandwich"`
- `Caller: Coughs loudly into the phone`
- `Caller: Says "hello? is anyone there?"`

### Expected Lines
Always quote the exact system prompt text:

- `Expected: System plays greeting: "[verbatim text]"`
- `Expected: System plays menu prompt: "[verbatim text]"`
- `Expected: System plays: "[verbatim text]"`
- `Expected: System plays error message: "[verbatim text]"`
- `Expected: Call disconnects.`

For Lex bot interactions, note what happens internally:
- `Expected: Lex bot matches ProviderIntent (confidence > 0.40). System plays: "[text]"`
- `Expected: Lex bot matches FallbackIntent — no recognized input. System routes to error.`

### Purpose Lines
Each scenario must explain WHY it exists:
- `Purpose: Test the complete happy path for a provider calling about referrals using DTMF input`
- `Purpose: Verify the system handles unrecognized speech at the main menu level`
- `Purpose: Test that pressing special keys (#, *) at sub-menus routes to the error path`
- `Purpose: Test mixed input — DTMF at level 1, voice at level 2`

## Scenario Categories

### 1. Happy Path — DTMF
One scenario per valid end-to-end path using only keypad input. Callers press digits.

### 2. Happy Path — Voice (Primary Keyword)
Same paths but caller says the primary keyword (e.g., "provider", "referral").

### 3. Happy Path — Voice (Full Phrases)
Same paths but caller uses natural full sentences (e.g., "I'm a doctor calling about a patient").

### 4. Happy Path — Voice (Synonyms)
Caller uses alternate words not in the menu prompt (e.g., "doctor" instead of "provider", "member" instead of "patient").

### 5. Happy Path — Mixed Input
DTMF at one menu level, voice at another. Tests that switching input methods works.

### 6. Error — Invalid Input
Invalid DTMF digits or unrecognized speech at each menu level.

### 7. Error — Timeout / Silence
Caller remains silent at each menu level.

### 8. Edge Cases
Special keys (#, *, 0), ambiguous speech, barge-in during prompts, caller hesitates.

## Voice Utterance Variety

For voice scenarios, vary the caller's phrasing across scenarios:

| Scenario Type | Example Caller Lines |
|---------------|---------------------|
| Primary keyword | Says "provider" |
| Full phrase | Says "I'm calling as a healthcare provider" |
| Synonym | Says "doctor" |
| Casual | Says "yeah I'm a provider" |
| Hesitant | Says "um... provider? I think?" |

## Coverage Checklist

After generating all scenarios, verify:
- [ ] Every valid end-to-end path has a DTMF scenario
- [ ] Every valid end-to-end path has a Voice scenario
- [ ] At least 2 synonym/phrase variations tested per menu level
- [ ] Invalid input tested at every menu level (DTMF + Voice)
- [ ] Timeout tested at every menu level
- [ ] Special keys (#, *, 0) tested
- [ ] At least one mixed-input scenario exists
- [ ] At least one ambiguous/hesitant caller scenario exists
