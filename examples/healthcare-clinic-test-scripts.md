# Sunrise Health Clinic IVR - Test Scenarios

## Overview

These test scripts cover end-to-end scenarios for the Sunrise Health Clinic IVR deployed on Amazon Connect. The IVR has two menu levels:

- **Level 1 (Main Menu):** Provider vs Patient identification — voice + DTMF via Lex bot
- **Level 2a (Provider Menu):** Referrals, Prior Authorization, Claims/Billing — voice + DTMF via Lex bot
- **Level 2b (Patient Menu):** Appointments, Prescriptions, Test Results — voice + DTMF via Lex bot

All menus support both spoken input and keypad (DTMF) input.

## Test Configuration

- **Phone Number:** +1 (800) 555-0100
- **Flow Name:** Healthcare Clinic IVR
- **Flow ID:** `FLOW_ID`
- **TTS Voice:** Joanna (Neural)
- **Main Menu Bot:** HealthClinicIVRBot — ProviderIntent (1), PatientIntent (2)
- **Provider Menu Bot:** HealthClinicProviderMenuBot — ReferralIntent (1), PriorAuthIntent (2), ClaimsBillingIntent (3)
- **Patient Menu Bot:** HealthClinicPatientMenuBot — AppointmentIntent (1), PrescriptionIntent (2), TestResultsIntent (3)

---

## Scenario 1: Happy Path — Provider → Referral (DTMF)

**Purpose:** Test the complete happy path for a provider navigating to referral information using only keypad input

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Presses 1 on keypad

Expected: Lex bot matches ProviderIntent via DTMF digit "1". System plays: "Thank you, provider."

Expected: System plays provider menu prompt: "How can we help you today? Say referral or press 1 for referrals. Say prior auth or press 2 for prior authorizations. Say claims or press 3 for claims and billing."

Caller: Presses 1 on keypad

Expected: Lex bot matches ReferralIntent via DTMF digit "1". System plays: "You selected referrals. To submit a referral, please fax your referral form to 5 5 5, 1 2 3, 4 5 6 7, or visit our provider portal at sunrise health clinic dot com slash providers. A member of our referral team will process your request within 2 business days. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 2: Happy Path — Provider → Prior Authorization (DTMF)

**Purpose:** Test provider navigating to prior authorization information using keypad

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Presses 1 on keypad

Expected: System plays: "Thank you, provider."

Expected: System plays provider menu prompt: "How can we help you today? Say referral or press 1 for referrals. Say prior auth or press 2 for prior authorizations. Say claims or press 3 for claims and billing."

Caller: Presses 2 on keypad

Expected: Lex bot matches PriorAuthIntent. System plays: "You selected prior authorizations. To submit or check the status of a prior authorization, please visit our provider portal at sunrise health clinic dot com slash prior auth, or call our prior authorization department directly at 5 5 5, 9 8 7, 6 5 4 3. Our team is available Monday through Friday, 8 AM to 5 PM. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 3: Happy Path — Provider → Claims/Billing (DTMF)

**Purpose:** Test provider navigating to claims and billing using keypad

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Presses 1 on keypad

Expected: System plays: "Thank you, provider."

Expected: System plays provider menu prompt: "How can we help you today? Say referral or press 1 for referrals. Say prior auth or press 2 for prior authorizations. Say claims or press 3 for claims and billing."

Caller: Presses 3 on keypad

Expected: Lex bot matches ClaimsBillingIntent. System plays: "You selected claims and billing. For claims status inquiries or billing questions, please visit our provider portal at sunrise health clinic dot com slash claims. You may also email our billing department at billing at sunrise health clinic dot com. Our billing team will respond within 1 business day. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 4: Happy Path — Patient → Appointment (DTMF)

**Purpose:** Test patient navigating to appointment scheduling using keypad

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Presses 2 on keypad

Expected: Lex bot matches PatientIntent. System plays: "Thank you, patient."

Expected: System plays patient menu prompt: "How can we help you today? Say appointment or press 1 to schedule an appointment. Say prescription or press 2 for prescription refills. Say test results or press 3 for lab and test results."

Caller: Presses 1 on keypad

Expected: Lex bot matches AppointmentIntent. System plays: "You selected appointments. To schedule, reschedule, or cancel an appointment, please visit our patient portal at sunrise health clinic dot com slash appointments, or you may call our scheduling desk directly at 5 5 5, 2 3 4, 5 6 7 8 during business hours, Monday through Friday, 8 AM to 6 PM. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 5: Happy Path — Patient → Prescription (DTMF)

**Purpose:** Test patient navigating to prescription refills using keypad

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Presses 2 on keypad

Expected: System plays: "Thank you, patient."

Expected: System plays patient menu prompt: "How can we help you today? Say appointment or press 1 to schedule an appointment. Say prescription or press 2 for prescription refills. Say test results or press 3 for lab and test results."

Caller: Presses 2 on keypad

Expected: Lex bot matches PrescriptionIntent. System plays: "You selected prescription refills. To request a prescription refill, please log into your patient portal at sunrise health clinic dot com slash prescriptions, or contact your pharmacy directly. Please allow 48 hours for refill requests to be processed. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 6: Happy Path — Patient → Test Results (DTMF)

**Purpose:** Test patient navigating to test results using keypad

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Presses 2 on keypad

Expected: System plays: "Thank you, patient."

Expected: System plays patient menu prompt: "How can we help you today? Say appointment or press 1 to schedule an appointment. Say prescription or press 2 for prescription refills. Say test results or press 3 for lab and test results."

Caller: Presses 3 on keypad

Expected: Lex bot matches TestResultsIntent. System plays: "You selected test results. Your lab and test results are available through our patient portal at sunrise health clinic dot com slash results. Results are typically available within 3 to 5 business days. If you have urgent questions about your results, please contact your providers office directly. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 7: Happy Path — Provider → Referral (Voice, Primary Keyword)

**Purpose:** Test provider using simple spoken keyword "provider" then "referral"

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Says "provider"

Expected: Lex bot matches ProviderIntent (confidence ~1.0). System plays: "Thank you, provider."

Expected: System plays provider menu prompt: "How can we help you today? Say referral or press 1 for referrals. Say prior auth or press 2 for prior authorizations. Say claims or press 3 for claims and billing."

Caller: Says "referral"

Expected: Lex bot matches ReferralIntent. System plays: "You selected referrals. To submit a referral, please fax your referral form to 5 5 5, 1 2 3, 4 5 6 7, or visit our provider portal at sunrise health clinic dot com slash providers. A member of our referral team will process your request within 2 business days. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 8: Happy Path — Provider → Prior Auth (Voice, Full Phrase)

**Purpose:** Test provider using a full natural sentence instead of a single keyword

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Says "I'm calling as a provider"

Expected: Lex bot matches ProviderIntent. System plays: "Thank you, provider."

Expected: System plays provider menu prompt: "How can we help you today? Say referral or press 1 for referrals. Say prior auth or press 2 for prior authorizations. Say claims or press 3 for claims and billing."

Caller: Says "I need a prior authorization"

Expected: Lex bot matches PriorAuthIntent. System plays: "You selected prior authorizations. To submit or check the status of a prior authorization, please visit our provider portal at sunrise health clinic dot com slash prior auth, or call our prior authorization department directly at 5 5 5, 9 8 7, 6 5 4 3. Our team is available Monday through Friday, 8 AM to 5 PM. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 9: Happy Path — Provider → Claims (Voice, Synonym)

**Purpose:** Test that saying "doctor" (synonym for provider) and "billing question" (synonym for claims) correctly routes the call

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Says "doctor"

Expected: Lex bot matches ProviderIntent via synonym utterance. System plays: "Thank you, provider."

Expected: System plays provider menu prompt: "How can we help you today? Say referral or press 1 for referrals. Say prior auth or press 2 for prior authorizations. Say claims or press 3 for claims and billing."

Caller: Says "I have a claims question"

Expected: Lex bot matches ClaimsBillingIntent. System plays: "You selected claims and billing. For claims status inquiries or billing questions, please visit our provider portal at sunrise health clinic dot com slash claims. You may also email our billing department at billing at sunrise health clinic dot com. Our billing team will respond within 1 business day. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 10: Happy Path — Patient → Appointment (Voice, Full Phrase)

**Purpose:** Test patient using natural conversational speech for both menu levels

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Says "I'm a patient"

Expected: Lex bot matches PatientIntent. System plays: "Thank you, patient."

Expected: System plays patient menu prompt: "How can we help you today? Say appointment or press 1 to schedule an appointment. Say prescription or press 2 for prescription refills. Say test results or press 3 for lab and test results."

Caller: Says "I need to see a doctor"

Expected: Lex bot matches AppointmentIntent via synonym utterance. System plays: "You selected appointments. To schedule, reschedule, or cancel an appointment, please visit our patient portal at sunrise health clinic dot com slash appointments, or you may call our scheduling desk directly at 5 5 5, 2 3 4, 5 6 7 8 during business hours, Monday through Friday, 8 AM to 6 PM. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 11: Happy Path — Patient → Prescription (Voice, Synonym)

**Purpose:** Test that saying "member" (synonym for patient) and "I need my medication" (synonym for prescription) routes correctly

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Says "I'm a member"

Expected: Lex bot matches PatientIntent via "member" utterance. System plays: "Thank you, patient."

Expected: System plays patient menu prompt: "How can we help you today? Say appointment or press 1 to schedule an appointment. Say prescription or press 2 for prescription refills. Say test results or press 3 for lab and test results."

Caller: Says "I need my medication"

Expected: Lex bot matches PrescriptionIntent. System plays: "You selected prescription refills. To request a prescription refill, please log into your patient portal at sunrise health clinic dot com slash prescriptions, or contact your pharmacy directly. Please allow 48 hours for refill requests to be processed. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 12: Happy Path — Patient → Test Results (Voice, Primary Keyword)

**Purpose:** Test patient using simple keywords "patient" and "test results"

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Says "patient"

Expected: Lex bot matches PatientIntent. System plays: "Thank you, patient."

Expected: System plays patient menu prompt: "How can we help you today? Say appointment or press 1 to schedule an appointment. Say prescription or press 2 for prescription refills. Say test results or press 3 for lab and test results."

Caller: Says "test results"

Expected: Lex bot matches TestResultsIntent. System plays: "You selected test results. Your lab and test results are available through our patient portal at sunrise health clinic dot com slash results. Results are typically available within 3 to 5 business days. If you have urgent questions about your results, please contact your providers office directly. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 13: Happy Path — Mixed Input (DTMF Level 1, Voice Level 2)

**Purpose:** Test that a caller can press a digit at the main menu and then switch to voice at the sub-menu

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Presses 1 on keypad

Expected: System plays: "Thank you, provider."

Expected: System plays provider menu prompt: "How can we help you today? Say referral or press 1 for referrals. Say prior auth or press 2 for prior authorizations. Say claims or press 3 for claims and billing."

Caller: Says "submit a referral"

Expected: Lex bot matches ReferralIntent. System plays: "You selected referrals. To submit a referral, please fax your referral form to 5 5 5, 1 2 3, 4 5 6 7, or visit our provider portal at sunrise health clinic dot com slash providers. A member of our referral team will process your request within 2 business days. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 14: Happy Path — Mixed Input (Voice Level 1, DTMF Level 2)

**Purpose:** Test that a caller can speak at the main menu and then switch to keypad at the sub-menu

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Says "I'm a client"

Expected: Lex bot matches PatientIntent via "client" synonym. System plays: "Thank you, patient."

Expected: System plays patient menu prompt: "How can we help you today? Say appointment or press 1 to schedule an appointment. Say prescription or press 2 for prescription refills. Say test results or press 3 for lab and test results."

Caller: Presses 3 on keypad

Expected: Lex bot matches TestResultsIntent via DTMF. System plays: "You selected test results. Your lab and test results are available through our patient portal at sunrise health clinic dot com slash results. Results are typically available within 3 to 5 business days. If you have urgent questions about your results, please contact your providers office directly. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 15: Error — Invalid DTMF at Main Menu

**Purpose:** Verify that pressing an invalid digit (not 1 or 2) at the main menu triggers the error path

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Presses 5 on keypad

Expected: Lex bot matches FallbackIntent — digit "5" is not a recognized utterance for any intent. System routes to NoMatchingCondition error path. System plays error message: "Sorry, we were unable to understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.

---

## Scenario 16: Error — Unrecognized Speech at Main Menu

**Purpose:** Verify that saying something completely unrelated triggers the error path at the main menu

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Says "I'd like to order a large pepperoni pizza"

Expected: Lex bot matches FallbackIntent — no intent recognized. System routes to error. System plays error message: "Sorry, we were unable to understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.

---

## Scenario 17: Error — Invalid DTMF at Provider Sub-Menu

**Purpose:** Verify that pressing an invalid digit at the provider sub-menu triggers the error path (after successfully navigating level 1)

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Presses 1 on keypad

Expected: System plays: "Thank you, provider."

Expected: System plays provider menu prompt: "How can we help you today? Say referral or press 1 for referrals. Say prior auth or press 2 for prior authorizations. Say claims or press 3 for claims and billing."

Caller: Presses 7 on keypad

Expected: Lex bot matches FallbackIntent — digit "7" not recognized. System plays error message: "Sorry, we were unable to understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.

---

## Scenario 18: Error — Unrecognized Speech at Provider Sub-Menu

**Purpose:** Verify that saying something unrecognized at the provider sub-menu triggers error after successful level 1

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Says "provider"

Expected: System plays: "Thank you, provider."

Expected: System plays provider menu prompt: "How can we help you today? Say referral or press 1 for referrals. Say prior auth or press 2 for prior authorizations. Say claims or press 3 for claims and billing."

Caller: Says "I want to check on a patient's lab results"

Expected: Lex bot matches FallbackIntent — this utterance does not match ReferralIntent, PriorAuthIntent, or ClaimsBillingIntent. System plays error message: "Sorry, we were unable to understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.

---

## Scenario 19: Error — Invalid DTMF at Patient Sub-Menu

**Purpose:** Verify that pressing an invalid digit at the patient sub-menu triggers the error path

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Presses 2 on keypad

Expected: System plays: "Thank you, patient."

Expected: System plays patient menu prompt: "How can we help you today? Say appointment or press 1 to schedule an appointment. Say prescription or press 2 for prescription refills. Say test results or press 3 for lab and test results."

Caller: Presses 9 on keypad

Expected: Lex bot matches FallbackIntent. System plays error message: "Sorry, we were unable to understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.

---

## Scenario 20: Error — Unrecognized Speech at Patient Sub-Menu

**Purpose:** Verify that saying something unrecognized at the patient sub-menu triggers the error path

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Says "patient"

Expected: System plays: "Thank you, patient."

Expected: System plays patient menu prompt: "How can we help you today? Say appointment or press 1 to schedule an appointment. Say prescription or press 2 for prescription refills. Say test results or press 3 for lab and test results."

Caller: Says "I need to talk to someone about my insurance coverage"

Expected: Lex bot matches FallbackIntent — "insurance coverage" doesn't match any patient menu intent. System plays error message: "Sorry, we were unable to understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.

---

## Scenario 21: Timeout — Silence at Main Menu

**Purpose:** Test that the system handles silence (no input) at the main menu after the prompt finishes

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: [Remains silent — no input for 10+ seconds]

Expected: Lex bot times out waiting for input. System routes to error. System plays error message: "Sorry, we were unable to understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.

---

## Scenario 22: Timeout — Silence at Provider Sub-Menu

**Purpose:** Test that the system handles silence at the provider sub-menu after successfully selecting provider

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Says "I am a provider"

Expected: System plays: "Thank you, provider."

Expected: System plays provider menu prompt: "How can we help you today? Say referral or press 1 for referrals. Say prior auth or press 2 for prior authorizations. Say claims or press 3 for claims and billing."

Caller: [Remains silent — no input for 10+ seconds]

Expected: Lex bot times out. System plays error message: "Sorry, we were unable to understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.

---

## Scenario 23: Timeout — Silence at Patient Sub-Menu

**Purpose:** Test that the system handles silence at the patient sub-menu after successfully selecting patient

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Presses 2 on keypad

Expected: System plays: "Thank you, patient."

Expected: System plays patient menu prompt: "How can we help you today? Say appointment or press 1 to schedule an appointment. Say prescription or press 2 for prescription refills. Say test results or press 3 for lab and test results."

Caller: [Remains silent — no input for 10+ seconds]

Expected: Lex bot times out. System plays error message: "Sorry, we were unable to understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.

---

## Scenario 24: Edge Case — Press # at Main Menu

**Purpose:** Test that pressing the pound key at the main menu is handled as an invalid input

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Presses # on keypad

Expected: Lex bot receives "#" — matches FallbackIntent. System plays error message: "Sorry, we were unable to understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.

---

## Scenario 25: Edge Case — Press * at Main Menu

**Purpose:** Test that pressing the star key at the main menu is handled as an invalid input

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Presses * on keypad

Expected: Lex bot receives "*" — matches FallbackIntent. System plays error message: "Sorry, we were unable to understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.

---

## Scenario 26: Edge Case — Press 0 at Main Menu (Operator Request)

**Purpose:** Test that pressing 0 (commonly expected to reach an operator) is handled gracefully

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Presses 0 on keypad

Expected: Lex bot receives "0" — matches FallbackIntent (no intent has "0" as an utterance). System plays error message: "Sorry, we were unable to understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.

---

## Scenario 27: Edge Case — Ambiguous Speech at Main Menu

**Purpose:** Test what happens when the caller says something that could partially match both intents

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Says "hello? Is anyone there?"

Expected: Lex bot matches FallbackIntent — phrase doesn't match ProviderIntent or PatientIntent. System plays error message: "Sorry, we were unable to understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.

---

## Scenario 28: Edge Case — Press # at Provider Sub-Menu

**Purpose:** Test that pressing # at a sub-menu is handled as invalid input

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Presses 1 on keypad

Expected: System plays: "Thank you, provider."

Expected: System plays provider menu prompt: "How can we help you today? Say referral or press 1 for referrals. Say prior auth or press 2 for prior authorizations. Say claims or press 3 for claims and billing."

Caller: Presses # on keypad

Expected: Lex bot receives "#" — matches FallbackIntent. System plays error message: "Sorry, we were unable to understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.

---

## Scenario 29: Edge Case — Hesitant / Unclear Speech at Patient Sub-Menu

**Purpose:** Test how the system handles a hesitant, mumbling caller at the patient sub-menu

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Says "um... patient I think"

Expected: Lex bot may or may not match PatientIntent depending on confidence threshold. If matched: System plays: "Thank you, patient." If FallbackIntent: System routes to error.

*Assuming PatientIntent matched:*

Expected: System plays patient menu prompt: "How can we help you today? Say appointment or press 1 to schedule an appointment. Say prescription or press 2 for prescription refills. Say test results or press 3 for lab and test results."

Caller: Says "uh... what was the second one again? Prescription?"

Expected: Lex bot may match PrescriptionIntent if "prescription" is recognized despite surrounding filler words. If matched: System plays: "You selected prescription refills. To request a prescription refill, please log into your patient portal at sunrise health clinic dot com slash prescriptions, or contact your pharmacy directly. Please allow 48 hours for refill requests to be processed. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 30: Edge Case — Provider Says "physician" (Less Common Synonym)

**Purpose:** Test that the less common synonym "physician" correctly triggers ProviderIntent

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Says "physician"

Expected: Lex bot matches ProviderIntent via "physician" utterance. System plays: "Thank you, provider."

Expected: System plays provider menu prompt: "How can we help you today? Say referral or press 1 for referrals. Say prior auth or press 2 for prior authorizations. Say claims or press 3 for claims and billing."

Caller: Says "check claim status"

Expected: Lex bot matches ClaimsBillingIntent via "check claim status" utterance. System plays: "You selected claims and billing. For claims status inquiries or billing questions, please visit our provider portal at sunrise health clinic dot com slash claims. You may also email our billing department at billing at sunrise health clinic dot com. Our billing team will respond within 1 business day. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 31: Edge Case — Patient Says "I need to speak to someone" (Broad Phrase)

**Purpose:** Test that a broad, non-specific phrase like "I need to speak to someone" matches PatientIntent

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider, or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Says "I need to speak to someone about my care"

Expected: Lex bot matches PatientIntent via "I need to speak to someone about my care" utterance. System plays: "Thank you, patient."

Expected: System plays patient menu prompt: "How can we help you today? Say appointment or press 1 to schedule an appointment. Say prescription or press 2 for prescription refills. Say test results or press 3 for lab and test results."

Caller: Says "check on my labs"

Expected: Lex bot matches TestResultsIntent via "check on my labs" utterance. System plays: "You selected test results. Your lab and test results are available through our patient portal at sunrise health clinic dot com slash results. Results are typically available within 3 to 5 business days. If you have urgent questions about your results, please contact your providers office directly. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Coverage Summary

| Category | Scenarios | Count |
|----------|-----------|-------|
| Happy Path — DTMF | 1-6 | 6 |
| Happy Path — Voice (keyword) | 7, 12 | 2 |
| Happy Path — Voice (full phrase) | 8, 10 | 2 |
| Happy Path — Voice (synonym) | 9, 11 | 2 |
| Happy Path — Mixed input | 13, 14 | 2 |
| Happy Path — Synonym edge cases | 30, 31 | 2 |
| Error — Invalid DTMF | 15, 17, 19 | 3 |
| Error — Unrecognized speech | 16, 18, 20 | 3 |
| Timeout — Silence | 21, 22, 23 | 3 |
| Edge — Special keys (main) | 24, 25, 26 | 3 |
| Edge — Special keys (sub-menu) | 28 | 1 |
| Edge — Ambiguous/hesitant | 27, 29 | 2 |
| **Total** | | **31** |

**All 6 valid DTMF paths covered.** All 6 valid voice paths covered (with keyword, phrase, and synonym variations). All 3 menu levels tested for invalid input, unrecognized speech, and timeout. Special keys (#, *, 0) tested at main menu and sub-menu. Mixed input (DTMF + voice across levels) tested. Hesitant and ambiguous callers tested.
