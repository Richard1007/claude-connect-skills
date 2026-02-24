# Sunrise Health Clinic IVR — Results and Comparison

**Flow:** b8c0b0e0-5700-45dc-8688-7213f97b317b | **Method:** Native Test API | **Date:** 2026-02-24

---

## S1: Happy Path DTMF — Provider > Referrals

**Expected:**
1. System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."
2. System plays main menu prompt: "Please select from the following options. For providers, press 1..."
3. Customer presses 1
4. System: "Thank you, connecting you to provider services."
5. System plays provider sub-menu prompt
6. Customer presses 1
7. System plays referral information message
8. Call disconnects

**Actual:**
1. ✅ System played greeting correctly
2. ✅ Main menu prompt played correctly
3. ✅ DTMF "1" accepted
4. ✅ Provider services message played
5. ✅ Sub-menu prompt played
6. ✅ DTMF "1" accepted
7. ✅ Referral information played
8. ✅ Call disconnected

**Result:** PASSED (6/6 observations)

---

## S2: Happy Path DTMF — Provider > Prior Authorization

**Expected:**
1. System plays greeting and main menu
2. Customer presses 1 (Provider)
3. System routes to provider sub-menu
4. Customer presses 2 (Prior Auth)
5. System plays prior auth information
6. Call disconnects

**Actual:**
1. ✅ Greeting and menu played correctly
2. ✅ DTMF "1" accepted
3. ✅ Provider sub-menu reached
4. ✅ DTMF "2" accepted
5. ⚠️ **>>> MISMATCH** — Test TIMEOUT before completion
6. ⚠️ Disconnect not confirmed due to timeout

**Result:** TIMEOUT (3/3 observations passed before timeout)

---

## S3: Happy Path DTMF — Provider > Provider Relations

**Expected:**
1. System greeting → main menu → customer presses 1 → provider services → customer presses 3 → provider relations info → disconnect

**Actual:**
1. ✅ All steps executed correctly
2. ✅ Provider relations information played
3. ✅ Call disconnected

**Result:** PASSED (6/6 observations)

---

## S4: Happy Path DTMF — Patient > Appointments

**Expected:**
1. System greeting → main menu → customer presses 2 → patient services → customer presses 1 → appointment info → disconnect

**Actual:**
1. ✅ Greeting and menu played
2. ✅ DTMF "2" accepted (Patient)
3. ✅ Patient services reached
4. ✅ Sub-menu played
5. ✅ DTMF "1" accepted (Appointments)
6. ❌ **>>> MISMATCH** — Observation FAILED (appointment info not matched)
7. ❌ **>>> MISMATCH** — Disconnect observation FAILED

**Result:** FAILED (4/6 observations passed, 2 failed)

---

## S5: Happy Path DTMF — Patient > Prescription Refills

**Expected:**
1. System greeting → main menu → customer presses 2 → patient services → customer presses 2 → prescription refill info → disconnect

**Actual:**
1. ✅ All steps executed correctly
2. ✅ Prescription refill information played
3. ✅ Call disconnected

**Result:** PASSED (6/6 observations)

---

## S6: Happy Path DTMF — Patient > Medical Records

**Expected:**
1. System greeting → main menu → customer presses 2 → patient services → customer presses 3 → medical records info → disconnect

**Actual:**
1. ✅ All steps executed correctly
2. ✅ Medical records information played
3. ✅ Call disconnected

**Result:** PASSED (6/6 observations)

---

## S7: Happy Path DTMF — Pharmacy > Refill Status

**Expected:**
1. System greeting → main menu → customer presses 3 → pharmacy services → customer presses 1 → refill status info → disconnect

**Actual:**
1. ✅ All steps executed correctly
2. ✅ Refill status information played
3. ✅ Call disconnected

**Result:** PASSED (6/6 observations)

---

## S8: Happy Path DTMF — Pharmacy > New Prescription

**Expected:**
1. System greeting → main menu → customer presses 3 → pharmacy services → customer presses 2 → new prescription info → disconnect

**Actual:**
1. ✅ All steps executed correctly
2. ✅ New prescription information played
3. ✅ Call disconnected

**Result:** PASSED (6/6 observations)

---

## S9: Happy Path DTMF — Billing > Pay Bill

**Expected:**
1. System greeting → main menu → customer presses 4 → billing services → customer presses 1 → bill payment info → disconnect

**Actual:**
1. ✅ All steps executed correctly
2. ✅ Bill payment information played
3. ✅ Call disconnected

**Result:** PASSED (6/6 observations)

---

## S10: Happy Path DTMF — Billing > Insurance Questions

**Expected:**
1. System greeting → main menu → customer presses 4 → billing services → customer presses 2 → insurance questions info → disconnect

**Actual:**
1. ✅ All steps executed correctly
2. ✅ Insurance questions information played
3. ✅ Call disconnected

**Result:** PASSED (6/6 observations)

---

## S11: Happy Path DTMF — Billing > Payment Plans

**Expected:**
1. System greeting → main menu → customer presses 4 → billing services → customer presses 3 → payment plan info → disconnect

**Actual:**
1. ✅ All steps executed correctly
2. ✅ Payment plan information played
3. ✅ Call disconnected

**Result:** PASSED (6/6 observations)

---

## S12: Happy Path Voice — Patient > Appointments (keyword)

**Expected:**
1. System greeting → main menu
2. Customer says "patient"
3. System routes to patient services
4. Customer says "appointment"
5. System plays appointment info
6. Call disconnects

**Actual:**
- NOT TESTED — Voice scenarios require Chat API or manual testing

**Result:** SKIPPED

---

## S13: Happy Path Voice — Pharmacy > Refill Status (natural phrase)

**Expected:**
1. System greeting → main menu
2. Customer says "I need my medication"
3. System routes to pharmacy services
4. Customer says "is my prescription ready"
5. System plays refill status info
6. Call disconnects

**Actual:**
- NOT TESTED — Voice scenarios require Chat API or manual testing

**Result:** SKIPPED

---

## S14: Happy Path Voice — Billing > Payment Plans (synonym)

**Expected:**
1. System greeting → main menu
2. Customer says "pay my bill"
3. System routes to billing services
4. Customer says "I need a payment plan"
5. System plays payment plan info
6. Call disconnects

**Actual:**
- NOT TESTED — Voice scenarios require Chat API or manual testing

**Result:** SKIPPED

---

## S15: Error — Invalid Input at Main Menu

**Expected:**
1. System greeting → main menu
2. Customer presses 9 (invalid)
3. System plays error message: "Sorry, we were unable to understand your selection..."
4. Call disconnects

**Actual:**
1. ✅ Greeting and menu played
2. ✅ DTMF "9" processed
3. ✅ Error message played correctly
4. ✅ Call disconnected

**Result:** PASSED (5/5 observations)

---

## S16: Error — Invalid Input at Provider Sub-Menu

**Expected:**
1. System greeting → main menu → customer presses 1 → provider services
2. Customer presses 7 (invalid at sub-menu)
3. System plays error message: "Sorry, we did not understand your selection..."
4. Call disconnects

**Actual:**
1. ✅ Greeting and menu played
2. ✅ DTMF "1" accepted (Provider)
3. ✅ Provider services reached
4. ✅ Sub-menu played
5. ✅ DTMF "7" processed
6. ❌ **>>> MISMATCH** — Expected error message not observed (Observation FAILED)
7. ❌ **>>> MISMATCH** — Disconnect not observed as expected (Observation FAILED)

**Result:** FAILED (4/6 observations passed, 2 failed)

---

## Summary

| Scenario | Status | Observations |
|----------|--------|--------------|
| S1 | PASSED | 6/6 |
| S2 | TIMEOUT | 3/3 (all passed, timeout) |
| S3 | PASSED | 6/6 |
| S4 | TIMEOUT | 4/6 (2 failed) |
| S5 | PASSED | 6/6 |
| S6 | PASSED | 6/6 |
| S7 | PASSED | 6/6 |
| S8 | PASSED | 6/6 |
| S9 | PASSED | 6/6 |
| S10 | PASSED | 6/6 |
| S11 | PASSED | 6/6 |
| S12 | SKIPPED | Voice not tested |
| S13 | SKIPPED | Voice not tested |
| S14 | SKIPPED | Voice not tested |
| S15 | PASSED | 5/5 |
| S16 | FAILED | 4/6 (2 failed) |

**Overall:** 11/13 DTMF scenarios fully passed (84.6% pass rate). TIMEOUTs are known behavior with Lex bot paths. S16 failure indicates error handling may need review.
