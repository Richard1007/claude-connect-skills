// IVR #5 Transfer Test: 100% Group A → TransferToFlow
import { ConnectClient, CreateTestCaseCommand, StartTestCaseExecutionCommand, GetTestCaseExecutionSummaryCommand, ListTestCaseExecutionRecordsCommand } from '@aws-sdk/client-connect';
import { fromSSO } from '@aws-sdk/credential-providers';
import { randomUUID } from 'crypto';

const INSTANCE_ID = '7d261e94-17bc-4f3e-96f7-f9b7541ce479';
const FLOW_ID = '72e3a877-ddab-441d-99be-987751e117a6';
const REGION = 'us-west-2';
const ts = Date.now();

const client = new ConnectClient({
  region: REGION,
  credentials: fromSSO({ profile: 'haohai' })
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Test: Welcome → Group A msg → TransferToFlow → sub-flow msg → disconnect
const s1 = {
  Version: "2019-10-30",
  Metadata: {},
  Observations: [
    {
      Identifier: "test-start",
      Event: { Identifier: "init", Type: "TestInitiated", Actor: "System", Properties: {} },
      Actions: [],
      Transitions: { NextObservations: ["welcome"] }
    },
    {
      Identifier: "welcome",
      Event: {
        Identifier: "wm", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "A B testing flow" },
        MatchingCriteria: "Inclusion"
      },
      Actions: [],
      Transitions: { NextObservations: ["group-a-msg"] }
    },
    {
      Identifier: "group-a-msg",
      Event: {
        Identifier: "ga", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "group A" },
        MatchingCriteria: "Inclusion"
      },
      Actions: [],
      Transitions: { NextObservations: ["transferred-msg"] }
    },
    {
      // After TransferToFlow → sub-flow: SetVoice → "You have been transferred to the secondary flow..."
      Identifier: "transferred-msg",
      Event: {
        Identifier: "tm", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "transferred to the secondary flow" },
        MatchingCriteria: "Inclusion"
      },
      Actions: [
        {
          Identifier: "end", Type: "TestControl",
          Parameters: { ActionType: "TestControl", Command: { Type: "EndTest" } }
        }
      ],
      Transitions: { NextObservations: [] }
    }
  ]
};

async function runTest(name, description, content) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`  ${name}`);
  console.log(`  ${description}`);
  console.log(`${'='.repeat(80)}`);
  
  let testCaseId;
  try {
    const resp = await client.send(new CreateTestCaseCommand({
      InstanceId: INSTANCE_ID, Name: name, Description: description,
      Content: JSON.stringify(content), Status: 'PUBLISHED',
      EntryPoint: { Type: 'VOICE_CALL', VoiceCallEntryPointParameters: { FlowId: FLOW_ID } }
    }));
    testCaseId = resp.TestCaseId;
    console.log(`  Created: ${testCaseId}`);
  } catch (e) {
    console.error(`  CREATE FAILED: ${e.name}: ${e.message.substring(0, 300)}`);
    return { name, status: 'CREATE_FAILED' };
  }
  
  let executionId;
  try {
    const r = await client.send(new StartTestCaseExecutionCommand({
      InstanceId: INSTANCE_ID, TestCaseId: testCaseId, ClientToken: randomUUID()
    }));
    executionId = r.TestCaseExecutionId;
    console.log(`  Exec: ${executionId}`);
  } catch (e) {
    console.error(`  EXEC FAILED: ${e.message.substring(0, 200)}`);
    return { name, testCaseId, status: 'EXEC_FAILED' };
  }
  
  let finalStatus = 'TIMEOUT';
  for (let i = 0; i < 24; i++) {
    await sleep(5000);
    try {
      const s = await client.send(new GetTestCaseExecutionSummaryCommand({
        InstanceId: INSTANCE_ID, TestCaseId: testCaseId, TestCaseExecutionId: executionId
      }));
      const obs = s.ObservationSummary;
      const dur = s.Duration ? ` (${s.Duration.toFixed(1)}s)` : '';
      console.log(`  [${String((i+1)*5).padStart(3)}s] ${s.Status} | ${obs?.ObservationsPassed||0}/${obs?.TotalObservations||0} pass, ${obs?.ObservationsFailed||0} fail${dur}`);
      if (['PASSED','FAILED','STOPPED'].includes(s.Status)) { finalStatus = s.Status; break; }
    } catch (e) { console.log(`  [${(i+1)*5}s] err: ${e.message.substring(0,80)}`); }
  }
  
  try {
    const records = await client.send(new ListTestCaseExecutionRecordsCommand({
      InstanceId: INSTANCE_ID, TestCaseId: testCaseId, TestCaseExecutionId: executionId
    }));
    for (const r of (records.TestCaseExecutionRecords || records.ExecutionRecords || [])) {
      if (!r.Record) continue;
      try {
        const p = JSON.parse(r.Record);
        if (p.Type !== 'OBSERVATION') continue;
        const icon = p.Status === 'PASSED' ? 'PASS' : 'FAIL';
        const text = p.Event?.Properties?.Text || '';
        console.log(`  [${icon}] ${p.Identifier}: "${text.substring(0,180)}"`);
        if (p.Status === 'FAILED') {
          console.log(`        Expected: ${JSON.stringify(p.Event)}`);
          if (p.ActualEvent) console.log(`        Actual: ${JSON.stringify(p.ActualEvent)}`);
        }
      } catch {}
    }
  } catch {}
  
  console.log(`  RESULT: ${finalStatus}`);
  return { name, testCaseId, executionId, status: finalStatus };
}

async function main() {
  console.log('IVR #5: TransferToFlow Test (100% Group A)');
  console.log(`Main Flow: ${FLOW_ID} | Sub Flow: 4648ff34-03a6-4645-8784-e53ab2329036\n`);
  
  const result = await runTest(
    `IVR5-TransferToFlow-${ts}`,
    'Welcome → Group A → TransferToFlow → sub-flow message',
    s1
  );
  
  console.log(`\nFINAL: ${result.status}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
