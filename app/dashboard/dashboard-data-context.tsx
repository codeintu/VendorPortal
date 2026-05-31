"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/navigation"

export type VendorSummary = {
  vendorId: string
  driveFolderId: string
  companyName: string
  billingAddress: string
  shippingAddress: string
  companyWebsite: string
  vendorCategory: string
  vendorType: string
  vendorTerms: string
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone: string
}

export type PurchaseOrder = {
  poNumber: string
  dateEntered: string
  dateScheduled: string
  dateReceived: string
  paymentDate: string
  totalAmount: string
  status: string
}

export type DashboardSummary = {
  counts: {
    activeOrders: number
    pendingInvoices: number
    closedOrders: number
  }
  recentOrders: PurchaseOrder[]
  sales: {
    monthly: SalesPoint[]
    yearly: SalesPoint[]
  }
}

export type SalesPoint = {
  label: string
  total: number
}

type DashboardDataContextValue = {
  vendorId: string | null
  vendorName: string | null
  vendorDriveFolderId: string | null
  summary: DashboardSummary | null
  summaryLoading: boolean
  summaryError: string | null
  orders: PurchaseOrder[]
  ordersLoading: boolean
  ordersError: string | null
  ordersPage: number
  ordersPageSize: number
  ordersHasNextPage: boolean
  ordersTotalCount: number
  loadOrders: (
    vendorId: string,
    page?: number,
    pageSize?: number,
    options?: {
      status?: string
      poNumber?: string
    }
  ) => Promise<void>
}

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null)

export function DashboardDataProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const ordersRequestRef = useRef(0)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [vendorName, setVendorName] = useState<string | null>(null)
  const [vendorDriveFolderId, setVendorDriveFolderId] = useState<string | null>(null)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersPageSize, setOrdersPageSize] = useState(10)
  const [ordersHasNextPage, setOrdersHasNextPage] = useState(false)
  const [ordersTotalCount, setOrdersTotalCount] = useState(0)

  useEffect(() => {
    const storedVendorId = window.localStorage.getItem("vendorId")
    const storedVendorName = window.localStorage.getItem("vendorName")
    const storedVendorDriveFolderId = window.localStorage.getItem("vendorDriveFolderId")

    if (!storedVendorId) {
      router.replace("/login")
      return
    }

    setVendorId(storedVendorId)
    setVendorName(storedVendorName)
    setVendorDriveFolderId(storedVendorDriveFolderId)
  }, [router])

  useEffect(() => {
    if (!vendorId) {
      return
    }

    let isActive = true

    const loadSummary = async () => {
      try {
        setSummaryLoading(true)
        setSummaryError(null)

        const response = await fetch(
          `/api/dashboard/summary?vendorId=${encodeURIComponent(vendorId)}`
        )
        const data = await response.json()

        if (!isActive) {
          return
        }

        if (response.ok && data.success) {
          setSummary(data.summary as DashboardSummary)
          return
        }

        setSummary(null)
        setSummaryError(data.error || "Failed to load dashboard summary")
      } catch (error) {
        if (!isActive) {
          return
        }

        setSummary(null)
        setSummaryError("An unexpected error occurred")
        console.error(error)
      } finally {
        if (isActive) {
          setSummaryLoading(false)
        }
      }
    }

    void loadSummary()

    return () => {
      isActive = false
    }
  }, [vendorId])

  const loadOrders = useCallback(async (
    currentVendorId: string,
    page = 1,
    pageSize = 10,
    options: {
      status?: string
      poNumber?: string
    } = {}
  ) => {
    if (!currentVendorId) {
      return
    }

    const requestId = ++ordersRequestRef.current
    setOrdersLoading(true)
    setOrdersError(null)
    setOrdersPage(page)
    setOrdersPageSize(pageSize)

    try {
      const params = new URLSearchParams({
        vendorId: currentVendorId,
        page: String(page),
        pageSize: String(pageSize),
      })

      if (options.status) {
        params.set("status", options.status)
      }

      if (options.poNumber) {
        params.set("poNumber", options.poNumber)
      }

      const response = await fetch(`/api/orders?${params.toString()}`)
      const data = await response.json()

      if (requestId !== ordersRequestRef.current) {
        return
      }

      if (response.ok && data.success) {
        setOrders(Array.isArray(data.orders) ? data.orders : [])
        setOrdersHasNextPage(Boolean(data.hasNextPage))
        const totalCount = Number(data.totalCount)
        setOrdersTotalCount(Number.isFinite(totalCount) ? totalCount : 0)
        return
      }

      setOrders([])
      setOrdersHasNextPage(false)
      setOrdersTotalCount(0)
      setOrdersError(data.error || "Failed to load orders")
    } catch (error) {
      if (requestId !== ordersRequestRef.current) {
        return
      }

      setOrders([])
      setOrdersHasNextPage(false)
      setOrdersTotalCount(0)
      setOrdersError("An unexpected error occurred")
      console.error(error)
    } finally {
      if (requestId === ordersRequestRef.current) {
        setOrdersLoading(false)
      }
    }
  }, [])

  const value = useMemo(
    () => ({
      vendorId,
      vendorName,
      vendorDriveFolderId,
      summary,
      summaryLoading,
      summaryError,
      orders,
      ordersLoading,
      ordersError,
      ordersPage,
      ordersPageSize,
      ordersHasNextPage,
      ordersTotalCount,
      loadOrders,
    }),
    [
      vendorId,
      vendorName,
      vendorDriveFolderId,
      summary,
      summaryLoading,
      summaryError,
      orders,
      ordersLoading,
      ordersError,
      ordersPage,
      ordersPageSize,
      ordersHasNextPage,
      ordersTotalCount,
      loadOrders,
    ]
  )

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  )
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext)

  if (!context) {
    throw new Error("useDashboardData must be used within a DashboardDataProvider")
  }

  return context
}
