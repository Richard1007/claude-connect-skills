# Healthcare Authorization Call Center IVR -- Complete Test Scripts

## Overview

This document contains complete QA test artifacts for the Healthcare Authorization Call Center IVR system deployed on Amazon Connect with Amazon Lex bots (Nova Soniv model). It includes three types of test deliverables:

- **Part 1:** Manual QA Test Scripts (32 conversational dialogue scenarios)
- **Part 2:** Gherkin / BDD Scenarios (12 feature scenarios)
- **Part 3:** Structured JSON Test Specifications (25 test cases)
- **Appendix:** Coverage Matrix

## Test Configuration

- **Phone Number:** +1 (800) 555-0199
- **Flow Name:** Healthcare Authorization IVR
- **TTS Voices:** Joanna/Neural (English), Lupe/Neural (Spanish)
- **Auth Bot:** HealthcareAuthBot (slots: memberId, dateOfBirth)
- **Main Menu Bot (EN):** HealthcareAuthMainMenuBot
- **Main Menu Bot (ES):** HealthcareAuthMainMenuBotES
- **Queues:** Tier1AuthQueue, Tier2AuthQueue
- **Business Hours:** Monday-Friday, 8 AM - 6 PM Eastern Time
- **Test Member ID:** 123456789
- **Test Date of Birth:** January 15, 1985 (01/15/1985)

---

# Part 1: Manual QA Test Scripts

---

## HAPPY PATHS

---

## Scenario 1: Happy Path -- English DTMF -- Auth Success -- Check Auth Status (Found) -- Agent Transfer

**Purpose:** Test the complete happy path for an English-speaking caller using only DTMF input who authenticates successfully, checks their authorization status (found), and is transferred to an agent.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System sets voice to Joanna/Neural. System sets attributes: retryCount=0, language=en, authStatus=unauthenticated. Lambda CheckBusinessHours executes and returns businessHoursStatus=open.

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System sets voice to Joanna. System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: Lex bot HealthcareAuthBot initiates authentication. Bot prompts for member ID.

Caller: Enters 123456789 on keypad

Expected: Lex bot captures memberId slot as "123456789". Bot prompts for date of birth.

Caller: Enters 01151985 on keypad

Expected: Lex bot captures dateOfBirth slot. Bot plays confirmation: "I have your member ID as 123456789 and date of birth as January 15, 1985. Is that correct?"

Caller: Says "yes"

Expected: Lambda ValidateAuthentication executes and returns success. System sets authStatus=authenticated.

Expected: System plays main menu via HealthcareAuthMainMenuBot: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Presses 1 on keypad

Expected: Lex bot matches CheckAuthorizationStatusIntent via DTMF digit "1". Lambda GetAuthStatus executes and returns status=approved.

Expected: System plays: "Your authorization request is currently approved. If you need further assistance, you will now be connected to an agent."

Expected: Call transferred to Tier1AuthQueue. Agent connects.

---

## Scenario 2: Happy Path -- English DTMF -- Auth Success -- Speak to Agent -- Connected

**Purpose:** Test the complete happy path for an English DTMF caller who authenticates and requests to speak with an agent directly.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System sets voice to Joanna. System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: Lex bot HealthcareAuthBot initiates authentication. Bot prompts for member ID.

Caller: Enters 123456789 on keypad

Expected: Lex bot captures memberId slot. Bot prompts for date of birth.

Caller: Enters 01151985 on keypad

Expected: Lex bot plays confirmation: "I have your member ID as 123456789 and date of birth as January 15, 1985. Is that correct?"

Caller: Says "yes"

Expected: Lambda ValidateAuthentication returns success. System sets authStatus=authenticated.

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Presses 2 on keypad

Expected: Lex bot matches SpeakToAgentIntent via DTMF digit "2". System plays: "Please hold while we connect you with the next available agent."

Expected: Call transferred to Tier1AuthQueue. Agent connects.

---

## Scenario 3: Happy Path -- English DTMF -- Auth Success -- Request Callback -- Confirmed

**Purpose:** Test the complete happy path for an English DTMF caller who authenticates and requests a callback.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System sets voice to Joanna. System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: Lex bot HealthcareAuthBot initiates authentication. Bot prompts for member ID.

Caller: Enters 123456789 on keypad

Expected: Lex bot captures memberId. Bot prompts for date of birth.

Caller: Enters 01151985 on keypad

Expected: Lex bot plays confirmation: "I have your member ID as 123456789 and date of birth as January 15, 1985. Is that correct?"

Caller: Says "yes"

Expected: Lambda ValidateAuthentication returns success. System sets authStatus=authenticated.

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Presses 3 on keypad

Expected: Lex bot matches RequestCallbackIntent via DTMF digit "3". System plays: "Please say or enter the 10-digit phone number where you would like to be reached, followed by the pound key."

Caller: Enters 5551234567# on keypad

Expected: Lambda CreateCallback executes. System plays: "We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 4: Happy Path -- English Voice (Keywords) -- Auth Success -- Check Auth Status

**Purpose:** Test that a caller using simple spoken keywords can authenticate and check authorization status.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System sets voice to Joanna. System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: Lex bot HealthcareAuthBot initiates authentication. Bot prompts for member ID.

Caller: Says "one two three four five six seven eight nine"

Expected: Lex bot captures memberId slot as "123456789". Bot prompts for date of birth.

Caller: Says "January fifteenth nineteen eighty-five"

Expected: Lex bot captures dateOfBirth slot. Bot plays confirmation: "I have your member ID as 123456789 and date of birth as January 15, 1985. Is that correct?"

Caller: Says "yes"

Expected: Lambda ValidateAuthentication returns success. System sets authStatus=authenticated.

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Says "check status"

Expected: Lex bot matches CheckAuthorizationStatusIntent (confidence > 0.40). Lambda GetAuthStatus executes and returns status=pending.

Expected: System plays: "Your authorization request is currently pending. If you need further assistance, you will now be connected to an agent."

Expected: Call transferred to Tier1AuthQueue.

---

## Scenario 5: Happy Path -- English Voice (Full Phrases) -- Auth Success -- Speak to Agent

**Purpose:** Test that a caller using natural, full sentences can authenticate and request to speak with an agent.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System sets voice to Joanna. System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: Lex bot HealthcareAuthBot initiates authentication. Bot prompts for member ID.

Caller: Says "my member ID is one two three four five six seven eight nine"

Expected: Lex bot captures memberId slot as "123456789". Bot prompts for date of birth.

Caller: Says "my date of birth is January fifteen, nineteen eighty-five"

Expected: Lex bot captures dateOfBirth. Bot plays confirmation: "I have your member ID as 123456789 and date of birth as January 15, 1985. Is that correct?"

Caller: Says "that is correct"

Expected: Lambda ValidateAuthentication returns success. System sets authStatus=authenticated.

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Says "I want to talk to a person"

Expected: Lex bot matches SpeakToAgentIntent (confidence > 0.40). System plays: "Please hold while we connect you with the next available agent."

Expected: Call transferred to Tier1AuthQueue. Agent connects.

---

## Scenario 6: Happy Path -- English Voice (Synonyms) -- Auth Success -- Request Callback

**Purpose:** Test that synonym utterances not in the prompt text correctly resolve to the intended intents.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System sets voice to Joanna. System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: Lex bot HealthcareAuthBot initiates authentication. Bot prompts for member ID.

Caller: Says "one two three four five six seven eight nine"

Expected: Lex bot captures memberId. Bot prompts for date of birth.

Caller: Says "oh one fifteen eighty-five"

Expected: Lex bot captures dateOfBirth. Bot plays confirmation: "I have your member ID as 123456789 and date of birth as January 15, 1985. Is that correct?"

Caller: Says "yes"

Expected: Lambda ValidateAuthentication returns success. System sets authStatus=authenticated.

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Says "have someone call me"

Expected: Lex bot matches RequestCallbackIntent via synonym utterance "have someone call me" (confidence > 0.40). System plays: "Please say or enter the 10-digit phone number where you would like to be reached, followed by the pound key."

Caller: Says "five five five nine eight seven six five four three"

Expected: Lambda CreateCallback executes. System plays: "We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 7: Happy Path -- Spanish DTMF -- Auth Success -- Check Auth Status -- Agent Transfer

**Purpose:** Test the complete happy path for a Spanish-speaking caller using DTMF input through authentication, status check, and agent transfer.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 2 on keypad

Expected: System sets voice to Lupe. System sets language=es. System plays Spanish greeting.

Expected: Lex bot HealthcareAuthBot initiates authentication in Spanish. Bot prompts for member ID.

Caller: Enters 123456789 on keypad

Expected: Lex bot captures memberId. Bot prompts for date of birth.

Caller: Enters 01151985 on keypad

Expected: Lex bot captures dateOfBirth. Bot plays Spanish confirmation prompt.

Caller: Says "si"

Expected: Lambda ValidateAuthentication returns success. System sets authStatus=authenticated.

Expected: System plays Spanish main menu via HealthcareAuthMainMenuBotES.

Caller: Presses 1 on keypad

Expected: Lex bot matches CheckAuthorizationStatusIntent via DTMF digit "1". Lambda GetAuthStatus executes and returns status=approved.

Expected: System plays Spanish authorization status response indicating status is approved, followed by agent transfer message.

Expected: Call transferred to Tier1AuthQueue.

---

## Scenario 8: Happy Path -- Spanish Voice -- Auth Success -- Speak to Agent

**Purpose:** Test a Spanish-speaking caller using voice input to authenticate and reach an agent.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 2 on keypad

Expected: System sets voice to Lupe. System plays Spanish greeting.

Expected: Lex bot HealthcareAuthBot initiates Spanish authentication. Bot prompts for member ID.

Caller: Says "uno dos tres cuatro cinco seis siete ocho nueve"

Expected: Lex bot captures memberId. Bot prompts for date of birth.

Caller: Says "quince de enero de mil novecientos ochenta y cinco"

Expected: Lex bot captures dateOfBirth. Bot plays Spanish confirmation.

Caller: Says "si, correcto"

Expected: Lambda ValidateAuthentication returns success. System sets authStatus=authenticated.

Expected: System plays Spanish main menu via HealthcareAuthMainMenuBotES.

Caller: Says "hablar con un agente"

Expected: Lex bot matches SpeakToAgentIntent (confidence > 0.40). System plays Spanish hold message.

Expected: Call transferred to Tier1AuthQueue. Agent connects.

---

## Scenario 9: Happy Path -- Mixed Input -- DTMF Language, Voice Auth, DTMF Main Menu

**Purpose:** Test that a caller can switch between DTMF and voice input across different stages of the call without issues.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System sets voice to Joanna. System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: Lex bot HealthcareAuthBot initiates authentication. Bot prompts for member ID.

Caller: Says "one two three four five six seven eight nine"

Expected: Lex bot captures memberId as "123456789". Bot prompts for date of birth.

Caller: Says "January fifteenth nineteen eighty-five"

Expected: Lex bot captures dateOfBirth. Bot plays confirmation: "I have your member ID as 123456789 and date of birth as January 15, 1985. Is that correct?"

Caller: Says "yes"

Expected: Lambda ValidateAuthentication returns success. System sets authStatus=authenticated.

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Presses 2 on keypad

Expected: Lex bot matches SpeakToAgentIntent via DTMF digit "2". System plays: "Please hold while we connect you with the next available agent."

Expected: Call transferred to Tier1AuthQueue. Agent connects.

---

## AUTHENTICATION FAILURES

---

## Scenario 10: Auth Failure -- Retry Once -- Success on Second Attempt -- Main Menu

**Purpose:** Test that a caller who fails authentication once can retry and succeed on the second attempt, then proceed to the main menu normally.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System sets voice to Joanna. System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: Lex bot HealthcareAuthBot initiates authentication. Bot prompts for member ID.

Caller: Enters 987654321 on keypad

Expected: Lex bot captures memberId as "987654321". Bot prompts for date of birth.

Caller: Enters 06201990 on keypad

Expected: Lex bot captures dateOfBirth. Bot plays confirmation: "I have your member ID as 987654321 and date of birth as June 20, 1990. Is that correct?"

Caller: Says "yes"

Expected: Lambda ValidateAuthentication returns failure (member not found). System increments retryCount to 1. retryCount (1) < 3.

Expected: System plays: "We were unable to verify your information. Please try again."

Expected: Lex bot HealthcareAuthBot re-initiates authentication. Bot prompts for member ID.

Caller: Enters 123456789 on keypad

Expected: Lex bot captures memberId as "123456789". Bot prompts for date of birth.

Caller: Enters 01151985 on keypad

Expected: Lex bot captures dateOfBirth. Bot plays confirmation: "I have your member ID as 123456789 and date of birth as January 15, 1985. Is that correct?"

Caller: Says "yes"

Expected: Lambda ValidateAuthentication returns success. System sets authStatus=authenticated.

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Presses 1 on keypad

Expected: Lex bot matches CheckAuthorizationStatusIntent. Lambda GetAuthStatus executes.

Expected: System plays authorization status and transfers to Tier1AuthQueue.

---

## Scenario 11: Auth Failure -- 3 Retries -- Max Attempts Exceeded -- Disconnect

**Purpose:** Test that a caller who fails authentication three times in a row is disconnected with the security lockout message.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System sets voice to Joanna. System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

**Attempt 1:**

Expected: Lex bot HealthcareAuthBot initiates authentication. Bot prompts for member ID.

Caller: Enters 111111111 on keypad

Expected: Lex bot captures memberId. Bot prompts for date of birth.

Caller: Enters 01011970 on keypad

Expected: Lex bot plays confirmation. Caller confirms.

Expected: Lambda ValidateAuthentication returns failure. System increments retryCount to 1. retryCount (1) < 3.

Expected: System plays: "We were unable to verify your information. Please try again."

**Attempt 2:**

Expected: Lex bot re-initiates authentication. Bot prompts for member ID.

Caller: Enters 222222222 on keypad

Expected: Lex bot captures memberId. Bot prompts for date of birth.

Caller: Enters 02021980 on keypad

Expected: Lex bot plays confirmation. Caller confirms.

Expected: Lambda ValidateAuthentication returns failure. System increments retryCount to 2. retryCount (2) < 3.

Expected: System plays: "We were unable to verify your information. Please try again."

**Attempt 3:**

Expected: Lex bot re-initiates authentication. Bot prompts for member ID.

Caller: Enters 333333333 on keypad

Expected: Lex bot captures memberId. Bot prompts for date of birth.

Caller: Enters 03031990 on keypad

Expected: Lex bot plays confirmation. Caller confirms.

Expected: Lambda ValidateAuthentication returns failure. System increments retryCount to 3. retryCount (3) >= 3.

Expected: System plays: "We are sorry. We were unable to verify your identity after multiple attempts. For your security, this call will now end. Please call back or visit our website for assistance. Goodbye."

Expected: Call disconnects.

---

## Scenario 12: Auth Partial Failure -- Wrong Member ID Format -- Lex Retry -- Correct Input -- Success

**Purpose:** Test that the Lex bot handles an incorrectly formatted member ID (fewer than 9 digits), re-prompts the caller, and proceeds when the caller provides the correct format.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System sets voice to Joanna. System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: Lex bot HealthcareAuthBot initiates authentication. Bot prompts for member ID.

Caller: Enters 12345 on keypad (only 5 digits -- too short)

Expected: Lex bot detects memberId slot validation failure (requires 9 digits). Bot re-prompts: "I did not get that. Please enter your 9-digit member ID."

Caller: Enters 123456789 on keypad

Expected: Lex bot captures memberId as "123456789". Bot prompts for date of birth.

Caller: Enters 01151985 on keypad

Expected: Lex bot captures dateOfBirth. Bot plays confirmation: "I have your member ID as 123456789 and date of birth as January 15, 1985. Is that correct?"

Caller: Says "yes"

Expected: Lambda ValidateAuthentication returns success. System sets authStatus=authenticated.

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

---

## ERROR PATHS

---

## Scenario 13: Main Menu -- Unrecognized Voice Input -- Error Prompt -- Retry -- Success

**Purpose:** Test that unrecognized voice input at the main menu triggers FallbackIntent, plays the error prompt, and allows the caller to retry successfully.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: [Caller authenticates successfully -- steps omitted for brevity]

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Says "I need to refill my prescription"

Expected: Lex bot matches FallbackIntent -- utterance does not match CheckAuthorizationStatusIntent, SpeakToAgentIntent, or RequestCallbackIntent.

Expected: System plays: "I am sorry, I did not understand that selection. Please try again."

Expected: System replays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Says "check authorization status"

Expected: Lex bot matches CheckAuthorizationStatusIntent (confidence > 0.40). Lambda GetAuthStatus executes.

Expected: System plays authorization status and transfers to Tier1AuthQueue.

---

## Scenario 14: Main Menu -- Timeout/Silence -- Error Prompt -- Retry

**Purpose:** Test that silence at the main menu triggers a timeout, plays the error prompt, and re-presents the menu.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: [Caller authenticates successfully -- steps omitted for brevity]

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: [Remains silent -- no input for 10+ seconds]

Expected: Lex bot times out waiting for input. FallbackIntent triggered.

Expected: System plays: "I am sorry, I did not understand that selection. Please try again."

Expected: System replays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Presses 2 on keypad

Expected: Lex bot matches SpeakToAgentIntent. System plays: "Please hold while we connect you with the next available agent."

Expected: Call transferred to Tier1AuthQueue.

---

## Scenario 15: Main Menu -- 3 Consecutive Failures -- Disconnect

**Purpose:** Test that three consecutive unrecognized inputs at the main menu result in a goodbye message and disconnect.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: [Caller authenticates successfully -- steps omitted for brevity]

**Failure 1:**

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Says "what are your hours of operation?"

Expected: Lex bot matches FallbackIntent. System plays: "I am sorry, I did not understand that selection. Please try again."

**Failure 2:**

Expected: System replays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Says "can you repeat the options?"

Expected: Lex bot matches FallbackIntent. System plays: "I am sorry, I did not understand that selection. Please try again."

**Failure 3:**

Expected: System replays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Says "I don't understand"

Expected: Lex bot matches FallbackIntent. Third consecutive failure detected.

Expected: System plays: "Thank you for calling the Healthcare Authorization Center. Goodbye."

Expected: Call disconnects.

---

## Scenario 16: Language Selection -- Invalid DTMF Input -- Default English

**Purpose:** Test that pressing an invalid digit at the language selection menu defaults the caller to English.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 5 on keypad

Expected: System detects error/invalid input at language selection. System defaults to English. System sets voice to Joanna.

Expected: System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: Lex bot HealthcareAuthBot initiates authentication in English.

---

## Scenario 17: Language Selection -- Timeout/No Input -- Default English

**Purpose:** Test that silence at the language selection menu defaults the caller to the English path.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: [Remains silent -- no input for 10+ seconds]

Expected: System detects timeout at language selection. System defaults to English. System sets voice to Joanna.

Expected: System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: Lex bot HealthcareAuthBot initiates authentication in English.

---

## AFTER-HOURS

---

## Scenario 18: After-Hours English -- Callback Request -- Confirmed -- Disconnect

**Purpose:** Test the after-hours flow for an English-speaking caller who requests a callback.

Caller: Dials +1 (800) 555-0199 outside business hours (e.g., Saturday 10 AM ET)

Expected: System sets voice to Joanna/Neural. Lambda CheckBusinessHours executes and returns businessHoursStatus=closed.

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System sets voice to Joanna. System plays: "Thank you for calling the Healthcare Authorization Center. Our office is currently closed. Our business hours are Monday through Friday, 8 AM to 6 PM Eastern Time."

Expected: System plays after-hours menu: "Press 1 to request a callback during our next business day, or press 2 to leave a voicemail message."

Caller: Presses 1 on keypad

Expected: System plays: "Please say or enter the 10-digit phone number where you would like to be reached, followed by the pound key."

Caller: Enters 5551234567# on keypad

Expected: Lambda executes callback scheduling. System plays: "We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 19: After-Hours English -- Voicemail -- Record -- Disconnect

**Purpose:** Test the after-hours flow for an English-speaking caller who chooses to leave a voicemail.

Caller: Dials +1 (800) 555-0199 outside business hours (e.g., Sunday 2 PM ET)

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System sets voice to Joanna. System plays: "Thank you for calling the Healthcare Authorization Center. Our office is currently closed. Our business hours are Monday through Friday, 8 AM to 6 PM Eastern Time."

Expected: System plays after-hours menu: "Press 1 to request a callback during our next business day, or press 2 to leave a voicemail message."

Caller: Presses 2 on keypad

Expected: System plays: "Please leave your message after the tone. Press the pound key when you are finished."

Expected: System plays tone.

Caller: Says "Hi, this is John Smith, member ID 123456789. I'm calling about my pending authorization for my MRI. Please call me back at 555-123-4567. Thank you."

Caller: Presses # on keypad

Expected: Voicemail recorded and stored. Call disconnects.

---

## Scenario 20: After-Hours Spanish -- Callback Request -- Confirmed -- Disconnect

**Purpose:** Test the after-hours flow for a Spanish-speaking caller who requests a callback.

Caller: Dials +1 (800) 555-0199 outside business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 2 on keypad

Expected: System sets voice to Lupe. System sets language=es. System plays Spanish closed office message with business hours Monday through Friday, 8 AM to 6 PM Eastern Time.

Expected: System plays Spanish after-hours menu (press 1 for callback, press 2 for voicemail).

Caller: Presses 1 on keypad

Expected: System prompts for 10-digit callback phone number in Spanish.

Caller: Enters 5559876543# on keypad

Expected: Lambda executes callback scheduling. System plays Spanish callback confirmation message.

Expected: Call disconnects.

---

## Scenario 21: After-Hours -- Invalid Input -- Error -- Retry

**Purpose:** Test that invalid input at the after-hours menu triggers the error prompt and allows retry.

Caller: Dials +1 (800) 555-0199 outside business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System sets voice to Joanna. System plays: "Thank you for calling the Healthcare Authorization Center. Our office is currently closed. Our business hours are Monday through Friday, 8 AM to 6 PM Eastern Time."

Expected: System plays after-hours menu: "Press 1 to request a callback during our next business day, or press 2 to leave a voicemail message."

Caller: Presses 7 on keypad

Expected: System plays: "I am sorry, I did not understand that selection. Please try again."

Expected: System replays after-hours menu: "Press 1 to request a callback during our next business day, or press 2 to leave a voicemail message."

Caller: Presses 1 on keypad

Expected: System proceeds with callback flow. System plays phone number collection prompt.

---

## QUEUE FALLBACK

---

## Scenario 22: Speak to Agent -- Tier 1 Full -- Tier 2 Escalation -- Connected

**Purpose:** Test the queue escalation flow when Tier 1 is at capacity but Tier 2 has available agents.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: [Caller authenticates successfully -- steps omitted for brevity]

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Presses 2 on keypad

Expected: Lex bot matches SpeakToAgentIntent. System plays: "Please hold while we connect you with the next available agent."

Expected: System attempts transfer to Tier1AuthQueue. Queue is at capacity.

Expected: System plays: "All Tier 1 agents are currently busy. We are connecting you with our specialized support team. Please continue to hold."

Expected: System transfers call to Tier2AuthQueue. Tier 2 agent connects.

---

## Scenario 23: Speak to Agent -- Tier 1 Full -- Tier 2 Full -- Callback Offered -- Accepted

**Purpose:** Test the complete queue fallback chain when both Tier 1 and Tier 2 are full, and the caller accepts the callback offer.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: [Caller authenticates successfully -- steps omitted for brevity]

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Says "speak to an agent"

Expected: Lex bot matches SpeakToAgentIntent. System plays: "Please hold while we connect you with the next available agent."

Expected: System attempts transfer to Tier1AuthQueue. Queue is at capacity.

Expected: System plays: "All Tier 1 agents are currently busy. We are connecting you with our specialized support team. Please continue to hold."

Expected: System attempts transfer to Tier2AuthQueue. Queue is at capacity.

Expected: System plays: "We apologize, but all of our agents are currently unavailable. Press 1 to request a callback, or press 2 to end the call."

Caller: Presses 1 on keypad

Expected: System plays: "Please say or enter the 10-digit phone number where you would like to be reached, followed by the pound key."

Caller: Enters 5551234567# on keypad

Expected: Lambda CreateCallback executes. System plays: "We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye."

Expected: Call disconnects.

---

## Scenario 24: Speak to Agent -- Tier 1 Full -- Tier 2 Full -- Callback Offered -- Declined -- Disconnect

**Purpose:** Test the complete queue fallback chain when both queues are full and the caller declines the callback and ends the call.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: [Caller authenticates successfully -- steps omitted for brevity]

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Presses 2 on keypad

Expected: Lex bot matches SpeakToAgentIntent. System plays: "Please hold while we connect you with the next available agent."

Expected: System attempts transfer to Tier1AuthQueue. Queue is at capacity.

Expected: System plays: "All Tier 1 agents are currently busy. We are connecting you with our specialized support team. Please continue to hold."

Expected: System attempts transfer to Tier2AuthQueue. Queue is at capacity.

Expected: System plays: "We apologize, but all of our agents are currently unavailable. Press 1 to request a callback, or press 2 to end the call."

Caller: Presses 2 on keypad

Expected: System plays: "Thank you for calling the Healthcare Authorization Center. Goodbye."

Expected: Call disconnects.

---

## EDGE CASES

---

## Scenario 25: Auth Status Not Found -- Agent Transfer

**Purpose:** Test that when a caller checks authorization status and no pending authorizations are found, the system delivers the not-found message and transfers to an agent.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: [Caller authenticates successfully -- steps omitted for brevity]

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Says "what is my authorization status"

Expected: Lex bot matches CheckAuthorizationStatusIntent (confidence > 0.40). Lambda GetAuthStatus executes and returns not found.

Expected: System plays: "We were unable to find any pending authorizations associated with your account. You will now be connected to an agent for further assistance."

Expected: Call transferred to Tier1AuthQueue.

---

## Scenario 26: Lex No-Match at Main Menu -- FallbackIntent -- Error Path

**Purpose:** Test that a completely off-topic utterance at the main menu triggers FallbackIntent and the error recovery flow.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: [Caller authenticates successfully -- steps omitted for brevity]

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Says "I want to order a large pepperoni pizza"

Expected: Lex bot matches FallbackIntent -- utterance does not match any defined intent. System plays: "I am sorry, I did not understand that selection. Please try again."

Expected: System replays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Presses 1 on keypad

Expected: Lex bot matches CheckAuthorizationStatusIntent. Flow proceeds normally.

---

## Scenario 27: Caller Presses # or * at Main Menu -- Error Handling

**Purpose:** Test that pressing special keys (# and *) at the main menu is handled as invalid input via the FallbackIntent path.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: [Caller authenticates successfully -- steps omitted for brevity]

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Presses # on keypad

Expected: Lex bot receives "#" -- matches FallbackIntent. System plays: "I am sorry, I did not understand that selection. Please try again."

Expected: System replays main menu.

Caller: Presses * on keypad

Expected: Lex bot receives "*" -- matches FallbackIntent. System plays: "I am sorry, I did not understand that selection. Please try again."

Expected: System replays main menu.

Caller: Presses 3 on keypad

Expected: Lex bot matches RequestCallbackIntent. Flow proceeds to callback collection.

---

## Scenario 28: Rapid DTMF Input During Prompt Playback (Barge-In)

**Purpose:** Test system behavior when a caller presses a DTMF digit before the menu prompt finishes playing, verifying barge-in handling.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Immediately presses 1 on keypad before the prompt finishes

Expected: If barge-in is enabled: System interrupts the prompt, accepts "1" as English selection, sets voice to Joanna, and proceeds to greeting. If barge-in is disabled: System waits until prompt finishes, then processes the buffered DTMF "1" and proceeds to English path.

Expected: System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: [Caller authenticates successfully]

Expected: System begins playing main menu prompt: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to..."

Caller: Immediately presses 2 on keypad before the prompt finishes

Expected: If barge-in enabled on Lex bot: Prompt interrupted, Lex bot matches SpeakToAgentIntent via "2". If barge-in disabled: DTMF "2" buffered until prompt completes, then processed.

Expected: System plays: "Please hold while we connect you with the next available agent."

Expected: Call transferred to Tier1AuthQueue.

---

## ADDITIONAL SCENARIOS

---

## Scenario 29: After-Hours -- 3 Invalid Inputs -- Disconnect

**Purpose:** Test that three consecutive invalid inputs at the after-hours menu result in disconnect.

Caller: Dials +1 (800) 555-0199 outside business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System plays: "Thank you for calling the Healthcare Authorization Center. Our office is currently closed. Our business hours are Monday through Friday, 8 AM to 6 PM Eastern Time."

**Failure 1:**

Expected: System plays after-hours menu: "Press 1 to request a callback during our next business day, or press 2 to leave a voicemail message."

Caller: Presses 5 on keypad

Expected: System plays: "I am sorry, I did not understand that selection. Please try again."

**Failure 2:**

Expected: System replays after-hours menu: "Press 1 to request a callback during our next business day, or press 2 to leave a voicemail message."

Caller: [Remains silent -- no input for 10+ seconds]

Expected: System plays: "I am sorry, I did not understand that selection. Please try again."

**Failure 3:**

Expected: System replays after-hours menu: "Press 1 to request a callback during our next business day, or press 2 to leave a voicemail message."

Caller: Presses 0 on keypad

Expected: Third consecutive failure. System disconnects.

Expected: Call disconnects.

---

## Scenario 30: Auth Confirmation Denied -- Re-Collection

**Purpose:** Test that when a caller denies the authentication confirmation prompt, the bot re-collects the information rather than counting it as an authentication failure.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: System plays language selection prompt: "For English, press 1. Para español, oprima el número 2."

Caller: Presses 1 on keypad

Expected: System plays greeting: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."

Expected: Lex bot HealthcareAuthBot initiates authentication. Bot prompts for member ID.

Caller: Enters 123456788 on keypad (one digit off)

Expected: Lex bot captures memberId as "123456788". Bot prompts for date of birth.

Caller: Enters 01151985 on keypad

Expected: Lex bot plays confirmation: "I have your member ID as 123456788 and date of birth as January 15, 1985. Is that correct?"

Caller: Says "no"

Expected: Lex bot denies confirmation and re-prompts for member ID.

Caller: Enters 123456789 on keypad

Expected: Lex bot captures corrected memberId as "123456789". Bot prompts for date of birth.

Caller: Enters 01151985 on keypad

Expected: Lex bot plays confirmation: "I have your member ID as 123456789 and date of birth as January 15, 1985. Is that correct?"

Caller: Says "yes"

Expected: Lambda ValidateAuthentication returns success. System sets authStatus=authenticated.

Expected: System plays main menu.

---

## Scenario 31: English Voice -- Casual/Hesitant Phrasing at Main Menu

**Purpose:** Test that hesitant or casual natural speech with filler words is still correctly recognized at the main menu.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: [Caller selects English, authenticates successfully -- steps omitted for brevity]

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Says "um... yeah, I think I want to... check on my authorization?"

Expected: Lex bot matches CheckAuthorizationStatusIntent via utterance fragment "check on my authorization" (confidence > 0.40). Lambda GetAuthStatus executes.

Expected: System plays authorization status. Call transferred to Tier1AuthQueue.

---

## Scenario 32: Auth Success -- Check Auth Status With "Denied" Result

**Purpose:** Test that the system correctly reads back a "denied" authorization status and still transfers to an agent for further assistance.

Caller: Dials +1 (800) 555-0199 during business hours

Expected: [Caller selects English, authenticates successfully -- steps omitted for brevity]

Expected: System plays main menu: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."

Caller: Says "status"

Expected: Lex bot matches CheckAuthorizationStatusIntent via keyword "status". Lambda GetAuthStatus executes and returns status=denied.

Expected: System plays: "Your authorization request is currently denied. If you need further assistance, you will now be connected to an agent."

Expected: Call transferred to Tier1AuthQueue.

---

---

# Part 2: Gherkin / BDD Scenarios

---

```gherkin
Feature: Healthcare Authorization IVR

  Background:
    Given the IVR phone number is "+1-800-555-0199"
    And the test caller's member ID is "123456789"
    And the test caller's date of birth is "January 15, 1985"
    And the system voice is set to "Joanna/Neural"
    And the initial attributes are retryCount=0, language="en", authStatus="unauthenticated"

  # -----------------------------------------------------------------------
  # Scenario 1: Happy path - Check authorization status in English via DTMF
  # -----------------------------------------------------------------------
  Scenario: Happy path - English DTMF - Authenticate and check authorization status
    Given the current time is within business hours
    And the authorization status for member "123456789" is "approved"
    When the caller dials the IVR number
    Then the system invokes Lambda "CheckBusinessHours"
    And the Lambda returns businessHoursStatus "open"
    And the system plays "For English, press 1. Para español, oprima el número 2."
    When the caller presses "1"
    Then the system sets the voice to "Joanna"
    And the system plays "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."
    And the Lex bot "HealthcareAuthBot" prompts for member ID
    When the caller enters "123456789" via DTMF
    Then the Lex bot captures memberId as "123456789"
    And the Lex bot prompts for date of birth
    When the caller enters "01151985" via DTMF
    Then the Lex bot plays "I have your member ID as 123456789 and date of birth as January 15, 1985. Is that correct?"
    When the caller says "yes"
    Then the system invokes Lambda "ValidateAuthentication"
    And the Lambda returns authentication result "success"
    And the system sets authStatus to "authenticated"
    And the system plays "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."
    When the caller presses "1"
    Then the Lex bot matches "CheckAuthorizationStatusIntent"
    And the system invokes Lambda "GetAuthStatus"
    And the system plays "Your authorization request is currently approved. If you need further assistance, you will now be connected to an agent."
    And the call is transferred to "Tier1AuthQueue"

  # -----------------------------------------------------------------------
  # Scenario 2: Happy path - Spanish DTMF - Authenticate and speak to agent
  # -----------------------------------------------------------------------
  Scenario: Happy path - Spanish DTMF - Authenticate and speak to agent
    Given the current time is within business hours
    When the caller dials the IVR number
    Then the system plays "For English, press 1. Para español, oprima el número 2."
    When the caller presses "2"
    Then the system sets the voice to "Lupe"
    And the system sets language to "es"
    And the system plays the Spanish greeting
    And the Lex bot "HealthcareAuthBot" prompts for member ID in Spanish
    When the caller enters "123456789" via DTMF
    And the caller enters "01151985" via DTMF
    And the caller confirms the authentication details
    Then the system invokes Lambda "ValidateAuthentication"
    And the Lambda returns authentication result "success"
    And the system sets authStatus to "authenticated"
    And the system plays the Spanish main menu via "HealthcareAuthMainMenuBotES"
    When the caller presses "2"
    Then the Lex bot matches "SpeakToAgentIntent"
    And the system plays the Spanish hold message
    And the call is transferred to "Tier1AuthQueue"

  # -----------------------------------------------------------------------
  # Scenario 3: Authentication failure and retry
  # -----------------------------------------------------------------------
  Scenario: Authentication failure on first attempt, success on retry
    Given the current time is within business hours
    And member "987654321" does not exist in the system
    When the caller dials the IVR number
    And the caller presses "1" for English
    Then the system plays the English greeting
    And the Lex bot "HealthcareAuthBot" prompts for member ID
    When the caller enters "987654321" via DTMF
    And the caller enters "06201990" via DTMF
    And the caller confirms the authentication details
    Then the system invokes Lambda "ValidateAuthentication"
    And the Lambda returns authentication result "failure"
    And the system increments retryCount to 1
    And the system plays "We were unable to verify your information. Please try again."
    And the Lex bot "HealthcareAuthBot" re-prompts for member ID
    When the caller enters "123456789" via DTMF
    And the caller enters "01151985" via DTMF
    And the caller confirms the authentication details
    Then the system invokes Lambda "ValidateAuthentication"
    And the Lambda returns authentication result "success"
    And the system sets authStatus to "authenticated"
    And the system plays the main menu

  # -----------------------------------------------------------------------
  # Scenario 4: Authentication max attempts exceeded
  # -----------------------------------------------------------------------
  Scenario: Authentication fails three times and call is terminated
    Given the current time is within business hours
    And the caller provides invalid credentials on every attempt
    When the caller dials the IVR number
    And the caller presses "1" for English
    Then the system plays the English greeting
    # Attempt 1
    When the caller provides invalid member ID "111111111" and DOB "01011970"
    Then the Lambda returns authentication result "failure"
    And the system increments retryCount to 1
    And the system plays "We were unable to verify your information. Please try again."
    # Attempt 2
    When the caller provides invalid member ID "222222222" and DOB "02021980"
    Then the Lambda returns authentication result "failure"
    And the system increments retryCount to 2
    And the system plays "We were unable to verify your information. Please try again."
    # Attempt 3
    When the caller provides invalid member ID "333333333" and DOB "03031990"
    Then the Lambda returns authentication result "failure"
    And the system increments retryCount to 3
    And retryCount is greater than or equal to 3
    Then the system plays "We are sorry. We were unable to verify your identity after multiple attempts. For your security, this call will now end. Please call back or visit our website for assistance. Goodbye."
    And the call is disconnected

  # -----------------------------------------------------------------------
  # Scenario 5: After-hours callback request
  # -----------------------------------------------------------------------
  Scenario: After-hours caller requests a callback
    Given the current time is outside business hours
    When the caller dials the IVR number
    Then the system invokes Lambda "CheckBusinessHours"
    And the Lambda returns businessHoursStatus "closed"
    And the system plays "For English, press 1. Para español, oprima el número 2."
    When the caller presses "1"
    Then the system sets the voice to "Joanna"
    And the system plays "Thank you for calling the Healthcare Authorization Center. Our office is currently closed. Our business hours are Monday through Friday, 8 AM to 6 PM Eastern Time."
    And the system plays "Press 1 to request a callback during our next business day, or press 2 to leave a voicemail message."
    When the caller presses "1"
    Then the system plays "Please say or enter the 10-digit phone number where you would like to be reached, followed by the pound key."
    When the caller enters "5551234567#" via DTMF
    Then the system invokes the callback Lambda
    And the system plays "We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye."
    And the call is disconnected

  # -----------------------------------------------------------------------
  # Scenario 6: After-hours voicemail
  # -----------------------------------------------------------------------
  Scenario: After-hours caller leaves a voicemail
    Given the current time is outside business hours
    When the caller dials the IVR number
    And the caller presses "1" for English
    Then the system plays the after-hours closed message
    And the system plays "Press 1 to request a callback during our next business day, or press 2 to leave a voicemail message."
    When the caller presses "2"
    Then the system plays "Please leave your message after the tone. Press the pound key when you are finished."
    And the system plays a tone
    When the caller records a voicemail message
    And the caller presses "#"
    Then the voicemail is stored
    And the call is disconnected

  # -----------------------------------------------------------------------
  # Scenario 7: Queue escalation Tier 1 to Tier 2
  # -----------------------------------------------------------------------
  Scenario: Agent request escalated from Tier 1 to Tier 2 when Tier 1 is full
    Given the current time is within business hours
    And the Tier1AuthQueue is at capacity
    And the Tier2AuthQueue has available agents
    When the caller dials the IVR number
    And the caller presses "1" for English
    And the caller authenticates successfully
    And the system plays the main menu
    When the caller presses "2"
    Then the Lex bot matches "SpeakToAgentIntent"
    And the system plays "Please hold while we connect you with the next available agent."
    And the system attempts transfer to "Tier1AuthQueue"
    And the queue returns "at capacity"
    Then the system plays "All Tier 1 agents are currently busy. We are connecting you with our specialized support team. Please continue to hold."
    And the system transfers the call to "Tier2AuthQueue"
    And the caller is connected to an agent

  # -----------------------------------------------------------------------
  # Scenario 8: Queue full - callback offered and accepted
  # -----------------------------------------------------------------------
  Scenario: Both queues full, caller accepts callback offer
    Given the current time is within business hours
    And the Tier1AuthQueue is at capacity
    And the Tier2AuthQueue is at capacity
    When the caller dials the IVR number
    And the caller presses "1" for English
    And the caller authenticates successfully
    And the system plays the main menu
    When the caller presses "2"
    Then the Lex bot matches "SpeakToAgentIntent"
    And the system plays "Please hold while we connect you with the next available agent."
    And the system attempts transfer to "Tier1AuthQueue" which returns "at capacity"
    And the system plays "All Tier 1 agents are currently busy. We are connecting you with our specialized support team. Please continue to hold."
    And the system attempts transfer to "Tier2AuthQueue" which returns "at capacity"
    And the system plays "We apologize, but all of our agents are currently unavailable. Press 1 to request a callback, or press 2 to end the call."
    When the caller presses "1"
    Then the system plays "Please say or enter the 10-digit phone number where you would like to be reached, followed by the pound key."
    When the caller enters "5551234567#" via DTMF
    Then the system invokes Lambda "CreateCallback"
    And the system plays "We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye."
    And the call is disconnected

  # -----------------------------------------------------------------------
  # Scenario 9: Lex fallback / no-match at main menu
  # -----------------------------------------------------------------------
  Scenario: Unrecognized input at main menu triggers FallbackIntent and retry
    Given the current time is within business hours
    When the caller dials the IVR number
    And the caller presses "1" for English
    And the caller authenticates successfully
    And the system plays the main menu
    When the caller says "I need to refill my prescription"
    Then the Lex bot matches "FallbackIntent"
    And the system plays "I am sorry, I did not understand that selection. Please try again."
    And the system replays the main menu
    When the caller says "check authorization status"
    Then the Lex bot matches "CheckAuthorizationStatusIntent"
    And the flow proceeds normally

  # -----------------------------------------------------------------------
  # Scenario 10: Timeout handling at main menu
  # -----------------------------------------------------------------------
  Scenario: Silence at main menu triggers timeout and retry
    Given the current time is within business hours
    When the caller dials the IVR number
    And the caller presses "1" for English
    And the caller authenticates successfully
    And the system plays the main menu
    When the caller provides no input for 10 seconds
    Then the Lex bot triggers timeout via "FallbackIntent"
    And the system plays "I am sorry, I did not understand that selection. Please try again."
    And the system replays the main menu
    When the caller presses "2"
    Then the Lex bot matches "SpeakToAgentIntent"
    And the system plays "Please hold while we connect you with the next available agent."
    And the call is transferred to "Tier1AuthQueue"

  # -----------------------------------------------------------------------
  # Scenario 11: Three consecutive main menu failures lead to disconnect
  # -----------------------------------------------------------------------
  Scenario: Three consecutive failures at main menu result in disconnect
    Given the current time is within business hours
    When the caller dials the IVR number
    And the caller presses "1" for English
    And the caller authenticates successfully
    And the system plays the main menu
    When the caller says "what are your hours?"
    Then the system plays "I am sorry, I did not understand that selection. Please try again."
    And the system replays the main menu
    When the caller says "help me please"
    Then the system plays "I am sorry, I did not understand that selection. Please try again."
    And the system replays the main menu
    When the caller says "I don't know what to say"
    Then the system detects the third consecutive failure
    And the system plays "Thank you for calling the Healthcare Authorization Center. Goodbye."
    And the call is disconnected

  # -----------------------------------------------------------------------
  # Scenario 12: Language selection timeout defaults to English
  # -----------------------------------------------------------------------
  Scenario: No input at language selection defaults to English
    Given the current time is within business hours
    When the caller dials the IVR number
    Then the system plays "For English, press 1. Para español, oprima el número 2."
    When the caller provides no input for 10 seconds
    Then the system defaults to English
    And the system sets the voice to "Joanna"
    And the system plays "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."
    And the authentication flow begins in English
```

---

# Part 3: Structured JSON Test Specifications

---

```json
[
  {
    "id": "TC-001",
    "name": "Happy Path - English DTMF - Check Auth Status (Approved)",
    "category": "happy_path",
    "language": "en",
    "inputMethod": "dtmf",
    "businessHours": true,
    "preconditions": {
      "memberId": "123456789",
      "dateOfBirth": "01/15/1985",
      "authResult": "success",
      "authorizationStatus": "approved"
    },
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays: 'For English, press 1. Para español, oprima el número 2.'"},
      {"action": "dtmf", "input": "1", "expected": "Voice set to Joanna. Greeting plays: 'Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance.'"},
      {"action": "dtmf", "input": "123456789", "expected": "Lex bot captures memberId. DOB prompt plays."},
      {"action": "dtmf", "input": "01151985", "expected": "Lex bot captures dateOfBirth. Confirmation prompt plays: 'I have your member ID as 123456789 and date of birth as January 15, 1985. Is that correct?'"},
      {"action": "voice", "input": "yes", "expected": "Lambda ValidateAuthentication returns success. authStatus set to authenticated. Main menu plays."},
      {"action": "dtmf", "input": "1", "expected": "Lex bot matches CheckAuthorizationStatusIntent. Lambda GetAuthStatus returns approved. System plays: 'Your authorization request is currently approved. If you need further assistance, you will now be connected to an agent.'"}
    ],
    "expectedOutcome": "Call transferred to Tier1AuthQueue",
    "priority": "P1",
    "relatedScenarios": [1]
  },
  {
    "id": "TC-002",
    "name": "Happy Path - English DTMF - Speak to Agent",
    "category": "happy_path",
    "language": "en",
    "inputMethod": "dtmf",
    "businessHours": true,
    "preconditions": {
      "memberId": "123456789",
      "dateOfBirth": "01/15/1985",
      "authResult": "success",
      "queueStatus": "available"
    },
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays"},
      {"action": "dtmf", "input": "1", "expected": "English greeting plays"},
      {"action": "dtmf", "input": "123456789", "expected": "Lex bot captures memberId"},
      {"action": "dtmf", "input": "01151985", "expected": "Lex bot captures dateOfBirth. Confirmation prompt plays."},
      {"action": "voice", "input": "yes", "expected": "Auth success. Main menu plays."},
      {"action": "dtmf", "input": "2", "expected": "Lex bot matches SpeakToAgentIntent. System plays: 'Please hold while we connect you with the next available agent.'"}
    ],
    "expectedOutcome": "Call transferred to Tier1AuthQueue, agent connects",
    "priority": "P1",
    "relatedScenarios": [2]
  },
  {
    "id": "TC-003",
    "name": "Happy Path - English DTMF - Request Callback",
    "category": "happy_path",
    "language": "en",
    "inputMethod": "dtmf",
    "businessHours": true,
    "preconditions": {
      "memberId": "123456789",
      "dateOfBirth": "01/15/1985",
      "authResult": "success"
    },
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays"},
      {"action": "dtmf", "input": "1", "expected": "English greeting plays"},
      {"action": "dtmf", "input": "123456789", "expected": "Lex bot captures memberId"},
      {"action": "dtmf", "input": "01151985", "expected": "Confirmation prompt plays"},
      {"action": "voice", "input": "yes", "expected": "Auth success. Main menu plays."},
      {"action": "dtmf", "input": "3", "expected": "Lex bot matches RequestCallbackIntent. System plays: 'Please say or enter the 10-digit phone number where you would like to be reached, followed by the pound key.'"},
      {"action": "dtmf", "input": "5551234567#", "expected": "Lambda CreateCallback executes. System plays: 'We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye.'"}
    ],
    "expectedOutcome": "Callback scheduled, call disconnected",
    "priority": "P1",
    "relatedScenarios": [3]
  },
  {
    "id": "TC-004",
    "name": "Happy Path - English Voice Keywords - Check Auth Status (Pending)",
    "category": "happy_path",
    "language": "en",
    "inputMethod": "voice",
    "businessHours": true,
    "preconditions": {
      "memberId": "123456789",
      "dateOfBirth": "01/15/1985",
      "authResult": "success",
      "authorizationStatus": "pending"
    },
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays"},
      {"action": "dtmf", "input": "1", "expected": "English greeting plays"},
      {"action": "voice", "input": "one two three four five six seven eight nine", "expected": "Lex bot captures memberId as 123456789"},
      {"action": "voice", "input": "January fifteenth nineteen eighty-five", "expected": "Confirmation prompt plays"},
      {"action": "voice", "input": "yes", "expected": "Auth success. Main menu plays."},
      {"action": "voice", "input": "check status", "expected": "Lex bot matches CheckAuthorizationStatusIntent. System plays: 'Your authorization request is currently pending. If you need further assistance, you will now be connected to an agent.'"}
    ],
    "expectedOutcome": "Call transferred to Tier1AuthQueue",
    "priority": "P1",
    "relatedScenarios": [4]
  },
  {
    "id": "TC-005",
    "name": "Happy Path - English Voice Full Phrase - Speak to Agent",
    "category": "happy_path",
    "language": "en",
    "inputMethod": "voice",
    "businessHours": true,
    "preconditions": {
      "memberId": "123456789",
      "dateOfBirth": "01/15/1985",
      "authResult": "success",
      "queueStatus": "available"
    },
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays"},
      {"action": "dtmf", "input": "1", "expected": "English greeting plays"},
      {"action": "voice", "input": "my member ID is one two three four five six seven eight nine", "expected": "Lex bot captures memberId"},
      {"action": "voice", "input": "my date of birth is January fifteen, nineteen eighty-five", "expected": "Confirmation prompt plays"},
      {"action": "voice", "input": "that is correct", "expected": "Auth success. Main menu plays."},
      {"action": "voice", "input": "I want to talk to a person", "expected": "Lex bot matches SpeakToAgentIntent. System plays: 'Please hold while we connect you with the next available agent.'"}
    ],
    "expectedOutcome": "Call transferred to Tier1AuthQueue, agent connects",
    "priority": "P1",
    "relatedScenarios": [5]
  },
  {
    "id": "TC-006",
    "name": "Happy Path - English Voice Synonym - Request Callback",
    "category": "happy_path",
    "language": "en",
    "inputMethod": "voice",
    "businessHours": true,
    "preconditions": {
      "memberId": "123456789",
      "dateOfBirth": "01/15/1985",
      "authResult": "success"
    },
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays"},
      {"action": "dtmf", "input": "1", "expected": "English greeting plays"},
      {"action": "voice", "input": "one two three four five six seven eight nine", "expected": "Lex bot captures memberId"},
      {"action": "voice", "input": "oh one fifteen eighty-five", "expected": "Confirmation prompt plays"},
      {"action": "voice", "input": "yes", "expected": "Auth success. Main menu plays."},
      {"action": "voice", "input": "have someone call me", "expected": "Lex bot matches RequestCallbackIntent. Phone number collection prompt plays."},
      {"action": "voice", "input": "five five five nine eight seven six five four three", "expected": "Lambda CreateCallback executes. Callback confirmed. System plays: 'We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye.'"}
    ],
    "expectedOutcome": "Callback scheduled, call disconnected",
    "priority": "P1",
    "relatedScenarios": [6]
  },
  {
    "id": "TC-007",
    "name": "Happy Path - Spanish DTMF - Check Auth Status",
    "category": "happy_path",
    "language": "es",
    "inputMethod": "dtmf",
    "businessHours": true,
    "preconditions": {
      "memberId": "123456789",
      "dateOfBirth": "01/15/1985",
      "authResult": "success",
      "authorizationStatus": "approved"
    },
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays"},
      {"action": "dtmf", "input": "2", "expected": "Voice set to Lupe. Language set to es. Spanish greeting plays."},
      {"action": "dtmf", "input": "123456789", "expected": "Lex bot captures memberId"},
      {"action": "dtmf", "input": "01151985", "expected": "Spanish confirmation prompt plays"},
      {"action": "voice", "input": "si", "expected": "Auth success. Spanish main menu plays via HealthcareAuthMainMenuBotES."},
      {"action": "dtmf", "input": "1", "expected": "Lex bot matches CheckAuthorizationStatusIntent. Lambda GetAuthStatus returns approved. Spanish status message plays."}
    ],
    "expectedOutcome": "Call transferred to Tier1AuthQueue",
    "priority": "P1",
    "relatedScenarios": [7]
  },
  {
    "id": "TC-008",
    "name": "Happy Path - Spanish Voice - Speak to Agent",
    "category": "happy_path",
    "language": "es",
    "inputMethod": "voice",
    "businessHours": true,
    "preconditions": {
      "memberId": "123456789",
      "dateOfBirth": "01/15/1985",
      "authResult": "success",
      "queueStatus": "available"
    },
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays"},
      {"action": "dtmf", "input": "2", "expected": "Voice set to Lupe. Spanish greeting plays."},
      {"action": "voice", "input": "uno dos tres cuatro cinco seis siete ocho nueve", "expected": "Lex bot captures memberId"},
      {"action": "voice", "input": "quince de enero de mil novecientos ochenta y cinco", "expected": "Spanish confirmation prompt plays"},
      {"action": "voice", "input": "si, correcto", "expected": "Auth success. Spanish main menu plays."},
      {"action": "voice", "input": "hablar con un agente", "expected": "Lex bot matches SpeakToAgentIntent. Spanish hold message plays."}
    ],
    "expectedOutcome": "Call transferred to Tier1AuthQueue, agent connects",
    "priority": "P1",
    "relatedScenarios": [8]
  },
  {
    "id": "TC-009",
    "name": "Mixed Input - DTMF Language + Voice Auth + DTMF Menu",
    "category": "happy_path",
    "language": "en",
    "inputMethod": "mixed",
    "businessHours": true,
    "preconditions": {
      "memberId": "123456789",
      "dateOfBirth": "01/15/1985",
      "authResult": "success",
      "queueStatus": "available"
    },
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays"},
      {"action": "dtmf", "input": "1", "expected": "English greeting plays"},
      {"action": "voice", "input": "one two three four five six seven eight nine", "expected": "Lex bot captures memberId via voice"},
      {"action": "voice", "input": "January fifteenth nineteen eighty-five", "expected": "Confirmation prompt plays"},
      {"action": "voice", "input": "yes", "expected": "Auth success. Main menu plays."},
      {"action": "dtmf", "input": "2", "expected": "Lex bot matches SpeakToAgentIntent via DTMF. System plays: 'Please hold while we connect you with the next available agent.'"}
    ],
    "expectedOutcome": "Call transferred to Tier1AuthQueue, agent connects",
    "priority": "P2",
    "relatedScenarios": [9]
  },
  {
    "id": "TC-010",
    "name": "Auth Failure - Retry Once - Success on Second Attempt",
    "category": "auth_failure",
    "language": "en",
    "inputMethod": "dtmf",
    "businessHours": true,
    "preconditions": {
      "invalidMemberId": "987654321",
      "validMemberId": "123456789",
      "dateOfBirth": "01/15/1985",
      "firstAuthResult": "failure",
      "secondAuthResult": "success"
    },
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays"},
      {"action": "dtmf", "input": "1", "expected": "English greeting plays"},
      {"action": "dtmf", "input": "987654321", "expected": "Lex bot captures invalid memberId"},
      {"action": "dtmf", "input": "06201990", "expected": "Confirmation prompt plays"},
      {"action": "voice", "input": "yes", "expected": "Lambda returns failure. retryCount=1. System plays: 'We were unable to verify your information. Please try again.'"},
      {"action": "dtmf", "input": "123456789", "expected": "Lex bot captures correct memberId"},
      {"action": "dtmf", "input": "01151985", "expected": "Confirmation prompt plays"},
      {"action": "voice", "input": "yes", "expected": "Lambda returns success. authStatus=authenticated. Main menu plays."}
    ],
    "expectedOutcome": "Caller authenticated on second attempt, main menu presented",
    "priority": "P1",
    "relatedScenarios": [10]
  },
  {
    "id": "TC-011",
    "name": "Auth Failure - Max 3 Attempts - Disconnect",
    "category": "auth_failure",
    "language": "en",
    "inputMethod": "dtmf",
    "businessHours": true,
    "preconditions": {
      "authResult": "failure_all_attempts"
    },
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays"},
      {"action": "dtmf", "input": "1", "expected": "English greeting plays"},
      {"action": "auth_attempt", "input": {"memberId": "111111111", "dob": "01011970"}, "expected": "Auth failure. retryCount=1. System plays: 'We were unable to verify your information. Please try again.'"},
      {"action": "auth_attempt", "input": {"memberId": "222222222", "dob": "02021980"}, "expected": "Auth failure. retryCount=2. System plays: 'We were unable to verify your information. Please try again.'"},
      {"action": "auth_attempt", "input": {"memberId": "333333333", "dob": "03031990"}, "expected": "Auth failure. retryCount=3. System plays: 'We are sorry. We were unable to verify your identity after multiple attempts. For your security, this call will now end. Please call back or visit our website for assistance. Goodbye.'"}
    ],
    "expectedOutcome": "Call disconnected after 3 failed authentication attempts",
    "priority": "P1",
    "relatedScenarios": [11]
  },
  {
    "id": "TC-012",
    "name": "Auth Partial Failure - Wrong Member ID Format - Lex Re-prompt",
    "category": "auth_failure",
    "language": "en",
    "inputMethod": "dtmf",
    "businessHours": true,
    "preconditions": {
      "memberId": "123456789",
      "dateOfBirth": "01/15/1985",
      "authResult": "success"
    },
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays"},
      {"action": "dtmf", "input": "1", "expected": "English greeting plays"},
      {"action": "dtmf", "input": "12345", "expected": "Lex bot detects invalid memberId format (only 5 digits). Re-prompts for 9-digit member ID."},
      {"action": "dtmf", "input": "123456789", "expected": "Lex bot captures valid memberId"},
      {"action": "dtmf", "input": "01151985", "expected": "Confirmation prompt plays"},
      {"action": "voice", "input": "yes", "expected": "Auth success. Main menu plays."}
    ],
    "expectedOutcome": "Caller authenticated after Lex slot re-prompt, main menu presented",
    "priority": "P2",
    "relatedScenarios": [12]
  },
  {
    "id": "TC-013",
    "name": "Main Menu - Unrecognized Voice - FallbackIntent - Retry Success",
    "category": "error_path",
    "language": "en",
    "inputMethod": "voice",
    "businessHours": true,
    "preconditions": {
      "authStatus": "authenticated"
    },
    "steps": [
      {"action": "precondition", "input": "Caller authenticated", "expected": "Main menu plays: 'How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback.'"},
      {"action": "voice", "input": "I need to refill my prescription", "expected": "Lex bot matches FallbackIntent. System plays: 'I am sorry, I did not understand that selection. Please try again.' Main menu replays."},
      {"action": "voice", "input": "check authorization status", "expected": "Lex bot matches CheckAuthorizationStatusIntent. Lambda GetAuthStatus executes. Flow proceeds normally."}
    ],
    "expectedOutcome": "Caller recovers from error, authorization status checked, transferred to Tier1AuthQueue",
    "priority": "P2",
    "relatedScenarios": [13]
  },
  {
    "id": "TC-014",
    "name": "Main Menu - Timeout/Silence - FallbackIntent - Retry",
    "category": "error_path",
    "language": "en",
    "inputMethod": "none",
    "businessHours": true,
    "preconditions": {
      "authStatus": "authenticated"
    },
    "steps": [
      {"action": "precondition", "input": "Caller authenticated", "expected": "Main menu plays"},
      {"action": "silence", "input": "10+ seconds", "expected": "Lex bot timeout. FallbackIntent triggered. System plays: 'I am sorry, I did not understand that selection. Please try again.' Main menu replays."},
      {"action": "dtmf", "input": "2", "expected": "Lex bot matches SpeakToAgentIntent. System plays: 'Please hold while we connect you with the next available agent.'"}
    ],
    "expectedOutcome": "Caller recovers from timeout, transferred to Tier1AuthQueue",
    "priority": "P2",
    "relatedScenarios": [14]
  },
  {
    "id": "TC-015",
    "name": "Main Menu - 3 Consecutive Failures - Disconnect",
    "category": "error_path",
    "language": "en",
    "inputMethod": "voice",
    "businessHours": true,
    "preconditions": {
      "authStatus": "authenticated"
    },
    "steps": [
      {"action": "precondition", "input": "Caller authenticated", "expected": "Main menu plays"},
      {"action": "voice", "input": "what are your hours of operation?", "expected": "FallbackIntent. System plays: 'I am sorry, I did not understand that selection. Please try again.' Menu replays."},
      {"action": "voice", "input": "can you repeat the options?", "expected": "FallbackIntent. System plays: 'I am sorry, I did not understand that selection. Please try again.' Menu replays."},
      {"action": "voice", "input": "I don't understand", "expected": "FallbackIntent. Third failure. System plays: 'Thank you for calling the Healthcare Authorization Center. Goodbye.'"}
    ],
    "expectedOutcome": "Call disconnected after 3 consecutive main menu failures",
    "priority": "P1",
    "relatedScenarios": [15]
  },
  {
    "id": "TC-016",
    "name": "Language Selection - Invalid DTMF - Default English",
    "category": "error_path",
    "language": "en",
    "inputMethod": "dtmf",
    "businessHours": true,
    "preconditions": {},
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays: 'For English, press 1. Para español, oprima el número 2.'"},
      {"action": "dtmf", "input": "5", "expected": "Invalid input detected. System defaults to English. Voice set to Joanna. Greeting plays: 'Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance.'"}
    ],
    "expectedOutcome": "System defaults to English, authentication flow begins",
    "priority": "P2",
    "relatedScenarios": [16]
  },
  {
    "id": "TC-017",
    "name": "Language Selection - Timeout - Default English",
    "category": "error_path",
    "language": "en",
    "inputMethod": "none",
    "businessHours": true,
    "preconditions": {},
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays"},
      {"action": "silence", "input": "10+ seconds", "expected": "Timeout detected. System defaults to English. Voice set to Joanna. Greeting plays: 'Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance.'"}
    ],
    "expectedOutcome": "System defaults to English, authentication flow begins",
    "priority": "P2",
    "relatedScenarios": [17]
  },
  {
    "id": "TC-018",
    "name": "After-Hours - English - Callback Request",
    "category": "after_hours",
    "language": "en",
    "inputMethod": "dtmf",
    "businessHours": false,
    "preconditions": {},
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays"},
      {"action": "dtmf", "input": "1", "expected": "Voice set to Joanna. System plays: 'Thank you for calling the Healthcare Authorization Center. Our office is currently closed. Our business hours are Monday through Friday, 8 AM to 6 PM Eastern Time.' After-hours menu plays: 'Press 1 to request a callback during our next business day, or press 2 to leave a voicemail message.'"},
      {"action": "dtmf", "input": "1", "expected": "System plays: 'Please say or enter the 10-digit phone number where you would like to be reached, followed by the pound key.'"},
      {"action": "dtmf", "input": "5551234567#", "expected": "Callback scheduled. System plays: 'We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye.'"}
    ],
    "expectedOutcome": "Callback scheduled, call disconnected",
    "priority": "P1",
    "relatedScenarios": [18]
  },
  {
    "id": "TC-019",
    "name": "After-Hours - English - Voicemail",
    "category": "after_hours",
    "language": "en",
    "inputMethod": "dtmf",
    "businessHours": false,
    "preconditions": {},
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays"},
      {"action": "dtmf", "input": "1", "expected": "After-hours message and menu plays"},
      {"action": "dtmf", "input": "2", "expected": "System plays: 'Please leave your message after the tone. Press the pound key when you are finished.' Tone plays."},
      {"action": "voice", "input": "Voicemail message content", "expected": "Message being recorded"},
      {"action": "dtmf", "input": "#", "expected": "Voicemail stored."}
    ],
    "expectedOutcome": "Voicemail recorded and stored, call disconnected",
    "priority": "P1",
    "relatedScenarios": [19]
  },
  {
    "id": "TC-020",
    "name": "After-Hours - Spanish - Callback Request",
    "category": "after_hours",
    "language": "es",
    "inputMethod": "dtmf",
    "businessHours": false,
    "preconditions": {},
    "steps": [
      {"action": "dial", "input": "+1-800-555-0199", "expected": "Language selection prompt plays"},
      {"action": "dtmf", "input": "2", "expected": "Voice set to Lupe. Spanish after-hours message plays. Spanish after-hours menu plays."},
      {"action": "dtmf", "input": "1", "expected": "Spanish phone number collection prompt plays"},
      {"action": "dtmf", "input": "5559876543#", "expected": "Callback scheduled. Spanish confirmation message plays."}
    ],
    "expectedOutcome": "Callback scheduled in Spanish, call disconnected",
    "priority": "P1",
    "relatedScenarios": [20]
  },
  {
    "id": "TC-021",
    "name": "Queue Escalation - Tier 1 Full - Tier 2 Connected",
    "category": "queue_fallback",
    "language": "en",
    "inputMethod": "dtmf",
    "businessHours": true,
    "preconditions": {
      "authStatus": "authenticated",
      "tier1QueueStatus": "at_capacity",
      "tier2QueueStatus": "available"
    },
    "steps": [
      {"action": "precondition", "input": "Caller authenticated", "expected": "Main menu plays"},
      {"action": "dtmf", "input": "2", "expected": "Lex bot matches SpeakToAgentIntent. System plays: 'Please hold while we connect you with the next available agent.'"},
      {"action": "system", "input": "Transfer to Tier1AuthQueue", "expected": "Queue at capacity. System plays: 'All Tier 1 agents are currently busy. We are connecting you with our specialized support team. Please continue to hold.'"},
      {"action": "system", "input": "Transfer to Tier2AuthQueue", "expected": "Agent connects."}
    ],
    "expectedOutcome": "Call transferred to Tier2AuthQueue, agent connects",
    "priority": "P1",
    "relatedScenarios": [22]
  },
  {
    "id": "TC-022",
    "name": "Queue Escalation - Both Full - Callback Accepted",
    "category": "queue_fallback",
    "language": "en",
    "inputMethod": "dtmf",
    "businessHours": true,
    "preconditions": {
      "authStatus": "authenticated",
      "tier1QueueStatus": "at_capacity",
      "tier2QueueStatus": "at_capacity"
    },
    "steps": [
      {"action": "precondition", "input": "Caller authenticated", "expected": "Main menu plays"},
      {"action": "dtmf", "input": "2", "expected": "SpeakToAgentIntent matched. System plays: 'Please hold while we connect you with the next available agent.'"},
      {"action": "system", "input": "Transfer to Tier1AuthQueue", "expected": "At capacity. System plays: 'All Tier 1 agents are currently busy. We are connecting you with our specialized support team. Please continue to hold.'"},
      {"action": "system", "input": "Transfer to Tier2AuthQueue", "expected": "At capacity. System plays: 'We apologize, but all of our agents are currently unavailable. Press 1 to request a callback, or press 2 to end the call.'"},
      {"action": "dtmf", "input": "1", "expected": "System plays: 'Please say or enter the 10-digit phone number where you would like to be reached, followed by the pound key.'"},
      {"action": "dtmf", "input": "5551234567#", "expected": "Lambda CreateCallback executes. System plays: 'We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye.'"}
    ],
    "expectedOutcome": "Callback scheduled, call disconnected",
    "priority": "P1",
    "relatedScenarios": [23]
  },
  {
    "id": "TC-023",
    "name": "Queue Escalation - Both Full - Callback Declined - Disconnect",
    "category": "queue_fallback",
    "language": "en",
    "inputMethod": "dtmf",
    "businessHours": true,
    "preconditions": {
      "authStatus": "authenticated",
      "tier1QueueStatus": "at_capacity",
      "tier2QueueStatus": "at_capacity"
    },
    "steps": [
      {"action": "precondition", "input": "Caller authenticated", "expected": "Main menu plays"},
      {"action": "dtmf", "input": "2", "expected": "SpeakToAgentIntent matched. System plays: 'Please hold while we connect you with the next available agent.'"},
      {"action": "system", "input": "Transfer to Tier1AuthQueue", "expected": "At capacity. System plays: 'All Tier 1 agents are currently busy. We are connecting you with our specialized support team. Please continue to hold.'"},
      {"action": "system", "input": "Transfer to Tier2AuthQueue", "expected": "At capacity. System plays: 'We apologize, but all of our agents are currently unavailable. Press 1 to request a callback, or press 2 to end the call.'"},
      {"action": "dtmf", "input": "2", "expected": "System plays: 'Thank you for calling the Healthcare Authorization Center. Goodbye.'"}
    ],
    "expectedOutcome": "Call disconnected gracefully",
    "priority": "P1",
    "relatedScenarios": [24]
  },
  {
    "id": "TC-024",
    "name": "Auth Status Not Found - Agent Transfer",
    "category": "edge_case",
    "language": "en",
    "inputMethod": "voice",
    "businessHours": true,
    "preconditions": {
      "authStatus": "authenticated",
      "authorizationStatus": "not_found"
    },
    "steps": [
      {"action": "precondition", "input": "Caller authenticated", "expected": "Main menu plays"},
      {"action": "voice", "input": "what is my authorization status", "expected": "Lex bot matches CheckAuthorizationStatusIntent. Lambda GetAuthStatus returns not_found. System plays: 'We were unable to find any pending authorizations associated with your account. You will now be connected to an agent for further assistance.'"}
    ],
    "expectedOutcome": "Call transferred to Tier1AuthQueue",
    "priority": "P2",
    "relatedScenarios": [25]
  },
  {
    "id": "TC-025",
    "name": "Special Keys at Main Menu - # and * - Error Handling",
    "category": "edge_case",
    "language": "en",
    "inputMethod": "dtmf",
    "businessHours": true,
    "preconditions": {
      "authStatus": "authenticated"
    },
    "steps": [
      {"action": "precondition", "input": "Caller authenticated", "expected": "Main menu plays"},
      {"action": "dtmf", "input": "#", "expected": "Lex bot matches FallbackIntent. System plays: 'I am sorry, I did not understand that selection. Please try again.' Main menu replays."},
      {"action": "dtmf", "input": "*", "expected": "Lex bot matches FallbackIntent. System plays: 'I am sorry, I did not understand that selection. Please try again.' Main menu replays."},
      {"action": "dtmf", "input": "3", "expected": "Lex bot matches RequestCallbackIntent. Callback flow begins."}
    ],
    "expectedOutcome": "Caller recovers after # and * errors, proceeds to callback flow",
    "priority": "P3",
    "relatedScenarios": [27]
  }
]
```

---

# Coverage Matrix

The following matrix maps every IVR path and condition to the test cases that cover it.

## Path Coverage

| IVR Path / Condition | Manual Scenario(s) | Gherkin Scenario(s) | JSON TC(s) | Priority |
|---|---|---|---|---|
| **LANGUAGE SELECTION** | | | | |
| English via DTMF (press 1) | 1, 2, 3, 4, 5, 6, 9 | 1, 3, 4, 5, 7, 8, 9, 10, 11 | TC-001 thru TC-006, TC-009 thru TC-015 | P1 |
| Spanish via DTMF (press 2) | 7, 8, 20 | 2 | TC-007, TC-008, TC-020 | P1 |
| Invalid DTMF at language selection | 16 | 12 | TC-016 | P2 |
| Timeout at language selection | 17 | 12 | TC-017 | P2 |
| **BUSINESS HOURS** | | | | |
| In-hours (businessHoursStatus=open) | 1-17, 22-28, 30-32 | 1-4, 7-11 | TC-001 thru TC-017, TC-021 thru TC-025 | P1 |
| After-hours (businessHoursStatus=closed) | 18, 19, 20, 21, 29 | 5, 6 | TC-018, TC-019, TC-020 | P1 |
| **AUTHENTICATION** | | | | |
| Auth success (first attempt) | 1-9, 13-15, 22-28, 31, 32 | 1, 2, 7, 8, 9, 10, 11 | TC-001 thru TC-009, TC-013 thru TC-015, TC-021 thru TC-025 | P1 |
| Auth failure then retry success | 10 | 3 | TC-010 | P1 |
| Auth failure x3 then disconnect | 11 | 4 | TC-011 | P1 |
| Auth slot validation (wrong format) | 12 | -- | TC-012 | P2 |
| Auth confirmation denied (re-collect) | 30 | -- | -- | P2 |
| **MAIN MENU -- CHECK AUTH STATUS** | | | | |
| DTMF (press 1) | 1 | 1 | TC-001 | P1 |
| Voice keyword ("check status") | 4 | -- | TC-004 | P1 |
| Voice full phrase ("what is my authorization status") | 25, 31 | -- | TC-024 | P1 |
| Auth status = approved | 1 | 1 | TC-001 | P1 |
| Auth status = pending | 4 | -- | TC-004 | P2 |
| Auth status = denied | 32 | -- | -- | P2 |
| Auth status = not found | 25 | -- | TC-024 | P2 |
| **MAIN MENU -- SPEAK TO AGENT** | | | | |
| DTMF (press 2) | 2, 22, 24, 28 | 7, 8, 10 | TC-002, TC-021 thru TC-023 | P1 |
| Voice full phrase ("I want to talk to a person") | 5 | -- | TC-005 | P1 |
| Voice synonym ("speak to an agent") | 23 | -- | -- | P1 |
| **MAIN MENU -- REQUEST CALLBACK** | | | | |
| DTMF (press 3) | 3 | -- | TC-003 | P1 |
| Voice synonym ("have someone call me") | 6 | -- | TC-006 | P1 |
| **MAIN MENU -- FALLBACK/ERROR** | | | | |
| Unrecognized voice input | 13, 26 | 9 | TC-013 | P2 |
| Timeout / silence | 14 | 10 | TC-014 | P2 |
| 3 consecutive failures -- disconnect | 15 | 11 | TC-015 | P1 |
| Special keys (# and *) | 27 | -- | TC-025 | P3 |
| **QUEUE ESCALATION** | | | | |
| Tier 1 available -- connected | 2, 5 | -- | TC-002 | P1 |
| Tier 1 full -- Tier 2 escalation -- connected | 22 | 7 | TC-021 | P1 |
| Tier 1 full -- Tier 2 full -- callback accepted | 23 | 8 | TC-022 | P1 |
| Tier 1 full -- Tier 2 full -- callback declined | 24 | -- | TC-023 | P1 |
| **AFTER-HOURS MENU** | | | | |
| Callback request (English) | 18 | 5 | TC-018 | P1 |
| Voicemail (English) | 19 | 6 | TC-019 | P1 |
| Callback request (Spanish) | 20 | -- | TC-020 | P1 |
| Invalid input -- retry | 21 | -- | -- | P2 |
| 3 invalid inputs -- disconnect | 29 | -- | -- | P2 |
| **EDGE CASES** | | | | |
| Barge-in (rapid DTMF during prompt) | 28 | -- | -- | P3 |
| Auth confirmation denied -- re-collect | 30 | -- | -- | P2 |
| Hesitant/casual speech at main menu | 31 | -- | -- | P3 |
| Auth status "denied" readback | 32 | -- | -- | P2 |

## Summary Statistics

| Metric | Count |
|---|---|
| Total Manual QA Scenarios | 32 |
| Total Gherkin BDD Scenarios | 12 |
| Total JSON Test Cases | 25 |
| Happy Path Scenarios | 9 |
| Auth Failure Scenarios | 3 |
| Error Path Scenarios | 5 |
| After-Hours Scenarios | 4 |
| Queue Fallback Scenarios | 3 |
| Edge Case Scenarios | 8 |
| P1 (Critical) Test Cases | 16 |
| P2 (High) Test Cases | 7 |
| P3 (Medium) Test Cases | 2 |

## Input Method Coverage

| Input Method | Scenarios |
|---|---|
| DTMF only | 1, 2, 3, 7, 11, 16, 18, 19, 20, 21, 22, 24, 27, 28, 29 |
| Voice only (keywords) | 4, 31, 32 |
| Voice only (full phrases) | 5, 25, 26 |
| Voice only (synonyms) | 6, 8, 23 |
| Mixed (DTMF + Voice) | 9, 10, 12, 13, 14, 15, 17, 30 |
| Silence / No input | 14, 17, 29 |

## Language Coverage

| Language | Scenarios |
|---|---|
| English | 1-6, 9-19, 21-32 |
| Spanish | 7, 8, 20 |
| Default (fallback to English) | 16, 17 |

## Lex Bot Intent Coverage

| Bot | Intent | Covered By Scenarios |
|---|---|---|
| HealthcareAuthBot | AuthenticateIntent (success) | 1-10, 12-15, 22-28, 30-32 |
| HealthcareAuthBot | AuthenticateIntent (failure) | 10, 11 |
| HealthcareAuthBot | AuthenticateIntent (slot re-prompt) | 12 |
| HealthcareAuthMainMenuBot | CheckAuthorizationStatusIntent | 1, 4, 10, 13, 25, 26, 31, 32 |
| HealthcareAuthMainMenuBot | SpeakToAgentIntent | 2, 5, 9, 14, 22, 23, 24, 28 |
| HealthcareAuthMainMenuBot | RequestCallbackIntent | 3, 6, 27 |
| HealthcareAuthMainMenuBot | FallbackIntent | 13, 14, 15, 26, 27, 31 |
| HealthcareAuthMainMenuBotES | CheckAuthorizationStatusIntent | 7 |
| HealthcareAuthMainMenuBotES | SpeakToAgentIntent | 8 |

## Lambda Function Coverage

| Lambda Function | Covered By Scenarios |
|---|---|
| CheckBusinessHours (open) | 1-17, 22-28, 30-32 |
| CheckBusinessHours (closed) | 18, 19, 20, 21, 29 |
| ValidateAuthentication (success) | 1-10, 12-15, 22-28, 30-32 |
| ValidateAuthentication (failure) | 10, 11 |
| GetAuthStatus (found -- approved) | 1, 7 |
| GetAuthStatus (found -- pending) | 4 |
| GetAuthStatus (found -- denied) | 32 |
| GetAuthStatus (not found) | 25 |
| CreateCallback (in-hours) | 3, 6, 23 |
| CreateCallback (after-hours) | 18, 20 |
