const moment = require('moment')
const fs = require('fs');
const constants = require('./constants');


class CalendarNotFound extends Error {
	constructor(message) {
		super(message);
		this.name = 'CalendarNotFound';
	}
}

class InvalidDuration extends Error {
	constructor(message) {
		super(message);
		this.name = 'InvalidDuration';
	}
}

class InvalidDate extends Error {
	constructor(message) {
		super(message);
		this.name = 'InvalidDate';
	}
}

class TimeSlot {
	constructor(start, end) {
		this.start = start;
		this.end = end;
	}
}

class TimeSlots {
	constructor(slots) {
		this._slots = slots;
	}

	addSlot(date, start, end) {
		if (!this._slots[date]) {
			this._slots[date] = [];
		}
		this._slots[date].push(new TimeSlot(start, end));
	}

	isSlotAlreadyListed(date, start, end) {
		const slots = this._slots[date] || [];
		return slots.some(slot => slot.start === start && slot.end === end);
	}

	getTimeSlotByDate(date) {
		if (!moment(date, constants.DATE_FORMAT, true).isValid()) {
			throw new Error(constants.ERROR_MSG_INVALID_DATE_FORMAT);
		}
		return this._slots[date] || [];
	}

	get slots() {
		return this._slots;
	}

	set slots(slots) {
		this._slots = slots;
	}

}

class DaySlots extends TimeSlots { }

class Sessions extends TimeSlots { }

class TimeCalculationService {
	static getSlotTimes(date, slot) {
		const start = moment(`${date} ${slot.start}`).valueOf();
		const end = moment(`${date} ${slot.end}`).valueOf();
		return { start, end };
	}

	static getMomentHour(dateISO, hour) {
		return moment(dateISO + ' ' + hour);
	}

	static addMinutes(hour, minutes) {
		return moment(hour).add(minutes, 'minutes').format('HH:mm');
	}

	static canEventFitInTimeSlot(eventEndHour, timeSlotEnd) {
		const eventEndUtc = moment.utc(eventEndHour, 'HH:mm');
		const timeSlotEndUtc = moment.utc(timeSlotEnd, 'HH:mm');

		const eventEndTimestamp = eventEndUtc.valueOf();
		const timeSlotEndTimestamp = timeSlotEndUtc.valueOf();

		if (eventEndTimestamp > timeSlotEndTimestamp)
			return null;

		return true;
	}
}

class OverlapCheckService {
	static isOverlapping(sessionStart, sessionEnd, start, end) {
		return sessionStart > start && sessionEnd < end;
	}

	static isSessionAtStart(sessionStart, sessionEnd, start, end) {
		return sessionStart === start && sessionEnd < end;
	}

	static isSessionAtEnd(sessionStart, sessionEnd, start, end) {
		return sessionStart > start && sessionEnd === end;
	}

	static isSessionAtSameTime(sessionStart, sessionEnd, start, end) {
		return sessionStart === start && sessionEnd === end;
	}
}

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
