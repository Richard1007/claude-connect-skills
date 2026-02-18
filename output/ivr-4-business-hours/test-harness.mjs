// IVR #4: Smart Business Hours Router
// New components tested: CheckHoursOfOperation, InvokeLambdaFunction, UpdateContactTargetQueue, TransferContactToQueue
import { ConnectClient, CreateTestCaseCommand, StartTestCaseExecutionCommand, GetTestCaseExecutionSummaryCommand, ListTestCaseExecutionRecordsCommand } from '@aws-sdk/client-connect';
import { fromSSO } from '@aws-sdk/credential-providers';
import { randomUUID } from 'crypto';

const INSTANCE_ID = '7d261e94-17bc-4f3e-96f7-f9b7541ce479';
const FLOW_ID = 'a2ef1da6-2140-4c29-8457-426045679aef';
const REGION = 'us-west-2';
const ts = Date.now();

const client = new ConnectClient({
  region: REGION,
  credentials: fromSSO({ profile: 'haohai' })
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// S1: Sales → hours open → Lambda → transfer message → queue transfer
const s1 = {
  Version: "2019-10-30",
  Metadata: {},
  Observations: [
    {
      Identifier: "test-start",
      Event: { Identifier: "init", Type: "TestInitiated", Actor: "System", Properties: {} },
      Actions: [],
      Transitions: { NextObservations: ["welcome-menu"] }
    },
    {
      Identifier: "welcome-menu",
      Event: {
        Identifier: "wm", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "welcome to the smart business hours router" },
        MatchingCriteria: "Inclusion"
      },
      Actions: [
        {
          Identifier: "press-1", Type: "SendInstruction", Actor: "Customer",
          Parameters: {
            ActionType: "SendInstruction", Actor: "Customer",
            Instruction: { Type: "DtmfInput", Properties: { Value: 1 } }
          }
        }
      ],
      Transitions: { NextObservations: ["lambda-msg"] }
    },
    {
      Identifier: "lambda-msg",
      Event: {
        Identifier: "lm", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "connected to" },
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

// S2: Support → hours closed → "office closed" message → disconnect
const s2 = {
  Version: "2019-10-30",
  Metadata: {},
  Observations: [
    {
      Identifier: "test-start",
      Event: { Identifier: "init", Type: "TestInitiated", Actor: "System", Properties: {} },
      Actions: [],
      Transitions: { NextObservations: ["welcome-menu"] }
    },
    {
      Identifier: "welcome-menu",
      Event: {
        Identifier: "wm", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "welcome to the smart business hours router" },
        MatchingCriteria: "Inclusion"
      },
      Actions: [
        {
          Identifier: "press-2", Type: "SendInstruction", Actor: "Customer",
          Parameters: {
            ActionType: "SendInstruction", Actor: "Customer",
            Instruction: { Type: "DtmfInput", Properties: { Value: 2 } }
          }
        }
      ],
      Transitions: { NextObservations: ["closed-msg"] }
    },
    {
      Identifier: "closed-msg",
      Event: {
        Identifier: "cm", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "office is currently closed" },
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

// S3: Invalid input (press 5) → error message → disconnect
const s3 = {
  Version: "2019-10-30",
  Metadata: {},
  Observations: [
    {
      Identifier: "test-start",
      Event: { Identifier: "init", Type: "TestInitiated", Actor: "System", Properties: {} },
      Actions: [],
      Transitions: { NextObservations: ["welcome-menu"] }
    },
    {
      Identifier: "welcome-menu",
      Event: {
        Identifier: "wm", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "welcome to the smart business hours router" },
        MatchingCriteria: "Inclusion"
      },
      Actions: [
        {
          Identifier: "press-5", Type: "SendInstruction", Actor: "Customer",
          Parameters: {
            ActionType: "SendInstruction", Actor: "Customer",
            Instruction: { Type: "DtmfInput", Properties: { Value: 5 } }
          }
        }
      ],
      Transitions: { NextObservations: ["error-msg"] }
    },
    {
      Identifier: "error-msg",
      Event: {
        Identifier: "em", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "not a valid selection" },
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
  { name: `IVR4-S1-Sales-Open-Lambda-${ts}`, desc: 'Press 1 → hours open → Lambda → transfer msg', content: s1 },
  { name: `IVR4-S2-Support-Closed-${ts}`, desc: 'Press 2 → hours closed → closed message', content: s2 },
  { name: `IVR4-S3-Invalid-Input-${ts}`, desc: 'Press 5 → invalid → error message', content: s3 },
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
    if (e.problemDetails) console.error(`  Details: ${JSON.stringify(e.problemDetails)}`);
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
          console.log(`        Event: ${JSON.stringify(p.Event)}`);
          if (p.ActualEvent) console.log(`        Actual: ${JSON.stringify(p.ActualEvent)}`);
        }
      } catch {}
    }
  } catch {}
  
  console.log(`  RESULT: ${finalStatus}`);
  return { name, testCaseId, executionId, status: finalStatus };
}

async function main() {
  console.log('IVR #4: Smart Business Hours Router Test Suite');
  console.log(`Flow: ${FLOW_ID}`);
  console.log('Components: CheckHoursOfOperation, InvokeLambdaFunction, UpdateContactTargetQueue, TransferContactToQueue');
  console.log(`BasicQueue: 337d3528 (24/7 hours) | ClosedQueue: c0ea4d3e (never-open hours)\n`);
  
  const results = [];
  for (const t of allTests) {
    results.push(await runTest(t.name, t.desc, t.content));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('IVR #4 RESULTS');
  console.log('-'.repeat(80));
  let p = 0, f = 0;
  for (const r of results) {
    const icon = r.status === 'PASSED' ? 'PASS' : 'FAIL';
    console.log(`  [${icon}] ${r.name}: ${r.status}`);
    if (r.status === 'PASSED') p++; else f++;
  }
  console.log(`\n  ${p} passed, ${f} failed out of ${results.length}`);
  console.log('='.repeat(80));
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
