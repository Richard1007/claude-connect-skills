# Native Test API

Automated testing using the AWS Connect Native Test API (`CreateTestCase`, `StartTestCaseExecution`).

## When to Use

- DTMF-only menus (`GetParticipantInput`)
- Simple Lex bot flows with DTMF input
- Flows without Lambda functions or complex async operations

## When NOT to Use (Known Limitations)

**Tests may timeout (150+ seconds stuck in IN_PROGRESS)** with:
- Lex bot interactions (timing varies)
- Lambda function calls (async timing)
- Complex branching with multiple silent blocks
- `CheckHoursOfOperation` with real-time evaluation

**Evidence:** Observed with IVR #9 (Retail Order Status) containing `ConnectParticipantWithLexBot`, `InvokeLambdaFunction`, `CheckHoursOfOperation`, and `TransferContactToQueue` blocks. 2/2 observations passed but status never progressed from IN_PROGRESS.

For these flows, use Chat API or Manual testing instead.

---

## Test Content Schema (Version 2019-10-30)

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
          "Type": "SendInstruction",
          "Actor": "Customer",
          "Parameters": {
            "ActionType": "SendInstruction",
            "Actor": "Customer",
            "Instruction": {
              "Type": "DtmfInput",
              "Properties": { "Value": 1 }
            }
          }
        }
      ],
      "Transitions": { "NextObservations": ["next-obs-uuid"] }
    }
  ]
}
```

### EndTest Action (Required at Last Observation)

```json
{
  "Identifier": "act-end",
  "Type": "TestControl",
  "Parameters": {
    "ActionType": "TestControl",
    "Command": { "Type": "EndTest" }
  }
}
```

## Critical Validation Rules

1. **Version MUST be `"2019-10-30"`** — Not `"2025-06-21"` or any other version
2. **Do NOT include `Usage` field** — Rejected by validation
3. **Do NOT include `Transitions` inside Actions** — Only observations have transitions
4. **DTMF Value must be a number** — `{ "Value": 1 }` not `{ "Value": "1" }`
5. **FlowActionStarted events CANNOT have Actions** — Use `MessageReceived` events for caller actions
6. **Use `Status: 'PUBLISHED'` for validation** — `Status: 'SAVED'` accepts anything but won't execute
7. **`Content` parameter is a JSON string** — Stringify the test JSON before passing to `CreateTestCase`
8. **Empty Text is rejected** — `Properties: { Text: "" }` causes `InvalidTestCaseException`. Every `MessageReceived` observation MUST have non-empty `Text` **(IVR #8 Finding)**
9. **DTMF Action MUST use nested format** — `Parameters.ActionType` + `Parameters.Instruction.Type: "DtmfInput"`. The old flat format `Parameters.DtmfInput` causes `InvalidTestCaseException`. **(Healthcare IVR Finding)**
10. **EndTest action is required** — Last observation MUST include a `TestControl` action with `Command.Type: "EndTest"`. Without it, tests may hang at IN_PROGRESS.

---

## Standard Observation Structure

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
        "ActionType": "SendInstruction",
        "Actor": "Customer",
        "Instruction": {
          "Type": "DtmfInput",
          "Properties": { "Value": 1 }
        }
      }
    }
  ],
  "Transitions": { "NextObservations": ["obs-3"] }
},
{
  "Identifier": "obs-3",
  "Event": {
    "Identifier": "evt-3",
    "Type": "MessageReceived",
    "Actor": "System",
    "Properties": { "Text": "result message" },
    "MatchingCriteria": "Inclusion"
  },
  "Actions": [
    {
      "Identifier": "act-end",
      "Type": "TestControl",
      "Parameters": {
        "ActionType": "TestControl",
        "Command": { "Type": "EndTest" }
      }
    }
  ],
  "Transitions": { "NextObservations": [] }
}
```

---

## Message Concatenation Rule

**CRITICAL:** Consecutive TTS-producing flow actions are concatenated into a SINGLE `MessageReceived` event:

| Flow Sequence | Test API Event Count |
|--------------|---------------------|
| `MessageParticipant("A") → GetParticipantInput("B")` | ONE event: `"A. B"` |
| `MessageParticipant("A") → MessageParticipant("B") → GetParticipantInput("C")` | ONE event: `"A. B. C"` |
| `GetParticipantInput("A")` → (DTMF) → `MessageParticipant("B")` | TWO events: `"A"` then `"B"` |
| `GetParticipantInput("A")` → (DTMF) → `MessageParticipant("B") → GetParticipantInput("C")` | TWO events: `"A"` then `"B. C"` |

**Rule:** Events are split when a DTMF/input action occurs. Everything before input = one event. Everything after input until next input = next event.

**Impact:** Group consecutive prompts into ONE `MessageReceived` event. Use `MatchingCriteria: "Inclusion"` to match partial text.

---

## Findings from IVR Testing

### Self-Loop GetParticipantInput Is Untestable (IVR #1 Finding)

When a `GetParticipantInput` block loops back to itself, the test API does NOT emit a new `MessageReceived` event. Tests hang at `IN_PROGRESS`.

**Workaround:** IVR flows should route repeat paths through an intermediate `MessageParticipant` block. See `amazon-connect-ivr` skill, Rule 1.

### Error Message Concatenation (IVR #2 Finding)

When `GetParticipantInput` triggers `NoMatchingCondition`, the test engine prepends the prompt text BEFORE the error message: `"Press 1 for English. Sorry, invalid selection."`

### Silent Block Event Boundaries (IVR #2 Finding)

Non-TTS blocks (`UpdateContactAttributes`, `Compare`) between TTS blocks create event boundaries. Error message + retry prompt appear as TWO separate `MessageReceived` events.

**Retry flow observation pattern:**
```json
{
  "Identifier": "obs-welcome-menu",
  "Event": { "Type": "MessageReceived", "Properties": { "Text": "Press 1 for English" }, "MatchingCriteria": "Inclusion" },
  "Actions": [{ "Type": "SendInstruction", "Actor": "Customer", "Parameters": { "ActionType": "SendInstruction", "Actor": "Customer", "Instruction": { "Type": "DtmfInput", "Properties": { "Value": 9 } } } }],
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
  "Actions": [{ "Type": "SendInstruction", "Actor": "Customer", "Parameters": { "ActionType": "SendInstruction", "Actor": "Customer", "Instruction": { "Type": "DtmfInput", "Properties": { "Value": 1 } } } }],
  "Transitions": { "NextObservations": ["obs-result"] }
}
```

### Lex Bot DTMF Works, Prompt Not Observable (IVR #3 Finding)

DTMF through `ConnectParticipantWithLexBot` works correctly. However, the Lex block's `Text` parameter is NOT observable — only match the `MessageParticipant` greeting before the Lex block, then match the response after intent routing.

**Case Normalization:** Neural TTS normalizes case. Use `Inclusion` matching with lowercase-safe fragments.

### Silent Blocks: Full List (IVR #4-#7 Findings)

These blocks produce NO observable events in the test API:
- `UpdateContactAttributes`
- `Compare`
- `UpdateContactTargetQueue`
- `CheckHoursOfOperation`
- `InvokeLambdaFunction`
- `UpdateContactRecordingBehavior`
- `DistributeByPercentage`
- `UpdateContactRoutingBehavior`
- `UpdateContactEventHooks`
- `CreateWisdomSession`

Only subsequent `MessageParticipant` blocks produce observable events.

### Lambda-Interpolated Messages Are Observable (IVR #4 Finding)

`$.External.*` references in `MessageParticipant` resolve to actual values in test events. Use `Inclusion` matching with partial text.

### CheckHoursOfOperation Evaluates Real-Time (IVR #4 Finding)

Hours are checked against real time during test execution. Use a 24/7 queue for "open" path testing, restricted-hours queue for "closed" path testing.

### TransferContactToQueue Produces No Event (IVR #4 Finding)

End test observations after the pre-transfer message. The transfer itself is not observable.

### TransferToFlow Continues Across Flows (IVR #5 Finding)

Sub-flow `MessageParticipant` events ARE observable. Multi-flow architectures can be tested end-to-end.

### DistributeByPercentage Is Non-Deterministic (IVR #5 Finding)

Set 100% to the target branch temporarily to test specific branches.

### Observation Mismatch Causes Text Concatenation (IVR #5 Finding)

If the flow takes an unexpected branch, mismatched message text gets absorbed into the preceding observation. Use `Inclusion` matching to handle this.

### Generative TTS Is Observable (IVR #7 Finding)

Polly Generative (`TextToSpeechEngine: "Generative"`) produces the same `MessageReceived` events as Neural/Standard. No special handling needed.

### CreateWisdomSession Is Silent (IVR #8 Finding)

No observable event. Place a `MessageParticipant` after it to confirm success. Two separate observations for Welcome + Success.

---

## Test Execution Commands

### Create Test Case

**IMPORTANT:** `create-test-case` does NOT have a `--contact-flow-id` parameter. The flow ID goes inside `--entry-point`:

```bash
aws connect create-test-case \
  --instance-id <INSTANCE_ID> \
  --name "S1: Happy Path - Sales" \
  --description "Press 1 to reach sales queue" \
  --status PUBLISHED \
  --entry-point '{"Type":"VOICE_CALL","VoiceCallEntryPointParameters":{"FlowId":"<FLOW_ID>"}}' \
  --content "$(cat test-case.json | jq -c .)" \
  --profile <PROFILE>
```

### Start Execution

**IMPORTANT:** `--client-token` is REQUIRED (use a UUID):

```bash
aws connect start-test-case-execution \
  --instance-id <INSTANCE_ID> \
  --test-case-id <TEST_CASE_ID> \
  --client-token "$(python3 -c 'import uuid; print(uuid.uuid4())')" \
  --profile <PROFILE>
```

### Poll Execution Status

```bash
aws connect get-test-case-execution-summary \
  --instance-id <INSTANCE_ID> \
  --test-case-id <TEST_CASE_ID> \
  --test-case-execution-id <EXECUTION_ID> \
  --profile <PROFILE>
```

### Get Detailed Results (Observation-Level)

```bash
aws connect list-test-case-execution-records \
  --instance-id <INSTANCE_ID> \
  --test-case-id <TEST_CASE_ID> \
  --test-case-execution-id <EXECUTION_ID> \
  --profile <PROFILE>
```

### AWS CLI Timestamp Parsing Bug (Workaround)

**Issue:** AWS CLI v2.33+ has a Python datetime bug — `get-test-case-execution-summary` and `list-test-case-execution-records` may fail with `year 58120 is out of range` due to timestamp overflow.

**Workaround:** Use `--debug` flag and parse the raw JSON from stderr:

```bash
aws connect get-test-case-execution-summary \
  --instance-id <INSTANCE_ID> \
  --test-case-id <TEST_CASE_ID> \
  --test-case-execution-id <EXECUTION_ID> \
  --profile <PROFILE> --debug 2>&1 | grep '"Status"'
```

Or use boto3 (Python) to avoid the CLI parser entirely:

```python
import boto3
client = boto3.Session(profile_name='<PROFILE>').client('connect', region_name='<REGION>')
result = client.get_test_case_execution_summary(
    InstanceId='<INSTANCE_ID>',
    TestCaseId='<TEST_CASE_ID>',
    TestCaseExecutionId='<EXECUTION_ID>'
)
print(result['TestCaseExecutionSummary']['Status'])
```

---

## Test Execution Workflow

1. Generate test case JSON from test script scenarios
2. Create test case via `aws connect create-test-case` with `--status PUBLISHED` and `--entry-point` containing the flow ID
3. Start execution via `aws connect start-test-case-execution` with `--client-token` (UUID)
4. Poll status every 5 seconds via `aws connect get-test-case-execution-summary`
5. Expected statuses: `IN_PROGRESS` → `PASSED` or `FAILED`
6. If stuck at `IN_PROGRESS` for >90 seconds, check if all observations passed (use `list-test-case-execution-records`). If all obs passed but status is TIMEOUT, this is a known timing quirk with Lex bot paths — NOT a flow defect.
7. If observations failed, the observation structure likely doesn't match the actual flow execution. Revise test case content.
8. Collect results and report per scenario
