"use client"

import { useRouter, usePathname } from "next/navigation"
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  Sun,
  Moon,
  UserCircle2,
} from "lucide-react"
import Link from "next/link"
import { DashboardDataProvider } from "./dashboard-data-context"
import { useTheme } from "@/components/theme-provider"
import { PortalBrand } from "@/components/portal-brand"

// Nav items are statically rendered for AI blueprint scanning

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const isOrdersRoute = pathname === "/dashboard/orders" || pathname.startsWith("/dashboard/orders/")
  const isProfileRoute = pathname === "/dashboard/profile"

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("vendorId")
      window.localStorage.removeItem("vendorName")
      window.localStorage.removeItem("vendorDriveFolderId")
    }

    router.replace("/login")
  }

  return (
    <DashboardDataProvider>
      <div className="min-h-screen bg-background text-foreground md:flex">
        <aside className="flex w-full flex-col border-b border-border/70 bg-card md:sticky md:top-0 md:h-screen md:w-[232px] md:border-b-0 md:border-r xl:w-[252px]">
          <div className="flex h-16 items-center px-5 md:px-5">
            <PortalBrand
              className="w-full"
              logoClassName="h-10 w-24 sm:h-12 sm:w-28"
            />
          </div>

          <nav className="grid gap-1.5 px-5 pb-6 md:px-3">
            {[
              { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
              { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
              { href: "#", label: "Payments", icon: CreditCard },
              { href: "/dashboard/profile", label: "Profile", icon: UserCircle2 },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={
                  (item.label === "Orders"
                    ? isOrdersRoute
                    : item.label === "Profile"
                      ? isProfileRoute
                      : pathname === item.href)
                    ? "flex items-center gap-3 rounded-xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(181,74,74,0.18)] transition-colors"
                    : "flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t border-border/70 p-4 md:p-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 text-[12px] font-bold text-primary"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-primary">
                <LogOut className="h-3.5 w-3.5" />
              </span>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-border/70 bg-card px-5 py-4 md:sticky md:top-0 md:z-10 md:px-7 md:py-3.5">
            <div className="flex items-center justify-end gap-4 md:gap-5">
              <button
                type="button"
                className="relative flex h-8 w-14 items-center rounded-full border border-border/70 bg-muted px-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                aria-pressed={theme === "dark"}
                onClick={toggleTheme}
              >
                <span
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                >
                  <Sun className="h-3.5 w-3.5" />
                </span>
                <span
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                >
                  <Moon className="h-3.5 w-3.5" />
                </span>
                <span
                  className={
                    theme === "dark"
                      ? "absolute left-[27px] top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-card text-primary shadow-sm transition-all"
                      : "absolute left-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-card text-primary shadow-sm transition-all"
                  }
                  aria-hidden="true"
                >
                  {theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                </span>
              </button>

            </div>
          </header>

        <main className="flex-1 overflow-x-hidden bg-background px-5 py-7 md:px-7 md:py-8">
          <div className="mx-auto max-w-[1180px] space-y-7 md:space-y-7">{children}</div>
        </main>
      </div>
      </div>
    </DashboardDataProvider>
  )
}
