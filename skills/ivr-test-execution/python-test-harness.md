# Python Test Harness Generation

Generate a complete, reproducible Python test script from test scripts markdown. This approach ensures tests are highly reproducible and can be re-run without manual CLI commands.

## When to Use

- **Native Test API flows** — DTMF menus, simple Lex bot flows
- **Regression testing** — Need to re-run same tests repeatedly
- **CI/CD integration** — Python scripts integrate with test runners
- **Team handoff** — Generated scripts serve as executable documentation

## Generated Script Structure

```python
#!/usr/bin/env python3
"""Execute Native Test API tests for [Flow Name] IVR."""

import json
import uuid
import subprocess
import time
import sys
import os

PROFILE = "[aws-profile]"
REGION = "[aws-region]"
INSTANCE_ID = "[instance-id]"
FLOW_ID = "[flow-id]"
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


def uid():
    return str(uuid.uuid4())


def dtmf_action(value):
    """Create a DTMF input action."""
    return {
        "Identifier": uid(),
        "Type": "SendInstruction",
        "Actor": "Customer",
        "Parameters": {
            "ActionType": "SendInstruction",
            "Actor": "Customer",
            "Instruction": {"Type": "DtmfInput", "Properties": {"Value": value}},
        },
    }


def end_test_action():
    """Create an EndTest action."""
    return {
        "Identifier": uid(),
        "Type": "TestControl",
        "Parameters": {"ActionType": "TestControl", "Command": {"Type": "EndTest"}},
    }


def obs(obs_id, event_type, text, actions, next_ids):
    """Create an observation structure."""
    o = {
        "Identifier": obs_id,
        "Event": {"Identifier": uid(), "Type": event_type, "Actor": "System"},
        "Actions": actions,
        "Transitions": {"NextObservations": next_ids},
    }
    if text and event_type == "MessageReceived":
        o["Event"]["Properties"] = {"Text": text}
        o["Event"]["MatchingCriteria"] = "Inclusion"
    return o


def test_content(observations):
    """Wrap observations in test content structure."""
    return {"Version": "2019-10-30", "Metadata": {}, "Observations": observations}


# === Define all scenarios ===
scenarios = {
    "S1": {
        "name": "[Scenario Name]",
        "content": test_content([...]),  # Generated from test-scripts.md
    },
    # ... more scenarios
}


def run_aws_cli(cmd):
    """Execute AWS CLI command and return JSON output."""
    result = subprocess.run(
        cmd, shell=True, capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"Error: {result.stderr}", file=sys.stderr)
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return result.stdout


def create_test_case(name, description, content):
    """Create a test case via AWS CLI."""
    content_json = json.dumps(content)
    cmd = (
        f'aws connect create-test-case '
        f'--instance-id {INSTANCE_ID} '
        f'--name "{name}" '
        f'--description "{description}" '
        f'--status PUBLISHED '
        f'--entry-point \'{{"Type":"VOICE_CALL","VoiceCallEntryPointParameters":{{"FlowId":"{FLOW_ID}"}}}}\' '
        f'--content \'{content_json}\' '
        f'--profile {PROFILE} --region {REGION}'
    )
    return run_aws_cli(cmd)


def start_execution(test_case_id):
    """Start test case execution."""
    client_token = uid()
    cmd = (
        f'aws connect start-test-case-execution '
        f'--instance-id {INSTANCE_ID} '
        f'--test-case-id {test_case_id} '
        f'--client-token {client_token} '
        f'--profile {PROFILE} --region {REGION}'
    )
    return run_aws_cli(cmd)


def get_execution_summary(test_case_id, execution_id):
    """Get execution summary with workaround for timestamp bug."""
    cmd = (
        f'aws connect get-test-case-execution-summary '
        f'--instance-id {INSTANCE_ID} '
        f'--test-case-id {test_case_id} '
        f'--test-case-execution-id {execution_id} '
        f'--profile {PROFILE} --region {REGION} '
        f'--debug 2>&1 | grep \'"Status"\''
    )
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout


def run_all_tests():
    """Execute all scenarios and collect results."""
    results = {}
    
    for scenario_id, scenario in scenarios.items():
        print(f"\n=== Running {scenario_id}: {scenario['name']} ===")
        
        # Create test case
        tc_resp = create_test_case(
            f"{scenario_id}: {scenario['name']}",
            f"Test scenario {scenario_id}",
            scenario["content"]
        )
        
        if not tc_resp or "TestCaseId" not in tc_resp:
            print(f"Failed to create test case for {scenario_id}")
            results[scenario_id] = {"status": "FAILED", "error": "Create test case failed"}
            continue
        
        test_case_id = tc_resp["TestCaseId"]
        
        # Start execution
        exec_resp = start_execution(test_case_id)
        if not exec_resp or "TestCaseExecutionId" not in exec_resp:
            print(f"Failed to start execution for {scenario_id}")
            results[scenario_id] = {"status": "FAILED", "error": "Start execution failed"}
            continue
        
        execution_id = exec_resp["TestCaseExecutionId"]
        
        # Poll for completion
        status = "IN_PROGRESS"
        attempts = 0
        max_attempts = 30
        
        while status == "IN_PROGRESS" and attempts < max_attempts:
            time.sleep(5)
            summary = get_execution_summary(test_case_id, execution_id)
            if "PASSED" in summary:
                status = "PASSED"
            elif "FAILED" in summary:
                status = "FAILED"
            elif "TIMEOUT" in summary:
                status = "TIMEOUT"
            attempts += 1
            print(f"  Status: {status} (attempt {attempts})")
        
        results[scenario_id] = {
            "name": scenario["name"],
            "test_case_id": test_case_id,
            "execution_id": execution_id,
            "status": status,
        }
        
        print(f"  Result: {status}")
    
    # Save results
    output_file = os.path.join(OUTPUT_DIR, "test-execution-results.json")
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n=== Results saved to {output_file} ===")
    return results


if __name__ == "__main__":
    run_all_tests()
```

## Generation Rules

### From Test Scripts to Python Code

1. **Parse test-scripts.md** — Extract scenario ID, name, and dialogue steps
2. **Map dialogue to observations** — Each dialogue turn becomes an observation:
   - `Expected: System plays...` → `MessageReceived` observation with text matching
   - `Caller: Presses X` → DTMF action in previous observation's Actions array
   - `Caller: Says "..."` → Voice input action (if using voice simulation)
3. **Generate observation chain** — Link observations via `NextObservations` transitions
4. **Add EndTest action** — Final observation must include `TestControl` action

### Observation Construction from Dialogue

**Example Dialogue:**
```markdown
Expected: System plays greeting: "Welcome..."
Caller: Presses 1
Expected: System plays: "Thank you..."
Caller: Presses 2
Expected: System plays: "Final message..."
Expected: Call disconnects
```

**Generated Python:**
```python
o1, o2, o3 = uid(), uid(), uid()
test_content([
    obs(o1, "MessageReceived", "Welcome", [dtmf_action(1)], [o2]),
    obs(o2, "MessageReceived", "Thank you", [dtmf_action(2)], [o3]),
    obs(o3, "MessageReceived", "Final message", [end_test_action()], []),
])
```

### Text Matching Strategy

Use `MatchingCriteria: "Inclusion"` with partial text fragments (not full messages) to handle:
- Case normalization by Polly TTS
- Minor wording variations
- Concatenated messages

**Good fragment:** `"Thank you for calling"` (matches full greeting)
**Bad fragment:** Entire 200-character message (too brittle)

## Execution Workflow

1. **Generate Python script** from test-scripts.md
2. **Run script:** `python3 run-tests.py`
3. **Collect results** from `test-execution-results.json`
4. **Generate results-and-comparison.md** using the Expected vs Actual format

## Advantages

| Aspect | CLI Commands | Python Script |
|--------|-------------|---------------|
| **Reproducibility** | Manual copy-paste errors likely | Same test every run |
| **Version control** | Commands in chat history | Script in git |
| **CI/CD** | Hard to integrate | Standard pytest/tox |
| **Debugging** | Hard to step through | Add breakpoints |
| **Retries** | Manual re-run | Loop in code |
| **Parallelism** | Manual | ThreadPoolExecutor |

## Limitations

- **Native Test API only** — Chat API (QIC flows) needs different approach
- **DTMF focused** — Voice input simulation is limited
- **AWS CLI dependency** — Still shells out to CLI (boto3 alternative possible)

## Alternative: Boto3 Implementation

For better error handling and no CLI dependency:

```python
import boto3

client = boto3.Session(profile_name=PROFILE).client('connect', region_name=REGION)

# Create test case
response = client.create_test_case(
    InstanceId=INSTANCE_ID,
    Name="S1: Happy Path",
    Description="Test scenario",
    Status='PUBLISHED',
    EntryPoint={
        'Type': 'VOICE_CALL',
        'VoiceCallEntryPointParameters': {'FlowId': FLOW_ID}
    },
    Content=test_content_obj  # Python dict, not JSON string
)
```

## Output Files

| File | Purpose |
|------|---------|
| `run-tests.py` | Generated Python test harness |
| `test-execution-results.json` | Raw execution results |
| `results-and-comparison.md` | Human-readable comparison |
