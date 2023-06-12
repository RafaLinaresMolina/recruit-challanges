const moment = require('moment')
const fs = require('fs');
const constants = require('./constants');
const TimeCalculationService = require('./src/services/TimeCalculationService');
const OverlapCheckService = require('./src/services/OverlapCheckService');
const { DaySlots, Sessions } = require('./src/interfaces/TimeSlots');
const InvalidDate = require('./src/errors/InvalidDate');
const InvalidDuration = require('./src/errors/InvalidDuration');
const CalendarNotFound = require('./src/errors/CalendarNotFound');

class Calendar {

	constructor(durationBefore, durationAfter, slots, sessions) {
		this.durationBefore = durationBefore;
		this.durationAfter = durationAfter;
		this.slots = new DaySlots(slots);
		this.sessions = new Sessions(sessions);
	}

	static fromFile(calendarId) {
		try {
			const calendar = JSON.parse(fs.readFileSync(constants.CALENDAR_PATH + calendarId + constants.CALENDAR_FILE_EXTENSION));
			return new Calendar(calendar.durationBefore, calendar.durationAfter, calendar.slots, calendar.sessions);
		} catch (e) {
			console.log(e)
			throw new CalendarNotFound(e.message);
		}
	}

	getDaySessions(date) {
		return this.sessions.getTimeSlotByDate(date);
	}

	getAvailableTimeSlots(daySlot, sessionSlot, dateISO) {
		const { start: sessionStart, end: sessionEnd } = TimeCalculationService.getSlotTimes(dateISO, sessionSlot);
		const { start, end } = TimeCalculationService.getSlotTimes(dateISO, daySlot);
		if (OverlapCheckService.isSessionAtSameTime(sessionStart, sessionEnd, start, end)) {
			return [];
		}
		if (OverlapCheckService.isOverlapping(sessionStart, sessionEnd, start, end)) {
			return [
				{ start: daySlot.start, end: sessionSlot.start },
				{ start: sessionSlot.end, end: daySlot.end },
			];
		}
		if (OverlapCheckService.isSessionAtStart(sessionStart, sessionEnd, start, end)) {
			return [{ start: daySlot.start, end: sessionSlot.start }];
		}
		if (OverlapCheckService.isSessionAtEnd(sessionStart, sessionEnd, start, end)) {
			return [{ start: sessionSlot.end, end: daySlot.end }];
		}

		return [daySlot];
	}

	getFreeSlotsByDate(dateISO, daySessions, daySlots) {
		const freeSlots = [];

		if (!daySessions) {
			return daySlots;
		}

		daySlots.forEach(daySlot => {
			let availableSlots = this.getAvailableTimeSlots(daySlot, daySessions[0], dateISO);
			for (let i = 1; i < daySessions.length; i++) {
				const sessionSlot = daySessions[i];
				availableSlots = this.removeConflictingTimeSlots(availableSlots, sessionSlot, dateISO);
			}
			freeSlots.push(...availableSlots);
		});

		return freeSlots;
	}

	removeConflictingTimeSlots(availableSlots, sessionSlot, dateISO) {
		const filteredSpots = availableSlots.filter(availableSlot => {
			const realSpots = this.getAvailableTimeSlots(availableSlot, sessionSlot, dateISO);
			return realSpots.length !== 0;
		});
		return filteredSpots;
	}

	static getOneMiniSlot(startSlot, endSlot, dateISO, durationBefore, duration, durationAfter) {
		const fullDuration = durationBefore + duration + durationAfter;
		const startHourFirst = TimeCalculationService.getMomentHour(dateISO, startSlot);
		const startHour = startHourFirst.format(constants.MINUTES_FORMAT);
		const endHour = TimeCalculationService.addMinutes(startHourFirst, fullDuration);
		const clientStartHour = TimeCalculationService.addMinutes(startHourFirst, durationBefore);
		const clientEndHour = TimeCalculationService.addMinutes(startHourFirst, duration);

		if (!TimeCalculationService.canEventFitInTimeSlot(endHour, endSlot)) {
			return null;
		}
		const objSlot = {
			startHour: moment.utc(dateISO + ' ' + startHour)
				.toDate(),
			endHour: moment.utc(dateISO + ' ' + endHour)
				.toDate(),
			clientStartHour: moment.utc(dateISO + ' ' + clientStartHour)
				.toDate(),
			clientEndHour: moment.utc(dateISO + ' ' + clientEndHour)
				.toDate(),
		};
		return objSlot;
	}

	static checkDate(date) {
		if (!date || !moment(date, constants.DATE_FORMAT).isValid()) {
			throw new InvalidDate('Invalid date format');
		}

	}

	static checkDuration(duration) {
		if (!duration || typeof duration !== 'number' || duration < 0) {
			throw new InvalidDuration('Invalid duration');
		}
	}


	getAvailableSlots(date, duration) {
		try {
			Calendar.checkDate(date);
			Calendar.checkDuration(duration);

			const dateISO = moment(date, constants.DATE_FORMAT).format(constants.DATE_ISO_FORMAT)
			const durationBefore = this.durationBefore;
			const durationAfter = this.durationAfter;
			const daySlots = this.slots.getTimeSlotByDate(date);
			const daySessions = this.sessions.getTimeSlotByDate(date);

			const freeSpots = this.getFreeSlotsByDate(dateISO, daySessions, daySlots);

			const availableSlots = [];
			freeSpots.forEach(slot => {
				let start = slot.start;
				let resultSlot;
				do {
					resultSlot = Calendar.getOneMiniSlot(start, slot.end, dateISO, durationBefore, duration, durationAfter);
					if (resultSlot) {
						availableSlots.push(resultSlot);
						start = moment.utc(resultSlot.endHour).format(constants.MINUTES_FORMAT)
					}
				} while (resultSlot);
			});

			return availableSlots;
		} catch (err) {
			throw err;
		}
	}

}

module.exports = Calendar
