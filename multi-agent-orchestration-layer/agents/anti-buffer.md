# 🧠 Anti-Buffer Agent

## 🔎 Overview

The **Anti-Buffer Agent** is an asynchronous conversation control layer designed to stabilize WhatsApp message flows before triggering downstream triage and orchestration agents.

Its job is to decide whether an incoming message should be:

- ⏳ Temporarily stored (`buffer_only`)
OR
- ⚡ Processed immediately (`process_now`)

It operates as a pre-orchestration gate to reduce noise, avoid premature execution, and preserve conversational consistency.

---

## 🎯 Purpose

This agent prevents:

- 🧩 Premature execution of incomplete messages  
- 🔁 Duplicate workflow triggers  
- 🧠 Context fragmentation  
- ⚠️ Incorrect processing due to insufficient information  

It ensures conversation stability before invoking downstream agents.

---

## 🧭 Pipeline Position

This agent runs before any business logic:

🔌 Webhook → 🧱 Context Consolidation (JavaScript) → 🧠 Anti-Buffer Agent → 🧬 Triage / Orchestration Agents

---

## 📥 Input

The agent receives a structured object containing:

- 💬 Current user message  
- 🕒 Message timestamp  
- 🔄 Interaction state (`new_interaction` or `ongoing_interaction`)  
- 👤 Patient profile metadata (name, tags, status, summaries)  
- 🧾 Up to 10 recent message turns  
- 🛡️ Spam flag  
- 🧑‍⚕️ Human-escalation flag  

It notes context but does not call external services. It is purely a decision layer.

---

## 🧠 Decision Logic

### ⚡ `process_now` when:

- ❓ The message contains a clear question  
- 🎯 Explicit intent or request  
- ✅ Confirmation or decision keywords ("yes", "ok", "I want", etc.)  
- 🪪 Registration data (full name, ID, address, etc.)  
- 🔗 Logical continuation of a previous question  

### ⏳ `buffer_only` when:

- 👋 Isolated greetings  
- 🧩 Fragmented or incomplete messages  
- 💤 Early conversation without actionable context  

### 🛡 Safety Rule

In case of ambiguity → default to `process_now`.

This prevents deadlocks and keeps the system moving.

---

## 📤 Output

Returns strictly a valid JSON object:

```json
{
  "action": "process_now | buffer_only",
  "confidence": 0.0,
  "reason": "short explanation",
  "merge_window_seconds": 0,
  "should_merge": false
}
