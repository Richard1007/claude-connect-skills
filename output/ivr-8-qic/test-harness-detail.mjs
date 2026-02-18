import { ConnectClient, CreateTestCaseCommand, StartTestCaseExecutionCommand, GetTestCaseExecutionSummaryCommand, ListTestCaseExecutionRecordsCommand } from '@aws-sdk/client-connect';
import { fromSSO } from '@aws-sdk/credential-providers';
import { randomUUID } from 'crypto';

const INSTANCE_ID = '7d261e94-17bc-4f3e-96f7-f9b7541ce479';
const FLOW_ID = 'bda66936-6881-47e2-aacb-766b6b2cf636';
const client = new ConnectClient({ region: 'us-west-2', credentials: fromSSO({ profile: 'haohai' }) });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Test: welcome msg should be separate from success msg (CreateWisdomSession is silent like other control blocks)
const content = {
  Version: "2019-10-30", Metadata: {},
  Observations: [
    { Identifier: "start", Event: { Identifier: "i", Type: "TestInitiated", Actor: "System", Properties: {} }, Actions: [], Transitions: { NextObservations: ["welcome"] } },
    { Identifier: "welcome", Event: { Identifier: "w", Type: "MessageReceived", Actor: "System", Properties: { Text: "wisdom session" }, MatchingCriteria: "Inclusion" },
      Actions: [], Transitions: { NextObservations: ["success"] } },
    { Identifier: "success", Event: { Identifier: "s", Type: "MessageReceived", Actor: "System", Properties: { Text: "successfully" }, MatchingCriteria: "Inclusion" },
      Actions: [{ Identifier: "end", Type: "TestControl", Parameters: { ActionType: "TestControl", Command: { Type: "EndTest" } } }],
      Transitions: { NextObservations: [] } }
  ]
};

async function main() {
  const ts = Date.now();
  const resp = await client.send(new CreateTestCaseCommand({
    InstanceId: INSTANCE_ID, Name: `QIC-Detail-${ts}`, Description: 'QIC Detail Test',
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
  console.log('\n--- EXECUTION RECORDS ---');
  for (const r of (records.TestCaseExecutionRecords || [])) {
    if (!r.Record) continue;
    try {
      const p = JSON.parse(r.Record);
      console.log(JSON.stringify(p, null, 2));
    } catch {}
  }
  console.log(`\nRESULT: ${status}`);
}

main().catch(console.error);
