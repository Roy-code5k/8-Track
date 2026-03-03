/**
 * Attendance Prediction Engine
 */

const REQUIRED_PERCENTAGE = 0.75;

/**
 * How many classes can the student safely miss?
 * Solves: A / (T + x) >= 0.75  →  x <= (A - 0.75T) / 0.75
 */
function safeToMiss(attended, total) {
    if (total === 0) return 0;
    const result = Math.floor((attended - REQUIRED_PERCENTAGE * total) / REQUIRED_PERCENTAGE);
    return Math.max(0, result);
}

/**
 * How many consecutive classes must the student attend to recover to 75%?
 * Solves: (A + x) / (T + x) >= 0.75  →  x >= (0.75T - A) / 0.25
 */
function recoveryNeeded(attended, total) {
    const current = total === 0 ? 0 : attended / total;
    if (current >= REQUIRED_PERCENTAGE) return 0;
    const result = Math.ceil(
        (REQUIRED_PERCENTAGE * total - attended) / (1 - REQUIRED_PERCENTAGE)
    );
    return Math.max(0, result);
}

function calcPercentage(attended, total) {
    if (total === 0) return 0;
    return parseFloat(((attended / total) * 100).toFixed(2));
}

function calcStatus(percentage) {
    if (percentage >= 75) return 'safe';
    if (percentage >= 70) return 'warning';
    return 'danger';
}

module.exports = { safeToMiss, recoveryNeeded, calcPercentage, calcStatus };
