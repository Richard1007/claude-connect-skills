# Manual Testing

Manual testing via the Amazon Connect Console or real phone calls. The most reliable approach for validating IVR flows.

## When to Use

- **Always** for final pre-production validation
- Complex flows with Lambda, hours checks, queue transfers
- When automated approaches produce inconclusive results
- When verifying actual voice/audio quality
- Debugging flow logic issues

---

## Approach 1: Connect Console — Test Chat

**Most convenient for quick validation.**

### Steps:
1. Log in to Amazon Connect Console
2. Navigate to **Routing** → **Contact Flows**
3. Find and click on the flow to test
4. Click the **"Test chat"** button (bottom-left of flow editor)
5. Type messages to simulate caller input:
   - Type `1` for DTMF press 1
   - Type `balance` for voice utterance
6. Observe system responses in the chat window
7. Verify responses match test script `System:` lines

### What to Verify:
- Greeting message appears correctly
- Menu prompt plays after greeting
- Each input routes to the correct response
- Error handling works for invalid input
- Flow terminates correctly (disconnect message)

### Limitations:
- Cannot test actual voice recognition quality
- Cannot test real DTMF tone processing
- Chat behavior may differ from voice behavior for some blocks

---

## Approach 2: Connect Console — Test Voice Contact

**Best for verifying voice-specific behavior.**

### Steps:
1. Log in to Amazon Connect Console
2. Navigate to **Routing** → **Contact Flows**
3. Find and click on the flow to test
4. Click **"Test voice contact"** or use the softphone CCP
5. Listen to prompts and respond with voice or DTMF
6. Verify TTS voice quality and prompt timing

### What to Verify:
- TTS voice sounds correct (Matthew/Generative)
- Prompts are spoken at appropriate pace
- DTMF tones are recognized correctly
- Voice utterances are recognized by Lex bot
- Timeouts trigger after expected silence duration
- Queue transfers connect to correct queue

---

## Approach 3: Real Phone Call

**Most accurate — tests the exact production experience.**

### Steps:
1. Ensure the flow is assigned to a phone number:
   ```bash
   aws connect list-phone-numbers \
     --instance-id <INSTANCE_ID> \
     --profile <PROFILE> \
     --query 'PhoneNumberSummaryList[*].{Number:PhoneNumber,FlowId:ContactFlowId}'
   ```
2. If not assigned, associate the flow with a phone number via Console or CLI
3. Call the phone number from a real phone
4. Follow each test script scenario, noting actual behavior
5. Compare actual prompts against test script `System:` lines

### What to Verify:
- Everything from Test Voice Contact, plus:
- Real network latency and audio quality
- Actual phone DTMF tone processing
- Real-world voice recognition accuracy
- End-to-end experience including ring tone and connection time

---

## Test Execution Checklist

For each test script scenario, fill out this template:

```markdown
## S[N]: [Scenario Name]

**Approach:** [Console Chat / Console Voice / Phone Call]
**Date:** [YYYY-MM-DD]
**Tester:** [name]

| Step | Expected (from test script) | Actual | Match? |
|------|---------------------------|--------|--------|
| Greeting | "[expected text]" | [what you heard/saw] | ✅ / ❌ |
| Menu prompt | "[expected text]" | [what you heard/saw] | ✅ / ❌ |
| Caller input | [action] | [what you did] | ✅ / ❌ |
| Response | "[expected text]" | [what you heard/saw] | ✅ / ❌ |
| Termination | [disconnect/transfer] | [what happened] | ✅ / ❌ |

**Result:** PASSED / FAILED
**Notes:** [any discrepancies or observations]
```

---

## Debugging Failed Tests

### Flow Shows "Technical Difficulty"

1. Check CloudWatch logs for the Connect instance:
   ```bash
   aws logs filter-log-events \
     --log-group-name /aws/connect/<INSTANCE_NAME> \
     --filter-pattern "ERROR" \
     --start-time $(date -d '5 minutes ago' +%s000) \
     --profile <PROFILE>
   ```
2. Check CloudTrail for access denied errors:
   ```bash
   aws cloudtrail lookup-events \
     --lookup-attributes AttributeKey=EventName,AttributeValue=SendMessage \
     --start-time $(date -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ) \
     --profile <PROFILE>
   ```
3. Common causes:
   - Lex bot using wrong service role (must use `AWSServiceRoleForLexV2Bots_AmazonConnect_*`)
   - Lambda function timeout (max 8 seconds)
   - Missing queue association
   - Q in Connect session not created before Lex bot invocation

### Wrong Intent Matched

1. Test the Lex bot directly:
   ```bash
   aws lexv2-runtime recognize-text \
     --bot-id <BOT_ID> \
     --bot-alias-id <ALIAS_ID> \
     --locale-id en_US \
     --session-id "debug-$(date +%s)" \
     --text "<the utterance>" \
     --profile <PROFILE>
   ```
2. Check if utterance overlaps with another intent
3. Verify DTMF digit is only in one intent's utterances

### No Response After Input

1. Verify the flow has proper transitions from the Lex bot block
2. Check if the intent name in flow conditions matches the actual Lex bot intent name (case-sensitive)
3. Verify the bot alias is associated with the Connect instance

---

## Reporting Results

After testing all scenarios, create a summary report:

```markdown
# [Flow Name] - Test Results

**Date:** [YYYY-MM-DD]
**Approach:** [Console Chat / Console Voice / Phone / Mixed]
**Flow ID:** [flow-id]

## Summary
- **Total scenarios:** [N]
- **Passed:** [N]
- **Failed:** [N]
- **Skipped:** [N] (with reasons)

## Results

| Scenario | Name | Result | Notes |
|----------|------|--------|-------|
| S1 | [name] | PASSED | |
| S2 | [name] | FAILED | [reason] |
| S3 | [name] | SKIPPED | [reason] |
| ... | ... | ... | ... |

## Issues Found
1. [Issue description + steps to reproduce]
2. ...

## Recommendations
1. [Fix suggestion]
2. ...
```
