import type { Client, DocumentSummary, Outstanding, FinancialData, Invoice, LorryReceipt, Expense, Payment } from '../types';

export const mockClients: Client[] = [
  { id: '1', name: 'Mast Naam', contactPerson: 'Contact Personka Naam', phone: '9876543210', email: 'contact@mastnaam.com', gstin: '29ABCDE1234F1Z5', address: '123, Business Avenue, Bengaluru, India' },
  { id: '2', name: 'Another Co', contactPerson: 'John Doe', phone: '9988776655', email: 'john@another.co', gstin: '27FGHIJ5678K1Z4', address: '456, Commerce Street, Mumbai, India' },
  { id: '3', name: 'Random', contactPerson: 'Jane Smith', phone: '9123456789', email: 'jane@random.com', gstin: '07LMNOP9012Q1Z3', address: 'Add Keorl Iwold Jdk, Aambaliyasan, Gujarat, India - 218869' },
  { id: '4', name: 'Receiver Inc', contactPerson: 'Peter Jones', phone: '9000011111', email: 'peter@receiver.inc', gstin: '36STUVW1357P1Z9', address: '321, Receiving Rd, Pune, India' },
  { id: '5', name: 'End User', contactPerson: 'Mary Kom', phone: '9222233333', email: 'mary@enduser.com', gstin: '06XYZAB2468R1Z0', address: 'Sgdjxk Djxkck Cclkk, A.Thirumuruganpoondi, Tamil Nadu, Afghanistan - 313599' },
];

export const documentSummaries: DocumentSummary[] = [
  { name: 'Lorry Receipt', count: 4, amount: 250000.00 },
  { name: 'Truck Supplier Note', count: 1, amount: 0.00 },
  { name: 'Invoice', count: 4, amount: 275000.00 },
  { name: 'Transit Pass (Memo)', count: 0, amount: 0.00 },
];

export const mockInvoices: Invoice[] = [
  { 
    id: 'INV-001', date: '2025-08-26', clientId: '1', status: 'Pending',
    lrDetails: [{ id: '1', lrNumber: '3', date: '2025-08-25', truckNumber: 'DL-11N-2889', from: 'Delhi', to: 'Pilani', materialDetails: 'Bomb (Nos:100)', articles: 100, totalWeight: 1000, freightAmount: 50000, haltingCharge: 1000, extraCharge: 500, advance: 10000 }],
    discount: 0, gstRate: 5, tdsRate: 2, tdsDeduction: 1030, advanceReceived: 10000, advanceReceivedVia: 'Bank', roundOff: 0,
    gstPayableBy: 'Consignee', subTotal: 51500, totalTripAmount: 51500, invoiceValue: 54075, netPayable: 43045
  },
  { 
    id: 'INV-002', date: '2025-08-27', clientId: '2', status: 'Paid',
    lrDetails: [{ id: '2', lrNumber: '2', date: '2025-08-25', truckNumber: 'MH-01-1234', from: 'Mumbai', to: 'Pune', materialDetails: 'General Goods', articles: 50, totalWeight: 2000, freightAmount: 75000, haltingCharge: 0, extraCharge: 0, advance: 20000 }],
    discount: 5000, gstRate: 5, tdsRate: 0, tdsDeduction: 0, advanceReceived: 20000, advanceReceivedVia: 'Cash', roundOff: 0,
    gstPayableBy: 'Consignor', subTotal: 75000, totalTripAmount: 75000, invoiceValue: 73500, netPayable: 53500
  },
];

export const mockExpenses: Expense[] = [
    { id: '1', date: '2025-08-25', category: 'Fuel', description: 'Diesel for truck DL-11N-2889', amount: 15000, vehicleNumber: 'DL-11N-2889' },
    { id: '2', date: '2025-08-26', category: 'Toll', description: 'Delhi-Mumbai Expressway Toll', amount: 2500, vehicleNumber: 'MH-01-AB-1234' },
    { id: '3', date: '2025-07-28', category: 'Maintenance', description: 'Tyre replacement', amount: 22000, vehicleNumber: 'DL-11N-2889' },
    { id: '4', date: '2025-08-31', category: 'Salary', description: 'Driver salaries for August', amount: 80000 },
    { id: '5', date: '2025-08-01', category: 'Office Rent', description: 'Office rent for August', amount: 45000 },
];

export const mockPayments: Payment[] = [
    { id: '1', date: '2025-08-28', clientId: '2', amount: 75000, mode: 'Bank', notes: 'Full payment for invoice #2' },
    { id: '2', date: '2025-08-29', clientId: '1', amount: 20000, mode: 'Cash', notes: 'Part payment for invoice #1' },
    { id: '3', date: '2025-08-01', clientId: '1', amount: 30000, mode: 'Bank', notes: 'Payment for overdue invoice' },
];

const defaultFreightDetails = {
    basicFreight: 5000, packingCharge: 0, pickupCharge: 0, serviceCharge: 0,
    loadingCharge: 0, codDodCharge: 0, haltingCharge: 0, extraCharge: 0, otherCharges: 0, sgstPercent: 0, cgstPercent: 0, advancePaid: 0,
};

const defaultGoods = [{
    id: '1', productName: 'General Goods', packagingType: 'BOX', hsnCode: '996511',
    packages: 10, actualWeight: 1000, chargeWeight: 1000, freightRate: 5,
}];

export const mockUnbilledLRs: LorryReceipt[] = [
    { 
      id: 'ub1', lrNumber: 'UB-1', date: '2025-08-25', from: 'Delhi', to: 'Pilani', 
      consignorId: '1', consigneeId: '3', vehicleNumber: 'DL-11N-2889', 
      driverName: 'Ramesh Kumar', driverPhone: '9876543210',
      paymentStatus: 'Paid', status: 'Un-Billed', transportMode: 'By Road', deliveryType: 'Door',
      goods: defaultGoods, freightDetails: defaultFreightDetails, gstPayableBy: 'Consignee',
      demurrageAfterHours: 1, demurrageChargePerHour: 0,
      isPickupDeliverySameAsPartyAddress: true,
    },
];

export const mockLRs: LorryReceipt[] = [
     { 
      id: '4', lrNumber: '4', date: '2025-08-26', from: 'Delhi', to: 'Gujarat', 
      consignorId: '1', consigneeId: '3', vehicleNumber: 'GJ-01-XY-1234', 
      driverName: 'Suresh Patel', driverPhone: '9123456789',
      paymentStatus: 'Paid', status: 'Billed', transportMode: 'By Road', deliveryType: 'Door',
      goods: [{
          id: 'g1', productName: 'agarbatti', packagingType: 'BAGS', hsnCode: '330741',
          packages: 1000, actualWeight: 10000, chargeWeight: 11000, freightRate: 500000,
      }],
      freightDetails: {
          basicFreight: 5500000, packingCharge: 0, pickupCharge: 0, serviceCharge: 0,
          loadingCharge: 0, codDodCharge: 0, haltingCharge: 2000, extraCharge: 1000, otherCharges: 0, sgstPercent: 0, cgstPercent: 0, advancePaid: 50000,
      },
      gstPayableBy: 'Consignee', demurrageAfterHours: 1, demurrageChargePerHour: 0,
      otherRemark: 'Total amount of goods as per the invoice', bankName: 'State Bank', bankAccountNo: '1234567890', bankIfsc: 'SBIN0001234',
      isPickupDeliverySameAsPartyAddress: true,
    },
    { 
      id: '3', lrNumber: '3', date: '2025-08-25', from: 'Delhi', to: 'Pilani', 
      consignorId: '1', consigneeId: '3', vehicleNumber: 'DL-11N-2889', 
      driverName: 'Amit Singh', driverPhone: '9988776655',
      paymentStatus: 'Paid', status: 'Billed', transportMode: 'By Road', deliveryType: 'Door',
      goods: defaultGoods, freightDetails: {...defaultFreightDetails, basicFreight: 50000, advancePaid: 10000, haltingCharge: 1000, extraCharge: 500}, gstPayableBy: 'Consignee',
      demurrageAfterHours: 1, demurrageChargePerHour: 0,
      isPickupDeliverySameAsPartyAddress: true,
    },
    { 
      id: '2', lrNumber: '2', date: '2025-08-25', from: 'Mumbai', to: 'Pune', 
      consignorId: '2', consigneeId: '4', vehicleNumber: 'MH-01-1234', 
      driverName: 'Vijay More', driverPhone: '9000011111',
      paymentStatus: 'To Pay', status: 'Billed', transportMode: 'By Road', deliveryType: 'Door',
      goods: defaultGoods, freightDetails: {...defaultFreightDetails, basicFreight: 75000, advancePaid: 20000}, gstPayableBy: 'Consignee',
      demurrageAfterHours: 1, demurrageChargePerHour: 0,
      isPickupDeliverySameAsPartyAddress: true,
    },
];