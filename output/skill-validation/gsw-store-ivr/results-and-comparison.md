# Warriors Store QIC IVR — Results and Comparison

**Flow:** 4aecbaf7-aa8b-4aef-842d-845a1275d7ba | **Method:** Chat API + WebSocket | **Date:** 2026-02-24

---

## S1: Happy Path — Single Question About Jerseys

**Expected:**
1. System plays greeting: "Welcome to the Warriors Store! I am your AI shopping assistant..."
2. System plays ready message: "I am ready to help! Ask me anything about Warriors gear."
3. Customer asks "What jerseys do you have available?"
4. QIC AI responds with jersey information
5. Customer says "goodbye"
6. System plays: "Thank you for shopping with the Warriors Store! Go Dubs!"
7. Call disconnects

**Actual:**
1. ✅ Greeting played correctly
2. ✅ Ready message played
3. ✅ Customer message sent
4. ✅ QIC AI responded with jersey information (mentioned Stephen Curry, Klay Thompson jerseys)
5. ✅ "goodbye" sent
6. ✅ EndConversationIntent triggered correctly
7. ✅ Call disconnected

**Result:** PASSED

---

## S2: Happy Path — Single Question About Merchandise

**Expected:**
1. System greeting → ready message
2. Customer asks "What kind of Warriors merchandise do you sell?"
3. QIC AI responds with merchandise overview
4. Customer says "bye"
5. System plays goodbye message
6. Call disconnects

**Actual:**
- NOT TESTED

**Result:** NOT TESTED

---

## S3: Happy Path — Multi-Turn Conversation About Jerseys

**Expected:**
1. System greeting → ready message
2. Customer: "Do you have Stephen Curry jerseys?"
3. QIC AI responds with Curry jersey info
4. Customer: "What sizes do they come in?"
5. QIC AI responds with sizing info
6. Customer: "How much do they cost?"
7. QIC AI responds with pricing
8. Customer: "done"
9. System plays goodbye
10. Call disconnects

**Actual:**
1. ✅ Greeting and ready message played
2. ✅ First question sent
3. ✅ QIC AI responded with Curry jersey information
4. ✅ Follow-up question about sizing sent
5. ✅ QIC AI responded with size options (S, M, L, XL, XXL)
6. ✅ Pricing question sent
7. ✅ QIC AI provided pricing information
8. ✅ "done" sent
9. ✅ Goodbye message played
10. ✅ Call disconnected

**Result:** PASSED — Multi-turn QIC loop maintained context correctly

---

## S4: Happy Path — Multi-Turn Conversation About Accessories

**Expected:**
1. System greeting → ready message
2. Customer explores accessories via multiple questions
3. QIC AI maintains conversation context
4. Customer ends with "that is all"
5. System plays goodbye
6. Call disconnects

**Actual:**
- NOT TESTED

**Result:** NOT TESTED

---

## S5: Happy Path — End Conversation with "goodbye"

**Expected:**
1. System greeting → ready message
2. Customer asks about Warriors hoodies
3. QIC AI responds
4. Customer says "goodbye"
5. System plays goodbye message
6. Call disconnects

**Actual:**
- NOT TESTED

**Result:** NOT TESTED

---

## S6: Happy Path — End Conversation with Alternate Phrases

**Expected:**
1. System greeting → ready message
2. Customer asks about sales
3. QIC AI responds
4. Customer says "no thanks"
5. System plays goodbye (EndConversationIntent matched)
6. Call disconnects

**Actual:**
- NOT TESTED

**Result:** NOT TESTED

---

## S7: Edge Case — Unrelated Question

**Expected:**
1. System greeting → ready message
2. Customer asks off-topic question (weather in SF)
3. QIC AI redirects to Warriors topics or indicates limited scope
4. Customer asks follow-up about basketball shorts
5. QIC AI responds with relevant info
6. Customer says "exit"
7. System plays goodbye
8. Call disconnects

**Actual:**
1. ✅ Greeting and ready message played
2. ✅ Off-topic question sent
3. ✅ QIC AI correctly redirected: "I'm sorry, I can only help with Warriors merchandise questions..."
4. ✅ Basketball shorts question sent
5. ✅ QIC AI provided shorts information
6. ✅ "exit" sent
7. ✅ Goodbye message played
8. ✅ Call disconnected

**Result:** PASSED — QIC correctly handled off-topic question and redirected

---

## S8: Edge Case — Silence / No Input After Ready Message

**Expected:**
1. System greeting → ready message
2. Customer remains silent
3. Lex timeout or error path triggered

**Actual:**
- NOT TESTED

**Result:** NOT TESTED

---

## S9: Error Path — Technical Failure at CreateWisdomSession

**Expected:**
1. System greeting
2. CreateWisdomSession fails
3. System plays: "We are experiencing technical difficulties..."
4. Call disconnects

**Actual:**
- NOT TESTED

**Result:** NOT TESTED

---

## S10: Error Path — Technical Failure at Lex Bot Connection

**Expected:**
1. System greeting → ready message
2. Customer sends message
3. ConnectParticipantWithLexBot error
4. System plays error message
5. Call disconnects

**Actual:**
- NOT TESTED

**Result:** NOT TESTED

---

## S11: Error Path — SetVoice Block Failure

**Expected:**
1. SetVoice block fails at entry
2. System plays error message
3. Call disconnects

**Actual:**
- NOT TESTED

**Result:** NOT TESTED

---

## Summary

| Scenario | Status | Notes |
|----------|--------|-------|
| S1 | PASSED | Single question flow works correctly |
| S2 | NOT TESTED | — |
| S3 | PASSED | Multi-turn conversation with context maintained |
| S4 | NOT TESTED | — |
| S5 | NOT TESTED | — |
| S6 | NOT TESTED | — |
| S7 | PASSED | Off-topic handling works correctly |
| S8 | NOT TESTED | — |
| S9 | NOT TESTED | — |
| S10 | NOT TESTED | — |
| S11 | NOT TESTED | — |

**Overall:** 3/11 scenarios tested (27% coverage). All tested scenarios PASSED. QIC integration working correctly for normal conversation flows.

**Test Method:** Chat API (StartChatContact, SendMessage, GetTranscript) + WebSocket capture for real-time message monitoring.

**QIC Assistant ARN:** arn:aws:wisdom:us-west-2:988066449281:assistant/6eacb18c-c838-484c-9d6a-c9df4d3d6c4c
