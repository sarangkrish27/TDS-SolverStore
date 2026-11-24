import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("API preserves multiple solvers for the same question from the same and different students", () => {
  const result = spawnSync(process.execPath, ["--experimental-test-module-mocks", "--input-type=module", "-e", `
    import { mock } from 'node:test';
    import assert from 'node:assert/strict';
    const records = new Map();
    let uid = 'student-one';
    const db = { collection(name) {
      if (name === 'assignments') return { doc(id) { return { async get() { return {id, exists:true, data:()=>({questionCount:5})}; } }; } };
      assert.equal(name, 'solvers');
      return { async add(item) { const id = 'solver-' + records.size; records.set(id, structuredClone(item)); return {id}; } };
    }};
    mock.module('./server/firebase.js', {namedExports:{getDatabase:()=>db}});
    mock.module('firebase-admin/auth', {namedExports:{getAuth:()=>({verifyIdToken:async()=>({uid, email:'student@study.iitm.ac.in', email_verified:true, firebase:{sign_in_provider:'google.com'}})})}});
    const {default:handler} = await import('./api/action.js');
    const ids = [];
    for (const title of ['First solver','Second solver','Another student solver']) {
      if (title === 'Another student solver') uid = 'student-two';
      const res = {setHeader(){}, status(code){throw new Error('Unexpected status '+code)}, json(body){ids.push(body.item.id)}};
      await handler({method:'POST', headers:{authorization:'Bearer test'}, body:{action:'solver', data:{assignmentId:'ga5', question:3, title, url:'https://example.com', instructions:'Use this solver.'}}},res);
    }
    assert.equal(new Set(ids).size, 3);
    assert.deepEqual([...records.values()].map(s=>s.title), ['First solver','Second solver','Another student solver']);
    assert.deepEqual([...records.values()].map(s=>s.creatorId), ['student-one','student-one','student-two']);
    assert.ok([...records.values()].every(s=>s.assignmentId==='ga5' && s.question===3));
  `], {cwd:new URL("..",import.meta.url), encoding:"utf8"});
  assert.equal(result.status, 0, result.stderr);
});
