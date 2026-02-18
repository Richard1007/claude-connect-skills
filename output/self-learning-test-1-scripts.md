# IVR Test 1 - Test Scripts

**Phone:** +1 (877) 381-4938  
**Instance:** 7d261e94-17bc-4f3e-96f7-f9b7541ce479  
**Region:** us-west-2  
**Queue:** BasicQueue (337d3528-bb6c-40e3-8e1d-fbe98ab400a1)
**Components tested:** UpdateContactTextToSpeechVoice, MessageParticipant, GetParticipantInput, DisconnectParticipant

---

## S1: Sales Selection (Happy Path)
**Test when:** Anytime

System: "Welcome to the self-learning test system."  
System: "Press 1 for sales, press 2 for support, or press 3 to hear this menu again."  
Caller: Press 1  
System: "You selected sales. Thank you for calling."  
System: Call disconnects

---

## S2: Support Selection (Happy Path)
**Test when:** Anytime

System: "Welcome to the self-learning test system."  
System: "Press 1 for sales, press 2 for support, or press 3 to hear this menu again."  
Caller: Press 2  
System: "You selected support. Thank you for calling."  
System: Call disconnects

---

## S3: Repeat Menu Then Sales
**Test when:** Anytime

System: "Welcome to the self-learning test system."  
System: "Press 1 for sales, press 2 for support, or press 3 to hear this menu again."  
Caller: Press 3  
System: "Press 1 for sales, press 2 for support, or press 3 to hear this menu again."  
Caller: Press 1  
System: "You selected sales. Thank you for calling."  
System: Call disconnects

---

## S4: Invalid Input
**Test when:** Anytime

System: "Welcome to the self-learning test system."  
System: "Press 1 for sales, press 2 for support, or press 3 to hear this menu again."  
Caller: Press 9  
System: "Sorry, that's not a valid option."  
System: "Press 1 for sales, press 2 for support, or press 3 to hear this menu again."  
Caller: Press 2  
System: "You selected support. Thank you for calling."  
System: Call disconnects

---

## S5: Timeout (No Input)
**Test when:** Anytime

System: "Welcome to the self-learning test system."  
System: "Press 1 for sales, press 2 for support, or press 3 to hear this menu again."  
Caller: (silence for 5+ seconds)  
System: "We didn't receive any input."  
System: Call disconnects

---

## Coverage Matrix

| Path | DTMF | Error | Timeout | Repeat Menu |
|------|------|-------|---------|-------------|
| Sales | S1 | — | — | S3 |
| Support | S2 | — | — | — |
| Invalid Input | — | S4 | — | — |
| Timeout | — | — | S5 | — |
| Menu Repeat | — | — | — | S3 |

---

## Component Coverage

| Component | Tested In |
|-----------|-----------|
| UpdateContactTextToSpeechVoice | All scenarios (voice set to Joanna/Neural) |
| MessageParticipant (greeting) | All scenarios |
| MessageParticipant (menu) | All scenarios |
| GetParticipantInput | S1, S2, S3, S4, S5 |
| MessageParticipant (sales) | S1, S3 |
| MessageParticipant (support) | S2, S4 |
| MessageParticipant (invalid) | S4 |
| MessageParticipant (timeout) | S5 |
| DisconnectParticipant | All scenarios |
