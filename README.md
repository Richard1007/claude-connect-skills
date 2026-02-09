# Claude Code Skills for Amazon Connect

Three [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skills that work together to create, deploy, and test Amazon Connect IVR systems end-to-end using natural language.

## What Are These Skills?

Claude Code skills are structured instruction sets (markdown files) that teach Claude how to perform specialized tasks. When installed, Claude automatically activates the right skill based on your request — say "create an IVR" and the IVR skill kicks in; say "generate test scripts" and the test script skill takes over.

| Skill | What It Does |
|-------|-------------|
| **amazon-connect-ivr** | Creates and edits Amazon Connect contact flow JSON — menus, prompts, branching, error handling |
| **amazon-lex-bot** | Creates Lex V2 bots with voice + DTMF support — intents, utterances, build, deploy, associate |
| **ivr-test-scripts** | Generates exhaustive QA test scenarios from the flow JSON — happy paths, errors, timeouts, edge cases |

The skills are designed to chain: the IVR skill calls the Lex skill when voice input is needed, and the test script skill reads the IVR JSON + Lex bot data to produce test coverage.

## How They Work Together

```
You: "Create a healthcare clinic IVR with provider and patient menus"
                    │
                    ▼
        ┌───────────────────────┐
        │   amazon-connect-ivr  │  Creates flow JSON with greeting,
        │                       │  menus, prompts, error handling
        └───────────┬───────────┘
                    │ "This IVR needs voice input — creating Lex bots"
                    ▼
        ┌───────────────────────┐
        │   amazon-lex-bot      │  Creates separate bots per menu level,
        │                       │  builds, deploys, associates with Connect
        └───────────┬───────────┘
                    │ Bot alias ARNs embedded in flow JSON
                    ▼
        ┌───────────────────────┐
        │   Flow deployed to    │  Uploaded via AWS CLI,
        │   Amazon Connect      │  assigned to phone number
        └───────────┬───────────┘
                    │
You: "Generate test scripts for this IVR"
                    │
                    ▼
        ┌───────────────────────┐
        │   ivr-test-scripts    │  Reads flow JSON, auto-retrieves bot
        │                       │  data from AWS, generates 30+ scenarios
        └───────────────────────┘
```

## Prerequisites

- **AWS CLI** configured with SSO or credentials (`aws configure sso`)
- **Amazon Connect instance** with permissions to create flows, bots, and associate resources
- **Claude Code** installed ([installation guide](https://docs.anthropic.com/en/docs/claude-code))
- **Python 3** (for UUID generation and JSON validation)

### AWS Permissions Required

The skills execute AWS CLI commands, so your profile needs:
- `connect:*` — Create/update flows, associate bots, manage phone numbers
- `lex:*` — Create/manage Lex V2 bots, build, create versions and aliases
- `iam:ListRoles` — Find the Lex service-linked role

### AWS SSO Login

Before using any skill, make sure you're logged in:

```bash
aws sso login --profile your-profile
```

This is especially important for the **test script skill**, which auto-retrieves Lex bot data from AWS using bot names found in the flow JSON.

## Installation

Copy the `skills/` folder into your Claude Code skills directory:

```bash
# Clone the repo
git clone https://github.com/Richard1007/claude-connect-skills.git

# Copy skills to Claude Code
cp -r claude-connect-skills/skills/amazon-connect-ivr ~/.claude/skills/
cp -r claude-connect-skills/skills/amazon-lex-bot ~/.claude/skills/
cp -r claude-connect-skills/skills/ivr-test-scripts ~/.claude/skills/
```

Each skill folder has a `SKILL.md` entry point that Claude reads to understand when and how to use the skill, plus sub-files for specific tasks.

### Skill Structure

```
~/.claude/skills/
├── amazon-connect-ivr/
│   ├── SKILL.md                 # Entry point — routing, principles, do/don't
│   ├── create-from-scratch.md   # Step-by-step IVR creation workflow
│   ├── edit-existing.md         # How to modify existing flow JSON
│   ├── qa-validation.md         # 3-phase QA with Python validation script
│   └── flow-components.md       # Complete reference of all action types + JSON schemas
│
├── amazon-lex-bot/
│   ├── SKILL.md                 # Entry point — bot lifecycle, quick commands, do/don't
│   ├── create-bot.md            # 10-step bot creation workflow
│   ├── qa-validation.md         # 3-phase QA with automated utterance testing
│   └── intent-reference.md      # Standard intent patterns + utterance templates
│
└── ivr-test-scripts/
    ├── SKILL.md                 # Entry point — format rules, scenario categories
    ├── analyze-flow.md          # How to parse flow JSON and enumerate all paths
    ├── generate-scripts.md      # Dialogue format, caller/expected line rules
    └── qa-scripts.md            # Coverage verification checklist
```

## Skill 1: Amazon Connect IVR (`amazon-connect-ivr`)

Creates Amazon Connect contact flow JSON from natural language requirements.

### Triggers

Claude activates this skill when you mention: "IVR," "contact flow," "call flow," "phone tree," "Amazon Connect flow," or reference a flow JSON file.

### What It Produces

Valid Amazon Connect flow JSON (Version `2019-10-30`) with:
- Greeting and menu prompts (text-to-speech)
- DTMF-only menus (`GetParticipantInput`) or voice+DTMF menus (`ConnectParticipantWithLexBot`)
- Error handling at every branch point
- Visual metadata so the flow renders correctly in the Connect console
- Proper UUID identifiers for every block

### Example: Healthcare Clinic IVR

**Prompt:**
> Create a healthcare clinic IVR. Greeting says "Thank you for calling Sunrise Health Clinic." Then a main menu: provider (press 1) or patient (press 2). Providers get a sub-menu: referrals (1), prior auth (2), claims (3). Patients get: appointments (1), prescriptions (2), test results (3). All menus should support both voice and keypad. Include error handling.

**What Claude does:**

1. Designs the flow tree:
```
Entry → Set Voice (Joanna/Neural) → Greeting
  → Main Menu (Lex Bot: HealthClinicIVRBot)
    ├── ProviderIntent (press 1 / say "provider")
    │   → "Thank you, provider."
    │   → Provider Menu (Lex Bot: HealthClinicProviderMenuBot)
    │       ├── ReferralIntent (1) → Referral info → Disconnect
    │       ├── PriorAuthIntent (2) → Prior auth info → Disconnect
    │       └── ClaimsBillingIntent (3) → Claims info → Disconnect
    ├── PatientIntent (press 2 / say "patient")
    │   → "Thank you, patient."
    │   → Patient Menu (Lex Bot: HealthClinicPatientMenuBot)
    │       ├── AppointmentIntent (1) → Appointment info → Disconnect
    │       ├── PrescriptionIntent (2) → Prescription info → Disconnect
    │       └── TestResultsIntent (3) → Test results info → Disconnect
    └── Error/Timeout → "Sorry, we couldn't understand..." → Disconnect
```

2. Creates **3 separate Lex bots** (one per menu level — see Skill 2 below for why)
3. Generates the flow JSON with 15 action blocks
4. Runs QA validation (structural integrity, reachability, error handling)
5. Deploys to Connect and verifies

See the complete output: [`examples/healthcare-clinic-ivr.json`](examples/healthcare-clinic-ivr.json)

### Deploy Commands

```bash
# Create new flow
aws connect create-contact-flow \
  --instance-id YOUR_INSTANCE_ID \
  --name "Healthcare Clinic IVR" \
  --type CONTACT_FLOW \
  --content "$(cat flow.json)" \
  --profile your-profile

# Update existing flow
aws connect update-contact-flow-content \
  --instance-id YOUR_INSTANCE_ID \
  --contact-flow-id FLOW_ID \
  --content "$(cat flow.json)" \
  --profile your-profile
```

---

## Skill 2: Amazon Lex V2 Bot (`amazon-lex-bot`)

Creates and deploys Lex V2 bots for voice + DTMF input in Connect flows.

### Triggers

Claude activates this skill when you mention: "Lex bot," "voice recognition," "intents," "utterances," "NLU," or when the IVR skill determines voice input is needed.

### What It Produces

A fully deployed Lex V2 bot with:
- Custom intents with 8-12+ sample utterances each
- DTMF digit mapping (digits included as utterances)
- Built and versioned locale
- Alias with locale settings enabled
- Association with your Connect instance

### Key Design Decision: One Bot Per Menu Level

When an IVR has multiple menu levels that reuse the same DTMF digits (1, 2, 3), you **must** use separate Lex bots per level. Otherwise, pressing "1" at a sub-menu could match an intent from the main menu.

**Example from the healthcare clinic:**

```
HealthClinicIVRBot         → ProviderIntent(1), PatientIntent(2)
HealthClinicProviderMenuBot → ReferralIntent(1), PriorAuthIntent(2), ClaimsBillingIntent(3)
HealthClinicPatientMenuBot  → AppointmentIntent(1), PrescriptionIntent(2), TestResultsIntent(3)
```

Each bot has non-conflicting DTMF digits. The Connect flow references different bots at each `ConnectParticipantWithLexBot` block.

### Bot Creation Workflow

```bash
# 1. Create bot
aws lexv2-models create-bot --bot-name "HealthClinicIVRBot" \
  --role-arn "arn:aws:iam::ACCOUNT:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots_*" \
  --data-privacy '{"childDirected":false}' \
  --idle-session-ttl-in-seconds 300 --profile your-profile

# 2. Create locale
aws lexv2-models create-bot-locale --bot-id BOT_ID --bot-version DRAFT \
  --locale-id en_US --nlu-intent-confidence-threshold 0.40 --profile your-profile

# 3. Create intents (repeat for each)
aws lexv2-models create-intent --bot-id BOT_ID --bot-version DRAFT --locale-id en_US \
  --intent-name "ProviderIntent" \
  --sample-utterances '[
    {"utterance":"provider"}, {"utterance":"I am a provider"},
    {"utterance":"doctor"}, {"utterance":"physician"},
    {"utterance":"I'\''m calling as a provider"}, {"utterance":"healthcare provider"},
    {"utterance":"provider calling"}, {"utterance":"this is a provider"},
    {"utterance":"1"}
  ]' --profile your-profile

# 4. Build (async)
aws lexv2-models build-bot-locale --bot-id BOT_ID --bot-version DRAFT \
  --locale-id en_US --profile your-profile

# 5. Poll until built
aws lexv2-models describe-bot-locale --bot-id BOT_ID --bot-version DRAFT \
  --locale-id en_US --profile your-profile --query 'botLocaleStatus'

# 6. Create version
aws lexv2-models create-bot-version --bot-id BOT_ID \
  --bot-version-locale-specification '{"en_US":{"sourceBotVersion":"DRAFT"}}' \
  --profile your-profile

# 7. Create alias — MUST include locale settings!
aws lexv2-models create-bot-alias --bot-id BOT_ID \
  --bot-alias-name "LiveAlias" --bot-version "1" \
  --bot-alias-locale-settings '{"en_US":{"enabled":true}}' \
  --profile your-profile

# 8. Associate with Connect
aws connect associate-bot --instance-id INSTANCE_ID \
  --lex-v2-bot '{"AliasArn":"arn:aws:lex:REGION:ACCOUNT:bot-alias/BOT_ID/ALIAS_ID"}' \
  --profile your-profile
```

### Common Gotcha: Alias Locale Settings

Always include `--bot-alias-locale-settings '{"en_US":{"enabled":true}}'` when creating aliases. Without this, the alias rejects all requests with `"Language en_US not enabled"`. If you forgot during creation:

```bash
aws lexv2-models update-bot-alias --bot-id BOT_ID --bot-alias-id ALIAS_ID \
  --bot-alias-name "LiveAlias" --bot-version "1" \
  --bot-alias-locale-settings '{"en_US":{"enabled":true}}' \
  --profile your-profile
```

---

## Skill 3: IVR Test Scripts (`ivr-test-scripts`)

Generates exhaustive QA test scenarios from a deployed IVR flow.

### Triggers

Claude activates this skill when you mention: "test script," "test scenarios," "IVR testing," "call flow testing," or need QA scripts.

### Input

**The only required input is the IVR flow JSON file.**

The skill reads the flow JSON and:
1. Extracts all prompt text verbatim (for `Expected:` lines)
2. Maps the complete flow graph — every branch, error path, and terminal node
3. Identifies Lex bot references by name (from `ConnectParticipantWithLexBot` blocks)
4. **Auto-retrieves bot details from AWS** — using the bot names found in the flow JSON, it calls `aws lexv2-models list-bots` to resolve bot IDs, then `aws lexv2-models list-intents` and `aws lexv2-models describe-intent` to get intent names and sample utterances

This means you need to be logged into the AWS account where the bots are deployed:

```bash
aws sso login --profile your-profile
```

### Output Format

Natural conversational dialogue — not tables:

```markdown
## Scenario 1: Happy Path — Provider → Referral (DTMF)

**Purpose:** Test the complete happy path for a provider navigating to
referral information using only keypad input

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health
Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider,
or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Presses 1 on keypad

Expected: Lex bot matches ProviderIntent via DTMF digit "1".
System plays: "Thank you, provider."

Expected: System plays provider menu prompt: "How can we help you today?
Say referral or press 1 for referrals. Say prior auth or press 2 for
prior authorizations. Say claims or press 3 for claims and billing."

Caller: Presses 1 on keypad

Expected: Lex bot matches ReferralIntent via DTMF digit "1".
System plays: "You selected referrals. To submit a referral, please fax
your referral form to 5 5 5, 1 2 3, 4 5 6 7..."

Expected: Call disconnects.
```

### Scenario Categories

The skill generates scenarios across these categories:

| Category | What It Tests | Example Count |
|----------|-------------|---------------|
| Happy Path — DTMF | Every valid end-to-end path using keypad | 6 |
| Happy Path — Voice (keyword) | Same paths using single spoken words | 2 |
| Happy Path — Voice (phrases) | Natural full sentences | 2 |
| Happy Path — Voice (synonyms) | Alternate words not in the prompt | 2 |
| Happy Path — Mixed input | DTMF at one level, voice at another | 2 |
| Error — Invalid DTMF | Wrong digit at each menu level | 3 |
| Error — Unrecognized speech | Nonsense at each menu level | 3 |
| Timeout — Silence | No input at each menu level | 3 |
| Edge cases | Special keys (#, *, 0), hesitant callers | 8+ |

For the healthcare clinic example, this produced **31 scenarios** with 100% path coverage. See: [`examples/healthcare-clinic-test-scripts.md`](examples/healthcare-clinic-test-scripts.md)

### Example: Voice Utterance Variety

The skill varies caller phrasing across scenarios to test different recognition patterns:

| Style | Example |
|-------|---------|
| Primary keyword | `Caller: Says "provider"` |
| Full phrase | `Caller: Says "I'm calling as a healthcare provider"` |
| Synonym | `Caller: Says "doctor"` |
| Casual | `Caller: Says "yeah I'm a provider"` |
| Hesitant | `Caller: Says "um... provider? I think?"` |

### Example: Error Scenario

```markdown
## Scenario 16: Error — Unrecognized Speech at Main Menu

**Purpose:** Verify that saying something completely unrelated triggers the
error path at the main menu

Caller: Dials +1 (800) 555-0100

Expected: System plays greeting: "Thank you for calling Sunrise Health
Clinic. We are here to help you with all your healthcare needs."

Expected: System plays main menu prompt: "Are you calling as a provider,
or as a patient? You can say provider or press 1. Say patient or press 2."

Caller: Says "I'd like to order a large pepperoni pizza"

Expected: Lex bot matches FallbackIntent — no intent recognized.
System routes to error. System plays error message: "Sorry, we were unable
to understand your selection. Please try calling again. Goodbye."

Expected: Call disconnects.
```

---

## Lessons Learned

Key issues discovered while building the healthcare clinic example, now codified in the skills:

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| DTMF digit matches wrong intent | Same digits (1, 2, 3) used across menu levels in one bot | Use separate Lex bots per menu level |
| "Language en_US not enabled" | Alias created without locale settings | Always include `--bot-alias-locale-settings '{"en_US":{"enabled":true}}'` |
| Bot build appears stuck | `build-bot-locale` is async | Poll `describe-bot-locale` until status is `Built` |
| Test scripts missing voice scenarios | Only tested DTMF paths | Skill now mandates both DTMF and voice scenarios for every path |

## QA Philosophy

All three skills include mandatory QA loops — not just "check once," but iterative verification:

1. Generate the artifact (flow JSON / bot / test scripts)
2. Run validation checks
3. **Assume there are problems** — look for gaps
4. Fix all issues found
5. Re-verify — one fix often creates another problem
6. Repeat until a full pass reveals zero issues

The skills will not declare success until all checks pass.

## License

MIT
