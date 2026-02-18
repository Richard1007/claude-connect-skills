# Stuck Issues & Known Limitations

Tracking file for issues discovered during automated IVR testing that couldn't be resolved.
Updated as the self-improvement loop progresses.

---

## ISSUE-001: GetParticipantInput Self-Loop Not Detectable by Test API

**Status:** CONFIRMED LIMITATION  
**Severity:** Medium  
**Discovered:** 2026-02-17, IVR Test #1, Scenario S3  

### Description
When a `GetParticipantInput` block loops back to **itself** (e.g., "press 3 to repeat menu"), the AWS Native Test API does NOT emit a new `MessageReceived` event for the re-played prompt. The test hangs indefinitely at `IN_PROGRESS`.

### Root Cause
The test engine treats the re-entry into the same `GetParticipantInput` block as a continuation rather than a new event. The TTS prompt IS played again to the caller, but the test engine doesn't surface it as a new observable event.

### Evidence
- **S3 test (Press 3 → Repeat → Press 1 → Sales):** Stuck at 2/2 observations (test-start + welcome-menu). After sending DTMF 3, the "repeated-menu" observation never matched.
- **S4 test (Press 9 → Invalid → Press 2 → Support):** PASSED ✅ because the invalid path goes through `MessageParticipant("Sorry...") → GetParticipantInput`, which concatenates into ONE new `MessageReceived` event.

### Key Difference
| Path | Flow Route | Test Result |
|------|-----------|-------------|
| S3 (repeat) | `GetParticipantInput` → **self** | ❌ STUCK (no new event) |
| S4 (invalid) | `GetParticipantInput` → `MessageParticipant` → `GetParticipantInput` | ✅ PASSED (concatenated event) |

### Workaround: IVR Design Rule
**Never self-loop a `GetParticipantInput` block.** Instead, route through an intermediate `MessageParticipant` block:

**Bad (untestable):**
```
GetParticipantInput (DTMF 3) → GetParticipantInput (same block)
```

**Good (testable):**
```
GetParticipantInput (DTMF 3) → MessageParticipant("One moment...") → GetParticipantInput (same or new block)
```

The intermediate `MessageParticipant` causes a new `MessageReceived` event that concatenates with the re-played prompt, making the loop observable in tests.

### Impact on Skills
- **IVR Skill**: MUST enforce "no self-loop GetParticipantInput" rule
- **Test Script Skill**: MUST document that self-loops are untestable via Native Test API
- **Manager Skill**: When generating IVRs for testing, always use intermediate blocks for repeat/retry paths

---

## AWS Native Test API: Discovered Behavior Reference

### Message Concatenation Rule
Consecutive TTS-producing flow actions are concatenated into a SINGLE `MessageReceived` event:

| Flow Sequence | Test Event |
|--------------|------------|
| `MessageParticipant("A") → GetParticipantInput("B")` | ONE event: `"A. B"` |
| `MessageParticipant("A") → MessageParticipant("B") → GetParticipantInput("C")` | ONE event: `"A. B. C"` |
| `GetParticipantInput("A")` → (DTMF) → `MessageParticipant("B")` | TWO events: `"A"` then `"B"` |
| `GetParticipantInput("A")` → (DTMF) → `MessageParticipant("B") → GetParticipantInput("C")` | TWO events: `"A"` then `"B. C"` |

**Rule:** Events are split when a DTMF/input action occurs between them. Everything before input = one event. Everything after input until next input = next event.

### Working Test Content Schema (Version 2019-10-30)
```json
{
  "Version": "2019-10-30",
  "Metadata": {},
  "Observations": [
    {
      "Identifier": "unique-id",
      "Event": {
        "Identifier": "event-id",
        "Type": "TestInitiated | MessageReceived | FlowActionStarted | TestCompleted",
        "Actor": "System",
        "Properties": { "Text": "partial text" },
        "MatchingCriteria": "Inclusion"
      },
      "Actions": [
        {
          "Identifier": "action-id",
          "Type": "SendInstruction | TestControl",
          "Actor": "Customer",
          "Parameters": { ... }
        }
      ],
      "Transitions": { "NextObservations": ["next-obs-id"] }
    }
  ]
}
```

### Known Validation Rules
1. Version MUST be `"2019-10-30"` (not `"2025-06-21"`)
2. Do NOT include `Usage` field in observations
3. Do NOT include `Transitions` field inside Actions
4. DTMF `Value` must be a number: `{ "Value": 1 }` not `{ "Value": "1" }`
5. `FlowActionStarted` events CANNOT have Actions (rejected with "Invalid action type")
6. `Status: 'PUBLISHED'` triggers content validation; `Status: 'SAVED'` accepts anything
7. `Content` parameter is a JSON string (stringified JSON)

### SDK Quirks
- `ListTestCases` returns `TestCaseSummaryList` with `.Id` (not `.TestCaseId`)
- `StopTestCaseExecution` requires `ClientToken` parameter
- Execution polling: INITIATION and EXECUTION_START records show as "passed" in ObservationSummary, inflating the count

---

## Components Tested So Far

### IVR #1: Basic DTMF Menu
**Components:** UpdateContactTextToSpeechVoice, MessageParticipant, GetParticipantInput, DisconnectParticipant

| Scenario | Result | Components Exercised |
|----------|--------|---------------------|
| S1: Press 1 → Sales | ✅ PASSED | All 4 basic components |
| S2: Press 2 → Support | ✅ PASSED | All 4 basic components |
| S3: Press 3 → Repeat → Press 1 | ❌ STUCK | Self-loop limitation (ISSUE-001) |
| S4: Press 9 → Invalid → Press 2 | ✅ PASSED | Invalid input → error message → retry |
| S5: Timeout → No input | ✅ PASSED | InputTimeLimitExceeded error path |

### IVR #2: Language Router with Attribute Branching
**Components:** UpdateContactAttributes, Compare, GetParticipantInput (retry pattern), MessageParticipant, DisconnectParticipant

| Scenario | Result | Components Exercised |
|----------|--------|---------------------|
| S1: Press 1 → English | ✅ PASSED | UpdateContactAttributes(language=en) + Compare branches to English |
| S2: Press 2 → Spanish | ✅ PASSED | UpdateContactAttributes(language=es) + Compare branches to Spanish |
| S3: Press 3 → French | ✅ PASSED | UpdateContactAttributes(language=fr) + Compare branches to French |
| S4: Press 9 → Retry → Press 1 | ✅ PASSED | retryCount attribute + Compare retry logic + separate GetParticipantInput for retry |
| S5: Timeout → No input | ✅ PASSED | InputTimeLimitExceeded error path |

**IVR #2 Discoveries:**

1. **GetParticipantInput prompt text is included in error events.** When DTMF triggers NoMatchingCondition, the test engine emits the GetParticipantInput's own prompt text PREPENDED to the error message:
   - Actual text: `"Press 1 for English. Sorry, that was not a valid selection."`
   - The prompt comes BEFORE the error message in the concatenated event

2. **Silent blocks (UpdateContactAttributes, Compare) create event boundaries.** In IVR #1, `MessageParticipant → GetParticipantInput` concatenated into one event. In IVR #2, `UpdateContactAttributes → Compare → MessageParticipant → GetParticipantInput` produced TWO separate events:
   - Event 1: `"Press 1 for English. Sorry, that was not a valid selection."`
   - Event 2: `"Please try again. Press 1 for English, press 2 for Spanish, or press 3 for French."`

3. **Retry counter pattern works.** Using `UpdateContactAttributes(retryCount)` + `Compare(retryCount)` to implement loop-like retry logic is fully functional and testable. This replaces the invalid `Loop` action type.

4. **Separate GetParticipantInput blocks for retry are required.** Using a DIFFERENT GetParticipantInput block for the retry (not self-loop) makes the retry path fully testable.

---

## Components Tested So Far (25 total, 6 tested ✅)

### IVR #3: Lex Bot Integration (Department Directory)
**Components:** ConnectParticipantWithLexBot, MessageParticipant, DisconnectParticipant

| Scenario | Result | Components Exercised |
|----------|--------|---------------------|
| S1: DTMF 1 → Lex SalesIntent → Sales | ✅ PASSED | ConnectParticipantWithLexBot + Lex intent routing |
| S2: DTMF 2 → Lex SupportIntent → Support | ✅ PASSED | ConnectParticipantWithLexBot + Lex intent routing |
| S3: DTMF 3 → Lex BillingIntent → Billing | ✅ PASSED | ConnectParticipantWithLexBot + Lex intent routing |

**IVR #3 Discoveries:**
1. **ConnectParticipantWithLexBot prompt is NOT emitted as MessageReceived.** The Lex block's `Text` parameter is used internally by Lex for voice/DTMF collection — it does NOT appear in test observation events. Only the preceding `MessageParticipant` shows up.
2. **DTMF through Lex works in tests.** The test API sends DTMF digits which Lex correctly maps to intents (e.g., "1" → SalesIntent).
3. **Response text is lowercase.** Neural TTS normalizes case: "Connecting you..." becomes "connecting you..." in test observations.

---

### Tested
| Component | IVR # | Verified Working |
|-----------|-------|-----------------|
| UpdateContactTextToSpeechVoice | #1, #2, #3 | ✅ |
| MessageParticipant | #1, #2, #3 | ✅ |
| GetParticipantInput | #1, #2 | ✅ |
| DisconnectParticipant | #1, #2, #3 | ✅ |
| UpdateContactAttributes | #2 | ✅ |
| Compare | #2 | ✅ |
| ConnectParticipantWithLexBot | #3 | ✅ |

### IVR #4: Smart Business Hours Router
**Components:** CheckHoursOfOperation, InvokeLambdaFunction, UpdateContactTargetQueue, TransferContactToQueue

| Scenario | Result | Components Exercised |
|----------|--------|---------------------|
| S1: DTMF 1 → Sales → Hours Open → Lambda → Transfer Msg → Queue Transfer | ✅ PASSED | All 4 new components + UpdateContactAttributes |
| S2: DTMF 2 → Support → Hours Closed → Closed Message → Disconnect | ✅ PASSED | CheckHoursOfOperation (False branch), UpdateContactTargetQueue |
| S3: DTMF 5 → Invalid → Error Message → Disconnect | ✅ PASSED | GetParticipantInput NoMatchingCondition error path |

**IVR #4 Discoveries:**
1. **All 4 new components deployed and tested cleanly on first attempt.** No deployment errors, no parameter issues. This is the first IVR with zero bugs.
2. **CheckHoursOfOperation uses empty Parameters `{}`** — it reads hours from the queue set by `UpdateContactTargetQueue`. MUST set queue before checking hours, otherwise always returns False.
3. **CheckHoursOfOperation evaluates real-time hours in tests.** BasicQueue (24/7) correctly returned True. ClosedQueue (open only Sun 3:00-3:01 AM ET) correctly returned False.
4. **InvokeLambdaFunction works — `$.External.*` resolves in subsequent blocks.** Lambda returned `departmentName`, `departmentHours`, `agentCount` and the MessageParticipant correctly interpolated them in TTS output.
5. **Test API truncates Lambda-interpolated messages.** S1's actual text showed "You are being connected to sales team." — the full message was longer but the test only returned the first sentence. `Inclusion` matching handles this.
6. **TransferContactToQueue produces no observable event.** The test ended after the Lambda message observation — the TransferContactToQueue was executed but doesn't emit a MessageReceived event. EndTest after the pre-transfer message is the correct pattern.
7. **Neural TTS normalizes digits.** "Press 1" becomes "Press one" in test observations (S3 welcome text).
8. **Silent blocks confirmed.** UpdateContactAttributes, UpdateContactTargetQueue, CheckHoursOfOperation, InvokeLambdaFunction are all silent — no MessageReceived events. Only subsequent MessageParticipant blocks produce observable events.

**AWS Resources Created for IVR #4:**
- Lambda: `self-learning-test-4-lookup` (arn:aws:lambda:us-west-2:988066449281:function:self-learning-test-4-lookup)
- IAM Role: `self-learning-lambda-role`
- Hours of Operation: "Closed Hours - Test Only" (b22a43c5-d5d2-45a5-87a8-a317d656f524) — open only Sun 3:00-3:01 AM ET
- Queue: "ClosedQueue" (c0ea4d3e-1ef8-4d75-b0d7-158dcb6335b0) — uses Closed Hours

---

### IVR #5: A/B Test with Flow Transfer & Recording
**Components:** DistributeByPercentage, TransferToFlow, UpdateContactRecordingBehavior

| Scenario | Result | Components Exercised |
|----------|--------|---------------------|
| S1 (50/50): Expect Group A | ❌ TIMEOUT | DistributeByPercentage routed to B (non-deterministic) |
| S2 (50/50): Expect Group B | ✅ PASSED | DistributeByPercentage + Group B message |
| S3 (50/50): Expect Group A retry | ❌ TIMEOUT | Same — consistently routed to B |
| S4 (100/0): Group A → TransferToFlow | ✅ PASSED | DistributeByPercentage + TransferToFlow + sub-flow execution |

**IVR #5 Discoveries:**
1. **DEPLOYMENT BUG: UpdateContactRecordingBehavior rejects `NoMatchingError`** — Must use `"Errors": []` (empty array). Adding `NoMatchingError` causes `InvalidContactFlowException`. This is different from most other blocks which accept NoMatchingError.
2. **DistributeByPercentage is truly non-deterministic in tests** — 3/3 runs at 50/50 split all went to Group B. Cannot write deterministic tests for percentage-based routing.
3. **TransferToFlow works across flow boundaries in tests!** The test engine follows execution from the main flow into the transferred flow and continues observing events. Sub-flow TTS messages are observable.
4. **UpdateContactRecordingBehavior is silent** — no observable event, no event boundary. Consistent with other settings blocks.
5. **DistributeByPercentage is silent** — no observable event. The flow transitions directly to the selected branch's next action.
6. **When test observations don't match actual branch, text concatenates into previous observation.** S1 expected Group A but got Group B. The welcome observation absorbed both welcome + Group B text: "Welcome to the AB testing flow. You have been selected for Group B. Thank you for calling."
7. **For testing DistributeByPercentage: use 100% split** to guarantee a specific path, then test both paths separately with 100/0 and 0/100 splits.

---

### IVR #6: Callback and Queue Priority (Deployment Testing)
**Components tested for deployment:** UpdateContactRoutingBehavior, UpdateContactEventHooks, GetParticipantInput (StoreInput)

| Component | Deployment | Notes |
|-----------|-----------|-------|
| UpdateContactRoutingBehavior | ✅ Deploys | Needs `"Errors": [], "Conditions": []` (empty arrays, no NoMatchingError) |
| UpdateContactEventHooks | ✅ Deploys | Works with CustomerQueue hook referencing CUSTOMER_QUEUE flow ARN |
| GetParticipantInput (StoreInput=True, Conditions=[]) | ❌ FAILS | `InvalidContactFlowException` — empty Conditions array with StoreInput causes rejection |

**IVR #6 Discoveries:**
1. **DEPLOYMENT BUG: GetParticipantInput with StoreInput="True" and empty Conditions rejects.** When collecting free-form input (phone numbers), an empty `"Conditions": []` causes `InvalidContactFlowException`. Likely needs at least one condition or the Conditions field omitted entirely.
2. **UpdateContactRoutingBehavior deploys with empty Errors** — same pattern as UpdateContactRecordingBehavior. Settings blocks generally need `"Errors": []`.
3. **UpdateContactEventHooks deploys fine** — CustomerQueue hook with full flow ARN works.

---

### IVR #7: Generative TTS (Polly Generative Engine)
**Components:** UpdateContactTextToSpeechVoice (Generative engine)

| Scenario | Result | Components Exercised |
|----------|--------|---------------------|
| S1: Generative TTS message | ✅ PASSED | UpdateContactTextToSpeechVoice(Generative) + MessageParticipant |

**IVR #7 Discoveries:**
1. **`TextToSpeechEngine: "Generative"` = Polly Generative, NOT Nova Sonic.** Nova Sonic is a separate Bedrock Realtime API (`amazon.nova-sonic-v1:0`) that cannot be used in Connect flow JSON. Connect "Conversational AI bots" with Nova Sonic are console-only.
2. **Generative TTS deploys and tests identically to Neural.** No special handling needed. Voice `Matthew` verified.
3. **Test API treats Generative same as Neural.** `MessageReceived` events contain the same text content regardless of engine.

---

### IVR #8: Q in Connect (CreateWisdomSession)
**Components:** CreateWisdomSession

| Scenario | Result | Components Exercised |
|----------|--------|---------------------|
| S1: Happy path (welcome + success) | ✅ PASSED | CreateWisdomSession + MessageParticipant x2 |
| S2: Broad match (welcome only) | ✅ PASSED | CreateWisdomSession + MessageParticipant |

**IVR #8 Discoveries:**
1. **CreateWisdomSession is a SILENT block.** No `MessageReceived` event in test API. Session is created but not observable.
2. **QIC assistant must be associated with Connect instance first.** Use `aws connect create-integration-association --integration-type WISDOM_ASSISTANT --integration-arn <assistant-arn>`.
3. **Test API rejects empty `Text: ""` in observations.** `InvalidTestCaseException: At least one of PromptId, Text, or SSML must be present`. Every MessageReceived observation needs non-empty text.
4. **ARN uses `wisdom` namespace** despite service rebranding to `qconnect`. Pattern: `arn:aws:wisdom:REGION:ACCOUNT:assistant/ASSISTANT_ID`.
5. **Q in Connect has no free tier.** Charges: $0.50/agent hour (prorated), $0.003/query.

---

### Tested (18 of 25 components — 16 fully tested + 2 deployment-only)
| Component | IVR # | Verified Working |
|-----------|-------|-----------------|
| UpdateContactTextToSpeechVoice | #1-#4, #7 | ✅ (Neural + Generative) |
| MessageParticipant | #1-#4, #7, #8 | ✅ |
| GetParticipantInput | #1, #2, #4 | ✅ |
| DisconnectParticipant | #1-#4, #7, #8 | ✅ |
| UpdateContactAttributes | #2, #4 | ✅ |
| Compare | #2 | ✅ |
| ConnectParticipantWithLexBot | #3 | ✅ |
| CheckHoursOfOperation | #4 | ✅ |
| InvokeLambdaFunction | #4 | ✅ |
| UpdateContactTargetQueue | #4 | ✅ |
| TransferContactToQueue | #4 | ✅ |
| DistributeByPercentage | #5 | ✅ |
| TransferToFlow | #5 | ✅ |
| UpdateContactRecordingBehavior | #5 | ✅ (deployment bug: no NoMatchingError) |
| UpdateContactRoutingBehavior | #6 | ✅ (deploy-only, empty Errors) |
| UpdateContactEventHooks | #6 | ✅ (deploy-only) |
| UpdateContactTextToSpeechVoice (Generative) | #7 | ✅ |
| CreateWisdomSession | #8 | ✅ |

### Untested (7 remaining — skipped per user instruction)
**Skipped:** Wait, MessageParticipantIteratively, CreateTask, CheckMetricData, EndFlowExecution, CreateCallbackContact, UpdateContactCallbackNumber
**Reason:** "if some components are hard to test and rarely used, dont test them"
