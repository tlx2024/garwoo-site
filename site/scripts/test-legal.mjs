import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEGAL, legalPagePlaceholders, legalProblems } from '../src/data/legal.mjs';

const final = {
  draft: false, version: '2026.12.01', updated: '2026-12-01', effective: '2026-12-01', operator: 'X', address: 'X',
  email: 'a@example.com', requestChannel: 'a@example.com', logDays: '1', auditDays: '1', factsDays: '1', disputes: 'X',
};

test('the committed text is consistent', () => assert.deepEqual(legalProblems(LEGAL), []));
test('a complete final text passes', () => assert.deepEqual(legalProblems(final), []));
test('a final text with any gap is refused', () => {
  for (const key of ['effective', 'operator', 'address', 'email', 'requestChannel', 'logDays', 'auditDays', 'factsDays', 'disputes'])
    assert.equal(legalProblems({ ...final, [key]: '' }).length, 1, key);
  assert.equal(legalProblems({ ...final, version: '2026.12.01-draft.1' }).length, 1);
  assert.equal(legalProblems({ ...final, effective: '12月1日' }).length, 1);
  assert.equal(legalProblems({ ...final, logDays: '若干' }).length, 1);
});
test('a draft may keep placeholders, a final page may not', () => {
  assert.deepEqual(legalPagePlaceholders({ draft: true }, '【公司全称】待核'), []);
  assert.equal(legalPagePlaceholders({ draft: false }, '【公司全称】待核').length, 2);
  assert.deepEqual(legalPagePlaceholders({ draft: false }, '正文'), []);
});
