class CalendarNotFound extends Error {
	constructor(message) {
		super(message);
		this.name = 'CalendarNotFound';
	}
}

module.exports = CalendarNotFound;