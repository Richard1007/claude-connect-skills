# Warriors Store QIC IVR — Deployment Summary

## Bot
- Bot Name: WarriorsStoreQICBot
- Bot ID: B8IGZUUDBP
- Bot Version: 1
- Alias Name: LiveAlias
- Alias ID: VVYSEMJXIR
- Alias ARN: arn:aws:lex:us-west-2:988066449281:bot-alias/B8IGZUUDBP/VVYSEMJXIR
- Intents: AMAZON.QInConnectIntent, EndConversationIntent, AMAZON.FallbackIntent
- Locale: en_US
- Voice: Matthew (Generative engine)
- NLU Confidence Threshold: 0.40
- Associated with Connect: Yes

## Contact Flow
- Flow Name: Warriors Store QIC IVR
- Flow ID: 4aecbaf7-aa8b-4aef-842d-845a1275d7ba
- Flow ARN: arn:aws:connect:us-west-2:988066449281:instance/7d261e94-17bc-4f3e-96f7-f9b7541ce479/contact-flow/4aecbaf7-aa8b-4aef-842d-845a1275d7ba
- Flow State: ACTIVE
- Flow Type: CONTACT_FLOW
- Flow JSON: warriors-store-qic-flow.json

## QIC Configuration
- Assistant ARN: arn:aws:wisdom:us-west-2:988066449281:assistant/6eacb18c-c838-484c-9d6a-c9df4d3d6c4c
- Integration Association ID: 71264383-2889-46ec-9b6b-96c2d0c10b9a

## AWS Environment
- Profile: haohai
- Region: us-west-2
- Account: 988066449281
- Connect Instance ID: 7d261e94-17bc-4f3e-96f7-f9b7541ce479

## Flow Architecture
```
Entry → SetVoice (Matthew/Generative) → Welcome Message → CreateWisdomSession → Ready Message → [QIC Loop] ↔ self
                                                                                                    ↓ EndConversationIntent
                                                                                                Goodbye → Disconnect

Error path: Any block error → Error Message → Disconnect
```

## Block Summary (8 blocks)
| # | Block Type | Description |
|---|-----------|-------------|
| 1 | UpdateContactTextToSpeechVoice | Set voice to Matthew/Generative |
| 2 | MessageParticipant | Welcome greeting |
| 3 | CreateWisdomSession | Initialize Q in Connect session |
| 4 | MessageParticipant | Ready confirmation |
| 5 | ConnectParticipantWithLexBot | QIC multi-turn conversation loop (self-referencing) |
| 6 | MessageParticipant | Goodbye message (on EndConversationIntent) |
| 7 | MessageParticipant | Error message (technical difficulties) |
| 8 | DisconnectParticipant | End call |

## Deployment Date
2026-02-24
