import { NextResponse } from 'next/server';
import { getVendorPOs } from '@/services/filemakerService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.max(1, Number.parseInt(searchParams.get('pageSize') || '10', 10) || 10);
    const status = searchParams.get('status') || undefined;
    const poNumber = searchParams.get('poNumber') || undefined;

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const pagedOrders = await getVendorPOs(vendorId, page, pageSize, {
      status,
      poNumber,
    });

    return NextResponse.json({ success: true, ...pagedOrders }, { status: 200 });
  } catch (error: unknown) {
    console.error('Orders API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}
