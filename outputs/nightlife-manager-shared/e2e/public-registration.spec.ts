import { test, expect } from '@playwright/test';
import { unique, blockCdns, registerAdmin, onboard, createEvent } from './helpers';

/**
 * Public guest registration: an admin creates an event + list (no PR required) and
 * shares the public link; a separate UNAUTHENTICATED visitor opens /lista/:token and
 * registers. Exercises the public branch of firestore.rules (list read by token +
 * guest create with email/length validation).
 */
test('a public visitor can register on a list link', async ({ browser }) => {
  // --- Admin sets up event -> list (PR optional), then shares the public link ---
  const adminCtx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const admin = await adminCtx.newPage();
  await blockCdns(admin);
  await registerAdmin(admin, `admin-${unique()}@test.it`, 'Admin Pub');
  await onboard(admin, 'Club Pub E2E');
  await createEvent(admin, 'Evento Pub');

  // The event Home is the default view; create a list by name only — no PR.
  await admin.getByRole('heading', { name: 'Evento Pub' }).click();
  await admin.getByPlaceholder('Nome lista (es. Lista VIP)').fill('Lista VIP');
  await admin.getByRole('button', { name: 'Crea lista' }).click();

  // Open the share modal for that list and copy the public link (1-tap + QR).
  await admin.getByRole('button', { name: 'Condividi' }).click();
  await admin.getByRole('button', { name: 'Copia link' }).click();
  await expect(admin.getByText(/Link copiato/)).toBeVisible();
  const publicUrl = await admin.evaluate(() => navigator.clipboard.readText());
  expect(publicUrl).toContain('/lista/');
  const token = publicUrl.split('/lista/')[1];

  // --- A separate, unauthenticated visitor registers on the list ---
  const visitorCtx = await browser.newContext();
  const visitor = await visitorCtx.newPage();
  await blockCdns(visitor);
  await visitor.goto(`/lista/${token}`, { waitUntil: 'domcontentloaded' });

  await expect(visitor.getByRole('heading', { name: 'Evento Pub' })).toBeVisible();
  await visitor.getByPlaceholder('Mario Rossi').fill('Ospite Test');
  await visitor.getByPlaceholder('mario@email.com').fill('ospite@test.it');
  await visitor.getByRole('button', { name: '♂ Uomo' }).click();
  await visitor.getByRole('button', { name: 'Iscriviti in Lista' }).click();

  // Success screen confirms the guest write passed the rules.
  await expect(visitor.getByRole('heading', { name: /Sei in lista/ })).toBeVisible();

  await adminCtx.close();
  await visitorCtx.close();
});
