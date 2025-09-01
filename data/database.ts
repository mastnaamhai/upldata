
// FIX: Import AppData from types.ts where it is now defined to resolve compilation errors.
import type { Client, Invoice, LorryReceipt, Expense, Payment, AppData } from '../types';
import { 
    mockClients, 
    mockInvoices, 
    mockLRs, 
    mockExpenses, 
    mockPayments,
    mockUnbilledLRs
} from './mockData';

const DB_KEY = 'transpo-app-data';

// FIX: Removed local AppData interface definition as it has been moved to types.ts.

const getInitialData = (): AppData => ({
    clients: mockClients,
    invoices: mockInvoices,
    lrs: [...mockLRs, ...mockUnbilledLRs],
    expenses: mockExpenses,
    payments: mockPayments,
});

export const loadData = (): AppData => {
    try {
        const storedData = window.localStorage.getItem(DB_KEY);
        if (storedData) {
            return JSON.parse(storedData);
        } else {
            const initialData = getInitialData();
            saveData(initialData);
            return initialData;
        }
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        return getInitialData();
    }
};

export const saveData = (data: AppData): void => {
    try {
        const dataString = JSON.stringify(data);
        window.localStorage.setItem(DB_KEY, dataString);
    } catch (error) {
        console.error("Failed to save data to localStorage", error);
    }
};
