# Edit Existing IVR

## Workflow

### Step 1: Load the Existing Flow

**From file:**
```bash
cat existing-flow.json | python3 -m json.tool
```

**From AWS:**
```bash
aws connect describe-contact-flow \
  --instance-id <INSTANCE_ID> \
  --contact-flow-id <FLOW_ID> \
  --profile <PROFILE> \
  | python3 -c "import json,sys; d=json.load(sys.stdin); content=json.loads(d['ContactFlow']['Content']); print(json.dumps(content, indent=2))"
```

### Step 2: Understand the Current Flow

1. Identify the `StartAction` — this is the entry point
2. Trace the flow by following `Transitions.NextAction` and `Transitions.Conditions`
3. Map out the current flow tree:
   - List all blocks by Type
   - Identify the branching points
   - Identify error handling paths
   - Identify terminal blocks (DisconnectParticipant)

### Step 3: Make Modifications

**Adding a block:**
1. Generate a new UUID for the block
2. Add the block to the `Actions` array
3. Update the `Transitions` of the preceding block to point to the new block
4. Set the new block's `Transitions.NextAction` to the next block
5. Add metadata position for the new block

**Removing a block:**
1. Find all blocks that transition TO the block being removed
2. Update their transitions to skip to the removed block's `NextAction`
3. Remove the block from `Actions`
4. Remove its metadata from `ActionMetadata`

**Modifying a prompt:**
1. Find the `MessageParticipant` block
2. Update the `Parameters.Text` field
3. No transition changes needed

**Adding a menu option:**
1. Find the `GetParticipantInput` or `ConnectParticipantWithLexBot` block
2. Add a new `Condition` entry to `Transitions.Conditions`
3. Create the target block(s) for the new option
4. Add metadata positions
5. If Lex: add a new intent to the Lex bot as well

**Changing error handling:**
1. Find the block's `Transitions.Errors` array
2. Update `NextAction` for the desired `ErrorType`
3. Create new error prompt blocks if needed

### Step 4: Validate

After editing, always:
1. Verify all UUIDs referenced in transitions exist in the Actions array
2. Verify no orphaned blocks (blocks not reachable from StartAction)
3. Verify all paths terminate at DisconnectParticipant or a transfer
4. Run QA per [qa-validation.md](qa-validation.md)

## Common Edit Patterns

### Insert a Block Between Two Existing Blocks

Before: `A → B`
After: `A → NEW → B`

1. Create NEW block with `Transitions.NextAction = B.Identifier`
2. Update A's `Transitions.NextAction` to `NEW.Identifier`
3. Update any conditions in A that pointed to B to point to NEW instead

### Replace a Prompt

Find the `MessageParticipant` block and change `Parameters.Text`:
```json
{
  "Identifier": "existing-uuid",
  "Type": "MessageParticipant",
  "Parameters": {
    "Text": "New prompt text here"
  },
  "Transitions": { "..." }
}
```

### Add Error Retry Loop

Replace direct error→disconnect with error→retry pattern:

```
Menu → Error Prompt → Loop Counter → (continue) Menu
                                    → (complete) Disconnect
```
