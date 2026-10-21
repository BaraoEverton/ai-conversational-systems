'use strict';

const {DEFAULT_CONFIG} = require('./config');
const {addDays, weekday, normalizeDate} = require('./dates');

/**
 * Turns the dates the patient asked for into dates the clinic can actually offer.
 * Mirrors the n8n Code node `verifica_feriado`.
 *
 * - Holidays and days without service at the location are never offered.
 * - An invalid date is replaced by the closest valid day before and after it, and the reason is reported
 *   so the reply can explain it ("that day is a holiday, I have Friday or Monday").
 * - With no date given, it scans ahead and returns the next valid days.
 *
 * @param {object} input
 * @param {string[]} [input.requestedDates] dates extracted by the interpreter (`YYYY-MM-DD`)
 * @param {string} input.location location chosen by the interpreter
 * @param {string} [input.service] service name
 * @param {string[]} [input.holidays] holiday dates from the holiday calendar
 * @param {string} input.today current date (`DD/MM/YYYY` or ISO)
 * @param {object} [config]
 */
function resolveDates({requestedDates = [], location, service = '', holidays = [], today}, config = DEFAULT_CONFIG) {
  const firstMeeting = String(service).trim().toLowerCase() === config.firstMeetingService;
  const allowedDays = firstMeeting ? config.firstMeetingDays : config.generalDays;
  const validLocation = firstMeeting ? location === config.firstMeetingLocation : location === config.generalLocation;

  if (!validLocation) {
    return {ok: false, motivo: 'local_nao_permitido', datas: []};
  }

  const holidaySet = new Set(holidays);
  const isValid = (d) => !holidaySet.has(d) && allowedDays.includes(weekday(d));

  const searchValid = (original, direction) => {
    let candidate = original;
    for (let step = 0; step < config.maxSearchSteps; step++) {
      candidate = addDays(candidate, direction);
      if (isValid(candidate)) return candidate;
    }
    return null;
  };

  const dates = Array.isArray(requestedDates) ? [...requestedDates] : [];
  const autoSearch = dates.length === 0;

  if (autoSearch) {
    const start = normalizeDate(today);
    for (let offset = 0; offset < config.autoSearchHorizonDays && dates.length < config.autoSearchMaxDates; offset++) {
      const candidate = offset === 0 ? start : addDays(start, offset);
      if (isValid(candidate)) dates.push(candidate);
    }
  }

  const finalDates = new Set();
  const changes = [];

  for (const date of dates) {
    if (isValid(date)) {
      finalDates.add(date);
      continue;
    }
    const before = searchValid(date, -1);
    const after = searchValid(date, 1);
    if (before) finalDates.add(before);
    if (after) finalDates.add(after);
    changes.push({
      data_original: date,
      local: location,
      motivo: holidaySet.has(date) ? 'feriado' : 'dia_sem_atendimento_no_local',
      data_valida_anterior: before,
      proxima_data_valida: after,
    });
  }

  return {ok: true, local: location, datas: [...finalDates].sort(), alteracoes_datas: changes, busca_automatica: autoSearch};
}

/** Holiday dates from Google Calendar events (all-day `start.date` or timed `start.dateTime`). */
function holidaysFromCalendar(events = []) {
  return events.map((e) => e?.start?.date || e?.start?.dateTime?.slice(0, 10)).filter(Boolean);
}

module.exports = {resolveDates, holidaysFromCalendar};
