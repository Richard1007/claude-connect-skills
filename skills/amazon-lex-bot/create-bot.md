# Create Lex V2 Bot From Scratch

## Workflow

### Step 1: Gather Requirements

Before creating anything, confirm:

1. **Bot name** — Short, descriptive (e.g., `HealthClinicBot`)
2. **Purpose** — What menus/intents does this bot serve?
3. **Intents** — List each intent with:
   - Intent name (PascalCase, e.g., `ProviderIntent`)
   - What the caller might say (at least 8-12 variations)
   - DTMF mapping if applicable (e.g., press 1 = ProviderIntent)
4. **Locale** — Usually `en_US`
5. **Confidence threshold** — 0.40 (lenient) to 0.80 (strict). Default: 0.40 for IVR menus.

### Step 2: Check Existing Resources

```bash
# Check for existing bots
aws lexv2-models list-bots --profile PROFILE

# Check IAM role
aws iam list-roles --query "Roles[?contains(RoleName,'LexV2')]" --profile PROFILE
```

### Step 3: Create the Bot

```bash
BOT_RESPONSE=$(aws lexv2-models create-bot \
  --bot-name "BotName" \
  --role-arn "ROLE_ARN" \
  --data-privacy '{"childDirected":false}' \
  --idle-session-ttl-in-seconds 300 \
  --profile PROFILE \
  --output json)

BOT_ID=$(echo $BOT_RESPONSE | python3 -c "import json,sys; print(json.load(sys.stdin)['botId'])")
echo "Bot ID: $BOT_ID"
```

### Step 4: Create Bot Locale

```bash
aws lexv2-models create-bot-locale \
  --bot-id $BOT_ID \
  --bot-version DRAFT \
  --locale-id en_US \
  --nlu-intent-confidence-threshold 0.40 \
  --profile PROFILE
```

### Step 5: Create Intents

For each intent:

```bash
aws lexv2-models create-intent \
  --bot-id $BOT_ID \
  --bot-version DRAFT \
  --locale-id en_US \
  --intent-name "IntentName" \
  --description "Description of intent" \
  --sample-utterances '[
    {"utterance": "variation 1"},
    {"utterance": "variation 2"},
    {"utterance": "variation 3"},
    {"utterance": "variation 4"},
    {"utterance": "variation 5"},
    {"utterance": "variation 6"},
    {"utterance": "variation 7"},
    {"utterance": "variation 8"}
  ]' \
  --profile PROFILE
```

**Important:** The `FallbackIntent` is created automatically. Do not create it manually.

### Step 6: Build the Bot

```bash
aws lexv2-models build-bot-locale \
  --bot-id $BOT_ID \
  --bot-version DRAFT \
  --locale-id en_US \
  --profile PROFILE
```

### Step 7: Wait for Build

```bash
while true; do
  STATUS=$(aws lexv2-models describe-bot-locale \
    --bot-id $BOT_ID \
    --bot-version DRAFT \
    --locale-id en_US \
    --profile PROFILE \
    --query 'botLocaleStatus' --output text)
  echo "Build status: $STATUS"
  if [ "$STATUS" = "Built" ]; then echo "Build complete!"; break; fi
  if [ "$STATUS" = "Failed" ]; then echo "BUILD FAILED!"; exit 1; fi
  sleep 5
done
```

### Step 8: Create Version

```bash
VERSION_RESPONSE=$(aws lexv2-models create-bot-version \
  --bot-id $BOT_ID \
  --bot-version-locale-specification '{"en_US":{"sourceBotVersion":"DRAFT"}}' \
  --profile PROFILE \
  --output json)

BOT_VERSION=$(echo $VERSION_RESPONSE | python3 -c "import json,sys; print(json.load(sys.stdin)['botVersion'])")
echo "Version: $BOT_VERSION"
```

### Step 9: Create Alias

**CRITICAL:** You MUST include `--bot-alias-locale-settings` to enable the locale on the alias. Without this, the alias will reject requests with "Language en_US not enabled" errors.

```bash
ALIAS_RESPONSE=$(aws lexv2-models create-bot-alias \
  --bot-id $BOT_ID \
  --bot-alias-name "LiveAlias" \
  --bot-version "$BOT_VERSION" \
  --bot-alias-locale-settings '{"en_US":{"enabled":true}}' \
  --profile PROFILE \
  --output json)

ALIAS_ID=$(echo $ALIAS_RESPONSE | python3 -c "import json,sys; print(json.load(sys.stdin)['botAliasId'])")
ALIAS_ARN="arn:aws:lex:us-west-2:$(aws sts get-caller-identity --profile PROFILE --query 'Account' --output text):bot-alias/$BOT_ID/$ALIAS_ID"
echo "Alias ARN: $ALIAS_ARN"
```

If you forgot to include locale settings during creation, update the alias:
```bash
aws lexv2-models update-bot-alias \
  --bot-id $BOT_ID \
  --bot-alias-id $ALIAS_ID \
  --bot-alias-name "LiveAlias" \
  --bot-version "$BOT_VERSION" \
  --bot-alias-locale-settings '{"en_US":{"enabled":true}}' \
  --profile PROFILE
```

### Step 10: Associate with Connect

```bash
aws connect associate-bot \
  --instance-id INSTANCE_ID \
  --lex-v2-bot "{\"AliasArn\":\"$ALIAS_ARN\"}" \
  --profile PROFILE
```

## DTMF-to-Intent Mapping

For IVR menus where callers can "press or say", DTMF mapping is configured via session attributes in the Connect flow, NOT in the Lex bot itself.

In the Connect flow's `ConnectParticipantWithLexBot` block, add session attributes:
```json
"LexSessionAttributes": {
  "x-amz-lex:dtmf:end-timeout-ms:*:*": "3000",
  "x-amz-lex:dtmf:max-length:*:*": "1"
}
```

The Lex bot handles the voice recognition. DTMF digits are sent to Lex as text input and matched against utterances that include the digit (e.g., add `"1"` as a sample utterance for `ProviderIntent`).

## Utterance Writing Guidelines

### Do:
- Include the single word: `"provider"`
- Include with articles: `"a provider"`, `"the provider"`
- Include "I am" patterns: `"I'm a provider"`, `"I am a provider"`
- Include action phrases: `"I'm calling as a provider"`
- Include synonyms: `"doctor"`, `"physician"`, `"healthcare provider"`
- Include the DTMF digit as an utterance: `"1"` (so pressing 1 also triggers the intent)
- Include casual phrasing: `"provider here"`, `"this is a provider"`

### Don't:
- Don't use identical utterances across intents
- Don't use very short single-letter utterances (except DTMF digits)
- Don't include punctuation in utterances
- Don't use utterances that are substrings of other intent utterances
- Don't add utterances with only stop words ("the", "a", "is")

## CRITICAL: Multi-Level Menus Require Separate Bots

**DTMF digits conflict across menu levels.** If your IVR has multiple menu levels where the same digits (1, 2, 3) are reused for different options, you MUST use separate Lex bots per menu level.

**Example problem:** Main menu has "press 1 for provider, 2 for patient" and provider sub-menu has "press 1 for referrals, 2 for prior auth". If both are in one bot, DTMF "1" maps to BOTH ProviderIntent AND ReferralIntent — causing conflicts.

**Solution: One bot per menu level:**
```
HealthClinicMainBot       → ProviderIntent(1), PatientIntent(2)
HealthClinicProviderBot   → ReferralIntent(1), PriorAuthIntent(2), ClaimsBillingIntent(3)
HealthClinicPatientBot    → AppointmentIntent(1), PrescriptionIntent(2), TestResultsIntent(3)
```

Each bot has non-conflicting DTMF digits within its scope. The Connect flow uses different `ConnectParticipantWithLexBot` blocks pointing to different bots at each menu level.

## Common Issues

1. **Build fails** — Usually means conflicting utterances between intents. Check for overlapping phrases.
2. **Bot not showing in Connect** — Association may not have completed. Check with `aws connect list-bots`.
3. **Intent not matching** — Confidence threshold may be too high. Lower to 0.40.
4. **DTMF not working** — Ensure the digit is included as a sample utterance in the intent.
5. **"Access denied" on create-bot** — IAM role may not have proper permissions. Use the service-linked role.
6. **"Language en_US not enabled" on alias** — Alias was created without `--bot-alias-locale-settings`. Update alias with `'{"en_US":{"enabled":true}}'`.
7. **DTMF digit matches wrong intent** — DTMF digits must be unique within a single bot. Use separate bots per menu level.
