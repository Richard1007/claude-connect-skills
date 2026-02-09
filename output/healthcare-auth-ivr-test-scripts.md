# Healthcare Authorization IVR - Test Scripts

**Phone:** +1 (866) 556-7755
**Hours:** Mon-Fri all day (0:00-23:59 PT). Weekends = after hours.
**Bots:** EN Menu (XJSDIC0KGR), ES Menu (DZLGL0M5E9), Auth (ZMDG8IBJUJ)

---

## S1: EN - Check Auth Status (DTMF)
**Test when:** Mon-Fri

System: "For English, press 1. Para español, oprima el número 2."
Caller: Press 1
System: "Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."
System: "To verify your identity, please say or enter your 9-digit member ID followed by the pound key."
Caller: Enter 123456789#
System: Prompts for date of birth
Caller: Enter 01151990#
System: "Thank you. Your identity has been verified."
System: "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."
Caller: Press 1
System: "Your authorization request is currently being processed. If you need further assistance, you will now be connected to an agent."
System: Transfers to Tier 1 queue

---

## S2: EN - Speak to Agent (DTMF)
**Test when:** Mon-Fri

System: "For English, press 1. Para español, oprima el número 2."
Caller: Press 1
System: EN greeting + auth prompt
Caller: Enter 987654321# then 07041985#
System: "Thank you. Your identity has been verified."
System: Main menu prompt
Caller: Press 2
System: "Please hold while we connect you with the next available agent."
System: Transfers to Tier 1 queue

---

## S3: EN - Request Callback (DTMF)
**Test when:** Mon-Fri

System: Language selection
Caller: Press 1
System: EN greeting + auth prompt
Caller: Enter 555123456# then 12251978#
System: "Thank you. Your identity has been verified."
System: Main menu prompt
Caller: Press 3
System: "Please say or enter the 10-digit phone number where you would like to be reached, followed by the pound key."
Caller: Enter 5551234567#
System: "We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye."
System: Call disconnects

---

## S4: EN - Check Auth Status (Voice)
**Test when:** Mon-Fri

System: Language selection
Caller: Press 1
System: EN greeting + auth prompt
Caller: Say "My member ID is 1 2 3 4 5 6 7 8 9"
System: Prompts for DOB
Caller: Say "January fifteenth, nineteen ninety"
System: "Thank you. Your identity has been verified."
System: Main menu prompt
Caller: Say "check my authorization status"
System: "Your authorization request is currently being processed..."
System: Transfers to Tier 1 queue

---

## S5: EN - Speak to Agent (Voice)
**Test when:** Mon-Fri

System: Language selection
Caller: Press 1
System: EN greeting + auth prompt
Caller: Say "I need to verify my identity, my number is 1 1 1 2 2 2 3 3 3"
System: Prompts for DOB
Caller: Say "my birthday is March third, nineteen eighty five"
System: "Thank you. Your identity has been verified."
System: Main menu prompt
Caller: Say "I'd like to speak with a representative please"
System: "Please hold while we connect you with the next available agent."
System: Transfers to Tier 1 queue

---

## S6: EN - Request Callback (Voice)
**Test when:** Mon-Fri

System: Language selection
Caller: Press 1
System: EN greeting + auth prompt
Caller: Enter 222333444# then 06151992#
System: "Thank you. Your identity has been verified."
System: Main menu prompt
Caller: Say "call me back later"
System: "Please say or enter the 10-digit phone number where you would like to be reached, followed by the pound key."
Caller: Say "5 5 5 8 6 7 5 3 0 9"
System: "We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye."
System: Call disconnects

---

## S7: EN - Mixed Input (DTMF auth + Voice menu)
**Test when:** Mon-Fri

System: Language selection
Caller: Press 1
System: EN greeting + auth prompt
Caller: Enter 444555666# then 09091980#
System: "Thank you. Your identity has been verified."
System: Main menu prompt
Caller: Say "check status"
System: Auth status result
System: Transfers to agent queue

---

## S8: ES - Check Auth Status (DTMF)
**Test when:** Mon-Fri

System: "For English, press 1. Para español, oprima el número 2."
Caller: Press 2
System: (Switches to Lupe voice) "Gracias por llamar al Centro de Autorización de Salud. Su llamada puede ser grabada para aseguramiento de calidad."
System: Auth prompt via Lex bot
Caller: Enter 777888999# then 03201975#
System: "Thank you. Your identity has been verified."
System: "¿Cómo podemos ayudarle hoy? Puede decir o presionar 1 para verificar el estado de su autorización, decir o presionar 2 para hablar con un agente, o decir o presionar 3 para solicitar una llamada de regreso."
Caller: Press 1
System: Auth status result, transfers to agent

---

## S9: ES - Speak to Agent (Voice)
**Test when:** Mon-Fri

System: Language selection
Caller: Press 2
System: ES greeting + auth prompt
Caller: Say "necesito verificar mi identidad, mi número es 1 2 3 4 5 6 7 8 9"
System: Prompts for DOB
Caller: Say "quince de enero de mil novecientos noventa"
System: Identity verified
System: ES main menu prompt
Caller: Say "quiero hablar con un agente"
System: "Please hold while we connect you with the next available agent."
System: Transfers to Tier 1 queue

---

## S10: ES - Request Callback (Voice)
**Test when:** Mon-Fri

System: Language selection
Caller: Press 2
System: ES greeting + auth prompt
Caller: Enter 111222333# then 11111999#
System: Identity verified
System: ES main menu prompt
Caller: Say "llámenme de vuelta por favor"
System: Callback phone prompt
Caller: Enter 5559876543#
System: "We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye."
System: Call disconnects

---

## S11: Auth Retry - First Failure Then Success
**Test when:** Mon-Fri

System: Language selection
Caller: Press 1
System: EN greeting + auth prompt
Caller: Enter 000000000# then 01011900#
System: Auth fails. retryCount 0→1. Re-prompts auth.
Caller: Enter 123456789# then 01151990#
System: "Thank you. Your identity has been verified."
System: Main menu prompt (flow continues normally)

---

## S12: Auth Max Retries - 3 Failures Then Disconnect
**Test when:** Mon-Fri

System: Language selection
Caller: Press 1
System: EN greeting + auth prompt
Caller: Enter 000000001# then 01011900# (attempt 1 - fails)
System: retryCount=1. Re-prompts auth.
Caller: Enter 000000002# then 01011900# (attempt 2 - fails)
System: retryCount=2. Re-prompts auth.
Caller: Enter 000000003# then 01011900# (attempt 3 - fails)
System: "We are sorry. We were unable to verify your identity after multiple attempts. For your security, this call will now end. Please call back or visit our website for assistance. Goodbye."
System: Call disconnects

---

## S13: Main Menu - Unrecognized Voice
**Test when:** Mon-Fri (after successful auth)

System: Main menu prompt
Caller: Say "blue elephant sandwich"
System: "I am sorry, I did not understand that selection. Please try again."
System: Re-plays main menu

---

## S14: Main Menu - Invalid DTMF
**Test when:** Mon-Fri (after successful auth)

System: Main menu prompt
Caller: Press 7
System: "I am sorry, I did not understand that selection. Please try again."
System: Re-plays main menu

---

## S15: Main Menu - Timeout / Silence
**Test when:** Mon-Fri (after successful auth)

System: Main menu prompt
Caller: Silent for 10+ seconds
System: "I am sorry, I did not understand that selection. Please try again."
System: Re-plays main menu

---

## S16: Language Selection - Timeout Defaults to EN
**Test when:** Mon-Fri

System: "For English, press 1. Para español, oprima el número 2."
Caller: Silent for 7+ seconds
System: Defaults to EN. Plays EN greeting + auth prompt.

---

## S17: Language Selection - Invalid DTMF Defaults to EN
**Test when:** Mon-Fri

System: "For English, press 1. Para español, oprima el número 2."
Caller: Press 5
System: Defaults to EN. Plays EN greeting.

---

## S18: After Hours - EN Callback
**Test when:** Sat-Sun

System: "For English, press 1. Para español, oprima el número 2."
Caller: Press 1
System: "Thank you for calling the Healthcare Authorization Center. Our office is currently closed. Our business hours are Monday through Friday, 8 AM to 6 PM Eastern Time."
System: "Press 1 to request a callback during our next business day, or press 2 to leave a voicemail message."
Caller: Press 1
System: "Please say or enter the 10-digit phone number where you would like to be reached, followed by the pound key."
Caller: Enter 5551112222#
System: "We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye."
System: Call disconnects

---

## S19: After Hours - EN Voicemail
**Test when:** Sat-Sun

System: Language selection
Caller: Press 1
System: EN after-hours message + menu
Caller: Press 2
System: "Please leave your message after the tone. Press the pound key when you are finished."
System: Call disconnects after voicemail

---

## S20: After Hours - ES Callback
**Test when:** Sat-Sun

System: Language selection
Caller: Press 2
System: (Lupe voice) "Gracias por llamar al Centro de Autorización de Salud. Nuestra oficina está actualmente cerrada. Nuestro horario de atención es de lunes a viernes, de 8 AM a 6 PM hora del Este."
System: "Presione 1 para solicitar una llamada de regreso durante nuestro próximo día hábil, o presione 2 para dejar un mensaje de voz."
Caller: Press 1
System: Callback phone prompt
Caller: Enter 5553334444#
System: "We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye."
System: Call disconnects

---

## S21: After Hours - ES Voicemail
**Test when:** Sat-Sun

System: Language selection
Caller: Press 2
System: ES after-hours message + menu
Caller: Press 2
System: "Please leave your message after the tone. Press the pound key when you are finished."
System: Call disconnects

---

## S22: After Hours EN - Timeout
**Test when:** Sat-Sun

System: EN after-hours message + menu
Caller: Silent for 7+ seconds
System: "Thank you for calling the Healthcare Authorization Center. Goodbye."
System: Call disconnects

---

## S23: After Hours ES - Timeout
**Test when:** Sat-Sun

System: ES after-hours message + menu
Caller: Silent for 7+ seconds
System: "Gracias por llamar al Centro de Autorización de Salud. Adiós."
System: Call disconnects

---

## S24: Tier 1 Full - Escalation to Tier 2
**Test when:** Mon-Fri (requires Tier 1 queue at capacity)

System: After auth + "speak to agent" selection
System: "Please hold while we connect you with the next available agent."
System: Tier 1 at capacity
System: "All Tier 1 agents are currently busy. We are connecting you with our specialized support team. Please continue to hold."
System: Transfers to Tier 2 queue

---

## S25: Both Tiers Full - Caller Requests Callback
**Test when:** Mon-Fri (requires both queues at capacity)

System: Tier 1 full → escalates → Tier 2 also full
System: "We apologize, but all of our agents are currently unavailable. Press 1 to request a callback, or press 2 to end the call."
Caller: Press 1
System: "Please say or enter the 10-digit phone number where you would like to be reached, followed by the pound key."
Caller: Enter 5559998888#
System: "We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye."
System: Call disconnects

---

## S26: Both Tiers Full - Caller Ends Call
**Test when:** Mon-Fri (requires both queues at capacity)

System: Both tiers at capacity prompt
Caller: Press 2
System: "Thank you for calling the Healthcare Authorization Center. Goodbye."
System: Call disconnects

---

## S27: Auth Status - No Authorizations Found
**Test when:** Mon-Fri (requires Lambda returning no results)

System: After auth, caller presses 1 at main menu
System: Lambda returns no matching authorization
System: "We were unable to find any pending authorizations associated with your account. You will now be connected to an agent for further assistance."
System: Transfers to agent

---

## S28: Auth Bot - Unrecognized Speech
**Test when:** Mon-Fri

System: Auth prompt
Caller: Say "I don't know my member ID"
System: FallbackIntent. Auth fails. retryCount incremented. Re-prompts auth.

---

## S29: Language Selection - Special Keys Default to EN
**Test when:** Mon-Fri

System: Language selection
Caller: Press # or *
System: Defaults to EN path. Plays EN greeting.

---

## S30: After Hours Menu - Special Keys
**Test when:** Sat-Sun

System: After-hours menu prompt
Caller: Press *
System: "Thank you for calling the Healthcare Authorization Center. Goodbye."
System: Call disconnects

---

## S31: Main Menu - Hesitant but Valid Voice
**Test when:** Mon-Fri (after successful auth)

System: Main menu prompt
Caller: Say "um... I think I need to... check my authorization?"
System: Matches CheckAuthorizationStatusIntent. Proceeds to status check.

---

## S32: Main Menu - "Help" (Out of Domain)
**Test when:** Mon-Fri (after successful auth)

System: Main menu prompt
Caller: Say "help"
System: "I am sorry, I did not understand that selection. Please try again."
System: Re-plays main menu

---

## S33: Main Menu - Press 0
**Test when:** Mon-Fri (after successful auth)

System: Main menu prompt
Caller: Press 0
System: "I am sorry, I did not understand that selection. Please try again."
System: Re-plays main menu

---

## S34: ES Main Menu - Unrecognized Voice
**Test when:** Mon-Fri (after successful ES auth)

System: ES main menu prompt
Caller: Say "elefante azul sandwich"
System: "I am sorry, I did not understand that selection. Please try again."
System: Re-plays ES main menu

---

## S35: ES Main Menu - Timeout
**Test when:** Mon-Fri (after successful ES auth)

System: ES main menu prompt
Caller: Silent for 10+ seconds
System: "I am sorry, I did not understand that selection. Please try again."
System: Re-plays ES main menu

---

## Coverage Matrix

| Path | DTMF | Voice | Error | Timeout |
|------|------|-------|-------|---------|
| EN Check Auth | S1 | S4, S31 | S14 | S15 |
| EN Speak to Agent | S2 | S5 | S14 | S15 |
| EN Request Callback | S3 | S6 | S14 | S15 |
| ES Check Auth | S8 | - | S34 | S35 |
| ES Speak to Agent | - | S9 | S34 | S35 |
| ES Request Callback | - | S10 | S34 | S35 |
| Language Selection | S1-3,S8 | N/A | S17,S29 | S16 |
| Authentication | S1-3 | S4-5 | S28 | - |
| Auth Retry (pass) | S11 | - | - | - |
| Auth Max Fail | S12 | - | - | - |
| After Hours EN | S18,S19 | N/A | S30 | S22 |
| After Hours ES | S20,S21 | N/A | - | S23 |
| Tier 1→Tier 2 | S24 | - | - | - |
| Both Tiers→Callback | S25 | - | - | - |
| Both Tiers→End | S26 | - | - | - |
| No Auth Found | S27 | - | - | - |
| Mixed Input | S7 | S7 | - | - |
