"use client"

import { Building2, Home, Mail, MapPin, Phone, UserCircle2, type LucideIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useDashboardData, type VendorSummary } from "../dashboard-data-context"

const EMPTY_VALUE = "--"
const PROFILE_CACHE_PREFIX = "vendor-profile:"

export default function ProfilePage() {
  const { vendorId } = useDashboardData()
  const [profile, setProfile] = useState<VendorSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!vendorId) {
      return
    }

    let isActive = true
    const cacheKey = `${PROFILE_CACHE_PREFIX}${vendorId}`

    const loadProfile = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const cachedProfile = window.sessionStorage.getItem(cacheKey)
        if (cachedProfile) {
          setProfile(JSON.parse(cachedProfile) as VendorSummary)
          return
        }

        const response = await fetch(`/api/vendor/profile?vendorId=${encodeURIComponent(vendorId)}`)
        const data = await response.json()

        if (!isActive) {
          return
        }

        if (response.ok && data.success) {
          const nextProfile = data.profile as VendorSummary
          setProfile(nextProfile)
          window.sessionStorage.setItem(cacheKey, JSON.stringify(nextProfile))
          return
        }

        setProfile(null)
        setError(data.error || "Failed to load vendor profile")
      } catch (profileError) {
        if (!isActive) {
          return
        }

        console.error(profileError)
        setProfile(null)
        setError("An unexpected error occurred")
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isActive = false
    }
  }, [vendorId])

  return (
    <>
      <section className="space-y-2">
        <h1 className="text-[30px] font-bold tracking-tight text-foreground md:text-[38px]">
          Profile
        </h1>
        <p className="max-w-2xl text-[15px] text-muted-foreground md:text-base">
          Company and contact details connected to your vendor account.
        </p>
      </section>

      {isLoading ? (
        <section className="space-y-5">
          <div className="h-[260px] animate-pulse rounded-[24px] bg-muted" />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-[190px] animate-pulse rounded-[24px] bg-muted" />
            <div className="h-[190px] animate-pulse rounded-[24px] bg-muted" />
          </div>
          <div className="h-[190px] animate-pulse rounded-[24px] bg-muted" />
        </section>
      ) : error ? (
        <section className="rounded-[24px] border border-border/70 bg-card px-5 py-12 text-center shadow-[0_18px_40px_rgba(0,0,0,0.16)] md:px-8">
          <p className="font-medium text-[#ff7a7a]">{error}</p>
        </section>
      ) : (
        <section className="space-y-5">
          <article className="grid gap-7 overflow-hidden rounded-[24px] border border-border/70 bg-card p-6 shadow-[0_18px_40px_rgba(0,0,0,0.16)] md:p-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-[22px] font-bold uppercase tracking-[0.08em] text-foreground">
                  Company Details
                </h2>
              </div>

              <div className="grid gap-7 md:grid-cols-2">
                <ProfileMeta label="Legal Name" value={profile?.companyName || EMPTY_VALUE} />
                <ProfileMeta label="Vendor ID" value={profile?.vendorId || EMPTY_VALUE} />
                <ProfileMeta label="Company Website" value={profile?.companyWebsite || EMPTY_VALUE} />
                <ProfileMeta label="Vendor Category" value={profile?.vendorCategory || EMPTY_VALUE} />
                <ProfileMeta label="Vendor Type" value={profile?.vendorType || EMPTY_VALUE} />
                <ProfileMeta label="Vendor Terms" value={profile?.vendorTerms || EMPTY_VALUE} />
              </div>
            </div>

            <StaticCompanyLogo />
          </article>

          <div className="grid gap-5 lg:grid-cols-2">
            <AddressCard
              icon={MapPin}
              title="Billing Address"
              value={profile?.billingAddress || EMPTY_VALUE}
            />
            <AddressCard
              icon={Home}
              title="Shipping Address"
              value={profile?.shippingAddress || EMPTY_VALUE}
            />
          </div>

          <section className="overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
            <div className="border-b border-border/70 px-6 py-5 md:px-8">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">
                Contact Information
              </h2>
            </div>

            <div className="divide-y divide-border/70">
              <ContactRow
                icon={UserCircle2}
                name={profile?.primaryContactName || EMPTY_VALUE}
                role="Primary Contact"
                email={profile?.primaryContactEmail || EMPTY_VALUE}
                phone={profile?.primaryContactPhone || EMPTY_VALUE}
              />
            </div>
          </section>
        </section>
      )}
    </>
  )
}

function ProfileMeta({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="text-[18px] font-bold leading-relaxed text-foreground">{value}</p>
    </div>
  )
}

function StaticCompanyLogo() {
  return (
    <div className="mx-auto flex h-56 w-64 items-center justify-center text-primary lg:mx-0 lg:justify-self-end">
      <svg
        aria-hidden="true"
        className="h-full w-full"
        viewBox="0 0 256 224"
        fill="none"
      >
        <path
          d="M30 194h196"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.18"
        />
        <path
          d="M62 194V69l72-30v155"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M134 194V92l62 24v78"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M82 88h16M82 112h16M82 136h16M82 160h16"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.72"
        />
        <path
          d="M158 128h15M158 153h15"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.72"
        />
        <path
          d="M45 194v-48h-17v48M210 194v-38h18v38"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M62 69l72-30v28"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.38"
        />
      </svg>
    </div>
  )
}

function AddressCard({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon
  title: string
  value: string
}) {
  return (
    <article className="rounded-[24px] border border-border/70 bg-card p-6 shadow-[0_18px_40px_rgba(0,0,0,0.14)] md:p-7">
      <div className="mb-7 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-foreground">
          {title}
        </h3>
      </div>
      <p className="whitespace-pre-line text-[18px] font-semibold leading-8 text-foreground">
        {value}
      </p>
    </article>
  )
}

function ContactRow({
  icon: Icon,
  name,
  role,
  email,
  phone,
}: {
  icon: LucideIcon
  name: string
  role: string
  email: string
  phone: string
}) {
  return (
    <div className="grid gap-5 px-6 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:px-8">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-muted text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[18px] font-bold text-foreground">{name}</p>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {role}
          </p>
        </div>
      </div>

      <div className="grid gap-3 text-[16px] text-muted-foreground sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <span className="truncate">{email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <span>{phone}</span>
        </div>
      </div>
    </div>
  )
}
