'use strict';

const {DEFAULT_CONFIG} = require('./lib/config');
const {resolveDates, holidaysFromCalendar} = require('./lib/resolveDates');
const {applySlotRules, UNAVAILABLE} = require('./lib/applySlotRules');

module.exports = {DEFAULT_CONFIG, resolveDates, holidaysFromCalendar, applySlotRules, UNAVAILABLE};
