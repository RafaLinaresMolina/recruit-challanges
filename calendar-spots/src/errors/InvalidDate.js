class InvalidDate extends Error {
	constructor(message) {
		super(message);
		this.name = 'InvalidDate';
	}
}

module.exports = InvalidDate;