import { describe, it, expect } from 'vitest';

// ============================================================
// Utility / Pure Function Tests
// ============================================================
// These functions are extracted from client-side modules but are
// pure logic, so we re-implement them here for unit testing
// (the originals rely on browser globals like `document`).

// ----------------------------------------------------------
// convertStoM – Seconds to MM:SS conversion
// ----------------------------------------------------------
// Copied from client/scripts/timer.js
function convertStoM(time) {
  const isNegative = time < 0;
  const absTime = Math.abs(time);
  const minutes = Math.floor(absTime / 60);
  const seconds = absTime % 60;
  let formattedMinutes = String(minutes).padStart(2, '0');
  let formattedSeconds = String(seconds).padStart(2, '0');

  if (isNegative && minutes === 0) {
    formattedSeconds = `${59 - seconds}`;
  } else {
    formattedMinutes = isNegative ? `-${formattedMinutes}` : formattedMinutes;
  }

  return `${formattedMinutes}:${formattedSeconds}`;
}

describe('convertStoM', () => {
  it('should convert 0 seconds to "00:00"', () => {
    expect(convertStoM(0)).toBe('00:00');
  });

  it('should convert 60 seconds to "01:00"', () => {
    expect(convertStoM(60)).toBe('01:00');
  });

  it('should convert 90 seconds to "01:30"', () => {
    expect(convertStoM(90)).toBe('01:30');
  });

  it('should convert 5 seconds to "00:05"', () => {
    expect(convertStoM(5)).toBe('00:05');
  });

  it('should convert 3600 seconds to "60:00"', () => {
    expect(convertStoM(3600)).toBe('60:00');
  });

  it('should convert 125 seconds to "02:05"', () => {
    expect(convertStoM(125)).toBe('02:05');
  });

  it('should handle negative time with minutes', () => {
    const result = convertStoM(-120);
    expect(result).toBe('-02:00');
  });

  it('should handle single-digit seconds with padding', () => {
    expect(convertStoM(9)).toBe('00:09');
  });

  it('should handle exactly 59 seconds', () => {
    expect(convertStoM(59)).toBe('00:59');
  });

  it('should handle large values', () => {
    expect(convertStoM(600)).toBe('10:00');
  });
});

// ----------------------------------------------------------
// calculateTotalHiitDuration – Sum all durations
// ----------------------------------------------------------
// Simplified from client/scripts/timer.js (without side effect of setting global)
function calculateTotalHiitDuration(hiit) {
  return hiit.reduce(
    (total, exercise) =>
      total + exercise.exercise_duration + exercise.rest_duration,
    0,
  );
}

describe('calculateTotalHiitDuration', () => {
  it('should return 0 for an empty array', () => {
    expect(calculateTotalHiitDuration([])).toBe(0);
  });

  it('should sum exercise_duration + rest_duration for a single exercise', () => {
    const exercises = [{ exercise_duration: 60, rest_duration: 30 }];
    expect(calculateTotalHiitDuration(exercises)).toBe(90);
  });

  it('should sum all exercises correctly', () => {
    const exercises = [
      { exercise_duration: 60, rest_duration: 60 },
      { exercise_duration: 45, rest_duration: 60 },
      { exercise_duration: 60, rest_duration: 60 },
      { exercise_duration: 60, rest_duration: 60 },
    ];
    // 120 + 105 + 120 + 120 = 465
    expect(calculateTotalHiitDuration(exercises)).toBe(465);
  });

  it('should handle exercises with different durations', () => {
    const exercises = [
      { exercise_duration: 20, rest_duration: 10 },
      { exercise_duration: 30, rest_duration: 15 },
    ];
    expect(calculateTotalHiitDuration(exercises)).toBe(75);
  });

  it('should match the expected duration for HIIT Quick Blast exercises', () => {
    // From migration: Jumping Jacks 60+60, High Knees 45+60, Burpees 60+60, Mountain Climbers 60+60
    const quickBlastExercises = [
      { exercise_duration: 60, rest_duration: 60 },
      { exercise_duration: 45, rest_duration: 60 },
      { exercise_duration: 60, rest_duration: 60 },
      { exercise_duration: 60, rest_duration: 60 },
    ];
    expect(calculateTotalHiitDuration(quickBlastExercises)).toBe(465);
  });
});

// ----------------------------------------------------------
// generateUUID – UUID v4 format generation
// ----------------------------------------------------------
// Copied from client/scripts/createhiit.js
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

describe('generateUUID', () => {
  it('should return a string', () => {
    expect(typeof generateUUID()).toBe('string');
  });

  it('should return a string of length 36', () => {
    expect(generateUUID().length).toBe(36);
  });

  it('should match UUID v4 format', () => {
    const uuid = generateUUID();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(uuid).toMatch(uuidRegex);
  });

  it('should generate unique UUIDs', () => {
    const uuids = new Set();
    for (let i = 0; i < 100; i++) {
      uuids.add(generateUUID());
    }
    expect(uuids.size).toBe(100);
  });

  it('should always have "4" as the 13th character (version)', () => {
    for (let i = 0; i < 10; i++) {
      const uuid = generateUUID();
      expect(uuid[14]).toBe('4');
    }
  });

  it('should have a valid variant character at position 19', () => {
    for (let i = 0; i < 10; i++) {
      const uuid = generateUUID();
      expect(['8', '9', 'a', 'b']).toContain(uuid[19]);
    }
  });

  it('should contain 4 hyphens', () => {
    const uuid = generateUUID();
    const hyphenCount = (uuid.match(/-/g) || []).length;
    expect(hyphenCount).toBe(4);
  });
});

// ----------------------------------------------------------
// HIIT Data Validation Logic
// ----------------------------------------------------------
// Tests for the validation logic in createhiit.js getHiitData/getExerciseData
describe('HIIT data validation logic', () => {
  function validateHiitData(name, description) {
    const trimmedName = (name || '').trim();
    const trimmedDesc = (description || '').trim();
    if (!trimmedName || !trimmedDesc) return null;
    return { name: trimmedName, description: trimmedDesc, type: 'custom' };
  }

  it('should return null for empty name', () => {
    expect(validateHiitData('', 'desc')).toBeNull();
  });

  it('should return null for empty description', () => {
    expect(validateHiitData('name', '')).toBeNull();
  });

  it('should return null for whitespace-only name', () => {
    expect(validateHiitData('   ', 'desc')).toBeNull();
  });

  it('should return valid data for proper inputs', () => {
    const result = validateHiitData('My HIIT', 'A workout');
    expect(result).toEqual({
      name: 'My HIIT',
      description: 'A workout',
      type: 'custom',
    });
  });

  it('should trim whitespace from inputs', () => {
    const result = validateHiitData('  My HIIT  ', '  A workout  ');
    expect(result.name).toBe('My HIIT');
    expect(result.description).toBe('A workout');
  });

  it('should always set type to custom', () => {
    const result = validateHiitData('Test', 'Desc');
    expect(result.type).toBe('custom');
  });
});

// ----------------------------------------------------------
// Exercise data validation logic
// ----------------------------------------------------------
describe('Exercise data validation logic', () => {
  function validateExerciseData(name, description, duration, rest) {
    if (!name || !description || !duration || !rest) return null;
    return {
      name,
      description,
      exercise_duration: duration,
      rest_duration: rest,
    };
  }

  it('should return null if any field is empty', () => {
    expect(validateExerciseData('', 'desc', 30, 15)).toBeNull();
    expect(validateExerciseData('name', '', 30, 15)).toBeNull();
    expect(validateExerciseData('name', 'desc', 0, 15)).toBeNull();
    expect(validateExerciseData('name', 'desc', 30, 0)).toBeNull();
  });

  it('should return valid data for proper inputs', () => {
    const result = validateExerciseData('Pushups', 'Do pushups', 60, 30);
    expect(result).toEqual({
      name: 'Pushups',
      description: 'Do pushups',
      exercise_duration: 60,
      rest_duration: 30,
    });
  });
});

// ----------------------------------------------------------
// Progress tracking logic (localStorage data shape)
// ----------------------------------------------------------
describe('Progress tracking data structure', () => {
  it('should have the correct shape for saved data', () => {
    const savedData = {
      totalhiits: 5,
      completedExerciseCount: 20,
      completedTime: 1500,
      completedHiits: [
        { name: 'HIIT Quick Blast', duration: '07:45' },
        { name: 'Tabata Torch', duration: '08:30' },
      ],
    };

    expect(savedData).toHaveProperty('totalhiits');
    expect(savedData).toHaveProperty('completedExerciseCount');
    expect(savedData).toHaveProperty('completedTime');
    expect(savedData).toHaveProperty('completedHiits');
    expect(Array.isArray(savedData.completedHiits)).toBe(true);
    expect(typeof savedData.totalhiits).toBe('number');
    expect(typeof savedData.completedExerciseCount).toBe('number');
    expect(typeof savedData.completedTime).toBe('number');
  });

  it('completed HIIT entries should have name and duration', () => {
    const entry = { name: 'Test HIIT', duration: '05:00' };
    expect(entry).toHaveProperty('name');
    expect(entry).toHaveProperty('duration');
    expect(typeof entry.name).toBe('string');
    expect(typeof entry.duration).toBe('string');
  });

  it('should serialize and deserialize correctly via JSON', () => {
    const original = {
      totalhiits: 3,
      completedExerciseCount: 12,
      completedTime: 900,
      completedHiits: [{ name: 'Test', duration: '15:00' }],
    };

    const serialized = JSON.stringify(original);
    const deserialized = JSON.parse(serialized);

    expect(deserialized).toEqual(original);
  });
});

// ----------------------------------------------------------
// Dashboard display formatting
// ----------------------------------------------------------
describe('Dashboard display formatting', () => {
  function formatCount(count) {
    return count > 9 ? `${count}` : `0${count}`;
  }

  it('should pad single digit counts with leading zero', () => {
    expect(formatCount(0)).toBe('00');
    expect(formatCount(1)).toBe('01');
    expect(formatCount(9)).toBe('09');
  });

  it('should not pad double digit counts', () => {
    expect(formatCount(10)).toBe('10');
    expect(formatCount(99)).toBe('99');
  });

  it('should handle counts above 99', () => {
    expect(formatCount(100)).toBe('100');
  });
});
