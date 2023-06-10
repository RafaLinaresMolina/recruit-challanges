class NotAnIntegerError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotAnIntegerError';
    }
}

function positiveBits(n) {
    if (!Number.isInteger(n)) {
        throw new NotAnIntegerError('Input must be an integer');
    }
    const binary = n.toString(2);
    const result = binary.split('').flatMap((bit, i) => bit === '1' ? i : []);
    result.unshift(result.length);
    return result;
}

module.exports = { positiveBits }