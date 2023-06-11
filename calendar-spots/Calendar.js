const moment = require('moment')
const fs = require('fs');


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
		if (!moment(date, 'DD-MM-YYYY', true).isValid()) {
			throw new Error('Invalid date format. Expected format: DD-MM-YYYY');
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

class Slots extends TimeSlots { }

class Sessions extends TimeSlots { }

class Calendar {
	constructor(durationBefore, durationAfter, slots, sessions) {
		this.durationBefore = durationBefore;
		this.durationAfter = durationAfter;
		this.slots = new Slots(slots);
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

	getSlotTimes(date, slot) {
		const start = moment(date + ' ' + slot.start).valueOf();
		const end = moment(date + ' ' + slot.end).valueOf();
		return { start, end };
	}


	isSameSlot(sessionStart, sessionEnd, start, end) {
		return sessionStart === start && sessionEnd === end;
	}

	isFullyContained(sessionStart, sessionEnd, start, end) {
		return sessionStart <= start && sessionEnd >= end;
	}

	isStartContained(sessionStart, sessionEnd, start, end) {
		return sessionStart <= start && sessionEnd < end;
	}

	isEndContained(sessionStart, sessionEnd, start, end) {
		return sessionStart > start && sessionEnd >= end;
	}

	getRealSpots(daySlot, sessionSlot, dateISO) {
		const { start: sessionStart, end: sessionEnd } = this.getSlotTimes(dateISO, sessionSlot);
		const { start, end } = this.getSlotTimes(dateISO, daySlot);
		if (this.isSameSlot(sessionStart, sessionEnd, start, end)) {
			return [];
		}
		if (this.isFullyContained(sessionStart, sessionEnd, start, end)) {
			return [
				{ start: daySlot.start, end: sessionSlot.start },
				{ start: sessionSlot.end, end: daySlot.end },
			];
		}
		if (this.isStartContained(sessionStart, sessionEnd, start, end)) {
			return [{ start: daySlot.start, end: sessionSlot.start }];
		}
		if (this.isEndContained(sessionStart, sessionEnd, start, end)) {
			return [{ start: sessionSlot.end, end: daySlot.end }];
		}
		return [daySlot];
	}

	getDaySessions(date) {
		return this.sessions.getTimeSlotByDate(date);
	}

	getAvailableSpots(date, duration) {
		const dateISO = moment(date, 'DD-MM-YYYY').format('YYYY-MM-DD')
		let durationBefore = this.durationBefore;
		let durationAfter = this.durationAfter;
		let daySlots = this.slots.getTimeSlotByDate(date)
		let daySessions = this.sessions.getTimeSlotByDate(date)

		const freeSpots = []

		daySlots.forEach(daySlot => {
			if (!daySessions)
				freeSpots.push(daySlot)

			let noConflicts = true
			daySessions.forEach(sessionSlot => {

				let { start: sessionStart, end: sessionEnd } = this.getSlotTimes(dateISO, sessionSlot);
				let { start, end } = this.getSlotTimes(dateISO, daySlot);


				if (sessionStart > start && sessionEnd < end) {
					freeSpots.push({ start: daySlot.start, end: sessionSlot.start })
					freeSpots.push({ start: sessionSlot.end, end: daySlot.end })
					noConflicts = false
				} else if (sessionStart === start && sessionEnd < end) {
					freeSpots.push({ start: sessionSlot.end, end: daySlot.end })
					noConflicts = false
				} else if (sessionStart > start && sessionEnd === end) {
					freeSpots.push({ start: daySlot.start, end: sessionSlot.start })
					noConflicts = false
				} else if (sessionStart === start && sessionEnd === end) {
					noConflicts = false
				}
			})
			if (noConflicts) {
				freeSpots.push(daySlot)
			}

		})

		console.log('freeSpots', freeSpots)

		let arrSlot = [];
		freeSpots.forEach(function (slot) {
			let init = 0;
			let startHour;
			let endHour;
			let clientStartHour;
			let clientEndHour;

			function getMomentHour(hour) {
				let finalHourForAdd = moment(dateISO + ' ' + hour);
				return finalHourForAdd;
			}
			function addMinutes(hour, minutes) {
				let result = moment(hour).add(minutes, 'minutes').format('HH:mm');
				return result;
			}
			function removeMinutes(hour, minutes) {
				let result = moment(hour).subtract(minutes, 'minutes').format('HH:mm');
				return result;
			}
			function getOneMiniSlot(startSlot, endSlot) {
				let startHourFirst = getMomentHour(startSlot);
				startHour = startHourFirst.format('HH:mm');;
				endHour = addMinutes(startHourFirst, durationBefore + duration + durationAfter);
				clientStartHour = addMinutes(startHourFirst, durationBefore);
				clientEndHour = addMinutes(startHourFirst, duration);

				if (moment.utc(endHour, 'HH:mm').valueOf() > moment.utc(endSlot, 'HH:mm').valueOf()) {
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
				init += 1;
				return objSlot;
			}

			let start = slot.start;
			let resultSlot;
			do {
				resultSlot = getOneMiniSlot(start, slot.end);
				if (resultSlot) {
					arrSlot.push(resultSlot);
					start = moment.utc(resultSlot.endHour).format('HH:mm')
				}
			} while (resultSlot);

			return arrSlot;
		});
		return arrSlot;
	}
}

module.exports = Calendar
