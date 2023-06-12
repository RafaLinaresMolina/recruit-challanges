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

module.exports = OverlapCheckService;