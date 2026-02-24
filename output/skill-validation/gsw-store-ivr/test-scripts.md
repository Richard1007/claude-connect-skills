# Warriors Store QIC IVR — Test Scripts

**Flow ID:** 4aecbaf7-aa8b-4aef-842d-845a1275d7ba
**Flow Name:** Warriors Store QIC IVR
**Bot:** WarriorsStoreQICBot (B8IGZUUDBP) — LiveAlias (VVYSEMJXIR)
**Intents:** AMAZON.QInConnectIntent, EndConversationIntent, AMAZON.FallbackIntent
**Voice:** Matthew (Generative engine)
**QIC Assistant ARN:** arn:aws:wisdom:us-west-2:988066449281:assistant/6eacb18c-c838-484c-9d6a-c9df4d3d6c4c
**Generated:** 2026-02-24

---

## Flow Architecture

```
Entry → SetVoice (Matthew/Generative)
      → Welcome Message
      → CreateWisdomSession (silent)
      → Ready Message
      → ConnectParticipantWithLexBot (QIC loop — self-referencing)
            ├── AMAZON.QInConnectIntent → QIC AI response → back to loop
            ├── EndConversationIntent → Goodbye Message → Disconnect
            ├── NoMatchingCondition → back to loop
            └── NoMatchingError → Error Message → Disconnect
```

**EndConversationIntent utterances:** goodbye, bye, end, quit, exit, done, that is all, no thanks, I am done, nothing else, hang up

---

## S1: Happy Path — Single Question About Jerseys

**Triggered when:** Caller asks a single product question and then ends the conversation.

Caller: Dials the phone number

Expected: System plays greeting: "Welcome to the Warriors Store! I am your AI shopping assistant. I can help you find jerseys, hats, accessories, and all Golden State Warriors merchandise. How can I help you today?"

Expected: System plays ready message: "I am ready to help! Ask me anything about Warriors gear."

Caller: Says "What jerseys do you have available?"

Expected: Lex bot matches AMAZON.QInConnectIntent. QIC AI responds with information about available Warriors jerseys. Response should mention jersey types, player names, or product categories related to jerseys.

Caller: Says "goodbye"

Expected: Lex bot matches EndConversationIntent. System plays: "Thank you for shopping with the Warriors Store! Go Dubs!"

Expected: Call disconnects.

---

## S2: Happy Path — Single Question About Merchandise

**Triggered when:** Caller asks about general Warriors merchandise and ends the conversation.

Caller: Dials the phone number

Expected: System plays greeting: "Welcome to the Warriors Store! I am your AI shopping assistant. I can help you find jerseys, hats, accessories, and all Golden State Warriors merchandise. How can I help you today?"

Expected: System plays ready message: "I am ready to help! Ask me anything about Warriors gear."

Caller: Says "What kind of Warriors merchandise do you sell?"

Expected: Lex bot matches AMAZON.QInConnectIntent. QIC AI responds with an overview of Warriors merchandise categories. Response should be helpful and related to the Warriors Store product catalog.

Caller: Says "bye"

Expected: Lex bot matches EndConversationIntent. System plays: "Thank you for shopping with the Warriors Store! Go Dubs!"

Expected: Call disconnects.

---

## S3: Happy Path — Multi-Turn Conversation About Jerseys

**Triggered when:** Caller has multiple follow-up questions about jerseys, exercising the QIC multi-turn loop.

Caller: Dials the phone number

Expected: System plays greeting: "Welcome to the Warriors Store! I am your AI shopping assistant. I can help you find jerseys, hats, accessories, and all Golden State Warriors merchandise. How can I help you today?"

Expected: System plays ready message: "I am ready to help! Ask me anything about Warriors gear."

Caller: Says "Do you have Stephen Curry jerseys?"

Expected: Lex bot matches AMAZON.QInConnectIntent. QIC AI responds with information about Stephen Curry jerseys. Response should be relevant to Curry jersey availability.

Caller: Says "What sizes do they come in?"

Expected: QIC loop continues (ConnectParticipantWithLexBot routes back to itself via NoMatchingCondition or AMAZON.QInConnectIntent). QIC AI responds with sizing information for the jerseys discussed. Response should address sizing options.

Caller: Says "How much do they cost?"

Expected: QIC loop continues. QIC AI responds with pricing information for the jerseys discussed. Response should address pricing or direct the caller to where pricing can be found.

Caller: Says "done"

Expected: Lex bot matches EndConversationIntent. System plays: "Thank you for shopping with the Warriors Store! Go Dubs!"

Expected: Call disconnects.

---

## S4: Happy Path — Multi-Turn Conversation About Accessories

**Triggered when:** Caller explores multiple accessory categories across several turns.

Caller: Dials the phone number

Expected: System plays greeting: "Welcome to the Warriors Store! I am your AI shopping assistant. I can help you find jerseys, hats, accessories, and all Golden State Warriors merchandise. How can I help you today?"

Expected: System plays ready message: "I am ready to help! Ask me anything about Warriors gear."

Caller: Says "What accessories do you have?"

Expected: Lex bot matches AMAZON.QInConnectIntent. QIC AI responds with information about Warriors accessories. Response should mention available accessory categories.

Caller: Says "Tell me about the hats"

Expected: QIC loop continues. QIC AI responds with information about Warriors hats. Response should be relevant to hat styles, types, or options.

Caller: Says "Are any of those available right now?"

Expected: QIC loop continues. QIC AI responds with availability information. Response should address stock or availability of the discussed items.

Caller: Says "that is all"

Expected: Lex bot matches EndConversationIntent. System plays: "Thank you for shopping with the Warriors Store! Go Dubs!"

Expected: Call disconnects.

---

## S5: Happy Path — End Conversation with "goodbye"

**Triggered when:** Caller uses the primary exit utterance "goodbye" to end the conversation.

Caller: Dials the phone number

Expected: System plays greeting: "Welcome to the Warriors Store! I am your AI shopping assistant. I can help you find jerseys, hats, accessories, and all Golden State Warriors merchandise. How can I help you today?"

Expected: System plays ready message: "I am ready to help! Ask me anything about Warriors gear."

Caller: Says "Do you have any Warriors hoodies?"

Expected: Lex bot matches AMAZON.QInConnectIntent. QIC AI responds with information about Warriors hoodies.

Caller: Says "goodbye"

Expected: Lex bot matches EndConversationIntent. System plays: "Thank you for shopping with the Warriors Store! Go Dubs!"

Expected: Call disconnects.

---

## S6: Happy Path — End Conversation with Alternate Phrases

**Triggered when:** Caller uses non-primary exit utterances to end the conversation.

Caller: Dials the phone number

Expected: System plays greeting: "Welcome to the Warriors Store! I am your AI shopping assistant. I can help you find jerseys, hats, accessories, and all Golden State Warriors merchandise. How can I help you today?"

Expected: System plays ready message: "I am ready to help! Ask me anything about Warriors gear."

Caller: Says "What Warriors gear is on sale?"

Expected: Lex bot matches AMAZON.QInConnectIntent. QIC AI responds with information about sales or promotions.

Caller: Says "no thanks"

Expected: Lex bot matches EndConversationIntent (matches utterance "no thanks"). System plays: "Thank you for shopping with the Warriors Store! Go Dubs!"

Expected: Call disconnects.

---

## S7: Edge Case — Unrelated Question

**Triggered when:** Caller asks something completely unrelated to Warriors Store merchandise.

Caller: Dials the phone number

Expected: System plays greeting: "Welcome to the Warriors Store! I am your AI shopping assistant. I can help you find jerseys, hats, accessories, and all Golden State Warriors merchandise. How can I help you today?"

Expected: System plays ready message: "I am ready to help! Ask me anything about Warriors gear."

Caller: Says "What is the weather like in San Francisco today?"

Expected: Lex bot matches AMAZON.QInConnectIntent (or AMAZON.FallbackIntent). If routed to QIC, the AI should either redirect the caller to Warriors Store topics or politely indicate it can only help with Warriors merchandise. The conversation loop continues — the caller is NOT disconnected.

Caller: Says "Okay, do you have any basketball shorts?"

Expected: QIC loop continues. QIC AI responds with information about Warriors basketball shorts. Response should be relevant to the product question.

Caller: Says "exit"

Expected: Lex bot matches EndConversationIntent. System plays: "Thank you for shopping with the Warriors Store! Go Dubs!"

Expected: Call disconnects.

---

## S8: Edge Case — Silence / No Input After Ready Message

**Triggered when:** Caller says nothing after the ready message, causing a timeout in the Lex bot.

Caller: Dials the phone number

Expected: System plays greeting: "Welcome to the Warriors Store! I am your AI shopping assistant. I can help you find jerseys, hats, accessories, and all Golden State Warriors merchandise. How can I help you today?"

Expected: System plays ready message: "I am ready to help! Ask me anything about Warriors gear."

Caller: Remains silent (no input)

Expected: Lex bot times out waiting for input. ConnectParticipantWithLexBot may trigger NoMatchingCondition (routing back to itself for retry) or NoMatchingError. If NoMatchingError is triggered, system plays: "We are experiencing technical difficulties. Please try again later. Goodbye." and call disconnects. If the loop retries, the caller gets another chance to speak.

---

## S9: Error Path — Technical Failure at CreateWisdomSession

**Triggered when:** The CreateWisdomSession block fails (e.g., QIC assistant unavailable, permissions error, or service outage).

Caller: Dials the phone number

Expected: System plays greeting: "Welcome to the Warriors Store! I am your AI shopping assistant. I can help you find jerseys, hats, accessories, and all Golden State Warriors merchandise. How can I help you today?"

Expected: CreateWisdomSession encounters an error. System plays: "We are experiencing technical difficulties. Please try again later. Goodbye."

Expected: Call disconnects.

---

## S10: Error Path — Technical Failure at Lex Bot Connection

**Triggered when:** The ConnectParticipantWithLexBot block encounters a NoMatchingError (e.g., Lex bot unreachable, alias invalid, or service error).

Caller: Dials the phone number

Expected: System plays greeting: "Welcome to the Warriors Store! I am your AI shopping assistant. I can help you find jerseys, hats, accessories, and all Golden State Warriors merchandise. How can I help you today?"

Expected: System plays ready message: "I am ready to help! Ask me anything about Warriors gear."

Caller: Says "Tell me about your jerseys"

Expected: ConnectParticipantWithLexBot encounters a NoMatchingError. System plays: "We are experiencing technical difficulties. Please try again later. Goodbye."

Expected: Call disconnects.

---

## S11: Error Path — SetVoice Block Failure

**Triggered when:** The UpdateContactTextToSpeechVoice block fails at flow entry (e.g., unsupported voice engine).

Caller: Dials the phone number

Expected: SetVoice block encounters an error. System plays: "We are experiencing technical difficulties. Please try again later. Goodbye."

Expected: Call disconnects.

