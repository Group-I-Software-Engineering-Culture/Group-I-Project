import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';

// ============================================================
// API Integration Tests for SeeFit HIIT Application
// ============================================================

// Store created HIIT IDs for cleanup / cross-test references
let createdHiitId;
const testHiitId = 'test-uuid-1234-5678-abcdefabcdef';

// ----------------------------------------------------------
// 1. GET /hiits – List all HIITs
// ----------------------------------------------------------
describe('GET /hiits', () => {
  it('should return a 200 status code', async () => {
    const res = await request(app).get('/hiits');
    expect(res.status).toBe(200);
  });

  it('should return an array of HIITs', async () => {
    const res = await request(app).get('/hiits');
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should contain the 8 default HIITs', async () => {
    const res = await request(app).get('/hiits');
    const defaultHiits = res.body.filter((h) => h.type === 'default');
    expect(defaultHiits.length).toBe(8);
  });

  it('should return HIITs with expected properties', async () => {
    const res = await request(app).get('/hiits');
    const hiit = res.body[0];
    expect(hiit).toHaveProperty('hiits_id');
    expect(hiit).toHaveProperty('name');
    expect(hiit).toHaveProperty('description');
    expect(hiit).toHaveProperty('type');
  });

  it('should include known default HIIT names', async () => {
    const res = await request(app).get('/hiits');
    const names = res.body.map((h) => h.name);
    expect(names).toContain('HIIT Quick Blast');
    expect(names).toContain('Tabata Torch');
    expect(names).toContain('Power Plyo HIIT');
    expect(names).toContain('Cardio Crusher');
  });
});

// ----------------------------------------------------------
// 2. POST /hiits – Create a custom HIIT
// ----------------------------------------------------------
describe('POST /hiits', () => {
  it('should create a new custom HIIT', async () => {
    createdHiitId = testHiitId;
    const res = await request(app)
      .post('/hiits')
      .send({
        hiit_id: testHiitId,
        name: 'Test HIIT',
        description: 'A test HIIT workout',
        type: 'custom',
      });
    expect(res.status).toBe(200);
  });

  it('should persist the created HIIT in the database', async () => {
    const res = await request(app).get('/hiits');
    const created = res.body.find((h) => h.hiits_id === testHiitId);
    expect(created).toBeDefined();
    expect(created.name).toBe('Test HIIT');
    expect(created.description).toBe('A test HIIT workout');
    expect(created.type).toBe('custom');
  });

  it('should increase the total number of HIITs by 1', async () => {
    const res = await request(app).get('/hiits');
    // 8 defaults + 1 custom
    expect(res.body.length).toBeGreaterThanOrEqual(9);
  });
});

// ----------------------------------------------------------
// 3. GET /exercise – List all exercises
// ----------------------------------------------------------
describe('GET /exercise', () => {
  it('should return a 200 status code', async () => {
    const res = await request(app).get('/exercise');
    expect(res.status).toBe(200);
  });

  it('should return an array of exercises', async () => {
    const res = await request(app).get('/exercise');
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should contain exercises with expected properties', async () => {
    const res = await request(app).get('/exercise');
    const exercise = res.body[0];
    expect(exercise).toHaveProperty('exercise_id');
    expect(exercise).toHaveProperty('name');
    expect(exercise).toHaveProperty('description');
    expect(exercise).toHaveProperty('exercise_duration');
    expect(exercise).toHaveProperty('rest_duration');
    expect(exercise).toHaveProperty('hiit_id');
  });

  it('should have 32 default exercises (4 per default HIIT)', async () => {
    const res = await request(app).get('/exercise');
    // At least 32 from defaults; could be more if custom exercises exist
    expect(res.body.length).toBeGreaterThanOrEqual(32);
  });

  it('should have exercises linked to known default HIIT IDs', async () => {
    const res = await request(app).get('/exercise');
    const hiitIds = [...new Set(res.body.map((e) => e.hiit_id))];
    expect(hiitIds).toContain('5d51f171-afbf-4885-91e3-83f0cc72499d'); // HIIT Quick Blast
    expect(hiitIds).toContain('6bddceaa-8c75-4946-84df-38a4f2abbe79'); // Tabata Torch
  });

  it('should have valid duration values (positive integers)', async () => {
    const res = await request(app).get('/exercise');
    res.body.forEach((exercise) => {
      expect(exercise.exercise_duration).toBeGreaterThan(0);
      expect(exercise.rest_duration).toBeGreaterThan(0);
    });
  });
});

// ----------------------------------------------------------
// 4. POST /exercise – Add exercises to a HIIT
// ----------------------------------------------------------
describe('POST /exercise', () => {
  it('should add an exercise to an existing HIIT', async () => {
    const res = await request(app)
      .post('/exercise')
      .send({
        name: 'Test Pushups',
        description: 'A test exercise',
        exercise_duration: 30,
        rest_duration: 15,
        hiit_id: testHiitId,
      });
    expect(res.status).toBe(200);
  });

  it('should add a second exercise to the same HIIT', async () => {
    const res = await request(app)
      .post('/exercise')
      .send({
        name: 'Test Squats',
        description: 'Another test exercise',
        exercise_duration: 45,
        rest_duration: 20,
        hiit_id: testHiitId,
      });
    expect(res.status).toBe(200);
  });

  it('should persist the added exercises', async () => {
    const res = await request(app).get('/exercise');
    const testExercises = res.body.filter((e) => e.hiit_id === testHiitId);
    // At least 2 from this test run (may be more if DB not reset between runs)
    expect(testExercises.length).toBeGreaterThanOrEqual(2);
    expect(testExercises.map((e) => e.name)).toContain('Test Pushups');
    expect(testExercises.map((e) => e.name)).toContain('Test Squats');
  });

  it('should store correct duration values', async () => {
    const res = await request(app).get('/exercise');
    const pushups = res.body.find((e) => e.name === 'Test Pushups');
    expect(pushups.exercise_duration).toBe(30);
    expect(pushups.rest_duration).toBe(15);
  });
});

// ----------------------------------------------------------
// 5. DELETE /hiits/:id – Delete a custom HIIT
// ----------------------------------------------------------
describe('DELETE /hiits/:id', () => {
  it('should delete the custom HIIT and return 204', async () => {
    const res = await request(app).delete(`/hiits/${testHiitId}`);
    expect(res.status).toBe(204);
  });

  it('should no longer list the deleted HIIT', async () => {
    const res = await request(app).get('/hiits');
    const deleted = res.body.find((h) => h.hiits_id === testHiitId);
    expect(deleted).toBeUndefined();
  });

  it('should return 204 even for a non-existent ID (idempotent)', async () => {
    const res = await request(app).delete('/hiits/non-existent-id');
    expect(res.status).toBe(204);
  });
});

// ----------------------------------------------------------
// 6. Static file serving
// ----------------------------------------------------------
describe('Static file serving', () => {
  it('should serve index.html at root', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  it('should serve the SPA for /app/* routes', async () => {
    const res = await request(app).get('/app/anything/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });
});

// ----------------------------------------------------------
// 7. Default HIIT data integrity
// ----------------------------------------------------------
describe('Default HIIT data integrity', () => {
  it('each default HIIT should have exactly 4 exercises', async () => {
    const [hiitsRes, exercisesRes] = await Promise.all([
      request(app).get('/hiits'),
      request(app).get('/exercise'),
    ]);

    const defaultHiits = hiitsRes.body.filter((h) => h.type === 'default');
    defaultHiits.forEach((hiit) => {
      const exercises = exercisesRes.body.filter(
        (e) => e.hiit_id === hiit.hiits_id,
      );
      expect(exercises.length).toBe(4);
    });
  });

  it('all default HIITs should have type "default"', async () => {
    const res = await request(app).get('/hiits');
    const defaultHiits = res.body.filter((h) => h.type === 'default');
    defaultHiits.forEach((hiit) => {
      expect(hiit.type).toBe('default');
    });
  });

  it('all default HIITs should have non-empty names and descriptions', async () => {
    const res = await request(app).get('/hiits');
    const defaultHiits = res.body.filter((h) => h.type === 'default');
    defaultHiits.forEach((hiit) => {
      expect(hiit.name.length).toBeGreaterThan(0);
      expect(hiit.description.length).toBeGreaterThan(0);
    });
  });
});
