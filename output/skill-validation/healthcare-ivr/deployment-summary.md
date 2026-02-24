# Sunrise Health Clinic IVR — Deployment Summary

**Deployed:** 2026-02-24
**Region:** us-west-2
**AWS Profile:** haohai
**Connect Instance:** 7d261e94-17bc-4f3e-96f7-f9b7541ce479

## Bots

| Bot Name | Bot ID | Alias ID | Alias ARN | Intents |
|----------|--------|----------|-----------|---------|
| SunriseMainMenuBot | YIYDCASELM | BHL7HTQIVQ | arn:aws:lex:us-west-2:988066449281:bot-alias/YIYDCASELM/BHL7HTQIVQ | ProviderIntent(1), PatientIntent(2), PharmacyIntent(3), BillingIntent(4) |
| SunriseProviderBot | V3K0U0TWAX | Y57I6BL11O | arn:aws:lex:us-west-2:988066449281:bot-alias/V3K0U0TWAX/Y57I6BL11O | ReferralsIntent(1), PriorAuthIntent(2), ProviderRelationsIntent(3) |
| SunrisePatientBot | ADUOTCGSBL | G0MXJANXP9 | arn:aws:lex:us-west-2:988066449281:bot-alias/ADUOTCGSBL/G0MXJANXP9 | AppointmentsIntent(1), PrescriptionRefillsIntent(2), MedicalRecordsIntent(3) |
| SunrisePharmacyBot | Y4HZ4SANJO | JVSJ0XLFB8 | arn:aws:lex:us-west-2:988066449281:bot-alias/Y4HZ4SANJO/JVSJ0XLFB8 | RefillStatusIntent(1), NewPrescriptionIntent(2) |
| SunriseBillingBot | 8NGIBWYVVL | BC9NI3PZPI | arn:aws:lex:us-west-2:988066449281:bot-alias/8NGIBWYVVL/BC9NI3PZPI | PayBillIntent(1), InsuranceQuestionsIntent(2), PaymentPlansIntent(3) |

## Contact Flow

- **Flow Name:** Sunrise Health Clinic IVR
- **Flow ID:** b8c0b0e0-5700-45dc-8688-7213f97b317b
- **Flow ARN:** arn:aws:connect:us-west-2:988066449281:instance/7d261e94-17bc-4f3e-96f7-f9b7541ce479/contact-flow/b8c0b0e0-5700-45dc-8688-7213f97b317b
- **Flow JSON:** sunrise-health-flow.json

## Flow Architecture

```
Entry
  |
  v
SetVoice (Matthew/Generative)
  |
  v
Greeting: "Thank you for calling Sunrise Health Clinic..."
  |
  v
MainMenu (SunriseMainMenuBot)
  |--- Press 1: Provider Services
  |       |
  |       v
  |     "Connecting to provider services..."
  |       |
  |       v
  |     ProviderMenu (SunriseProviderBot)
  |       |--- Press 1: Referrals -> Info msg -> Disconnect
  |       |--- Press 2: Prior Auth -> Info msg -> Disconnect
  |       |--- Press 3: Provider Relations -> Info msg -> Disconnect
  |       |--- Error -> "Sorry..." -> Disconnect
  |
  |--- Press 2: Patient Services
  |       |
  |       v
  |     "Connecting to patient services..."
  |       |
  |       v
  |     PatientMenu (SunrisePatientBot)
  |       |--- Press 1: Appointments -> Info msg -> Disconnect
  |       |--- Press 2: Prescription Refills -> Info msg -> Disconnect
  |       |--- Press 3: Medical Records -> Info msg -> Disconnect
  |       |--- Error -> "Sorry..." -> Disconnect
  |
  |--- Press 3: Pharmacy Services
  |       |
  |       v
  |     "Connecting to pharmacy services..."
  |       |
  |       v
  |     PharmacyMenu (SunrisePharmacyBot)
  |       |--- Press 1: Refill Status -> Info msg -> Disconnect
  |       |--- Press 2: New Prescription -> Info msg -> Disconnect
  |       |--- Error -> "Sorry..." -> Disconnect
  |
  |--- Press 4: Billing Services
  |       |
  |       v
  |     "Connecting to billing services..."
  |       |
  |       v
  |     BillingMenu (SunriseBillingBot)
  |       |--- Press 1: Pay Bill -> Info msg -> Disconnect
  |       |--- Press 2: Insurance Questions -> Info msg -> Disconnect
  |       |--- Press 3: Payment Plans -> Info msg -> Disconnect
  |       |--- Error -> "Sorry..." -> Disconnect
  |
  |--- Error -> "Sorry, unable to understand..." -> Disconnect
```

## Block Count

- **Total blocks:** 44
  - 1 UpdateContactTextToSpeechVoice
  - 5 ConnectParticipantWithLexBot
  - 18 MessageParticipant
  - 20 DisconnectParticipant

## All Bots Associated with Connect Instance

All 5 bots have been associated with Connect instance `7d261e94-17bc-4f3e-96f7-f9b7541ce479` and are ready for use.
