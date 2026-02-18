// IVR #5: A/B Test with Flow Transfer & Recording
// New components: DistributeByPercentage, TransferToFlow, UpdateContactRecordingBehavior
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

// S1: Expect Group A path (50% chance) → "group A" msg → TransferToFlow → sub-flow msg
// Flow: SetVoice → "Welcome to the A B testing flow" → UpdateRecording → DistributeByPercentage
//   → Group A (0-49%): "You have been selected for group A..." → TransferToFlow → sub-flow: "transferred to the secondary flow..."
// 
// Since DistributeByPercentage is non-deterministic, this test may FAIL if we land in Group B.
// That's expected — we need to observe which branch the test engine picks.
//
// Observations:
// - Welcome msg (SetVoice and UpdateRecording are silent)
// - Group A msg OR Group B msg (we'll test Group A path)
// - If Group A: transferred flow message
const s1_groupA = {
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
      // Welcome msg. Recording behavior is silent. DistributeByPercentage is silent.
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
      // Group A message
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
      // After TransferToFlow → sub-flow plays its message
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

// S2: Expect Group B path (50% chance) → "group B" msg → Disconnect
const s2_groupB = {
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
      Transitions: { NextObservations: ["group-b-msg"] }
    },
    {
      Identifier: "group-b-msg",
      Event: {
        Identifier: "gb", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "group B" },
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

// S3: Run Group A test again (second attempt) to see if percentage split varies
const s3_groupA_retry = {
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

const allTests = [
  { name: `IVR5-S1-GroupA-Transfer-${ts}`, desc: 'Expect Group A → TransferToFlow → sub-flow msg', content: s1_groupA },
  { name: `IVR5-S2-GroupB-Direct-${ts}`, desc: 'Expect Group B → goodbye → disconnect', content: s2_groupB },
  { name: `IVR5-S3-GroupA-Retry-${ts}`, desc: 'Group A again (check if split varies)', content: s3_groupA_retry },
];

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
    return { name, status: 'CREATE_FAILED', error: e.message };
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
        console.log(`  [${icon}] ${p.Identifier}: "${text.substring(0,150)}"`);
        if (p.Status === 'FAILED') {
          console.log(`        Expected Event: ${JSON.stringify(p.Event)}`);
          if (p.ActualEvent) console.log(`        Actual Event: ${JSON.stringify(p.ActualEvent)}`);
        }
      } catch {}
    }
  } catch {}
  
  console.log(`  RESULT: ${finalStatus}`);
  return { name, testCaseId, executionId, status: finalStatus };
}

async function main() {
  console.log('IVR #5: A/B Test with Flow Transfer & Recording');
  console.log(`Main Flow: ${FLOW_ID}`);
  console.log('Sub Flow: 4648ff34-03a6-4645-8784-e53ab2329036');
  console.log('Components: DistributeByPercentage (50/50), TransferToFlow, UpdateContactRecordingBehavior');
  console.log('NOTE: DistributeByPercentage is non-deterministic — expect either Group A or B tests to fail.\n');
  
  const results = [];
  for (const t of allTests) {
    results.push(await runTest(t.name, t.desc, t.content));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('IVR #5 RESULTS');
  console.log('-'.repeat(80));
  let p = 0, f = 0;
  for (const r of results) {
    const icon = r.status === 'PASSED' ? 'PASS' : 'FAIL';
    console.log(`  [${icon}] ${r.name}: ${r.status}`);
    if (r.status === 'PASSED') p++; else f++;
  }
  console.log(`\n  ${p} passed, ${f} failed out of ${results.length}`);
  console.log('  (For DistributeByPercentage: at least 1 of S1/S2 should pass)');
  console.log('='.repeat(80));
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
