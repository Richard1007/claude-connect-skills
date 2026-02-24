# Sunrise Health Clinic IVR - Test Scripts

**Flow ID:** b8c0b0e0-5700-45dc-8688-7213f97b317b
**Flow ARN:** arn:aws:connect:us-west-2:988066449281:instance/7d261e94-17bc-4f3e-96f7-f9b7541ce479/contact-flow/b8c0b0e0-5700-45dc-8688-7213f97b317b
**Connect Instance:** 7d261e94-17bc-4f3e-96f7-f9b7541ce479
**Region:** us-west-2
**Generated:** 2026-02-24

**Bots:**
| Bot | ID | Alias ARN |
|-----|----|-----------|
| SunriseMainMenuBot | YIYDCASELM | arn:aws:lex:us-west-2:988066449281:bot-alias/YIYDCASELM/BHL7HTQIVQ |
| SunriseProviderBot | V3K0U0TWAX | arn:aws:lex:us-west-2:988066449281:bot-alias/V3K0U0TWAX/Y57I6BL11O |
| SunrisePatientBot | ADUOTCGSBL | arn:aws:lex:us-west-2:988066449281:bot-alias/ADUOTCGSBL/G0MXJANXP9 |
| SunrisePharmacyBot | Y4HZ4SANJO | arn:aws:lex:us-west-2:988066449281:bot-alias/Y4HZ4SANJO/JVSJ0XLFB8 |
| SunriseBillingBot | 8NGIBWYVVL | arn:aws:lex:us-west-2:988066449281:bot-alias/8NGIBWYVVL/BC9NI3PZPI |

**Voice:** Matthew (Generative engine)

**Total Scenarios:** 16
- 11 Happy Path (DTMF)
- 3 Happy Path (Voice)
- 2 Error Paths

---

## S1: Happy Path DTMF — Provider > Referrals

**Purpose:** Test the complete path from main menu to referral information using keypad input only.
**Triggered when:** Caller presses 1 at main menu (ProviderIntent), then presses 1 at provider sub-menu (ReferralsIntent).

Caller: Dials the phone number.

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."

Expected: System plays main menu prompt: "Please select from the following options. For providers, press 1. For patients, press 2. For pharmacy, press 3. For billing, press 4."

Caller: Presses 1 on keypad.

Expected: Lex bot (SunriseMainMenuBot) matches ProviderIntent via DTMF digit "1". System plays: "Thank you, connecting you to provider services."

Expected: System plays provider sub-menu prompt: "For referrals, press 1. For prior authorizations, press 2. For provider relations, press 3."

Caller: Presses 1 on keypad.

Expected: Lex bot (SunriseProviderBot) matches ReferralsIntent via DTMF digit "1". System plays: "To submit a referral, please fax your referral form to 5 5 5, 1 2 3, 4 5 6 7. You can also email referrals at referrals at sunrise health dot com. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## S2: Happy Path DTMF — Provider > Prior Authorization

**Purpose:** Test the path to prior authorization information using keypad input.
**Triggered when:** Caller presses 1 at main menu (ProviderIntent), then presses 2 at provider sub-menu (PriorAuthIntent).

Caller: Dials the phone number.

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."

Expected: System plays main menu prompt: "Please select from the following options. For providers, press 1. For patients, press 2. For pharmacy, press 3. For billing, press 4."

Caller: Presses 1 on keypad.

Expected: Lex bot (SunriseMainMenuBot) matches ProviderIntent via DTMF digit "1". System plays: "Thank you, connecting you to provider services."

Expected: System plays provider sub-menu prompt: "For referrals, press 1. For prior authorizations, press 2. For provider relations, press 3."

Caller: Presses 2 on keypad.

Expected: Lex bot (SunriseProviderBot) matches PriorAuthIntent via DTMF digit "2". System plays: "For prior authorization requests, please have your patient insurance ID ready and call our dedicated prior auth line at 5 5 5, 2 3 4, 5 6 7 8. Our team is available Monday through Friday, 8 AM to 5 PM. Thank you. Goodbye."

Expected: Call disconnects.

---

## S3: Happy Path DTMF — Provider > Provider Relations

**Purpose:** Test the path to provider relations and credentialing information using keypad input.
**Triggered when:** Caller presses 1 at main menu (ProviderIntent), then presses 3 at provider sub-menu (ProviderRelationsIntent).

Caller: Dials the phone number.

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."

Expected: System plays main menu prompt: "Please select from the following options. For providers, press 1. For patients, press 2. For pharmacy, press 3. For billing, press 4."

Caller: Presses 1 on keypad.

Expected: Lex bot (SunriseMainMenuBot) matches ProviderIntent via DTMF digit "1". System plays: "Thank you, connecting you to provider services."

Expected: System plays provider sub-menu prompt: "For referrals, press 1. For prior authorizations, press 2. For provider relations, press 3."

Caller: Presses 3 on keypad.

Expected: Lex bot (SunriseProviderBot) matches ProviderRelationsIntent via DTMF digit "3". System plays: "For provider relations inquiries, including credentialing and network participation, please email provider relations at sunrise health dot com or call 5 5 5, 3 4 5, 6 7 8 9. Thank you. Goodbye."

Expected: Call disconnects.

---

## S4: Happy Path DTMF — Patient > Appointments

**Purpose:** Test the path to appointment scheduling information using keypad input.
**Triggered when:** Caller presses 2 at main menu (PatientIntent), then presses 1 at patient sub-menu (AppointmentsIntent).

Caller: Dials the phone number.

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."

Expected: System plays main menu prompt: "Please select from the following options. For providers, press 1. For patients, press 2. For pharmacy, press 3. For billing, press 4."

Caller: Presses 2 on keypad.

Expected: Lex bot (SunriseMainMenuBot) matches PatientIntent via DTMF digit "2". System plays: "Thank you, connecting you to patient services."

Expected: System plays patient sub-menu prompt: "For appointments, press 1. For prescription refills, press 2. For medical records, press 3."

Caller: Presses 1 on keypad.

Expected: Lex bot (SunrisePatientBot) matches AppointmentsIntent via DTMF digit "1". System plays: "To schedule, reschedule, or cancel an appointment, please visit our patient portal at sunrise health dot com slash appointments, or press 0 to speak with a scheduling representative. Our next available appointment is typically within 3 business days. Thank you. Goodbye."

Expected: Call disconnects.

---

## S5: Happy Path DTMF — Patient > Prescription Refills

**Purpose:** Test the path to prescription refill information using keypad input.
**Triggered when:** Caller presses 2 at main menu (PatientIntent), then presses 2 at patient sub-menu (PrescriptionRefillsIntent).

Caller: Dials the phone number.

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."

Expected: System plays main menu prompt: "Please select from the following options. For providers, press 1. For patients, press 2. For pharmacy, press 3. For billing, press 4."

Caller: Presses 2 on keypad.

Expected: Lex bot (SunriseMainMenuBot) matches PatientIntent via DTMF digit "2". System plays: "Thank you, connecting you to patient services."

Expected: System plays patient sub-menu prompt: "For appointments, press 1. For prescription refills, press 2. For medical records, press 3."

Caller: Presses 2 on keypad.

Expected: Lex bot (SunrisePatientBot) matches PrescriptionRefillsIntent via DTMF digit "2". System plays: "For prescription refills, please have your prescription number ready. You can request refills through our patient portal, or call our pharmacy directly at 5 5 5, 4 5 6, 7 8 9 0. Refills are typically processed within 24 to 48 hours. Thank you. Goodbye."

Expected: Call disconnects.

---

## S6: Happy Path DTMF — Patient > Medical Records

**Purpose:** Test the path to medical records request information using keypad input.
**Triggered when:** Caller presses 2 at main menu (PatientIntent), then presses 3 at patient sub-menu (MedicalRecordsIntent).

Caller: Dials the phone number.

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."

Expected: System plays main menu prompt: "Please select from the following options. For providers, press 1. For patients, press 2. For pharmacy, press 3. For billing, press 4."

Caller: Presses 2 on keypad.

Expected: Lex bot (SunriseMainMenuBot) matches PatientIntent via DTMF digit "2". System plays: "Thank you, connecting you to patient services."

Expected: System plays patient sub-menu prompt: "For appointments, press 1. For prescription refills, press 2. For medical records, press 3."

Caller: Presses 3 on keypad.

Expected: Lex bot (SunrisePatientBot) matches MedicalRecordsIntent via DTMF digit "3". System plays: "To request your medical records, please submit a signed authorization form. You can download the form at sunrise health dot com slash records. Processing takes 5 to 7 business days. For urgent requests, email records at sunrise health dot com. Thank you. Goodbye."

Expected: Call disconnects.

---

## S7: Happy Path DTMF — Pharmacy > Refill Status

**Purpose:** Test the path to prescription refill status information using keypad input.
**Triggered when:** Caller presses 3 at main menu (PharmacyIntent), then presses 1 at pharmacy sub-menu (RefillStatusIntent).

Caller: Dials the phone number.

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."

Expected: System plays main menu prompt: "Please select from the following options. For providers, press 1. For patients, press 2. For pharmacy, press 3. For billing, press 4."

Caller: Presses 3 on keypad.

Expected: Lex bot (SunriseMainMenuBot) matches PharmacyIntent via DTMF digit "3". System plays: "Thank you, connecting you to pharmacy services."

Expected: System plays pharmacy sub-menu prompt: "For refill status, press 1. For new prescriptions, press 2."

Caller: Presses 1 on keypad.

Expected: Lex bot (SunrisePharmacyBot) matches RefillStatusIntent via DTMF digit "1". System plays: "To check your refill status, please visit our patient portal or call our pharmacy at 5 5 5, 4 5 6, 7 8 9 0. You will need your prescription number and date of birth. Thank you. Goodbye."

Expected: Call disconnects.

---

## S8: Happy Path DTMF — Pharmacy > New Prescription

**Purpose:** Test the path to new prescription information using keypad input.
**Triggered when:** Caller presses 3 at main menu (PharmacyIntent), then presses 2 at pharmacy sub-menu (NewPrescriptionIntent).

Caller: Dials the phone number.

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."

Expected: System plays main menu prompt: "Please select from the following options. For providers, press 1. For patients, press 2. For pharmacy, press 3. For billing, press 4."

Caller: Presses 3 on keypad.

Expected: Lex bot (SunriseMainMenuBot) matches PharmacyIntent via DTMF digit "3". System plays: "Thank you, connecting you to pharmacy services."

Expected: System plays pharmacy sub-menu prompt: "For refill status, press 1. For new prescriptions, press 2."

Caller: Presses 2 on keypad.

Expected: Lex bot (SunrisePharmacyBot) matches NewPrescriptionIntent via DTMF digit "2". System plays: "For new prescription inquiries, please contact your provider office directly. If you have a new prescription to fill, you can drop it off at our pharmacy or send it electronically. Our pharmacy hours are Monday through Saturday, 8 AM to 8 PM. Thank you. Goodbye."

Expected: Call disconnects.

---

## S9: Happy Path DTMF — Billing > Pay Bill

**Purpose:** Test the path to bill payment information using keypad input.
**Triggered when:** Caller presses 4 at main menu (BillingIntent), then presses 1 at billing sub-menu (PayBillIntent).

Caller: Dials the phone number.

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."

Expected: System plays main menu prompt: "Please select from the following options. For providers, press 1. For patients, press 2. For pharmacy, press 3. For billing, press 4."

Caller: Presses 4 on keypad.

Expected: Lex bot (SunriseMainMenuBot) matches BillingIntent via DTMF digit "4". System plays: "Thank you, connecting you to billing services."

Expected: System plays billing sub-menu prompt: "To pay a bill, press 1. For insurance questions, press 2. For payment plans, press 3."

Caller: Presses 1 on keypad.

Expected: Lex bot (SunriseBillingBot) matches PayBillIntent via DTMF digit "1". System plays: "To pay your bill online, visit sunrise health dot com slash pay. You can also mail payments to Sunrise Health Clinic, P O Box 1 2 3 4, Anytown, State, 1 2 3 4 5. For phone payments, please have your account number and credit card ready. Thank you. Goodbye."

Expected: Call disconnects.

---

## S10: Happy Path DTMF — Billing > Insurance Questions

**Purpose:** Test the path to insurance and coverage question information using keypad input.
**Triggered when:** Caller presses 4 at main menu (BillingIntent), then presses 2 at billing sub-menu (InsuranceQuestionsIntent).

Caller: Dials the phone number.

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."

Expected: System plays main menu prompt: "Please select from the following options. For providers, press 1. For patients, press 2. For pharmacy, press 3. For billing, press 4."

Caller: Presses 4 on keypad.

Expected: Lex bot (SunriseMainMenuBot) matches BillingIntent via DTMF digit "4". System plays: "Thank you, connecting you to billing services."

Expected: System plays billing sub-menu prompt: "To pay a bill, press 1. For insurance questions, press 2. For payment plans, press 3."

Caller: Presses 2 on keypad.

Expected: Lex bot (SunriseBillingBot) matches InsuranceQuestionsIntent via DTMF digit "2". System plays: "For insurance and coverage questions, please have your insurance card handy. You can verify your coverage on our website or call our insurance specialists at 5 5 5, 5 6 7, 8 9 0 1, available Monday through Friday 9 AM to 4 PM. Thank you. Goodbye."

Expected: Call disconnects.

---

## S11: Happy Path DTMF — Billing > Payment Plans

**Purpose:** Test the path to payment plan information using keypad input.
**Triggered when:** Caller presses 4 at main menu (BillingIntent), then presses 3 at billing sub-menu (PaymentPlansIntent).

Caller: Dials the phone number.

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."

Expected: System plays main menu prompt: "Please select from the following options. For providers, press 1. For patients, press 2. For pharmacy, press 3. For billing, press 4."

Caller: Presses 4 on keypad.

Expected: Lex bot (SunriseMainMenuBot) matches BillingIntent via DTMF digit "4". System plays: "Thank you, connecting you to billing services."

Expected: System plays billing sub-menu prompt: "To pay a bill, press 1. For insurance questions, press 2. For payment plans, press 3."

Caller: Presses 3 on keypad.

Expected: Lex bot (SunriseBillingBot) matches PaymentPlansIntent via DTMF digit "3". System plays: "We offer flexible payment plans for balances over 200 dollars. To set up a payment plan, call our billing office at 5 5 5, 6 7 8, 9 0 1 2 or visit the billing section of our patient portal. Thank you. Goodbye."

Expected: Call disconnects.

---

## S12: Happy Path Voice — Patient > Appointments (keyword)

**Purpose:** Test voice input with a single keyword at both menu levels.
**Triggered when:** Caller says "patient" at main menu, then says "appointment" at patient sub-menu.

Caller: Dials the phone number.

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."

Expected: System plays main menu prompt: "Please select from the following options. For providers, press 1. For patients, press 2. For pharmacy, press 3. For billing, press 4."

Caller: Says "patient".

Expected: Lex bot (SunriseMainMenuBot) matches PatientIntent via utterance "patient". System plays: "Thank you, connecting you to patient services."

Expected: System plays patient sub-menu prompt: "For appointments, press 1. For prescription refills, press 2. For medical records, press 3."

Caller: Says "appointment".

Expected: Lex bot (SunrisePatientBot) matches AppointmentsIntent via utterance "appointment". System plays: "To schedule, reschedule, or cancel an appointment, please visit our patient portal at sunrise health dot com slash appointments, or press 0 to speak with a scheduling representative. Our next available appointment is typically within 3 business days. Thank you. Goodbye."

Expected: Call disconnects.

---

## S13: Happy Path Voice — Pharmacy > Refill Status (natural phrase)

**Purpose:** Test voice input using natural conversational phrases at both menu levels.
**Triggered when:** Caller says "I need my medication" at main menu, then says "is my prescription ready" at pharmacy sub-menu.

Caller: Dials the phone number.

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."

Expected: System plays main menu prompt: "Please select from the following options. For providers, press 1. For patients, press 2. For pharmacy, press 3. For billing, press 4."

Caller: Says "I need my medication".

Expected: Lex bot (SunriseMainMenuBot) matches PharmacyIntent via utterance "I need my medication". System plays: "Thank you, connecting you to pharmacy services."

Expected: System plays pharmacy sub-menu prompt: "For refill status, press 1. For new prescriptions, press 2."

Caller: Says "is my prescription ready".

Expected: Lex bot (SunrisePharmacyBot) matches RefillStatusIntent via utterance "is my prescription ready". System plays: "To check your refill status, please visit our patient portal or call our pharmacy at 5 5 5, 4 5 6, 7 8 9 0. You will need your prescription number and date of birth. Thank you. Goodbye."

Expected: Call disconnects.

---

## S14: Happy Path Voice — Billing > Payment Plans (synonym/alternate phrasing)

**Purpose:** Test voice input using synonym and alternate phrasings not directly in the menu prompt text.
**Triggered when:** Caller says "pay my bill" at main menu (matches BillingIntent), then says "I need a payment plan" at billing sub-menu (matches PaymentPlansIntent).

Caller: Dials the phone number.

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."

Expected: System plays main menu prompt: "Please select from the following options. For providers, press 1. For patients, press 2. For pharmacy, press 3. For billing, press 4."

Caller: Says "pay my bill".

Expected: Lex bot (SunriseMainMenuBot) matches BillingIntent via utterance "pay my bill". System plays: "Thank you, connecting you to billing services."

Expected: System plays billing sub-menu prompt: "To pay a bill, press 1. For insurance questions, press 2. For payment plans, press 3."

Caller: Says "I need a payment plan".

Expected: Lex bot (SunriseBillingBot) matches PaymentPlansIntent via utterance "I need a payment plan". System plays: "We offer flexible payment plans for balances over 200 dollars. To set up a payment plan, call our billing office at 5 5 5, 6 7 8, 9 0 1 2 or visit the billing section of our patient portal. Thank you. Goodbye."

Expected: Call disconnects.

---

## S15: Error — Invalid Input at Main Menu

**Purpose:** Verify that an unrecognized input at the main menu triggers the error path and disconnects.
**Triggered when:** Caller provides input that does not match any intent in SunriseMainMenuBot (e.g., presses 9 or says something unrelated). The bot returns FallbackIntent, and the flow routes to NoMatchingCondition/NoMatchingError.

Caller: Dials the phone number.

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."

Expected: System plays main menu prompt: "Please select from the following options. For providers, press 1. For patients, press 2. For pharmacy, press 3. For billing, press 4."

Caller: Presses 9 on keypad.

Expected: Lex bot (SunriseMainMenuBot) does not match any intent (FallbackIntent triggered). System routes to error path. System plays: "Sorry, we were unable to understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.

---

## S16: Error — Invalid Input at Provider Sub-Menu

**Purpose:** Verify that an unrecognized input at a sub-menu triggers the sub-menu error path and disconnects.
**Triggered when:** Caller successfully reaches the provider sub-menu (presses 1 at main menu), then provides input that does not match any intent in SunriseProviderBot (e.g., presses 7). The bot returns FallbackIntent, and the flow routes to NoMatchingCondition/NoMatchingError.

Caller: Dials the phone number.

Expected: System plays greeting: "Thank you for calling Sunrise Health Clinic. Your health is our priority."

Expected: System plays main menu prompt: "Please select from the following options. For providers, press 1. For patients, press 2. For pharmacy, press 3. For billing, press 4."

Caller: Presses 1 on keypad.

Expected: Lex bot (SunriseMainMenuBot) matches ProviderIntent via DTMF digit "1". System plays: "Thank you, connecting you to provider services."

Expected: System plays provider sub-menu prompt: "For referrals, press 1. For prior authorizations, press 2. For provider relations, press 3."

Caller: Presses 7 on keypad.

Expected: Lex bot (SunriseProviderBot) does not match any intent (FallbackIntent triggered). System routes to error path. System plays: "Sorry, we did not understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.

---
