---
name: amazon-connect-ivr
description: Use this skill any time an Amazon Connect contact flow (IVR) is involved — as input, output, or both. This includes: creating IVR flows from scratch, reading/parsing/modifying existing flow JSON, adding or removing blocks, configuring DTMF menus, integrating Lex bots for voice input, setting up error handling, and exporting final flow JSON. Trigger whenever the user mentions "IVR," "contact flow," "call flow," "phone tree," "Amazon Connect flow," or references a flow JSON file. If a contact flow needs to be created, edited, validated, or deployed, use this skill.
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

## What To Avoid

- **Don't use `GetParticipantInput` for multi-digit input** — It only supports single digits (0-9, #, *). Use `StoreInput` for multi-digit.
- **Don't forget `Conditions` array in `GetParticipantInput`** — Each DTMF option needs a separate condition entry.
- **Don't hardcode contact flow ARNs** — Use placeholder comments if referencing other flows.
- **Don't leave error branches empty** — Always route errors to an error prompt followed by disconnect or retry.
- **Don't use the same UUID for multiple blocks** — This will corrupt the flow.
- **Don't omit the `Version` field** — Must be `"2019-10-30"`.
- **Don't create blocks without Metadata positions** — The flow editor will break.
- **Don't mix up `GetParticipantInput` (DTMF-only) and `ConnectParticipantWithLexBot` (Lex V2)** — These are different action types. Use `ConnectParticipantWithLexBot` when integrating with a Lex V2 bot.
- **Don't use `ConnectParticipantWithLexBot` without first creating and deploying the Lex bot** — The bot alias ARN must exist.
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

## Workflow

1. Gather requirements from user
2. If Lex bot integration is needed, use the `amazon-lex-bot` skill first
3. Read [create-from-scratch.md](create-from-scratch.md) or [edit-existing.md](edit-existing.md)
4. Generate the flow JSON
5. Run QA per [qa-validation.md](qa-validation.md) — **loop until all issues resolved**
6. Export the final JSON file to the user
7. Optionally deploy to AWS using `aws connect create-contact-flow` or `update-contact-flow-content`

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
