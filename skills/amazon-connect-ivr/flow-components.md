# Amazon Connect Flow Components Reference

> **VERIFIED** — Every type and schema in this file was extracted from real deployed Amazon Connect flows (Version 2019-10-30). Use ONLY the types listed here.

## All Valid Action Types (24)

### Interaction — Caller-facing blocks

| Type | When to Use | UI Block Name |
|------|-------------|---------------|
| `MessageParticipant` | Play a TTS prompt or SSML audio to the caller | Play prompt |
| `GetParticipantInput` | Collect DTMF digits (0-9, #, *) or phone numbers from the caller | Get customer input (DTMF) |
| `ConnectParticipantWithLexBot` | Route voice + DTMF input through a Lex V2 bot for NLU intent matching | Get customer input (Lex) |
| `MessageParticipantIteratively` | Play a looping hold message (SSML with `<break>` tags) while caller waits | Loop prompts |

### Flow Control — Decision and routing logic

| Type | When to Use | UI Block Name |
|------|-------------|---------------|
| `Compare` | Branch based on contact attribute value, system variable, or Lambda return value | Check contact attributes |
| `CheckHoursOfOperation` | Branch based on whether the queue's hours of operation are currently open | Check hours of operation |
| `CheckMetricData` | Branch based on real-time queue metrics (e.g., oldest contact age, agents available) | Check queue metrics |
| `DistributeByPercentage` | A/B test or percentage-based routing (e.g., 50/50 split) | Distribute by percentage |
| `Wait` | Pause the flow for a duration or until an event (e.g., `CustomerReturned`) | Wait |
| `EndFlowExecution` | End the current flow module and return to the calling flow | End flow / Return |

### Routing — Transfer and queue management

| Type | When to Use | UI Block Name |
|------|-------------|---------------|
| `UpdateContactTargetQueue` | Set which queue (by QueueId or AgentId) the contact will be placed in — **MUST be called before** `TransferContactToQueue` | Set working queue |
| `TransferContactToQueue` | Transfer the contact into the queue set by `UpdateContactTargetQueue` | Transfer to queue |
| `TransferToFlow` | Transfer to a different contact flow (by ContactFlowId ARN) | Transfer to flow |
| `CreateCallbackContact` | Create a queued callback — caller hangs up and gets called back when an agent is free | Create callback |
| `CreateTask` | Create an agent task with name, description, and contact attributes | Create task |

### Settings — Configure contact properties

| Type | When to Use | UI Block Name |
|------|-------------|---------------|
| `UpdateContactAttributes` | Set custom key-value attributes on the contact (e.g., `language`, `retryCount`, `memberId`) | Set contact attributes |
| `UpdateContactTextToSpeechVoice` | Set TTS voice, engine (Standard/Neural/Generative), and style | Set voice |
| `UpdateContactRecordingBehavior` | Enable or disable call recording for agent, customer, or both | Set recording behavior |
| `UpdateContactEventHooks` | Set which flow runs on events (e.g., customer queue flow, disconnect flow) | Set event hooks |
| `UpdateContactRoutingBehavior` | Change queue priority (lower = higher priority) or age adjustment | Change routing priority |
| `UpdateContactCallbackNumber` | Set the callback phone number (from `$.StoredCustomerInput` or explicit number) | Set callback number |
| `UpdatePreviousContactParticipantState` | Set previous contact participant state (e.g., `OffHold`) for transfers | Set participant state |

### Termination

| Type | When to Use | UI Block Name |
|------|-------------|---------------|
| `DisconnectParticipant` | End the call / disconnect the contact | Disconnect |

### Integration — External services

| Type | When to Use | UI Block Name |
|------|-------------|---------------|
| `InvokeLambdaFunction` | Call an AWS Lambda function and use its return values via `$.External.*` | Invoke AWS Lambda function |

---

## CRITICAL: Types That Do NOT Work

These types appear in some documentation but are **rejected** by `create-contact-flow`:

| Wrong Type | Correct Replacement |
|------------|-------------------|
| `InvokeExternalResource` | `InvokeLambdaFunction` (different param names too) |
| `Loop` | Use `Compare` on a counter attribute + `UpdateContactAttributes` to increment |
| `HoldParticipant` | Not available in contact flow JSON |
| `ResumeParticipant` | Not available in contact flow JSON |
| `ConnectToDataStore` | Not available in contact flow JSON |

---

## Block JSON Schemas (Verified)

### MessageParticipant

Play a TTS or SSML prompt to the caller.

```json
{
  "Identifier": "uuid-here",
  "Type": "MessageParticipant",
  "Parameters": {
    "Text": "Welcome to our clinic. How can we help you today?"
  },
  "Transitions": {
    "NextAction": "next-uuid",
    "Errors": [],
    "Conditions": []
  }
}
```

**Parameter options:**
- `"Text"` — Plain text for TTS, or SSML wrapped in `<speak>` tags
- Dynamic references: `$.External.fieldName` (Lambda), `$.Attributes.fieldName` (contact attributes), `$.CustomerEndpoint.Address` (caller phone)

---

### GetParticipantInput

Collect DTMF digits or phone numbers. Use for simple menus (press 1/2/3) or phone number entry.

```json
{
  "Identifier": "uuid-here",
  "Type": "GetParticipantInput",
  "Parameters": {
    "Text": "Press 1 for sales. Press 2 for support.",
    "StoreInput": "False",
    "InputTimeLimitSeconds": "5"
  },
  "Transitions": {
    "NextAction": "default-uuid",
    "Conditions": [
      {
        "NextAction": "sales-uuid",
        "Condition": { "Operator": "Equals", "Operands": ["1"] }
      },
      {
        "NextAction": "support-uuid",
        "Condition": { "Operator": "Equals", "Operands": ["2"] }
      }
    ],
    "Errors": [
      { "NextAction": "timeout-uuid", "ErrorType": "InputTimeLimitExceeded" },
      { "NextAction": "nomatch-uuid", "ErrorType": "NoMatchingCondition" },
      { "NextAction": "error-uuid", "ErrorType": "NoMatchingError" }
    ]
  }
}
```

**For phone number input with validation:**
```json
{
  "Parameters": {
    "Text": "Enter the number you would like to be called back at.",
    "StoreInput": "True",
    "InputTimeLimitSeconds": "6",
    "InputValidation": {
      "PhoneNumberValidation": {
        "NumberFormat": "Local",
        "CountryCode": "US"
      }
    }
  }
}
```

**For encrypted input (credit card):**
```json
{
  "Parameters": {
    "Text": "Please enter your credit card number, press pound when complete.",
    "StoreInput": "True",
    "InputTimeLimitSeconds": "6",
    "InputValidation": {
      "CustomValidation": { "MaximumLength": "20" }
    },
    "InputEncryption": {
      "EncryptionKeyId": "your-key-id",
      "Key": "certificate-content"
    }
  }
}
```

**Key rules:**
- `InputTimeLimitSeconds`: 1-180 (string)
- `StoreInput`: `"True"` or `"False"` (string, NOT boolean)
- Stored input accessible via `$.StoredCustomerInput`
- Error types: `InputTimeLimitExceeded`, `NoMatchingCondition`, `NoMatchingError`, `InvalidPhoneNumber`

---

### ConnectParticipantWithLexBot

Route caller input through a Lex V2 bot for voice recognition + DTMF. Use when callers can speak OR press keys.

```json
{
  "Identifier": "uuid-here",
  "Type": "ConnectParticipantWithLexBot",
  "Parameters": {
    "Text": "Are you a provider or a patient? You can say provider or press 1.",
    "LexV2Bot": {
      "AliasArn": "arn:aws:lex:us-west-2:ACCOUNT:bot-alias/BOTID/ALIASID"
    }
  },
  "Transitions": {
    "NextAction": "fallback-uuid",
    "Conditions": [
      {
        "NextAction": "provider-uuid",
        "Condition": { "Operator": "Equals", "Operands": ["ProviderIntent"] }
      },
      {
        "NextAction": "patient-uuid",
        "Condition": { "Operator": "Equals", "Operands": ["PatientIntent"] }
      }
    ],
    "Errors": [
      { "NextAction": "nomatch-uuid", "ErrorType": "NoMatchingCondition" },
      { "NextAction": "error-uuid", "ErrorType": "NoMatchingError" }
    ]
  }
}
```

**With session attributes (e.g., voice override):**
```json
{
  "Parameters": {
    "Text": "How can I help you today",
    "LexV2Bot": {
      "AliasArn": "arn:aws:lex:us-west-2:ACCOUNT:bot-alias/BOTID/ALIASID"
    },
    "LexSessionAttributes": {
      "x-amz-lex:audio:speaker-model-voice-override": "tiffany"
    }
  }
}
```

**Key points:**
- Conditions match on **intent names** returned by Lex (not DTMF digits)
- DTMF-to-intent mapping is configured in the Lex bot itself
- Lex slot values accessible via `$.Lex.Slots.slotName`
- Error types: `NoMatchingCondition`, `NoMatchingError`

---

### Compare

Branch based on a contact attribute, system variable, or Lambda return value.

```json
{
  "Identifier": "uuid-here",
  "Type": "Compare",
  "Parameters": {
    "ComparisonValue": "$.Attributes.language"
  },
  "Transitions": {
    "NextAction": "default-uuid",
    "Conditions": [
      {
        "NextAction": "english-uuid",
        "Condition": { "Operator": "Equals", "Operands": ["en"] }
      },
      {
        "NextAction": "spanish-uuid",
        "Condition": { "Operator": "Equals", "Operands": ["es"] }
      }
    ],
    "Errors": [
      { "NextAction": "default-uuid", "ErrorType": "NoMatchingCondition" }
    ]
  }
}
```

**ComparisonValue sources:**
- `$.Attributes.keyName` — custom contact attributes
- `$.External.keyName` — Lambda return values
- `$.Channel` — `VOICE`, `CHAT`, or `TASK`
- `$.CustomerEndpoint.Address` — caller phone number
- `$.SystemEndpoint.Address` — called number

**Operators:** `Equals`, `StartsWith`, `Contains`, `NumberGreaterThan`, `NumberLessThan`, `NumberGreaterOrEqualTo`, `NumberLessOrEqualTo`

---

### CheckHoursOfOperation

Branch based on whether the queue's hours of operation are currently open. Uses the hours configured on the queue set by `UpdateContactTargetQueue`.

**IMPORTANT:** You MUST call `UpdateContactTargetQueue` BEFORE this block. If no queue is set on the contact, this block will return `False` (closed) regardless of actual hours.

```json
{
  "Identifier": "uuid-here",
  "Type": "CheckHoursOfOperation",
  "Parameters": {},
  "Transitions": {
    "NextAction": "closed-uuid",
    "Conditions": [
      {
        "NextAction": "open-uuid",
        "Condition": { "Operator": "Equals", "Operands": ["True"] }
      },
      {
        "NextAction": "closed-uuid",
        "Condition": { "Operator": "Equals", "Operands": ["False"] }
      }
    ],
    "Errors": [
      { "NextAction": "error-uuid", "ErrorType": "NoMatchingError" }
    ]
  }
}
```

**No parameters needed** — uses the hours of operation assigned to the current queue.

---

### CheckMetricData

Branch based on real-time queue metrics. Use to check wait times, queue depth, or agent availability.

```json
{
  "Identifier": "uuid-here",
  "Type": "CheckMetricData",
  "Parameters": {
    "MetricType": "OldestContactInQueueAgeSeconds"
  },
  "Transitions": {
    "NextAction": "default-uuid",
    "Errors": [
      { "NextAction": "long-wait-uuid", "ErrorType": "NoMatchingCondition" },
      { "NextAction": "error-uuid", "ErrorType": "NoMatchingError" }
    ],
    "Conditions": [
      {
        "NextAction": "short-wait-uuid",
        "Condition": { "Operator": "NumberLessThan", "Operands": ["300000"] }
      }
    ]
  }
}
```

**MetricType options:** `OldestContactInQueueAgeSeconds`, `AgentsAvailable`, `AgentsOnline`, `ContactsInQueue`, `ContactsScheduled`

---

### DistributeByPercentage

Route contacts by percentage (A/B testing, gradual rollouts). Conditions use cumulative `NumberLessThan` thresholds.

```json
{
  "Identifier": "uuid-here",
  "Type": "DistributeByPercentage",
  "Transitions": {
    "NextAction": "default-uuid",
    "Errors": [
      { "NextAction": "default-uuid", "ErrorType": "NoMatchingCondition" }
    ],
    "Conditions": [
      {
        "NextAction": "group-a-uuid",
        "Condition": { "Operator": "NumberLessThan", "Operands": ["50"] }
      },
      {
        "NextAction": "group-b-uuid",
        "Condition": { "Operator": "NumberLessThan", "Operands": ["100"] }
      }
    ]
  }
}
```

---

### Wait

Pause the flow for a duration or until an event occurs (e.g., customer returns from hold).

```json
{
  "Identifier": "uuid-here",
  "Type": "Wait",
  "Parameters": {
    "TimeLimitSeconds": "900",
    "Events": ["CustomerReturned"]
  },
  "Transitions": {
    "NextAction": "timeout-uuid",
    "Errors": [
      { "NextAction": "error-uuid", "ErrorType": "NoMatchingError" }
    ],
    "Conditions": [
      {
        "NextAction": "timeout-uuid",
        "Condition": { "Operator": "Equals", "Operands": ["WaitCompleted"] }
      },
      {
        "NextAction": "returned-uuid",
        "Condition": { "Operator": "Equals", "Operands": ["CustomerReturned"] }
      }
    ]
  }
}
```

---

### EndFlowExecution

End the current flow module and return control to the calling flow. Use in sub-flows.

```json
{
  "Identifier": "uuid-here",
  "Type": "EndFlowExecution",
  "Parameters": {},
  "Transitions": {}
}
```

---

### UpdateContactTargetQueue

**MUST be called before `TransferContactToQueue`.** Sets the target queue by QueueId ARN or AgentId ARN.

```json
{
  "Identifier": "uuid-here",
  "Type": "UpdateContactTargetQueue",
  "Parameters": {
    "QueueId": "arn:aws:connect:REGION:ACCOUNT:instance/INSTANCE_ID/queue/QUEUE_ID"
  },
  "Transitions": {
    "NextAction": "transfer-uuid",
    "Errors": [
      { "NextAction": "error-uuid", "ErrorType": "NoMatchingError" }
    ],
    "Conditions": []
  }
}
```

**To route to a specific agent:**
```json
{
  "Parameters": {
    "AgentId": "$.Agent.ARN"
  }
}
```

---

### TransferContactToQueue

Transfer the contact into the queue previously set by `UpdateContactTargetQueue`. **No parameters needed.**

```json
{
  "Identifier": "uuid-here",
  "Type": "TransferContactToQueue",
  "Transitions": {
    "NextAction": "error-uuid",
    "Errors": [
      { "NextAction": "error-uuid", "ErrorType": "NoMatchingError" },
      { "NextAction": "full-uuid", "ErrorType": "QueueAtCapacity" }
    ],
    "Conditions": []
  }
}
```

---

### TransferToFlow

Transfer to a different contact flow by its ARN.

```json
{
  "Identifier": "uuid-here",
  "Type": "TransferToFlow",
  "Parameters": {
    "ContactFlowId": "arn:aws:connect:REGION:ACCOUNT:instance/INSTANCE_ID/contact-flow/FLOW_ID"
  },
  "Transitions": {
    "NextAction": "error-uuid",
    "Errors": [
      { "NextAction": "error-uuid", "ErrorType": "NoMatchingError" }
    ],
    "Conditions": []
  }
}
```

---

### CreateCallbackContact

Queue a callback. Caller hangs up and gets called back when an agent becomes available.

```json
{
  "Identifier": "uuid-here",
  "Type": "CreateCallbackContact",
  "Parameters": {
    "InitialCallDelaySeconds": "5",
    "MaximumConnectionAttempts": "1",
    "RetryDelaySeconds": "600"
  },
  "Transitions": {
    "NextAction": "disconnect-uuid",
    "Errors": [
      { "NextAction": "error-uuid", "ErrorType": "NoMatchingError" }
    ],
    "Conditions": []
  }
}
```

**Prerequisite:** Call `UpdateContactCallbackNumber` first to set the callback number.

---

### CreateTask

Create an agent task with a name, description, and attributes.

```json
{
  "Identifier": "uuid-here",
  "Type": "CreateTask",
  "Parameters": {
    "Name": "Follow up on customer issue",
    "Description": "Customer called about authorization status.",
    "Attributes": {
      "CustomerPhoneNumber": "$.CustomerEndpoint.Address",
      "Type": "inbound"
    },
    "ContactFlowId": "arn:aws:connect:REGION:ACCOUNT:instance/INSTANCE_ID/contact-flow/FLOW_ID"
  },
  "Transitions": {
    "NextAction": "next-uuid",
    "Errors": [
      { "NextAction": "error-uuid", "ErrorType": "NoMatchingError" }
    ],
    "Conditions": []
  }
}
```

---

### UpdateContactAttributes

Set custom key-value attributes on the contact. Values are always strings.

```json
{
  "Identifier": "uuid-here",
  "Type": "UpdateContactAttributes",
  "Parameters": {
    "Attributes": {
      "language": "en",
      "retryCount": "0",
      "authStatus": "unauthenticated"
    }
  },
  "Transitions": {
    "NextAction": "next-uuid",
    "Errors": [
      { "NextAction": "error-uuid", "ErrorType": "NoMatchingError" }
    ],
    "Conditions": []
  }
}
```

**Dynamic values:** `"memberId": "$.External.memberId"` (from Lambda), `"callerNumber": "$.CustomerEndpoint.Address"`

---

### UpdateContactTextToSpeechVoice

Set TTS voice, engine, and style. **Always include `TextToSpeechStyle`.**

```json
{
  "Identifier": "uuid-here",
  "Type": "UpdateContactTextToSpeechVoice",
  "Parameters": {
    "TextToSpeechVoice": "Joanna",
    "TextToSpeechEngine": "Neural",
    "TextToSpeechStyle": "None"
  },
  "Transitions": {
    "NextAction": "next-uuid",
    "Errors": [
      { "NextAction": "error-uuid", "ErrorType": "NoMatchingError" }
    ]
  }
}
```

**Engine options:** `"Standard"`, `"Neural"`, `"Generative"`
**Voice options (en-US):** `"Joanna"`, `"Matthew"`, `"Ivy"`, `"Kendra"`, `"Kimberly"`, `"Salli"`, `"Joey"`, `"Justin"`, `"Ruth"`, `"Stephen"`, `"Gregory"`, `"Danielle"`
**Voice options (es-US):** `"Lupe"`, `"Pedro"`

---

### UpdateContactRecordingBehavior

Enable or disable recording for agent, customer, or both.

```json
{
  "Identifier": "uuid-here",
  "Type": "UpdateContactRecordingBehavior",
  "Parameters": {
    "RecordingBehavior": {
      "RecordedParticipants": ["Agent"]
    }
  },
  "Transitions": {
    "NextAction": "next-uuid",
    "Errors": [],
    "Conditions": []
  }
}
```

**RecordedParticipants options:** `["Agent"]`, `["Customer"]`, `["Agent", "Customer"]`, `[]` (none)

---

### UpdateContactEventHooks

Set which flow runs for specific events (e.g., customer queue experience, disconnect).

```json
{
  "Identifier": "uuid-here",
  "Type": "UpdateContactEventHooks",
  "Parameters": {
    "EventHooks": {
      "CustomerQueue": "arn:aws:connect:REGION:ACCOUNT:instance/INSTANCE_ID/contact-flow/FLOW_ID"
    }
  },
  "Transitions": {
    "NextAction": "next-uuid",
    "Errors": [
      { "NextAction": "error-uuid", "ErrorType": "NoMatchingError" }
    ],
    "Conditions": []
  }
}
```

**EventHooks keys:** `"CustomerQueue"`, `"CustomerWhisper"`, `"AgentWhisper"`, `"AgentHold"`, `"CustomerHold"`

---

### UpdateContactRoutingBehavior

Change queue priority (lower number = higher priority) or adjust queue time age.

```json
{
  "Identifier": "uuid-here",
  "Type": "UpdateContactRoutingBehavior",
  "Parameters": {
    "QueuePriority": "1"
  },
  "Transitions": {
    "NextAction": "next-uuid",
    "Errors": [],
    "Conditions": []
  }
}
```

**For time adjustment (push contact forward/back in queue):**
```json
{
  "Parameters": {
    "QueueTimeAdjustmentSeconds": "600"
  }
}
```

---

### UpdateContactCallbackNumber

Set the phone number for callbacks. Usually called after `GetParticipantInput` with `StoreInput: "True"`.

```json
{
  "Identifier": "uuid-here",
  "Type": "UpdateContactCallbackNumber",
  "Parameters": {
    "CallbackNumber": "$.StoredCustomerInput"
  },
  "Transitions": {
    "NextAction": "next-uuid",
    "Errors": [
      { "NextAction": "invalid-uuid", "ErrorType": "InvalidCallbackNumber" },
      { "NextAction": "invalid-uuid", "ErrorType": "CallbackNumberNotDialable" }
    ],
    "Conditions": []
  }
}
```

---

### UpdatePreviousContactParticipantState

Set the previous contact's participant state (for transfer scenarios).

```json
{
  "Identifier": "uuid-here",
  "Type": "UpdatePreviousContactParticipantState",
  "Parameters": {
    "PreviousContactParticipantState": "OffHold"
  },
  "Transitions": {
    "NextAction": "next-uuid",
    "Errors": [
      { "NextAction": "error-uuid", "ErrorType": "NoMatchingError" }
    ],
    "Conditions": []
  }
}
```

---

### MessageParticipantIteratively

Play a looping message (typically SSML with breaks) for queue hold music or repeated announcements.

```json
{
  "Identifier": "uuid-here",
  "Type": "MessageParticipantIteratively",
  "Parameters": {
    "Messages": [
      {
        "SSML": "<speak>Your call is important to us. Please hold. <break time=\"10s\"/></speak>"
      }
    ]
  },
  "Transitions": {
    "Errors": [],
    "Conditions": []
  }
}
```

---

### InvokeLambdaFunction

Call an AWS Lambda function. Return values accessible via `$.External.*` in subsequent blocks.

```json
{
  "Identifier": "uuid-here",
  "Type": "InvokeLambdaFunction",
  "Parameters": {
    "LambdaFunctionARN": "arn:aws:lambda:REGION:ACCOUNT:function:FUNCTION_NAME",
    "InvocationTimeLimitSeconds": "8"
  },
  "Transitions": {
    "NextAction": "next-uuid",
    "Errors": [
      { "NextAction": "error-uuid", "ErrorType": "NoMatchingError" }
    ],
    "Conditions": []
  }
}
```

**Key points:**
- Return values from Lambda are accessed as `$.External.keyName`
- `InvocationTimeLimitSeconds`: max 8 seconds
- Lambda receives contact attributes in the event payload automatically

---

### DisconnectParticipant

End the call. Every flow path MUST terminate with this block or a transfer block.

```json
{
  "Identifier": "uuid-here",
  "Type": "DisconnectParticipant",
  "Parameters": {},
  "Transitions": {}
}
```

---

## Transition Error Types Reference

| ErrorType | Used In | Description |
|-----------|---------|-------------|
| `NoMatchingError` | All blocks | Catch-all error for any unexpected failure |
| `NoMatchingCondition` | Compare, GetParticipantInput, ConnectParticipantWithLexBot, CheckMetricData, DistributeByPercentage | No condition matched the input/value |
| `InputTimeLimitExceeded` | GetParticipantInput | Caller didn't enter input within the time limit |
| `QueueAtCapacity` | TransferContactToQueue | Queue has reached its maximum capacity |
| `InvalidPhoneNumber` | GetParticipantInput (with PhoneNumberValidation) | Entered number failed validation |
| `InvalidCallbackNumber` | UpdateContactCallbackNumber | Callback number is invalid |
| `CallbackNumberNotDialable` | UpdateContactCallbackNumber | Callback number cannot be dialed |

---

## Pattern: Retry Loop Without the Loop Type

Since `Loop` is not a valid action type, implement retry logic using `Compare` + `UpdateContactAttributes`:

```
                                              ┌─ retryCount="0" → SetRetry1 (set to "1") → RetryAction
Auth fails → Compare $.Attributes.retryCount ─┤─ retryCount="1" → SetRetry2 (set to "2") → RetryAction
                                              ├─ retryCount="2" → SetRetry3 (set to "3") → RetryAction
                                              └─ NoMatchingCondition (retryCount="3"+) → FailPath
```

Each `SetRetryN` is an `UpdateContactAttributes` block that sets `retryCount` to the next value, then transitions back to the retry action.

---

## Pattern: Queue Transfer (2-block minimum)

You MUST set the queue before transferring:

```
UpdateContactTargetQueue (QueueId = queue ARN) → TransferContactToQueue
```

Optionally add `UpdateContactEventHooks` before the transfer to set the customer queue experience flow, and `UpdateContactRoutingBehavior` to adjust priority.

---

## Pattern: Callback Flow (3-block minimum)

```
GetParticipantInput (StoreInput=True, phone validation)
  → UpdateContactCallbackNumber ($.StoredCustomerInput)
  → CreateCallbackContact (delay, attempts, retry)
  → DisconnectParticipant
```

---

## Metadata Position Guidelines

- **Entry point**: `{ "x": 39, "y": 40 }`
- **First action**: `{ "x": 250, "y": 200 }`
- **Horizontal spacing**: 250-300px between sequential blocks
- **Vertical spacing**: 150-200px between parallel branches
- **Branch fan-out**: Increment y by 180px for each branch
