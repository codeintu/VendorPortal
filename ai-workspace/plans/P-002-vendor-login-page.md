# Plan: P-002-vendor-login-page

Linked Ticket: T-002-vendor-login-page

## Strategy
We will revise the UI components and globals.css to perfectly match the provided dark-mode design screenshot for the Vendor Login Page. 

**Dynamic Theming Updates**: 
- Page Background: Very dark navy/black (`#020617` or similar).
- Card Background: Dark blue-grey (`#0f172a` or `#131b2d`).
- Input Background: Very dark blue/black (`#020617` or similar).
- Primary Color (Brand/Blue): Bright Blue (`#3b82f6` or `#2563eb`).
- Typography: Clean white and muted grey.

**Design Aesthetics**: The layout features a centered dark authentication card with a subtle border and no colored top-bar. The inputs are flat, dark boxes with subtle borders. The primary blue button is full width with an arrow suffix. Links are also in the primary bright blue color.

## Implementation Steps

1. **Theming Configuration**: Heavily modify `app/globals.css` to enforce the deeply dark color palette across all variables (`background`, `card`, `input`, `primary`). We will revert the primary color back to the standard bright blue.
2. **Reusable UI Components Updates**:
   - `components/ui/Input.tsx`: Ensure the input has a very dark background, subtle border, and blue focus ring. Add placeholder dots (`••••••••`) for password.
   - `components/ui/Button.tsx`: Ensure the button is colored with the primary blue.
3. **Login Page Overhaul (`app/login/page.tsx`)**: 
   - Remove the top border from the container card.
   - Restructure the typography (Header: "Vendor Portal", Subheader: "Sign in to your account").
   - Ensure the "Forgot password?" and "Contact your administrator" links use the primary blue color.
   - Ensure pixel-perfect layout matching the new screenshot.
4. **Integration & Polish**:
   - Ensure pixel-perfect margins/paddings checking against proportion in the screenshot.

## Files Expected To Change

- `components/ui/Button.tsx` (NEW)
- `components/ui/Input.tsx` (NEW)
- `components/ui/Label.tsx` (NEW)
- `app/login/page.tsx` (NEW)
- `app/layout.tsx` (MODIFIED - to wrap body with consistent background styles)
- `app/globals.css` (MODIFIED - to inject custom CSS utilities or aesthetic base elements)

## Risks
- Over-engineering visual complexity might obscure standard application logic, mitigated by separating purely cosmetic utilities into distinct stylesheets or isolated Tailwind utility classes.

## Rollback Plan
- Delete the created configuration folders (`components/`, `lib/`, `types/`, `hooks/`) and the `app/login` folder. Standardize `app/layout.tsx` and `app/globals.css` to their original Next.js defaults using `git checkout` or equivalent hard reverts.
