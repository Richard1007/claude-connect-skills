import { ConnectClient, CreateTestCaseCommand, StartTestCaseExecutionCommand, GetTestCaseExecutionSummaryCommand, ListTestCaseExecutionRecordsCommand } from '@aws-sdk/client-connect';
import { fromSSO } from '@aws-sdk/credential-providers';
import { randomUUID } from 'crypto';

const INSTANCE_ID = '7d261e94-17bc-4f3e-96f7-f9b7541ce479';
const FLOW_ID = '4570a2fe-9602-471c-8dfa-358681193b44';
const client = new ConnectClient({ region: 'us-west-2', credentials: fromSSO({ profile: 'haohai' }) });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const content = {
  Version: "2019-10-30", Metadata: {},
  Observations: [
    { Identifier: "start", Event: { Identifier: "i", Type: "TestInitiated", Actor: "System", Properties: {} }, Actions: [], Transitions: { NextObservations: ["msg"] } },
    { Identifier: "msg", Event: { Identifier: "m", Type: "MessageReceived", Actor: "System", Properties: { Text: "generative text to speech" }, MatchingCriteria: "Inclusion" },
      Actions: [{ Identifier: "end", Type: "TestControl", Parameters: { ActionType: "TestControl", Command: { Type: "EndTest" } } }],
      Transitions: { NextObservations: [] } }
  ]
};

async function main() {
  const ts = Date.now();
  const resp = await client.send(new CreateTestCaseCommand({
    InstanceId: INSTANCE_ID, Name: `GenTTS-${ts}`, Description: 'Test Generative TTS',
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
  for (let i = 0; i < 18; i++) {
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
        console.log(`[${p.Status}] ${p.Identifier}: "${p.Event?.Properties?.Text || ''}"`);
      }
    } catch {}
  }
  console.log(`RESULT: ${status}`);
}

main().catch(console.error);
