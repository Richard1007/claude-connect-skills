# Nova Sonic Showcase IVR - Test Scripts

**Phone:** (not assigned - showcase demo)
**Hours:** 24/7 (no hours-of-operation check in flow)
**Voice:** Matthew (Generative engine - Nova Sonic S2S)
**Bot:** Nova Sonic S2S Bot (placeholder ARN: `arn:aws:lex:us-west-2:ACCOUNT_ID:bot-alias/NOVA_SONIC_BOT_ID/NOVA_SONIC_ALIAS_ID`)
**Intents:** AppointmentIntent, BillingIntent, PharmacyIntent, SpeakToAgentIntent
**Retry logic:** 2 retries on fallback, then max-retries disconnect

---

## S1: Appointment - Happy Path (Voice)
**Test when:** Anytime

System: "Welcome to our Nova Sonic powered assistant. I can understand natural speech and respond conversationally. Let's get started."
System: "How can I help you today? You can schedule an appointment, ask about billing, check on a pharmacy order, or ask to speak with an agent."
Caller: Say "I'd like to schedule an appointment"
System: "Great, I can help you with scheduling. Our next available appointment is tomorrow at 10 AM. In a full implementation, I would connect you to our scheduling system to find the best time for you. Thank you for trying the Nova Sonic appointment experience. Goodbye."
System: Call disconnects

---

## S2: Billing - Happy Path (Voice)
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Say "I have a question about my bill"
System: "I'd be happy to help with your billing inquiry. In a production system, I would look up your account and provide balance details, payment history, or help you make a payment. Thank you for trying the Nova Sonic billing experience. Goodbye."
System: Call disconnects

---

## S3: Pharmacy - Happy Path (Voice)
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Say "check on my pharmacy order"
System: "Let me check on your pharmacy order. In a full deployment, I would look up your prescription status, refill requests, or connect you with our pharmacy team. Thank you for trying the Nova Sonic pharmacy experience. Goodbye."
System: Call disconnects

---

## S4: Speak to Agent - Happy Path (Voice)
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Say "I want to speak with a real person"
System: "Of course, let me connect you with a live agent. In a production system, this would transfer you to the next available representative. Thank you for trying the Nova Sonic agent transfer experience. Goodbye."
System: Call disconnects

---

## S5: Appointment - Happy Path (DTMF)
**Test when:** Anytime

System: "Welcome to our Nova Sonic powered assistant. I can understand natural speech and respond conversationally. Let's get started."
System: "How can I help you today? You can schedule an appointment, ask about billing, check on a pharmacy order, or ask to speak with an agent."
Caller: Press 1
System: "Great, I can help you with scheduling. Our next available appointment is tomorrow at 10 AM. In a full implementation, I would connect you to our scheduling system to find the best time for you. Thank you for trying the Nova Sonic appointment experience. Goodbye."
System: Call disconnects

---

## S6: Billing - Happy Path (DTMF)
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Press 2
System: "I'd be happy to help with your billing inquiry. In a production system, I would look up your account and provide balance details, payment history, or help you make a payment. Thank you for trying the Nova Sonic billing experience. Goodbye."
System: Call disconnects

---

## S7: Pharmacy - Happy Path (DTMF)
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Press 3
System: "Let me check on your pharmacy order. In a full deployment, I would look up your prescription status, refill requests, or connect you with our pharmacy team. Thank you for trying the Nova Sonic pharmacy experience. Goodbye."
System: Call disconnects

---

## S8: Speak to Agent - Happy Path (DTMF)
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Press 4
System: "Of course, let me connect you with a live agent. In a production system, this would transfer you to the next available representative. Thank you for trying the Nova Sonic agent transfer experience. Goodbye."
System: Call disconnects

---

## S9: First Fallback Then Success (Voice)
**Test when:** Anytime

System: "Welcome to our Nova Sonic powered assistant. I can understand natural speech and respond conversationally. Let's get started."
System: "How can I help you today? You can schedule an appointment, ask about billing, check on a pharmacy order, or ask to speak with an agent."
Caller: Say "blue elephant sandwich"
System: "I'm sorry, I didn't quite catch that. You can say things like schedule an appointment, check my bill, pharmacy order status, or speak to an agent. Please try again."
System: "How can I help you today? You can schedule an appointment, ask about billing, check on a pharmacy order, or ask to speak with an agent."
Caller: Say "schedule an appointment please"
System: "Great, I can help you with scheduling. Our next available appointment is tomorrow at 10 AM. In a full implementation, I would connect you to our scheduling system to find the best time for you. Thank you for trying the Nova Sonic appointment experience. Goodbye."
System: Call disconnects

---

## S10: Two Fallbacks Then Success (Voice)
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Say "something completely random"
System: Retry prompt + Nova Sonic bot re-prompt
Caller: Say "I don't know what to do"
System: "I'm sorry, I didn't quite catch that. You can say things like schedule an appointment, check my bill, pharmacy order status, or speak to an agent. Please try again."
System: "How can I help you today? You can schedule an appointment, ask about billing, check on a pharmacy order, or ask to speak with an agent."
Caller: Say "check my bill"
System: "I'd be happy to help with your billing inquiry. In a production system, I would look up your account and provide balance details, payment history, or help you make a payment. Thank you for trying the Nova Sonic billing experience. Goodbye."
System: Call disconnects

---

## S11: Max Retries Exhausted (Voice)
**Test when:** Anytime

System: "Welcome to our Nova Sonic powered assistant. I can understand natural speech and respond conversationally. Let's get started."
System: "How can I help you today? You can schedule an appointment, ask about billing, check on a pharmacy order, or ask to speak with an agent."
Caller: Say "purple dinosaur"
System: "I'm sorry, I didn't quite catch that. You can say things like schedule an appointment, check my bill, pharmacy order status, or speak to an agent. Please try again."
System: "How can I help you today? You can schedule an appointment, ask about billing, check on a pharmacy order, or ask to speak with an agent."
Caller: Say "flying carpet"
System: "I'm sorry, I didn't quite catch that. You can say things like schedule an appointment, check my bill, pharmacy order status, or speak to an agent. Please try again."
System: "How can I help you today? You can schedule an appointment, ask about billing, check on a pharmacy order, or ask to speak with an agent."
Caller: Say "rubber ducky"
System: "I'm sorry, I wasn't able to understand your request after multiple attempts. Please call back or visit our website for assistance. Goodbye."
System: Call disconnects

---

## S12: Max Retries Exhausted (DTMF Invalid)
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Press 9
System: Retry prompt + Nova Sonic bot re-prompt
Caller: Press 7
System: Retry prompt + Nova Sonic bot re-prompt
Caller: Press 0
System: "I'm sorry, I wasn't able to understand your request after multiple attempts. Please call back or visit our website for assistance. Goodbye."
System: Call disconnects

---

## S13: Technical Error - NoMatchingError
**Test when:** Anytime (requires bot/system failure)

System: "Welcome to our Nova Sonic powered assistant. I can understand natural speech and respond conversationally. Let's get started."
System: "How can I help you today? You can schedule an appointment, ask about billing, check on a pharmacy order, or ask to speak with an agent."
Caller: (Bot encounters a system error - e.g., Lex/Bedrock unavailable)
System: "We're experiencing a technical issue with our voice assistant. Please try your call again later. We apologize for the inconvenience. Goodbye."
System: Call disconnects

---

## S14: Hesitant Speech - Appointment (Voice)
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Say "um... I think I need to... make an appointment?"
System: "Great, I can help you with scheduling. Our next available appointment is tomorrow at 10 AM. In a full implementation, I would connect you to our scheduling system to find the best time for you. Thank you for trying the Nova Sonic appointment experience. Goodbye."
System: Call disconnects

---

## S15: Verbose Natural Language - Billing (Voice)
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Say "I received a statement in the mail and I'm not sure about one of the charges, can someone help me understand my bill?"
System: "I'd be happy to help with your billing inquiry. In a production system, I would look up your account and provide balance details, payment history, or help you make a payment. Thank you for trying the Nova Sonic billing experience. Goodbye."
System: Call disconnects

---

## S16: Mixed Input - Voice Fail Then DTMF Success
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Say "blah blah blah"
System: "I'm sorry, I didn't quite catch that. You can say things like schedule an appointment, check my bill, pharmacy order status, or speak to an agent. Please try again."
System: "How can I help you today? You can schedule an appointment, ask about billing, check on a pharmacy order, or ask to speak with an agent."
Caller: Press 3
System: "Let me check on your pharmacy order. In a full deployment, I would look up your prescription status, refill requests, or connect you with our pharmacy team. Thank you for trying the Nova Sonic pharmacy experience. Goodbye."
System: Call disconnects

---

## S17: Mixed Input - DTMF Fail Then Voice Success
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Press 8
System: Retry prompt + Nova Sonic bot re-prompt
Caller: Say "I'd like to speak with an agent"
System: "Of course, let me connect you with a live agent. In a production system, this would transfer you to the next available representative. Thank you for trying the Nova Sonic agent transfer experience. Goodbye."
System: Call disconnects

---

## S18: Special Key - Pound (#)
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Press #
System: Retry prompt + Nova Sonic bot re-prompt
Caller: Say "pharmacy"
System: "Let me check on your pharmacy order. In a full deployment, I would look up your prescription status, refill requests, or connect you with our pharmacy team. Thank you for trying the Nova Sonic pharmacy experience. Goodbye."
System: Call disconnects

---

## S19: Special Key - Star (*)
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Press *
System: Retry prompt + Nova Sonic bot re-prompt
Caller: Press 1
System: "Great, I can help you with scheduling. Our next available appointment is tomorrow at 10 AM. In a full implementation, I would connect you to our scheduling system to find the best time for you. Thank you for trying the Nova Sonic appointment experience. Goodbye."
System: Call disconnects

---

## S20: Silence / Timeout at Bot Prompt
**Test when:** Anytime

System: "Welcome to our Nova Sonic powered assistant. I can understand natural speech and respond conversationally. Let's get started."
System: "How can I help you today? You can schedule an appointment, ask about billing, check on a pharmacy order, or ask to speak with an agent."
Caller: Silent for 10+ seconds
System: "I'm sorry, I didn't quite catch that. You can say things like schedule an appointment, check my bill, pharmacy order status, or speak to an agent. Please try again."
System: "How can I help you today? You can schedule an appointment, ask about billing, check on a pharmacy order, or ask to speak with an agent."
Caller: Say "billing"
System: "I'd be happy to help with your billing inquiry. In a production system, I would look up your account and provide balance details, payment history, or help you make a payment. Thank you for trying the Nova Sonic billing experience. Goodbye."
System: Call disconnects

---

## S21: Silence at All Three Attempts
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Silent for 10+ seconds
System: Retry prompt + Nova Sonic bot re-prompt
Caller: Silent for 10+ seconds
System: Retry prompt + Nova Sonic bot re-prompt
Caller: Silent for 10+ seconds
System: "I'm sorry, I wasn't able to understand your request after multiple attempts. Please call back or visit our website for assistance. Goodbye."
System: Call disconnects

---

## S22: Out-of-Domain Phrase - "Help"
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Say "help"
System: Retry prompt + Nova Sonic bot re-prompt
Caller: Say "speak to an agent"
System: "Of course, let me connect you with a live agent. In a production system, this would transfer you to the next available representative. Thank you for trying the Nova Sonic agent transfer experience. Goodbye."
System: Call disconnects

---

## S23: Out-of-Domain Phrase - "Repeat"
**Test when:** Anytime

System: Welcome greeting + Nova Sonic bot prompt
Caller: Say "can you repeat that?"
System: Retry prompt + Nova Sonic bot re-prompt
Caller: Say "appointment"
System: "Great, I can help you with scheduling. Our next available appointment is tomorrow at 10 AM. In a full implementation, I would connect you to our scheduling system to find the best time for you. Thank you for trying the Nova Sonic appointment experience. Goodbye."
System: Call disconnects

---

## Coverage Matrix

| Path | Voice | DTMF | Error (Voice) | Error (DTMF) | Timeout | Edge Case |
|------|-------|------|---------------|--------------|---------|-----------|
| Appointment | S1 | S5 | S9 (retry→appt) | S19 (*→appt) | S23 (repeat→appt) | S14 (hesitant) |
| Billing | S2 | S6 | S10 (2x retry→billing) | — | S20 (silence→billing) | S15 (verbose) |
| Pharmacy | S3 | S7 | S16 (voice fail→DTMF) | S18 (#→pharmacy) | — | — |
| Speak to Agent | S4 | S8 | S17 (DTMF fail→voice) | — | — | S22 (help→agent) |
| Max Retries | S11 | S12 | — | — | S21 (3x silence) | — |
| Technical Error | S13 | — | — | — | — | — |

**Total scenarios:** 23
**Unique paths covered:** 10 (4 happy + 3 retry variants + max retries + technical error + silence exhaustion)
**Input methods:** Voice, DTMF, Mixed, Silence
**Edge cases:** Hesitant speech, verbose input, special keys (#, *), out-of-domain ("help", "repeat")
