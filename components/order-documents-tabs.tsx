"use client"

import { useState } from "react"
import { OrderDocumentsPanel } from "@/components/order-documents-panel"
import { OrderCoaList, type CoaLineItem } from "@/components/order-coa-list"
import { OrderSpecSheets } from "@/components/order-spec-sheets"

type TabKey = "import" | "coa" | "spec"

const TABS: { key: TabKey; label: string }[] = [
  { key: "import", label: "Import Documents" },
  // COA tab temporarily hidden (not functional yet). Re-enable by uncommenting.
  // { key: "coa", label: "COA (Certificate of Analysis)" },
  { key: "spec", label: "Specification Sheets" },
]

export function OrderDocumentsTabs({
  vendorId,
  poNumber,
  lineItems,
  disabled = false,
}: {
  vendorId: string | null
  poNumber: string
  lineItems: CoaLineItem[]
  disabled?: boolean
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("import")
  // Mount each tab's content lazily on first activation, then keep it mounted
  // (hidden) to preserve state and avoid re-fetching.
  const [activated, setActivated] = useState<Record<TabKey, boolean>>({
    import: true,
    coa: false,
    spec: false,
  })

  const selectTab = (key: TabKey) => {
    setActiveTab(key)
    setActivated((prev) => (prev[key] ? prev : { ...prev, [key]: true }))
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
      <div className="border-b border-border/70 px-5 py-5 md:px-7">
        <div className="flex items-center gap-3">
          <span className="h-8 w-1 rounded-full bg-primary" />
          <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
            Manage order documents
          </h2>
        </div>

        <div className="mt-4 inline-flex flex-wrap gap-1.5 rounded-2xl border border-border/70 bg-muted/50 p-1.5">
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => selectTab(tab.key)}
                aria-pressed={isActive}
                className={
                  isActive
                    ? "rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(181,74,74,0.25)] transition-colors"
                    : "rounded-xl px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                }
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-5 py-5 md:px-7">
        <div className={activeTab === "import" ? "" : "hidden"}>
          <OrderDocumentsPanel vendorId={vendorId} poNumber={poNumber} disabled={disabled} />
        </div>

        {activated.coa ? (
          <div className={activeTab === "coa" ? "" : "hidden"}>
            <OrderCoaList lineItems={lineItems} />
          </div>
        ) : null}

        {activated.spec ? (
          <div className={activeTab === "spec" ? "" : "hidden"}>
            <OrderSpecSheets vendorId={vendorId} poNumber={poNumber} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
