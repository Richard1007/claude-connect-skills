# Chat API Testing

Semi-automated testing using the Amazon Connect Chat API (`StartChatContact`, `CreateParticipantConnection`, `SendMessage`, `GetTranscript`).

## When to Use

- Lex bot flows (voice + DTMF)
- Lambda function integrations
- Q in Connect (QIC) flows — user confirmed "live chat works even for QIC"
- Flows that timeout with Native Test API

## When NOT to Use

- When you need to verify actual voice/DTMF interaction fidelity
- When you need to test silence/timeout behavior (requires voice channel)

---

## Chat API Flow

```
1. StartChatContact          → Creates a chat contact on the flow
2. CreateParticipantConnection → Gets connection token + websocket URL
3. SendMessage               → Sends customer messages (simulates caller input)
4. GetTranscript             → Retrieves conversation history
5. DisconnectParticipant     → Ends the chat session
```

## Step-by-Step

### 1. Start Chat Contact

```bash
aws connect start-chat-contact \
  --instance-id <INSTANCE_ID> \
  --contact-flow-id <FLOW_ID> \
  --participant-details '{"DisplayName":"TestCaller"}' \
  --profile <PROFILE> \
  --region <REGION>
```

**Response includes:**
- `ContactId` — the contact identifier
- `ParticipantId` — the customer participant ID
- `ParticipantToken` — used for CreateParticipantConnection

### 2. Create Participant Connection

```bash
aws connectparticipant create-participant-connection \
  --type '["CONNECTION_CREDENTIALS","WEBSOCKET"]' \
  --participant-token <PARTICIPANT_TOKEN> \
  --region <REGION>
```

**Response includes:**
- `ConnectionCredentials.ConnectionToken` — used for all subsequent calls
- `Websocket.Url` — for real-time event streaming (optional)

### 3. Send Message (Simulate Caller Input)

For DTMF simulation, send the digit as text:

```bash
aws connectparticipant send-message \
  --connection-token <CONNECTION_TOKEN> \
  --content-type "text/plain" \
  --content "1" \
  --region <REGION>
```

For voice simulation, send the utterance as text:

```bash
aws connectparticipant send-message \
  --connection-token <CONNECTION_TOKEN> \
  --content-type "text/plain" \
  --content "I want to check my balance" \
  --region <REGION>
```

### 4. Get Transcript

```bash
aws connectparticipant get-transcript \
  --connection-token <CONNECTION_TOKEN> \
  --region <REGION>
```

**Response includes:** Array of transcript items with:
- `ParticipantRole` — "CUSTOMER" or "SYSTEM" or "AGENT"
- `Content` — message text
- `Type` — "MESSAGE", "EVENT", "CONNECTION_ACK", etc.

### 5. Disconnect

```bash
aws connectparticipant disconnect-participant \
  --connection-token <CONNECTION_TOKEN> \
  --region <REGION>
```

---

## Node.js Test Harness Pattern

```javascript
import { ConnectClient, StartChatContactCommand } from "@aws-sdk/client-connect";
import {
  ConnectParticipantClient,
  CreateParticipantConnectionCommand,
  SendMessageCommand,
  GetTranscriptCommand,
  DisconnectParticipantCommand
} from "@aws-sdk/client-connectparticipant";

const REGION = "us-west-2";
const INSTANCE_ID = "<instance-id>";
const FLOW_ID = "<flow-id>";

const connectClient = new ConnectClient({ region: REGION });
const participantClient = new ConnectParticipantClient({ region: REGION });

async function testScenario(messages, delayMs = 3000) {
  // 1. Start chat
  const chatResp = await connectClient.send(new StartChatContactCommand({
    InstanceId: INSTANCE_ID,
    ContactFlowId: FLOW_ID,
    ParticipantDetails: { DisplayName: "TestCaller" }
  }));

  // 2. Connect participant
  const connResp = await participantClient.send(new CreateParticipantConnectionCommand({
    Type: ["CONNECTION_CREDENTIALS"],
    ParticipantToken: chatResp.ParticipantToken
  }));
  const token = connResp.ConnectionCredentials.ConnectionToken;

  // 3. Send messages with delays
  for (const msg of messages) {
    await new Promise(r => setTimeout(r, delayMs));
    await participantClient.send(new SendMessageCommand({
      ConnectionToken: token,
      ContentType: "text/plain",
      Content: msg
    }));
  }

  // 4. Wait and get transcript
  await new Promise(r => setTimeout(r, delayMs));
  const transcript = await participantClient.send(new GetTranscriptCommand({
    ConnectionToken: token
  }));

  // 5. Disconnect
  await participantClient.send(new DisconnectParticipantCommand({
    ConnectionToken: token
  }));

  return transcript.Transcript;
}

// Example: Test S1 - Account Balance (DTMF)
const results = await testScenario(["1"]);
console.log("System messages:", results.filter(t => t.ParticipantRole === "SYSTEM"));
```

---

## CRITICAL: GetTranscript Timing for QIC Flows

**Discovery (Feb 24, 2026):** `GetTranscript` DOES return all participant roles (CUSTOMER, SYSTEM, AGENT) — including QIC AI responses and MessageParticipant block output. Previous "INCONCLUSIVE" results were caused by calling GetTranscript too early, before the flow had emitted system messages.

**Rules:**
1. **Wait 10-15 seconds** between sending a message and calling GetTranscript (QIC needs time to process)
2. **Use `--scan-direction BACKWARD --sort-order ASCENDING`** to get chronological order
3. System messages appear with `ParticipantRole: "SYSTEM"` and `Type: "MESSAGE"`
4. QIC AI responses, greeting, ready, and goodbye messages are ALL visible

**Confirmed working on:** Warriors Store QIC IVR (Feb 2026) — greeting, QIC responses, EndConversationIntent goodbye all observed via both GetTranscript and WebSocket.

---

## WebSocket Capture (Real-Time Alternative)

For real-time message capture without polling, use WebSocket. Request `WEBSOCKET` type in CreateParticipantConnection (Step 2), then connect with Node.js:

```javascript
// ws_capture.mjs — requires: npm install ws
import WebSocket from 'ws';
const ws = new WebSocket(WS_URL);
ws.on('open', () => {
  ws.send(JSON.stringify({ topic: "aws/subscribe", content: { topics: ["aws/chat"] } }));
});
ws.on('message', (raw) => {
  const envelope = JSON.parse(raw.toString());
  if (envelope.topic === "aws/chat") {
    const msg = JSON.parse(envelope.content);
    console.log(`[${msg.ParticipantRole}] ${msg.Content}`);
    // ParticipantRole: "SYSTEM" for greeting, QIC responses, goodbye
    // ParticipantRole: "CUSTOMER" for sent messages
  }
});
```

**When to use WebSocket over GetTranscript:**
- You need real-time message capture (no polling delay)
- You want to measure QIC response time
- You're running multiple scenarios in sequence and need precise timing

---

## Comparing Results to Test Scripts

| Test Script Line | Chat API Verification |
|-----------------|----------------------|
| `System: "[prompt text]"` | Check transcript for SYSTEM messages with matching Content |
| `Caller: Press 1` | Send `"1"` via SendMessage |
| `Caller: Say "balance"` | Send `"balance"` via SendMessage |
| `System: Transfers to [queue]` | Check for transfer event in transcript |
| `System: Call disconnects` | Check for `chat.ended` event or DisconnectTimestamp |

## Test Execution Workflow

1. Parse test script scenarios
2. For each scenario, extract the sequence of caller actions
3. Start a new chat contact per scenario
4. Create participant connection with `["CONNECTION_CREDENTIALS","WEBSOCKET"]`
5. **Option A (WebSocket):** Connect WebSocket, subscribe to `aws/chat`, capture all messages in real-time
6. **Option B (Polling):** Send messages with **10-15 second delays** between each, then call GetTranscript
7. Compare transcript against expected outcomes (check SYSTEM messages match expected text)
8. Report PASSED / FAILED per scenario
