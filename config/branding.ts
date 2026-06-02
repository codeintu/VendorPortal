//Default logo

const defaultPortalLogoUrl =
  "https://www.kibizsystems.com/wp-content/uploads/UsSpiceLogo.png"

export const PORTAL_BRANDING = {
  logoUrl: process.env.NEXT_PUBLIC_PORTAL_LOGO_URL || defaultPortalLogoUrl,
}
