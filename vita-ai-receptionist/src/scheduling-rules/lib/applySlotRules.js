'use strict';

const {DEFAULT_CONFIG} = require('./config');
const {weekday, normalizeDate, dateTime, formatTime} = require('./dates');

const UNAVAILABLE = 'intervalo_indisponivel';

/**
 * Applies the clinic rules to the free intervals returned by the calendar subflow.
 * Mirrors the n8n Code node `aplica_regras_agenda`.
 *
 * - A calendar error is propagated as `status_execucao: 'erro'` so the reply never invents availability.
 * - Today is only offered if the patient asked for it (or on an automatic search).
 * - Each interval start is pushed to the latest of: its own start, the daily first start, now + minimum notice.
 * - Intervals that end up empty, or that would start after the last allowed start, are dropped.
 *
 * @param {object} input
 * @param {object} input.calendarResult output of the calendar subflow (`{data: [{periodo_consultado, horarios_livres}]}`)
 * @param {object} input.datesResult output of `resolveDates`
 * @param {string[]} [input.requestedDates] dates the patient asked for
 * @param {string} [input.service]
 * @param {string} input.today current date (`DD/MM/YYYY` or ISO)
 * @param {string} [input.now] current time `HH:MM`
 * @param {object} [config]
 */
function applySlotRules({calendarResult, datesResult, requestedDates = [], service = '', today, now = '00:00'}, config = DEFAULT_CONFIG) {
  const todayIso = normalizeDate(today);
  const nowDate = dateTime(todayIso, String(now).slice(0, 5), config.timezoneOffset);
  if (Number.isNaN(nowDate.getTime())) {
    throw new Error(`Invalid current date or time: ${todayIso} ${now}`);
  }

  const firstMeeting = String(service).trim().toLowerCase() === config.firstMeetingService;
  const autoSearch = datesResult?.busca_automatica === true;
  const results = Array.isArray(calendarResult?.data) ? calendarResult.data : [];

  const calendarError = calendarResult?.status_execucao === 'erro'
    ? calendarResult
    : results.find((item) => item?.status_execucao === 'erro' || item?.error);
  if (calendarError) {
    return {status_execucao: 'erro', error: calendarError.error || 'Não foi possível consultar a agenda.'};
  }

  const firstStart = config.firstStart;
  const lastStart = firstMeeting ? config.lastStartFirstMeeting : config.lastStartGeneral;
  const window = {inicio: firstStart, fim: lastStart};

  const days = results
    .filter((item) => {
      const date = item.periodo_consultado?.data_inicio;
      if (!date) return false;
      return !(date === todayIso && !requestedDates.includes(date) && !autoSearch);
    })
    .map((item) => {
      const date = item.periodo_consultado.data_inicio;
      const notice = firstMeeting ? config.noticeFirstMeeting : config.noticeByWeekday[weekday(date)];
      const intervals = Array.isArray(item.horarios_livres)
        ? item.horarios_livres.filter((i) => i && typeof i === 'object' && i.inicio && i.fim)
        : [];

      if (notice === undefined) {
        return {...item, janela_inicio_permitido: window, horarios_livres: [UNAVAILABLE]};
      }

      const noticeLimit = new Date(nowDate.getTime() + notice * 60000);
      const dayStart = dateTime(date, firstStart, config.timezoneOffset);
      const dayLastStart = dateTime(date, lastStart, config.timezoneOffset);

      const free = intervals
        .map((interval) => {
          const start = dateTime(date, interval.inicio, config.timezoneOffset);
          const end = dateTime(date, interval.fim, config.timezoneOffset);
          if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
          const adjusted = new Date(Math.max(start.getTime(), dayStart.getTime(), noticeLimit.getTime()));
          if (adjusted >= end || adjusted > dayLastStart) return null;
          return {inicio: formatTime(adjusted, config.timezone), fim: interval.fim};
        })
        .filter(Boolean);

      return {...item, janela_inicio_permitido: window, horarios_livres: free.length > 0 ? free : [UNAVAILABLE]};
    });

  // a "previous valid date" that is today or in the past is not an alternative
  const changes = (datesResult?.alteracoes_datas || []).map((c) => ({
    ...c,
    data_valida_anterior: c.data_valida_anterior && c.data_valida_anterior > todayIso ? c.data_valida_anterior : null,
  }));

  return {
    status_execucao: 'sucesso',
    local: datesResult?.local || null,
    duracao_minutos: config.appointmentMinutes,
    tempo_pos_atendimento: 0,
    data: days,
    alteracoes_datas: changes,
  };
}

module.exports = {applySlotRules, UNAVAILABLE};
