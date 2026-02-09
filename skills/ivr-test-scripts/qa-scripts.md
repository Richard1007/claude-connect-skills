# QA Test Scripts

**Assume there are gaps. Your job is to find them.**

## Phase 1: Coverage Verification

### 1. Path Completeness
- [ ] Count all unique end-to-end paths in the IVR flow
- [ ] Verify each path has at least one DTMF scenario
- [ ] Verify each path has at least one Voice scenario (if Lex is used)
- [ ] Verify each error type at each menu level has a scenario

### 2. Prompt Accuracy
- [ ] For every SYSTEM line, verify the text matches the flow JSON `Parameters.Text` EXACTLY
- [ ] No paraphrasing, no missing sentences, no added words
- [ ] Check for copy-paste errors (wrong prompt in wrong scenario)

### 3. Input Accuracy
- [ ] DTMF digits match the flow JSON `Conditions.Operands` values
- [ ] Voice utterances exist in the Lex bot's sample utterances
- [ ] Intent names in the analysis match actual Lex bot intent names
- [ ] Invalid input examples actually trigger the FallbackIntent

### 4. Scenario Uniqueness
- [ ] No two scenarios have identical paths
- [ ] No duplicate scenario IDs
- [ ] Each scenario tests something distinct from all others

## Phase 2: Error Path Verification

### 1. Every Menu Level Has Error Scenarios
For each `ConnectParticipantWithLexBot` or `GetParticipantInput` block:
- [ ] Invalid DTMF digit scenario exists
- [ ] Unrecognized voice input scenario exists (if Lex)
- [ ] Timeout/silence scenario exists

### 2. Error Outcomes Are Correct
- [ ] Verify each error scenario's expected outcome matches the flow JSON error transitions
- [ ] Error prompt text matches the flow JSON
- [ ] Error paths terminate correctly (disconnect or retry)

## Phase 3: Edge Case Verification

- [ ] Special keys (#, *, 0) are tested at each menu level
- [ ] Common out-of-domain phrases ("help", "agent", "repeat") are tested
- [ ] Mixed input methods (DTMF at one level, voice at another) are tested

## Verification Loop

1. Generate all test scripts
2. Run Phase 1 coverage checks
3. Run Phase 2 error path checks
4. Run Phase 3 edge case checks
5. **List all gaps found**
6. Add missing scenarios
7. **Re-verify** — adding scenarios may reveal more gaps
8. Repeat until all checks pass

**Do not declare complete until:**
- Every IVR path has DTMF + Voice coverage
- Every error type at every menu level is tested
- All prompt text is verified verbatim against flow JSON
- Coverage matrix has no empty cells
