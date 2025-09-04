
export type NavItem = 
  | 'dashboard'
  | 'lorryReceipt'
  | 'invoice'
  | 'customerLedger'
  | 'clients'
  | 'expenses'
  | 'settings';

export interface DocumentSummary {
  name: string;
  count: number;
  amount: number;
}

export interface Outstanding {
  name: string;
  amount: number;
}

export interface FinancialData {
  month: string;
  revenue: number;
  expenses: number;
}

export interface LrDetail {
  id: string;
  lrNumber: string;
  date: string;
  truckNumber: string;
  from: string;
  to: string;
  materialDetails: string;
  articles?: number;
  totalWeight: number; // in kgs
  freightAmount: number;
  haltingCharge?: number;
  extraCharge?: number;
  advance?: number;
}

export interface Invoice {
  id: string; // This will be the invoice number like 'INV-001'
  date: string;
  clientId: string;
  
  lrDetails: LrDetail[];

  // Calculation fields
  discount: number;
  gstRate: number; // e.g., 5 for 5%
  tdsRate: number; // e.g., 2 for 2%
  tdsDeduction: number;
  advanceReceived: number;
  advanceReceivedVia?: 'Cash' | 'Bank' | 'Other';
  roundOff: number;

  // Optional details from form
  hsnCode?: string;
  remarks?: string;
  bankDetails?: {
      accountHolderName: string;
      bankName: string;
      accountNumber: string;
      ifscCode: string;
  };
  gstPayableBy: 'Consignor' | 'Consignee' | 'Transporter';

  // Calculated totals (will be stored for record keeping)
  subTotal: number;
  totalTripAmount: number;
  invoiceValue: number;
  netPayable: number;
  
  status: 'Pending' | 'Paid' | 'Overdue';
}



export type LrStatus = 'Booked' | 'Dispatched' | 'In Transit' | 'Delivered' | 'Closed';

export type LrBookingData = Pick<LorryReceipt,
  | 'consignor_name'
  | 'consignee_name'
  | 'origin_location'
  | 'destination_location'
  | 'goods_description'
  | 'quantity'
  | 'weight'
  | 'freight_type'
  | 'freight_amount'
  | 'hide_freight_in_pdf'
>;

export type NewLrPayload = LrBookingData & {
  lr_number: string;
  booking_time: string;
  status: 'Booked';
};

export interface LorryReceipt {
  id: string; // Corresponds to mongoose _id
  lr_number: string;

  // Phase 1: Booking
  consignor_name: string;
  consignee_name: string;
  goods_description: string;
  quantity: number;
  weight: number;
  origin_location: string;
  destination_location: string;
  freight_type: 'Paid' | 'Due';
  freight_amount?: number;
  hide_freight_in_pdf: boolean;
  booking_time: string; // ISO 8601 Date string

  // Phase 2: Dispatch
  vehicle_number?: string;
  driver_name?: string;
  dispatch_time?: string; // ISO 8601 Date string

  // Phase 3: In Transit
  current_location?: string;
  transit_updates?: { location: string; timestamp: string }[];

  // Phase 4: Delivery
  proof_of_delivery?: string; // Path to signature or image file
  delivery_time?: string; // ISO 8601 Date string

  // Phase 5: Closure
  closure_time?: string; // ISO 8601 Date string

  status: LrStatus;
}

export type LorryReceiptCopyType = 'Consigner' | 'Consignee' | 'Driver' | 'Office';

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  phone?: string;
  email: string;
  gstin: string;
  address: string;
}

export interface GstDetails {
    legalName: string;
    tradeName: string;
    address: string;
}

export type ExpenseCategory = 'Fuel' | 'Salary' | 'Office Rent' | 'Maintenance' | 'Toll' | 'Other';
export interface Expense {
  id:string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  vehicleNumber?: string;
}

export interface Payment {
    id: string;
    date: string;
    clientId: string;
    amount: number;
    mode: 'Cash' | 'Bank' | 'Other';
    notes?: string;
}

export interface CompanySettings {
  companyName: string;
  gstNumber: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  address: string;
  logo: string; // base64 string
}

export interface AppData {
    clients: Client[];
    invoices: Invoice[];
    lrs: LorryReceipt[];
    expenses: Expense[];
    payments: Payment[];
}

export interface AppSettings {
  company: CompanySettings;
  theme: 'light' | 'dark';
}

export type LedgerTransaction = (
    (Invoice & { type: 'invoice'; debit: number; credit: number }) |
    (Payment & { type: 'payment'; debit: number; credit: number })
) & { balance: number };
