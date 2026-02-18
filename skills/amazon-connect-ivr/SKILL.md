---
name: amazon-connect-ivr
description: Create, edit, validate, and deploy Amazon Connect contact flow (IVR) JSON. Trigger on IVR, contact flow, call flow, phone tree, or flow JSON references.
---

# Amazon Connect IVR Skill

## Quick Reference

| Task | Guide |
|------|-------|
| Create IVR from scratch | Read [create-from-scratch.md](create-from-scratch.md) |
| Edit existing IVR JSON | Read [edit-existing.md](edit-existing.md) |
| QA and validate flow | Read [qa-validation.md](qa-validation.md) |
| Nova Sonic S2S IVR | Read [create-from-scratch.md](create-from-scratch.md) → Nova Sonic template |
| Component reference | Read [flow-components.md](flow-components.md) |

## Core Principles

1. **Simplicity first** — Use the minimum number of blocks needed. Do not over-engineer.
2. **Every path must terminate** — Every branch must end at a `DisconnectParticipant` block or a transfer. No dangling paths.
3. **Error handling is mandatory** — Every block that can error must have error branches handled.
4. **Unique UUIDs** — Every action must have a unique UUID as its `Identifier`. Generate fresh UUIDs for every block.
5. **Valid JSON only** — Output must be valid Amazon Connect flow JSON (Version `2019-10-30`).

## What To Do

- **Always start with requirements** — Before generating any JSON, confirm with the user: what prompts to play, what inputs to collect, what branches exist, and how errors should be handled.
- **Use text-to-speech for prompts** — Use the `Text` parameter in `MessageParticipant` blocks unless the user specifies audio files.
- **Support both DTMF and voice** — When the user wants callers to "press or say" options, integrate a Lex V2 bot. Use the `amazon-lex-bot` skill to create the bot first, then reference its alias ARN in the flow.
- **Generate proper metadata** — Include `Metadata` with `entryPointPosition`, `ActionMetadata` with positions for each block so the flow renders correctly in the Connect console.
- **Space blocks visually** — Position blocks left-to-right with ~250px horizontal spacing and ~150px vertical spacing between branches.
- **Export the final JSON** — Always save the final flow JSON to a file the user can import.

## CRITICAL: Correct Block Type Names

These type names are **wrong** and will cause `InvalidContactFlowException` on deploy:

| WRONG (will fail) | CORRECT (use this) |
|---|---|
| `InvokeExternalResource` | `InvokeLambdaFunction` |
| `Loop` | `Compare` + `UpdateContactAttributes` counter |

Parameter names also differ:
- WRONG: `FunctionArn`, `TimeLimit`
- CORRECT: `LambdaFunctionARN`, `InvocationTimeLimitSeconds`

Always include `TextToSpeechStyle: "None"` in `UpdateContactTextToSpeechVoice` blocks.

Always call `UpdateContactTargetQueue` before `TransferContactToQueue` — you cannot pass a QueueId directly to TransferContactToQueue.

Always call `UpdateContactTargetQueue` before `CheckHoursOfOperation` — the hours check uses the queue's hours. If no queue is set, it returns False (closed) regardless of actual hours.

See [flow-components.md](flow-components.md) for all 25 verified block types with correct schemas.

## Deployment Lessons Learned

These bugs were discovered during real deployment testing against Amazon Connect. An AI agent generated flow JSON that looked correct but was rejected by `create-contact-flow` with `InvalidContactFlowException`.

### Bug 1: DisconnectParticipant MUST have Transitions key
**Symptom:** `InvalidContactFlowException` on deploy (no error message)
**Root cause:** `DisconnectParticipant` blocks had `"Parameters": {}` but were missing `"Transitions": {}` entirely
**Fix:** ALWAYS include `"Transitions": {}` even on terminal blocks

WRONG:
```json
{ "Identifier": "uuid", "Type": "DisconnectParticipant", "Parameters": {} }
```

CORRECT:
```json
{ "Identifier": "uuid", "Type": "DisconnectParticipant", "Parameters": {}, "Transitions": {} }
```

### Bug 2: GetParticipantInput MUST have Text parameter
**Symptom:** `InvalidContactFlowException` on deploy
**Root cause:** Agent put the menu prompt text in a separate `MessageParticipant` block before `GetParticipantInput`, leaving `GetParticipantInput` without a `Text` parameter
**Fix:** The prompt text MUST be inside `GetParticipantInput.Parameters.Text`. You can ALSO have a separate MessageParticipant before it (e.g., for a greeting), but `GetParticipantInput` itself needs its own `Text`.

### Bug 3: All blocks need complete Transitions structure
**Symptom:** `InvalidContactFlowException` on deploy
**Root cause:** `UpdateContactTextToSpeechVoice` had only `NextAction` in Transitions but was missing the `Errors` array
**Fix:** Every non-terminal block MUST have both `NextAction` and `Errors` array in Transitions. `MessageParticipant` also needs an empty `Conditions: []` array.

### Bug 4: Avoid curly apostrophes in TTS text
**Symptom:** Potential JSON parsing issues
**Root cause:** Text contained `that's` with curly apostrophe instead of straight
**Fix:** Use only straight quotes/apostrophes in prompt text. Use "that is" instead of contractions when possible.

## AWS Native Test API Compatibility Rules

These rules ensure your IVR flows are testable using the AWS Connect Native Test API (`CreateTestCase`, `StartTestCaseExecution`). Discovered during automated testing (2026-02-17).

### Rule 1: NEVER Self-Loop GetParticipantInput
**Issue:** When a `GetParticipantInput` block loops back to itself (e.g., "press 3 to repeat menu"), the test API does NOT emit a new `MessageReceived` event for the re-played prompt. Tests hang indefinitely at `IN_PROGRESS`.

**Root cause:** The test engine treats re-entry into the same block as continuation, not a new event. The TTS prompt IS replayed to the caller, but the test engine doesn't surface it as observable.

**Bad (untestable):**
```
GetParticipantInput (DTMF 3 condition) → GetParticipantInput (same block)
```

**Good (testable):**
```
GetParticipantInput (DTMF 3 condition) → MessageParticipant("One moment...") → GetParticipantInput (same or new block)
```

The intermediate `MessageParticipant` causes a new `MessageReceived` event that concatenates with the re-played prompt, making the loop observable.

**CRITICAL:** Always route repeat/retry paths through an intermediate `MessageParticipant` or other TTS-producing block. NEVER route directly back to the same `GetParticipantInput` block.

### Rule 2: Message Concatenation in Tests
Consecutive TTS-producing flow actions are concatenated into a SINGLE `MessageReceived` event:

| Flow Sequence | Test API Behavior |
|--------------|-------------------|
| `MessageParticipant("A") → GetParticipantInput("B")` | ONE event: `"A. B"` |
| `MessageParticipant("A") → MessageParticipant("B") → GetParticipantInput("C")` | ONE event: `"A. B. C"` |
| `GetParticipantInput("A")` → (DTMF) → `MessageParticipant("B")` | TWO events: `"A"` then `"B"` |
| `GetParticipantInput("A")` → (DTMF) → `MessageParticipant("B") → GetParticipantInput("C")` | TWO events: `"A"` then `"B. C"` |

**Rule:** Events are split when a DTMF/input action occurs. Everything before input = one event. Everything after input until next input = next event.

**Impact on test scripts:** When generating test observations, group consecutive prompts into one `MessageReceived` event. Use `MatchingCriteria: "Inclusion"` to match partial text across concatenated prompts.

### Rule 3: Retry Counter Pattern (IVR #2 Finding)
**Issue:** The `Loop` action type is INVALID and will cause `InvalidContactFlowException` on deploy.

**Solution:** Implement retry logic using `UpdateContactAttributes` + `Compare` + separate `GetParticipantInput` blocks:
1. Create a contact attribute `retryCount` (initialize to 0)
2. On error, increment `retryCount` via `UpdateContactAttributes`
3. Use `Compare` to check if `retryCount < maxRetries`
4. If true, route to a new `GetParticipantInput` block (NOT the same block)
5. If false, route to error message and disconnect

This pattern is fully testable with the AWS Native Test API because each retry uses a separate `GetParticipantInput` block, generating observable `MessageReceived` events.

### Rule 4: Error Message Concatenation (IVR #2 Finding)
**Issue:** When DTMF triggers `NoMatchingCondition` on `GetParticipantInput`, the test engine prepends the `GetParticipantInput`'s prompt text BEFORE the error message.

**Example:** If `GetParticipantInput` has text "Press 1 for English" and error message is "Sorry, that was not a valid selection", the test engine observes: `"Press 1 for English. Sorry, that was not a valid selection."`

**Impact:** When writing test observations for error paths, expect the original menu prompt to be concatenated with the error message in a single `MessageReceived` event.

### Rule 5: Silent Block Event Boundaries (IVR #2 Finding)
**Issue:** Non-TTS blocks (`UpdateContactAttributes`, `Compare`) between TTS blocks create event boundaries in the test engine.

**Example:** If flow is `GetParticipantInput` (invalid DTMF) → `UpdateContactAttributes` (increment retry) → `MessageParticipant` (error message) → `GetParticipantInput` (retry menu), the test engine emits TWO separate `MessageReceived` events:
1. First event: "Press 1 for English. Sorry, that was not a valid selection." (concatenated)
2. Second event: "Please try again. Press 1 for English." (after silent blocks)

**Impact:** When designing retry flows, silent blocks between error message and retry menu cause the retry prompt to appear as a separate observation in test cases.

### Rule 6: ConnectParticipantWithLexBot Prompt Not Observable **(IVR #3 Finding)**
**Issue:** The `Text` parameter in `ConnectParticipantWithLexBot` is used internally by Lex for voice/DTMF collection. It does NOT appear as a `MessageReceived` event in the test API. Only preceding `MessageParticipant` blocks appear in test observations.

**Impact:** When designing IVRs with Lex integration, place an explicit greeting `MessageParticipant` block BEFORE the `ConnectParticipantWithLexBot` block if you need to observe the welcome message in tests. The Lex block's prompt text will not be observable in test results.

### Rule 7: CheckHoursOfOperation Requires Queue Set First **(IVR #4 Finding)**
**Issue:** `CheckHoursOfOperation` evaluates the queue's hours, not absolute time. If no queue is set, it returns False (closed) regardless of actual hours.

**Fix:** ALWAYS call `UpdateContactTargetQueue` before `CheckHoursOfOperation`. Use empty `Parameters: {}` in the queue update block. The hours check then uses the queue's configured hours.

### Rule 8: InvokeLambdaFunction Return Values **(IVR #4 Finding)**
**Issue:** Lambda return values are not directly accessible in subsequent blocks.

**Fix:** Lambda outputs are accessible via `$.External.keyName` in `MessageParticipant` text interpolation and other blocks. `InvocationTimeLimitSeconds` max is 8 seconds. Return values work cleanly with text-to-speech interpolation.

### Rule 9: Queue Transfer Is a 2-Block Pattern **(IVR #4 Finding)**
**Issue:** `TransferContactToQueue` cannot accept QueueId directly as a parameter.

**Fix:** Use `UpdateContactTargetQueue` (set QueueId ARN) → `TransferContactToQueue` (empty Parameters). Both blocks deploy cleanly with no parameter validation issues.

### Rule 10: UpdateContactRecordingBehavior Rejects NoMatchingError **(IVR #5 Finding)**
**Issue:** `UpdateContactRecordingBehavior` does NOT support error transitions. Adding `NoMatchingError` causes `InvalidContactFlowException` at deployment.

**Fix:** Use `"Errors": []` (empty array) in Transitions. This block only has `NextAction`, no error handling.

### Rule 11: TransferToFlow Crosses Flow Boundaries **(IVR #5 Finding)**
**Issue:** The transferred-to flow continues executing in the same contact context.

**Fix:** TTS voice and contact attributes carry over to the sub-flow. Use `ContactFlowId` as the full ARN. Sub-flow execution is transparent to the caller.

### Rule 12: UpdateContactRoutingBehavior Needs Empty Errors Array **(IVR #6 Finding)**
**Issue:** `UpdateContactRoutingBehavior` does NOT support `NoMatchingError`. Adding error transitions causes `InvalidContactFlowException` at deployment.

**Fix:** Use `"Errors": []` (empty array) and `"Conditions": []` in Transitions. This block only has `NextAction`, no error handling.

### Rule 13: UpdateContactEventHooks Deploys with NoMatchingError **(IVR #6 Finding)**
**Issue:** Unlike other settings blocks, `UpdateContactEventHooks` accepts `NoMatchingError` in its Errors array.

**Fix:** Use `UpdateContactEventHooks` with full error handling. Use CustomerQueue hook with complete CUSTOMER_QUEUE flow ARN. This block supports standard error transitions.

### Rule 14: GetParticipantInput with StoreInput=True Rejects Empty Conditions **(IVR #6 Finding)**
**Issue:** When using `StoreInput: "True"` for free-form input (phone numbers, account numbers), the block rejects `"Conditions": []` (empty array).

**Fix:** Either omit the `Conditions` field entirely or include at least one condition pattern. For free-form input, omit `Conditions` to avoid validation errors.

### Rule 15: Generative TTS Engine Works in Flow JSON **(IVR #7 Finding)**
**Issue:** Confusion between Polly Generative and Nova Sonic.

**Fix:** `TextToSpeechEngine: "Generative"` in `UpdateContactTextToSpeechVoice` uses **Amazon Polly Generative** — a higher-quality TTS engine. This is NOT Nova Sonic. It deploys and tests successfully via CLI. Use voice `Matthew` (verified). Nova Sonic requires console-only "Conversational AI bots" setup and cannot be configured via flow JSON.

### Rule 16: CreateWisdomSession Is a Silent Block **(IVR #8 Finding)**
**Issue:** `CreateWisdomSession` does not produce observable events in the test API.

**Fix:** CreateWisdomSession executes silently — the session is created but no `MessageReceived` event is emitted. Place a `MessageParticipant` block after it to confirm success in tests. Requires QIC assistant association with Connect instance via `aws connect create-integration-association --integration-type WISDOM_ASSISTANT` before deployment.

### Rule 17: Test API Rejects Empty Text in Observations **(IVR #8 Finding)**
**Issue:** Creating a test case with `Properties: { Text: "" }` (empty string) causes `InvalidTestCaseException` with `InvalidEventProblem: At least one of PromptId, Text, or SSML must be present`.

**Fix:** Every `MessageReceived` observation must have non-empty `Text` in `Properties`. Use `MatchingCriteria: "Inclusion"` with a keyword fragment rather than trying to match empty text.

## What To Avoid

- **Don't use `InvokeExternalResource` or `Loop`** — These types are rejected by the API. See the table above.
- **Don't use `GetParticipantInput` for multi-digit input** — It only supports single digits (0-9, #, *). Use `StoreInput` for multi-digit.
- **Don't forget `Conditions` array in `GetParticipantInput`** — Each DTMF option needs a separate condition entry.
- **Don't hardcode contact flow ARNs** — Use placeholder comments if referencing other flows.
- **Don't leave error branches empty** — Always route errors to an error prompt followed by disconnect or retry.
- **Don't use the same UUID for multiple blocks** — This will corrupt the flow.
- **Don't omit the `Version` field** — Must be `"2019-10-30"`.
- **Don't create blocks without Metadata positions** — The flow editor will break.
- **Don't mix up `GetParticipantInput` (DTMF-only) and `ConnectParticipantWithLexBot` (Lex V2 / Nova Sonic)** — These are different action types. Use `ConnectParticipantWithLexBot` when integrating with a Lex V2 bot or a Nova Sonic S2S bot.
- **Don't use `ConnectParticipantWithLexBot` without first creating and deploying the Lex bot** — The bot alias ARN must exist.
- **Don't use `ConnectParticipantWithLexBot` with `AMAZON.QinConnectIntent` without `CreateWisdomSession` first** — The Q Connect session must be created on the contact before the Lex bot can hand off to the AI agent. Without it, Q Connect never triggers.
- **Don't call `TransferContactToQueue` without `UpdateContactTargetQueue` first** — The queue must be set before transferring.
- **Don't omit `Transitions: {}` on `DisconnectParticipant` blocks** — Even terminal blocks require this key.
- **Don't omit `Text` parameter from `GetParticipantInput`** — The prompt text belongs inside the block, not in a separate MessageParticipant.
- **Don't omit `Errors` array from any non-terminal block's Transitions** — Every block needs `NoMatchingError` at minimum.
- **NEVER generate invalid UUIDs** — Always use proper v4 UUID format (8-4-4-4-12 hex).

## Flow JSON Structure

```json
{
  "Version": "2019-10-30",
  "StartAction": "<UUID of first action>",
  "Metadata": {
    "entryPointPosition": { "x": 39, "y": 40 },
    "ActionMetadata": {
      "<action-uuid>": {
        "position": { "x": 250, "y": 200 }
      }
    }
  },
  "Actions": [
    {
      "Identifier": "<UUID>",
      "Type": "<ActionType>",
      "Parameters": { ... },
      "Transitions": {
        "NextAction": "<UUID>",
        "Conditions": [ ... ],
        "Errors": [ ... ]
      }
    }
  ]
}
```

## Prerequisite Questions (MANDATORY)

**Before starting ANY work, you MUST ask the user these questions and wait for answers:**

### Question 1: Input Source
Ask: **"How will you provide the existing IVR or Lex Bot?"**
- **Upload JSON** — User will paste or upload an existing contact flow JSON file
- **Give me access to AWS** — User will provide AWS profile and instance ID so you can pull the existing flow directly from AWS
- **Create a new one** — No existing flow; build from scratch based on requirements

### Question 2: Output Delivery
Ask: **"How would you like to receive the output?"**
- **Save directly to your AWS account** — Deploy the IVR flow and/or Lex bot directly to the user's Connect instance via AWS CLI
- **Give them as JSON files** — Export the flow JSON and bot configuration as local files only (no AWS deployment)

### Question 3: AWS Target (if deploying to AWS)
If the user chose "Save directly to AWS" or "Give me access to AWS", you MUST also ask:
- **AWS CLI profile name** (e.g., `haohai`, `default`, `prod`)
- **Amazon Connect Instance** — List available instances using `aws connect list-instances --profile <PROFILE>` and let the user pick one

**CRITICAL:** Always confirm the profile and instance with the user before running any AWS commands. Double-check by displaying the instance alias/name. Deploying to the wrong Connect instance or AWS account can cause production outages.

### Confirmation Gate
After collecting all answers, summarize back to the user:
> "I will [create/edit] the IVR flow and [deploy to AWS profile `X`, instance `Y` / save as JSON files]. Is that correct?"

**Do NOT proceed until the user confirms.**

---

## Workflow

1. **Ask prerequisite questions** (see above) — wait for user confirmation
2. Gather detailed IVR requirements from user
3. If Lex bot or Nova Sonic S2S integration is needed, use the `amazon-lex-bot` skill first. For Nova Sonic, ensure the bot's locale speech model is set to Speech-to-Speech: Amazon Nova Sonic in the Connect console
4. Read [create-from-scratch.md](create-from-scratch.md) or [edit-existing.md](edit-existing.md)
5. Generate the flow JSON
6. Run QA per [qa-validation.md](qa-validation.md) — **loop until all issues resolved**
7. Export the final JSON file to the user
8. If user chose AWS deployment: deploy using `aws connect create-contact-flow` or `update-contact-flow-content`

## Deploying to AWS

### Create new flow:
```bash
aws connect create-contact-flow \
  --instance-id <INSTANCE_ID> \
  --name "<Flow Name>" \
  --type CONTACT_FLOW \
  --content "$(cat flow.json)" \
  --profile <PROFILE>
```

### Update existing flow:
```bash
aws connect update-contact-flow-content \
  --instance-id <INSTANCE_ID> \
  --contact-flow-id <FLOW_ID> \
  --content "$(cat flow.json)" \
  --profile <PROFILE>
```

### Verify deployment:
```bash
aws connect describe-contact-flow \
  --instance-id <INSTANCE_ID> \
  --contact-flow-id <FLOW_ID> \
  --profile <PROFILE>
```
