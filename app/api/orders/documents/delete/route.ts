import { NextResponse } from "next/server"
import { deleteOrderDocument } from "@/services/orderDocumentDeleteService"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const vendorId = body?.vendorId
    const poNumber = body?.poNumber
    const fileId = body?.fileId

    if (
      typeof vendorId !== "string" ||
      typeof poNumber !== "string" ||
      typeof fileId !== "string"
    ) {
      return NextResponse.json(
        { error: "Vendor ID, PO number, and file ID are required" },
        { status: 400 }
      )
    }

    await deleteOrderDocument({ vendorId, poNumber, fileId })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: unknown) {
    console.error("Order Document Delete API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete order document" },
      { status: 500 }
    )
  }
}
