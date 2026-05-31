import { NextResponse } from 'next/server'
import { getVendorSummaryByVendorId } from '@/services/filemakerService'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      )
    }

    const profile = await getVendorSummaryByVendorId(vendorId)

    if (!profile) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, profile }, { status: 200 })
  } catch (error: unknown) {
    console.error('Vendor Profile API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch vendor profile' },
      { status: 500 }
    )
  }
}
