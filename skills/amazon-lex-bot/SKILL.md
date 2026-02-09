---
name: amazon-lex-bot
description: Use this skill any time an Amazon Lex V2 bot is involved — creating, modifying, building, or deploying bots. This includes: creating bots for Amazon Connect IVR voice+DTMF input, defining intents with sample utterances, configuring slots, building and versioning bots, creating aliases, and associating bots with Connect instances. Trigger whenever the user mentions "Lex bot," "voice recognition," "intents," "utterances," "NLU," or needs callers to speak their choices instead of only pressing digits.
---

# Amazon Lex V2 Bot Skill

## Quick Reference

| Task | Guide |
|------|-------|
| Create bot from scratch | Read [create-bot.md](create-bot.md) |
| QA and validate bot | Read [qa-validation.md](qa-validation.md) |
| Intent/utterance reference | Read [intent-reference.md](intent-reference.md) |

## Core Principles

1. **Utterances must be diverse** — Minimum 8-12 sample utterances per intent covering different phrasings.
2. **DTMF support** — When used with Connect, configure DTMF-to-intent mapping so callers can press digits OR speak.
3. **Build before deploy** — Bot must be built (`build-bot-locale`) before creating a version or alias.
4. **Test before connecting** — Validate the bot responds correctly before referencing it in a Connect flow.
5. **IAM role required** — Lex bots need a service-linked role.

## What To Do

- **Create focused bots** — One bot per IVR menu level. Don't cram all intents into one bot.
- **Use the service-linked role** — Use `arn:aws:iam::ACCOUNT:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots_*` or let AWS create it.
- **Set confidence threshold** — Use 0.40-0.80 for `nluIntentConfidenceThreshold`. Lower = more lenient matching.
- **Include variations** — For each intent, include formal, informal, short, and long utterances.
- **Associate with Connect** — After creating the bot alias, associate it with the Connect instance.
- **Wait for build completion** — `build-bot-locale` is async. Poll status until `Built`.

## What To Avoid

- **Don't skip the build step** — Unbuilt bots cannot be used. `build-bot-locale` is required.
- **Don't use overlapping utterances** — If "help" could match both HelpIntent and SupportIntent, the bot gets confused.
- **Don't forget the FallbackIntent** — Every bot has an `AMAZON.FallbackIntent`. Configure it to handle unrecognized input.
- **Don't create a version before building** — Version creation will fail if the locale isn't built.
- **Don't hardcode bot IDs** — Always capture the output of create commands and use the returned IDs.
- **Don't skip association** — The bot must be associated with the Connect instance before it can be used in flows.
- **Don't create alias without locale settings** — Always include `--bot-alias-locale-settings '{"en_US":{"enabled":true}}'` when creating aliases. Without this, the alias will reject requests.
- **Don't put conflicting DTMF digits in one bot** — If multiple menu levels reuse digits 1/2/3, create separate bots per menu level.
- **NEVER delete a bot that's referenced by a live flow** — This will break the flow.

## Bot Lifecycle

```
1. create-bot
   → Returns botId

2. create-bot-locale (botId, DRAFT, en_US)
   → Configures language, voice, confidence threshold

3. create-intent (for each intent)
   → Define intent name, sample utterances
   → Optionally add slots

4. build-bot-locale (botId, DRAFT, en_US)
   → Compiles the NLU model (async — poll until Built)

5. create-bot-version (botId)
   → Creates immutable version (1, 2, 3...)

6. create-bot-alias (botId)
   → Creates an alias pointing to the version
   → Returns aliasId and aliasArn

7. associate-bot with Connect instance
   → Makes the bot available in Connect flows
```

## Quick Commands

### Create bot:
```bash
aws lexv2-models create-bot \
  --bot-name "MyBot" \
  --role-arn "arn:aws:iam::ACCOUNT:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots_*" \
  --data-privacy '{"childDirected":false}' \
  --idle-session-ttl-in-seconds 300 \
  --profile PROFILE
```

### Create locale:
```bash
aws lexv2-models create-bot-locale \
  --bot-id BOTID \
  --bot-version DRAFT \
  --locale-id en_US \
  --nlu-intent-confidence-threshold 0.40 \
  --profile PROFILE
```

### Create intent:
```bash
aws lexv2-models create-intent \
  --bot-id BOTID \
  --bot-version DRAFT \
  --locale-id en_US \
  --intent-name "ProviderIntent" \
  --sample-utterances '[{"utterance":"provider"},{"utterance":"I am a provider"},{"utterance":"doctor"}]' \
  --profile PROFILE
```

### Build:
```bash
aws lexv2-models build-bot-locale \
  --bot-id BOTID \
  --bot-version DRAFT \
  --locale-id en_US \
  --profile PROFILE
```

### Check build status:
```bash
aws lexv2-models describe-bot-locale \
  --bot-id BOTID \
  --bot-version DRAFT \
  --locale-id en_US \
  --profile PROFILE \
  --query 'botLocaleStatus'
```

### Create version:
```bash
aws lexv2-models create-bot-version \
  --bot-id BOTID \
  --bot-version-locale-specification '{"en_US":{"sourceBotVersion":"DRAFT"}}' \
  --profile PROFILE
```

### Create alias:
```bash
aws lexv2-models create-bot-alias \
  --bot-id BOTID \
  --bot-alias-name "LiveAlias" \
  --bot-version "1" \
  --profile PROFILE
```

### Associate with Connect:
```bash
aws connect associate-bot \
  --instance-id INSTANCE_ID \
  --lex-v2-bot '{"AliasArn":"arn:aws:lex:REGION:ACCOUNT:bot-alias/BOTID/ALIASID"}' \
  --profile PROFILE
```

## Deploying and Updating

### Full deploy pipeline:
```bash
# Build
aws lexv2-models build-bot-locale --bot-id $BOT_ID --bot-version DRAFT --locale-id en_US --profile PROFILE

# Wait for build
while true; do
  STATUS=$(aws lexv2-models describe-bot-locale --bot-id $BOT_ID --bot-version DRAFT --locale-id en_US --profile PROFILE --query 'botLocaleStatus' --output text)
  echo "Status: $STATUS"
  if [ "$STATUS" = "Built" ]; then break; fi
  if [ "$STATUS" = "Failed" ]; then echo "BUILD FAILED"; exit 1; fi
  sleep 5
done

# Create version
aws lexv2-models create-bot-version --bot-id $BOT_ID --bot-version-locale-specification '{"en_US":{"sourceBotVersion":"DRAFT"}}' --profile PROFILE

# Update alias to new version (or create new alias)
aws lexv2-models update-bot-alias --bot-id $BOT_ID --bot-alias-id $ALIAS_ID --bot-alias-name "LiveAlias" --bot-version "$NEW_VERSION" --profile PROFILE
```
