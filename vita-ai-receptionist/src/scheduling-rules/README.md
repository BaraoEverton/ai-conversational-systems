# 🗓 Scheduling rules — deterministic engine

The rules behind Vita's scheduling, extracted from the n8n Code nodes `verifica_feriado` and `aplica_regras_agenda` into a plain, tested Node.js module.

**Design principle:** the LLM only *interprets* the request (date, period, service). Whether a slot exists is decided here, in code, so the assistant can never offer a time the clinic does not have.

## What it does

| Function | Rule |
|---|---|
| `resolveDates` | Drops holidays and days without service at the location; replaces each invalid date by the closest valid day before and after, with the reason (`feriado`, `dia_sem_atendimento_no_local`); with no date given, returns the next 15 valid days |
| `applySlotRules` | Propagates calendar errors; hides today unless requested; pushes each start to the latest of opening time, interval start and *now + minimum notice*; drops slots after the last allowed start |
| `DEFAULT_CONFIG` | Every client-specific rule in one object: days per location, notice per weekday, start window, special rules for the first meeting |

## Tests

```bash
npm test
```

- **Unit tests** for each rule (notice per weekday, holidays, weekends, last start, today handling, error propagation)
- **Parity test**: executes the *original* n8n node code, read from [`workflows/01-receptionist-main.json`](../../workflows/01-receptionist-main.json) with a mocked n8n runtime, and checks that this module returns exactly the same output in 300 random scenarios
- Runs on every push in [GitHub Actions](../../../.github/workflows/ci.yml), Node 20 and 22, no dependencies

## Known rule to confirm

The original node comment says general appointments run "Monday, Tuesday, Wednesday and Friday", but the code also allows **Thursday** (`[1, 2, 3, 4, 5]`). The module keeps the production behavior, and a test pins it until the business rule is confirmed.

## Usage

```js
const {resolveDates, applySlotRules, holidaysFromCalendar} = require('./index');

const dates = resolveDates({
  requestedDates: ['2026-10-17'],          // from the interpreter agent
  location: 'unidade_centro',
  holidays: holidaysFromCalendar(events),  // Google Calendar holiday events
  today: '13/10/2026',
});
// → { ok: true, datas: ['2026-10-16', '2026-10-19'], alteracoes_datas: [{ motivo: 'dia_sem_atendimento_no_local', ... }] }

const slots = applySlotRules({calendarResult, datesResult: dates, requestedDates: ['2026-10-17'], today: '13/10/2026', now: '10:00'});
```
