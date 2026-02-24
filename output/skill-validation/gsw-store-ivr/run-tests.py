#!/usr/bin/env python3
"""Execute Chat API tests for Warriors Store QIC IVR."""

import json
import subprocess
import time
import sys
import os
from datetime import datetime

PROFILE = "haohai"
REGION = "us-west-2"
INSTANCE_ID = "7d261e94-17bc-4f3e-96f7-f9b7541ce479"
FLOW_ID = "4aecbaf7-aa8b-4aef-842d-845a1275d7ba"
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


def run_aws_cli(cmd, use_profile_env=False):
    """Execute AWS CLI command and return JSON output."""
    env = os.environ.copy()
    if use_profile_env:
        env["AWS_PROFILE"] = PROFILE
        # Remove --profile from command for connectparticipant
        cmd = cmd.replace(f"--profile {PROFILE} ", "")

    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, env=env)
    if result.returncode != 0:
        print(f"Error: {result.stderr}", file=sys.stderr)
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return result.stdout


def start_chat():
    """Start a chat contact."""
    cmd = (
        f"aws connect start-chat-contact "
        f"--instance-id {INSTANCE_ID} "
        f"--contact-flow-id {FLOW_ID} "
        f'--participant-details \'{{"DisplayName":"TestCaller"}}\' '
        f"--profile {PROFILE} --region {REGION}"
    )
    return run_aws_cli(cmd)


def create_participant_connection(participant_token):
    """Create participant connection for WebSocket."""
    env = os.environ.copy()
    env["AWS_PROFILE"] = PROFILE

    cmd = (
        f"aws connectparticipant create-participant-connection "
        f"--participant-token {participant_token} "
        f'--type \'["WEBSOCKET","CONNECTION_CREDENTIALS"]\' '
        f"--region {REGION}"
    )

    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, env=env)
    if result.returncode != 0:
        print(f"Error creating connection: {result.stderr}", file=sys.stderr)
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None


def send_message(connection_token, message):
    """Send a message via Chat API."""
    env = os.environ.copy()
    env["AWS_PROFILE"] = PROFILE

    cmd = (
        f"aws connectparticipant send-message "
        f"--connection-token {connection_token} "
        f"--content-type text/plain "
        f'--content "{message}" '
        f"--region {REGION}"
    )

    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, env=env)
    return result.returncode == 0


def get_transcript(connection_token):
    """Get transcript of conversation."""
    env = os.environ.copy()
    env["AWS_PROFILE"] = PROFILE

    cmd = (
        f"aws connectparticipant get-transcript "
        f"--connection-token {connection_token} "
        f"--region {REGION}"
    )

    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, env=env)
    if result.returncode != 0:
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None


def disconnect(connection_token):
    """Disconnect from chat."""
    env = os.environ.copy()
    env["AWS_PROFILE"] = PROFILE

    cmd = (
        f"aws connectparticipant disconnect-participant "
        f"--connection-token {connection_token} "
        f"--region {REGION}"
    )

    subprocess.run(cmd, shell=True, capture_output=True, env=env)


def run_scenario(scenario_id, name, messages):
    """Run a single test scenario."""
    print(f"\n=== Running {scenario_id}: {name} ===")

    # Start chat
    chat_resp = start_chat()
    if not chat_resp or "ContactId" not in chat_resp:
        print(f"❌ Failed to start chat for {scenario_id}")
        return {"status": "FAILED", "error": "Start chat failed"}

    contact_id = chat_resp["ContactId"]
    participant_token = chat_resp["ParticipantToken"]
    print(f"  Started chat: {contact_id}")

    # Create connection
    conn_resp = create_participant_connection(participant_token)
    if not conn_resp:
        print(f"❌ Failed to create connection for {scenario_id}")
        return {"status": "FAILED", "error": "Create connection failed"}

    connection_token = conn_resp["ConnectionCredentials"]["ConnectionToken"]
    websocket_url = conn_resp.get("Websocket", {}).get("Url")
    print(f"  Created connection")

    transcript_history = []

    # Wait for greeting and ready message (from flow)
    print(f"  Waiting for system greeting...")
    time.sleep(8)

    # Send customer messages
    for i, msg in enumerate(messages):
        print(f"  Sending message {i + 1}: '{msg}'")
        if not send_message(connection_token, msg):
            print(f"  ⚠️ Failed to send message")

        # Wait for QIC AI response
        wait_time = 12 if i < len(messages) - 1 else 8
        print(f"  Waiting {wait_time}s for AI response...")
        time.sleep(wait_time)

        # Get transcript
        transcript = get_transcript(connection_token)
        if transcript:
            transcript_history.append(transcript)

    # Get final transcript
    time.sleep(3)
    final_transcript = get_transcript(connection_token)

    # Disconnect
    disconnect(connection_token)

    # Analyze results
    system_messages = []
    if final_transcript and "Transcript" in final_transcript:
        for item in final_transcript["Transcript"]:
            if item.get("ParticipantRole") == "SYSTEM":
                content = item.get("Content", "")
                system_messages.append(content)

    # Determine status based on system messages
    status = "PASSED"
    if not system_messages:
        status = "FAILED"
    elif "technical difficulties" in str(system_messages).lower():
        status = "FAILED"

    print(f"  ✅ Result: {status}")

    return {
        "status": status,
        "contact_id": contact_id,
        "system_messages": system_messages[:5],  # First 5 system messages
        "transcript_count": len(transcript_history) + 1,
    }


def run_all_tests():
    """Execute all QIC test scenarios."""
    results = {}

    # Define scenarios
    scenarios = {
        "S1": {
            "name": "Happy Path - Single Question About Jerseys",
            "messages": ["What jerseys do you have available?", "goodbye"],
        },
        "S2": {
            "name": "Happy Path - Single Question About Merchandise",
            "messages": ["What kind of Warriors merchandise do you sell?", "bye"],
        },
        "S3": {
            "name": "Happy Path - Multi-Turn Conversation About Jerseys",
            "messages": [
                "Do you have Stephen Curry jerseys?",
                "What sizes do they come in?",
                "How much do they cost?",
                "done",
            ],
        },
        "S7": {
            "name": "Edge Case - Unrelated Question",
            "messages": [
                "What is the weather like in San Francisco today?",
                "Okay, do you have any basketball shorts?",
                "exit",
            ],
        },
    }

    print("=" * 60)
    print("Warriors Store QIC IVR - Chat API Test Execution")
    print("=" * 60)

    for scenario_id, scenario in scenarios.items():
        result = run_scenario(scenario_id, scenario["name"], scenario["messages"])
        results[scenario_id] = {"name": scenario["name"], **result}

    # Save results
    output_file = os.path.join(OUTPUT_DIR, "test-execution-results.json")
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n{'=' * 60}")
    print(f"Results saved to {output_file}")

    # Print summary
    passed = sum(1 for r in results.values() if r.get("status") == "PASSED")
    failed = sum(1 for r in results.values() if r.get("status") == "FAILED")
    print(f"\nSummary: {passed} PASSED, {failed} FAILED")
    print("=" * 60)

    return results


if __name__ == "__main__":
    run_all_tests()
