# Healthcare Authorization Call Center - Amazon Connect Contact Flow

## Section 1: Flow Architecture Diagram

```
                                    ENTRY POINT
                                        |
                                  [Set Voice: Joanna]
                                        |
                                  [Enable Recording]
                                        |
                              [Set Initial Attributes]
                          (retryCount=0, language=en,
                           authStatus=unauthenticated)
                                        |
                            [Invoke: check-hours Lambda]
                                        |
                          [Check businessHoursStatus]
                           /                        \
                        "open"                   "closed"
                          |                         |
                   [Play GREETING]           [Play GREETING]
                          |                         |
                  [Language Select]          [Language Select]
                   (Press 1 / 2)             (Press 1 / 2)
                    /         \               /         \
                EN(1)        ES(2)         EN(1)       ES(2)
                 |             |             |            |
           [Set lang=en] [Set lang=es] [Set lang=en] [Set lang=es]
                 |             |             |            |
                 |      [Set Voice:Lupe]     |     [Set Voice:Lupe]
                 |             |             |            |
                 |    [Play GREETING_ES]     |  [Play AFTER_HOURS_ES]
                 |             |             |            |
                 +------+------+        [Play AFTER_HOURS_GREETING]
                        |                    |            |
                  =============         [After-Hours Menu (EN/ES)]
                  AUTH FLOW                  /              \
                  =============          Press 1          Press 2
                        |               Callback         Voicemail
                   [Auth Loop x3]          |                |
                        |           [Callback Collect] [Voicemail Prompt]
              [Lex: HealthcareAuthBot]     |                |
              (collects memberId + DOB)    |           [Disconnect]
                        |            [Invoke: create-callback]
              [Invoke: auth-validate]      |
                        |           [Play CALLBACK_CONFIRM]
                [Check authResult]         |
                 /            \       [Disconnect]
             "success"     "failure"
                |              |
         [Play AUTH_SUCCESS]  [Play AUTH_FAILURE]
                |              |
         [Set authStatus=     [Loop back to Auth Loop]
          authenticated]       |
                |          (if max attempts)
                |              |
                |        [Play AUTH_MAX_ATTEMPTS]
                |              |
                |         [Disconnect]
                |
        ===============
        MAIN MENU
        ===============
                |
        [Check language]
         /            \
       "en"          "es"
        |              |
  [Lex: MainMenuBot] [Lex: MainMenuBotES]
        |              |
        +------+-------+
               |
     +---------+---------+
     |         |         |
  Intent1   Intent2   Intent3
  CheckAuth  Agent   Callback
     |         |         |
     |         |    [Callback Collect]
     |         |         |
     |         |    [Invoke: create-callback]
     |         |         |
     |         |    [Play CALLBACK_CONFIRM]
     |         |         |
     |         |    [Disconnect]
     |         |
     |    [Play TRANSFER_AGENT]
     |         |
     |    [Set Queue: Tier1AuthQueue]
     |         |
     |    [Transfer to Tier1 Queue]
     |         |
     |    (QueueAtCapacity?)
     |         |
     |    [Play TRANSFER_TIER2]
     |         |
     |    [Set Queue: Tier2AuthQueue]
     |         |
     |    [Transfer to Tier2 Queue]
     |         |
     |    (QueueAtCapacity?)
     |         |
     |    [Queue Full Menu]
     |      /         \
     |   Press 1    Press 2
     |   Callback   Goodbye
     |      |          |
     |  [Callback] [Disconnect]
     |
  [Set intent=CheckAuthorizationStatus]
     |
  [Invoke: get-status Lambda]
     |
  [Check authorizationStatus]
     |
  +-------+-------+-------+
  |       |       |       |
approved pending denied not_found
  |       |       |       |
  +---+---+       |       |
      |           |       |
 [Play AUTH_STATUS_RESULT] |
      |              [Play AUTH_STATUS_NONE]
      |                    |
      +--------+-----------+
               |
        [Play TRANSFER_AGENT]
               |
        [Set Queue: Tier1AuthQueue]
               |
        [Transfer to Tier1 Queue]
               |
          [Disconnect]
```

---

## Section 2: Block-by-Block Flow Specification

### UUID Registry

| Block Name | UUID | Type |
|---|---|---|
| SetVoiceEnglish | `a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d` | UpdateContactTextToSpeechVoice |
| EnableRecording | `b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e` | UpdateContactRecordingBehavior |
| SetInitialAttributes | `c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f` | UpdateContactAttributes |
| InvokeCheckHours | `d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80` | InvokeExternalResource |
| CheckHoursResult | `e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091` | Compare |
| PlayGreeting | `f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102` | MessageParticipant |
| LangSelectInput | `a7b8c9d0-e1f2-4a3b-4c5d-6e7f80910213` | GetParticipantInput |
| SetLanguageEnglish | `b8c9d0e1-f2a3-4b4c-5d6e-7f8091021324` | UpdateContactAttributes |
| SetLanguageSpanish | `c9d0e1f2-a3b4-4c5d-6e7f-809102132435` | UpdateContactAttributes |
| SetVoiceSpanish | `d0e1f2a3-b4c5-4d6e-7f80-910213243546` | UpdateContactTextToSpeechVoice |
| PlayGreetingSpanish | `e1f2a3b4-c5d6-4e7f-8091-021324354657` | MessageParticipant |
| AuthLoop | `f2a3b4c5-d6e7-4f80-9102-132435465768` | Loop |
| AuthLexBot | `a3b4c5d6-e7f8-4091-0213-243546576879` | ConnectParticipantWithLexBot |
| InvokeAuthValidate | `b4c5d6e7-f809-4102-1324-35465768798a` | InvokeExternalResource |
| CheckAuthResult | `c5d6e7f8-0910-4213-2435-4657687989ab` | Compare |
| PlayAuthSuccess | `d6e7f809-1021-4324-3546-57687989abbc` | MessageParticipant |
| SetAuthenticatedAttrs | `e7f80910-2132-4435-4657-687989abbccd` | UpdateContactAttributes |
| PlayAuthFailure | `f8091021-3243-4546-5768-7989abbccdde` | MessageParticipant |
| PlayAuthMaxAttempts | `09102132-4354-4657-6879-89abbccddeef` | MessageParticipant |
| DisconnectAuthFail | `10213243-5465-4768-7989-abbccddeef00` | DisconnectParticipant |
| CheckLangForMenu | `21324354-6576-4879-89ab-bccddeef0011` | Compare |
| MainMenuLexEN | `32435465-7687-4989-abbc-cddeef001122` | ConnectParticipantWithLexBot |
| MainMenuLexES | `43546576-8798-4a9a-bbcc-ddeef0011233` | ConnectParticipantWithLexBot |
| SetIntentAuthStatus | `54657687-989a-4bbc-cdde-ef0011223344` | UpdateContactAttributes |
| InvokeGetStatus | `65768798-9abb-4ccd-deef-001122334455` | InvokeExternalResource |
| CheckStatusResult | `76879899-abbc-4dde-ef00-112233445566` | Compare |
| PlayStatusResult | `87989aab-bccd-4eef-0011-223344556677` | MessageParticipant |
| PlayStatusNone | `989aabbc-cdde-4f00-1122-334455667788` | MessageParticipant |
| PlayTransferAgentEN | `a9abbccd-deef-4011-2233-445566778899` | MessageParticipant |
| PlayTransferAgentES | `babbccdd-eef0-4122-3344-5566778899aa` | MessageParticipant |
| CheckLangTransfer | `cbccddee-f011-4233-4455-66778899aabb` | Compare |
| SetQueueTier1 | `dccddeed-0112-4344-5566-778899aabbcc` | UpdateContactAttributes |
| TransferTier1 | `eddeef00-1223-4455-6677-8899aabbccdd` | TransferContactToQueue |
| PlayTransferTier2 | `feef0011-2334-4566-7788-99aabbccddee` | MessageParticipant |
| SetQueueTier2 | `0f001122-3445-4677-8899-aabbccddeeff` | UpdateContactAttributes |
| TransferTier2 | `10112233-4556-4788-99aa-bbccddeeff00` | TransferContactToQueue |
| QueueFullMenu | `21223344-5667-4899-aabb-ccddeeff0011` | GetParticipantInput |
| CallbackCollectInput | `32334455-6778-49aa-bbcc-ddeeff001122` | GetParticipantInput |
| InvokeCreateCallback | `43445566-7889-4abb-ccdd-eeff00112233` | InvokeExternalResource |
| PlayCallbackConfirm | `54556677-8990-4bcc-ddee-ff0011223344` | MessageParticipant |
| DisconnectCallback | `65667788-9a01-4cdd-eeff-001122334455` | DisconnectParticipant |
| CheckLangAfterHours | `76778899-ab12-4dee-ff00-112233445566` | Compare |
| PlayAfterHoursEN | `87889900-bc23-4eff-0011-223344556677` | MessageParticipant |
| PlayAfterHoursES | `98990011-cd34-4f00-1122-334455667788` | MessageParticipant |
| AfterHoursMenuEN | `a9001122-de45-4011-2233-445566778899` | GetParticipantInput |
| AfterHoursMenuES | `b0112233-ef56-4122-3344-5566778899aa` | GetParticipantInput |
| PlayVoicemailPrompt | `c1223344-f067-4233-4455-66778899aabb` | MessageParticipant |
| DisconnectVoicemail | `d2334455-0178-4344-5566-778899aabbcc` | DisconnectParticipant |
| PlayGoodbye | `e3445566-1289-4455-6677-8899aabbccdd` | MessageParticipant |
| PlayGoodbyeES | `f4556677-239a-4566-7788-99aabbccddee` | MessageParticipant |
| DisconnectMain | `05667788-34ab-4677-8899-aabbccddeeff` | DisconnectParticipant |
| MenuErrorReturnEN | `16778899-45bc-4788-99aa-bbccddeeff00` | MessageParticipant |
| MenuErrorReturnES | `27889900-56cd-4899-aabb-ccddeeff0011` | MessageParticipant |
| LangSelectError | `38990011-67de-49aa-bbcc-ddeeff001122` | MessageParticipant |
| CheckLangForGoodbye | `49001122-78ef-4abb-ccdd-eeff00112233` | Compare |
| AfterHoursCallbackInput | `5a112233-8900-4bcc-ddee-ff0011223344` | GetParticipantInput |
| PlayAfterHoursCallbackConfirm | `6b223344-9a11-4cdd-eeff-001122334455` | MessageParticipant |
| InvokeCreateCallbackAH | `7c334455-ab22-4dee-ff00-112233445566` | InvokeExternalResource |
| DisconnectAfterHoursCB | `8d445566-bc33-4eff-0011-223344556677` | DisconnectParticipant |
| SetTier1Attr | `9e556677-cd44-4f00-1122-334455667788` | UpdateContactAttributes |
| SetTier2Attr | `af667788-de55-4011-2233-445566778899` | UpdateContactAttributes |
| CheckLangForAuthLoop | `b0778899-ef66-4122-3344-556677889900` | Compare |
| PlayAuthFailureES | `c1889900-f077-4233-4455-667788990011` | MessageParticipant |
| PlayAuthMaxAttemptsES | `d2990011-0188-4344-5566-77889900aa22` | MessageParticipant |
| CheckLangAuthSuccess | `e3001122-1299-4455-6677-889900aabb33` | Compare |
| CheckLangAuthFailure | `f4112233-23aa-4566-7788-9900aabbcc44` | Compare |
| CheckLangAuthMax | `05223344-34bb-4677-8899-00aabbccdd55` | Compare |

---

### A. Entry and Business Hours Check

#### Block A1: SetVoiceEnglish
- **UUID:** `a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d`
- **Type:** `UpdateContactTextToSpeechVoice`
- **Parameters:**
  - TextToSpeechVoice: `"Joanna"`
  - TextToSpeechEngine: `"Neural"`
  - TextToSpeechStyle: `"None"`
- **Transitions:**
  - NextAction -> EnableRecording (`b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e`)
  - NoMatchingError -> EnableRecording
- **Notes:** Entry point of the flow. Sets the default English neural TTS voice.

#### Block A2: EnableRecording
- **UUID:** `b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e`
- **Type:** `UpdateContactRecordingBehavior`
- **Parameters:**
  - Agent: `{ "Audio": { "Track": "All" }, "InitialState": "Enabled" }`
  - Customer: `{ "Audio": { "Track": "All" }, "InitialState": "Enabled" }`
- **Transitions:**
  - NextAction -> SetInitialAttributes (`c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f`)
  - NoMatchingError -> SetInitialAttributes
- **Notes:** Enables call recording for quality assurance, as stated in the greeting.

#### Block A3: SetInitialAttributes
- **UUID:** `c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f`
- **Type:** `UpdateContactAttributes`
- **Parameters:**
  - Attributes: `{ "retryCount": "0", "language": "en", "authStatus": "unauthenticated", "tier": "1" }`
- **Transitions:**
  - NextAction -> InvokeCheckHours (`d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80`)
  - NoMatchingError -> InvokeCheckHours
- **Notes:** Initializes all contact attributes to default values.

#### Block A4: InvokeCheckHours
- **UUID:** `d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80`
- **Type:** `InvokeExternalResource`
- **Parameters:**
  - FunctionArn: `"arn:aws:lambda:us-east-1:ACCOUNT:function:healthcare-auth-check-hours"`
  - TimeLimit: `"8"`
- **Transitions:**
  - NextAction -> CheckHoursResult (`e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091`)
  - NoMatchingError -> PlayGreeting (fallback: assume open on Lambda error)
- **Notes:** Calls the business hours Lambda. Returns `{ businessHoursStatus: "open"|"closed" }`.

#### Block A5: CheckHoursResult
- **UUID:** `e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091`
- **Type:** `Compare`
- **Parameters:**
  - ComparisonValue: `"$.External.businessHoursStatus"`
- **Transitions:**
  - Condition "open" -> PlayGreeting (`f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102`)
  - Condition "closed" -> PlayGreeting (`f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102`)
  - NoMatchingCondition -> PlayGreeting (default: treat as open)
- **Notes:** Routes to greeting regardless; the businessHoursStatus attribute is stored and checked later after language selection. We store it via UpdateContactAttributes in the Lambda response. The after-hours vs in-hours routing occurs after language selection.

Actually -- let me revise: The Lambda response sets `$.External.businessHoursStatus`. We need to store it as a contact attribute so we can check it later. Let me add a SetBusinessHoursAttr block.

**REVISED Block A5:** CheckHoursResult
- **UUID:** `e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091`
- **Type:** `UpdateContactAttributes`
- **Parameters:**
  - Attributes: `{ "businessHoursStatus": "$.External.businessHoursStatus" }`
- **Transitions:**
  - NextAction -> PlayGreeting (`f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102`)
  - NoMatchingError -> PlayGreeting
- **Notes:** Stores the Lambda result as a contact attribute for downstream routing.

We add a NEW block A5b for checking:

#### Block A5b: CheckHoursRoute
- **UUID:** `16334455-56ab-4c88-99dd-eeff00112244`
- **Type:** `Compare`
- **Parameters:**
  - ComparisonValue: `"$.Attributes.businessHoursStatus"`
- **Transitions:**
  - Condition "open" -> AuthLoop (`f2a3b4c5-d6e7-4f80-9102-132435465768`)
  - Condition "closed" -> CheckLangAfterHours (`76778899-ab12-4dee-ff00-112233445566`)
  - NoMatchingCondition -> AuthLoop (default: treat as open)
  - NoMatchingError -> AuthLoop
- **Notes:** After language selection is complete, this block routes the caller to the in-hours authentication flow or the after-hours flow.

---

### B. Language Selection

#### Block B1: PlayGreeting
- **UUID:** `f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"Thank you for calling the Healthcare Authorization Center. Your call may be recorded for quality assurance."`
- **Transitions:**
  - NextAction -> LangSelectInput (`a7b8c9d0-e1f2-4a3b-4c5d-6e7f80910213`)
  - NoMatchingError -> LangSelectInput
- **Notes:** Plays the initial greeting in English (default voice). The recording disclaimer is included here.

#### Block B2: LangSelectInput
- **UUID:** `a7b8c9d0-e1f2-4a3b-4c5d-6e7f80910213`
- **Type:** `GetParticipantInput`
- **Parameters:**
  - Text: `"For English, press 1. Para espanol, oprima el numero 2."`
  - StoreInput: `"False"`
  - InputTimeLimitSeconds: `"7"`
- **Transitions:**
  - Condition "1" -> SetLanguageEnglish (`b8c9d0e1-f2a3-4b4c-5d6e-7f8091021324`)
  - Condition "2" -> SetLanguageSpanish (`c9d0e1f2-a3b4-4c5d-6e7f-809102132435`)
  - InputTimeLimitExceeded -> SetLanguageEnglish (default to English on timeout)
  - NoMatchingCondition -> LangSelectError (`38990011-67de-49aa-bbcc-ddeeff001122`)
  - NoMatchingError -> SetLanguageEnglish (default to English on error)
- **Notes:** Simple DTMF input. No Lex bot needed since it is just 1 or 2. Defaults to English on timeout.

#### Block B3: LangSelectError
- **UUID:** `38990011-67de-49aa-bbcc-ddeeff001122`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"I am sorry, I did not understand that selection. Please try again."`
- **Transitions:**
  - NextAction -> LangSelectInput (`a7b8c9d0-e1f2-4a3b-4c5d-6e7f80910213`)
  - NoMatchingError -> SetLanguageEnglish
- **Notes:** Replays language selection on invalid input. One retry, then defaults to English.

#### Block B4: SetLanguageEnglish
- **UUID:** `b8c9d0e1-f2a3-4b4c-5d6e-7f8091021324`
- **Type:** `UpdateContactAttributes`
- **Parameters:**
  - Attributes: `{ "language": "en" }`
- **Transitions:**
  - NextAction -> CheckHoursRoute (`16334455-56ab-4c88-99dd-eeff00112244`)
  - NoMatchingError -> CheckHoursRoute
- **Notes:** Sets language to English and proceeds to hours check routing.

#### Block B5: SetLanguageSpanish
- **UUID:** `c9d0e1f2-a3b4-4c5d-6e7f-809102132435`
- **Type:** `UpdateContactAttributes`
- **Parameters:**
  - Attributes: `{ "language": "es" }`
- **Transitions:**
  - NextAction -> SetVoiceSpanish (`d0e1f2a3-b4c5-4d6e-7f80-910213243546`)
  - NoMatchingError -> SetVoiceSpanish
- **Notes:** Sets language to Spanish before switching voice.

#### Block B6: SetVoiceSpanish
- **UUID:** `d0e1f2a3-b4c5-4d6e-7f80-910213243546`
- **Type:** `UpdateContactTextToSpeechVoice`
- **Parameters:**
  - TextToSpeechVoice: `"Lupe"`
  - TextToSpeechEngine: `"Neural"`
  - TextToSpeechStyle: `"None"`
- **Transitions:**
  - NextAction -> PlayGreetingSpanish (`e1f2a3b4-c5d6-4e7f-8091-021324354657`)
  - NoMatchingError -> PlayGreetingSpanish
- **Notes:** Switches TTS voice to Lupe (Spanish Neural).

#### Block B7: PlayGreetingSpanish
- **UUID:** `e1f2a3b4-c5d6-4e7f-8091-021324354657`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"Gracias por llamar al Centro de Autorizacion de Salud. Su llamada puede ser grabada para aseguramiento de calidad."`
- **Transitions:**
  - NextAction -> CheckHoursRoute (`16334455-56ab-4c88-99dd-eeff00112244`)
  - NoMatchingError -> CheckHoursRoute
- **Notes:** Plays the Spanish greeting, then routes based on business hours.

---

### C. Authentication Flow

#### Block C1: AuthLoop
- **UUID:** `f2a3b4c5-d6e7-4f80-9102-132435465768`
- **Type:** `Loop`
- **Parameters:**
  - LoopCount: `"3"`
- **Transitions:**
  - Condition "ContinueLooping" -> AuthLexBot (`a3b4c5d6-e7f8-4091-0213-243546576879`)
  - NextAction (loop complete) -> CheckLangAuthMax (`05223344-34bb-4677-8899-00aabbccdd55`)
  - NoMatchingError -> CheckLangAuthMax
- **Notes:** Allows up to 3 authentication attempts. When loop exhausts, plays max attempts message and disconnects.

#### Block C2: AuthLexBot
- **UUID:** `a3b4c5d6-e7f8-4091-0213-243546576879`
- **Type:** `ConnectParticipantWithLexBot`
- **Parameters:**
  - Text: Dynamic based on language (see Note). Default English: `"To verify your identity, please say or enter your 9-digit member ID followed by the pound key."`
  - LexV2Bot.AliasArn: `"arn:aws:lex:us-east-1:ACCOUNT:bot-alias/AUTHBOTID/AUTHALIASID"`
- **Transitions:**
  - Condition "AuthenticateIntent" -> InvokeAuthValidate (`b4c5d6e7-f809-4102-1324-35465768798a`)
  - NoMatchingCondition -> CheckLangAuthFailure (`f4112233-23aa-4566-7788-9900aabbcc44`)
  - NoMatchingError -> CheckLangAuthFailure
- **Notes:** The Lex bot HealthcareAuthBot collects both the memberId (9-digit) and dateOfBirth slots in a multi-turn conversation. The bot handles the DOB prompt internally. When AuthenticateIntent is fulfilled, both slot values are available as Lex session attributes. The Lex bot is language-agnostic (supports en_US locale with DTMF fallback).

#### Block C3: InvokeAuthValidate
- **UUID:** `b4c5d6e7-f809-4102-1324-35465768798a`
- **Type:** `InvokeExternalResource`
- **Parameters:**
  - FunctionArn: `"arn:aws:lambda:us-east-1:ACCOUNT:function:healthcare-auth-validate"`
  - TimeLimit: `"8"`
- **Transitions:**
  - NextAction -> CheckAuthResult (`c5d6e7f8-0910-4213-2435-4657687989ab`)
  - NoMatchingError -> CheckLangAuthFailure
- **Notes:** Lambda receives the memberId and dateOfBirth from the Lex session attributes (automatically passed via the contact). Returns `{ authResult: "success"|"failure" }`.

#### Block C4: CheckAuthResult
- **UUID:** `c5d6e7f8-0910-4213-2435-4657687989ab`
- **Type:** `Compare`
- **Parameters:**
  - ComparisonValue: `"$.External.authResult"`
- **Transitions:**
  - Condition "success" -> CheckLangAuthSuccess (`e3001122-1299-4455-6677-889900aabb33`)
  - Condition "failure" -> CheckLangAuthFailure (`f4112233-23aa-4566-7788-9900aabbcc44`)
  - NoMatchingCondition -> CheckLangAuthFailure
  - NoMatchingError -> CheckLangAuthFailure
- **Notes:** Routes based on Lambda validation result.

#### Block C5: CheckLangAuthSuccess
- **UUID:** `e3001122-1299-4455-6677-889900aabb33`
- **Type:** `Compare`
- **Parameters:**
  - ComparisonValue: `"$.Attributes.language"`
- **Transitions:**
  - Condition "en" -> PlayAuthSuccess (`d6e7f809-1021-4324-3546-57687989abbc`)
  - Condition "es" -> PlayAuthSuccessES_inline (see below -- we combine into PlayAuthSuccess with dynamic text)
  - NoMatchingCondition -> PlayAuthSuccess
- **Notes:** Checks language to play the correct success message.

**Design Decision:** To keep block count manageable, we use a language check before each bilingual prompt and have separate EN/ES message blocks where needed. For the JSON, we will use two separate MessageParticipant blocks for auth success.

#### Block C5a: PlayAuthSuccess (English)
- **UUID:** `d6e7f809-1021-4324-3546-57687989abbc`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"Thank you. Your identity has been verified."`
- **Transitions:**
  - NextAction -> SetAuthenticatedAttrs (`e7f80910-2132-4435-4657-687989abbccd`)
  - NoMatchingError -> SetAuthenticatedAttrs
- **Notes:** English authentication success message.

#### Block C5b: PlayAuthSuccessES
- **UUID:** `27445566-78cd-4eaa-bbdd-0011223344ff`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"Gracias. Su identidad ha sido verificada."`
- **Transitions:**
  - NextAction -> SetAuthenticatedAttrs (`e7f80910-2132-4435-4657-687989abbccd`)
  - NoMatchingError -> SetAuthenticatedAttrs
- **Notes:** Spanish authentication success message.

Update CheckLangAuthSuccess transitions:
- Condition "es" -> PlayAuthSuccessES (`27445566-78cd-4eaa-bbdd-0011223344ff`)

#### Block C6: SetAuthenticatedAttrs
- **UUID:** `e7f80910-2132-4435-4657-687989abbccd`
- **Type:** `UpdateContactAttributes`
- **Parameters:**
  - Attributes: `{ "authStatus": "authenticated" }`
- **Transitions:**
  - NextAction -> CheckLangForMenu (`21324354-6576-4879-89ab-bccddeef0011`)
  - NoMatchingError -> CheckLangForMenu
- **Notes:** Marks the contact as authenticated. The memberId and dateOfBirth are already stored from the Lex bot session.

#### Block C7: CheckLangAuthFailure
- **UUID:** `f4112233-23aa-4566-7788-9900aabbcc44`
- **Type:** `Compare`
- **Parameters:**
  - ComparisonValue: `"$.Attributes.language"`
- **Transitions:**
  - Condition "en" -> PlayAuthFailure (`f8091021-3243-4546-5768-7989abbccdde`)
  - Condition "es" -> PlayAuthFailureES (`c1889900-f077-4233-4455-667788990011`)
  - NoMatchingCondition -> PlayAuthFailure
- **Notes:** Routes to language-appropriate failure message before looping back.

#### Block C8: PlayAuthFailure (English)
- **UUID:** `f8091021-3243-4546-5768-7989abbccdde`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"We were unable to verify your information. Please try again."`
- **Transitions:**
  - NextAction -> AuthLoop (`f2a3b4c5-d6e7-4f80-9102-132435465768`)
  - NoMatchingError -> AuthLoop
- **Notes:** Plays failure message in English, then loops back for retry.

#### Block C9: PlayAuthFailureES
- **UUID:** `c1889900-f077-4233-4455-667788990011`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"No pudimos verificar su informacion. Por favor intente de nuevo."`
- **Transitions:**
  - NextAction -> AuthLoop (`f2a3b4c5-d6e7-4f80-9102-132435465768`)
  - NoMatchingError -> AuthLoop
- **Notes:** Plays failure message in Spanish, then loops back for retry.

#### Block C10: CheckLangAuthMax
- **UUID:** `05223344-34bb-4677-8899-00aabbccdd55`
- **Type:** `Compare`
- **Parameters:**
  - ComparisonValue: `"$.Attributes.language"`
- **Transitions:**
  - Condition "en" -> PlayAuthMaxAttempts (`09102132-4354-4657-6879-89abbccddeef`)
  - Condition "es" -> PlayAuthMaxAttemptsES (`d2990011-0188-4344-5566-77889900aa22`)
  - NoMatchingCondition -> PlayAuthMaxAttempts
- **Notes:** Routes to language-appropriate max attempts message.

#### Block C11: PlayAuthMaxAttempts (English)
- **UUID:** `09102132-4354-4657-6879-89abbccddeef`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"We are sorry. We were unable to verify your identity after multiple attempts. For your security, this call will now end. Please call back or visit our website for assistance. Goodbye."`
- **Transitions:**
  - NextAction -> DisconnectAuthFail (`10213243-5465-4768-7989-abbccddeef00`)
  - NoMatchingError -> DisconnectAuthFail
- **Notes:** Terminal path for failed authentication after 3 attempts.

#### Block C12: PlayAuthMaxAttemptsES
- **UUID:** `d2990011-0188-4344-5566-77889900aa22`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"Lo sentimos. No pudimos verificar su identidad despues de multiples intentos. Por su seguridad, esta llamada terminara ahora. Por favor llame de nuevo o visite nuestro sitio web para asistencia. Adios."`
- **Transitions:**
  - NextAction -> DisconnectAuthFail (`10213243-5465-4768-7989-abbccddeef00`)
  - NoMatchingError -> DisconnectAuthFail
- **Notes:** Terminal path for failed authentication in Spanish.

#### Block C13: DisconnectAuthFail
- **UUID:** `10213243-5465-4768-7989-abbccddeef00`
- **Type:** `DisconnectParticipant`
- **Parameters:** `{}`
- **Transitions:** `{}`
- **Notes:** Disconnects caller after max authentication failures.

---

### D. Main Menu (In-Hours)

#### Block D1: CheckLangForMenu
- **UUID:** `21324354-6576-4879-89ab-bccddeef0011`
- **Type:** `Compare`
- **Parameters:**
  - ComparisonValue: `"$.Attributes.language"`
- **Transitions:**
  - Condition "en" -> MainMenuLexEN (`32435465-7687-4989-abbc-cddeef001122`)
  - Condition "es" -> MainMenuLexES (`43546576-8798-4a9a-bbcc-ddeef0011233`)
  - NoMatchingCondition -> MainMenuLexEN
- **Notes:** Routes to the language-appropriate Lex bot for the main menu.

#### Block D2: MainMenuLexEN (English)
- **UUID:** `32435465-7687-4989-abbc-cddeef001122`
- **Type:** `ConnectParticipantWithLexBot`
- **Parameters:**
  - Text: `"How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."`
  - LexV2Bot.AliasArn: `"arn:aws:lex:us-east-1:ACCOUNT:bot-alias/MAINMENUBOTID/MAINMENUALIASID"`
- **Transitions:**
  - Condition "CheckAuthorizationStatusIntent" -> SetIntentAuthStatus (`54657687-989a-4bbc-cdde-ef0011223344`)
  - Condition "SpeakToAgentIntent" -> PlayTransferAgentEN (`a9abbccd-deef-4011-2233-445566778899`)
  - Condition "RequestCallbackIntent" -> CallbackCollectInput (`32334455-6778-49aa-bbcc-ddeeff001122`)
  - NoMatchingCondition -> MenuErrorReturnEN (`16778899-45bc-4788-99aa-bbccddeeff00`)
  - NoMatchingError -> MenuErrorReturnEN
- **Notes:** English main menu using Lex bot with 3 intents. FallbackIntent from Lex triggers NoMatchingCondition.

#### Block D3: MainMenuLexES (Spanish)
- **UUID:** `43546576-8798-4a9a-bbcc-ddeef0011233`
- **Type:** `ConnectParticipantWithLexBot`
- **Parameters:**
  - Text: `"Como podemos ayudarle hoy? Puede decir o presionar 1 para verificar el estado de su autorizacion, decir o presionar 2 para hablar con un agente, o decir o presionar 3 para solicitar una llamada de regreso."`
  - LexV2Bot.AliasArn: `"arn:aws:lex:us-east-1:ACCOUNT:bot-alias/MAINMENUBOTESID/MAINMENUALIASESID"`
- **Transitions:**
  - Condition "CheckAuthorizationStatusIntent" -> SetIntentAuthStatus (`54657687-989a-4bbc-cdde-ef0011223344`)
  - Condition "SpeakToAgentIntent" -> PlayTransferAgentES (`babbccdd-eef0-4122-3344-5566778899aa`)
  - Condition "RequestCallbackIntent" -> CallbackCollectInput (`32334455-6778-49aa-bbcc-ddeeff001122`)
  - NoMatchingCondition -> MenuErrorReturnES (`27889900-56cd-4899-aabb-ccddeeff0011`)
  - NoMatchingError -> MenuErrorReturnES
- **Notes:** Spanish main menu using the Spanish Lex bot (es_US locale).

#### Block D4: MenuErrorReturnEN
- **UUID:** `16778899-45bc-4788-99aa-bbccddeeff00`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"I am sorry, I did not understand that selection. Please try again."`
- **Transitions:**
  - NextAction -> MainMenuLexEN (`32435465-7687-4989-abbc-cddeef001122`)
  - NoMatchingError -> PlayGoodbye
- **Notes:** Error handler for English main menu. Replays the menu once.

#### Block D5: MenuErrorReturnES
- **UUID:** `27889900-56cd-4899-aabb-ccddeeff0011`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"Lo siento, no entendi esa seleccion. Por favor intente de nuevo."`
- **Transitions:**
  - NextAction -> MainMenuLexES (`43546576-8798-4a9a-bbcc-ddeef0011233`)
  - NoMatchingError -> PlayGoodbyeES
- **Notes:** Error handler for Spanish main menu. Replays the menu once.

---

### E. Check Authorization Status Path

#### Block E1: SetIntentAuthStatus
- **UUID:** `54657687-989a-4bbc-cdde-ef0011223344`
- **Type:** `UpdateContactAttributes`
- **Parameters:**
  - Attributes: `{ "intent": "CheckAuthorizationStatus" }`
- **Transitions:**
  - NextAction -> InvokeGetStatus (`65768798-9abb-4ccd-deef-001122334455`)
  - NoMatchingError -> InvokeGetStatus
- **Notes:** Records the caller's intent for reporting purposes.

#### Block E2: InvokeGetStatus
- **UUID:** `65768798-9abb-4ccd-deef-001122334455`
- **Type:** `InvokeExternalResource`
- **Parameters:**
  - FunctionArn: `"arn:aws:lambda:us-east-1:ACCOUNT:function:healthcare-auth-get-status"`
  - TimeLimit: `"8"`
- **Transitions:**
  - NextAction -> CheckStatusResult (`76879899-abbc-4dde-ef00-112233445566`)
  - NoMatchingError -> CheckLangTransfer (on Lambda error, transfer to agent)
- **Notes:** Takes memberId from contact attributes. Returns `{ authorizationStatus: "approved"|"pending"|"denied"|"not_found" }`.

#### Block E3: CheckStatusResult
- **UUID:** `76879899-abbc-4dde-ef00-112233445566`
- **Type:** `Compare`
- **Parameters:**
  - ComparisonValue: `"$.External.authorizationStatus"`
- **Transitions:**
  - Condition "approved" -> PlayStatusResult (`87989aab-bccd-4eef-0011-223344556677`)
  - Condition "pending" -> PlayStatusResult (`87989aab-bccd-4eef-0011-223344556677`)
  - Condition "denied" -> PlayStatusResult (`87989aab-bccd-4eef-0011-223344556677`)
  - Condition "not_found" -> PlayStatusNone (`989aabbc-cdde-4f00-1122-334455667788`)
  - NoMatchingCondition -> PlayStatusNone
  - NoMatchingError -> CheckLangTransfer
- **Notes:** Routes based on authorization status. approved/pending/denied all go to the status result prompt (which includes the dynamic status). not_found goes to the "no authorizations found" prompt.

#### Block E4: PlayStatusResult
- **UUID:** `87989aab-bccd-4eef-0011-223344556677`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"Your authorization request is currently $.External.authorizationStatus. If you need further assistance, you will now be connected to an agent."`
- **Transitions:**
  - NextAction -> CheckLangTransfer (`cbccddee-f011-4233-4455-66778899aabb`)
  - NoMatchingError -> CheckLangTransfer
- **Notes:** Plays the authorization status using the dynamic attribute from the Lambda response. Then transfers to an agent for follow-up.

#### Block E5: PlayStatusNone
- **UUID:** `989aabbc-cdde-4f00-1122-334455667788`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"We were unable to find any pending authorizations associated with your account. You will now be connected to an agent for further assistance."`
- **Transitions:**
  - NextAction -> CheckLangTransfer (`cbccddee-f011-4233-4455-66778899aabb`)
  - NoMatchingError -> CheckLangTransfer
- **Notes:** No authorizations found. Transfers to agent.

---

### F. Speak to Agent Path (Tier 1 -> Tier 2 Escalation)

#### Block F1: CheckLangTransfer
- **UUID:** `cbccddee-f011-4233-4455-66778899aabb`
- **Type:** `Compare`
- **Parameters:**
  - ComparisonValue: `"$.Attributes.language"`
- **Transitions:**
  - Condition "en" -> PlayTransferAgentEN (`a9abbccd-deef-4011-2233-445566778899`)
  - Condition "es" -> PlayTransferAgentES (`babbccdd-eef0-4122-3344-5566778899aa`)
  - NoMatchingCondition -> PlayTransferAgentEN
- **Notes:** Routes to language-appropriate transfer prompt.

#### Block F2: PlayTransferAgentEN
- **UUID:** `a9abbccd-deef-4011-2233-445566778899`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"Please hold while we connect you with the next available agent."`
- **Transitions:**
  - NextAction -> SetTier1Attr (`9e556677-cd44-4f00-1122-334455667788`)
  - NoMatchingError -> SetTier1Attr
- **Notes:** English transfer-to-agent prompt.

#### Block F3: PlayTransferAgentES
- **UUID:** `babbccdd-eef0-4122-3344-5566778899aa`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"Por favor espere mientras lo conectamos con el proximo agente disponible."`
- **Transitions:**
  - NextAction -> SetTier1Attr (`9e556677-cd44-4f00-1122-334455667788`)
  - NoMatchingError -> SetTier1Attr
- **Notes:** Spanish transfer-to-agent prompt.

#### Block F4: SetTier1Attr
- **UUID:** `9e556677-cd44-4f00-1122-334455667788`
- **Type:** `UpdateContactAttributes`
- **Parameters:**
  - Attributes: `{ "tier": "1" }`
- **Transitions:**
  - NextAction -> TransferTier1 (`eddeef00-1223-4455-6677-8899aabbccdd`)
  - NoMatchingError -> TransferTier1
- **Notes:** Sets tier attribute before transferring to Tier 1 queue.

#### Block F5: TransferTier1
- **UUID:** `eddeef00-1223-4455-6677-8899aabbccdd`
- **Type:** `TransferContactToQueue`
- **Parameters:** `{}`
- **Transitions:**
  - NextAction -> DisconnectMain (`05667788-34ab-4677-8899-aabbccddeeff`) (success - agent handles)
  - QueueAtCapacity -> PlayTransferTier2 (`feef0011-2334-4566-7788-99aabbccddee`)
  - NoMatchingError -> PlayTransferTier2
- **Notes:** Transfers to Tier1AuthQueue. On capacity error, escalates to Tier 2. The queue is set by the flow's working queue (would be set via SetWorkingQueue in a production deployment -- here it is assumed Tier1AuthQueue is the default working queue or set via a preceding SetWorkingQueue block). For this flow we will add explicit SetWorkingQueue actions.

**Note on Queue Setting:** Amazon Connect requires `SetWorkingQueue` to specify which queue. We add two blocks:

#### Block F4a: SetWorkingQueueTier1
- **UUID:** `38556677-ab44-4c00-dd22-334455667799`
- **Type:** `UpdateContactAttributes`
- **Parameters:**
  - Attributes: `{ "tier": "1" }`

Actually, Amazon Connect uses a separate mechanism for setting working queue. In the Contact Flow JSON, we use `UpdateContactRoutingBehavior` or we set the queue ARN directly. For simplicity in this production-grade flow, the `TransferContactToQueue` block's Parameters can include the QueueId. Let me include that.

**REVISED Block F5: TransferTier1**
- **UUID:** `eddeef00-1223-4455-6677-8899aabbccdd`
- **Type:** `TransferContactToQueue`
- **Parameters:**
  - QueueId: `"arn:aws:connect:us-east-1:ACCOUNT:instance/INSTANCE_ID/queue/TIER1_QUEUE_ID"`
- **Transitions:**
  - NextAction -> DisconnectMain
  - QueueAtCapacity -> PlayTransferTier2 (`feef0011-2334-4566-7788-99aabbccddee`)
  - NoMatchingError -> PlayTransferTier2

#### Block F6: PlayTransferTier2
- **UUID:** `feef0011-2334-4566-7788-99aabbccddee`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"All Tier 1 agents are currently busy. We are connecting you with our specialized support team. Please continue to hold."`
- **Transitions:**
  - NextAction -> SetTier2Attr (`af667788-de55-4011-2233-445566778899`)
  - NoMatchingError -> SetTier2Attr
- **Notes:** Played when Tier 1 queue is at capacity.

#### Block F7: SetTier2Attr
- **UUID:** `af667788-de55-4011-2233-445566778899`
- **Type:** `UpdateContactAttributes`
- **Parameters:**
  - Attributes: `{ "tier": "2" }`
- **Transitions:**
  - NextAction -> TransferTier2 (`10112233-4556-4788-99aa-bbccddeeff00`)
  - NoMatchingError -> TransferTier2
- **Notes:** Updates tier attribute to 2 for reporting.

#### Block F8: TransferTier2
- **UUID:** `10112233-4556-4788-99aa-bbccddeeff00`
- **Type:** `TransferContactToQueue`
- **Parameters:**
  - QueueId: `"arn:aws:connect:us-east-1:ACCOUNT:instance/INSTANCE_ID/queue/TIER2_QUEUE_ID"`
- **Transitions:**
  - NextAction -> DisconnectMain
  - QueueAtCapacity -> QueueFullMenu (`21223344-5667-4899-aabb-ccddeeff0011`)
  - NoMatchingError -> QueueFullMenu
- **Notes:** Transfers to Tier2AuthQueue. On capacity error, offers callback or disconnect.

#### Block F9: QueueFullMenu
- **UUID:** `21223344-5667-4899-aabb-ccddeeff0011`
- **Type:** `GetParticipantInput`
- **Parameters:**
  - Text: `"We apologize, but all of our agents are currently unavailable. Press 1 to request a callback, or press 2 to end the call."`
  - StoreInput: `"False"`
  - InputTimeLimitSeconds: `"7"`
- **Transitions:**
  - Condition "1" -> CallbackCollectInput (`32334455-6778-49aa-bbcc-ddeeff001122`)
  - Condition "2" -> CheckLangForGoodbye (`49001122-78ef-4abb-ccdd-eeff00112233`)
  - InputTimeLimitExceeded -> CheckLangForGoodbye (`49001122-78ef-4abb-ccdd-eeff00112233`)
  - NoMatchingCondition -> CheckLangForGoodbye
  - NoMatchingError -> CheckLangForGoodbye
- **Notes:** Fallback when both Tier 1 and Tier 2 queues are at capacity.

---

### G. Request Callback Path

#### Block G1: CallbackCollectInput
- **UUID:** `32334455-6778-49aa-bbcc-ddeeff001122`
- **Type:** `GetParticipantInput`
- **Parameters:**
  - Text: `"Please say or enter the 10-digit phone number where you would like to be reached, followed by the pound key."`
  - StoreInput: `"True"`
  - InputTimeLimitSeconds: `"15"`
- **Transitions:**
  - NextAction -> InvokeCreateCallback (`43445566-7889-4abb-ccdd-eeff00112233`)
  - InputTimeLimitExceeded -> CheckLangForGoodbye (`49001122-78ef-4abb-ccdd-eeff00112233`)
  - NoMatchingCondition -> InvokeCreateCallback
  - NoMatchingError -> CheckLangForGoodbye
- **Notes:** Collects callback phone number. StoreInput is True so the number is stored as `$.StoredCustomerInput`. The input is passed to the Lambda for callback creation.

#### Block G2: InvokeCreateCallback
- **UUID:** `43445566-7889-4abb-ccdd-eeff00112233`
- **Type:** `InvokeExternalResource`
- **Parameters:**
  - FunctionArn: `"arn:aws:lambda:us-east-1:ACCOUNT:function:healthcare-auth-create-callback"`
  - TimeLimit: `"8"`
- **Transitions:**
  - NextAction -> PlayCallbackConfirm (`54556677-8990-4bcc-ddee-ff0011223344`)
  - NoMatchingError -> PlayCallbackConfirm (still confirm even if Lambda has issues -- the Lambda should handle retries internally)
- **Notes:** Creates callback request with callbackNumber and memberId. Returns `{ callbackId: string }`.

#### Block G3: PlayCallbackConfirm
- **UUID:** `54556677-8990-4bcc-ddee-ff0011223344`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye."`
- **Transitions:**
  - NextAction -> DisconnectCallback (`65667788-9a01-4cdd-eeff-001122334455`)
  - NoMatchingError -> DisconnectCallback
- **Notes:** Confirms callback and ends the call.

#### Block G4: DisconnectCallback
- **UUID:** `65667788-9a01-4cdd-eeff-001122334455`
- **Type:** `DisconnectParticipant`
- **Parameters:** `{}`
- **Transitions:** `{}`
- **Notes:** Terminal disconnect after callback confirmation.

---

### H. After-Hours Flow

#### Block H1: CheckLangAfterHours
- **UUID:** `76778899-ab12-4dee-ff00-112233445566`
- **Type:** `Compare`
- **Parameters:**
  - ComparisonValue: `"$.Attributes.language"`
- **Transitions:**
  - Condition "en" -> PlayAfterHoursEN (`87889900-bc23-4eff-0011-223344556677`)
  - Condition "es" -> PlayAfterHoursES (`98990011-cd34-4f00-1122-334455667788`)
  - NoMatchingCondition -> PlayAfterHoursEN
- **Notes:** Routes to language-appropriate after-hours greeting.

#### Block H2: PlayAfterHoursEN
- **UUID:** `87889900-bc23-4eff-0011-223344556677`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"Thank you for calling the Healthcare Authorization Center. Our office is currently closed. Our business hours are Monday through Friday, 8 AM to 6 PM Eastern Time."`
- **Transitions:**
  - NextAction -> AfterHoursMenuEN (`a9001122-de45-4011-2233-445566778899`)
  - NoMatchingError -> AfterHoursMenuEN
- **Notes:** English after-hours greeting.

#### Block H3: PlayAfterHoursES
- **UUID:** `98990011-cd34-4f00-1122-334455667788`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"Gracias por llamar al Centro de Autorizacion de Salud. Nuestra oficina esta actualmente cerrada. Nuestro horario de atencion es de lunes a viernes, de 8 AM a 6 PM hora del Este."`
- **Transitions:**
  - NextAction -> AfterHoursMenuES (`b0112233-ef56-4122-3344-5566778899aa`)
  - NoMatchingError -> AfterHoursMenuES
- **Notes:** Spanish after-hours greeting.

#### Block H4: AfterHoursMenuEN
- **UUID:** `a9001122-de45-4011-2233-445566778899`
- **Type:** `GetParticipantInput`
- **Parameters:**
  - Text: `"Press 1 to request a callback during our next business day, or press 2 to leave a voicemail message."`
  - StoreInput: `"False"`
  - InputTimeLimitSeconds: `"7"`
- **Transitions:**
  - Condition "1" -> AfterHoursCallbackInput (`5a112233-8900-4bcc-ddee-ff0011223344`)
  - Condition "2" -> PlayVoicemailPrompt (`c1223344-f067-4233-4455-66778899aabb`)
  - InputTimeLimitExceeded -> PlayGoodbye (`e3445566-1289-4455-6677-8899aabbccdd`)
  - NoMatchingCondition -> PlayGoodbye
  - NoMatchingError -> PlayGoodbye
- **Notes:** English after-hours menu with callback and voicemail options.

#### Block H5: AfterHoursMenuES
- **UUID:** `b0112233-ef56-4122-3344-5566778899aa`
- **Type:** `GetParticipantInput`
- **Parameters:**
  - Text: `"Presione 1 para solicitar una llamada de regreso durante nuestro proximo dia habil, o presione 2 para dejar un mensaje de voz."`
  - StoreInput: `"False"`
  - InputTimeLimitSeconds: `"7"`
- **Transitions:**
  - Condition "1" -> AfterHoursCallbackInput (`5a112233-8900-4bcc-ddee-ff0011223344`)
  - Condition "2" -> PlayVoicemailPrompt (`c1223344-f067-4233-4455-66778899aabb`)
  - InputTimeLimitExceeded -> PlayGoodbyeES (`f4556677-239a-4566-7788-99aabbccddee`)
  - NoMatchingCondition -> PlayGoodbyeES
  - NoMatchingError -> PlayGoodbyeES
- **Notes:** Spanish after-hours menu.

#### Block H6: AfterHoursCallbackInput
- **UUID:** `5a112233-8900-4bcc-ddee-ff0011223344`
- **Type:** `GetParticipantInput`
- **Parameters:**
  - Text: `"Please say or enter the 10-digit phone number where you would like to be reached, followed by the pound key."`
  - StoreInput: `"True"`
  - InputTimeLimitSeconds: `"15"`
- **Transitions:**
  - NextAction -> InvokeCreateCallbackAH (`7c334455-ab22-4dee-ff00-112233445566`)
  - InputTimeLimitExceeded -> CheckLangForGoodbye (`49001122-78ef-4abb-ccdd-eeff00112233`)
  - NoMatchingCondition -> InvokeCreateCallbackAH
  - NoMatchingError -> CheckLangForGoodbye
- **Notes:** Collects callback number for after-hours callback request.

#### Block H7: InvokeCreateCallbackAH
- **UUID:** `7c334455-ab22-4dee-ff00-112233445566`
- **Type:** `InvokeExternalResource`
- **Parameters:**
  - FunctionArn: `"arn:aws:lambda:us-east-1:ACCOUNT:function:healthcare-auth-create-callback"`
  - TimeLimit: `"8"`
- **Transitions:**
  - NextAction -> PlayAfterHoursCallbackConfirm (`6b223344-9a11-4cdd-eeff-001122334455`)
  - NoMatchingError -> PlayAfterHoursCallbackConfirm
- **Notes:** Same Lambda as in-hours callback creation.

#### Block H8: PlayAfterHoursCallbackConfirm
- **UUID:** `6b223344-9a11-4cdd-eeff-001122334455`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"We have scheduled a callback for you. You will receive a call within 2 business hours. Thank you for calling. Goodbye."`
- **Transitions:**
  - NextAction -> DisconnectAfterHoursCB (`8d445566-bc33-4eff-0011-223344556677`)
  - NoMatchingError -> DisconnectAfterHoursCB
- **Notes:** After-hours callback confirmation.

#### Block H9: DisconnectAfterHoursCB
- **UUID:** `8d445566-bc33-4eff-0011-223344556677`
- **Type:** `DisconnectParticipant`
- **Parameters:** `{}`
- **Transitions:** `{}`
- **Notes:** Terminal disconnect after after-hours callback.

#### Block H10: PlayVoicemailPrompt
- **UUID:** `c1223344-f067-4233-4455-66778899aabb`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"Please leave your message after the tone. Press the pound key when you are finished."`
- **Transitions:**
  - NextAction -> DisconnectVoicemail (`d2334455-0178-4344-5566-778899aabbcc`)
  - NoMatchingError -> DisconnectVoicemail
- **Notes:** In a production deployment, this would be followed by a voicemail recording module. For this flow, we play the prompt and then disconnect (the actual recording is handled by the Amazon Connect voicemail feature or a Kinesis stream).

#### Block H11: DisconnectVoicemail
- **UUID:** `d2334455-0178-4344-5566-778899aabbcc`
- **Type:** `DisconnectParticipant`
- **Parameters:** `{}`
- **Transitions:** `{}`
- **Notes:** Terminal disconnect after voicemail prompt.

---

### I. Error Handling and Disconnect Blocks

#### Block I1: CheckLangForGoodbye
- **UUID:** `49001122-78ef-4abb-ccdd-eeff00112233`
- **Type:** `Compare`
- **Parameters:**
  - ComparisonValue: `"$.Attributes.language"`
- **Transitions:**
  - Condition "en" -> PlayGoodbye (`e3445566-1289-4455-6677-8899aabbccdd`)
  - Condition "es" -> PlayGoodbyeES (`f4556677-239a-4566-7788-99aabbccddee`)
  - NoMatchingCondition -> PlayGoodbye
- **Notes:** Routes to language-appropriate goodbye message.

#### Block I2: PlayGoodbye (English)
- **UUID:** `e3445566-1289-4455-6677-8899aabbccdd`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"Thank you for calling the Healthcare Authorization Center. Goodbye."`
- **Transitions:**
  - NextAction -> DisconnectMain (`05667788-34ab-4677-8899-aabbccddeeff`)
  - NoMatchingError -> DisconnectMain
- **Notes:** English goodbye prompt.

#### Block I3: PlayGoodbyeES (Spanish)
- **UUID:** `f4556677-239a-4566-7788-99aabbccddee`
- **Type:** `MessageParticipant`
- **Parameters:**
  - Text: `"Gracias por llamar al Centro de Autorizacion de Salud. Adios."`
- **Transitions:**
  - NextAction -> DisconnectMain (`05667788-34ab-4677-8899-aabbccddeeff`)
  - NoMatchingError -> DisconnectMain
- **Notes:** Spanish goodbye prompt.

#### Block I4: DisconnectMain
- **UUID:** `05667788-34ab-4677-8899-aabbccddeeff`
- **Type:** `DisconnectParticipant`
- **Parameters:** `{}`
- **Transitions:** `{}`
- **Notes:** Main terminal disconnect block used by goodbye paths and successful queue transfers.

---
