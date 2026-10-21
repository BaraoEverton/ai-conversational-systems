'use strict';

/**
 * Business rules for scheduling. Everything that changes from one client to another lives here,
 * so the same engine serves different clinics by swapping this object.
 *
 * Weekdays follow JavaScript: 0 = Sunday … 6 = Saturday.
 */
const DEFAULT_CONFIG = {
  timezoneOffset: '-03:00', // America/Sao_Paulo (no daylight saving since 2019)
  timezone: 'America/Sao_Paulo',

  // Service that has its own rules (first meeting of the assessment program)
  firstMeetingService: 'primeiro encontro do mapeamento programa',

  // Where and when each kind of appointment happens
  generalLocation: 'unidade_centro',
  generalDays: [1, 2, 3, 4, 5],
  firstMeetingLocation: 'online',
  firstMeetingDays: [1, 2, 4],

  // Daily start window
  firstStart: '09:00',
  lastStartGeneral: '17:00',
  lastStartFirstMeeting: '16:00',

  // Minimum notice in minutes
  noticeByWeekday: {1: 120, 2: 120, 3: 1440, 4: 120, 5: 1440},
  noticeFirstMeeting: 180,

  // Date search limits
  maxSearchSteps: 30, // days looked before/after an invalid date
  autoSearchHorizonDays: 60, // days scanned when the patient gives no date
  autoSearchMaxDates: 15,

  appointmentMinutes: 60,
};

module.exports = {DEFAULT_CONFIG};
