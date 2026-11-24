import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdministrator } from '../server/authorization.js';
import { publicFirebaseConfig } from '../server/public-config.js';

const token = { email: 'admin@study.iitm.ac.in', email_verified: true, firebase: { sign_in_provider: 'google.com' } };
test('admin requires configured email and verified student Google identity', () => {
  const env = { ADMIN_EMAIL: token.email };
  assert.equal(isAdministrator(token, env), true);
  assert.equal(isAdministrator(token, {}), false);
  assert.equal(isAdministrator({...token, email: 'another@study.iitm.ac.in'}, env), false);
  assert.equal(isAdministrator({...token, email_verified: false}, env), false);
  assert.equal(isAdministrator({...token, firebase: {sign_in_provider:'password'}}, env), false);
  assert.equal(isAdministrator(null, env), false);
});
test('public configuration never exposes administrator identity', () => {
  assert.equal(JSON.stringify(publicFirebaseConfig({ADMIN_EMAIL:token.email})).includes(token.email), false);
});
