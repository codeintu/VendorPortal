import { NextResponse } from 'next/server'
import { findVendorByCredentials } from '@/services/filemakerService'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // 1. Basic Validation
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid credentials. Email and password are required.' },
        { status: 400 }
      )
    }

    // 2. FileMaker Authentication Execution
    const vendorData = await findVendorByCredentials(email, password)

    if (!vendorData) {
      // 401: Valid request made to FM, but no records matched that email/password
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // Return the successful payload securely
    return NextResponse.json(
      {
        success: true,
        vendor: { 
          // We map what FileMaker returns back to the client.
          // Adjust these fields based on the exact casing in your FileMaker layout.
          email: vendorData.EmailAddress || email,
          name: vendorData.ContactName || vendorData.CompanyName || 'Vendor',
          vendorId: vendorData.ContactID || vendorData.VendorID || vendorData.VendorId || '',
          driveFolderId: vendorData.DriveFolderId || vendorData.driveFolderId || '',
          // DO NOT send WebPassword back down to the UI
        }
      },
      { status: 200 }
    )

  } catch (error: unknown) {
    console.error("Auth API Error:", error);
    // Handle malformed JSON or other unexpected request/FileMaker connection errors
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Malformed request body or server error' },
      { status: 500 }
    )
  }
}
