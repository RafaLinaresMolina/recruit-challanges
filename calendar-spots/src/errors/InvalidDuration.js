class InvalidDuration extends Error {
	constructor(message) {
		super(message);
		this.name = 'InvalidDuration';
	}
}

module.exports = InvalidDuration;