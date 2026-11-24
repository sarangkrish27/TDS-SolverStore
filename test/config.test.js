import test from 'node:test';
import assert from 'node:assert/strict';
import { publicFirebaseConfig } from '../server/public-config.js';
import { firestoreOptions } from '../server/firebase.js';
import { contributionDays, courseworkCoverage } from '../shared/metrics.js';

test('public configuration exposes only the four web fields', () => {
  assert.deepEqual(publicFirebaseConfig({
    FIREBASE_WEB_API_KEY: 'public-key', FIREBASE_WEB_AUTH_DOMAIN: 'example.firebaseapp.com',
    FIREBASE_WEB_APP_ID: 'app', FIREBASE_PROJECT_ID: 'project',
    FIREBASE_PRIVATE_KEY: 'secret', FIREBASE_CLIENT_EMAIL: 'private@example.com',
    VITE_FIREBASE_API_KEY: 'old-key', VITE_SECRET: 'secret',
  }), { apiKey: 'public-key', authDomain: 'example.firebaseapp.com', appId: 'app', projectId: 'project' });
});

test('Firestore uses an explicit auth client and normalizes PEM newlines', async () => {
  const options = firestoreOptions({ FIREBASE_PROJECT_ID: 'project', FIREBASE_CLIENT_EMAIL: 'service@example.com', FIREBASE_PRIVATE_KEY: 'line1\\nline2' });
  assert.equal(Object.hasOwn(options, 'credentials'), false);
  const client = await options.auth.getClient();
  assert.equal(client.email, 'service@example.com');
  assert.equal(client.key, 'line1\nline2');
});

test('activity includes UTC dates in the selected window and fills empty days', () => {
  const days = contributionDays([{createdAt:'2026-11-23T23:59:00.000Z'}, {createdAt:'2026-11-24T00:00:00.000Z'}, {createdAt:'2026-11-20T00:00:00.000Z'}], new Date('2026-11-24T12:00:00Z'), 3);
  assert.deepEqual(days.map(d => [d.key, d.count]), [['2026-11-22',0], ['2026-11-23',1], ['2026-11-24',1]]);
});

test('coverage counts distinct valid questions for the selected assignment', () => {
  const solvers = [1,1,2,0,5].map(question => ({assignmentId:'a', question}));
  solvers.push({assignmentId:'b', question:3});
  assert.deepEqual(courseworkCoverage({id:'a', questionCount:4}, solvers), {covered:2, percent:50});
});
