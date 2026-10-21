'use strict';

/** Date helpers on plain `YYYY-MM-DD` strings. Noon UTC avoids timezone edge cases. */

function addDays(dateText, amount) {
  const date = new Date(`${dateText}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function weekday(dateText) {
  return new Date(`${dateText}T12:00:00Z`).getUTCDay();
}

/** Accepts `DD/MM/YYYY` (as WhatsApp payloads arrive) or ISO, returns `YYYY-MM-DD`. */
function normalizeDate(text) {
  const value = String(text || '');
  return value.includes('/') ? value.split('/').reverse().join('-') : value.slice(0, 10);
}

function dateTime(dateText, hhmm, offset) {
  return new Date(`${dateText}T${hhmm}:00${offset}`);
}

function formatTime(date, timezone) {
  return date.toLocaleTimeString('pt-BR', {timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false});
}

module.exports = {addDays, weekday, normalizeDate, dateTime, formatTime};
