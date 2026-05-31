import { NextResponse } from 'next/server'
import { getDashboardSummary } from '@/services/filemakerService'

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

    const summary = await getDashboardSummary(vendorId)

    return NextResponse.json({ success: true, summary }, { status: 200 })
  } catch (error: unknown) {
    console.error('Dashboard Summary API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard summary' },
      { status: 500 }
    )
  }
}
