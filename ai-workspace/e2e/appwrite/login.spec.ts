import { expect, test } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'
const loginEmail = process.env.LOGIN_EMAIL || ''
const loginPassword = process.env.LOGIN_PASSWORD || ''

test.describe('Appwrite login flow', () => {
  test.use({ baseURL })

  test('loads the login page and signs in', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /vendor portal/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()

    test.skip(!loginEmail || !loginPassword, 'Set LOGIN_EMAIL and LOGIN_PASSWORD to run the sign-in step.')

    await page.getByLabel('Email').fill(loginEmail)
    await page.getByLabel('Password').fill(loginPassword)
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(/welcome back/i)).toBeVisible()
  })
})
