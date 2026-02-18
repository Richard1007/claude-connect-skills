# How We Test IVRs — Amazon Connect Native Test API

## What Is It?

We use the **Amazon Connect Native Test API** — a server-side flow simulation engine built into Connect. It was released in late 2024 and is accessed via four API calls:

1. `CreateTestCase` — defines the test scenario (what to expect, what inputs to send)
2. `StartTestCaseExecution` — runs the test against a deployed contact flow
3. `GetTestCaseExecutionSummary` — polls for pass/fail status
4. `ListTestCaseExecutionRecords` — retrieves detailed observation-by-observation results

All calls go through the AWS SDK (`@aws-sdk/client-connect`). We wrote Node.js scripts that chain these calls.

## Is It Like a Real Phone Call?

**No.** No actual phone call is made. No audio is generated. No phone number is dialed.

The test engine **simulates the contact flow execution server-side**. It walks through the flow JSON block by block, evaluates branching logic, invokes real AWS services (Lambda, Lex, Hours of Operation, Q in Connect), and compares what the flow *would say* against what the test expects.

Think of it as a **dry run of the flow logic** — everything except the telephony layer.

## What Gets Tested vs What Doesn't

| Tested (real execution) | NOT Tested |
|---|---|
| Flow branching logic (Compare, DistributeByPercentage) | Actual voice/audio playback |
| TTS message content (exact text verified) | Voice recognition accuracy (ASR) |
| DTMF digit routing through GetParticipantInput | Real phone connectivity / call quality |
| DTMF digit routing through Lex bots | Hold music / queue wait experience |
| Lex intent matching (text-based) | Real-time latency |
| Lambda invocations (real Lambda executes) | Caller ID / ANI handling |
| Hours of Operation checks (real-time evaluation) | Conference / transfer to external numbers |
| Queue targeting (UpdateContactTargetQueue) | Agent-side experience |
| Contact attributes (set and read) | Recording playback |
| TransferToFlow (crosses flow boundaries) | Whisper flows |
| CreateWisdomSession (Q in Connect) | Actual speech-to-text conversion |
| Generative TTS engine selection | Audio quality of different TTS voices |

## DTMF vs Voice Testing

### DTMF: ✅ Fully Tested
DTMF input is sent via `SendInstruction` actions in the test case:

```json
{
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
```

The test engine processes the DTMF digit exactly as a real call would — routing through `GetParticipantInput` conditions or feeding it into a Lex bot for intent matching. **DTMF value must be a number, not a string.**

### Voice/Speech: ❌ Not Directly Tested
The test API does **not send audio or simulate speech recognition**. There is no `VoiceInput` instruction type.

When testing Lex bot blocks, the test engine sends the DTMF digit to Lex, and Lex matches it against utterances that include digit strings (e.g., utterance `"1"` matches DTMF `1`). This confirms the Lex intent routing works, but it does **not** test whether saying "I need support" would be correctly recognized by Lex's NLU.

**To test actual voice recognition**, you would need to make real phone calls (manually or via a telephony automation service like Bland AI, Retell AI, or Vapi — all paid services).

## How a Test Scenario Works

Example: Testing a DTMF menu where pressing 1 routes to Sales.

```
Test Engine                          Connect Flow
    |                                     |
    |-- TestInitiated ------------------>|
    |                                     |-- SetVoice (silent)
    |                                     |-- MessageParticipant: "Welcome..."
    |<-- MessageReceived: "Welcome..." --|
    |   (verify: text contains "Welcome") |
    |                                     |-- GetParticipantInput: "Press 1 for Sales..."
    |<-- MessageReceived: "Press 1..." --|
    |   (verify: text contains "Sales")   |
    |                                     |
    |-- SendInstruction: DTMF 1 -------->|
    |                                     |-- Condition match: "1" → Sales
    |                                     |-- MessageParticipant: "Connecting to Sales"
    |<-- MessageReceived: "Sales" -------|
    |   (verify: text contains "Sales")   |
    |                                     |-- DisconnectParticipant
    |-- EndTest ------------------------>|
```

Key behaviors discovered through testing:
- **Silent blocks** (UpdateContactAttributes, Compare, CheckHoursOfOperation, Lambda, etc.) produce no MessageReceived events
- **Consecutive TTS blocks** concatenate into ONE MessageReceived event (e.g., Welcome + Menu = one observation)
- **Lex bot prompts** are consumed internally — the prompt text inside ConnectParticipantWithLexBot is NOT observable
- **CreateWisdomSession** is silent — no event produced, just proceeds to next block

## Price

### Native Test API: FREE

There is **no additional charge** for the Native Test API. Since no actual phone call is placed:
- No per-minute telephony charges
- No carrier fees
- No Amazon Connect usage charges for the test contact

However, **downstream AWS services invoked during the test ARE charged normally**:
- **Lambda**: Standard Lambda pricing (likely pennies — each invocation is <1 second)
- **Lex**: Standard Lex pricing per request (~$0.004/voice, $0.00075/text — tests use text pricing)
- **Q in Connect**: If CreateWisdomSession is invoked, standard Q in Connect pricing applies ($0.50/agent hour, prorated)
- **S3/DynamoDB/etc.**: If Lambda reads/writes to other services, those costs apply

**For our test loop**, typical cost per full test cycle (deploy + run 3-5 test scenarios) is effectively **$0.00 to $0.01**. The Lex and Lambda calls are fractions of a cent. Q in Connect sessions are prorated per second.

### Comparison to Alternatives

| Method | Cost per Test | Fidelity |
|---|---|---|
| **Native Test API** (what we use) | ~$0.00 | Flow logic + DTMF + Lex intent matching |
| **Manual phone call** | ~$0.02-0.05/min + human time | Full fidelity (audio, ASR, latency) |
| **Bland AI / Retell AI** (automated calling) | $0.07-0.12/min | Full fidelity, automated, but paid |
| **Vapi** (voice AI platform) | $0.05-0.10/min | Full fidelity, programmable |

We chose the Native Test API because:
1. It's free
2. It's fast (results in 5-15 seconds, no actual call setup)
3. It's programmable (Node.js scripts in a loop)
4. It catches the bugs that matter most (flow logic, deployment errors, wrong branching)
5. It runs in an infinite improvement loop without accumulating telephony costs

## What We've Tested So Far (18 Components)

| # | IVR | Components Tested | Results |
|---|-----|-------------------|---------|
| 1 | DTMF Menu | UpdateContactTextToSpeechVoice, MessageParticipant, GetParticipantInput, DisconnectParticipant | 4/5 pass |
| 2 | Language Router | UpdateContactAttributes, Compare | 5/5 pass |
| 3 | Lex Bot Integration | ConnectParticipantWithLexBot | 3/3 pass |
| 4 | Business Hours Router | CheckHoursOfOperation, InvokeLambdaFunction, UpdateContactTargetQueue, TransferContactToQueue | 3/3 pass |
| 5 | A/B Test with Transfer | DistributeByPercentage, TransferToFlow, UpdateContactRecordingBehavior | 2/4 pass (non-deterministic %) |
| 6 | Deploy-Only Tests | UpdateContactRoutingBehavior, UpdateContactEventHooks | Deploy ✅ |
| 7 | Generative TTS | TextToSpeechEngine: "Generative" | 2/2 pass |
| 8 | Q in Connect | CreateWisdomSession | 2/2 pass (+ detail test in progress) |

## Bugs Found Through Testing

14 deployment rules and 13 test API behavior rules discovered — all fed back into the three Claude Code skills. Examples:

- `DisconnectParticipant` needs `Transitions: {}` (not `Transitions: { NextAction: ... }`)
- `UpdateContactRecordingBehavior` rejects `NoMatchingError` — must use `Errors: []`
- Curly apostrophes in TTS text break deployment
- `GetParticipantInput` with `StoreInput: "True"` rejects empty `Conditions: []`
- Consecutive MessageParticipant blocks concatenate into one test observation
- Lex bot prompt text is NOT observable in test results
- `DistributeByPercentage` is non-deterministic — use 100% split for reliable testing

Full list: see `stuck-issues.md` in this folder.
