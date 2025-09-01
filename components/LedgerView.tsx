import React, { useState, useMemo, FormEvent, useEffect } from 'react';
import type { Invoice, Payment, Client, LedgerTransaction, AppSettings } from '../types';
import { FormRow, FormField, TextInput, DropdownInput, TextAreaInput } from './FormComponents';
import LedgerPDF from './LedgerPDF';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);

const defaultSettings: AppSettings = {
  theme: 'light',
  company: {
      companyName: 'ALL INDIA LOGISTICS CHENNAI',
      gstNumber: '33BKTPR6363P123',
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      address: 'No-51-C, Shri Balaji Nagar, Part-1 Extension, Puzhal Camp, Chennai-600066\nPhone: 9790700241 / 9003045541\nEmail: allindialogisticschennai@gmail.com\nWebsite: www.allindialogisticschennai.in',
      logo: '',
  }
};

const PaymentForm: React.FC<{
    clientId: string;
    onSave: (payment: Omit<Payment, 'id'>) => void;
    onCancel: () => void;
}> = ({ clientId, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        date: new Date().toLocaleDateString('en-CA'),
        amount: 0,
        mode: 'Bank' as 'Cash' | 'Bank' | 'Other',
        notes: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, clientId });
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg my-4 border dark:border-gray-600 animate-fade-in">
             <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Record New Payment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <FormRow>
                    <FormField label="Payment Date">
                        <TextInput type="date" name="date" value={formData.date} onChange={handleChange} required />
                    </FormField>
                    <FormField label="Amount">
                        <TextInput type="number" name="amount" value={formData.amount > 0 ? formData.amount : ''} onChange={handleChange} placeholder="0.00" required />
                    </FormField>
                </FormRow>
                 <FormField label="Payment Mode">
                    <DropdownInput name="mode" value={formData.mode} onChange={handleChange}>
                        <option value="Bank">Bank</option>
                        <option value="Cash">Cash</option>
                        <option value="Other">Other</option>
                    </DropdownInput>
                </FormField>
                <FormField label="Notes (Optional)">
                    <TextAreaInput name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="e.g. Part payment for INV-001" />
                </FormField>
                <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save Payment</button>
                </div>
            </form>
        </div>
    );
};

interface LedgerViewProps {
    selectedFy: string;
    clients: Client[];
    invoices: Invoice[];
    payments: Payment[];
    onSavePayment: (payment: Omit<Payment, 'id'>) => void;
}

const dateIsInFy = (dateStr: string, fyStr: string): boolean => {
    if (!dateStr || !fyStr) return false;
    const date = new Date(dateStr);
    const yearMatch = fyStr.match(/(\d{4})/);
    if (!yearMatch) return false;

    const startYear = parseInt(yearMatch[1], 10);
    const fyStart = new Date(`${startYear}-04-01`);
    const fyEnd = new Date(`${startYear + 1}-03-31`);

    return date >= fyStart && date <= fyEnd;
};


const LedgerView: React.FC<LedgerViewProps> = ({ selectedFy, clients, invoices, payments, onSavePayment }) => {
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    
    useEffect(() => {
        // Set default client only when clients are loaded and none is selected
        if (clients.length > 0 && !selectedClientId) {
            setSelectedClientId(clients[0].id);
        }
    }, [clients, selectedClientId]);
    
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    useEffect(() => {
        try {
            const item = window.localStorage.getItem('transpo-settings');
            if (item) setSettings(JSON.parse(item));
        } catch (error) { console.error("Failed to load settings", error); }
    }, []);

    const { transactions, totals, selectedClient } = useMemo(() => {
        if (!selectedClientId) return { transactions: [], totals: { totalBilled: 0, totalReceived: 0, balance: 0 }, selectedClient: null };

        const client = clients.find(c => c.id === selectedClientId) || null;
        const clientInvoices = invoices.filter(inv => inv.clientId === selectedClientId && dateIsInFy(inv.date, selectedFy));
        const clientPayments = payments.filter(pay => pay.clientId === selectedClientId && dateIsInFy(pay.date, selectedFy));

        const combined = [
            ...clientInvoices.map(inv => ({ ...inv, type: 'invoice' as const, debit: inv.invoiceValue, credit: 0 })),
            ...clientPayments.map(pay => ({ ...pay, type: 'payment' as const, debit: 0, credit: pay.amount }))
        ];

        combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let balance = 0;
        const processedTransactions: LedgerTransaction[] = combined.map(tx => {
            balance = balance + tx.debit - tx.credit;
            return { ...tx, balance };
        });
        
        const totalBilled = clientInvoices.reduce((sum, inv) => sum + inv.invoiceValue, 0);
        const totalReceived = clientPayments.reduce((sum, pay) => sum + pay.amount, 0);

        return {
            transactions: processedTransactions,
            totals: { totalBilled, totalReceived, balance: totalBilled - totalReceived },
            selectedClient: client
        };
    }, [selectedClientId, payments, invoices, selectedFy, clients]);
    
    const handleSavePayment = (paymentData: Omit<Payment, 'id'>) => {
        onSavePayment(paymentData);
        setShowPaymentForm(false);
    };

    if (showPreview && selectedClient) {
        return (
            <LedgerPDF 
                client={selectedClient}
                transactions={transactions}
                totals={totals}
                settings={settings}
                selectedFy={selectedFy}
                onBack={() => setShowPreview(false)}
            />
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Client Ledger</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">View detailed statements for each client.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <div className="flex items-center space-x-4">
                        <label htmlFor="client-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Client:</label>
                        <select
                            id="client-select"
                            value={selectedClientId}
                            onChange={e => setSelectedClientId(e.target.value)}
                            className="p-2 border rounded-md bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-200 text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>
                     <div className="flex items-center space-x-2">
                        {selectedClientId && !showPaymentForm && (
                            <button 
                                onClick={() => setShowPaymentForm(true)}
                                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-green-700"
                            >
                                Record Payment
                            </button>
                        )}
                         {selectedClientId && (
                             <button onClick={() => setShowPreview(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700">Preview Statement</button>
                         )}
                     </div>
                </div>
                
                {showPaymentForm && <div><PaymentForm clientId={selectedClientId} onSave={handleSavePayment} onCancel={() => setShowPaymentForm(false)} /></div>}

                {selectedClientId && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-center">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                                <h4 className="text-sm text-gray-500 dark:text-gray-400">Total Billed</h4>
                                <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(totals.totalBilled)}</p>
                            </div>
                             <div className="p-3 bg-green-50 dark:bg-green-900/50 rounded-lg">
                                <h4 className="text-sm text-gray-500 dark:text-gray-400">Total Received</h4>
                                <p className="text-xl font-bold text-green-700 dark:text-green-400">{formatCurrency(totals.totalReceived)}</p>
                            </div>
                             <div className="p-3 bg-red-50 dark:bg-red-900/50 rounded-lg">
                                <h4 className="text-sm text-gray-500 dark:text-gray-400">Outstanding Balance</h4>
                                <p className="text-xl font-bold text-red-700 dark:text-red-400">{formatCurrency(totals.balance)}</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Particulars</th>
                                        <th className="px-6 py-3 text-right">Debit</th>
                                        <th className="px-6 py-3 text-right">Credit</th>
                                        <th className="px-6 py-3 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx, index) => (
                                        <tr key={index} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600">
                                            <td className="px-6 py-4">{new Date(tx.date).toLocaleDateString('en-IN', { timeZone: 'UTC' })}</td>
                                            <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">
                                                {tx.type === 'invoice' ? `Invoice #${tx.id}` : `Payment Received (${tx.mode})`}
                                                {tx.type === 'payment' && tx.notes && <p className="text-xs text-gray-500 dark:text-gray-400">{tx.notes}</p>}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono">{tx.debit > 0 ? formatCurrency(tx.debit) : '-'}</td>
                                            <td className="px-6 py-4 text-right font-mono text-green-600">{tx.credit > 0 ? formatCurrency(tx.credit) : '-'}</td>
                                            <td className="px-6 py-4 text-right font-mono font-semibold">{formatCurrency(tx.balance)}</td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr><td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">No transactions for this client.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default LedgerView;