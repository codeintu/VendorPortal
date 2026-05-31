import { FILEMAKER_LAYOUTS } from '@/config/filemaker';

/**
 * FileMaker Data API Centralized Service
 * Abstracted to handle session tokens and queries without leaking credentials to the UI.
 */

// Cache the bearer token in memory to avoid redundant authentication requests
let cachedToken: string | null = null;

type PurchaseOrderRecord = {
  poNumber: string;
  orderPlacedBy: string;
  dateEntered: string;
  deliveredVia: string;
  dateScheduled: string;
  dateReceived: string;
  freightType: string;
  freightOnBoard: string;
  vendorContractNumber: string;
  shippingTo: string;
  category: string;
  paidType: string;
  prePaidPercent: string;
  companyName: string;
  personName: string;
  address: string;
  mainPhone: string;
  secondPhone: string;
  paymentDate: string;
  totalAmount: string;
  status: string;
};

type OrderLineItemRecord = {
  itemNo: string;
  productName: string;
  unitType: string;
  actualPurchQty: string;
  qtyReceived: string;
  invoicedAmount: string;
  serialNo: string;
};

type PurchaseOrderDetails = {
  header: PurchaseOrderRecord | null;
  lineItems: OrderLineItemRecord[];
};

type VendorSummaryRecord = {
  vendorId: string;
  driveFolderId: string;
  companyName: string;
  billingAddress: string;
  shippingAddress: string;
  companyWebsite: string;
  vendorCategory: string;
  vendorType: string;
  vendorTerms: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
};

type DashboardSummary = {
  counts: {
    activeOrders: number;
    pendingInvoices: number;
    closedOrders: number;
  };
  recentOrders: PurchaseOrderRecord[];
  sales: {
    monthly: SalesPoint[];
    yearly: SalesPoint[];
  };
};

type SalesPoint = {
  label: string;
  total: number;
};

type PagedPurchaseOrders = {
  orders: PurchaseOrderRecord[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
};

type FileMakerFindResponse = {
  data?: Array<{
    fieldData?: Record<string, unknown>;
  }>;
  dataInfo?: Record<string, unknown>;
};

type PurchaseOrderQueryOptions = {
  status?: string;
  poNumber?: string;
};

/**
 * Helper to construct the base URL from the environment
 */
const getBaseUrl = () => {
  const host = process.env.FILEMAKER_HOST;
  const db = process.env.FILEMAKER_DATABASE;

  if (!host || !db) {
    throw new Error('Missing FileMaker server configuration in environment.');
  }

  // Format: https://host/fmi/data/vLatest/databases/db
  return `${host}/fmi/data/vLatest/databases/${encodeURIComponent(db)}`;
};

const normalizeFieldValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

const normalizeStatusKey = (status: string) => status.trim().toLowerCase();

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pickFieldValue = (fieldData: Record<string, unknown>, candidates: string[]) => {
  for (const candidate of candidates) {
    const value = normalizeFieldValue(fieldData[candidate]);
    if (value) {
      return value;
    }
  }

  return '';
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

const parseUSDate = (value: string) => {
  const normalizedValue = normalizeFieldValue(value);
  if (!normalizedValue) {
    return null;
  }

  const [monthValue, dayValue, yearValue] = normalizedValue.split('/');
  const month = Number(monthValue);
  const day = Number(dayValue);
  const year = Number(yearValue);

  if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseAmount = (value: string) => {
  const numericValue = Number(normalizeFieldValue(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const getOrderSalesDate = (order: PurchaseOrderRecord) => (
  parseUSDate(order.dateReceived) ?? parseUSDate(order.dateEntered)
);

const buildSalesSummary = (orders: PurchaseOrderRecord[]) => {
  const monthlyTotals = new Map<string, number>();
  const yearlyTotals = new Map<string, number>();
  const now = new Date();

  for (let monthOffset = 11; monthOffset >= 0; monthOffset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyTotals.set(key, 0);
  }

  orders.forEach((order) => {
    const salesDate = getOrderSalesDate(order);
    if (!salesDate) {
      return;
    }

    const amount = parseAmount(order.totalAmount);
    const monthlyKey = `${salesDate.getFullYear()}-${String(salesDate.getMonth() + 1).padStart(2, '0')}`;
    const yearlyKey = String(salesDate.getFullYear());

    if (monthlyTotals.has(monthlyKey)) {
      monthlyTotals.set(monthlyKey, (monthlyTotals.get(monthlyKey) ?? 0) + amount);
    }

    yearlyTotals.set(yearlyKey, (yearlyTotals.get(yearlyKey) ?? 0) + amount);
  });

  const monthly = Array.from(monthlyTotals.entries()).map(([key, total]) => {
    const [yearValue, monthValue] = key.split('-');
    const monthIndex = Number(monthValue) - 1;

    return {
      label: `${MONTH_NAMES[monthIndex]} ${yearValue.slice(-2)}`,
      total: Number(total.toFixed(2)),
    };
  });

  const yearly = Array.from(yearlyTotals.entries())
    .sort(([leftYear], [rightYear]) => Number(leftYear) - Number(rightYear))
    .map(([label, total]) => ({
      label,
      total: Number(total.toFixed(2)),
    }));

  return {
    monthly,
    yearly,
  };
};

/**
 * Authenticate with FileMaker Data API to retrieve a session token.
 */
const getAuthToken = async (forceRefresh = false): Promise<string> => {
  if (cachedToken && !forceRefresh) {
    return cachedToken;
  }

  const username = process.env.FILEMAKER_API_USERNAME;
  const password = process.env.FILEMAKER_API_PASSWORD;

  if (!username || !password) {
    throw new Error('Missing FileMaker API credentials.');
  }

  // FileMaker requires Basic Auth (base64 encoded username:password)
  const base64Credentials = Buffer.from(`${username}:${password}`).toString('base64');

  const response = await fetch(`${getBaseUrl()}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${base64Credentials}`,
    },
    // Next.js specific: do not cache this raw authentication call
    cache: 'no-store',
  });

  const data = await response.json();

  if (!response.ok || data.messages[0].code !== '0') {
    throw new Error(`Failed to authenticate with FileMaker: ${data.messages[0].message}`);
  }

  cachedToken = data.response.token;
  return cachedToken as string;
};

/**
 * Generic wrapper to send requests to FileMaker layouts, automatically handling token injection and 401 retries.
 */
const fetchFM = async (
  layout: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  payload?: unknown
): Promise<FileMakerFindResponse> => {
  let token = await getAuthToken();
  const url = `${getBaseUrl()}/layouts/${encodeURIComponent(layout)}/_find`;

  // Internal helper to perform the actual fetch
  const doFetch = async (currentToken: string) => {
    return fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`,
      },
      body: payload ? JSON.stringify(payload) : undefined,
      cache: 'no-store',
    });
  };

  let response = await doFetch(token);

  // If unauthorized, the token likely expired. Force a refresh and try exactly once more.
  if (response.status === 401) {
    console.warn('FileMaker token expired, refreshing...');
    token = await getAuthToken(true);
    response = await doFetch(token);
  }

  const data = await response.json();

  // FileMaker uses code '0' for true success, and '401' for no records found (which we shouldn't universally throw on, but handle gracefully)
  if (!response.ok) {
    throw new Error(`FileMaker API Error: ${response.status} - ${data.messages?.[0]?.message || 'Unknown error'}`);
  }

  return data.response;
};

const mapPurchaseOrderRecord = (fieldData: Record<string, unknown>): PurchaseOrderRecord => ({
  poNumber: normalizeFieldValue(fieldData.PONumber),
  orderPlacedBy: pickFieldValue(fieldData, ['StaffName_Buyer']),
  dateEntered: normalizeFieldValue(fieldData.DateEntered),
  deliveredVia: pickFieldValue(fieldData, ['ShipVia']),
  dateScheduled: normalizeFieldValue(fieldData.DateScheduledArrival),
  dateReceived: normalizeFieldValue(fieldData.DateReceived),
  freightType: pickFieldValue(fieldData, ['FreightType']),
  freightOnBoard: pickFieldValue(fieldData, ['FreightOnBoard']),
  vendorContractNumber: pickFieldValue(fieldData, ['Reference']),
  shippingTo: pickFieldValue(fieldData, ['ShippingTo', 'ShipTo', 'Ship To']),
  category: pickFieldValue(fieldData, ['PO.Category', 'POCategory']),
  paidType: pickFieldValue(fieldData, ['PaidType', 'Paid Type']),
  prePaidPercent: pickFieldValue(fieldData, ['PrePaid.%', 'PrePaid']),
  companyName: pickFieldValue(fieldData, ['ContactName_DropShip']),
  personName: pickFieldValue(fieldData, ['ContactName']),
  address: pickFieldValue(fieldData, ['ContactName_DropShipOneTime']),
  mainPhone: pickFieldValue(fieldData, ['ContactID_DropShipMainPhone']),
  secondPhone: pickFieldValue(fieldData, ['ContactID_DropShip2ndPhone']),
  paymentDate: normalizeFieldValue(fieldData.PaymentDate),
  totalAmount: normalizeFieldValue(fieldData.Total_cn),
  status: normalizeFieldValue(fieldData.Status),
});

const mapLineItemRecord = (fieldData: Record<string, unknown>): OrderLineItemRecord => ({
  itemNo: pickFieldValue(fieldData, ['ItemNo']),
  productName: pickFieldValue(fieldData, ['ProductName']),
  unitType: pickFieldValue(fieldData, ['UnitType']),
  actualPurchQty: pickFieldValue(fieldData, ['ActualPurch_Qty']),
  qtyReceived: pickFieldValue(fieldData, ['Mli_POM__LineIdSerial_LineNo::Qty_Received']),
  invoicedAmount: pickFieldValue(fieldData, ['InvoicedAmount']),
  serialNo: pickFieldValue(fieldData, ['SerialNo']),
});

/**
 * Attempt to find a vendor by their email and password combination natively in FileMaker.
 */
export const findVendorByCredentials = async (email: string, password: string) => {
  const payload = {
    query: [
      {
        EmailAddress: `=="${email}"`,
        WebPassword: `=="${password}"`,
        ContactType: `=="Vendor"`
      }
    ],
    limit: 1
  };

  try {
    const response = await fetchFM(FILEMAKER_LAYOUTS.vendors, 'POST', payload);
    if (response.data && response.data.length > 0) {
      return response.data[0].fieldData;
    }
    return null; // Valid request, but no match found
  } catch (error: unknown) {
    // 401 in FileMaker Data API _find means "No Records Match The Request"
    if (getErrorMessage(error).includes('401')) return null;
    throw error;
  }
};

/**
 * Retrieve specialized details for a specific Vendor Record ID.
 */
export const getVendorDetails = async (vendorRecordId: string) => {
  // Utilizing the internal FileMaker Record ID to fetch exact details
  let token = await getAuthToken();
  const url = `${getBaseUrl()}/layouts/${encodeURIComponent(FILEMAKER_LAYOUTS.vendors)}/records/${encodeURIComponent(vendorRecordId)}`;

  let response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (response.status === 401) {
    token = await getAuthToken(true);
    response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.messages?.[0]?.message || 'Failed to get vendor details');

  return data.response.data[0];
};

/**
 * Execute a paged find to get purchase orders for a vendor.
 */
export const getVendorPOs = async (
  vendorId: string,
  page = 1,
  pageSize = 10,
  options: PurchaseOrderQueryOptions = {}
): Promise<PagedPurchaseOrders> => {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 10;
  const offset = (safePage - 1) * safePageSize + 1;
  const query: Record<string, string> = {
    VendorID: `=="${vendorId}"`,
  };

  if (options.status && options.status !== "All") {
    query.Status = `=="${options.status}"`;
  }

  const searchTerm = normalizeFieldValue(options.poNumber);
  if (searchTerm) {
    query.PONumber = `*${searchTerm}*`;
  }

  const payload = {
    query: [query],
    sort: [{ fieldName: 'DateEntered', sortOrder: 'descend' }],
    limit: safePageSize,
    offset,
  };

  try {
    const response = await fetchFM(FILEMAKER_LAYOUTS.purchaseOrders, 'POST', payload);
    if (!response.data) {
      return {
        orders: [],
        page: safePage,
        pageSize: safePageSize,
        totalCount: 0,
        hasNextPage: false,
      };
    }

    const orders = response.data.map((record: { fieldData?: Record<string, unknown> }): PurchaseOrderRecord => {
      const fieldData = record.fieldData ?? {};

      return mapPurchaseOrderRecord(fieldData);
    });
    const dataInfo = (response as { dataInfo?: Record<string, unknown> }).dataInfo ?? {};
    const totalCount = Number(
      normalizeFieldValue(dataInfo.foundCount ?? dataInfo.totalRecordCount ?? dataInfo.returnedCount)
    );
    const resolvedTotalCount = Number.isFinite(totalCount) && totalCount >= 0 ? totalCount : 0;

    return {
      orders,
      page: safePage,
      pageSize: safePageSize,
      totalCount: resolvedTotalCount,
      hasNextPage:
        resolvedTotalCount > 0
          ? safePage * safePageSize < resolvedTotalCount
          : orders.length === safePageSize,
    };
  } catch (error: unknown) {
    if (getErrorMessage(error).includes('401')) {
      return {
        orders: [],
        page: safePage,
        pageSize: safePageSize,
        totalCount: 0,
        hasNextPage: false,
      };
    }
    throw error;
  }
};

export const getVendorPOByNumber = async (vendorId: string, poNumber: string) => {
  const payload = {
    query: [
      {
        VendorID: `=="${vendorId}"`,
        PONumber: `=="${poNumber}"`
      }
    ],
    limit: 1
  };

  try {
    const response = await fetchFM(FILEMAKER_LAYOUTS.purchaseOrders, 'POST', payload);
    if (!response.data || response.data.length === 0) {
      return null;
    }

    const fieldData: Record<string, unknown> = response.data[0].fieldData ?? {};
    return mapPurchaseOrderRecord(fieldData);
  } catch (error: unknown) {
    if (getErrorMessage(error).includes('401')) return null;
    throw error;
  }
};

export const getPurchaseOrderLineItems = async (poNumber: string) => {
  const payload = {
    query: [
      { PONumber: `=="${poNumber}"` }
    ]
  };

  try {
    const response = await fetchFM(FILEMAKER_LAYOUTS.lineItems, 'POST', payload);
    if (!response.data) {
      return [];
    }

    return response.data.map((record: { fieldData?: Record<string, unknown> }) => {
      const fieldData = record.fieldData ?? {};
      return mapLineItemRecord(fieldData);
    });
  } catch (error: unknown) {
    if (getErrorMessage(error).includes('401')) return [];
    throw error;
  }
};

export const getPurchaseOrderDetails = async (vendorId: string, poNumber: string): Promise<PurchaseOrderDetails | null> => {
  const [header, lineItems] = await Promise.all([
    getVendorPOByNumber(vendorId, poNumber),
    getPurchaseOrderLineItems(poNumber),
  ]);

  if (!header) {
    return null;
  }

  return {
    header,
    lineItems,
  };
};

const getAllVendorPOs = async (vendorId: string): Promise<PurchaseOrderRecord[]> => {
  const pageSize = 1000;
  let page = 1;
  const allOrders: PurchaseOrderRecord[] = [];

  while (true) {
    const pagedOrders = await getVendorPOs(vendorId, page, pageSize);
    allOrders.push(...pagedOrders.orders);

    if (!pagedOrders.hasNextPage) {
      break;
    }

    page += 1;
  }

  return allOrders;
};

export const getVendorSummaryByVendorId = async (vendorId: string): Promise<VendorSummaryRecord | null> => {
  const payload = {
    query: [
      { ContactID: `=="${vendorId}"` }
    ],
    limit: 1
  };
 
  try {
    const response = await fetchFM(FILEMAKER_LAYOUTS.vendors, 'POST', payload);
    if (!response.data || response.data.length === 0) {
      return null;
    }

    const fieldData: Record<string, unknown> = response.data[0].fieldData ?? {};
    // console.log(fieldData)

    return {
      vendorId: normalizeFieldValue(fieldData.USSMID),
      driveFolderId: normalizeFieldValue(fieldData.DriveFolderId),
      companyName: normalizeFieldValue(fieldData.ContactName),
      billingAddress: normalizeFieldValue(fieldData["Con_LOC__ContactIDBillTo_LocationKey_mp::AddressBlock_C"]),
      shippingAddress: normalizeFieldValue(fieldData["Con_LOC__ContactIDShipTo_LocationKey_mp::AddressBlock_C"]),
      companyWebsite: pickFieldValue(fieldData, ['Website', 'WebSite', 'URL', 'ContactWebsite', 'ContactWebSite']),
      vendorCategory: normalizeFieldValue(fieldData['Con_CMT__ContactID::VendorType']),
      vendorType: normalizeFieldValue(fieldData['Con_CMT__ContactID::SpiceOrder']),
      vendorTerms: normalizeFieldValue(fieldData['Con_CMT__ContactID::VendorTermDays']),
      primaryContactName: normalizeFieldValue(fieldData.PersonNameFull),
      primaryContactEmail: normalizeFieldValue(fieldData.EmailAddress),
      primaryContactPhone: normalizeFieldValue(fieldData.MainPhone),
    };
  } catch (error: unknown) {
    if (getErrorMessage(error).includes('401')) return null;
    throw error;
  }
};

export const getDashboardSummary = async (vendorId: string): Promise<DashboardSummary> => {
  const purchaseOrders = await getAllVendorPOs(vendorId);

  const activeOrders = purchaseOrders.filter((order) => normalizeStatusKey(order.status) === 'open').length;
  const pendingInvoices = purchaseOrders.filter((order) => normalizeStatusKey(order.status) === 'ap pending').length;
  const closedOrders = purchaseOrders.filter((order) => normalizeStatusKey(order.status) === 'closed').length;

  return {
    counts: {
      activeOrders,
      pendingInvoices,
      closedOrders,
    },
    recentOrders: purchaseOrders.slice(0, 5),
    sales: buildSalesSummary(purchaseOrders),
  };
};
