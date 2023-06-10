const { positiveBits } = require('./positive-bits')
const assert = require('assert')


describe('positiveBits', function () {
	it('For number 0 should show [0]', function () {
		let result = positiveBits(0)
		assert.ok(result)
		assert.equal(result.length, 1)
		assert.deepEqual(result, [0])
	})
})


describe('positiveBits', function () {
	it('For number 1 should show [1, 0]', function () {
		let result = positiveBits(1)
		assert.ok(result)
		assert.equal(result.length, 2)
		assert.deepEqual(result, [1, 0])
	})
})

describe('positiveBits', function () {
	it('For number 5 should show [2, 0, 2]', function () {
		let result = positiveBits(5)
		assert.ok(result)
		assert.equal(result.length, 3)
		assert.deepEqual(result, [2, 0, 2])
	})
})

describe('positiveBits', function () {
	it('For number 39 should show [ 4, 0, 3, 4, 5 ]', function () {
		let result = positiveBits(39)
		assert.ok(result)
		assert.equal(result.length, 5)
		assert.deepEqual(result, [4, 0, 3, 4, 5])
	})
})

describe('positiveBits', function () {
	it('should throw a NotAnIntegerError if input is not an integer', function () {
		expect(() => positiveBits('39')).toThrow("Input must be an integer");
	})
})
