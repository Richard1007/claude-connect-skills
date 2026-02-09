---
name: amazon-connect-ivr
description: Create, edit, validate, and deploy Amazon Connect contact flow (IVR) JSON. Trigger on IVR, contact flow, call flow, phone tree, or flow JSON references.
---

# Amazon Connect IVR Skill

## Quick Reference

| Task | Guide |
|------|-------|
| Create IVR from scratch | Read [create-from-scratch.md](create-from-scratch.md) |
| Edit existing IVR JSON | Read [edit-existing.md](edit-existing.md) |
| QA and validate flow | Read [qa-validation.md](qa-validation.md) |
| Component reference | Read [flow-components.md](flow-components.md) |

## Core Principles

1. **Simplicity first** — Use the minimum number of blocks needed. Do not over-engineer.
2. **Every path must terminate** — Every branch must end at a `DisconnectParticipant` block or a transfer. No dangling paths.
3. **Error handling is mandatory** — Every block that can error must have error branches handled.
4. **Unique UUIDs** — Every action must have a unique UUID as its `Identifier`. Generate fresh UUIDs for every block.
5. **Valid JSON only** — Output must be valid Amazon Connect flow JSON (Version `2019-10-30`).

## What To Do

- **Always start with requirements** — Before generating any JSON, confirm with the user: what prompts to play, what inputs to collect, what branches exist, and how errors should be handled.
- **Use text-to-speech for prompts** — Use the `Text` parameter in `MessageParticipant` blocks unless the user specifies audio files.
- **Support both DTMF and voice** — When the user wants callers to "press or say" options, integrate a Lex V2 bot. Use the `amazon-lex-bot` skill to create the bot first, then reference its alias ARN in the flow.
- **Generate proper metadata** — Include `Metadata` with `entryPointPosition`, `ActionMetadata` with positions for each block so the flow renders correctly in the Connect console.
- **Space blocks visually** — Position blocks left-to-right with ~250px horizontal spacing and ~150px vertical spacing between branches.
- **Export the final JSON** — Always save the final flow JSON to a file the user can import.

## CRITICAL: Correct Block Type Names

These type names are **wrong** and will cause `InvalidContactFlowException` on deploy:

| WRONG (will fail) | CORRECT (use this) |
|---|---|
| `InvokeExternalResource` | `InvokeLambdaFunction` |
| `Loop` | `Compare` + `UpdateContactAttributes` counter |

Parameter names also differ:
- WRONG: `FunctionArn`, `TimeLimit`
- CORRECT: `LambdaFunctionARN`, `InvocationTimeLimitSeconds`

Always include `TextToSpeechStyle: "None"` in `UpdateContactTextToSpeechVoice` blocks.

Always call `UpdateContactTargetQueue` before `TransferContactToQueue` — you cannot pass a QueueId directly to TransferContactToQueue.

Always call `UpdateContactTargetQueue` before `CheckHoursOfOperation` — the hours check uses the queue's hours. If no queue is set, it returns False (closed) regardless of actual hours.

See [flow-components.md](flow-components.md) for all 24 verified block types with correct schemas.

## What To Avoid

- **Don't use `InvokeExternalResource` or `Loop`** — These types are rejected by the API. See the table above.
- **Don't use `GetParticipantInput` for multi-digit input** — It only supports single digits (0-9, #, *). Use `StoreInput` for multi-digit.
- **Don't forget `Conditions` array in `GetParticipantInput`** — Each DTMF option needs a separate condition entry.
- **Don't hardcode contact flow ARNs** — Use placeholder comments if referencing other flows.
- **Don't leave error branches empty** — Always route errors to an error prompt followed by disconnect or retry.
- **Don't use the same UUID for multiple blocks** — This will corrupt the flow.
- **Don't omit the `Version` field** — Must be `"2019-10-30"`.
- **Don't create blocks without Metadata positions** — The flow editor will break.
- **Don't mix up `GetParticipantInput` (DTMF-only) and `ConnectParticipantWithLexBot` (Lex V2)** — These are different action types. Use `ConnectParticipantWithLexBot` when integrating with a Lex V2 bot.
- **Don't use `ConnectParticipantWithLexBot` without first creating and deploying the Lex bot** — The bot alias ARN must exist.
- **Don't call `TransferContactToQueue` without `UpdateContactTargetQueue` first** — The queue must be set before transferring.
- **NEVER generate invalid UUIDs** — Always use proper v4 UUID format (8-4-4-4-12 hex).

## Flow JSON Structure

```json
{
  "Version": "2019-10-30",
  "StartAction": "<UUID of first action>",
  "Metadata": {
    "entryPointPosition": { "x": 39, "y": 40 },
    "ActionMetadata": {
      "<action-uuid>": {
        "position": { "x": 250, "y": 200 }
      }
    }
  },
  "Actions": [
    {
      "Identifier": "<UUID>",
      "Type": "<ActionType>",
      "Parameters": { ... },
      "Transitions": {
        "NextAction": "<UUID>",
        "Conditions": [ ... ],
        "Errors": [ ... ]
      }
    }
  ]
}
```

## Prerequisite Questions (MANDATORY)

**Before starting ANY work, you MUST ask the user these questions and wait for answers:**

### Question 1: Input Source
Ask: **"How will you provide the existing IVR or Lex Bot?"**
- **Upload JSON** — User will paste or upload an existing contact flow JSON file
- **Give me access to AWS** — User will provide AWS profile and instance ID so you can pull the existing flow directly from AWS
- **Create a new one** — No existing flow; build from scratch based on requirements

### Question 2: Output Delivery
Ask: **"How would you like to receive the output?"**
- **Save directly to your AWS account** — Deploy the IVR flow and/or Lex bot directly to the user's Connect instance via AWS CLI
- **Give them as JSON files** — Export the flow JSON and bot configuration as local files only (no AWS deployment)

### Question 3: AWS Target (if deploying to AWS)
If the user chose "Save directly to AWS" or "Give me access to AWS", you MUST also ask:
- **AWS CLI profile name** (e.g., `haohai`, `default`, `prod`)
- **Amazon Connect Instance** — List available instances using `aws connect list-instances --profile <PROFILE>` and let the user pick one

**CRITICAL:** Always confirm the profile and instance with the user before running any AWS commands. Double-check by displaying the instance alias/name. Deploying to the wrong Connect instance or AWS account can cause production outages.

### Confirmation Gate
After collecting all answers, summarize back to the user:
> "I will [create/edit] the IVR flow and [deploy to AWS profile `X`, instance `Y` / save as JSON files]. Is that correct?"

**Do NOT proceed until the user confirms.**

---

## Workflow

1. **Ask prerequisite questions** (see above) — wait for user confirmation
2. Gather detailed IVR requirements from user
3. If Lex bot integration is needed, use the `amazon-lex-bot` skill first
4. Read [create-from-scratch.md](create-from-scratch.md) or [edit-existing.md](edit-existing.md)
5. Generate the flow JSON
6. Run QA per [qa-validation.md](qa-validation.md) — **loop until all issues resolved**
7. Export the final JSON file to the user
8. If user chose AWS deployment: deploy using `aws connect create-contact-flow` or `update-contact-flow-content`

## Deploying to AWS

### Create new flow:
```bash
aws connect create-contact-flow \
  --instance-id <INSTANCE_ID> \
  --name "<Flow Name>" \
  --type CONTACT_FLOW \
  --content "$(cat flow.json)" \
  --profile <PROFILE>
```

### Update existing flow:
```bash
aws connect update-contact-flow-content \
  --instance-id <INSTANCE_ID> \
  --contact-flow-id <FLOW_ID> \
  --content "$(cat flow.json)" \
  --profile <PROFILE>
```

### Verify deployment:
```bash
aws connect describe-contact-flow \
  --instance-id <INSTANCE_ID> \
  --contact-flow-id <FLOW_ID> \
  --profile <PROFILE>
```
