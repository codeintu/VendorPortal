import Image from "next/image"
import { PORTAL_BRANDING } from "@/config/branding"

type PortalBrandProps = {
  className?: string
  logoClassName?: string
}

function joinClasses(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ")
}

export function PortalBrand({
  className,
  logoClassName,
}: PortalBrandProps) {
  return (
    <div className={joinClasses("flex items-center justify-center", className)}>
      <Image
        src={PORTAL_BRANDING.logoUrl}
        alt="U.S. Spice Mills logo"
        width={160}
        height={160}
        className={joinClasses("shrink-0 object-contain", logoClassName)}
        priority
      />
    </div>
  )
}
