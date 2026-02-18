# IVR Test 2 - Language Router with Attribute Branching

**Flow:** Self-Learning Test 2 - Language Router (a785ba68-aeb2-45c2-84d1-6fb2e300569a)
**Instance:** 7d261e94-17bc-4f3e-96f7-f9b7541ce479
**Region:** us-west-2

## Components Tested
- **UpdateContactTextToSpeechVoice** — Set voice to Joanna/Neural
- **UpdateContactAttributes** — Set `language` and `retryCount` attributes
- **Compare** — Branch on `$.Attributes.language` and `$.Attributes.retryCount`
- **MessageParticipant** — Play language-specific confirmation
- **GetParticipantInput** — Collect DTMF (1/2/3)
- **DisconnectParticipant** — End call

## Flow Structure
```
SetVoice → SetAttributes(retryCount=0, language=none) → Welcome Message
→ GetParticipantInput("Press 1 English, 2 Spanish, 3 French")
    ├── DTMF 1 → SetAttribute(language=en) → Compare(language) → "You selected English" → Disconnect
    ├── DTMF 2 → SetAttribute(language=es) → Compare(language) → "You selected Spanish" → Disconnect
    ├── DTMF 3 → SetAttribute(language=fr) → Compare(language) → "You selected French" → Disconnect
    ├── Invalid → SetAttribute(retryCount=1) → Compare(retryCount)
    │     ├── retryCount=1 → "Sorry, not valid" → GetParticipantInput(retry) → same branches
    │     └── retryCount>1 → "Unable to process" → Disconnect
    └── Timeout → "No input received" → Disconnect
```

---

## S1: English Selection (Press 1)

System: "Welcome to the language selection system. Press 1 for English, press 2 for Spanish, or press 3 for French."
Caller: Press 1
System: "You selected English. Your language preference has been saved. Thank you for calling."
System: Call disconnects

**Verifies:** UpdateContactAttributes(language=en) + Compare branches correctly to English path

---

## S2: Spanish Selection (Press 2)

System: "Welcome to the language selection system. Press 1 for English, press 2 for Spanish, or press 3 for French."
Caller: Press 2
System: "You selected Spanish. Your language preference has been saved. Thank you for calling."
System: Call disconnects

**Verifies:** UpdateContactAttributes(language=es) + Compare branches correctly to Spanish path

---

## S3: French Selection (Press 3)

System: "Welcome to the language selection system. Press 1 for English, press 2 for Spanish, or press 3 for French."
Caller: Press 3
System: "You selected French. Your language preference has been saved. Thank you for calling."
System: Call disconnects

**Verifies:** UpdateContactAttributes(language=fr) + Compare branches correctly to French path

---

## S4: Invalid Input Then Valid (Press 9 then Press 1)

System: "Welcome to the language selection system. Press 1 for English, press 2 for Spanish, or press 3 for French."
Caller: Press 9
System: "Sorry, that was not a valid selection. Please try again. Press 1 for English, press 2 for Spanish, or press 3 for French."
Caller: Press 1
System: "You selected English. Your language preference has been saved. Thank you for calling."
System: Call disconnects

**Verifies:** UpdateContactAttributes(retryCount=1) + Compare(retryCount=1) routes to retry + second input works

---

## S5: Timeout (No Input)

System: "Welcome to the language selection system. Press 1 for English, press 2 for Spanish, or press 3 for French."
Caller: (silence)
System: "We did not receive any input. Goodbye."
System: Call disconnects

**Verifies:** InputTimeLimitExceeded error path

---

## Coverage Matrix

| Path | DTMF | Attribute Set | Compare Branch | Error | Timeout |
|------|------|--------------|----------------|-------|---------|
| English | S1 | language=en | en→English msg | — | — |
| Spanish | S2 | language=es | es→Spanish msg | — | — |
| French | S3 | language=fr | fr→French msg | — | — |
| Invalid+Retry | S4 | retryCount=1 | retryCount=1→retry | S4 | — |
| Timeout | — | — | — | — | S5 |

## Component Coverage

| Component | Tested In |
|-----------|-----------|
| UpdateContactTextToSpeechVoice | All scenarios |
| UpdateContactAttributes (language) | S1, S2, S3, S4 |
| UpdateContactAttributes (retryCount) | S4 |
| Compare ($.Attributes.language) | S1, S2, S3, S4 |
| Compare ($.Attributes.retryCount) | S4 |
| GetParticipantInput (first) | All scenarios |
| GetParticipantInput (retry) | S4 |
| MessageParticipant (welcome) | All scenarios |
| MessageParticipant (English) | S1, S4 |
| MessageParticipant (Spanish) | S2 |
| MessageParticipant (French) | S3 |
| MessageParticipant (invalid) | S4 |
| MessageParticipant (timeout) | S5 |
| DisconnectParticipant | All scenarios |
