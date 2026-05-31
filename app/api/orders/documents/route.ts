import { NextResponse } from "next/server"
import { getOrderDocumentsForVendor } from "@/services/orderDocumentsService"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get("vendorId")
    const poNumber = searchParams.get("poNumber")

    if (!vendorId || !poNumber) {
      return NextResponse.json(
        { error: "Vendor ID and PO number are required" },
        { status: 400 }
      )
    }

    const documents = await getOrderDocumentsForVendor(vendorId, poNumber)

    if (!documents) {
      return NextResponse.json(
        { error: "Order document data not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, ...documents }, { status: 200 })
  } catch (error: unknown) {
    console.error("Order Documents API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch order documents" },
      { status: 500 }
    )
  }
}
