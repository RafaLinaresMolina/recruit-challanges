const constants = require('../../constants');
const moment = require('moment');

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
		return moment(hour).add(minutes, 'minutes').format(constants.MINUTES_FORMAT);
	}

	static canEventFitInTimeSlot(eventEndHour, timeSlotEnd) {
		const eventEndUtc = moment.utc(eventEndHour, constants.MINUTES_FORMAT);
		const timeSlotEndUtc = moment.utc(timeSlotEnd, constants.MINUTES_FORMAT);

		const eventEndTimestamp = eventEndUtc.valueOf();
		const timeSlotEndTimestamp = timeSlotEndUtc.valueOf();

		if (eventEndTimestamp > timeSlotEndTimestamp)
			return null;

		return true;
	}
}

module.exports = TimeCalculationService;