import { Page, expect } from '@playwright/test';

export const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Tailwind and all libs are now bundled at build time, so the app makes no
// external requests. Keep the E2E hermetic: abort any non-localhost http(s)
// traffic so an accidental external dependency can never stall or flake a test.
// (Firebase emulators run on 127.0.0.1, so they're allowed through.)
export async function blockCdns(page: Page) {
  await page.route(/^https?:\/\/(?!(127\.0\.0\.1|localhost)[:/])/, route => route.abort());
}

export async function registerAdmin(page: Page, email: string, name = 'Admin Test') {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Registrati' }).click();
  await page.getByPlaceholder('Mario Rossi').fill(name);
  await page.getByPlaceholder('nome@esempio.it').fill(email);
  const passwords = page.locator('input[type="password"]');
  await passwords.nth(0).fill('password123');
  await passwords.nth(1).fill('password123');
  await page.getByRole('button', { name: 'Registra' }).click();
}

export async function onboard(page: Page, orgName: string) {
  await page.getByPlaceholder(/Club Paradiso/).fill(orgName);
  await page.getByRole('button', { name: 'Anteprima' }).click();
  await page.getByRole('button', { name: 'Conferma' }).click();
  await expect(page.getByRole('heading', { name: 'I Tuoi Eventi' })).toBeVisible();
}

export async function createEvent(page: Page, name: string) {
  await page.getByRole('button', { name: 'Crea Evento' }).first().click();
  await expect(page.getByRole('heading', { name: 'Nuovo Evento' })).toBeVisible();
  await page.getByPlaceholder('Es. Summer Party XL').fill(name);
  await page.locator('input[type="datetime-local"]').fill('2026-12-31T23:00');
  await page.getByPlaceholder('Es. Main Hall').fill('Sala Test');
  await page.getByRole('button', { name: 'Crea Evento' }).last().click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
}
