// test/mockserver.test.js
const request = require('supertest');
const app = require('../src/server'); // export app from server.js

describe('MockServer Lite', () => {
  it('GET /users should return 200', async () => {
    const res = await request(app).get('/users');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
