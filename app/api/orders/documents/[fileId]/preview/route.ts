import { NextResponse } from "next/server"
import { getDriveFileMediaResponse, getDriveFileMetadata } from "@/services/googleDriveService"

type RouteContext = {
  params: Promise<{
    fileId: string
  }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { fileId } = await context.params

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    const metadata = await getDriveFileMetadata(fileId)
    const mimeType = metadata.mimeType || ""
    const isDirectPreviewable = mimeType.startsWith("image/") || mimeType === "application/pdf"

    if (!isDirectPreviewable) {
      const previewTarget =
        metadata.webViewLink ||
        `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`

      return NextResponse.redirect(previewTarget)
    }

    const mediaResponse = await getDriveFileMediaResponse(fileId)

    if (!mediaResponse.ok || !mediaResponse.body) {
      return NextResponse.json(
        { error: "Failed to fetch file preview from Google Drive" },
        { status: 502 }
      )
    }

    const headers = new Headers()
    headers.set("Content-Type", metadata.mimeType || "application/octet-stream")
    headers.set("Content-Disposition", `inline; filename="${metadata.name || fileId}"`)
    headers.set("Cache-Control", "private, max-age=600")

    return new NextResponse(mediaResponse.body, {
      status: 200,
      headers,
    })
  } catch (error: unknown) {
    console.error("Order Document Preview API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to preview file" },
      { status: 500 }
    )
  }
}
