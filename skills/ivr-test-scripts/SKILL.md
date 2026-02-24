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

## AWS Native Test API Integration

These rules govern how to create **programmatic automated tests** using the AWS Connect Native Test API (`CreateTestCase`, `StartTestCaseExecution`). Manual test scripts follow different rules.

### Working Test Content Schema (Version 2019-10-30)

```json
{
  "Version": "2019-10-30",
  "Metadata": {},
  "Observations": [
    {
      "Identifier": "unique-uuid",
      "Event": {
        "Identifier": "event-uuid",
        "Type": "TestInitiated | MessageReceived | FlowActionStarted | TestCompleted",
        "Actor": "System",
        "Properties": { "Text": "partial text to match" },
        "MatchingCriteria": "Inclusion"
      },
      "Actions": [
        {
          "Identifier": "action-uuid",
          "Type": "SendInstruction | TestControl",
          "Actor": "Customer",
          "Parameters": {
            "DtmfInput": { "Type": "DtmfInput", "Properties": { "Value": 1 } }
          }
        }
      ],
      "Transitions": { "NextObservations": ["next-obs-uuid"] }
    }
  ]
}
```

### Critical Validation Rules

1. **Version MUST be `"2019-10-30"`** — Not `"2025-06-21"` or any other version
2. **Do NOT include `Usage` field** — Rejected by validation
3. **Do NOT include `Transitions` inside Actions** — Only observations have transitions
4. **DTMF Value must be a number** — `{ "Value": 1 }` not `{ "Value": "1" }`
5. **FlowActionStarted events CANNOT have Actions** — Use `MessageReceived` events for caller actions
6. **Use `Status: 'PUBLISHED'` for validation** — `Status: 'SAVED'` accepts anything but won't execute
7. **`Content` parameter is a JSON string** — Stringify the test JSON before passing to `CreateTestCase`

### Message Concatenation Rule

**CRITICAL:** Consecutive TTS-producing flow actions are concatenated into a SINGLE `MessageReceived` event:

| Flow Sequence | Test API Event Count |
|--------------|---------------------|
| `MessageParticipant("A") → GetParticipantInput("B")` | ONE event: `"A. B"` |
| `MessageParticipant("A") → MessageParticipant("B") → GetParticipantInput("C")` | ONE event: `"A. B. C"` |
| `GetParticipantInput("A")` → (DTMF) → `MessageParticipant("B")` | TWO events: `"A"` then `"B"` |
| `GetParticipantInput("A")` → (DTMF) → `MessageParticipant("B") → GetParticipantInput("C")` | TWO events: `"A"` then `"B. C"` |

**Rule:** Events are split when a DTMF/input action occurs. Everything before input = one event. Everything after input until next input = next event.

**Impact:** When creating test observations, group consecutive prompts into ONE `MessageReceived` event. Use `MatchingCriteria: "Inclusion"` to match partial text.

### Standard Observation Structure

```json
{
  "Identifier": "obs-1",
  "Event": {
    "Identifier": "evt-1",
    "Type": "TestInitiated",
    "Actor": "System"
  },
  "Actions": [],
  "Transitions": { "NextObservations": ["obs-2"] }
},
{
  "Identifier": "obs-2",
  "Event": {
    "Identifier": "evt-2",
    "Type": "MessageReceived",
    "Actor": "System",
    "Properties": { "Text": "Welcome to our service" },
    "MatchingCriteria": "Inclusion"
  },
  "Actions": [
    {
      "Identifier": "act-1",
      "Type": "SendInstruction",
      "Actor": "Customer",
      "Parameters": {
        "DtmfInput": { "Type": "DtmfInput", "Properties": { "Value": 1 } }
      }
    }
  ],
  "Transitions": { "NextObservations": ["obs-3"] }
}
```

### Known Limitation: Self-Loop GetParticipantInput Is Untestable

**Issue:** When a `GetParticipantInput` block loops back to itself (e.g., "press 3 to repeat menu"), the test API does NOT emit a new `MessageReceived` event for the re-played prompt. Tests hang indefinitely at `IN_PROGRESS`.

**Evidence:** Scenario S3 (Press 3 → Repeat → Press 1 → Sales) stuck at 2/2 observations. After sending DTMF 3, the "repeated-menu" observation never matched.

**Impact:** You CANNOT test self-loop paths programmatically. Document this in the test scripts as "Manual testing only — self-loop limitation."

**Fix:** IVR flows should route repeat paths through an intermediate `MessageParticipant` block. See `amazon-connect-ivr` skill, AWS Native Test API Compatibility Rules.

### Test Execution Commands

```bash
# Create test case (Content is stringified JSON)
aws connect create-test-case \
  --instance-id <INSTANCE_ID> \
  --contact-flow-id <FLOW_ID> \
  --name "S1: Happy Path - Sales" \
  --description "Press 1 to reach sales queue" \
  --status PUBLISHED \
  --content "$(cat test-case.json | jq -c .)" \
  --profile <PROFILE>

# Start execution
aws connect start-test-case-execution \
  --instance-id <INSTANCE_ID> \
  --test-case-id <TEST_CASE_ID> \
  --profile <PROFILE>

# Poll execution status
aws connect get-test-case-execution \
  --instance-id <INSTANCE_ID> \
  --test-case-execution-id <EXECUTION_ID> \
  --profile <PROFILE> \
  --query 'TestCaseExecution.Status'

# Get detailed results
aws connect get-test-case-execution \
  --instance-id <INSTANCE_ID> \
  --test-case-execution-id <EXECUTION_ID> \
  --profile <PROFILE>
```

### Error Path Event Structure (IVR #2 Finding)

When `GetParticipantInput` triggers `NoMatchingCondition` and the path goes through silent blocks before reaching a new `MessageParticipant` + `GetParticipantInput`, expect **MULTIPLE separate `MessageReceived` events**, not one concatenated event.

**Pattern:**
```
GetParticipantInput("Press 1 for English") 
  → (invalid DTMF sent)
  → UpdateContactAttributes(retryCount++)  [silent block]
  → Compare(retryCount < 3)  [silent block]
  → MessageParticipant("Sorry, invalid selection")
  → GetParticipantInput("Please try again. Press 1 for English")
```

**Test API Observations:**
1. **Event 1 (MessageReceived):** `"Press 1 for English. Sorry, invalid selection."` (concatenated — error message appended to original prompt)
2. **Event 2 (MessageReceived):** `"Please try again. Press 1 for English."` (separate event after silent blocks)

**Correct Observation Pattern for Retry Flows:**
```json
{
  "Identifier": "obs-welcome-menu",
  "Event": { "Type": "MessageReceived", "Properties": { "Text": "Press 1 for English" } },
  "Actions": [{ "Type": "SendInstruction", "Parameters": { "DtmfInput": { "Value": 9 } } }],
  "Transitions": { "NextObservations": ["obs-error-msg"] }
},
{
  "Identifier": "obs-error-msg",
  "Event": { "Type": "MessageReceived", "Properties": { "Text": "Sorry, invalid selection" }, "MatchingCriteria": "Inclusion" },
  "Actions": [],
  "Transitions": { "NextObservations": ["obs-retry-menu"] }
},
{
  "Identifier": "obs-retry-menu",
  "Event": { "Type": "MessageReceived", "Properties": { "Text": "Please try again" }, "MatchingCriteria": "Inclusion" },
  "Actions": [{ "Type": "SendInstruction", "Parameters": { "DtmfInput": { "Value": 1 } } }],
  "Transitions": { "NextObservations": ["obs-result"] }
}
```

### Lex Bot Testing **(IVR #3 Finding)**
**DTMF input through `ConnectParticipantWithLexBot` works correctly in tests.** The test API sends DTMF which Lex maps to intents. However, the Lex block's prompt text is NOT observable — only match the `MessageParticipant` greeting before the Lex block, then match the response message after intent routing.

**Case Normalization:** Neural TTS normalizes case in test observation text. "Connecting you..." may appear as "connecting you..." in actual test results. Use `Inclusion` matching with lowercase-safe text fragments to avoid case-sensitivity issues.

### Silent Blocks Don't Produce Observable Events **(IVR #4 Finding)**
**Issue:** Non-TTS blocks (`UpdateContactTargetQueue`, `CheckHoursOfOperation`, `InvokeLambdaFunction`) are processed silently and do NOT generate `MessageReceived` events in the test API.

**Fix:** Only the subsequent `MessageParticipant` block generates an observable event. Same concatenation boundary rules apply as `UpdateContactAttributes` and `Compare`. Silent blocks create event boundaries.

### Lambda-Interpolated Messages Are Observable **(IVR #4 Finding)**
**Issue:** When `MessageParticipant` uses `$.External.*` references to interpolate Lambda return values, the test API must resolve them.

**Fix:** The test API resolves interpolated text and includes the actual resolved text in `MessageReceived` events. Use `Inclusion` matching with partial text since full interpolated strings may be long or variable.

### CheckHoursOfOperation Evaluates Real-Time in Tests **(IVR #4 Finding)**
**Issue:** The test API checks actual hours of operation against the queue's configured hours.

**Fix:** Design test flows with queues whose hours match your expected test outcome. Use a 24/7 queue for "open" path testing, restricted-hours queue for "closed" path testing. Hours are evaluated in real-time during test execution.

### TransferContactToQueue Produces No Observable Event **(IVR #4 Finding)**
**Issue:** The `TransferContactToQueue` block does not generate a `MessageReceived` event in the test API.

**Fix:** End test observations after the pre-transfer message. Use `TestCompleted` event after the final message before transfer. The transfer itself is not observable in test results.

### TransferToFlow Continues Test Observation Across Flows **(IVR #5 Finding)**
**Issue:** The test engine follows execution from the main flow into the transferred flow.

**Fix:** Sub-flow `MessageParticipant` events are observable. This enables testing multi-flow architectures end-to-end.

### DistributeByPercentage Is Non-Deterministic in Tests **(IVR #5 Finding)**
**Issue:** Cannot write deterministic tests for percentage routing.

**Fix:** To test specific branches, temporarily set 100% to the target branch, test, then restore original percentages.

### UpdateContactRecordingBehavior and DistributeByPercentage Are Silent Blocks **(IVR #5 Finding)**
**Issue:** Neither produces observable events nor creates event boundaries.

**Fix:** These blocks are processed silently. Only subsequent TTS blocks generate observable `MessageReceived` events.

### When Observations Don't Match Actual Branch, Text Concatenates Into Previous Observation **(IVR #5 Finding)**
**Issue:** If the flow takes an unexpected branch, the mismatched message text gets absorbed into the preceding observation's actual text.

**Fix:** Verify flow logic matches test expectations. Use `Inclusion` matching to handle unexpected concatenation gracefully.

### UpdateContactRoutingBehavior and UpdateContactEventHooks Are Silent Blocks **(IVR #6 Finding)**
**Issue:** Neither `UpdateContactRoutingBehavior` nor `UpdateContactEventHooks` produces observable events in the test API. Priority changes and event hook assignments happen silently.

**Fix:** These blocks are processed silently. Only subsequent TTS blocks generate observable `MessageReceived` events. Same concatenation boundary rules apply as other silent blocks.

### Generative TTS Is Observable Like Neural TTS **(IVR #7 Finding)**
**Issue:** `TextToSpeechEngine: "Generative"` (Polly Generative, NOT Nova Sonic) produces the same `MessageReceived` events as Neural/Standard engines in tests.

**Fix:** No special handling needed. The test API treats Generative TTS identically to Neural. Text content is observable via `Inclusion` matching. Voice name is not included in observations.

### CreateWisdomSession Is a Silent Block **(IVR #8 Finding)**
**Issue:** `CreateWisdomSession` does not produce observable events in the test API. The Q Connect session is created silently.

**Fix:** Only subsequent `MessageParticipant` blocks produce observable events. If the flow is `Welcome → CreateWisdomSession → Success Message`, you'll see TWO separate observations (Welcome, then Success) with no event for CreateWisdomSession itself. Same event boundary rules as other silent blocks.

### Test API Rejects Empty Text in Observations **(IVR #8 Finding)**
**Issue:** Test cases with `Properties: { Text: "" }` are rejected with `InvalidTestCaseException: InvalidEventProblem — At least one of PromptId, Text, or SSML must be present`.

**Fix:** Every `MessageReceived` observation MUST have non-empty `Text`. Use a keyword fragment with `MatchingCriteria: "Inclusion"` to match broadly without specifying full text.

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

The output is a single markdown file. It contains ONLY the metadata header and scenario scripts — no Coverage Matrix, no Bot Utterance Reference, no appendix sections.

```markdown
# [Flow Name] - Test Scripts

**Flow ID:** [flow-id]
**Instance ID:** [instance-id]
**Bots:** [bot names]

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
```

## Workflow

1. Ask user for flow JSON and bot details (or retrieve from AWS)
2. Read [analyze-flow.md](analyze-flow.md) — map all paths
3. Read [generate-scripts.md](generate-scripts.md) — produce the scripts
4. Read [qa-scripts.md](qa-scripts.md) — verify completeness
5. Export to file
