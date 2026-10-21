'use strict';

/**
 * Parity test: runs the ORIGINAL code of the n8n Code nodes (read from the exported workflow)
 * with mocked n8n helpers, and checks that the extracted module returns exactly the same output.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {resolveDates, holidaysFromCalendar} = require('../lib/resolveDates');
const {applySlotRules} = require('../lib/applySlotRules');

const workflow = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../workflows/01-receptionist-main.json'), 'utf8'));
const code = (name) => workflow.nodes.find((n) => n.name === name).parameters.jsCode;

// minimal n8n runtime: $('Node').first().json / .all(), and $input.first().json
function runNode(source, nodes, input) {
  const $ = (name) => ({first: () => ({json: nodes[name][0]}), all: () => nodes[name].map((json) => ({json}))});
  const $input = {first: () => ({json: input})};
  // eslint-disable-next-line no-new-func
  return new Function('$', '$input', source)($, $input)[0].json;
}

// deterministic pseudo-random scenarios
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const isoDay = (offset) => new Date(Date.UTC(2026, 9, 1 + offset, 12)).toISOString().slice(0, 10);
const br = (iso) => iso.split('-').reverse().join('/');

test('extracted module matches the n8n nodes in 300 random scenarios', () => {
  const services = ['', 'Consulta', 'Primeiro encontro do Mapeamento Programa'];
  const locations = ['unidade_centro', 'online', 'unidade_sul'];
  for (let k = 0; k < 300; k++) {
    const today = isoDay(Math.floor(rnd() * 40));
    const requested = rnd() < 0.3 ? [] : Array.from({length: 1 + Math.floor(rnd() * 3)}, () => isoDay(Math.floor(rnd() * 50)));
    const holidayEvents = Array.from({length: Math.floor(rnd() * 4)}, () => (rnd() < 0.5 ? {start: {date: isoDay(Math.floor(rnd() * 60))}} : {start: {dateTime: `${isoDay(Math.floor(rnd() * 60))}T00:00:00-03:00`}}));
    const service = pick(services);
    const location = pick(locations);
    const now = `${String(7 + Math.floor(rnd() * 12)).padStart(2, '0')}:${pick(['00', '15', '30', '45'])}`;
    const todayText = rnd() < 0.5 ? br(today) : today;

    const context = [{output: {consulta_agenda: {datas_especificas: requested, local: location, servico: service}}}];
    const payload = [{data: todayText, time: now}];

    // node 1: verifica_feriado
    const fromNode1 = runNode(code('verifica_feriado'), {Entende_Contexto: context, pegaFeriado: holidayEvents, payload_webhook: payload});
    const fromModule1 = resolveDates({requestedDates: requested, location, service, holidays: holidaysFromCalendar(holidayEvents), today: todayText});
    assert.deepEqual(fromModule1, fromNode1, `verifica_feriado differs in scenario ${k}`);
    if (!fromNode1.ok) continue;

    // node 2: aplica_regras_agenda, fed with random free intervals for each date
    const calendar = {data: fromNode1.datas.map((d) => ({
      periodo_consultado: {data_inicio: d},
      horarios_livres: Array.from({length: Math.floor(rnd() * 3)}, () => {
        const h = 7 + Math.floor(rnd() * 10);
        return {inicio: `${String(h).padStart(2, '0')}:00`, fim: `${String(h + 1 + Math.floor(rnd() * 4)).padStart(2, '0')}:00`};
      }),
    }))};
    const fromNode2 = runNode(code('aplica_regras_agenda'), {verifica_feriado: [fromNode1], payload_webhook: payload, Entende_Contexto: context}, calendar);
    const fromModule2 = applySlotRules({calendarResult: calendar, datesResult: fromNode1, requestedDates: requested, service, today: todayText, now});
    assert.deepEqual(fromModule2, fromNode2, `aplica_regras_agenda differs in scenario ${k}`);
  }
});
