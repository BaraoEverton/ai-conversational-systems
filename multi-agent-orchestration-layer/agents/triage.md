# 🧠 Vita Triage Agent

## 🔎 Overview

Vita Triage is the initial qualification and conversational structuring layer of the system.

Its responsibility is to:

- 🎯 Understand the user’s intent  
- 🏷 Classify the interaction  
- 🔄 Manage conversation state  
- 📦 Produce structured output for downstream automation  

It operates strictly as an orchestration component — it does not sell, schedule, quote prices, or provide medical guidance.

---

## 🎯 Responsibilities

### 1️⃣ Intent Identification

The agent analyzes the latest user message combined with recent conversational context to determine the primary objective of the contact.

Once the intent is clearly identified, it assigns exactly one classification tag (`lead_tag`).

Rules:

- 🧠 Only one tag per interaction  
- 🔍 Avoid redundant clarification if intent is already explicit  
- 🔄 Maintain consistency across the conversation  

---

### 2️⃣ Conversation State Management

The agent controls the interaction lifecycle using a controlled state model:

- `inicial` → objective unclear; requires clarification  
- `em_atendimento` → objective identified; conversation in progress  
- `coletando_nome` → full name required and not available  
- `encaminhado` → internal routing initiated  
- `encerrado` → user explicitly declined interest  
- `spam` → invalid or malicious interaction  

Operational constraints:

- 🚫 Never close the conversation prematurely  
- ❓ End each response with exactly one forward-moving question (unless finalizing)  
- 🔒 Maintain consistency once marked as `encaminhado`  

---

### 3️⃣ Controlled Communication

The tone follows a premium, calm, and human interaction model.

Constraints:

- 💰 No pricing disclosure  
- 🩺 No clinical or diagnostic advice  
- 📅 No scheduling actions  
- ❌ No multi-question responses  
- 🚫 No promotional language  

If pricing is requested, the agent informs that pricing details are handled in later stages of the process.

---

## 📥 Input Context

Before invocation, the system consolidates:

- 💬 Latest user message  
- 📚 Recently buffered messages (if applicable)  
- 🔄 Conversation continuity indicators  
- 👤 Profile metadata (if available)  
- 🧾 Recent message history (limited window)  
- 🛡 Interaction flags (e.g., spam, escalation indicators)  

The agent prioritizes the most recent message while using history only as contextual support.

---

## 📤 Output Contract

The agent returns a strict structured JSON response:

```json
{
  "summary_short": "string",
  "summary_long": "string",
  "lead_tag": "string",
  "stage": "string",
  "needs_human": "TRUE | FALSE",
  "reply_to_patient": "string"
}
