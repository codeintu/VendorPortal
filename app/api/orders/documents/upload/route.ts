import { NextResponse } from "next/server"
import { uploadOrderDocument } from "@/services/orderDocumentUploadService"
import { isPurchaseOrderClosed } from "@/services/filemakerService"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const vendorId = formData.get("vendorId")
    const poNumber = formData.get("poNumber")
    const documentType = formData.get("documentType")
    const file = formData.get("file")

    if (
      typeof vendorId !== "string" ||
      typeof poNumber !== "string" ||
      typeof documentType !== "string" ||
      !(file instanceof File)
    ) {
      return NextResponse.json(
        { error: "Vendor ID, PO number, document type, and file are required" },
        { status: 400 }
      )
    }

    if (await isPurchaseOrderClosed(vendorId, poNumber)) {
      return NextResponse.json(
        { error: "This order is closed and can no longer be modified." },
        { status: 409 }
      )
    }

    const result = await uploadOrderDocument({
      vendorId,
      poNumber,
      documentType,
      file,
    })

    return NextResponse.json({ success: true, result }, { status: 200 })
  } catch (error: unknown) {
    console.error("Order Document Upload API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload order document" },
      { status: 500 }
    )
  }
}
