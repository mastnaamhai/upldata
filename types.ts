
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


export interface GoodsItem {
  id: string;
  productName: string;
  packagingType: string;
  hsnCode: string;
  packages: number;
  actualWeight: number;
  chargeWeight: number;
  freightRate: number;
}

export interface FreightDetails {
  basicFreight: number;
  packingCharge: number;
  pickupCharge: number;
  serviceCharge: number;
  loadingCharge: number;
  codDodCharge: number;
  haltingCharge?: number;
  extraCharge?: number;
  otherCharges: number;
  sgstPercent: number;
  cgstPercent: number;
  advancePaid: number;
}

export interface LorryReceipt {
  id: string;
  lrNumber: string;
  date: string;
  from: string;
  to: string;
  consignorId: string;
  consigneeId: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  paymentStatus: 'Paid' | 'To Pay' | 'Part Paid';
  transportMode: string;
  deliveryType: string;
  goods: GoodsItem[];
  freightDetails: FreightDetails;
  gstPayableBy: 'Consignor' | 'Consignee';
  otherRemark?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  demurrageAfterHours: number;
  demurrageChargePerHour: number;
  receiverComments?: string;
  status: 'Billed' | 'Un-Billed';
  isPickupDeliverySameAsPartyAddress: boolean;
  loadingAddress?: string;
  deliveryAddress?: string;
  includeFreightDetails: boolean;
}

export type LorryReceiptCopyType = 'Consigner' | 'Consignee' | 'Driver' | 'Office';

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
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
