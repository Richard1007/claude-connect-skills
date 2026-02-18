import { ConnectClient, CreateTestCaseCommand, StartTestCaseExecutionCommand, GetTestCaseExecutionSummaryCommand, ListTestCaseExecutionRecordsCommand } from '@aws-sdk/client-connect';
import { fromSSO } from '@aws-sdk/credential-providers';
import { randomUUID } from 'crypto';

const INSTANCE_ID = '7d261e94-17bc-4f3e-96f7-f9b7541ce479';
const FLOW_ID = 'a785ba68-aeb2-45c2-84d1-6fb2e300569a';
const REGION = 'us-west-2';
const ts = Date.now();

const client = new ConnectClient({
  region: REGION,
  credentials: fromSSO({ profile: 'haohai' })
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ================================================================
// S4 Fix: Add intermediate observation for retry menu prompt.
// 
// Hypothesis: The "Sorry..." message and retry menu are separate events
// because silent blocks (UpdateContactAttributes, Compare) between 
// the first GetParticipantInput and the error MessageParticipant
// create an event boundary.
//
// Flow path after DTMF 9:
//   GetParticipantInput → UpdateContactAttributes(retryCount=1) → 
//   Compare(retryCount) → MessageParticipant("Sorry...") → 
//   GetParticipantInput(retry menu)
//
// New observation structure:
//   welcome-menu (send DTMF 9) → invalid-msg (observe "Sorry...") →
//   retry-menu (observe "Press 1..." and send DTMF 1) → english-response
// ================================================================

const s4_fix = {
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
      Transitions: { NextObservations: ["invalid-msg"] }
    },
    {
      // Observe the error message (may or may not include retry menu)
      Identifier: "invalid-msg",
      Event: {
        Identifier: "im", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "not a valid selection" },
        MatchingCriteria: "Inclusion"
      },
      Actions: [],  // NO action — just observe
      Transitions: { NextObservations: ["retry-menu"] }
    },
    {
      // Observe the retry menu prompt and send DTMF 1
      Identifier: "retry-menu",
      Event: {
        Identifier: "rm", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "Press 1 for English" },
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

// Also try: maybe the Sorry + retry menu ARE concatenated, but the
// issue is that after sending DTMF 1, the response goes through
// silent blocks (UpdateContactAttributes + Compare) before MessageParticipant.
// Try sending DTMF in the invalid-msg observation (skip retry-menu obs)
const s4_alt = {
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
      Transitions: { NextObservations: ["invalid-retry-combined"] }
    },
    {
      // Maybe Sorry + retry menu ARE one event, and we need to send DTMF here
      Identifier: "invalid-retry-combined",
      Event: {
        Identifier: "irc", Type: "MessageReceived", Actor: "System",
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
      // Skip directly to a "catch-all" — observe whatever comes next
      Transitions: { NextObservations: ["final-response"] }
    },
    {
      // Match whatever message comes after pressing 1 on retry
      Identifier: "final-response",
      Event: {
        Identifier: "fr", Type: "MessageReceived", Actor: "System",
        Properties: { Text: "English" },
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

async function runTest(name, desc, content) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`🧪 ${name} — ${desc}`);
  console.log(`${'─'.repeat(70)}`);
  
  let testCaseId;
  try {
    const resp = await client.send(new CreateTestCaseCommand({
      InstanceId: INSTANCE_ID, Name: name, Description: desc,
      Content: JSON.stringify(content), Status: 'PUBLISHED',
      EntryPoint: { Type: 'VOICE_CALL', VoiceCallEntryPointParameters: { FlowId: FLOW_ID } }
    }));
    testCaseId = resp.TestCaseId;
    console.log(`   Created: ${testCaseId}`);
  } catch (e) {
    console.error(`   ❌ ${e.name}: ${e.message.substring(0, 200)}`);
    if (e.problemDetails) console.error(`   ${JSON.stringify(e.problemDetails)}`);
    return { name, status: 'CREATE_FAILED' };
  }
  
  let executionId;
  try {
    const r = await client.send(new StartTestCaseExecutionCommand({
      InstanceId: INSTANCE_ID, TestCaseId: testCaseId, ClientToken: randomUUID()
    }));
    executionId = r.TestCaseExecutionId;
  } catch (e) { return { name, status: 'EXEC_FAILED' }; }
  
  let finalStatus = 'TIMEOUT';
  for (let i = 0; i < 18; i++) {  // 90s max
    await sleep(5000);
    try {
      const s = await client.send(new GetTestCaseExecutionSummaryCommand({
        InstanceId: INSTANCE_ID, TestCaseId: testCaseId, TestCaseExecutionId: executionId
      }));
      const obs = s.ObservationSummary;
      console.log(`   [${String((i+1)*5).padStart(2)}s] ${s.Status} | ${obs?.ObservationsPassed||0}/${obs?.TotalObservations||0} pass`);
      if (['PASSED','FAILED','STOPPED'].includes(s.Status)) { finalStatus = s.Status; break; }
    } catch (e) { console.log(`   err: ${e.message.substring(0,60)}`); }
  }
  
  // Records
  try {
    const records = await client.send(new ListTestCaseExecutionRecordsCommand({
      InstanceId: INSTANCE_ID, TestCaseId: testCaseId, TestCaseExecutionId: executionId
    }));
    for (const r of (records.TestCaseExecutionRecords || records.ExecutionRecords || [])) {
      if (!r.Record) continue;
      try {
        const p = JSON.parse(r.Record);
        if (p.Type !== 'OBSERVATION') continue;
        const icon = p.Status === 'PASSED' ? '✅' : '❌';
        const text = p.Event?.Properties?.Text || '';
        console.log(`   ${icon} ${p.Identifier}: "${text.substring(0,100)}"`);
      } catch {}
    }
  } catch {}
  
  console.log(`   🏁 ${finalStatus}`);
  return { name, status: finalStatus };
}

async function main() {
  console.log('🔬 IVR #2 S4 Fix — Testing retry observation patterns\n');
  
  const r1 = await runTest(`IVR2-S4-Fix-${ts}`, 'Separate obs for error + retry menu', s4_fix);
  const r2 = await runTest(`IVR2-S4-Alt-${ts}`, 'Combined obs with DTMF, broad match on response', s4_alt);
  
  console.log('\n' + '═'.repeat(70));
  console.log(`Fix (separate obs):   ${r1.status}`);
  console.log(`Alt (combined+broad): ${r2.status}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
