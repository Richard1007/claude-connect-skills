#!/usr/bin/env python3
"""Execute Native Test API tests for Sunrise Health Clinic IVR."""

import json
import uuid
import subprocess
import time
import sys
import os
from datetime import datetime

PROFILE = "haohai"
REGION = "us-west-2"
INSTANCE_ID = "7d261e94-17bc-4f3e-96f7-f9b7541ce479"
FLOW_ID = "b8c0b0e0-5700-45dc-8688-7213f97b317b"
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_RUN_ID = datetime.now().strftime("%Y%m%d_%H%M%S")


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


def happy_path_3obs(main_dtmf, sub_msg, sub_dtmf, final_msg):
    """Standard happy path: greeting -> DTMF -> sub-dept msg -> DTMF -> final msg -> end"""
    o1, o2, o3 = uid(), uid(), uid()
    return test_content(
        [
            obs(
                o1,
                "MessageReceived",
                "Thank you for calling Sunrise Health Clinic",
                [dtmf_action(main_dtmf)],
                [o2],
            ),
            obs(o2, "MessageReceived", sub_msg, [dtmf_action(sub_dtmf)], [o3]),
            obs(o3, "MessageReceived", final_msg, [end_test_action()], []),
        ]
    )


# === Define all DTMF scenarios ===
scenarios = {
    "S1": {
        "name": "Happy Path DTMF - Provider > Referrals",
        "content": happy_path_3obs(
            1, "connecting you to provider services", 1, "submit a referral"
        ),
    },
    "S2": {
        "name": "Happy Path DTMF - Provider > Prior Authorization",
        "content": happy_path_3obs(
            1, "connecting you to provider services", 2, "prior authorization requests"
        ),
    },
    "S3": {
        "name": "Happy Path DTMF - Provider > Provider Relations",
        "content": happy_path_3obs(
            1, "connecting you to provider services", 3, "provider relations inquiries"
        ),
    },
    "S4": {
        "name": "Happy Path DTMF - Patient > Appointments",
        "content": happy_path_3obs(
            2,
            "connecting you to patient services",
            1,
            "schedule, reschedule, or cancel",
        ),
    },
    "S5": {
        "name": "Happy Path DTMF - Patient > Prescription Refills",
        "content": happy_path_3obs(
            2, "connecting you to patient services", 2, "prescription refills"
        ),
    },
    "S6": {
        "name": "Happy Path DTMF - Patient > Medical Records",
        "content": happy_path_3obs(
            2, "connecting you to patient services", 3, "medical records"
        ),
    },
    "S7": {
        "name": "Happy Path DTMF - Pharmacy > Refill Status",
        "content": happy_path_3obs(
            3, "connecting you to pharmacy services", 1, "refill status"
        ),
    },
    "S8": {
        "name": "Happy Path DTMF - Pharmacy > New Prescription",
        "content": happy_path_3obs(
            3, "connecting you to pharmacy services", 2, "new prescription inquiries"
        ),
    },
    "S9": {
        "name": "Happy Path DTMF - Billing > Pay Bill",
        "content": happy_path_3obs(
            4, "connecting you to billing services", 1, "pay your bill"
        ),
    },
    "S10": {
        "name": "Happy Path DTMF - Billing > Insurance Questions",
        "content": happy_path_3obs(
            4, "connecting you to billing services", 2, "insurance and coverage"
        ),
    },
    "S11": {
        "name": "Happy Path DTMF - Billing > Payment Plans",
        "content": happy_path_3obs(
            4, "connecting you to billing services", 3, "flexible payment plans"
        ),
    },
    "S15": {
        "name": "Error - Invalid Input at Main Menu",
        "content": test_content(
            [
                obs(
                    uid(),
                    "MessageReceived",
                    "Thank you for calling Sunrise Health Clinic",
                    [dtmf_action(9)],
                    ["o2"],
                ),
                obs(
                    "o2",
                    "MessageReceived",
                    "Sorry, we were unable to understand",
                    [end_test_action()],
                    [],
                ),
            ]
        ),
    },
}


def run_aws_cli(cmd):
    """Execute AWS CLI command and return JSON output."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}", file=sys.stderr)
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return result.stdout


def create_test_case(name, description, content):
    unique_name = f"{name}_{TEST_RUN_ID}"
    content_json = json.dumps(content)
    cmd = (
        f"aws connect create-test-case "
        f"--instance-id {INSTANCE_ID} "
        f'--name "{unique_name}" '
        f'--description "{description}" '
        f"--status PUBLISHED "
        f'--entry-point \'{{"Type":"VOICE_CALL","VoiceCallEntryPointParameters":{{"FlowId":"{FLOW_ID}"}}}}\' '
        f"--content '{content_json}' "
        f"--profile {PROFILE} --region {REGION}"
    )
    return run_aws_cli(cmd)


def start_execution(test_case_id):
    """Start test case execution."""
    client_token = uid()
    cmd = (
        f"aws connect start-test-case-execution "
        f"--instance-id {INSTANCE_ID} "
        f"--test-case-id {test_case_id} "
        f"--client-token {client_token} "
        f"--profile {PROFILE} --region {REGION}"
    )
    return run_aws_cli(cmd)


def get_execution_summary(test_case_id, execution_id):
    """Get execution summary with workaround for timestamp bug."""
    cmd = (
        f"aws connect get-test-case-execution-summary "
        f"--instance-id {INSTANCE_ID} "
        f"--test-case-id {test_case_id} "
        f"--test-case-execution-id {execution_id} "
        f"--profile {PROFILE} --region {REGION} "
        f"--debug 2>&1 | grep '\"Status\"'"
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
            scenario["content"],
        )

        if not tc_resp or "TestCaseId" not in tc_resp:
            print(f"❌ Failed to create test case for {scenario_id}")
            results[scenario_id] = {
                "status": "FAILED",
                "error": "Create test case failed",
            }
            continue

        test_case_id = tc_resp["TestCaseId"]
        print(f"  Created test case: {test_case_id}")

        # Start execution
        exec_resp = start_execution(test_case_id)
        if not exec_resp or "TestCaseExecutionId" not in exec_resp:
            print(f"❌ Failed to start execution for {scenario_id}")
            results[scenario_id] = {
                "status": "FAILED",
                "error": "Start execution failed",
            }
            continue

        execution_id = exec_resp["TestCaseExecutionId"]
        print(f"  Started execution: {execution_id}")

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
            print(f"    Status check {attempts}: {status}")

        if status == "IN_PROGRESS":
            status = "TIMEOUT"

        results[scenario_id] = {
            "name": scenario["name"],
            "test_case_id": test_case_id,
            "execution_id": execution_id,
            "status": status,
        }

        icon = "✅" if status == "PASSED" else "⚠️" if status == "TIMEOUT" else "❌"
        print(f"  {icon} Result: {status}")

    # Save results
    output_file = os.path.join(OUTPUT_DIR, "test-execution-results.json")
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n=== Results saved to {output_file} ===")

    # Print summary
    passed = sum(1 for r in results.values() if r["status"] == "PASSED")
    failed = sum(1 for r in results.values() if r["status"] == "FAILED")
    timeouts = sum(1 for r in results.values() if r["status"] == "TIMEOUT")
    print(f"\nSummary: {passed} PASSED, {failed} FAILED, {timeouts} TIMEOUT")

    return results


if __name__ == "__main__":
    run_all_tests()
