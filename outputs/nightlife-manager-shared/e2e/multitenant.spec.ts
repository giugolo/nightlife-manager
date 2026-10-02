import { test, expect } from '@playwright/test';
import { unique, blockCdns, registerAdmin, onboard, createEvent } from './helpers';

/**
 * Multi-tenant isolation: an admin of organization B must never see the events
 * of organization A. Uses two isolated browser contexts (two independent users)
 * to exercise Firestore data isolation + firestore.rules (events list is limited
 * to members of the owning organization).
 */
test('an organization cannot see another organization events', async ({ browser }) => {
  // --- Organization A (context A) ---
  const ctxA = await browser.newContext();
  const pageA = await ctxA.newPage();
  await blockCdns(pageA);
  await registerAdmin(pageA, `a-${unique()}@test.it`, 'Admin A');
  await onboard(pageA, 'Org A E2E');
  await createEvent(pageA, 'Evento Org A');

  // --- Organization B (separate context B) ---
  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  await blockCdns(pageB);
  await registerAdmin(pageB, `b-${unique()}@test.it`, 'Admin B');
  await onboard(pageB, 'Org B E2E');

  // B is on its own dashboard and must NOT see A's event.
  await expect(pageB.getByRole('heading', { name: 'I Tuoi Eventi' })).toBeVisible();
  await expect(pageB.getByRole('heading', { name: 'Evento Org A' })).toHaveCount(0);

  // Sanity: A still sees its own event.
  await expect(pageA.getByRole('heading', { name: 'Evento Org A' })).toBeVisible();

  await ctxA.close();
  await ctxB.close();
});
