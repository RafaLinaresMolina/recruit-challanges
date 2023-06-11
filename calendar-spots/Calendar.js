const moment = require('moment')
const fs = require('fs');
const constants = require('./constants');


class CalendarNotFound extends Error {
	constructor(message) {
		super(message);
		this.name = 'CalendarNotFound';
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


class CalendarService {

	static getSlotTimes(date, slot) {
		const start = moment(`${date} ${slot.start}`).valueOf();
		const end = moment(`${date} ${slot.end}`).valueOf();
		return { start, end };
	}

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

	static getMomentHour(dateISO, hour) {
		return moment(dateISO + ' ' + hour);
	}
	static addMinutes(hour, minutes) {
		return moment(hour).add(minutes, constants.MINUTES).format(constants.MINUTES_FORMAT);
	}

	static canEventFitInTimeSlot(eventEndHour, timeSlotEnd) {
		const eventEndUtc = moment.utc(eventEndHour, constants.MINUTES_FORMAT);
		const timeSlotEndUtc = moment.utc(timeSlotEnd, constants.MINUTES_FORMAT);

		const eventEndTimestamp = eventEndUtc.valueOf();
		const timeSlotEndTimestamp = timeSlotEndUtc.valueOf();

		if (eventEndTimestamp > timeSlotEndTimestamp) {
			return null;
		} else {
			return true;
		}
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
			const calendar = JSON.parse(fs.readFileSync('./calendars/calendar.' + calendarId + '.json'));
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
		const { start: sessionStart, end: sessionEnd } = CalendarService.getSlotTimes(dateISO, sessionSlot);
		const { start, end } = CalendarService.getSlotTimes(dateISO, daySlot);
		if (CalendarService.isSessionAtSameTime(sessionStart, sessionEnd, start, end)) {
			return [];
		}
		if (CalendarService.isOverlapping(sessionStart, sessionEnd, start, end)) {
			return [
				{ start: daySlot.start, end: sessionSlot.start },
				{ start: sessionSlot.end, end: daySlot.end },
			];
		}
		if (CalendarService.isSessionAtStart(sessionStart, sessionEnd, start, end)) {
			return [{ start: daySlot.start, end: sessionSlot.start }];
		}
		if (CalendarService.isSessionAtEnd(sessionStart, sessionEnd, start, end)) {
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
		const startHourFirst = CalendarService.getMomentHour(dateISO, startSlot);
		const startHour = startHourFirst.format(constants.MINUTES_FORMAT);
		const endHour = CalendarService.addMinutes(startHourFirst, fullDuration);
		const clientStartHour = CalendarService.addMinutes(startHourFirst, durationBefore);
		const clientEndHour = CalendarService.addMinutes(startHourFirst, duration);

		if (!CalendarService.canEventFitInTimeSlot(endHour, endSlot)) {
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

	getAvailableSlots(date, duration) {
		const dateISO = moment(date, constants.DATE_FORMAT).format(constants.DATE_ISO_FORMAT)
		const durationBefore = this.durationBefore;
		const durationAfter = this.durationAfter;
		const daySlots = this.slots.getTimeSlotByDate(date)
		const daySessions = this.sessions.getTimeSlotByDate(date)

		const freeSlots = this.getFreeSlotsByDate(dateISO, daySessions, daySlots)

		let arrSlot = [];
		freeSlots.forEach(function (slot) {
			let start = slot.start;
			let resultSlot;
			do {
				resultSlot = Calendar.getOneMiniSlot(start, slot.end, dateISO, durationBefore, duration, durationAfter);
				if (resultSlot) {
					arrSlot.push(resultSlot);
					start = moment.utc(resultSlot.endHour).format(constants.MINUTES_FORMAT)
				}
			} while (resultSlot);

			return arrSlot;
		});
		return arrSlot;
	}
}

module.exports = Calendar
