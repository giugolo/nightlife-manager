import { test, expect } from '@playwright/test';
import { unique, blockCdns, registerAdmin, onboard, createEvent } from './helpers';

/**
 * Door check-in + token invalidation (security-critical).
 * An admin generates a door link, a door operator checks a guest in, then the
 * admin regenerates the token: the OLD link must be rejected server-side
 * (firestore.rules `isDoorSessionValid` / door_sessions write check).
 */
test('regenerating the door token invalidates old check-in links', async ({ browser }) => {
  const adminCtx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const admin = await adminCtx.newPage();
  await blockCdns(admin);
  await registerAdmin(admin, `admin-${unique()}@test.it`, 'Admin Door');
  await onboard(admin, 'Club Door E2E');
  await createEvent(admin, 'Evento Door');
  await admin.getByRole('heading', { name: 'Evento Door' }).click();

  // List (no PR needed), then share the public link to seed a guest.
  await admin.getByPlaceholder('Nome lista (es. Lista VIP)').fill('Lista D');
  await admin.getByRole('button', { name: 'Crea lista' }).click();
  await admin.getByRole('button', { name: 'Condividi' }).click();
  await admin.getByRole('button', { name: 'Copia link' }).click();
  await expect(admin.getByText(/Link copiato/)).toBeVisible();
  const listToken = (await admin.evaluate(() => navigator.clipboard.readText())).split('/lista/')[1];
  // Close the share modal before continuing on the Home.
  await admin.keyboard.press('Escape');

  // Seed one guest via the public link.
  const visitorCtx = await browser.newContext();
  const visitor = await visitorCtx.newPage();
  await blockCdns(visitor);
  await visitor.goto(`/lista/${listToken}`, { waitUntil: 'domcontentloaded' });
  await visitor.getByPlaceholder('Mario Rossi').fill('Ospite Door');
  await visitor.getByPlaceholder('mario@email.com').fill('door@test.it');
  await visitor.getByRole('button', { name: '♂ Uomo' }).click();
  await visitor.getByRole('button', { name: 'Iscriviti in Lista' }).click();
  await expect(visitor.getByRole('heading', { name: /Sei in lista/ })).toBeVisible();
  await visitorCtx.close();

  // Admin generates the door link (shown in a read-only input) — it lives on the
  // event Home, no tab switching needed.
  await admin.getByRole('button', { name: 'Genera Link Door' }).click();
  const doorInput = admin.locator('input[readonly]');
  await expect(doorInput).toHaveValue(/\/checkin\//);
  const doorLink1 = await doorInput.inputValue();

  // Door operator opens the link and checks the guest in.
  const doorCtx = await browser.newContext();
  const door = await doorCtx.newPage();
  await blockCdns(door);
  await door.goto(doorLink1, { waitUntil: 'domcontentloaded' });
  await expect(door.getByRole('heading', { name: 'Door Check-in' })).toBeVisible();
  await door.getByText('Ospite Door').click();
  await expect(door.getByText(/Checked In:/)).toBeVisible();
  await doorCtx.close();

  // Admin regenerates the token -> the door link changes.
  await admin.getByRole('button', { name: /Rigenera Token/ }).click();
  await expect(doorInput).not.toHaveValue(doorLink1);

  // The OLD link is now rejected server-side.
  const staleCtx = await browser.newContext();
  const stale = await staleCtx.newPage();
  await blockCdns(stale);
  await stale.goto(doorLink1, { waitUntil: 'domcontentloaded' });
  await expect(stale.getByRole('heading', { name: 'Accesso Negato' })).toBeVisible();
  await staleCtx.close();

  await adminCtx.close();
});
