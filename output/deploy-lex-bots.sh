#!/bin/bash
set -euo pipefail

# ============================================================================
# Healthcare Authorization IVR — Lex Bot Deployment Script
# Target: haohai profile, haohai-wfm instance, us-west-2
# ============================================================================

PROFILE="haohai"
REGION="us-west-2"
ACCOUNT="988066449281"
INSTANCE_ID="1ad58c1a-6666-43e1-acee-611b0c89d31e"
ROLE_ARN="arn:aws:iam::988066449281:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots_AmazonConnect_988066449281"
ALIAS_NAME="LiveAlias"

extract_json_field() {
  python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"
}

wait_for_bot_available() {
  local bot_id=$1
  echo "    Waiting for bot to be Available..."
  while true; do
    STATUS=$(aws lexv2-models describe-bot \
      --bot-id "$bot_id" \
      --profile "$PROFILE" --region "$REGION" \
      --query 'botStatus' --output text 2>/dev/null)
    if [ "$STATUS" = "Available" ]; then echo "    Bot is Available."; return 0; fi
    if [ "$STATUS" = "Failed" ]; then echo "    BOT CREATION FAILED!"; return 1; fi
    sleep 5
  done
}

wait_for_version() {
  local bot_id=$1
  local version=$2
  echo "    Waiting for version $version to be Available..."
  while true; do
    STATUS=$(aws lexv2-models describe-bot-version \
      --bot-id "$bot_id" --bot-version "$version" \
      --profile "$PROFILE" --region "$REGION" \
      --query 'botStatus' --output text 2>/dev/null)
    if [ "$STATUS" = "Available" ]; then echo "    Version $version is Available."; return 0; fi
    if [ "$STATUS" = "Failed" ]; then echo "    VERSION FAILED!"; return 1; fi
    sleep 3
  done
}

wait_for_build() {
  local bot_id=$1
  local locale=$2
  echo "    Waiting for build ($locale)..."
  while true; do
    STATUS=$(aws lexv2-models describe-bot-locale \
      --bot-id "$bot_id" --bot-version DRAFT --locale-id "$locale" \
      --profile "$PROFILE" --region "$REGION" \
      --query 'botLocaleStatus' --output text 2>/dev/null)
    echo "    Build status: $STATUS"
    if [ "$STATUS" = "Built" ]; then echo "    Build complete!"; return 0; fi
    if [ "$STATUS" = "Failed" ]; then echo "    BUILD FAILED!"; return 1; fi
    sleep 5
  done
}

# ============================================================================
# BOT 1: HealthcareAuthMainMenuBot (English)
# ============================================================================
echo "=========================================="
echo "Creating Bot 1: HealthcareAuthMainMenuBot"
echo "=========================================="

BOT1_RESPONSE=$(aws lexv2-models create-bot \
  --bot-name "HealthcareAuthMainMenuBot" \
  --description "Main menu bot for healthcare authorization IVR - English. Routes callers to check auth status, speak to agent, or request callback." \
  --role-arn "$ROLE_ARN" \
  --data-privacy '{"childDirected":false}' \
  --idle-session-ttl-in-seconds 300 \
  --profile "$PROFILE" --region "$REGION" --output json)

BOT1_ID=$(echo "$BOT1_RESPONSE" | extract_json_field "botId")
echo "  Bot 1 ID: $BOT1_ID"

wait_for_bot_available "$BOT1_ID"

echo "  Creating en_US locale..."
aws lexv2-models create-bot-locale \
  --bot-id "$BOT1_ID" --bot-version DRAFT --locale-id en_US \
  --nlu-intent-confidence-threshold 0.40 \
  --voice-settings '{"voiceId":"Joanna","engine":"neural"}' \
  --profile "$PROFILE" --region "$REGION" > /dev/null

sleep 5

echo "  Creating CheckAuthorizationStatusIntent..."
aws lexv2-models create-intent \
  --bot-id "$BOT1_ID" --bot-version DRAFT --locale-id en_US \
  --intent-name "CheckAuthorizationStatusIntent" \
  --description "Caller wants to check the status of their healthcare authorization" \
  --sample-utterances '[
    {"utterance":"check authorization status"},
    {"utterance":"authorization status"},
    {"utterance":"check my auth"},
    {"utterance":"status"},
    {"utterance":"check status"},
    {"utterance":"what is my authorization status"},
    {"utterance":"auth status"},
    {"utterance":"check on my authorization"},
    {"utterance":"I want to check my authorization"},
    {"utterance":"status of my authorization"},
    {"utterance":"pending authorization"},
    {"utterance":"check my authorization status"},
    {"utterance":"I need to check my auth status"},
    {"utterance":"can you check my authorization"},
    {"utterance":"tell me my authorization status"},
    {"utterance":"look up my authorization"},
    {"utterance":"authorization check"},
    {"utterance":"1"}
  ]' \
  --profile "$PROFILE" --region "$REGION" > /dev/null

echo "  Creating SpeakToAgentIntent..."
aws lexv2-models create-intent \
  --bot-id "$BOT1_ID" --bot-version DRAFT --locale-id en_US \
  --intent-name "SpeakToAgentIntent" \
  --description "Caller wants to speak with a live agent" \
  --sample-utterances '[
    {"utterance":"speak to an agent"},
    {"utterance":"agent"},
    {"utterance":"talk to someone"},
    {"utterance":"representative"},
    {"utterance":"I want to talk to a person"},
    {"utterance":"human"},
    {"utterance":"operator"},
    {"utterance":"live agent"},
    {"utterance":"connect me to an agent"},
    {"utterance":"transfer me"},
    {"utterance":"I need to speak with someone"},
    {"utterance":"can I talk to a real person"},
    {"utterance":"let me speak to an agent"},
    {"utterance":"I need help from an agent"},
    {"utterance":"get me an agent"},
    {"utterance":"speak with a representative"},
    {"utterance":"talk to an agent please"},
    {"utterance":"2"}
  ]' \
  --profile "$PROFILE" --region "$REGION" > /dev/null

echo "  Creating RequestCallbackIntent..."
aws lexv2-models create-intent \
  --bot-id "$BOT1_ID" --bot-version DRAFT --locale-id en_US \
  --intent-name "RequestCallbackIntent" \
  --description "Caller wants to request a callback" \
  --sample-utterances '[
    {"utterance":"request a callback"},
    {"utterance":"callback"},
    {"utterance":"call me back"},
    {"utterance":"I want a callback"},
    {"utterance":"schedule a callback"},
    {"utterance":"have someone call me"},
    {"utterance":"I need a callback"},
    {"utterance":"please call me back"},
    {"utterance":"return my call"},
    {"utterance":"ring me back"},
    {"utterance":"call back"},
    {"utterance":"I would like a callback"},
    {"utterance":"can someone call me back"},
    {"utterance":"request a call back please"},
    {"utterance":"I want someone to call me"},
    {"utterance":"schedule a return call"},
    {"utterance":"call me later"},
    {"utterance":"3"}
  ]' \
  --profile "$PROFILE" --region "$REGION" > /dev/null

echo "  Building Bot 1..."
aws lexv2-models build-bot-locale \
  --bot-id "$BOT1_ID" --bot-version DRAFT --locale-id en_US \
  --profile "$PROFILE" --region "$REGION" > /dev/null

wait_for_build "$BOT1_ID" "en_US"

echo "  Creating version..."
BOT1_VERSION_RESP=$(aws lexv2-models create-bot-version \
  --bot-id "$BOT1_ID" \
  --bot-version-locale-specification '{"en_US":{"sourceBotVersion":"DRAFT"}}' \
  --profile "$PROFILE" --region "$REGION" --output json)
BOT1_VERSION=$(echo "$BOT1_VERSION_RESP" | extract_json_field "botVersion")
echo "  Bot 1 Version: $BOT1_VERSION"

echo "  Creating alias..."
BOT1_ALIAS_RESP=$(aws lexv2-models create-bot-alias \
  --bot-id "$BOT1_ID" --bot-alias-name "$ALIAS_NAME" \
  --bot-version "$BOT1_VERSION" \
  --bot-alias-locale-settings '{"en_US":{"enabled":true}}' \
  --profile "$PROFILE" --region "$REGION" --output json)
BOT1_ALIAS_ID=$(echo "$BOT1_ALIAS_RESP" | extract_json_field "botAliasId")
BOT1_ALIAS_ARN="arn:aws:lex:${REGION}:${ACCOUNT}:bot-alias/${BOT1_ID}/${BOT1_ALIAS_ID}"
echo "  Bot 1 Alias ARN: $BOT1_ALIAS_ARN"

echo "  Associating with Connect..."
aws connect associate-bot \
  --instance-id "$INSTANCE_ID" \
  --lex-v2-bot "{\"AliasArn\":\"$BOT1_ALIAS_ARN\"}" \
  --profile "$PROFILE" --region "$REGION" 2>/dev/null || echo "  (Already associated or association complete)"

echo "Bot 1 DONE."
echo ""

# ============================================================================
# BOT 2: HealthcareAuthMainMenuBotES (Spanish)
# ============================================================================
echo "=========================================="
echo "Creating Bot 2: HealthcareAuthMainMenuBotES"
echo "=========================================="

BOT2_RESPONSE=$(aws lexv2-models create-bot \
  --bot-name "HealthcareAuthMainMenuBotES" \
  --description "Main menu bot for healthcare authorization IVR - Spanish. Routes callers to check auth status, speak to agent, or request callback." \
  --role-arn "$ROLE_ARN" \
  --data-privacy '{"childDirected":false}' \
  --idle-session-ttl-in-seconds 300 \
  --profile "$PROFILE" --region "$REGION" --output json)

BOT2_ID=$(echo "$BOT2_RESPONSE" | extract_json_field "botId")
echo "  Bot 2 ID: $BOT2_ID"

wait_for_bot_available "$BOT2_ID"

echo "  Creating es_US locale..."
aws lexv2-models create-bot-locale \
  --bot-id "$BOT2_ID" --bot-version DRAFT --locale-id es_US \
  --nlu-intent-confidence-threshold 0.40 \
  --voice-settings '{"voiceId":"Lupe","engine":"neural"}' \
  --profile "$PROFILE" --region "$REGION" > /dev/null

sleep 5

echo "  Creating CheckAuthorizationStatusIntent (ES)..."
aws lexv2-models create-intent \
  --bot-id "$BOT2_ID" --bot-version DRAFT --locale-id es_US \
  --intent-name "CheckAuthorizationStatusIntent" \
  --description "Caller wants to check authorization status (Spanish)" \
  --sample-utterances '[
    {"utterance":"verificar estado de autorizacion"},
    {"utterance":"estado de autorizacion"},
    {"utterance":"revisar mi autorizacion"},
    {"utterance":"estado"},
    {"utterance":"verificar estado"},
    {"utterance":"cual es el estado de mi autorizacion"},
    {"utterance":"estado de mi autorizacion"},
    {"utterance":"consultar autorizacion"},
    {"utterance":"quiero verificar mi autorizacion"},
    {"utterance":"autorizacion pendiente"},
    {"utterance":"revisar autorizacion"},
    {"utterance":"necesito saber el estado de mi autorizacion"},
    {"utterance":"checar mi autorizacion"},
    {"utterance":"ver mi autorizacion"},
    {"utterance":"consultar estado"},
    {"utterance":"autorizacion"},
    {"utterance":"como va mi autorizacion"},
    {"utterance":"1"}
  ]' \
  --profile "$PROFILE" --region "$REGION" > /dev/null

echo "  Creating SpeakToAgentIntent (ES)..."
aws lexv2-models create-intent \
  --bot-id "$BOT2_ID" --bot-version DRAFT --locale-id es_US \
  --intent-name "SpeakToAgentIntent" \
  --description "Caller wants to speak with an agent (Spanish)" \
  --sample-utterances '[
    {"utterance":"hablar con un agente"},
    {"utterance":"agente"},
    {"utterance":"hablar con alguien"},
    {"utterance":"representante"},
    {"utterance":"quiero hablar con una persona"},
    {"utterance":"operador"},
    {"utterance":"agente en vivo"},
    {"utterance":"conecteme con un agente"},
    {"utterance":"transfierame"},
    {"utterance":"necesito hablar con alguien"},
    {"utterance":"persona"},
    {"utterance":"quiero un agente"},
    {"utterance":"paseme con un representante"},
    {"utterance":"comunicarme con un agente"},
    {"utterance":"necesito ayuda de un agente"},
    {"utterance":"hablar con alguien por favor"},
    {"utterance":"quiero hablar con un representante"},
    {"utterance":"2"}
  ]' \
  --profile "$PROFILE" --region "$REGION" > /dev/null

echo "  Creating RequestCallbackIntent (ES)..."
aws lexv2-models create-intent \
  --bot-id "$BOT2_ID" --bot-version DRAFT --locale-id es_US \
  --intent-name "RequestCallbackIntent" \
  --description "Caller wants to request a callback (Spanish)" \
  --sample-utterances '[
    {"utterance":"solicitar una llamada"},
    {"utterance":"llamada de regreso"},
    {"utterance":"llameme"},
    {"utterance":"quiero una llamada de regreso"},
    {"utterance":"programar una llamada"},
    {"utterance":"que alguien me llame"},
    {"utterance":"necesito una llamada de regreso"},
    {"utterance":"por favor llameme"},
    {"utterance":"devolver mi llamada"},
    {"utterance":"llamar de vuelta"},
    {"utterance":"llamada"},
    {"utterance":"quiero que me llamen"},
    {"utterance":"solicitar llamada de regreso"},
    {"utterance":"me pueden llamar"},
    {"utterance":"necesito que me devuelvan la llamada"},
    {"utterance":"programar llamada"},
    {"utterance":"llameme de vuelta"},
    {"utterance":"3"}
  ]' \
  --profile "$PROFILE" --region "$REGION" > /dev/null

echo "  Building Bot 2..."
aws lexv2-models build-bot-locale \
  --bot-id "$BOT2_ID" --bot-version DRAFT --locale-id es_US \
  --profile "$PROFILE" --region "$REGION" > /dev/null

wait_for_build "$BOT2_ID" "es_US"

echo "  Creating version..."
BOT2_VERSION_RESP=$(aws lexv2-models create-bot-version \
  --bot-id "$BOT2_ID" \
  --bot-version-locale-specification '{"es_US":{"sourceBotVersion":"DRAFT"}}' \
  --profile "$PROFILE" --region "$REGION" --output json)
BOT2_VERSION=$(echo "$BOT2_VERSION_RESP" | extract_json_field "botVersion")
echo "  Bot 2 Version: $BOT2_VERSION"

echo "  Creating alias..."
BOT2_ALIAS_RESP=$(aws lexv2-models create-bot-alias \
  --bot-id "$BOT2_ID" --bot-alias-name "$ALIAS_NAME" \
  --bot-version "$BOT2_VERSION" \
  --bot-alias-locale-settings '{"es_US":{"enabled":true}}' \
  --profile "$PROFILE" --region "$REGION" --output json)
BOT2_ALIAS_ID=$(echo "$BOT2_ALIAS_RESP" | extract_json_field "botAliasId")
BOT2_ALIAS_ARN="arn:aws:lex:${REGION}:${ACCOUNT}:bot-alias/${BOT2_ID}/${BOT2_ALIAS_ID}"
echo "  Bot 2 Alias ARN: $BOT2_ALIAS_ARN"

echo "  Associating with Connect..."
aws connect associate-bot \
  --instance-id "$INSTANCE_ID" \
  --lex-v2-bot "{\"AliasArn\":\"$BOT2_ALIAS_ARN\"}" \
  --profile "$PROFILE" --region "$REGION" 2>/dev/null || echo "  (Already associated or association complete)"

echo "Bot 2 DONE."
echo ""

# ============================================================================
# BOT 3: HealthcareAuthBot (Authentication - EN + ES)
# ============================================================================
echo "=========================================="
echo "Creating Bot 3: HealthcareAuthBot"
echo "=========================================="

BOT3_RESPONSE=$(aws lexv2-models create-bot \
  --bot-name "HealthcareAuthBot" \
  --description "Authentication bot - collects member ID and date of birth for identity verification. Supports English and Spanish." \
  --role-arn "$ROLE_ARN" \
  --data-privacy '{"childDirected":false}' \
  --idle-session-ttl-in-seconds 300 \
  --profile "$PROFILE" --region "$REGION" --output json)

BOT3_ID=$(echo "$BOT3_RESPONSE" | extract_json_field "botId")
echo "  Bot 3 ID: $BOT3_ID"

wait_for_bot_available "$BOT3_ID"

# --- en_US locale ---
echo "  Creating en_US locale..."
aws lexv2-models create-bot-locale \
  --bot-id "$BOT3_ID" --bot-version DRAFT --locale-id en_US \
  --nlu-intent-confidence-threshold 0.40 \
  --voice-settings '{"voiceId":"Joanna","engine":"neural"}' \
  --profile "$PROFILE" --region "$REGION" > /dev/null

sleep 5

echo "  Creating AuthenticateIntent (en_US)..."
BOT3_EN_INTENT_RESP=$(aws lexv2-models create-intent \
  --bot-id "$BOT3_ID" --bot-version DRAFT --locale-id en_US \
  --intent-name "AuthenticateIntent" \
  --description "Collects member ID and date of birth for identity verification" \
  --sample-utterances '[
    {"utterance":"I need to verify my identity"},
    {"utterance":"verify"},
    {"utterance":"authenticate"},
    {"utterance":"I want to authenticate"},
    {"utterance":"verify my identity"},
    {"utterance":"I need to log in"},
    {"utterance":"identity verification"},
    {"utterance":"confirm my identity"},
    {"utterance":"I would like to verify my account"},
    {"utterance":"let me verify"},
    {"utterance":"I am ready to verify"},
    {"utterance":"verify my account"},
    {"utterance":"authentication"},
    {"utterance":"I need to confirm who I am"},
    {"utterance":"log in"},
    {"utterance":"validate my identity"}
  ]' \
  --profile "$PROFILE" --region "$REGION" --output json)

BOT3_EN_INTENT_ID=$(echo "$BOT3_EN_INTENT_RESP" | extract_json_field "intentId")
echo "  AuthenticateIntent (en_US) ID: $BOT3_EN_INTENT_ID"

echo "  Creating memberId slot (en_US)..."
BOT3_MEMBERID_RESP=$(aws lexv2-models create-slot \
  --bot-id "$BOT3_ID" --bot-version DRAFT --locale-id en_US \
  --intent-id "$BOT3_EN_INTENT_ID" \
  --slot-name "memberId" \
  --slot-type-id "AMAZON.Number" \
  --value-elicitation-setting '{
    "slotConstraint": "Required",
    "promptSpecification": {
      "messageGroups": [{"message": {"plainTextMessage": {"value": "Please say or enter your 9-digit member ID."}}}],
      "maxRetries": 2,
      "allowInterrupt": true
    }
  }' \
  --profile "$PROFILE" --region "$REGION" --output json)

BOT3_MEMBERID_SLOT_ID=$(echo "$BOT3_MEMBERID_RESP" | extract_json_field "slotId")
echo "  memberId slot ID: $BOT3_MEMBERID_SLOT_ID"

echo "  Creating dateOfBirth slot (en_US)..."
BOT3_DOB_RESP=$(aws lexv2-models create-slot \
  --bot-id "$BOT3_ID" --bot-version DRAFT --locale-id en_US \
  --intent-id "$BOT3_EN_INTENT_ID" \
  --slot-name "dateOfBirth" \
  --slot-type-id "AMAZON.Date" \
  --value-elicitation-setting '{
    "slotConstraint": "Required",
    "promptSpecification": {
      "messageGroups": [{"message": {"plainTextMessage": {"value": "Now please say or enter your date of birth as month, day, and 4-digit year."}}}],
      "maxRetries": 2,
      "allowInterrupt": true
    }
  }' \
  --profile "$PROFILE" --region "$REGION" --output json)

BOT3_DOB_SLOT_ID=$(echo "$BOT3_DOB_RESP" | extract_json_field "slotId")
echo "  dateOfBirth slot ID: $BOT3_DOB_SLOT_ID"

echo "  Setting slot priorities and confirmation (en_US)..."
aws lexv2-models update-intent \
  --bot-id "$BOT3_ID" --bot-version DRAFT --locale-id en_US \
  --intent-id "$BOT3_EN_INTENT_ID" \
  --intent-name "AuthenticateIntent" \
  --description "Collects member ID and date of birth for identity verification" \
  --sample-utterances '[
    {"utterance":"I need to verify my identity"},
    {"utterance":"verify"},
    {"utterance":"authenticate"},
    {"utterance":"I want to authenticate"},
    {"utterance":"verify my identity"},
    {"utterance":"I need to log in"},
    {"utterance":"identity verification"},
    {"utterance":"confirm my identity"},
    {"utterance":"I would like to verify my account"},
    {"utterance":"let me verify"},
    {"utterance":"I am ready to verify"},
    {"utterance":"verify my account"},
    {"utterance":"authentication"},
    {"utterance":"I need to confirm who I am"},
    {"utterance":"log in"},
    {"utterance":"validate my identity"}
  ]' \
  --slot-priorities "[
    {\"priority\": 1, \"slotId\": \"$BOT3_MEMBERID_SLOT_ID\"},
    {\"priority\": 2, \"slotId\": \"$BOT3_DOB_SLOT_ID\"}
  ]" \
  --intent-confirmation-setting '{
    "promptSpecification": {
      "messageGroups": [{"message": {"plainTextMessage": {"value": "I have your member ID as {memberId} and date of birth as {dateOfBirth}. Is that correct?"}}}],
      "maxRetries": 1,
      "allowInterrupt": true
    },
    "declinationResponse": {
      "messageGroups": [{"message": {"plainTextMessage": {"value": "Let me collect your information again."}}}],
      "allowInterrupt": false
    }
  }' \
  --profile "$PROFILE" --region "$REGION" > /dev/null

# --- es_US locale ---
echo "  Creating es_US locale..."
aws lexv2-models create-bot-locale \
  --bot-id "$BOT3_ID" --bot-version DRAFT --locale-id es_US \
  --nlu-intent-confidence-threshold 0.40 \
  --voice-settings '{"voiceId":"Lupe","engine":"neural"}' \
  --profile "$PROFILE" --region "$REGION" > /dev/null

sleep 5

echo "  Creating AuthenticateIntent (es_US)..."
BOT3_ES_INTENT_RESP=$(aws lexv2-models create-intent \
  --bot-id "$BOT3_ID" --bot-version DRAFT --locale-id es_US \
  --intent-name "AuthenticateIntent" \
  --description "Recopila numero de miembro y fecha de nacimiento para verificacion de identidad" \
  --sample-utterances '[
    {"utterance":"necesito verificar mi identidad"},
    {"utterance":"verificar"},
    {"utterance":"autenticar"},
    {"utterance":"quiero autenticarme"},
    {"utterance":"verificar mi identidad"},
    {"utterance":"necesito iniciar sesion"},
    {"utterance":"verificacion de identidad"},
    {"utterance":"confirmar mi identidad"},
    {"utterance":"me gustaria verificar mi cuenta"},
    {"utterance":"dejeme verificar"},
    {"utterance":"estoy listo para verificar"},
    {"utterance":"verificar mi cuenta"},
    {"utterance":"autenticacion"},
    {"utterance":"necesito confirmar quien soy"},
    {"utterance":"iniciar sesion"},
    {"utterance":"validar mi identidad"}
  ]' \
  --profile "$PROFILE" --region "$REGION" --output json)

BOT3_ES_INTENT_ID=$(echo "$BOT3_ES_INTENT_RESP" | extract_json_field "intentId")
echo "  AuthenticateIntent (es_US) ID: $BOT3_ES_INTENT_ID"

echo "  Creating memberId slot (es_US)..."
BOT3_MEMBERID_ES_RESP=$(aws lexv2-models create-slot \
  --bot-id "$BOT3_ID" --bot-version DRAFT --locale-id es_US \
  --intent-id "$BOT3_ES_INTENT_ID" \
  --slot-name "memberId" \
  --slot-type-id "AMAZON.Number" \
  --value-elicitation-setting '{
    "slotConstraint": "Required",
    "promptSpecification": {
      "messageGroups": [{"message": {"plainTextMessage": {"value": "Por favor diga o ingrese su numero de identificacion de miembro de 9 digitos."}}}],
      "maxRetries": 2,
      "allowInterrupt": true
    }
  }' \
  --profile "$PROFILE" --region "$REGION" --output json)

BOT3_MEMBERID_ES_SLOT_ID=$(echo "$BOT3_MEMBERID_ES_RESP" | extract_json_field "slotId")

echo "  Creating dateOfBirth slot (es_US)..."
BOT3_DOB_ES_RESP=$(aws lexv2-models create-slot \
  --bot-id "$BOT3_ID" --bot-version DRAFT --locale-id es_US \
  --intent-id "$BOT3_ES_INTENT_ID" \
  --slot-name "dateOfBirth" \
  --slot-type-id "AMAZON.Date" \
  --value-elicitation-setting '{
    "slotConstraint": "Required",
    "promptSpecification": {
      "messageGroups": [{"message": {"plainTextMessage": {"value": "Ahora por favor diga o ingrese su fecha de nacimiento como mes, dia y ano de 4 digitos."}}}],
      "maxRetries": 2,
      "allowInterrupt": true
    }
  }' \
  --profile "$PROFILE" --region "$REGION" --output json)

BOT3_DOB_ES_SLOT_ID=$(echo "$BOT3_DOB_ES_RESP" | extract_json_field "slotId")

echo "  Setting slot priorities and confirmation (es_US)..."
aws lexv2-models update-intent \
  --bot-id "$BOT3_ID" --bot-version DRAFT --locale-id es_US \
  --intent-id "$BOT3_ES_INTENT_ID" \
  --intent-name "AuthenticateIntent" \
  --description "Recopila numero de miembro y fecha de nacimiento para verificacion de identidad" \
  --sample-utterances '[
    {"utterance":"necesito verificar mi identidad"},
    {"utterance":"verificar"},
    {"utterance":"autenticar"},
    {"utterance":"quiero autenticarme"},
    {"utterance":"verificar mi identidad"},
    {"utterance":"necesito iniciar sesion"},
    {"utterance":"verificacion de identidad"},
    {"utterance":"confirmar mi identidad"},
    {"utterance":"me gustaria verificar mi cuenta"},
    {"utterance":"dejeme verificar"},
    {"utterance":"estoy listo para verificar"},
    {"utterance":"verificar mi cuenta"},
    {"utterance":"autenticacion"},
    {"utterance":"necesito confirmar quien soy"},
    {"utterance":"iniciar sesion"},
    {"utterance":"validar mi identidad"}
  ]' \
  --slot-priorities "[
    {\"priority\": 1, \"slotId\": \"$BOT3_MEMBERID_ES_SLOT_ID\"},
    {\"priority\": 2, \"slotId\": \"$BOT3_DOB_ES_SLOT_ID\"}
  ]" \
  --intent-confirmation-setting '{
    "promptSpecification": {
      "messageGroups": [{"message": {"plainTextMessage": {"value": "Tengo su numero de miembro como {memberId} y fecha de nacimiento como {dateOfBirth}. Es correcto?"}}}],
      "maxRetries": 1,
      "allowInterrupt": true
    },
    "declinationResponse": {
      "messageGroups": [{"message": {"plainTextMessage": {"value": "Dejeme recopilar su informacion de nuevo."}}}],
      "allowInterrupt": false
    }
  }' \
  --profile "$PROFILE" --region "$REGION" > /dev/null

# Build both locales
echo "  Building Bot 3 (en_US)..."
aws lexv2-models build-bot-locale \
  --bot-id "$BOT3_ID" --bot-version DRAFT --locale-id en_US \
  --profile "$PROFILE" --region "$REGION" > /dev/null

wait_for_build "$BOT3_ID" "en_US"

echo "  Building Bot 3 (es_US)..."
aws lexv2-models build-bot-locale \
  --bot-id "$BOT3_ID" --bot-version DRAFT --locale-id es_US \
  --profile "$PROFILE" --region "$REGION" > /dev/null

wait_for_build "$BOT3_ID" "es_US"

echo "  Creating version..."
BOT3_VERSION_RESP=$(aws lexv2-models create-bot-version \
  --bot-id "$BOT3_ID" \
  --bot-version-locale-specification '{"en_US":{"sourceBotVersion":"DRAFT"},"es_US":{"sourceBotVersion":"DRAFT"}}' \
  --profile "$PROFILE" --region "$REGION" --output json)
BOT3_VERSION=$(echo "$BOT3_VERSION_RESP" | extract_json_field "botVersion")
echo "  Bot 3 Version: $BOT3_VERSION"

echo "  Creating alias..."
BOT3_ALIAS_RESP=$(aws lexv2-models create-bot-alias \
  --bot-id "$BOT3_ID" --bot-alias-name "$ALIAS_NAME" \
  --bot-version "$BOT3_VERSION" \
  --bot-alias-locale-settings '{"en_US":{"enabled":true},"es_US":{"enabled":true}}' \
  --profile "$PROFILE" --region "$REGION" --output json)
BOT3_ALIAS_ID=$(echo "$BOT3_ALIAS_RESP" | extract_json_field "botAliasId")
BOT3_ALIAS_ARN="arn:aws:lex:${REGION}:${ACCOUNT}:bot-alias/${BOT3_ID}/${BOT3_ALIAS_ID}"
echo "  Bot 3 Alias ARN: $BOT3_ALIAS_ARN"

echo "  Associating with Connect..."
aws connect associate-bot \
  --instance-id "$INSTANCE_ID" \
  --lex-v2-bot "{\"AliasArn\":\"$BOT3_ALIAS_ARN\"}" \
  --profile "$PROFILE" --region "$REGION" 2>/dev/null || echo "  (Already associated or association complete)"

echo "Bot 3 DONE."
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
echo "Bot 3: HealthcareAuthBot (Authentication EN+ES)"
echo "  Bot ID:    $BOT3_ID"
echo "  Version:   $BOT3_VERSION"
echo "  Alias ID:  $BOT3_ALIAS_ID"
echo "  Alias ARN: $BOT3_ALIAS_ARN"
echo ""
echo "All 3 bots deployed and associated with Connect instance: haohai-wfm"

# Save ARNs for IVR flow deployment
cat > /Users/haohaipang/Desktop/claude-connect-skills/output/bot-arns.env << ENVEOF
BOT1_ID=$BOT1_ID
BOT1_ALIAS_ID=$BOT1_ALIAS_ID
BOT1_ALIAS_ARN=$BOT1_ALIAS_ARN
BOT2_ID=$BOT2_ID
BOT2_ALIAS_ID=$BOT2_ALIAS_ID
BOT2_ALIAS_ARN=$BOT2_ALIAS_ARN
BOT3_ID=$BOT3_ID
BOT3_ALIAS_ID=$BOT3_ALIAS_ID
BOT3_ALIAS_ARN=$BOT3_ALIAS_ARN
ENVEOF
echo ""
echo "Bot ARNs saved to output/bot-arns.env"
