const moment = require('moment');
const constants = require('../../constants');

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

module.exports = { DaySlots, Sessions };