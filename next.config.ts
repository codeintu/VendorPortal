import type { NextConfig } from "next";

const defaultPortalLogoUrl =
  "https://www.kibizsystems.com/wp-content/uploads/UsSpiceLogo.png"

const portalLogoUrl = process.env.NEXT_PUBLIC_PORTAL_LOGO_URL || defaultPortalLogoUrl
const portalLogo = new URL(portalLogoUrl)

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: portalLogo.protocol.replace(":", "") as "http" | "https",
        hostname: portalLogo.hostname,
        pathname: `${portalLogo.pathname.replace(/\/[^/]*$/, "")}/**`,
      },
    ],
  },
};

export default nextConfig;
