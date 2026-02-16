import { describe, it, expect } from 'vitest';
import * as hb from '../hiitboard.js';

// ============================================================
// Database Layer Unit Tests (hiitboard.js)
// ============================================================

const testHiitId = 'db-test-uuid-0000-1111-222233334444';

// ----------------------------------------------------------
// 1. listHiits – Read all HIITs
// ----------------------------------------------------------
describe('listHiits', () => {
  it('should return an array', async () => {
    const hiits = await hb.listHiits();
    expect(Array.isArray(hiits)).toBe(true);
  });

  it('should contain at least 8 default HIITs', async () => {
    const hiits = await hb.listHiits();
    expect(hiits.length).toBeGreaterThanOrEqual(8);
  });

  it('should return objects with correct schema', async () => {
    const hiits = await hb.listHiits();
    hiits.forEach((hiit) => {
      expect(hiit).toHaveProperty('hiits_id');
      expect(hiit).toHaveProperty('name');
      expect(hiit).toHaveProperty('description');
      expect(hiit).toHaveProperty('type');
    });
  });
});

// ----------------------------------------------------------
// 2. addHiit – Insert a new HIIT
// ----------------------------------------------------------
describe('addHiit', () => {
  it('should insert a new HIIT without error', async () => {
    const result = await hb.addHiit(
      testHiitId,
      'DB Test HIIT',
      'Testing direct DB insertion',
      'custom',
    );
    expect(result).toBeDefined();
  });

  it('should be retrievable after insertion', async () => {
    const hiits = await hb.listHiits();
    const found = hiits.find((h) => h.hiits_id === testHiitId);
    expect(found).toBeDefined();
    expect(found.name).toBe('DB Test HIIT');
    expect(found.type).toBe('custom');
  });
});

// ----------------------------------------------------------
// 3. addExercise – Insert exercises
// ----------------------------------------------------------
describe('addExercise', () => {
  it('should insert an exercise linked to the test HIIT', async () => {
    const result = await hb.addExercise(
      'DB Test Exercise',
      'Testing exercise insertion',
      60,
      30,
      testHiitId,
    );
    expect(result).toBeDefined();
  });

  it('should be retrievable in the exercises list', async () => {
    const exercises = await hb.listExercises();
    const found = exercises.find((e) => e.hiit_id === testHiitId);
    expect(found).toBeDefined();
    expect(found.name).toBe('DB Test Exercise');
    expect(found.exercise_duration).toBe(60);
    expect(found.rest_duration).toBe(30);
  });
});

// ----------------------------------------------------------
// 4. listExercises – Read all exercises
// ----------------------------------------------------------
describe('listExercises', () => {
  it('should return an array', async () => {
    const exercises = await hb.listExercises();
    expect(Array.isArray(exercises)).toBe(true);
  });

  it('should contain at least 32 default exercises', async () => {
    const exercises = await hb.listExercises();
    expect(exercises.length).toBeGreaterThanOrEqual(32);
  });

  it('should return objects with correct schema', async () => {
    const exercises = await hb.listExercises();
    exercises.forEach((ex) => {
      expect(ex).toHaveProperty('exercise_id');
      expect(ex).toHaveProperty('name');
      expect(ex).toHaveProperty('description');
      expect(ex).toHaveProperty('exercise_duration');
      expect(ex).toHaveProperty('rest_duration');
      expect(ex).toHaveProperty('hiit_id');
    });
  });

  it('exercise durations should be positive numbers', async () => {
    const exercises = await hb.listExercises();
    exercises.forEach((ex) => {
      expect(typeof ex.exercise_duration).toBe('number');
      expect(typeof ex.rest_duration).toBe('number');
      expect(ex.exercise_duration).toBeGreaterThan(0);
      expect(ex.rest_duration).toBeGreaterThan(0);
    });
  });
});

// ----------------------------------------------------------
// 5. deleteHiit – Remove a HIIT
// ----------------------------------------------------------
describe('deleteHiit', () => {
  it('should delete the test HIIT without error', async () => {
    const result = await hb.deleteHiit(testHiitId);
    expect(result).toBeDefined();
  });

  it('should no longer appear in the list', async () => {
    const hiits = await hb.listHiits();
    const found = hiits.find((h) => h.hiits_id === testHiitId);
    expect(found).toBeUndefined();
  });

  it('should not throw when deleting a non-existent HIIT', async () => {
    await expect(
      hb.deleteHiit('non-existent-id'),
    ).resolves.toBeDefined();
  });
});

// ----------------------------------------------------------
// 6. findHiit – Find a specific HIIT by ID
// ----------------------------------------------------------
// NOTE: findHiit has a bug — it queries "WHERE id = ?" but the column
// is actually "hiits_id". These tests document the current (broken) behaviour.
describe('findHiit', () => {
  it('should be a function', () => {
    expect(typeof hb.findHiit).toBe('function');
  });

  it('returns undefined due to wrong column name in query (known bug)', async () => {
    // This should find 'HIIT Quick Blast' but doesn't because the SQL
    // references a non-existent "id" column instead of "hiits_id".
    // Once fixed, this test should be updated to expect a result.
    await expect(
      hb.findHiit('5d51f171-afbf-4885-91e3-83f0cc72499d'),
    ).rejects.toThrow();
  });
});
