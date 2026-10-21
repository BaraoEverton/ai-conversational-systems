'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {applySlotRules, UNAVAILABLE} = require('../lib/applySlotRules');

const FIRST = 'Primeiro encontro do Mapeamento Programa';
const day = (date, ...slots) => ({periodo_consultado: {data_inicio: date}, horarios_livres: slots.map(([inicio, fim]) => ({inicio, fim}))});
const dates = (extra = {}) => ({ok: true, local: 'unidade_centro', datas: [], alteracoes_datas: [], busca_automatica: false, ...extra});

test('a calendar error is propagated, never turned into availability', () => {
  const r = applySlotRules({calendarResult: {status_execucao: 'erro', error: 'timeout'}, datesResult: dates(), today: '2026-10-13'});
  assert.deepEqual(r, {status_execucao: 'erro', error: 'timeout'});
  const r2 = applySlotRules({calendarResult: {data: [{error: 'x'}]}, datesResult: dates(), today: '2026-10-13'});
  assert.equal(r2.status_execucao, 'erro');
});

test('minimum notice pushes the first slot (Monday: 2 hours)', () => {
  const r = applySlotRules({
    calendarResult: {data: [day('2026-10-19', ['09:00', '18:00'])]},
    datesResult: dates(), requestedDates: ['2026-10-19'], today: '2026-10-19', now: '10:00',
  });
  assert.deepEqual(r.data[0].horarios_livres, [{inicio: '12:00', fim: '18:00'}]);
});

test('Wednesday requires 24 hours of notice', () => {
  const r = applySlotRules({
    calendarResult: {data: [day('2026-10-21', ['09:00', '18:00'])]},
    datesResult: dates(), requestedDates: ['2026-10-21'], today: '2026-10-20', now: '15:00',
  });
  // 15:00 + 24h = next day 15:00
  assert.deepEqual(r.data[0].horarios_livres, [{inicio: '15:00', fim: '18:00'}]);
});

test('no slot starts after the last allowed start (17:00 general, 16:00 first meeting)', () => {
  const input = {calendarResult: {data: [day('2026-10-22', ['16:30', '18:00'])]}, requestedDates: ['2026-10-22'], today: '2026-10-13', now: '09:00'};
  assert.deepEqual(applySlotRules({...input, datesResult: dates()}).data[0].horarios_livres, [{inicio: '16:30', fim: '18:00'}]);
  assert.deepEqual(applySlotRules({...input, service: FIRST, datesResult: dates({local: 'online'})}).data[0].horarios_livres, [UNAVAILABLE]);
});

test('starts before opening are moved to 09:00', () => {
  const r = applySlotRules({calendarResult: {data: [day('2026-10-22', ['07:00', '10:00'])]}, datesResult: dates(), today: '2026-10-13'});
  assert.deepEqual(r.data[0].horarios_livres, [{inicio: '09:00', fim: '10:00'}]);
});

test('today is not offered as an alternative the patient did not ask for', () => {
  const r = applySlotRules({
    calendarResult: {data: [day('2026-10-19', ['13:00', '18:00']), day('2026-10-20', ['09:00', '12:00'])]},
    datesResult: dates(), requestedDates: ['2026-10-20'], today: '2026-10-19', now: '09:00',
  });
  assert.deepEqual(r.data.map((d) => d.periodo_consultado.data_inicio), ['2026-10-20']);
});

test('a previous alternative that is not in the future is dropped', () => {
  const r = applySlotRules({
    calendarResult: {data: []},
    datesResult: dates({alteracoes_datas: [{data_original: '2026-10-17', data_valida_anterior: '2026-10-16', proxima_data_valida: '2026-10-19'}]}),
    today: '2026-10-16',
  });
  assert.equal(r.alteracoes_datas[0].data_valida_anterior, null);
  assert.equal(r.alteracoes_datas[0].proxima_data_valida, '2026-10-19');
});

test('a weekday without notice rule is marked unavailable', () => {
  const r = applySlotRules({calendarResult: {data: [day('2026-10-17', ['09:00', '12:00'])]}, datesResult: dates(), requestedDates: ['2026-10-17'], today: '2026-10-13'});
  assert.deepEqual(r.data[0].horarios_livres, [UNAVAILABLE]);
});

test('invalid current time throws instead of guessing', () => {
  assert.throws(() => applySlotRules({calendarResult: {data: []}, datesResult: dates(), today: 'not-a-date'}));
});
