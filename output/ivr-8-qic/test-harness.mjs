import { ConnectClient, CreateTestCaseCommand, StartTestCaseExecutionCommand, GetTestCaseExecutionSummaryCommand, ListTestCaseExecutionRecordsCommand } from '@aws-sdk/client-connect';
import { fromSSO } from '@aws-sdk/credential-providers';
import { randomUUID } from 'crypto';

const INSTANCE_ID = '7d261e94-17bc-4f3e-96f7-f9b7541ce479';
const FLOW_ID = 'bda66936-6881-47e2-aacb-766b6b2cf636';
const client = new ConnectClient({ region: 'us-west-2', credentials: fromSSO({ profile: 'haohai' }) });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Scenario 1: Happy path - CreateWisdomSession succeeds
const contentS1 = {
  Version: "2019-10-30", Metadata: {},
  Observations: [
    { Identifier: "start", Event: { Identifier: "i", Type: "TestInitiated", Actor: "System", Properties: {} }, Actions: [], Transitions: { NextObservations: ["welcome"] } },
    { Identifier: "welcome", Event: { Identifier: "w", Type: "MessageReceived", Actor: "System", Properties: { Text: "wisdom session" }, MatchingCriteria: "Inclusion" },
      Actions: [], Transitions: { NextObservations: ["result"] } },
    { Identifier: "result", Event: { Identifier: "r", Type: "MessageReceived", Actor: "System", Properties: { Text: "session" }, MatchingCriteria: "Inclusion" },
      Actions: [{ Identifier: "end", Type: "TestControl", Parameters: { ActionType: "TestControl", Command: { Type: "EndTest" } } }],
      Transitions: { NextObservations: [] } }
  ]
};

// Scenario 2: Check success path - welcome + success confirmation (both messages concatenate if CreateWisdomSession is silent)
const contentS2 = {
  Version: "2019-10-30", Metadata: {},
  Observations: [
    { Identifier: "start", Event: { Identifier: "i", Type: "TestInitiated", Actor: "System", Properties: {} }, Actions: [], Transitions: { NextObservations: ["welcome-and-result"] } },
    { Identifier: "welcome-and-result", Event: { Identifier: "r", Type: "MessageReceived", Actor: "System", Properties: { Text: "Welcome" }, MatchingCriteria: "Inclusion" },
      Actions: [{ Identifier: "end", Type: "TestControl", Parameters: { ActionType: "TestControl", Command: { Type: "EndTest" } } }],
      Transitions: { NextObservations: [] } }
  ]
};

async function runTest(name, content) {
  const ts = Date.now();
  console.log(`\n=== ${name} ===`);
  
  const resp = await client.send(new CreateTestCaseCommand({
    InstanceId: INSTANCE_ID, Name: `QIC-${name}-${ts}`, Description: `QIC Test: ${name}`,
    Content: JSON.stringify(content), Status: 'PUBLISHED',
    EntryPoint: { Type: 'VOICE_CALL', VoiceCallEntryPointParameters: { FlowId: FLOW_ID } }
  }));
  const testCaseId = resp.TestCaseId;
  console.log(`Created: ${testCaseId}`);

  const exec = await client.send(new StartTestCaseExecutionCommand({
    InstanceId: INSTANCE_ID, TestCaseId: testCaseId, ClientToken: randomUUID()
  }));
  console.log(`Exec: ${exec.TestCaseExecutionId}`);

  let status = 'TIMEOUT';
  for (let i = 0; i < 24; i++) {
    await sleep(5000);
    const s = await client.send(new GetTestCaseExecutionSummaryCommand({
      InstanceId: INSTANCE_ID, TestCaseId: testCaseId, TestCaseExecutionId: exec.TestCaseExecutionId
    }));
    const obs = s.ObservationSummary;
    console.log(`[${(i+1)*5}s] ${s.Status} | ${obs?.ObservationsPassed||0}/${obs?.TotalObservations||0} pass`);
    if (['PASSED','FAILED','STOPPED'].includes(s.Status)) { status = s.Status; break; }
  }

  const records = await client.send(new ListTestCaseExecutionRecordsCommand({
    InstanceId: INSTANCE_ID, TestCaseId: testCaseId, TestCaseExecutionId: exec.TestCaseExecutionId
  }));
  for (const r of (records.TestCaseExecutionRecords || [])) {
    if (!r.Record) continue;
    try {
      const p = JSON.parse(r.Record);
      if (p.Type === 'OBSERVATION') {
        console.log(`  [${p.Status}] ${p.Identifier}: expected="${p.Event?.Properties?.Text || ''}" actual="${p.ActualEvent?.Properties?.Text || ''}"`);
      }
    } catch {}
  }
  console.log(`RESULT: ${status}`);
  return status;
}

async function main() {
  // Run S2 first to understand the behavior (broader matching)
  const s2 = await runTest('S2-BroadMatch', contentS2);
  // Then S1 with specific expectations
  const s1 = await runTest('S1-HappyPath', contentS1);
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`S1 (Happy Path): ${s1}`);
  console.log(`S2 (Broad Match): ${s2}`);
}

main().catch(console.error);
