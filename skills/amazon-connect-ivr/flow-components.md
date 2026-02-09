# Amazon Connect Flow Components Reference

## Action Types

These are ALL valid action types for Amazon Connect contact flows (Version 2019-10-30):

### Interaction

| Type | Description | UI Block Name |
|------|-------------|---------------|
| `MessageParticipant` | Play a prompt or send a message | Play prompt |
| `GetParticipantInput` | Get DTMF input (single digit: 0-9, #, *) | Get customer input (DTMF) |
| `ConnectParticipantWithLexBot` | Get voice + DTMF input via Lex V2 bot | Get customer input (Lex) |
| `HoldParticipant` | Place customer or agent on hold | Hold customer/agent |
| `ResumeParticipant` | Resume from hold | Resume customer/agent |

### Flow Control

| Type | Description | UI Block Name |
|------|-------------|---------------|
| `Compare` | Check contact attributes / conditions | Check contact attributes |
| `Loop` | Loop a set number of times | Loop |
| `Wait` | Wait for a specified duration | Wait |
| `EndFlowExecution` | End current flow module | End flow / Return |

### Routing

| Type | Description | UI Block Name |
|------|-------------|---------------|
| `TransferContactToQueue` | Transfer to a queue | Transfer to queue |
| `TransferToFlow` | Transfer to another contact flow | Transfer to flow |
| `TransferParticipantToThirdParty` | Transfer to external number | Transfer to phone number |
| `CreateTask` | Create a task for an agent | Create task |

### Settings

| Type | Description | UI Block Name |
|------|-------------|---------------|
| `UpdateContactAttributes` | Set contact attributes (key-value pairs) | Set contact attributes |
| `UpdateContactTextToSpeechVoice` | Set the TTS voice | Set voice |
| `UpdateContactRecordingBehavior` | Set recording behavior | Set recording and analytics behavior |
| `UpdateContactEventHooks` | Set event hooks (e.g., disconnect flow) | Set disconnect flow |
| `UpdateContactRoutingBehavior` | Set routing priority/age | Change routing priority / age |

### Termination

| Type | Description | UI Block Name |
|------|-------------|---------------|
| `DisconnectParticipant` | Disconnect the contact | Disconnect |

### Integration

| Type | Description | UI Block Name |
|------|-------------|---------------|
| `InvokeExternalResource` | Invoke AWS Lambda function | Invoke AWS Lambda function |
| `ConnectToDataStore` | Access Amazon Connect data | - |

---

## Block JSON Schemas

### MessageParticipant (Play Prompt)

```json
{
  "Identifier": "uuid-here",
  "Type": "MessageParticipant",
  "Parameters": {
    "Text": "Welcome to our clinic. How can we help you today?"
  },
  "Transitions": {
    "NextAction": "next-uuid",
    "Errors": [
      {
        "NextAction": "error-uuid",
        "ErrorType": "NoMatchingError"
      }
    ],
    "Conditions": []
  }
}
```

**Parameters options:**
- `"Text"`: Plain text for TTS (or SSML wrapped in `<speak>` tags)
- `"PromptId"`: ARN of a stored prompt (instead of Text)

---

### GetParticipantInput (DTMF Only)

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
        "Condition": {
          "Operator": "Equals",
          "Operands": ["1"]
        }
      },
      {
        "NextAction": "support-uuid",
        "Condition": {
          "Operator": "Equals",
          "Operands": ["2"]
        }
      }
    ],
    "Errors": [
      {
        "NextAction": "timeout-uuid",
        "ErrorType": "InputTimeLimitExceeded"
      },
      {
        "NextAction": "nomatch-uuid",
        "ErrorType": "NoMatchingCondition"
      },
      {
        "NextAction": "error-uuid",
        "ErrorType": "NoMatchingError"
      }
    ]
  }
}
```

**Metadata for DTMF conditions:**
```json
{
  "conditionMetadata": [
    { "id": "condition-uuid-1", "value": "1" },
    { "id": "condition-uuid-2", "value": "2" }
  ],
  "useDynamic": false
}
```

**Key constraints:**
- `InputTimeLimitSeconds`: 1-180 seconds (string format)
- `StoreInput`: "True" or "False" (string, not boolean)
- Only single characters: 0-9, #, *
- Each condition Operand is a single-character string

---

### ConnectParticipantWithLexBot (Lex V2 Integration)

Use this when you need voice recognition AND/OR DTMF via a Lex bot.

```json
{
  "Identifier": "uuid-here",
  "Type": "ConnectParticipantWithLexBot",
  "Parameters": {
    "Text": "Are you a provider or a patient?",
    "LexV2Bot": {
      "AliasArn": "arn:aws:lex:us-west-2:ACCOUNT:bot-alias/BOTID/ALIASID"
    }
  },
  "Transitions": {
    "NextAction": "error-uuid",
    "Conditions": [
      {
        "NextAction": "provider-uuid",
        "Condition": {
          "Operator": "Equals",
          "Operands": ["ProviderIntent"]
        }
      },
      {
        "NextAction": "patient-uuid",
        "Condition": {
          "Operator": "Equals",
          "Operands": ["PatientIntent"]
        }
      }
    ],
    "Errors": [
      {
        "NextAction": "nomatch-uuid",
        "ErrorType": "NoMatchingCondition"
      },
      {
        "NextAction": "error-uuid",
        "ErrorType": "NoMatchingError"
      }
    ]
  }
}
```

**Metadata for Lex integration:**
```json
{
  "parameters": {
    "LexV2Bot": {
      "AliasArn": {
        "displayName": "AliasName",
        "useLexBotDropdown": true,
        "lexV2BotName": "BotName"
      }
    }
  },
  "useLexBotDropdown": true,
  "lexV2BotName": "BotName",
  "lexV2BotAliasName": "AliasName",
  "conditionMetadata": [
    { "id": "cond-uuid", "value": "ProviderIntent" },
    { "id": "cond-uuid", "value": "PatientIntent" }
  ]
}
```

**Key points:**
- Conditions match on **intent names** returned by Lex (not DTMF digits)
- DTMF-to-intent mapping is handled by the Lex bot itself (via slot DTMF configuration)
- `Text` parameter is the initial prompt spoken to the caller
- Optional: `LexSessionAttributes` for configuring voice, DTMF timeouts, etc.

---

### Compare (Check Contact Attributes)

```json
{
  "Identifier": "uuid-here",
  "Type": "Compare",
  "Parameters": {
    "ComparisonValue": "$.Attributes.callerType"
  },
  "Transitions": {
    "NextAction": "default-uuid",
    "Conditions": [
      {
        "NextAction": "provider-uuid",
        "Condition": {
          "Operator": "Equals",
          "Operands": ["provider"]
        }
      }
    ],
    "Errors": [
      {
        "NextAction": "default-uuid",
        "ErrorType": "NoMatchingCondition"
      }
    ]
  }
}
```

**Operators:** `Equals`, `StartsWith`, `Contains`, `NumberGreaterThan`, `NumberLessThan`, `NumberGreaterOrEqualTo`, `NumberLessOrEqualTo`

---

### UpdateContactAttributes (Set Attributes)

```json
{
  "Identifier": "uuid-here",
  "Type": "UpdateContactAttributes",
  "Parameters": {
    "Attributes": {
      "callerType": "provider",
      "greetingPlayed": "true"
    }
  },
  "Transitions": {
    "NextAction": "next-uuid",
    "Errors": [
      {
        "NextAction": "error-uuid",
        "ErrorType": "NoMatchingError"
      }
    ],
    "Conditions": []
  }
}
```

---

### UpdateContactTextToSpeechVoice (Set Voice)

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
      {
        "NextAction": "error-uuid",
        "ErrorType": "NoMatchingError"
      }
    ]
  }
}
```

**Engine options:** `"Standard"`, `"Neural"`, `"Generative"`
**Voice options (en-US):** `"Joanna"`, `"Matthew"`, `"Ivy"`, `"Kendra"`, `"Kimberly"`, `"Salli"`, `"Joey"`, `"Justin"`, `"Ruth"`, `"Stephen"`, `"Gregory"`, `"Danielle"`

---

### DisconnectParticipant

```json
{
  "Identifier": "uuid-here",
  "Type": "DisconnectParticipant",
  "Parameters": {},
  "Transitions": {}
}
```

---

### TransferContactToQueue

```json
{
  "Identifier": "uuid-here",
  "Type": "TransferContactToQueue",
  "Parameters": {},
  "Transitions": {
    "NextAction": "error-uuid",
    "Errors": [
      {
        "NextAction": "error-uuid",
        "ErrorType": "QueueAtCapacity"
      },
      {
        "NextAction": "error-uuid",
        "ErrorType": "NoMatchingError"
      }
    ],
    "Conditions": []
  }
}
```

---

### TransferToFlow

```json
{
  "Identifier": "uuid-here",
  "Type": "TransferToFlow",
  "Parameters": {
    "ContactFlowId": "arn:aws:connect:REGION:ACCOUNT:instance/INSTANCE/contact-flow/FLOW_ID"
  },
  "Transitions": {
    "NextAction": "error-uuid",
    "Errors": [
      {
        "NextAction": "error-uuid",
        "ErrorType": "NoMatchingError"
      }
    ],
    "Conditions": []
  }
}
```

---

### InvokeExternalResource (Lambda)

```json
{
  "Identifier": "uuid-here",
  "Type": "InvokeExternalResource",
  "Parameters": {
    "FunctionArn": "arn:aws:lambda:REGION:ACCOUNT:function:FUNCTION_NAME",
    "TimeLimit": "8"
  },
  "Transitions": {
    "NextAction": "next-uuid",
    "Errors": [
      {
        "NextAction": "error-uuid",
        "ErrorType": "NoMatchingError"
      }
    ],
    "Conditions": []
  }
}
```

---

### Loop

```json
{
  "Identifier": "uuid-here",
  "Type": "Loop",
  "Parameters": {
    "LoopCount": "3"
  },
  "Transitions": {
    "NextAction": "complete-uuid",
    "Conditions": [
      {
        "NextAction": "loop-body-uuid",
        "Condition": {
          "Operator": "Equals",
          "Operands": ["ContinueLooping"]
        }
      }
    ],
    "Errors": [
      {
        "NextAction": "error-uuid",
        "ErrorType": "NoMatchingError"
      }
    ]
  }
}
```

---

## Transition Error Types

| ErrorType | Used In | Description |
|-----------|---------|-------------|
| `NoMatchingError` | All blocks | Catch-all error |
| `NoMatchingCondition` | Compare, GetParticipantInput | No condition matched |
| `InputTimeLimitExceeded` | GetParticipantInput | Timeout waiting for input |
| `QueueAtCapacity` | TransferContactToQueue | Queue is full |

---

## Metadata Position Guidelines

- **Entry point**: `{ "x": 39, "y": 40 }`
- **First action**: `{ "x": 250, "y": 200 }`
- **Horizontal spacing**: 250-300px between sequential blocks
- **Vertical spacing**: 150-200px between parallel branches
- **Branch fan-out**: Increment y by 180px for each branch

Example layout for a 3-option menu:
```
Entry → Greeting (250,200) → Menu (500,200)
                                ├→ Option1 (800,50)  → Prompt1 (1100,50)  → Disconnect (1400,50)
                                ├→ Option2 (800,250) → Prompt2 (1100,250) → Disconnect (1400,250)
                                ├→ Option3 (800,450) → Prompt3 (1100,450) → Disconnect (1400,450)
                                └→ Error   (800,650) → ErrorMsg (1100,650) → Disconnect (1400,650)
```
