'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {resolveDates, holidaysFromCalendar} = require('../lib/resolveDates');

const FIRST = 'Primeiro encontro do Mapeamento Programa';

test('rejects a location where the service is not offered', () => {
  assert.deepEqual(resolveDates({requestedDates: ['2026-10-19'], location: 'online', today: '2026-10-13'}), {
    ok: false, motivo: 'local_nao_permitido', datas: [],
  });
  assert.equal(resolveDates({requestedDates: ['2026-10-19'], location: 'unidade_centro', service: FIRST, today: '2026-10-13'}).ok, false);
});

test('keeps a requested date that is valid', () => {
  const r = resolveDates({requestedDates: ['2026-10-19'], location: 'unidade_centro', today: '2026-10-13'});
  assert.deepEqual(r.datas, ['2026-10-19']);
  assert.deepEqual(r.alteracoes_datas, []);
  assert.equal(r.busca_automatica, false);
});

test('a Saturday becomes the closest Friday and Monday, with the reason', () => {
  const r = resolveDates({requestedDates: ['2026-10-17'], location: 'unidade_centro', today: '2026-10-13'});
  assert.deepEqual(r.datas, ['2026-10-16', '2026-10-19']);
  assert.deepEqual(r.alteracoes_datas, [{
    data_original: '2026-10-17', local: 'unidade_centro', motivo: 'dia_sem_atendimento_no_local',
    data_valida_anterior: '2026-10-16', proxima_data_valida: '2026-10-19',
  }]);
});

test('a holiday is never offered and is reported as such', () => {
  const r = resolveDates({requestedDates: ['2026-10-19'], location: 'unidade_centro', holidays: ['2026-10-19'], today: '2026-10-13'});
  assert.ok(!r.datas.includes('2026-10-19'));
  assert.equal(r.alteracoes_datas[0].motivo, 'feriado');
  assert.deepEqual(r.datas, ['2026-10-16', '2026-10-20']);
});

test('first meeting runs online only on Monday, Tuesday and Thursday', () => {
  const r = resolveDates({requestedDates: ['2026-10-21'], location: 'online', service: FIRST, today: '2026-10-13'});
  // Wednesday 21 → Tuesday 20 or Thursday 22
  assert.deepEqual(r.datas, ['2026-10-20', '2026-10-22']);
});

test('without dates, scans ahead and returns up to 15 valid days', () => {
  const r = resolveDates({location: 'unidade_centro', today: '13/10/2026', holidays: ['2026-10-15']});
  assert.equal(r.busca_automatica, true);
  assert.equal(r.datas.length, 15);
  assert.equal(r.datas[0], '2026-10-13');
  assert.ok(!r.datas.includes('2026-10-15'), 'holiday skipped');
  assert.ok(r.datas.every((d) => ![0, 6].includes(new Date(`${d}T12:00:00Z`).getUTCDay())), 'no weekends');
});

test('documents current behavior: general service also opens on Thursday', () => {
  // The original node comment says "Monday, Tuesday, Wednesday and Friday", but the code allows Thursday too.
  // This test pins the behavior in production until the business rule is confirmed.
  const r = resolveDates({requestedDates: ['2026-10-22'], location: 'unidade_centro', today: '2026-10-13'});
  assert.deepEqual(r.datas, ['2026-10-22']);
});

test('reads holidays from all-day and timed calendar events', () => {
  assert.deepEqual(holidaysFromCalendar([
    {start: {date: '2026-11-02'}},
    {start: {dateTime: '2026-11-15T00:00:00-03:00'}},
    {start: {}},
  ]), ['2026-11-02', '2026-11-15']);
});
