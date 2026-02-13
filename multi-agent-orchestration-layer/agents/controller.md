# 🧠 Conversational Orchestration Engine  
## Revitalize Onboarding – State Controller

---

## 🔎 Overview

The **State Controller** is a deterministic conversational state machine responsible for governing the Revitalize onboarding flow.

It does not generate user-facing messages.  
It does not execute external integrations.

Its only responsibilities are:

- 🧠 Interpret the latest user input  
- 📍 Evaluate the current flow state  
- 🔀 Decide the next logical step  
- 🗂 Update the system state  
- 🎯 Return exactly one action for the orchestrator  

---

## 🏗 Architectural Role

The State Controller acts as a **Finite State Machine (FSM)** inside a modular conversational architecture.

It ensures:

- ⛔ No step is skipped  
- 🔁 No message is repeated  
- 🧾 No stage advances without proper conditions  
- 📦 Data collection is validated before progression  
- 🔄 Interruptions do not break the flow  

---

## 📥 Input Model (Abstracted)

The controller operates based on four conceptual blocks:

### 1️⃣ Current Message

- 💬 Latest user message (priority input)

### 2️⃣ Recent History

- 📚 Passive conversational context to understand continuity

### 3️⃣ Flow State

Represents where the user is in the onboarding sequence.

Example conceptual stages:

- `initial`  
- `presented`  
- `feedback`  
- `pricing`  
- `closing`  
- `registration`  
- `verification`  
- `ready`  

### 4️⃣ Collected Data

Mandatory onboarding fields such as:

- 👤 Full name  
- 🪪 Identification document  
- 🎂 Birth date  
- 📧 Email  
- 🏠 Address  

Internal variables and storage structures are abstracted from this documentation.

---

## 🔄 Flow Definition

The onboarding process follows a deterministic sequence:

Authorization  
→ Presentation  
→ Feedback  
→ Pricing  
→ Closing  
→ Registration  
→ Verification  
→ Readiness  

Each transition depends strictly on previously satisfied conditions.

---

## 🎯 Action Model

The controller returns exactly one action per evaluation cycle.

### 📩 Automated Messaging

- Send presentation  
- Request feedback  
- Send pricing  
- Send closing message  

### 📝 Registration Handling

- Start registration  
- Collect missing field  
- Verify collected data  

### 🧠 Intelligent Interruption

- Temporarily answer a user question  
- Pause and safely resume flow  

### ⏸ No Action

- When no system movement is required  

---

## 🔀 Interruption Handling

If the user asks a question that temporarily diverges from the onboarding sequence:

- ⏸ The controller pauses progression  
- 🧾 Generates a structured summary for the response agent  
- 🔒 Maintains state integrity  
- ▶ Resumes from the exact prior stage  

This ensures resilience and non-linear conversational handling while preserving deterministic progression.

---

## 🧩 Separation of Responsibilities

| Layer | Responsibility |
|-------|----------------|
| 🛡 Buffer Layer | Decide when to process messages |
| 🏷 Intent Agent | Classify user intention |
| 🧠 State Controller | Govern onboarding progression |
| 💬 Response Agent | Generate user-facing messages |
| 🎛 Orchestrator | Execute system actions |
| 🗄 Persistence Layer | Store state and history |

---

## 🏛 Conceptual Architecture

User Input  
→ Context Builder  
→ Buffer Control  
→ State Controller (FSM)  
→ Orchestrator Switch  
→ Message Agent / Automation  
→ Persistence Layer  

---

## ✅ Design Principles

- 🧾 Deterministic state transitions  
- 🎯 Single action output per cycle  
- 🔐 Strict stage validation  
- 📦 Controlled data collection  
- 🧩 Modular separation of concerns  
- 🔌 Execution decoupled from decision logic  

---

## 📌 Summary

The State Controller is the governance layer of the conversational onboarding system.

It transforms a free-form conversational interface into a structured, validated, state-driven progression engine.

This enables:

- 📈 Scalable onboarding  
- 🔮 Predictable automation  
- 🤝 Controlled human intervention  
- 🧠 Modular AI-driven workflows  
