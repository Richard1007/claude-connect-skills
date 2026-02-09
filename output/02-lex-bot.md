# Healthcare Authorization Call Center -- Amazon Lex V2 Bot Configuration

> **Document Version:** 1.0
> **NLU Model:** Nova Soniv
> **AWS Service:** Amazon Lex V2
> **Target Integration:** Amazon Connect IVR

---

## Table of Contents

1. [Bot Architecture Overview](#section-1-bot-architecture-overview)
2. [Bot 1 -- HealthcareAuthMainMenuBot (English)](#section-2-bot-1--healthcareauthmainmenubot-english)
3. [Bot 2 -- HealthcareAuthMainMenuBotES (Spanish)](#section-3-bot-2--healthcareauthmainmenubotes-spanish)
4. [Bot 3 -- HealthcareAuthBot (Authentication)](#section-4-bot-3--healthcareauthbot-authentication)
5. [DTMF Configuration](#section-5-dtmf-configuration)
6. [AWS CLI Deployment Script](#section-6-aws-cli-deployment-script)
7. [Error Handling Strategy](#section-7-error-handling-strategy)
8. [Validation Checklist](#section-8-validation-checklist)

---

## Section 1: Bot Architecture Overview

### System Architecture Diagram

```
                        +--------------------------+
                        |    Incoming Call          |
                        |  (Amazon Connect Flow)   |
                        +------------+-------------+
                                     |
                                     v
                        +------------+-------------+
                        |   Language Selection      |
                        |   "Press 1 English,       |
                        |    Press 2 Espanol"       |
                        +-----+-------------+------+
                              |             |
                     English  |             |  Spanish
                              v             v
              +---------------+--+   +------+----------------+
              | HealthcareAuth   |   | HealthcareAuth        |
              | Bot              |   | Bot                   |
              | (Bot 3 - en_US)  |   | (Bot 3 - es_US)      |
              |                  |   |                       |
              | Collects:        |   | Collects:             |
              |  - memberId      |   |  - memberId           |
              |  - dateOfBirth   |   |  - dateOfBirth        |
              +--------+---------+   +----------+------------+
                       |                        |
                       +-------+  +-------------+
                               |  |
                               v  v
                      +--------+--+---------+
                      |  Lambda / Connect    |
                      |  Validation Logic    |
                      |  (Verify member)     |
                      +--------+--+---------+
                               |  |
              Auth Success     |  |    Auth Failure
              +----------------+  +---------------+
              |                                   |
              v                                   v
   +----------+----------+              +---------+---------+
   | English Path        |              | Retry or Transfer |
   | Bot 1:              |              | to Agent          |
   | HealthcareAuth      |              +-------------------+
   | MainMenuBot (en_US) |
   |                     |
   | OR                  |
   |                     |
   | Spanish Path        |
   | Bot 2:              |
   | HealthcareAuth      |
   | MainMenuBotES       |
   | (es_US)             |
   +--+------+------+---+
      |      |      |
      v      v      v
   DTMF 1  DTMF 2  DTMF 3
   Check    Speak   Request
   Auth     To      Callback
   Status   Agent
      |      |      |
      v      v      v
   +--+--+ ++-+--+ ++-+------+
   |Queue | |Queue| |Lambda   |
   |/Flow | |/Flow| |Callback |
   +------+ +-----+ +---------+
```

### Why Three Separate Bots Are Needed

Amazon Lex V2 maps DTMF digits as text input matched against sample utterances. When a caller presses "1", Lex receives the string `"1"` and matches it to whichever intent contains `"1"` as a sample utterance. This creates an inherent constraint:

1. **DTMF digit collision avoidance:** The authentication bot (Bot 3) collects multi-digit input (9-digit member ID, date of birth). The main menu bots (Bot 1 and Bot 2) use single-digit DTMF (1, 2, 3) for menu routing. If these were combined into a single bot, pressing "1" could trigger `CheckAuthorizationStatusIntent` instead of being captured as part of a member ID.

2. **Locale isolation:** Bot 1 serves English-only callers. Bot 2 serves Spanish-only callers. Bot 3 serves both with dual locale support (`en_US` + `es_US`). Separating the menu bots by language allows each to have a dedicated voice engine (Joanna for English, Lupe for Spanish) and cleanly scoped utterances without cross-language interference.

3. **Session attribute scoping:** Each bot invocation in the Connect flow can have its own DTMF session attributes. The authentication bot needs `max-length: 9` with `end-character: #`, while the menu bots need `max-length: 1`. Separate bots allow these to be configured independently per `GetCustomerInput` block.

### Nova Soniv Model Configuration Notes

The **Nova Soniv** model is Amazon's speech foundation model optimized for real-time, low-latency speech recognition in conversational AI contexts. Key configuration considerations:

- **Model selection:** Nova Soniv is specified at the bot locale level via the `voiceSettings` parameter when creating or updating a bot locale. The engine must be set to `"neural"` and the voice ID selected from the Nova Soniv-compatible voice catalog.
- **Confidence threshold:** Set to `0.40` for all three bots. This is a deliberately lenient threshold appropriate for IVR menu routing where callers may speak in noisy environments (cars, public spaces). The threshold means Lex will match an intent if it has at least 40% confidence, reducing FallbackIntent misfires.
- **Voice settings:** Neural TTS voices are used for all bot responses:
  - English bots: **Joanna** (Neural) -- clear, professional American English female voice
  - Spanish bot: **Lupe** (Neural) -- natural US Spanish female voice
- **Latency:** Nova Soniv delivers sub-second recognition latency, critical for IVR flows where perceived responsiveness affects caller satisfaction and abandonment rates.

---

## Section 2: Bot 1 -- HealthcareAuthMainMenuBot (English)

### Bot Configuration Summary

| Property | Value |
|----------|-------|
| **Bot Name** | `HealthcareAuthMainMenuBot` |
| **Purpose** | Main menu routing after caller authentication |
| **Locale** | `en_US` |
| **NLU Model** | Nova Soniv |
| **Confidence Threshold** | `0.40` |
| **Voice** | Joanna (Neural) |
| **Idle Session TTL** | 300 seconds |
| **Child Directed** | `false` |
| **DTMF Max Length** | 1 digit |
| **Menu Prompt** | "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback." |

---

### Intent: CheckAuthorizationStatusIntent

- **Description:** Matches when the caller wants to check the status of an existing prior authorization, referral authorization, or medical service authorization. Triggered by DTMF digit 1 or by spoken phrases related to authorization status inquiries.
- **DTMF Mapping:** `1`
- **Slots:** None
- **Confirmation:** None
- **Fulfillment:** Returns the matched intent name (`CheckAuthorizationStatusIntent`) to the Amazon Connect flow. The Connect flow then routes the caller to the appropriate queue or invokes a Lambda function to perform the authorization lookup.

**Sample Utterances:**

```json
[
  {"utterance": "1"},
  {"utterance": "check authorization status"},
  {"utterance": "authorization status"},
  {"utterance": "check my authorization"},
  {"utterance": "I want to check my authorization status"},
  {"utterance": "I need to check on an authorization"},
  {"utterance": "status of my authorization"},
  {"utterance": "what is my authorization status"},
  {"utterance": "check status"},
  {"utterance": "prior auth status"},
  {"utterance": "I would like to check my authorization status"},
  {"utterance": "check on my prior authorization"},
  {"utterance": "authorization"},
  {"utterance": "auth status"},
  {"utterance": "can you check my authorization"},
  {"utterance": "I am calling to check my authorization status"},
  {"utterance": "look up my authorization"},
  {"utterance": "status check"}
]
```

**Utterance Coverage Analysis:**

| Category | Examples |
|----------|----------|
| DTMF digit | `"1"` |
| Single keyword | `"authorization"` |
| Noun phrase | `"authorization status"`, `"auth status"`, `"prior auth status"` |
| Action phrase | `"check authorization status"`, `"check status"`, `"status check"` |
| First person | `"I want to check my authorization status"`, `"I need to check on an authorization"` |
| Polite form | `"I would like to check my authorization status"`, `"can you check my authorization"` |
| Casual form | `"check on my prior authorization"`, `"look up my authorization"` |
| Question form | `"what is my authorization status"` |
| Context phrase | `"I am calling to check my authorization status"` |
| Synonym variant | `"prior auth status"`, `"status of my authorization"` |

---

### Intent: SpeakToAgentIntent

- **Description:** Matches when the caller wants to be transferred to a live agent, representative, or human operator. Triggered by DTMF digit 2 or by spoken phrases requesting human assistance.
- **DTMF Mapping:** `2`
- **Slots:** None
- **Confirmation:** None
- **Fulfillment:** Returns the matched intent name (`SpeakToAgentIntent`) to the Amazon Connect flow. The Connect flow then transfers the caller to the appropriate agent queue.

**Sample Utterances:**

```json
[
  {"utterance": "2"},
  {"utterance": "speak to an agent"},
  {"utterance": "agent"},
  {"utterance": "talk to someone"},
  {"utterance": "I want to speak to an agent"},
  {"utterance": "I need to talk to a representative"},
  {"utterance": "representative"},
  {"utterance": "transfer me to an agent"},
  {"utterance": "connect me to a person"},
  {"utterance": "I would like to speak with someone"},
  {"utterance": "live agent"},
  {"utterance": "human"},
  {"utterance": "operator"},
  {"utterance": "can I talk to a real person"},
  {"utterance": "I need help from an agent"},
  {"utterance": "speak with a representative"},
  {"utterance": "let me talk to someone"},
  {"utterance": "transfer me"}
]
```

**Utterance Coverage Analysis:**

| Category | Examples |
|----------|----------|
| DTMF digit | `"2"` |
| Single keyword | `"agent"`, `"representative"`, `"human"`, `"operator"` |
| Noun phrase | `"live agent"` |
| Action phrase | `"speak to an agent"`, `"talk to someone"`, `"transfer me"` |
| First person | `"I want to speak to an agent"`, `"I need to talk to a representative"` |
| Polite form | `"I would like to speak with someone"`, `"can I talk to a real person"` |
| Casual form | `"let me talk to someone"`, `"transfer me"` |
| Synonym variant | `"representative"`, `"human"`, `"operator"`, `"a real person"` |
| Request pattern | `"connect me to a person"`, `"I need help from an agent"` |

---

### Intent: RequestCallbackIntent

- **Description:** Matches when the caller wants to request a callback instead of waiting on hold. Triggered by DTMF digit 3 or by spoken phrases requesting a return call.
- **DTMF Mapping:** `3`
- **Slots:** None
- **Confirmation:** None
- **Fulfillment:** Returns the matched intent name (`RequestCallbackIntent`) to the Amazon Connect flow. The Connect flow then invokes a Lambda function to schedule the callback or places the caller in a callback queue.

**Sample Utterances:**

```json
[
  {"utterance": "3"},
  {"utterance": "request a callback"},
  {"utterance": "callback"},
  {"utterance": "call me back"},
  {"utterance": "I want a callback"},
  {"utterance": "I would like to request a callback"},
  {"utterance": "please call me back"},
  {"utterance": "I need a callback"},
  {"utterance": "schedule a callback"},
  {"utterance": "have someone call me back"},
  {"utterance": "return my call"},
  {"utterance": "I do not want to wait on hold"},
  {"utterance": "call back"},
  {"utterance": "I would like someone to call me"},
  {"utterance": "can someone call me back"},
  {"utterance": "request callback"},
  {"utterance": "I prefer a callback"},
  {"utterance": "put me on the callback list"}
]
```

**Utterance Coverage Analysis:**

| Category | Examples |
|----------|----------|
| DTMF digit | `"3"` |
| Single keyword | `"callback"` |
| Noun phrase | `"call back"`, `"request callback"` |
| Action phrase | `"request a callback"`, `"call me back"`, `"schedule a callback"` |
| First person | `"I want a callback"`, `"I need a callback"`, `"I prefer a callback"` |
| Polite form | `"I would like to request a callback"`, `"please call me back"` |
| Casual form | `"call me back"`, `"return my call"` |
| Contextual | `"I do not want to wait on hold"`, `"put me on the callback list"` |
| Request pattern | `"have someone call me back"`, `"can someone call me back"` |
| Synonym variant | `"return my call"`, `"have someone call me"` |

---

### AMAZON.FallbackIntent Configuration (Bot 1)

The `AMAZON.FallbackIntent` is auto-created by Lex and cannot be deleted. It triggers when no other intent meets the confidence threshold (0.40).

**Configuration:**

| Property | Value |
|----------|-------|
| **Intent Name** | `AMAZON.FallbackIntent` |
| **Auto-Created** | Yes (do not manually create) |
| **Closing Response** | "I am sorry, I did not understand that selection. Please try again. You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback." |
| **Active** | Yes |

**Closing Response Message:**

```json
{
  "closingResponse": {
    "messageGroups": [
      {
        "message": {
          "plainTextMessage": {
            "value": "I am sorry, I did not understand that selection. Please try again. You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."
          }
        }
      }
    ],
    "allowInterrupt": true
  }
}
```

**Behavior in Connect Flow:**
When the FallbackIntent fires, the Connect flow receives `AMAZON.FallbackIntent` as the intent name. The flow should increment a retry counter and either re-prompt (up to 2 retries) or transfer to a live agent on the third failure.

---

## Section 3: Bot 2 -- HealthcareAuthMainMenuBotES (Spanish)

### Bot Configuration Summary

| Property | Value |
|----------|-------|
| **Bot Name** | `HealthcareAuthMainMenuBotES` |
| **Purpose** | Main menu routing for Spanish-speaking callers |
| **Locale** | `es_US` |
| **NLU Model** | Nova Soniv |
| **Confidence Threshold** | `0.40` |
| **Voice** | Lupe (Neural) |
| **Idle Session TTL** | 300 seconds |
| **Child Directed** | `false` |
| **DTMF Max Length** | 1 digit |
| **Menu Prompt** | "Como podemos ayudarle hoy? Puede decir o presionar 1 para verificar el estado de su autorizacion, decir o presionar 2 para hablar con un agente, o decir o presionar 3 para solicitar una llamada de regreso." |

---

### Intent: CheckAuthorizationStatusIntent

- **Description:** Matches when the Spanish-speaking caller wants to check the status of an existing authorization. Triggered by DTMF digit 1 or by spoken Spanish phrases related to authorization status inquiries.
- **DTMF Mapping:** `1`
- **Slots:** None
- **Confirmation:** None
- **Fulfillment:** Returns the matched intent name (`CheckAuthorizationStatusIntent`) to the Amazon Connect flow.

**Sample Utterances:**

```json
[
  {"utterance": "1"},
  {"utterance": "verificar estado de autorizacion"},
  {"utterance": "estado de autorizacion"},
  {"utterance": "quiero verificar mi autorizacion"},
  {"utterance": "revisar mi autorizacion"},
  {"utterance": "necesito saber el estado de mi autorizacion"},
  {"utterance": "consultar autorizacion"},
  {"utterance": "cual es el estado de mi autorizacion"},
  {"utterance": "verificar autorizacion"},
  {"utterance": "estado de mi autorizacion previa"},
  {"utterance": "autorizacion"},
  {"utterance": "checar mi autorizacion"},
  {"utterance": "como va mi autorizacion"},
  {"utterance": "quiero consultar el estado de mi autorizacion"},
  {"utterance": "revisar el estado"},
  {"utterance": "me gustaria verificar mi autorizacion"},
  {"utterance": "estoy llamando para verificar mi autorizacion"},
  {"utterance": "buscar mi autorizacion"}
]
```

**Utterance Coverage Analysis:**

| Category | Examples |
|----------|----------|
| DTMF digit | `"1"` |
| Single keyword | `"autorizacion"` |
| Noun phrase | `"estado de autorizacion"`, `"estado de mi autorizacion previa"` |
| Action phrase | `"verificar estado de autorizacion"`, `"consultar autorizacion"`, `"revisar el estado"` |
| First person | `"quiero verificar mi autorizacion"`, `"necesito saber el estado de mi autorizacion"` |
| Polite form | `"me gustaria verificar mi autorizacion"` |
| Casual form | `"checar mi autorizacion"`, `"como va mi autorizacion"` |
| Question form | `"cual es el estado de mi autorizacion"` |
| Context phrase | `"estoy llamando para verificar mi autorizacion"` |
| Synonym variant | `"revisar"`, `"consultar"`, `"checar"`, `"buscar"` |

---

### Intent: SpeakToAgentIntent

- **Description:** Matches when the Spanish-speaking caller wants to be transferred to a live agent. Triggered by DTMF digit 2 or by spoken Spanish phrases requesting human assistance.
- **DTMF Mapping:** `2`
- **Slots:** None
- **Confirmation:** None
- **Fulfillment:** Returns the matched intent name (`SpeakToAgentIntent`) to the Amazon Connect flow.

**Sample Utterances:**

```json
[
  {"utterance": "2"},
  {"utterance": "hablar con un agente"},
  {"utterance": "agente"},
  {"utterance": "quiero hablar con alguien"},
  {"utterance": "necesito hablar con un representante"},
  {"utterance": "representante"},
  {"utterance": "transferir a un agente"},
  {"utterance": "conectar con una persona"},
  {"utterance": "me gustaria hablar con alguien"},
  {"utterance": "agente en vivo"},
  {"utterance": "persona real"},
  {"utterance": "operador"},
  {"utterance": "puedo hablar con una persona"},
  {"utterance": "necesito ayuda de un agente"},
  {"utterance": "hablar con un representante"},
  {"utterance": "paseme con un agente"},
  {"utterance": "comuniqueme con alguien"},
  {"utterance": "quiero un agente"}
]
```

**Utterance Coverage Analysis:**

| Category | Examples |
|----------|----------|
| DTMF digit | `"2"` |
| Single keyword | `"agente"`, `"representante"`, `"operador"` |
| Noun phrase | `"agente en vivo"`, `"persona real"` |
| Action phrase | `"hablar con un agente"`, `"transferir a un agente"` |
| First person | `"quiero hablar con alguien"`, `"necesito hablar con un representante"` |
| Polite form | `"me gustaria hablar con alguien"`, `"puedo hablar con una persona"` |
| Casual form | `"paseme con un agente"`, `"comuniqueme con alguien"` |
| Request pattern | `"necesito ayuda de un agente"`, `"conectar con una persona"` |
| Imperative | `"paseme con un agente"`, `"comuniqueme con alguien"` |

---

### Intent: RequestCallbackIntent

- **Description:** Matches when the Spanish-speaking caller wants to request a callback instead of waiting on hold. Triggered by DTMF digit 3 or by spoken Spanish phrases requesting a return call.
- **DTMF Mapping:** `3`
- **Slots:** None
- **Confirmation:** None
- **Fulfillment:** Returns the matched intent name (`RequestCallbackIntent`) to the Amazon Connect flow.

**Sample Utterances:**

```json
[
  {"utterance": "3"},
  {"utterance": "solicitar una llamada de regreso"},
  {"utterance": "llamada de regreso"},
  {"utterance": "llamame de vuelta"},
  {"utterance": "quiero una llamada de regreso"},
  {"utterance": "me gustaria solicitar una llamada"},
  {"utterance": "por favor llamenme de vuelta"},
  {"utterance": "necesito una llamada de regreso"},
  {"utterance": "programar una llamada"},
  {"utterance": "que alguien me llame"},
  {"utterance": "devolver mi llamada"},
  {"utterance": "no quiero esperar en la linea"},
  {"utterance": "llamada de vuelta"},
  {"utterance": "me gustaria que alguien me llame"},
  {"utterance": "pueden llamarme de vuelta"},
  {"utterance": "solicitar devolucion de llamada"},
  {"utterance": "prefiero una llamada de regreso"},
  {"utterance": "ponme en la lista de llamadas"}
]
```

**Utterance Coverage Analysis:**

| Category | Examples |
|----------|----------|
| DTMF digit | `"3"` |
| Single keyword | (N/A -- "callback" is a multi-word concept in Spanish) |
| Noun phrase | `"llamada de regreso"`, `"llamada de vuelta"`, `"devolucion de llamada"` |
| Action phrase | `"solicitar una llamada de regreso"`, `"programar una llamada"` |
| First person | `"quiero una llamada de regreso"`, `"necesito una llamada de regreso"` |
| Polite form | `"me gustaria solicitar una llamada"`, `"por favor llamenme de vuelta"` |
| Casual form | `"llamame de vuelta"`, `"que alguien me llame"` |
| Contextual | `"no quiero esperar en la linea"`, `"ponme en la lista de llamadas"` |
| Request pattern | `"pueden llamarme de vuelta"`, `"me gustaria que alguien me llame"` |
| Imperative | `"llamame de vuelta"`, `"devolver mi llamada"` |

---

### AMAZON.FallbackIntent Configuration (Bot 2)

**Configuration:**

| Property | Value |
|----------|-------|
| **Intent Name** | `AMAZON.FallbackIntent` |
| **Auto-Created** | Yes (do not manually create) |
| **Closing Response** | "Lo siento, no entendi su seleccion. Por favor intente de nuevo. Puede decir o presionar 1 para verificar el estado de su autorizacion, decir o presionar 2 para hablar con un agente, o decir o presionar 3 para solicitar una llamada de regreso." |
| **Active** | Yes |

**Closing Response Message:**

```json
{
  "closingResponse": {
    "messageGroups": [
      {
        "message": {
          "plainTextMessage": {
            "value": "Lo siento, no entendi su seleccion. Por favor intente de nuevo. Puede decir o presionar 1 para verificar el estado de su autorizacion, decir o presionar 2 para hablar con un agente, o decir o presionar 3 para solicitar una llamada de regreso."
          }
        }
      }
    ],
    "allowInterrupt": true
  }
}
```

---

## Section 4: Bot 3 -- HealthcareAuthBot (Authentication)

### Bot Configuration Summary

| Property | Value |
|----------|-------|
| **Bot Name** | `HealthcareAuthBot` |
| **Purpose** | Authenticate callers by collecting member ID and date of birth |
| **Locales** | `en_US` and `es_US` (dual locale) |
| **NLU Model** | Nova Soniv |
| **Confidence Threshold** | `0.40` (both locales) |
| **Voice (en_US)** | Joanna (Neural) |
| **Voice (es_US)** | Lupe (Neural) |
| **Idle Session TTL** | 300 seconds |
| **Child Directed** | `false` |
| **DTMF Max Length** | 9 digits (for member ID) |
| **DTMF End Character** | `#` |

---

### Intent: AuthenticateIntent

- **Description:** Collects the caller's 9-digit member ID and date of birth for identity verification. This intent uses an ordered slot elicitation flow: first the member ID, then the date of birth. After both slots are filled, a confirmation prompt reads back the collected values for the caller to verify.

#### Slot Priority Order

| Priority | Slot Name | Type | Purpose |
|----------|-----------|------|---------|
| 1 | `memberId` | `AMAZON.Number` | 9-digit member identification number |
| 2 | `dateOfBirth` | `AMAZON.Date` | Caller's date of birth for verification |

---

#### Slot: `memberId`

| Property | Value |
|----------|-------|
| **Slot Name** | `memberId` |
| **Slot Type** | `AMAZON.Number` |
| **Required** | Yes |
| **Slot Priority** | 1 (collected first) |
| **Validation** | 9-digit number (handled via Lambda validation hook) |
| **Max Retries** | 2 |

**Elicitation Prompts:**

| Locale | Prompt |
|--------|--------|
| `en_US` | "Please say or enter your 9-digit member ID." |
| `es_US` | "Por favor diga o ingrese su numero de identificacion de miembro de 9 digitos." |

**Retry Prompts (Declination Response):**

| Locale | Prompt |
|--------|--------|
| `en_US` | "I didn't catch that. Please say or enter your 9-digit member ID." |
| `es_US` | "No entendi. Por favor diga o ingrese su numero de identificacion de miembro de 9 digitos." |

**Slot Elicitation Configuration (en_US):**

```json
{
  "slotName": "memberId",
  "slotTypeName": "AMAZON.Number",
  "valueElicitationSetting": {
    "slotConstraint": "Required",
    "promptSpecification": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Please say or enter your 9-digit member ID."
            }
          }
        }
      ],
      "maxRetries": 2,
      "allowInterrupt": true
    },
    "sampleUtterances": [
      {"utterance": "{memberId}"},
      {"utterance": "my member ID is {memberId}"},
      {"utterance": "its {memberId}"},
      {"utterance": "member ID {memberId}"},
      {"utterance": "{memberId} is my member ID"}
    ]
  },
  "obfuscationSetting": {
    "obfuscationSettingType": "None"
  }
}
```

**Slot Elicitation Configuration (es_US):**

```json
{
  "slotName": "memberId",
  "slotTypeName": "AMAZON.Number",
  "valueElicitationSetting": {
    "slotConstraint": "Required",
    "promptSpecification": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Por favor diga o ingrese su numero de identificacion de miembro de 9 digitos."
            }
          }
        }
      ],
      "maxRetries": 2,
      "allowInterrupt": true
    },
    "sampleUtterances": [
      {"utterance": "{memberId}"},
      {"utterance": "mi numero de miembro es {memberId}"},
      {"utterance": "es {memberId}"},
      {"utterance": "numero de miembro {memberId}"},
      {"utterance": "{memberId} es mi numero de miembro"}
    ]
  },
  "obfuscationSetting": {
    "obfuscationSettingType": "None"
  }
}
```

**Validation Logic (Lambda):**

The 9-digit validation is performed by a Lambda function attached as a dialog code hook on the intent. When the `memberId` slot is filled, the Lambda validates:

```python
def validate_member_id(member_id):
    """Validate that the member ID is exactly 9 digits."""
    member_id_str = str(member_id)
    if len(member_id_str) != 9 or not member_id_str.isdigit():
        return {
            "isValid": False,
            "violationMessage": "The member ID must be exactly 9 digits. Please try again."
        }
    return {"isValid": True}
```

---

#### Slot: `dateOfBirth`

| Property | Value |
|----------|-------|
| **Slot Name** | `dateOfBirth` |
| **Slot Type** | `AMAZON.Date` |
| **Required** | Yes |
| **Slot Priority** | 2 (collected second) |
| **Max Retries** | 2 |

**Elicitation Prompts:**

| Locale | Prompt |
|--------|--------|
| `en_US` | "Now please say or enter your date of birth." |
| `es_US` | "Ahora por favor diga o ingrese su fecha de nacimiento." |

**Retry Prompts (Declination Response):**

| Locale | Prompt |
|--------|--------|
| `en_US` | "I didn't catch that. Please say or enter your date of birth as month, day, and year." |
| `es_US` | "No entendi. Por favor diga o ingrese su fecha de nacimiento como mes, dia y ano." |

**Slot Elicitation Configuration (en_US):**

```json
{
  "slotName": "dateOfBirth",
  "slotTypeName": "AMAZON.Date",
  "valueElicitationSetting": {
    "slotConstraint": "Required",
    "promptSpecification": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Now please say or enter your date of birth."
            }
          }
        }
      ],
      "maxRetries": 2,
      "allowInterrupt": true
    },
    "sampleUtterances": [
      {"utterance": "{dateOfBirth}"},
      {"utterance": "my date of birth is {dateOfBirth}"},
      {"utterance": "its {dateOfBirth}"},
      {"utterance": "born on {dateOfBirth}"},
      {"utterance": "date of birth {dateOfBirth}"},
      {"utterance": "birthday is {dateOfBirth}"}
    ]
  }
}
```

**Slot Elicitation Configuration (es_US):**

```json
{
  "slotName": "dateOfBirth",
  "slotTypeName": "AMAZON.Date",
  "valueElicitationSetting": {
    "slotConstraint": "Required",
    "promptSpecification": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Ahora por favor diga o ingrese su fecha de nacimiento."
            }
          }
        }
      ],
      "maxRetries": 2,
      "allowInterrupt": true
    },
    "sampleUtterances": [
      {"utterance": "{dateOfBirth}"},
      {"utterance": "mi fecha de nacimiento es {dateOfBirth}"},
      {"utterance": "es {dateOfBirth}"},
      {"utterance": "naci el {dateOfBirth}"},
      {"utterance": "fecha de nacimiento {dateOfBirth}"},
      {"utterance": "mi cumpleanos es {dateOfBirth}"}
    ]
  }
}
```

---

#### Sample Utterances (Intent-Level Trigger)

These utterances trigger the `AuthenticateIntent` itself (before slot elicitation begins):

**English (en_US):**

```json
[
  {"utterance": "I need to verify my identity"},
  {"utterance": "verify"},
  {"utterance": "authenticate"},
  {"utterance": "I want to authenticate"},
  {"utterance": "verify my identity"},
  {"utterance": "I need to log in"},
  {"utterance": "identity verification"},
  {"utterance": "confirm my identity"},
  {"utterance": "I would like to verify my account"},
  {"utterance": "let me verify"},
  {"utterance": "I am ready to verify"},
  {"utterance": "verify my account"},
  {"utterance": "authentication"},
  {"utterance": "I need to confirm who I am"},
  {"utterance": "sign in"},
  {"utterance": "validate my identity"}
]
```

**Spanish (es_US):**

```json
[
  {"utterance": "necesito verificar mi identidad"},
  {"utterance": "verificar"},
  {"utterance": "autenticar"},
  {"utterance": "quiero autenticarme"},
  {"utterance": "verificar mi identidad"},
  {"utterance": "necesito iniciar sesion"},
  {"utterance": "verificacion de identidad"},
  {"utterance": "confirmar mi identidad"},
  {"utterance": "me gustaria verificar mi cuenta"},
  {"utterance": "dejeme verificar"},
  {"utterance": "estoy listo para verificar"},
  {"utterance": "verificar mi cuenta"},
  {"utterance": "autenticacion"},
  {"utterance": "necesito confirmar quien soy"},
  {"utterance": "iniciar sesion"},
  {"utterance": "validar mi identidad"}
]
```

---

#### Confirmation Prompt

**English (en_US):**

```json
{
  "intentConfirmationSetting": {
    "promptSpecification": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "I have your member ID as {memberId} and date of birth as {dateOfBirth}. Is that correct?"
            }
          }
        }
      ],
      "maxRetries": 1,
      "allowInterrupt": true
    },
    "declinationResponse": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Let me collect your information again."
            }
          }
        }
      ],
      "allowInterrupt": false
    }
  }
}
```

**Spanish (es_US):**

```json
{
  "intentConfirmationSetting": {
    "promptSpecification": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Tengo su numero de miembro como {memberId} y fecha de nacimiento como {dateOfBirth}. Es correcto?"
            }
          }
        }
      ],
      "maxRetries": 1,
      "allowInterrupt": true
    },
    "declinationResponse": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Dejeme recopilar su informacion de nuevo."
            }
          }
        }
      ],
      "allowInterrupt": false
    }
  }
}
```

**Confirmation Behavior:**
- If the caller says "yes" / "si": The intent is fulfilled and the slot values (`memberId`, `dateOfBirth`) are returned to the Connect flow for backend validation.
- If the caller says "no": The declination response plays and slot elicitation restarts from the beginning (both slots cleared).

---

### AMAZON.FallbackIntent Configuration (Bot 3)

**English (en_US) Closing Response:**

```json
{
  "closingResponse": {
    "messageGroups": [
      {
        "message": {
          "plainTextMessage": {
            "value": "I am sorry, I was not able to understand. Let me transfer you to an agent who can help verify your identity."
          }
        }
      }
    ],
    "allowInterrupt": false
  }
}
```

**Spanish (es_US) Closing Response:**

```json
{
  "closingResponse": {
    "messageGroups": [
      {
        "message": {
          "plainTextMessage": {
            "value": "Lo siento, no pude entender. Dejeme transferirlo a un agente que pueda ayudar a verificar su identidad."
          }
        }
      }
    ],
    "allowInterrupt": false
  }
}
```

---

## Section 5: DTMF Configuration

### Overview

DTMF (Dual-Tone Multi-Frequency) configuration in Amazon Lex V2 is managed through session attributes set in the Amazon Connect flow, not in the Lex bot definition itself. When a caller presses a phone key, Connect sends the digit to Lex as text input. Lex then matches it against sample utterances that include that digit.

### Session Attributes for Menu Bots (Bot 1 and Bot 2)

These attributes are set in the `GetCustomerInput` block of the Connect flow that invokes the main menu bots.

```json
{
  "x-amz-lex:dtmf:end-timeout-ms:*:*": "3000",
  "x-amz-lex:dtmf:max-length:*:*": "1",
  "x-amz-lex:dtmf:deletion-character:*:*": "*"
}
```

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `x-amz-lex:dtmf:end-timeout-ms:*:*` | `3000` | Wait 3 seconds after the last digit before processing. For single-digit menus, this effectively means the digit is sent immediately since `max-length` is 1. |
| `x-amz-lex:dtmf:max-length:*:*` | `1` | Accept only 1 digit. As soon as the digit is pressed, it is sent to Lex for matching. |
| `x-amz-lex:dtmf:deletion-character:*:*` | `*` | Pressing `*` clears the entered digits (acts as a backspace). For single-digit input this is rarely used but included for completeness. |

### Session Attributes for Authentication Bot (Bot 3)

These attributes are set in the `GetCustomerInput` block that invokes the authentication bot.

```json
{
  "x-amz-lex:dtmf:end-timeout-ms:*:*": "5000",
  "x-amz-lex:dtmf:max-length:*:*": "9",
  "x-amz-lex:dtmf:end-character:*:*": "#",
  "x-amz-lex:dtmf:deletion-character:*:*": "*"
}
```

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `x-amz-lex:dtmf:end-timeout-ms:*:*` | `5000` | Wait 5 seconds after the last digit before auto-submitting. Gives callers time to enter all 9 digits. |
| `x-amz-lex:dtmf:max-length:*:*` | `9` | Accept up to 9 digits. The member ID is exactly 9 digits. |
| `x-amz-lex:dtmf:end-character:*:*` | `#` | Pressing `#` immediately submits the entered digits without waiting for the timeout. The prompt instructs callers to "enter your 9-digit member ID followed by the pound key." |
| `x-amz-lex:dtmf:deletion-character:*:*` | `*` | Pressing `*` clears the entered digits, allowing the caller to start over if they make a mistake. |

### How DTMF Digits Map to Intents

The mapping is achieved by including the digit as a sample utterance in the target intent:

**Bot 1 (HealthcareAuthMainMenuBot) and Bot 2 (HealthcareAuthMainMenuBotES):**

| DTMF Digit | Intent | Utterance |
|------------|--------|-----------|
| `1` | `CheckAuthorizationStatusIntent` | `"1"` included in sample utterances |
| `2` | `SpeakToAgentIntent` | `"2"` included in sample utterances |
| `3` | `RequestCallbackIntent` | `"3"` included in sample utterances |

**Bot 3 (HealthcareAuthBot):**

DTMF digits for the authentication bot are not mapped to intents. Instead, the multi-digit DTMF input is captured as slot values:
- The 9-digit member ID entered via DTMF is captured by the `memberId` slot (type `AMAZON.Number`).
- The date of birth entered via DTMF (e.g., `01151990` for January 15, 1990) is captured by the `dateOfBirth` slot (type `AMAZON.Date`).

### Connect Flow Session Attribute Configuration

In the Amazon Connect flow editor, session attributes are set in the `GetCustomerInput` block under **Session attributes**.

**For Menu Bot Invocation:**

```
Attribute Key: x-amz-lex:dtmf:end-timeout-ms:*:*
Attribute Value: 3000
Type: String

Attribute Key: x-amz-lex:dtmf:max-length:*:*
Attribute Value: 1
Type: String

Attribute Key: x-amz-lex:dtmf:deletion-character:*:*
Attribute Value: *
Type: String
```

**For Authentication Bot Invocation:**

```
Attribute Key: x-amz-lex:dtmf:end-timeout-ms:*:*
Attribute Value: 5000
Type: String

Attribute Key: x-amz-lex:dtmf:max-length:*:*
Attribute Value: 9
Type: String

Attribute Key: x-amz-lex:dtmf:end-character:*:*
Attribute Value: #
Type: String

Attribute Key: x-amz-lex:dtmf:deletion-character:*:*
Attribute Value: *
Type: String
```

### DTMF Wildcard Notation

The `*:*` at the end of each attribute key is a wildcard that applies the setting to all bot aliases and all locales. To target a specific alias or locale, replace the wildcards:

```
x-amz-lex:dtmf:max-length:{BotAliasName}:{LocaleId}
```

For example:
```
x-amz-lex:dtmf:max-length:LiveAlias:en_US
```

For this deployment, the wildcard notation is recommended since each bot invocation has its own `GetCustomerInput` block with context-appropriate settings.

---

## Section 6: AWS CLI Deployment Script

### Complete Deployment Script

```bash
#!/bin/bash
# ============================================================================
# Healthcare Authorization Call Center -- Lex V2 Bot Deployment Script
# ============================================================================
# This script creates, configures, builds, versions, and deploys all 3 Lex V2
# bots for the Healthcare Authorization IVR system.
#
# Prerequisites:
#   - AWS CLI v2 installed and configured
#   - Appropriate IAM permissions for Lex V2 and Connect
#   - An existing Amazon Connect instance
#   - An existing IAM role for Lex V2 bots
#
# Usage:
#   chmod +x deploy-lex-bots.sh
#   ./deploy-lex-bots.sh
# ============================================================================

set -euo pipefail

# ============================================================================
# CONFIGURATION -- UPDATE THESE VARIABLES
# ============================================================================
ACCOUNT="123456789012"                    # AWS Account ID
REGION="us-east-1"                        # AWS Region
INSTANCE_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Connect Instance ID
ROLE_ARN="arn:aws:iam::${ACCOUNT}:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots_XXXXXXXXXX"
PROFILE="default"                         # AWS CLI profile name
ALIAS_NAME="LiveAlias"                    # Bot alias name

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

wait_for_bot_locale_build() {
  local bot_id=$1
  local locale_id=$2
  local max_attempts=60
  local attempt=0

  echo "  Waiting for bot $bot_id locale $locale_id to build..."
  while [ $attempt -lt $max_attempts ]; do
    STATUS=$(aws lexv2-models describe-bot-locale \
      --bot-id "$bot_id" \
      --bot-version DRAFT \
      --locale-id "$locale_id" \
      --profile "$PROFILE" \
      --region "$REGION" \
      --query 'botLocaleStatus' --output text 2>/dev/null)

    echo "    Build status: $STATUS (attempt $((attempt+1))/$max_attempts)"

    if [ "$STATUS" = "Built" ]; then
      echo "  Build complete for $locale_id!"
      return 0
    fi
    if [ "$STATUS" = "Failed" ]; then
      echo "  ERROR: Build FAILED for bot $bot_id locale $locale_id"
      aws lexv2-models describe-bot-locale \
        --bot-id "$bot_id" \
        --bot-version DRAFT \
        --locale-id "$locale_id" \
        --profile "$PROFILE" \
        --region "$REGION" \
        --query 'failureReasons' --output json
      return 1
    fi

    sleep 5
    attempt=$((attempt+1))
  done

  echo "  ERROR: Build timed out after $max_attempts attempts"
  return 1
}

wait_for_bot_available() {
  local bot_id=$1
  local max_attempts=30
  local attempt=0

  echo "  Waiting for bot $bot_id to become available..."
  while [ $attempt -lt $max_attempts ]; do
    STATUS=$(aws lexv2-models describe-bot \
      --bot-id "$bot_id" \
      --profile "$PROFILE" \
      --region "$REGION" \
      --query 'botStatus' --output text 2>/dev/null)

    if [ "$STATUS" = "Available" ]; then
      echo "  Bot is available!"
      return 0
    fi

    sleep 3
    attempt=$((attempt+1))
  done

  echo "  ERROR: Bot not available after $max_attempts attempts"
  return 1
}

extract_json_field() {
  python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"
}

# ============================================================================
# BOT 1: HealthcareAuthMainMenuBot (English)
# ============================================================================

echo "============================================"
echo "Creating Bot 1: HealthcareAuthMainMenuBot"
echo "============================================"

BOT1_RESPONSE=$(aws lexv2-models create-bot \
  --bot-name "HealthcareAuthMainMenuBot" \
  --description "Main menu routing for Healthcare Authorization Call Center (English)" \
  --role-arn "$ROLE_ARN" \
  --data-privacy '{"childDirected":false}' \
  --idle-session-ttl-in-seconds 300 \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json)

BOT1_ID=$(echo "$BOT1_RESPONSE" | extract_json_field "botId")
echo "Bot 1 ID: $BOT1_ID"

wait_for_bot_available "$BOT1_ID"

# Create en_US locale
echo "  Creating en_US locale..."
aws lexv2-models create-bot-locale \
  --bot-id "$BOT1_ID" \
  --bot-version DRAFT \
  --locale-id en_US \
  --nlu-intent-confidence-threshold 0.40 \
  --voice-settings '{"voiceId":"Joanna","engine":"neural"}' \
  --profile "$PROFILE" \
  --region "$REGION"

sleep 5

# Intent: CheckAuthorizationStatusIntent
echo "  Creating CheckAuthorizationStatusIntent..."
aws lexv2-models create-intent \
  --bot-id "$BOT1_ID" \
  --bot-version DRAFT \
  --locale-id en_US \
  --intent-name "CheckAuthorizationStatusIntent" \
  --description "Caller wants to check authorization status (DTMF 1)" \
  --sample-utterances '[
    {"utterance": "1"},
    {"utterance": "check authorization status"},
    {"utterance": "authorization status"},
    {"utterance": "check my authorization"},
    {"utterance": "I want to check my authorization status"},
    {"utterance": "I need to check on an authorization"},
    {"utterance": "status of my authorization"},
    {"utterance": "what is my authorization status"},
    {"utterance": "check status"},
    {"utterance": "prior auth status"},
    {"utterance": "I would like to check my authorization status"},
    {"utterance": "check on my prior authorization"},
    {"utterance": "authorization"},
    {"utterance": "auth status"},
    {"utterance": "can you check my authorization"},
    {"utterance": "I am calling to check my authorization status"},
    {"utterance": "look up my authorization"},
    {"utterance": "status check"}
  ]' \
  --fulfillment-code-hook '{"enabled":false}' \
  --profile "$PROFILE" \
  --region "$REGION"

# Intent: SpeakToAgentIntent
echo "  Creating SpeakToAgentIntent..."
aws lexv2-models create-intent \
  --bot-id "$BOT1_ID" \
  --bot-version DRAFT \
  --locale-id en_US \
  --intent-name "SpeakToAgentIntent" \
  --description "Caller wants to speak to a live agent (DTMF 2)" \
  --sample-utterances '[
    {"utterance": "2"},
    {"utterance": "speak to an agent"},
    {"utterance": "agent"},
    {"utterance": "talk to someone"},
    {"utterance": "I want to speak to an agent"},
    {"utterance": "I need to talk to a representative"},
    {"utterance": "representative"},
    {"utterance": "transfer me to an agent"},
    {"utterance": "connect me to a person"},
    {"utterance": "I would like to speak with someone"},
    {"utterance": "live agent"},
    {"utterance": "human"},
    {"utterance": "operator"},
    {"utterance": "can I talk to a real person"},
    {"utterance": "I need help from an agent"},
    {"utterance": "speak with a representative"},
    {"utterance": "let me talk to someone"},
    {"utterance": "transfer me"}
  ]' \
  --fulfillment-code-hook '{"enabled":false}' \
  --profile "$PROFILE" \
  --region "$REGION"

# Intent: RequestCallbackIntent
echo "  Creating RequestCallbackIntent..."
aws lexv2-models create-intent \
  --bot-id "$BOT1_ID" \
  --bot-version DRAFT \
  --locale-id en_US \
  --intent-name "RequestCallbackIntent" \
  --description "Caller wants to request a callback (DTMF 3)" \
  --sample-utterances '[
    {"utterance": "3"},
    {"utterance": "request a callback"},
    {"utterance": "callback"},
    {"utterance": "call me back"},
    {"utterance": "I want a callback"},
    {"utterance": "I would like to request a callback"},
    {"utterance": "please call me back"},
    {"utterance": "I need a callback"},
    {"utterance": "schedule a callback"},
    {"utterance": "have someone call me back"},
    {"utterance": "return my call"},
    {"utterance": "I do not want to wait on hold"},
    {"utterance": "call back"},
    {"utterance": "I would like someone to call me"},
    {"utterance": "can someone call me back"},
    {"utterance": "request callback"},
    {"utterance": "I prefer a callback"},
    {"utterance": "put me on the callback list"}
  ]' \
  --fulfillment-code-hook '{"enabled":false}' \
  --profile "$PROFILE" \
  --region "$REGION"

# Update FallbackIntent with closing response
echo "  Configuring FallbackIntent..."
FALLBACK1_ID=$(aws lexv2-models list-intents \
  --bot-id "$BOT1_ID" \
  --bot-version DRAFT \
  --locale-id en_US \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for intent in data['intentSummaries']:
    if intent['intentName'] == 'FallbackIntent':
        print(intent['intentId'])
        break
")

aws lexv2-models update-intent \
  --bot-id "$BOT1_ID" \
  --bot-version DRAFT \
  --locale-id en_US \
  --intent-id "$FALLBACK1_ID" \
  --intent-name "FallbackIntent" \
  --intent-closing-setting '{
    "closingResponse": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "I am sorry, I did not understand that selection. Please try again. You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback."
            }
          }
        }
      ],
      "allowInterrupt": true
    },
    "isActive": true
  }' \
  --profile "$PROFILE" \
  --region "$REGION"

# Build Bot 1
echo "  Building Bot 1..."
aws lexv2-models build-bot-locale \
  --bot-id "$BOT1_ID" \
  --bot-version DRAFT \
  --locale-id en_US \
  --profile "$PROFILE" \
  --region "$REGION"

wait_for_bot_locale_build "$BOT1_ID" "en_US"

# Create version
echo "  Creating version for Bot 1..."
BOT1_VERSION_RESPONSE=$(aws lexv2-models create-bot-version \
  --bot-id "$BOT1_ID" \
  --bot-version-locale-specification '{"en_US":{"sourceBotVersion":"DRAFT"}}' \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json)

BOT1_VERSION=$(echo "$BOT1_VERSION_RESPONSE" | extract_json_field "botVersion")
echo "  Bot 1 Version: $BOT1_VERSION"

# Create alias
echo "  Creating alias for Bot 1..."
BOT1_ALIAS_RESPONSE=$(aws lexv2-models create-bot-alias \
  --bot-id "$BOT1_ID" \
  --bot-alias-name "$ALIAS_NAME" \
  --bot-version "$BOT1_VERSION" \
  --bot-alias-locale-settings '{"en_US":{"enabled":true}}' \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json)

BOT1_ALIAS_ID=$(echo "$BOT1_ALIAS_RESPONSE" | extract_json_field "botAliasId")
BOT1_ALIAS_ARN="arn:aws:lex:${REGION}:${ACCOUNT}:bot-alias/${BOT1_ID}/${BOT1_ALIAS_ID}"
echo "  Bot 1 Alias ID: $BOT1_ALIAS_ID"
echo "  Bot 1 Alias ARN: $BOT1_ALIAS_ARN"

# Associate with Connect
echo "  Associating Bot 1 with Connect..."
aws connect associate-bot \
  --instance-id "$INSTANCE_ID" \
  --lex-v2-bot "{\"AliasArn\":\"$BOT1_ALIAS_ARN\"}" \
  --profile "$PROFILE" \
  --region "$REGION"

echo "Bot 1 deployment COMPLETE."
echo ""

# ============================================================================
# BOT 2: HealthcareAuthMainMenuBotES (Spanish)
# ============================================================================

echo "============================================"
echo "Creating Bot 2: HealthcareAuthMainMenuBotES"
echo "============================================"

BOT2_RESPONSE=$(aws lexv2-models create-bot \
  --bot-name "HealthcareAuthMainMenuBotES" \
  --description "Main menu routing for Healthcare Authorization Call Center (Spanish)" \
  --role-arn "$ROLE_ARN" \
  --data-privacy '{"childDirected":false}' \
  --idle-session-ttl-in-seconds 300 \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json)

BOT2_ID=$(echo "$BOT2_RESPONSE" | extract_json_field "botId")
echo "Bot 2 ID: $BOT2_ID"

wait_for_bot_available "$BOT2_ID"

# Create es_US locale
echo "  Creating es_US locale..."
aws lexv2-models create-bot-locale \
  --bot-id "$BOT2_ID" \
  --bot-version DRAFT \
  --locale-id es_US \
  --nlu-intent-confidence-threshold 0.40 \
  --voice-settings '{"voiceId":"Lupe","engine":"neural"}' \
  --profile "$PROFILE" \
  --region "$REGION"

sleep 5

# Intent: CheckAuthorizationStatusIntent (Spanish)
echo "  Creating CheckAuthorizationStatusIntent (ES)..."
aws lexv2-models create-intent \
  --bot-id "$BOT2_ID" \
  --bot-version DRAFT \
  --locale-id es_US \
  --intent-name "CheckAuthorizationStatusIntent" \
  --description "Caller wants to check authorization status (DTMF 1) - Spanish" \
  --sample-utterances '[
    {"utterance": "1"},
    {"utterance": "verificar estado de autorizacion"},
    {"utterance": "estado de autorizacion"},
    {"utterance": "quiero verificar mi autorizacion"},
    {"utterance": "revisar mi autorizacion"},
    {"utterance": "necesito saber el estado de mi autorizacion"},
    {"utterance": "consultar autorizacion"},
    {"utterance": "cual es el estado de mi autorizacion"},
    {"utterance": "verificar autorizacion"},
    {"utterance": "estado de mi autorizacion previa"},
    {"utterance": "autorizacion"},
    {"utterance": "checar mi autorizacion"},
    {"utterance": "como va mi autorizacion"},
    {"utterance": "quiero consultar el estado de mi autorizacion"},
    {"utterance": "revisar el estado"},
    {"utterance": "me gustaria verificar mi autorizacion"},
    {"utterance": "estoy llamando para verificar mi autorizacion"},
    {"utterance": "buscar mi autorizacion"}
  ]' \
  --fulfillment-code-hook '{"enabled":false}' \
  --profile "$PROFILE" \
  --region "$REGION"

# Intent: SpeakToAgentIntent (Spanish)
echo "  Creating SpeakToAgentIntent (ES)..."
aws lexv2-models create-intent \
  --bot-id "$BOT2_ID" \
  --bot-version DRAFT \
  --locale-id es_US \
  --intent-name "SpeakToAgentIntent" \
  --description "Caller wants to speak to a live agent (DTMF 2) - Spanish" \
  --sample-utterances '[
    {"utterance": "2"},
    {"utterance": "hablar con un agente"},
    {"utterance": "agente"},
    {"utterance": "quiero hablar con alguien"},
    {"utterance": "necesito hablar con un representante"},
    {"utterance": "representante"},
    {"utterance": "transferir a un agente"},
    {"utterance": "conectar con una persona"},
    {"utterance": "me gustaria hablar con alguien"},
    {"utterance": "agente en vivo"},
    {"utterance": "persona real"},
    {"utterance": "operador"},
    {"utterance": "puedo hablar con una persona"},
    {"utterance": "necesito ayuda de un agente"},
    {"utterance": "hablar con un representante"},
    {"utterance": "paseme con un agente"},
    {"utterance": "comuniqueme con alguien"},
    {"utterance": "quiero un agente"}
  ]' \
  --fulfillment-code-hook '{"enabled":false}' \
  --profile "$PROFILE" \
  --region "$REGION"

# Intent: RequestCallbackIntent (Spanish)
echo "  Creating RequestCallbackIntent (ES)..."
aws lexv2-models create-intent \
  --bot-id "$BOT2_ID" \
  --bot-version DRAFT \
  --locale-id es_US \
  --intent-name "RequestCallbackIntent" \
  --description "Caller wants to request a callback (DTMF 3) - Spanish" \
  --sample-utterances '[
    {"utterance": "3"},
    {"utterance": "solicitar una llamada de regreso"},
    {"utterance": "llamada de regreso"},
    {"utterance": "llamame de vuelta"},
    {"utterance": "quiero una llamada de regreso"},
    {"utterance": "me gustaria solicitar una llamada"},
    {"utterance": "por favor llamenme de vuelta"},
    {"utterance": "necesito una llamada de regreso"},
    {"utterance": "programar una llamada"},
    {"utterance": "que alguien me llame"},
    {"utterance": "devolver mi llamada"},
    {"utterance": "no quiero esperar en la linea"},
    {"utterance": "llamada de vuelta"},
    {"utterance": "me gustaria que alguien me llame"},
    {"utterance": "pueden llamarme de vuelta"},
    {"utterance": "solicitar devolucion de llamada"},
    {"utterance": "prefiero una llamada de regreso"},
    {"utterance": "ponme en la lista de llamadas"}
  ]' \
  --fulfillment-code-hook '{"enabled":false}' \
  --profile "$PROFILE" \
  --region "$REGION"

# Update FallbackIntent with closing response (Spanish)
echo "  Configuring FallbackIntent (ES)..."
FALLBACK2_ID=$(aws lexv2-models list-intents \
  --bot-id "$BOT2_ID" \
  --bot-version DRAFT \
  --locale-id es_US \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for intent in data['intentSummaries']:
    if intent['intentName'] == 'FallbackIntent':
        print(intent['intentId'])
        break
")

aws lexv2-models update-intent \
  --bot-id "$BOT2_ID" \
  --bot-version DRAFT \
  --locale-id es_US \
  --intent-id "$FALLBACK2_ID" \
  --intent-name "FallbackIntent" \
  --intent-closing-setting '{
    "closingResponse": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Lo siento, no entendi su seleccion. Por favor intente de nuevo. Puede decir o presionar 1 para verificar el estado de su autorizacion, decir o presionar 2 para hablar con un agente, o decir o presionar 3 para solicitar una llamada de regreso."
            }
          }
        }
      ],
      "allowInterrupt": true
    },
    "isActive": true
  }' \
  --profile "$PROFILE" \
  --region "$REGION"

# Build Bot 2
echo "  Building Bot 2..."
aws lexv2-models build-bot-locale \
  --bot-id "$BOT2_ID" \
  --bot-version DRAFT \
  --locale-id es_US \
  --profile "$PROFILE" \
  --region "$REGION"

wait_for_bot_locale_build "$BOT2_ID" "es_US"

# Create version
echo "  Creating version for Bot 2..."
BOT2_VERSION_RESPONSE=$(aws lexv2-models create-bot-version \
  --bot-id "$BOT2_ID" \
  --bot-version-locale-specification '{"es_US":{"sourceBotVersion":"DRAFT"}}' \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json)

BOT2_VERSION=$(echo "$BOT2_VERSION_RESPONSE" | extract_json_field "botVersion")
echo "  Bot 2 Version: $BOT2_VERSION"

# Create alias
echo "  Creating alias for Bot 2..."
BOT2_ALIAS_RESPONSE=$(aws lexv2-models create-bot-alias \
  --bot-id "$BOT2_ID" \
  --bot-alias-name "$ALIAS_NAME" \
  --bot-version "$BOT2_VERSION" \
  --bot-alias-locale-settings '{"es_US":{"enabled":true}}' \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json)

BOT2_ALIAS_ID=$(echo "$BOT2_ALIAS_RESPONSE" | extract_json_field "botAliasId")
BOT2_ALIAS_ARN="arn:aws:lex:${REGION}:${ACCOUNT}:bot-alias/${BOT2_ID}/${BOT2_ALIAS_ID}"
echo "  Bot 2 Alias ID: $BOT2_ALIAS_ID"
echo "  Bot 2 Alias ARN: $BOT2_ALIAS_ARN"

# Associate with Connect
echo "  Associating Bot 2 with Connect..."
aws connect associate-bot \
  --instance-id "$INSTANCE_ID" \
  --lex-v2-bot "{\"AliasArn\":\"$BOT2_ALIAS_ARN\"}" \
  --profile "$PROFILE" \
  --region "$REGION"

echo "Bot 2 deployment COMPLETE."
echo ""

# ============================================================================
# BOT 3: HealthcareAuthBot (Authentication - Dual Locale)
# ============================================================================

echo "============================================"
echo "Creating Bot 3: HealthcareAuthBot"
echo "============================================"

BOT3_RESPONSE=$(aws lexv2-models create-bot \
  --bot-name "HealthcareAuthBot" \
  --description "Authentication bot for Healthcare Authorization Call Center (EN + ES)" \
  --role-arn "$ROLE_ARN" \
  --data-privacy '{"childDirected":false}' \
  --idle-session-ttl-in-seconds 300 \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json)

BOT3_ID=$(echo "$BOT3_RESPONSE" | extract_json_field "botId")
echo "Bot 3 ID: $BOT3_ID"

wait_for_bot_available "$BOT3_ID"

# Create en_US locale
echo "  Creating en_US locale..."
aws lexv2-models create-bot-locale \
  --bot-id "$BOT3_ID" \
  --bot-version DRAFT \
  --locale-id en_US \
  --nlu-intent-confidence-threshold 0.40 \
  --voice-settings '{"voiceId":"Joanna","engine":"neural"}' \
  --profile "$PROFILE" \
  --region "$REGION"

# Create es_US locale
echo "  Creating es_US locale..."
aws lexv2-models create-bot-locale \
  --bot-id "$BOT3_ID" \
  --bot-version DRAFT \
  --locale-id es_US \
  --nlu-intent-confidence-threshold 0.40 \
  --voice-settings '{"voiceId":"Lupe","engine":"neural"}' \
  --profile "$PROFILE" \
  --region "$REGION"

sleep 5

# --- EN_US LOCALE: AuthenticateIntent ---
echo "  Creating AuthenticateIntent (en_US)..."
BOT3_EN_INTENT_RESPONSE=$(aws lexv2-models create-intent \
  --bot-id "$BOT3_ID" \
  --bot-version DRAFT \
  --locale-id en_US \
  --intent-name "AuthenticateIntent" \
  --description "Collects member ID and date of birth for identity verification" \
  --sample-utterances '[
    {"utterance": "I need to verify my identity"},
    {"utterance": "verify"},
    {"utterance": "authenticate"},
    {"utterance": "I want to authenticate"},
    {"utterance": "verify my identity"},
    {"utterance": "I need to log in"},
    {"utterance": "identity verification"},
    {"utterance": "confirm my identity"},
    {"utterance": "I would like to verify my account"},
    {"utterance": "let me verify"},
    {"utterance": "I am ready to verify"},
    {"utterance": "verify my account"},
    {"utterance": "authentication"},
    {"utterance": "I need to confirm who I am"},
    {"utterance": "sign in"},
    {"utterance": "validate my identity"}
  ]' \
  --intent-confirmation-setting '{
    "promptSpecification": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "I have your member ID as {memberId} and date of birth as {dateOfBirth}. Is that correct?"
            }
          }
        }
      ],
      "maxRetries": 1,
      "allowInterrupt": true
    },
    "declinationResponse": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Let me collect your information again."
            }
          }
        }
      ],
      "allowInterrupt": false
    }
  }' \
  --fulfillment-code-hook '{"enabled":true}' \
  --dialog-code-hook '{"enabled":true}' \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json)

BOT3_EN_INTENT_ID=$(echo "$BOT3_EN_INTENT_RESPONSE" | extract_json_field "intentId")
echo "  AuthenticateIntent (en_US) ID: $BOT3_EN_INTENT_ID"

# Create memberId slot (en_US)
echo "  Creating memberId slot (en_US)..."
aws lexv2-models create-slot \
  --bot-id "$BOT3_ID" \
  --bot-version DRAFT \
  --locale-id en_US \
  --intent-id "$BOT3_EN_INTENT_ID" \
  --slot-name "memberId" \
  --slot-type-id "AMAZON.Number" \
  --value-elicitation-setting '{
    "slotConstraint": "Required",
    "promptSpecification": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Please say or enter your 9-digit member ID."
            }
          }
        }
      ],
      "maxRetries": 2,
      "allowInterrupt": true,
      "messageSelectionStrategy": "Random",
      "promptAttemptsSpecification": {
        "Initial": {
          "allowedInputTypes": {"allowAudioInput": true, "allowDTMFInput": true},
          "allowInterrupt": true
        },
        "Retry1": {
          "allowedInputTypes": {"allowAudioInput": true, "allowDTMFInput": true},
          "textInputSpecification": {"startTimeoutMs": 30000},
          "allowInterrupt": true
        },
        "Retry2": {
          "allowedInputTypes": {"allowAudioInput": true, "allowDTMFInput": true},
          "textInputSpecification": {"startTimeoutMs": 30000},
          "allowInterrupt": true
        }
      }
    },
    "sampleUtterances": [
      {"utterance": "{memberId}"},
      {"utterance": "my member ID is {memberId}"},
      {"utterance": "its {memberId}"},
      {"utterance": "member ID {memberId}"},
      {"utterance": "{memberId} is my member ID"}
    ]
  }' \
  --profile "$PROFILE" \
  --region "$REGION"

# Create dateOfBirth slot (en_US)
echo "  Creating dateOfBirth slot (en_US)..."
aws lexv2-models create-slot \
  --bot-id "$BOT3_ID" \
  --bot-version DRAFT \
  --locale-id en_US \
  --intent-id "$BOT3_EN_INTENT_ID" \
  --slot-name "dateOfBirth" \
  --slot-type-id "AMAZON.Date" \
  --value-elicitation-setting '{
    "slotConstraint": "Required",
    "promptSpecification": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Now please say or enter your date of birth."
            }
          }
        }
      ],
      "maxRetries": 2,
      "allowInterrupt": true,
      "messageSelectionStrategy": "Random",
      "promptAttemptsSpecification": {
        "Initial": {
          "allowedInputTypes": {"allowAudioInput": true, "allowDTMFInput": true},
          "allowInterrupt": true
        },
        "Retry1": {
          "allowedInputTypes": {"allowAudioInput": true, "allowDTMFInput": true},
          "textInputSpecification": {"startTimeoutMs": 30000},
          "allowInterrupt": true
        },
        "Retry2": {
          "allowedInputTypes": {"allowAudioInput": true, "allowDTMFInput": true},
          "textInputSpecification": {"startTimeoutMs": 30000},
          "allowInterrupt": true
        }
      }
    },
    "sampleUtterances": [
      {"utterance": "{dateOfBirth}"},
      {"utterance": "my date of birth is {dateOfBirth}"},
      {"utterance": "its {dateOfBirth}"},
      {"utterance": "born on {dateOfBirth}"},
      {"utterance": "date of birth {dateOfBirth}"},
      {"utterance": "birthday is {dateOfBirth}"}
    ]
  }' \
  --profile "$PROFILE" \
  --region "$REGION"

# Update slot priorities (en_US)
echo "  Setting slot priorities (en_US)..."
MEMBER_SLOT_ID=$(aws lexv2-models list-slots \
  --bot-id "$BOT3_ID" \
  --bot-version DRAFT \
  --locale-id en_US \
  --intent-id "$BOT3_EN_INTENT_ID" \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for slot in data['slotSummaries']:
    if slot['slotName'] == 'memberId':
        print(slot['slotId'])
        break
")

DOB_SLOT_ID=$(aws lexv2-models list-slots \
  --bot-id "$BOT3_ID" \
  --bot-version DRAFT \
  --locale-id en_US \
  --intent-id "$BOT3_EN_INTENT_ID" \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for slot in data['slotSummaries']:
    if slot['slotName'] == 'dateOfBirth':
        print(slot['slotId'])
        break
")

aws lexv2-models update-intent \
  --bot-id "$BOT3_ID" \
  --bot-version DRAFT \
  --locale-id en_US \
  --intent-id "$BOT3_EN_INTENT_ID" \
  --intent-name "AuthenticateIntent" \
  --description "Collects member ID and date of birth for identity verification" \
  --sample-utterances '[
    {"utterance": "I need to verify my identity"},
    {"utterance": "verify"},
    {"utterance": "authenticate"},
    {"utterance": "I want to authenticate"},
    {"utterance": "verify my identity"},
    {"utterance": "I need to log in"},
    {"utterance": "identity verification"},
    {"utterance": "confirm my identity"},
    {"utterance": "I would like to verify my account"},
    {"utterance": "let me verify"},
    {"utterance": "I am ready to verify"},
    {"utterance": "verify my account"},
    {"utterance": "authentication"},
    {"utterance": "I need to confirm who I am"},
    {"utterance": "sign in"},
    {"utterance": "validate my identity"}
  ]' \
  --slot-priorities "[
    {\"priority\": 1, \"slotId\": \"$MEMBER_SLOT_ID\"},
    {\"priority\": 2, \"slotId\": \"$DOB_SLOT_ID\"}
  ]" \
  --intent-confirmation-setting '{
    "promptSpecification": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "I have your member ID as {memberId} and date of birth as {dateOfBirth}. Is that correct?"
            }
          }
        }
      ],
      "maxRetries": 1,
      "allowInterrupt": true
    },
    "declinationResponse": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Let me collect your information again."
            }
          }
        }
      ],
      "allowInterrupt": false
    }
  }' \
  --fulfillment-code-hook '{"enabled":true}' \
  --dialog-code-hook '{"enabled":true}' \
  --profile "$PROFILE" \
  --region "$REGION"

# --- ES_US LOCALE: AuthenticateIntent ---
echo "  Creating AuthenticateIntent (es_US)..."
BOT3_ES_INTENT_RESPONSE=$(aws lexv2-models create-intent \
  --bot-id "$BOT3_ID" \
  --bot-version DRAFT \
  --locale-id es_US \
  --intent-name "AuthenticateIntent" \
  --description "Collects member ID and date of birth for identity verification (Spanish)" \
  --sample-utterances '[
    {"utterance": "necesito verificar mi identidad"},
    {"utterance": "verificar"},
    {"utterance": "autenticar"},
    {"utterance": "quiero autenticarme"},
    {"utterance": "verificar mi identidad"},
    {"utterance": "necesito iniciar sesion"},
    {"utterance": "verificacion de identidad"},
    {"utterance": "confirmar mi identidad"},
    {"utterance": "me gustaria verificar mi cuenta"},
    {"utterance": "dejeme verificar"},
    {"utterance": "estoy listo para verificar"},
    {"utterance": "verificar mi cuenta"},
    {"utterance": "autenticacion"},
    {"utterance": "necesito confirmar quien soy"},
    {"utterance": "iniciar sesion"},
    {"utterance": "validar mi identidad"}
  ]' \
  --intent-confirmation-setting '{
    "promptSpecification": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Tengo su numero de miembro como {memberId} y fecha de nacimiento como {dateOfBirth}. Es correcto?"
            }
          }
        }
      ],
      "maxRetries": 1,
      "allowInterrupt": true
    },
    "declinationResponse": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Dejeme recopilar su informacion de nuevo."
            }
          }
        }
      ],
      "allowInterrupt": false
    }
  }' \
  --fulfillment-code-hook '{"enabled":true}' \
  --dialog-code-hook '{"enabled":true}' \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json)

BOT3_ES_INTENT_ID=$(echo "$BOT3_ES_INTENT_RESPONSE" | extract_json_field "intentId")
echo "  AuthenticateIntent (es_US) ID: $BOT3_ES_INTENT_ID"

# Create memberId slot (es_US)
echo "  Creating memberId slot (es_US)..."
aws lexv2-models create-slot \
  --bot-id "$BOT3_ID" \
  --bot-version DRAFT \
  --locale-id es_US \
  --intent-id "$BOT3_ES_INTENT_ID" \
  --slot-name "memberId" \
  --slot-type-id "AMAZON.Number" \
  --value-elicitation-setting '{
    "slotConstraint": "Required",
    "promptSpecification": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Por favor diga o ingrese su numero de identificacion de miembro de 9 digitos."
            }
          }
        }
      ],
      "maxRetries": 2,
      "allowInterrupt": true,
      "messageSelectionStrategy": "Random",
      "promptAttemptsSpecification": {
        "Initial": {
          "allowedInputTypes": {"allowAudioInput": true, "allowDTMFInput": true},
          "allowInterrupt": true
        },
        "Retry1": {
          "allowedInputTypes": {"allowAudioInput": true, "allowDTMFInput": true},
          "textInputSpecification": {"startTimeoutMs": 30000},
          "allowInterrupt": true
        },
        "Retry2": {
          "allowedInputTypes": {"allowAudioInput": true, "allowDTMFInput": true},
          "textInputSpecification": {"startTimeoutMs": 30000},
          "allowInterrupt": true
        }
      }
    },
    "sampleUtterances": [
      {"utterance": "{memberId}"},
      {"utterance": "mi numero de miembro es {memberId}"},
      {"utterance": "es {memberId}"},
      {"utterance": "numero de miembro {memberId}"},
      {"utterance": "{memberId} es mi numero de miembro"}
    ]
  }' \
  --profile "$PROFILE" \
  --region "$REGION"

# Create dateOfBirth slot (es_US)
echo "  Creating dateOfBirth slot (es_US)..."
aws lexv2-models create-slot \
  --bot-id "$BOT3_ID" \
  --bot-version DRAFT \
  --locale-id es_US \
  --intent-id "$BOT3_ES_INTENT_ID" \
  --slot-name "dateOfBirth" \
  --slot-type-id "AMAZON.Date" \
  --value-elicitation-setting '{
    "slotConstraint": "Required",
    "promptSpecification": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Ahora por favor diga o ingrese su fecha de nacimiento."
            }
          }
        }
      ],
      "maxRetries": 2,
      "allowInterrupt": true,
      "messageSelectionStrategy": "Random",
      "promptAttemptsSpecification": {
        "Initial": {
          "allowedInputTypes": {"allowAudioInput": true, "allowDTMFInput": true},
          "allowInterrupt": true
        },
        "Retry1": {
          "allowedInputTypes": {"allowAudioInput": true, "allowDTMFInput": true},
          "textInputSpecification": {"startTimeoutMs": 30000},
          "allowInterrupt": true
        },
        "Retry2": {
          "allowedInputTypes": {"allowAudioInput": true, "allowDTMFInput": true},
          "textInputSpecification": {"startTimeoutMs": 30000},
          "allowInterrupt": true
        }
      }
    },
    "sampleUtterances": [
      {"utterance": "{dateOfBirth}"},
      {"utterance": "mi fecha de nacimiento es {dateOfBirth}"},
      {"utterance": "es {dateOfBirth}"},
      {"utterance": "naci el {dateOfBirth}"},
      {"utterance": "fecha de nacimiento {dateOfBirth}"},
      {"utterance": "mi cumpleanos es {dateOfBirth}"}
    ]
  }' \
  --profile "$PROFILE" \
  --region "$REGION"

# Update slot priorities (es_US)
echo "  Setting slot priorities (es_US)..."
MEMBER_SLOT_ID_ES=$(aws lexv2-models list-slots \
  --bot-id "$BOT3_ID" \
  --bot-version DRAFT \
  --locale-id es_US \
  --intent-id "$BOT3_ES_INTENT_ID" \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for slot in data['slotSummaries']:
    if slot['slotName'] == 'memberId':
        print(slot['slotId'])
        break
")

DOB_SLOT_ID_ES=$(aws lexv2-models list-slots \
  --bot-id "$BOT3_ID" \
  --bot-version DRAFT \
  --locale-id es_US \
  --intent-id "$BOT3_ES_INTENT_ID" \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for slot in data['slotSummaries']:
    if slot['slotName'] == 'dateOfBirth':
        print(slot['slotId'])
        break
")

aws lexv2-models update-intent \
  --bot-id "$BOT3_ID" \
  --bot-version DRAFT \
  --locale-id es_US \
  --intent-id "$BOT3_ES_INTENT_ID" \
  --intent-name "AuthenticateIntent" \
  --description "Collects member ID and date of birth for identity verification (Spanish)" \
  --sample-utterances '[
    {"utterance": "necesito verificar mi identidad"},
    {"utterance": "verificar"},
    {"utterance": "autenticar"},
    {"utterance": "quiero autenticarme"},
    {"utterance": "verificar mi identidad"},
    {"utterance": "necesito iniciar sesion"},
    {"utterance": "verificacion de identidad"},
    {"utterance": "confirmar mi identidad"},
    {"utterance": "me gustaria verificar mi cuenta"},
    {"utterance": "dejeme verificar"},
    {"utterance": "estoy listo para verificar"},
    {"utterance": "verificar mi cuenta"},
    {"utterance": "autenticacion"},
    {"utterance": "necesito confirmar quien soy"},
    {"utterance": "iniciar sesion"},
    {"utterance": "validar mi identidad"}
  ]' \
  --slot-priorities "[
    {\"priority\": 1, \"slotId\": \"$MEMBER_SLOT_ID_ES\"},
    {\"priority\": 2, \"slotId\": \"$DOB_SLOT_ID_ES\"}
  ]" \
  --intent-confirmation-setting '{
    "promptSpecification": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Tengo su numero de miembro como {memberId} y fecha de nacimiento como {dateOfBirth}. Es correcto?"
            }
          }
        }
      ],
      "maxRetries": 1,
      "allowInterrupt": true
    },
    "declinationResponse": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Dejeme recopilar su informacion de nuevo."
            }
          }
        }
      ],
      "allowInterrupt": false
    }
  }' \
  --fulfillment-code-hook '{"enabled":true}' \
  --dialog-code-hook '{"enabled":true}' \
  --profile "$PROFILE" \
  --region "$REGION"

# Build Bot 3 - both locales
echo "  Building Bot 3 (en_US)..."
aws lexv2-models build-bot-locale \
  --bot-id "$BOT3_ID" \
  --bot-version DRAFT \
  --locale-id en_US \
  --profile "$PROFILE" \
  --region "$REGION"

wait_for_bot_locale_build "$BOT3_ID" "en_US"

echo "  Building Bot 3 (es_US)..."
aws lexv2-models build-bot-locale \
  --bot-id "$BOT3_ID" \
  --bot-version DRAFT \
  --locale-id es_US \
  --profile "$PROFILE" \
  --region "$REGION"

wait_for_bot_locale_build "$BOT3_ID" "es_US"

# Create version (both locales)
echo "  Creating version for Bot 3..."
BOT3_VERSION_RESPONSE=$(aws lexv2-models create-bot-version \
  --bot-id "$BOT3_ID" \
  --bot-version-locale-specification '{
    "en_US": {"sourceBotVersion": "DRAFT"},
    "es_US": {"sourceBotVersion": "DRAFT"}
  }' \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json)

BOT3_VERSION=$(echo "$BOT3_VERSION_RESPONSE" | extract_json_field "botVersion")
echo "  Bot 3 Version: $BOT3_VERSION"

# Create alias (both locales enabled)
echo "  Creating alias for Bot 3..."
BOT3_ALIAS_RESPONSE=$(aws lexv2-models create-bot-alias \
  --bot-id "$BOT3_ID" \
  --bot-alias-name "$ALIAS_NAME" \
  --bot-version "$BOT3_VERSION" \
  --bot-alias-locale-settings '{
    "en_US": {"enabled": true},
    "es_US": {"enabled": true}
  }' \
  --profile "$PROFILE" \
  --region "$REGION" \
  --output json)

BOT3_ALIAS_ID=$(echo "$BOT3_ALIAS_RESPONSE" | extract_json_field "botAliasId")
BOT3_ALIAS_ARN="arn:aws:lex:${REGION}:${ACCOUNT}:bot-alias/${BOT3_ID}/${BOT3_ALIAS_ID}"
echo "  Bot 3 Alias ID: $BOT3_ALIAS_ID"
echo "  Bot 3 Alias ARN: $BOT3_ALIAS_ARN"

# Associate with Connect
echo "  Associating Bot 3 with Connect..."
aws connect associate-bot \
  --instance-id "$INSTANCE_ID" \
  --lex-v2-bot "{\"AliasArn\":\"$BOT3_ALIAS_ARN\"}" \
  --profile "$PROFILE" \
  --region "$REGION"

echo "Bot 3 deployment COMPLETE."
echo ""

# ============================================================================
# DEPLOYMENT SUMMARY
# ============================================================================

echo "============================================"
echo "DEPLOYMENT SUMMARY"
echo "============================================"
echo ""
echo "Bot 1: HealthcareAuthMainMenuBot (English)"
echo "  Bot ID:    $BOT1_ID"
echo "  Version:   $BOT1_VERSION"
echo "  Alias ID:  $BOT1_ALIAS_ID"
echo "  Alias ARN: $BOT1_ALIAS_ARN"
echo ""
echo "Bot 2: HealthcareAuthMainMenuBotES (Spanish)"
echo "  Bot ID:    $BOT2_ID"
echo "  Version:   $BOT2_VERSION"
echo "  Alias ID:  $BOT2_ALIAS_ID"
echo "  Alias ARN: $BOT2_ALIAS_ARN"
echo ""
echo "Bot 3: HealthcareAuthBot (Authentication - EN+ES)"
echo "  Bot ID:    $BOT3_ID"
echo "  Version:   $BOT3_VERSION"
echo "  Alias ID:  $BOT3_ALIAS_ID"
echo "  Alias ARN: $BOT3_ALIAS_ARN"
echo ""
echo "All 3 bots created, built, versioned, aliased, and associated with Connect."
echo ""
echo "NEXT STEPS:"
echo "  1. Update your Amazon Connect flows to reference these bot alias ARNs"
echo "  2. Configure DTMF session attributes in each GetCustomerInput block"
echo "  3. Deploy the Lambda validation function for member ID verification"
echo "  4. Test end-to-end with a phone call"
```

---

## Section 7: Error Handling Strategy

### FallbackIntent Configuration Per Bot

Each bot has an `AMAZON.FallbackIntent` that triggers when no other intent meets the confidence threshold (0.40). The FallbackIntent behavior differs by bot purpose:

#### Bot 1 (HealthcareAuthMainMenuBot) and Bot 2 (HealthcareAuthMainMenuBotES)

| Configuration | Value |
|---------------|-------|
| **Trigger** | Confidence below 0.40 for all defined intents |
| **Closing Response (EN)** | "I am sorry, I did not understand that selection. Please try again. You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback." |
| **Closing Response (ES)** | "Lo siento, no entendi su seleccion. Por favor intente de nuevo. Puede decir o presionar 1 para verificar el estado de su autorizacion, decir o presionar 2 para hablar con un agente, o decir o presionar 3 para solicitar una llamada de regreso." |
| **Allow Interrupt** | Yes |

#### Bot 3 (HealthcareAuthBot)

| Configuration | Value |
|---------------|-------|
| **Trigger** | Confidence below 0.40 for AuthenticateIntent |
| **Closing Response (EN)** | "I am sorry, I was not able to understand. Let me transfer you to an agent who can help verify your identity." |
| **Closing Response (ES)** | "Lo siento, no pude entender. Dejeme transferirlo a un agente que pueda ayudar a verificar su identidad." |
| **Allow Interrupt** | No |

### Max Retry Logic

The retry strategy operates at two levels: within Lex (slot-level retries) and in the Connect flow (intent-level retries).

#### Slot-Level Retries (Bot 3 Only)

| Slot | Max Retries | Behavior After Max Retries |
|------|-------------|---------------------------|
| `memberId` | 2 | Slot elicitation fails; Lex returns a dialog action of `ElicitSlot` failure. The Lambda code hook can decide to transfer to an agent. |
| `dateOfBirth` | 2 | Same as above. |

**Retry Flow for memberId:**

```
Attempt 1: "Please say or enter your 9-digit member ID."
  [Caller response not understood]
Attempt 2: "I didn't catch that. Please say or enter your 9-digit member ID."
  [Caller response not understood]
Attempt 3: "I didn't catch that. Please say or enter your 9-digit member ID."
  [Caller response not understood]
  --> Slot elicitation fails --> Lambda returns transfer-to-agent directive
```

#### Intent-Level Retries (Connect Flow)

The Amazon Connect flow manages intent-level retries using a `Set contact attributes` block to track a retry counter.

```
Flow Logic (Pseudocode):

1. Set $.Attributes.MenuRetryCount = 0
2. Invoke GetCustomerInput (Lex bot)
3. Check result:
   a. If intent = CheckAuthorizationStatusIntent --> Route to auth status flow
   b. If intent = SpeakToAgentIntent --> Route to agent queue
   c. If intent = RequestCallbackIntent --> Route to callback flow
   d. If intent = AMAZON.FallbackIntent:
      i.  Increment $.Attributes.MenuRetryCount
      ii. If MenuRetryCount < 3 --> Go back to step 2
      iii.If MenuRetryCount >= 3 --> Transfer to agent (max retries exceeded)
   e. If Error --> Transfer to agent
```

### How the Connect Flow Handles Lex Errors

| Error Condition | Connect Flow Response |
|----------------|-----------------------|
| **Lex timeout** (no input) | Re-prompt the caller with the menu options. After 3 timeouts, transfer to an agent. |
| **FallbackIntent** (unrecognized) | Play error message, increment retry counter. After 3 FallbackIntent responses, transfer to an agent. |
| **Lex service error** (API failure) | Transfer to an agent immediately. Play: "We are experiencing technical difficulties. Let me connect you with an agent." |
| **Slot elicitation failure** (Bot 3) | Lambda returns a directive to transfer to an agent. Connect flow routes to the agent queue. |
| **Confirmation declined** (Bot 3) | Slot elicitation restarts. After 2 full confirmation declines, transfer to an agent. |
| **Authentication failure** (backend) | Play: "We were unable to verify your information. Please try again." Allow one retry, then transfer to an agent. |

### Error Escalation Path

```
Level 1: Lex re-prompts (slot retries within bot)
    |
    v  (max slot retries exceeded)
Level 2: Connect flow re-invokes Lex (menu retries)
    |
    v  (max flow retries exceeded -- 3 attempts)
Level 3: Transfer to live agent queue
    |
    v  (no agents available)
Level 4: Offer callback or leave voicemail
```

### Logging and Monitoring

Enable Lex conversation logs for all three bots to capture:
- Every utterance received
- Intent matched and confidence score
- Slot values captured
- FallbackIntent invocations (indicator of NLU gaps)

```bash
# Enable conversation logs on the alias (text + audio)
aws lexv2-models update-bot-alias \
  --bot-id $BOT_ID \
  --bot-alias-id $ALIAS_ID \
  --bot-alias-name "LiveAlias" \
  --bot-version "$BOT_VERSION" \
  --bot-alias-locale-settings '{"en_US":{"enabled":true}}' \
  --conversation-log-settings '{
    "textLogSettings": [
      {
        "enabled": true,
        "destination": {
          "cloudWatch": {
            "cloudWatchLogGroupArn": "arn:aws:logs:REGION:ACCOUNT:log-group:/aws/lex/HealthcareAuthBots:*",
            "logPrefix": "lex-conversations"
          }
        }
      }
    ]
  }' \
  --profile PROFILE \
  --region REGION
```

**Key Metrics to Monitor:**
- **FallbackIntent rate:** If above 15%, review missed utterances and add them to the appropriate intent.
- **Slot retry rate:** If above 20% for any slot, review the elicitation prompt clarity and DTMF configuration.
- **Authentication success rate:** If below 80%, investigate whether callers struggle with member ID or date of birth entry.

---

## Section 8: Validation Checklist

### Pre-Deployment Validation

#### 1. No Overlapping Utterances Across Intents Within Same Bot

**Bot 1 (HealthcareAuthMainMenuBot):**

| Utterance | CheckAuthorizationStatusIntent | SpeakToAgentIntent | RequestCallbackIntent |
|-----------|:---:|:---:|:---:|
| "1" | X | | |
| "2" | | X | |
| "3" | | | X |
| "authorization" | X | | |
| "agent" | | X | |
| "callback" | | | X |
| "check status" | X | | |
| "transfer me" | | X | |
| "call me back" | | | X |

Result: NO overlapping utterances detected. Each utterance belongs to exactly one intent.

**Bot 2 (HealthcareAuthMainMenuBotES):**

| Utterance | CheckAuthorizationStatusIntent | SpeakToAgentIntent | RequestCallbackIntent |
|-----------|:---:|:---:|:---:|
| "1" | X | | |
| "2" | | X | |
| "3" | | | X |
| "autorizacion" | X | | |
| "agente" | | X | |
| "llamada de regreso" | | | X |
| "verificar" | X | | |
| "hablar" | | X | |
| "llamame" | | | X |

Result: NO overlapping utterances detected.

**Bot 3 (HealthcareAuthBot):**
Only one intent (`AuthenticateIntent`) plus `AMAZON.FallbackIntent`. No overlap possible between custom intents.

#### 2. DTMF Digits Unique Per Bot

| Bot | Digit 1 | Digit 2 | Digit 3 |
|-----|---------|---------|---------|
| Bot 1 (EN) | CheckAuthorizationStatusIntent | SpeakToAgentIntent | RequestCallbackIntent |
| Bot 2 (ES) | CheckAuthorizationStatusIntent | SpeakToAgentIntent | RequestCallbackIntent |
| Bot 3 (Auth) | N/A (multi-digit slot input) | N/A | N/A |

Result: PASS. No DTMF digit conflicts within any bot.

#### 3. All Intents Have 12+ Utterances

| Bot | Intent | Utterance Count | Status |
|-----|--------|:-:|:-:|
| Bot 1 | CheckAuthorizationStatusIntent | 18 | PASS |
| Bot 1 | SpeakToAgentIntent | 18 | PASS |
| Bot 1 | RequestCallbackIntent | 18 | PASS |
| Bot 2 | CheckAuthorizationStatusIntent | 18 | PASS |
| Bot 2 | SpeakToAgentIntent | 18 | PASS |
| Bot 2 | RequestCallbackIntent | 18 | PASS |
| Bot 3 | AuthenticateIntent (en_US) | 16 | PASS |
| Bot 3 | AuthenticateIntent (es_US) | 16 | PASS |

Result: PASS. All intents exceed the 12-utterance minimum.

#### 4. Both Locales Configured for Auth Bot (Bot 3)

| Locale | Voice | Confidence Threshold | AuthenticateIntent | memberId Slot | dateOfBirth Slot | FallbackIntent |
|--------|-------|:-:|:-:|:-:|:-:|:-:|
| `en_US` | Joanna (Neural) | 0.40 | Present | Present | Present | Auto-created |
| `es_US` | Lupe (Neural) | 0.40 | Present | Present | Present | Auto-created |

Result: PASS. Both locales fully configured.

#### 5. Confidence Threshold Appropriate

| Bot | Threshold | Justification |
|-----|:-:|-------------|
| Bot 1 | 0.40 | Lenient. IVR callers speak in noisy environments. 0.40 reduces false FallbackIntent triggers for legitimate menu selections. |
| Bot 2 | 0.40 | Same justification. |
| Bot 3 | 0.40 | Authentication context is unambiguous (only one custom intent). 0.40 ensures the intent triggers reliably. |

Result: PASS. 0.40 is appropriate for all three bots.

#### 6. Utterance Diversity Coverage

Each intent must cover these categories:

| Category | Bot 1 EN | Bot 2 ES | Bot 3 EN | Bot 3 ES |
|----------|:-:|:-:|:-:|:-:|
| DTMF digit | PASS | PASS | N/A | N/A |
| Single keyword | PASS | PASS | PASS | PASS |
| Noun phrase | PASS | PASS | PASS | PASS |
| Action phrase | PASS | PASS | PASS | PASS |
| First person | PASS | PASS | PASS | PASS |
| Polite form | PASS | PASS | PASS | PASS |
| Casual form | PASS | PASS | PASS | PASS |
| Synonym variant | PASS | PASS | PASS | PASS |

Result: PASS. All utterance diversity requirements met.

#### 7. Slot Configuration Validation (Bot 3)

| Check | en_US | es_US |
|-------|:-:|:-:|
| memberId slot type = AMAZON.Number | PASS | PASS |
| dateOfBirth slot type = AMAZON.Date | PASS | PASS |
| memberId constraint = Required | PASS | PASS |
| dateOfBirth constraint = Required | PASS | PASS |
| memberId max retries = 2 | PASS | PASS |
| dateOfBirth max retries = 2 | PASS | PASS |
| Slot priority: memberId = 1 | PASS | PASS |
| Slot priority: dateOfBirth = 2 | PASS | PASS |
| Confirmation prompt present | PASS | PASS |
| Declination response present | PASS | PASS |

Result: PASS.

#### 8. Alias Locale Settings

| Bot | Alias Name | en_US Enabled | es_US Enabled |
|-----|------------|:-:|:-:|
| Bot 1 | LiveAlias | PASS | N/A |
| Bot 2 | LiveAlias | N/A | PASS |
| Bot 3 | LiveAlias | PASS | PASS |

Result: PASS. All aliases have correct locale settings.

### Post-Deployment Functional Test Plan

Run these tests after deployment to verify end-to-end behavior:

```bash
#!/bin/bash
# Post-deployment functional tests

# Bot 1: English Menu
echo "=== Bot 1: HealthcareAuthMainMenuBot ==="

for utterance in "1" "check authorization status" "authorization" "2" "agent" "speak to an agent" "3" "callback" "call me back" "gibberish xyz"; do
  RESULT=$(aws lexv2-runtime recognize-text \
    --bot-id "$BOT1_ID" \
    --bot-alias-id "$BOT1_ALIAS_ID" \
    --locale-id en_US \
    --session-id "test-$(date +%s)-$RANDOM" \
    --text "$utterance" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --query 'interpretations[0].intent.name' --output text 2>/dev/null)
  echo "  \"$utterance\" --> $RESULT"
done

# Bot 2: Spanish Menu
echo ""
echo "=== Bot 2: HealthcareAuthMainMenuBotES ==="

for utterance in "1" "verificar estado de autorizacion" "autorizacion" "2" "agente" "hablar con un agente" "3" "llamada de regreso" "llamame de vuelta" "algo incomprensible"; do
  RESULT=$(aws lexv2-runtime recognize-text \
    --bot-id "$BOT2_ID" \
    --bot-alias-id "$BOT2_ALIAS_ID" \
    --locale-id es_US \
    --session-id "test-$(date +%s)-$RANDOM" \
    --text "$utterance" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --query 'interpretations[0].intent.name' --output text 2>/dev/null)
  echo "  \"$utterance\" --> $RESULT"
done

# Bot 3: Authentication (English)
echo ""
echo "=== Bot 3: HealthcareAuthBot (en_US) ==="

for utterance in "I need to verify my identity" "verify" "authenticate" "verify my identity"; do
  RESULT=$(aws lexv2-runtime recognize-text \
    --bot-id "$BOT3_ID" \
    --bot-alias-id "$BOT3_ALIAS_ID" \
    --locale-id en_US \
    --session-id "test-$(date +%s)-$RANDOM" \
    --text "$utterance" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --query 'interpretations[0].intent.name' --output text 2>/dev/null)
  echo "  \"$utterance\" --> $RESULT"
done

# Bot 3: Authentication (Spanish)
echo ""
echo "=== Bot 3: HealthcareAuthBot (es_US) ==="

for utterance in "necesito verificar mi identidad" "verificar" "autenticar" "verificar mi identidad"; do
  RESULT=$(aws lexv2-runtime recognize-text \
    --bot-id "$BOT3_ID" \
    --bot-alias-id "$BOT3_ALIAS_ID" \
    --locale-id es_US \
    --session-id "test-$(date +%s)-$RANDOM" \
    --text "$utterance" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --query 'interpretations[0].intent.name' --output text 2>/dev/null)
  echo "  \"$utterance\" --> $RESULT"
done

echo ""
echo "=== Expected Results ==="
echo "Bot 1: '1','check authorization status','authorization' --> CheckAuthorizationStatusIntent"
echo "Bot 1: '2','agent','speak to an agent' --> SpeakToAgentIntent"
echo "Bot 1: '3','callback','call me back' --> RequestCallbackIntent"
echo "Bot 1: 'gibberish xyz' --> FallbackIntent"
echo "Bot 2: Same pattern with Spanish utterances"
echo "Bot 3: All authentication utterances --> AuthenticateIntent"
```

### Final Sign-Off Criteria

Before declaring the deployment production-ready, all of the following must be true:

- [ ] All 3 bots created successfully (botStatus = Available)
- [ ] All locales built successfully (botLocaleStatus = Built for each locale)
- [ ] All intents created with correct utterances (verified via describe-intent)
- [ ] No overlapping utterances across intents within any bot
- [ ] DTMF digits unique per bot (1, 2, 3 each in exactly one intent)
- [ ] All intents have 12+ sample utterances
- [ ] Bot 3 has both en_US and es_US locales configured
- [ ] Confidence threshold is 0.40 for all bots
- [ ] Versions created for all bots
- [ ] Aliases created with correct locale settings enabled
- [ ] All 3 bots associated with the Amazon Connect instance
- [ ] Functional tests pass: each utterance maps to the expected intent
- [ ] FallbackIntent catches unrecognized input correctly
- [ ] Bot 3 slot elicitation works: memberId collected first, dateOfBirth second
- [ ] Bot 3 confirmation prompt reads back collected values correctly
- [ ] DTMF session attributes documented for Connect flow implementation
- [ ] Conversation logging enabled for production monitoring

---

## Appendix A: Prompt Reference Quick-Lookup

### English Prompts

| Prompt ID | Text |
|-----------|------|
| AUTH_MEMBER_ID | "To verify your identity, please say or enter your 9-digit member ID followed by the pound key." |
| AUTH_DOB | "Now please say or enter your date of birth as month, day, and 4-digit year." |
| AUTH_FAILURE | "We were unable to verify your information. Please try again." |
| MAIN_MENU | "How can we help you today? You may say or press 1 to check your authorization status, say or press 2 to speak with an agent, or say or press 3 to request a callback." |
| ERROR_INVALID | "I am sorry, I did not understand that selection. Please try again." |

### Spanish Prompts

| Prompt ID | Text |
|-----------|------|
| AUTH_MEMBER_ID_ES | "Para verificar su identidad, por favor diga o ingrese su numero de identificacion de miembro de 9 digitos seguido de la tecla numeral." |
| AUTH_DOB_ES | "Ahora por favor diga o ingrese su fecha de nacimiento como mes, dia y ano de 4 digitos." |
| AUTH_FAILURE_ES | "No pudimos verificar su informacion. Por favor intente de nuevo." |
| MAIN_MENU_ES | "Como podemos ayudarle hoy? Puede decir o presionar 1 para verificar el estado de su autorizacion, decir o presionar 2 para hablar con un agente, o decir o presionar 3 para solicitar una llamada de regreso." |

---

## Appendix B: Bot ARN Reference Template

Use these templates when configuring Amazon Connect flows:

```
Bot 1 (EN Menu):  arn:aws:lex:{REGION}:{ACCOUNT}:bot-alias/{BOT1_ID}/{BOT1_ALIAS_ID}
Bot 2 (ES Menu):  arn:aws:lex:{REGION}:{ACCOUNT}:bot-alias/{BOT2_ID}/{BOT2_ALIAS_ID}
Bot 3 (Auth):     arn:aws:lex:{REGION}:{ACCOUNT}:bot-alias/{BOT3_ID}/{BOT3_ALIAS_ID}
```

In the Connect flow `GetCustomerInput` block, reference these ARNs and set the appropriate DTMF session attributes per section 5.
