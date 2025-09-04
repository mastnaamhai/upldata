import { AppData, Client, Invoice, LorryReceipt, Expense, Payment } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'https://upldata.onrender.com';

const apiFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        // Handle no content response for DELETE requests
        if (response.status === 204) {
             return null as T;
        }
        return response.json();
    } catch (error) {
        console.error(`API call to ${endpoint} failed:`, error);
        alert(`An error occurred while communicating with the server: ${error.message}. Please ensure the backend server is running.`);
        throw error;
    }
};

// --- API Functions ---

export const getAppData = async (): Promise<AppData> => {
    return apiFetch<AppData>('/data');
};

export const saveClient = async (clientData: Client): Promise<Client> => {
    return apiFetch<Client>('/clients', {
        method: 'POST',
        body: JSON.stringify(clientData),
    });
};

export const deleteClient = async (clientId: string): Promise<void> => {
    await apiFetch(`/clients/${clientId}`, { method: 'DELETE' });
};

export const saveInvoice = async (invoice: Invoice): Promise<{ updatedInvoice: Invoice; updatedLrs: LorryReceipt[] }> => {
    return apiFetch<{ updatedInvoice: Invoice; updatedLrs: LorryReceipt[] }>('/invoices', {
        method: 'POST',
        body: JSON.stringify(invoice),
    });
};

export const deleteInvoice = async (invoiceId: string): Promise<{ updatedLrs: LorryReceipt[] }> => {
    return apiFetch<{ updatedLrs: LorryReceipt[] }>(`/invoices/${invoiceId}`, { method: 'DELETE' });
};

export const saveLR = async (lr: LorryReceipt): Promise<LorryReceipt> => {
    const lrToSend = JSON.parse(JSON.stringify(lr));

    // To prevent any validation errors from temporary frontend fields (like temporary IDs),
    // we rebuild the goods array, only including fields defined in the backend schema.
    // This is a safer "whitelisting" approach.
    if (lrToSend.goods) {
        lrToSend.goods = lrToSend.goods.map((item: any) => {
            const newItem: any = {
                productName: item.productName,
                packagingType: item.packagingType,
                hsnCode: item.hsnCode,
                packages: item.packages,
                actualWeight: item.actualWeight,
                chargeWeight: item.chargeWeight,
            };
            // If it's an existing item with a valid DB id, we preserve it by mapping it to `_id`.
            // The backend expects `_id` for updates.
            if (item.id && typeof item.id === 'string' && item.id.length === 24) {
                newItem._id = item.id;
            }
            return newItem;
        });
    }

    return apiFetch<LorryReceipt>('/lrs', {
        method: 'POST',
        body: JSON.stringify(lrToSend),
    });
};

export const deleteLR = async (lrId: string): Promise<void> => {
    await apiFetch(`/lrs/${lrId}`, { method: 'DELETE' });
};

export const saveExpense = async (expense: Expense): Promise<Expense> => {
    return apiFetch<Expense>('/expenses', {
        method: 'POST',
        body: JSON.stringify(expense),
    });
};

export const deleteExpense = async (expenseId: string): Promise<void> => {
    await apiFetch(`/expenses/${expenseId}`, { method: 'DELETE' });
};

import { GstDetails } from '../types';

export const savePayment = async (paymentData: Omit<Payment, 'id'>): Promise<Payment> => {
    return apiFetch<Payment>('/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
    });
};

export const getGstDetails = async (gstin: string): Promise<GstDetails> => {
    return apiFetch<GstDetails>(`/gst/${gstin}`);
};
