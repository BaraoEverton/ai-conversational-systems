# 🧪 Agent Lab — configurable assistant base
#### Multi-client version of the Vita architecture

**Status:** 🟠 In development (inactive)

Independent copy of [Vita](../vita-ai-receptionist) used to turn the receptionist into a reusable product. All business-specific data is concentrated in a single configuration block (`CONFIG_LAB`): identity, catalog, materials, human handoff destination and scheduling rules. A new client means a new configuration, not a new workflow.

## What is already there

- Same pipeline as Vita: event filter, message buffer, multimodal intake (audio, image, PDF), interpreter with JSON Schema, router and specialist agents
- Scheduling subflow with two calendars (main and auxiliary), merge and slot normalization
- Holiday check and Google Calendar create / update

## What is in progress

- Moving every remaining client-specific text into `CONFIG_LAB`
- Generic knowledge-base template
- Test suite with a fictitious number before enabling for a new client

## Contents

| File | What it is |
|---|---|
| `workflows/assistant-base.json` | Assistant (103 nodes) |
| `workflows/scheduling.json` | Scheduling subflow (13 nodes) |

> Sanitized export: credentials, IDs and personal data replaced with placeholders.
