import { ConnectClient, CreateTestCaseCommand, StartTestCaseExecutionCommand, GetTestCaseExecutionSummaryCommand, ListTestCaseExecutionRecordsCommand } from '@aws-sdk/client-connect';
import { fromSSO } from '@aws-sdk/credential-providers';
import { randomUUID } from 'crypto';

const INSTANCE_ID = '7d261e94-17bc-4f3e-96f7-f9b7541ce479';
const FLOW_ID = 'c0ccad2d-f667-4e7f-83e8-283b0ee5fe48';
const REGION = 'us-west-2';

const client = new ConnectClient({
  region: REGION,
  credentials: fromSSO({ profile: 'haohai' })
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const ts = Date.now();

// ================================================================
// KEY DISCOVERY: The test engine concatenates consecutive TTS prompts
// (MessageParticipant + GetParticipantInput) into ONE MessageReceived.
//
// Actual event text for first pass:
//   "Welcome to the self-learning test system. Press 1 for sales.
//    Press 2 for support, or press 3 to hear this menu again."
//
// This means:
// - Welcome + Menu = ONE observation (not two)
// - After DTMF, the response message is a SEPARATE event
// - For loops: after DTMF 3, GetParticipantInput replays ONLY
//   the menu prompt (no welcome), so it should be a NEW event
// - For invalid: "Sorry, that is not a valid option." + replayed
//   menu prompt may concatenate into ONE event again
// ================================================================

// S1: Sales (Press 1)
// welcome+menu → DTMF 1 → "You selected sales" → end
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
        Properties: { Text: "Welcome to the self-learning test system" },
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
      Transitions: { NextObservations: ["sales-response"] }
    },
    {
      Identifier: "sales-response",
      Event: {
        Identifier: "sr", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "You selected sales" },
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

// S2: Support (Press 2)
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
        Properties: { Text: "Welcome to the self-learning test system" },
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
      Transitions: { NextObservations: ["support-response"] }
    },
    {
      Identifier: "support-response",
      Event: {
        Identifier: "sr", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "You selected support" },
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

// S3: Repeat (Press 3) then Sales (Press 1)
// welcome+menu → DTMF 3 → repeated menu (standalone) → DTMF 1 → sales → end
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
        Properties: { Text: "Welcome to the self-learning test system" },
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
      // After DTMF 3, flow loops back to GetParticipantInput.
      // This time there's NO welcome message, just the menu prompt alone.
      Transitions: { NextObservations: ["repeated-menu"] }
    },
    {
      Identifier: "repeated-menu",
      Event: {
        Identifier: "rm", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "Press 1 for sales" },
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
      Transitions: { NextObservations: ["sales-response"] }
    },
    {
      Identifier: "sales-response",
      Event: {
        Identifier: "sr", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "You selected sales" },
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

// S4: Invalid (Press 9) then Support (Press 2)
// welcome+menu → DTMF 9 → "not valid option" + re-played menu → DTMF 2 → support → end
// Note: "Sorry, that is not a valid option." is a MessageParticipant
// followed by GetParticipantInput (menu prompt). They might concatenate!
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
        Properties: { Text: "Welcome to the self-learning test system" },
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
      // After invalid DTMF 9: flow goes to "Sorry, not valid" MessageParticipant
      // then back to GetParticipantInput. These may concatenate into one message.
      Transitions: { NextObservations: ["invalid-retry"] }
    },
    {
      // Match the error message (which may be concatenated with re-played menu)
      Identifier: "invalid-retry",
      Event: {
        Identifier: "ir", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "not a valid option" },
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
      Transitions: { NextObservations: ["support-response"] }
    },
    {
      Identifier: "support-response",
      Event: {
        Identifier: "sr", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "You selected support" },
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

// S5: Timeout (No Input)
// welcome+menu → no DTMF → timeout → "We did not receive any input" → end
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
      // Match the combined welcome+menu, but send NO action (wait for timeout)
      Identifier: "welcome-menu",
      Event: {
        Identifier: "wm", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "Welcome to the self-learning test system" },
        MatchingCriteria: "Inclusion"
      },
      Actions: [],  // No DTMF — let it timeout (5 second InputTimeLimitSeconds)
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
  { name: `S1-Fixed-${ts}`, desc: 'Press 1 → Sales (combined welcome+menu)', content: s1 },
  { name: `S2-Fixed-${ts}`, desc: 'Press 2 → Support (combined welcome+menu)', content: s2 },
  { name: `S3-Fixed-${ts}`, desc: 'Press 3 (repeat) → Press 1 → Sales', content: s3 },
  { name: `S4-Fixed-${ts}`, desc: 'Press 9 (invalid) → Press 2 → Support', content: s4 },
  { name: `S5-Fixed-${ts}`, desc: 'Timeout (no input) → Disconnect', content: s5 },
];

async function runTest(name, description, content) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`🧪 ${name}`);
  console.log(`   ${description}`);
  console.log(`${'─'.repeat(80)}`);
  
  // Create
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
    console.error(`   ❌ Create failed: ${e.name}: ${e.message.substring(0, 200)}`);
    if (e.problemDetails) console.error(`   Details: ${JSON.stringify(e.problemDetails)}`);
    return { name, status: 'CREATE_FAILED', error: e.message };
  }
  
  // Execute
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
    console.error(`   ❌ Exec failed: ${e.message.substring(0, 200)}`);
    return { name, testCaseId, status: 'EXEC_FAILED', error: e.message };
  }
  
  // Poll (2 min max, auto-stop at 90s)
  let finalStatus = 'TIMEOUT';
  let finalSummary = null;
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
      const p = obs?.ObservationsPassed || 0;
      const f = obs?.ObservationsFailed || 0;
      const t = obs?.TotalObservations || 0;
      const dur = summary.Duration ? ` (${summary.Duration.toFixed(1)}s)` : '';
      console.log(`   [${String((i+1)*5).padStart(3)}s] ${status} | obs: ${p}/${t} pass, ${f} fail${dur}`);
      
      if (['PASSED', 'FAILED', 'STOPPED'].includes(status)) {
        finalStatus = status;
        finalSummary = summary;
        break;
      }
    } catch (pe) {
      console.log(`   [${(i+1)*5}s] err: ${pe.message.substring(0, 80)}`);
    }
  }
  
  // Get records (full detail for FAILED, brief for PASSED)
  try {
    const records = await client.send(new ListTestCaseExecutionRecordsCommand({
      InstanceId: INSTANCE_ID,
      TestCaseId: testCaseId,
      TestCaseExecutionId: executionId
    }));
    const recs = records.TestCaseExecutionRecords || records.ExecutionRecords || [];
    const obsRecs = recs.filter(r => {
      if (r.Record) {
        try { return JSON.parse(r.Record).Type === 'OBSERVATION'; } catch { return false; }
      }
      return false;
    });
    
    for (const r of obsRecs) {
      const parsed = JSON.parse(r.Record);
      const icon = parsed.Status === 'PASSED' ? '✅' : parsed.Status === 'FAILED' ? '❌' : '⏳';
      const text = parsed.Event?.Properties?.Text || '';
      const truncText = text.length > 80 ? text.substring(0, 77) + '...' : text;
      console.log(`   ${icon} ${parsed.Identifier}: ${parsed.Status} | "${truncText}"`);
      
      // For FAILED observations, print full detail
      if (parsed.Status === 'FAILED') {
        console.log(`      Full event: ${JSON.stringify(parsed.Event, null, 2).split('\n').map(l => `      ${l}`).join('\n')}`);
      }
    }
  } catch (re) {
    console.log(`   Records err: ${re.message.substring(0, 100)}`);
  }
  
  return { name, testCaseId, executionId, status: finalStatus };
}

async function main() {
  console.log('🚀 Running ALL tests with FIXED structure (combined welcome+menu)\n');
  console.log('KEY CHANGE: Welcome + Menu prompt = ONE observation (not two)');
  console.log('This matches the actual engine behavior where consecutive TTS is concatenated.\n');
  
  const results = [];
  
  for (const test of allTests) {
    const result = await runTest(test.name, test.desc, test.content);
    results.push(result);
    
    // If S1 fails, stop early — baseline broken
    if (test.name.startsWith('S1') && result.status !== 'PASSED') {
      console.log('\n⚠ S1 baseline failed — stopping all tests');
      break;
    }
  }
  
  // Summary table
  console.log('\n\n' + '═'.repeat(80));
  console.log('📊 SUMMARY');
  console.log('─'.repeat(80));
  for (const r of results) {
    const icon = r.status === 'PASSED' ? '✅' : r.status === 'FAILED' ? '❌' : '⚠️';
    console.log(`  ${icon} ${r.name}: ${r.status}`);
  }
  console.log('═'.repeat(80));
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
