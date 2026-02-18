import { ConnectClient, CreateTestCaseCommand, StartTestCaseExecutionCommand, GetTestCaseExecutionSummaryCommand, ListTestCaseExecutionRecordsCommand } from '@aws-sdk/client-connect';
import { fromSSO } from '@aws-sdk/credential-providers';
import { randomUUID } from 'crypto';

const INSTANCE_ID = '7d261e94-17bc-4f3e-96f7-f9b7541ce479';
const FLOW_ID = 'a785ba68-aeb2-45c2-84d1-6fb2e300569a';  // IVR #2: Language Router
const REGION = 'us-west-2';
const ts = Date.now();

const client = new ConnectClient({
  region: REGION,
  credentials: fromSSO({ profile: 'haohai' })
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ================================================================
// IVR #2 Flow: Language Router with Attribute Branching
// 
// Components: UpdateContactAttributes, Compare, GetParticipantInput,
//             MessageParticipant, UpdateContactTextToSpeechVoice,
//             DisconnectParticipant
//
// Message concatenation behavior (from IVR #1 learnings):
// - Welcome + Menu = ONE MessageReceived event
// - After DTMF, response message = separate event
// - Invalid error + retry menu = ONE concatenated event
// ================================================================

// S1: Press 1 → English
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
        Properties: { Text: "Welcome to the language selection system" },
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
      Transitions: { NextObservations: ["english-response"] }
    },
    {
      Identifier: "english-response",
      Event: {
        Identifier: "er", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "You selected English" },
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

// S2: Press 2 → Spanish
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
        Properties: { Text: "Welcome to the language selection system" },
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
      Transitions: { NextObservations: ["spanish-response"] }
    },
    {
      Identifier: "spanish-response",
      Event: {
        Identifier: "sr", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "You selected Spanish" },
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

// S3: Press 3 → French
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
        Properties: { Text: "Welcome to the language selection system" },
        MatchingCriteria: "Inclusion"
      },
      Actions: [
        {
          Identifier: "press-3", Type: "SendInstruction", Actor: "Customer",
          Parameters: {
            ActionType: "SendInstruction", Actor: "Customer",
            Instruction: { Type: "DtmfInput", Properties: { Value: 3 } }
          }
        }
      ],
      Transitions: { NextObservations: ["french-response"] }
    },
    {
      Identifier: "french-response",
      Event: {
        Identifier: "fr", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "You selected French" },
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

// S4: Press 9 (invalid) → retry → Press 1 → English
// After invalid DTMF: flow sets retryCount=1, Compare routes to "Sorry..." MessageParticipant,
// then to retry GetParticipantInput. The error message + retry menu should concatenate.
const s4 = {
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
        Properties: { Text: "Welcome to the language selection system" },
        MatchingCriteria: "Inclusion"
      },
      Actions: [
        {
          Identifier: "press-9", Type: "SendInstruction", Actor: "Customer",
          Parameters: {
            ActionType: "SendInstruction", Actor: "Customer",
            Instruction: { Type: "DtmfInput", Properties: { Value: 9 } }
          }
        }
      ],
      // After invalid DTMF: SetAttribute(retryCount=1) → Compare(retryCount=1) → 
      // MessageParticipant("Sorry...") → GetParticipantInput("Press 1...")
      // These concatenate into one event
      Transitions: { NextObservations: ["invalid-retry"] }
    },
    {
      Identifier: "invalid-retry",
      Event: {
        Identifier: "ir", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "not a valid selection" },
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
      Transitions: { NextObservations: ["english-response"] }
    },
    {
      Identifier: "english-response",
      Event: {
        Identifier: "er", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "You selected English" },
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

// S5: Timeout (no input)
const s5 = {
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
        Properties: { Text: "Welcome to the language selection system" },
        MatchingCriteria: "Inclusion"
      },
      Actions: [],
      Transitions: { NextObservations: ["timeout-response"] }
    },
    {
      Identifier: "timeout-response",
      Event: {
        Identifier: "tr", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "did not receive any input" },
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
  { name: `IVR2-S1-English-${ts}`, desc: 'Press 1 → English (tests UpdateContactAttributes + Compare)', content: s1 },
  { name: `IVR2-S2-Spanish-${ts}`, desc: 'Press 2 → Spanish (tests attribute branching)', content: s2 },
  { name: `IVR2-S3-French-${ts}`, desc: 'Press 3 → French (tests attribute branching)', content: s3 },
  { name: `IVR2-S4-InvalidRetry-${ts}`, desc: 'Press 9 → retry → Press 1 (tests retryCount + Compare)', content: s4 },
  { name: `IVR2-S5-Timeout-${ts}`, desc: 'No input → timeout (tests timeout path)', content: s5 },
];

async function runTest(name, description, content) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`🧪 ${name}`);
  console.log(`   ${description}`);
  console.log(`${'─'.repeat(80)}`);
  
  let testCaseId;
  try {
    const resp = await client.send(new CreateTestCaseCommand({
      InstanceId: INSTANCE_ID,
      Name: name,
      Description: description,
      Content: JSON.stringify(content),
      Status: 'PUBLISHED',
      EntryPoint: {
        Type: 'VOICE_CALL',
        VoiceCallEntryPointParameters: { FlowId: FLOW_ID }
      }
    }));
    testCaseId = resp.TestCaseId;
    console.log(`   Created: ${testCaseId}`);
  } catch (e) {
    console.error(`   ❌ Create: ${e.name}: ${e.message.substring(0, 300)}`);
    if (e.problemDetails) console.error(`   Details: ${JSON.stringify(e.problemDetails)}`);
    return { name, status: 'CREATE_FAILED', error: e.message };
  }
  
  let executionId;
  try {
    const execResp = await client.send(new StartTestCaseExecutionCommand({
      InstanceId: INSTANCE_ID,
      TestCaseId: testCaseId,
      ClientToken: randomUUID()
    }));
    executionId = execResp.TestCaseExecutionId;
    console.log(`   Execution: ${executionId}`);
  } catch (e) {
    console.error(`   ❌ Exec: ${e.message.substring(0, 200)}`);
    return { name, testCaseId, status: 'EXEC_FAILED' };
  }
  
  let finalStatus = 'TIMEOUT';
  for (let i = 0; i < 24; i++) {
    await sleep(5000);
    try {
      const summary = await client.send(new GetTestCaseExecutionSummaryCommand({
        InstanceId: INSTANCE_ID,
        TestCaseId: testCaseId,
        TestCaseExecutionId: executionId
      }));
      const status = summary.Status;
      const obs = summary.ObservationSummary;
      const dur = summary.Duration ? ` (${summary.Duration.toFixed(1)}s)` : '';
      console.log(`   [${String((i+1)*5).padStart(3)}s] ${status} | obs: ${obs?.ObservationsPassed || 0}/${obs?.TotalObservations || 0} pass, ${obs?.ObservationsFailed || 0} fail${dur}`);
      
      if (['PASSED', 'FAILED', 'STOPPED'].includes(status)) {
        finalStatus = status;
        break;
      }
    } catch (pe) {
      console.log(`   [${(i+1)*5}s] err: ${pe.message.substring(0, 80)}`);
    }
  }
  
  // Get observation records
  try {
    const records = await client.send(new ListTestCaseExecutionRecordsCommand({
      InstanceId: INSTANCE_ID,
      TestCaseId: testCaseId,
      TestCaseExecutionId: executionId
    }));
    const recs = records.TestCaseExecutionRecords || records.ExecutionRecords || [];
    for (const r of recs) {
      if (!r.Record) continue;
      try {
        const parsed = JSON.parse(r.Record);
        if (parsed.Type !== 'OBSERVATION') continue;
        const icon = parsed.Status === 'PASSED' ? '✅' : parsed.Status === 'FAILED' ? '❌' : '⏳';
        const text = parsed.Event?.Properties?.Text || '';
        const truncText = text.length > 80 ? text.substring(0, 77) + '...' : text;
        console.log(`   ${icon} ${parsed.Identifier}: ${parsed.Status} | "${truncText}"`);
        if (parsed.Status === 'FAILED') {
          console.log(`      Event: ${JSON.stringify(parsed.Event)}`);
        }
      } catch { /* skip non-JSON records */ }
    }
  } catch (re) {
    console.log(`   Records err: ${re.message.substring(0, 100)}`);
  }
  
  return { name, testCaseId, executionId, status: finalStatus };
}

async function main() {
  console.log('🚀 IVR #2: Language Router — Automated Test Suite');
  console.log('Components: UpdateContactAttributes, Compare, GetParticipantInput');
  console.log(`Flow ID: ${FLOW_ID}\n`);
  
  const results = [];
  for (const test of allTests) {
    const result = await runTest(test.name, test.desc, test.content);
    results.push(result);
  }
  
  console.log('\n\n' + '═'.repeat(80));
  console.log('📊 IVR #2 TEST RESULTS');
  console.log('─'.repeat(80));
  let passed = 0, failed = 0;
  for (const r of results) {
    const icon = r.status === 'PASSED' ? '✅' : r.status === 'FAILED' ? '❌' : '⚠️';
    console.log(`  ${icon} ${r.name}: ${r.status}`);
    if (r.status === 'PASSED') passed++;
    else failed++;
  }
  console.log(`\n  Total: ${passed} passed, ${failed} failed/other out of ${results.length}`);
  console.log('═'.repeat(80));
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
