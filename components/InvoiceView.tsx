import React, { useState, FormEvent, useMemo, useEffect } from 'react';
import type { Invoice, LorryReceipt, Client, LrDetail, AppSettings } from '../types';
import { SearchIcon, ChevronDownIcon, TrashIcon, InfoIcon } from './icons';
import { FormRow, FormField, TextInput, DropdownInput, TextAreaInput } from './FormComponents';
import InvoicePDF from './InvoicePDF';

type ViewState = 'list' | 'form' | 'preview';
type FormTab = 'fromLR' | 'withoutLR';

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

interface InvoiceViewProps {
    selectedFy: string;
    clients: Client[];
    invoices: Invoice[];
    unbilledLRs: LorryReceipt[];
    onSave: (invoice: Invoice) => void;
    onDelete: (invoiceId: string) => void;
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

const newInvoiceTemplate: Omit<Invoice, 'id'> = {
    date: new Date().toLocaleDateString('en-CA'),
    clientId: '',
    lrDetails: [{ id: Date.now().toString(), lrNumber: '', date: new Date().toLocaleDateString('en-CA'), truckNumber: '', from: '', to: '', materialDetails: '', articles: 0, totalWeight: 0, freightAmount: 0, haltingCharge: 0, extraCharge: 0, advance: 0 }],
    discount: 0,
    gstRate: 5,
    tdsRate: 0,
    tdsDeduction: 0,
    advanceReceived: 0,
    advanceReceivedVia: 'Bank',
    roundOff: 0,
    gstPayableBy: 'Consignee',
    bankDetails: { accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '' },
    hsnCode: '',
    remarks: '',
    subTotal: 0,
    totalTripAmount: 0,
    invoiceValue: 0,
    netPayable: 0,
    status: 'Pending',
};


const InvoiceView: React.FC<InvoiceViewProps> = ({ selectedFy, clients, invoices, unbilledLRs, onSave, onDelete }) => {
    const [viewState, setViewState] = useState<ViewState>('list');
    const [formTab, setFormTab] = useState<FormTab>('fromLR');
    const [selectedLRs, setSelectedLRs] = useState<string[]>([]);
    const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
    const [invoiceToPreview, setInvoiceToPreview] = useState<Invoice | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    useEffect(() => {
        try {
            const item = window.localStorage.getItem('transpo-settings');
            if (item) setSettings(JSON.parse(item));
        } catch (error) { console.error("Failed to load settings", error); }
    }, []);

    const getNextInvoiceNumber = () => {
        if (invoices.length === 0) return 'INV-001';
        const maxNum = invoices.reduce((max, inv) => {
            const num = parseInt(inv.id.replace('INV-', ''), 10);
            return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        return `INV-${String(maxNum + 1).padStart(3, '0')}`;
    };

    const handleSaveInvoice = (invoiceData: Invoice) => {
        onSave(invoiceData);
        setViewState('list');
        setInvoiceToEdit(null);
    };

    const handlePreviewInvoice = (invoiceData: Invoice) => {
        setInvoiceToPreview(invoiceData);
        setViewState('preview');
    };
    
    const handleView = (invoice: Invoice) => {
        setInvoiceToPreview(invoice);
        setViewState('preview');
    };

    const toggleLRSelection = (id: string) => {
        setSelectedLRs(prev => prev.includes(id) ? prev.filter(lrId => lrId !== id) : [...prev, id]);
    };
    
    const filteredUnbilledLRs = useMemo(() => {
        return unbilledLRs.filter(lr => dateIsInFy(lr.date, selectedFy));
    }, [selectedFy, unbilledLRs]);
    
    const proceedToGenerateFromLR = () => {
        const lrsToBill = filteredUnbilledLRs.filter(lr => selectedLRs.includes(lr.id));
        if (lrsToBill.length === 0) return;

        const firstClientId = lrsToBill[0].consignorId;
        const allSameClient = lrsToBill.every(lr => lr.consignorId === firstClientId);
        if (!allSameClient) {
            alert("Please select Lorry Receipts for the same client to generate a single invoice.");
            return;
        }

        const client = clients.find(c => c.id === firstClientId);
        if(!client) return;

        const lrDetails: LrDetail[] = lrsToBill.map(lr => ({
            id: lr.id,
            lrNumber: lr.lrNumber,
            date: lr.date,
            truckNumber: lr.vehicleNumber,
            from: lr.from,
            to: lr.to,
            materialDetails: lr.goods.map(g => g.productName).join(', '),
            articles: lr.goods.reduce((sum, g) => sum + g.packages, 0),
            totalWeight: lr.goods.reduce((sum, g) => sum + g.chargeWeight, 0),
            freightAmount: lr.freightDetails.basicFreight,
            haltingCharge: lr.freightDetails.haltingCharge || 0,
            extraCharge: lr.freightDetails.extraCharge || 0,
            advance: lr.freightDetails.advancePaid || 0,
        }));
        
        const totalTripAmount = lrDetails.reduce((sum, item) => sum + (item.freightAmount || 0) + (item.haltingCharge || 0) + (item.extraCharge || 0), 0);
        const advanceReceived = lrDetails.reduce((sum, item) => sum + (item.advance || 0), 0);
        
        const newInvoice: Invoice = {
            ...newInvoiceTemplate,
            id: getNextInvoiceNumber(),
            clientId: client.id,
            lrDetails,
            totalTripAmount,
            advanceReceived,
            bankDetails: {
                accountHolderName: settings.company.accountHolderName,
                bankName: settings.company.bankName,
                accountNumber: settings.company.accountNumber,
                ifscCode: settings.company.ifscCode,
            }
        };

        setInvoiceToEdit(newInvoice);
        setViewState('form');
        setFormTab('withoutLR');
    };

    const filteredInvoices = useMemo(() => invoices.filter(invoice => {
        if (!dateIsInFy(invoice.date, selectedFy)) return false;
        const client = clients.find(c => c.id === invoice.clientId);
        const searchTermLower = searchTerm.toLowerCase();
        return (
            invoice.id.toLowerCase().includes(searchTermLower) ||
            (client && client.name.toLowerCase().includes(searchTermLower))
        );
    }), [invoices, searchTerm, selectedFy, clients]);
    
    if (viewState === 'preview' && invoiceToPreview) {
        const client = clients.find(c => c.id === invoiceToPreview.clientId);
        if (!client) return <div>Error: Client not found for preview.</div>
        return <InvoicePDF 
            invoice={invoiceToPreview} 
            client={client}
            settings={settings}
            onBack={() => { setViewState(invoiceToEdit ? 'form' : 'list'); setInvoiceToPreview(null); }} 
        />
    }

    if (viewState === 'form') {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg animate-fade-in">
                 <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{invoiceToEdit && 'id' in invoiceToEdit ? 'Edit Invoice' : 'Generate Invoice'}</h2>
                   <button onClick={() => { setViewState('list'); setInvoiceToEdit(null); }} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold">&times;</button>
                </div>
                
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                    <button 
                        onClick={() => setFormTab('fromLR')}
                        className={`py-2 px-4 text-sm font-medium ${formTab === 'fromLR' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Generate Invoice From LR
                    </button>
                    <button 
                        onClick={() => {
                            setFormTab('withoutLR');
                            if (!invoiceToEdit) {
                               setInvoiceToEdit({ 
                                   ...newInvoiceTemplate,
                                   id: getNextInvoiceNumber(),
                                   bankDetails: {
                                        accountHolderName: settings.company.accountHolderName,
                                        bankName: settings.company.bankName,
                                        accountNumber: settings.company.accountNumber,
                                        ifscCode: settings.company.ifscCode,
                                    }
                               });
                            }
                        }}
                        className={`py-2 px-4 text-sm font-medium ${formTab === 'withoutLR' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Generate Invoice Without LR
                    </button>
                </div>

                {formTab === 'fromLR' && !(invoiceToEdit && 'id' in invoiceToEdit) && (
                     <div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-semibold dark:text-gray-200">Total Selected LR / Bilty: {selectedLRs.length}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Un-Billed LR: {filteredUnbilledLRs.length}</p>
                            </div>
                            <button onClick={proceedToGenerateFromLR} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50" disabled={selectedLRs.length === 0}>
                                PROCEED TO GENERATE INVOICE
                            </button>
                        </div>
                        <div className="space-y-3">
                            {filteredUnbilledLRs.map(lr => (
                                <div key={lr.id} className="border dark:border-gray-700 rounded-lg p-4 flex items-start space-x-4">
                                    <input type="checkbox" className="mt-1" checked={selectedLRs.includes(lr.id)} onChange={() => toggleLRSelection(lr.id)} />
                                    <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                                        <div><p className="text-gray-500 dark:text-gray-400">LR Number</p><p className="font-medium dark:text-gray-200">{lr.lrNumber}</p></div>
                                        <div><p className="text-gray-500 dark:text-gray-400">Date</p><p className="font-medium dark:text-gray-200">{lr.date}</p></div>
                                        <div><p className="text-gray-500 dark:text-gray-400">From / To</p><p className="font-medium dark:text-gray-200">{lr.from} &rarr; {lr.to}</p></div>
                                        <div><p className="text-gray-500 dark:text-gray-400">Payment Status</p><p className={`font-semibold ${lr.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>{lr.paymentStatus}</p></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                )}
                
                {formTab === 'withoutLR' && invoiceToEdit && <InvoiceForm onSave={handleSaveInvoice} onPreview={handlePreviewInvoice} onCancel={() => {setViewState('list'); setInvoiceToEdit(null);}} initialInvoice={invoiceToEdit} clients={clients} />}
            </div>
        );
    }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Invoice</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Transporter generates invoice for claiming remaining trip freight amount.</p>
        </div>
        <button onClick={() => { setViewState('form'); setFormTab('fromLR'); setInvoiceToEdit(null); setSelectedLRs([]); }} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700">
          Generate Invoice
        </button>
      </div>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
         <div className="flex justify-between items-center mb-4">
            <div className="relative w-1/3">
                <input type="text" placeholder="Search invoices..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-gray-200"/>
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <div><button className="text-sm text-gray-600 dark:text-gray-400 flex items-center">Sort By <ChevronDownIcon className="w-4 h-4 ml-1" /></button></div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700">
                    <tr>
                        <th className="px-6 py-3">Invoice No.</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Billing Party</th>
                        <th className="px-6 py-3 text-right">Invoice Amount</th>
                        <th className="px-6 py-3">Payment Status</th>
                        <th className="px-6 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredInvoices.map(invoice => {
                    const client = clients.find(c => c.id === invoice.clientId);
                    return (
                    <tr key={invoice.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{invoice.id}</td>
                        <td className="px-6 py-4">{invoice.date}</td>
                        <td className="px-6 py-4">{client ? client.name : 'Unknown Client'}</td>
                        <td className="px-6 py-4 text-right font-mono">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(invoice.invoiceValue)}</td>
                        <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            invoice.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}>{invoice.status}</span>
                        </td>
                        <td className="px-6 py-4 flex items-center space-x-4">
                            <button onClick={() => handleView(invoice)} className="font-medium text-blue-600 hover:underline">View</button>
                            <button onClick={() => onDelete(invoice.id)} className="font-medium text-red-600 hover:underline flex items-center space-x-1">
                                <TrashIcon className="w-4 h-4" /> <span>Delete</span>
                            </button>
                        </td>
                    </tr>
                    )})}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

interface InvoiceFormProps {
    onSave: (invoice: Invoice) => void;
    onPreview: (invoice: Invoice) => void;
    onCancel: () => void;
    initialInvoice: Invoice;
    clients: Client[];
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave, onPreview, onCancel, initialInvoice, clients }) => {
    const [formData, setFormData] = useState<Invoice>(initialInvoice);
    const selectedClient = useMemo(() => clients.find(c => c.id === formData.clientId), [formData.clientId, clients]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
     const handleBankDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, bankDetails: { ...prev.bankDetails!, [name]: value } }));
    };

    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };
    
    const handleLrDetailChange = (index: number, field: keyof LrDetail, value: string | number) => {
        setFormData(prev => {
            const newLrDetails = [...prev.lrDetails];
            const item = { ...newLrDetails[index] };
            (item[field] as any) = value;
            newLrDetails[index] = item;
            return { ...prev, lrDetails: newLrDetails };
        });
    };

    const addLrDetail = () => {
        setFormData(prev => ({
            ...prev,
            lrDetails: [...prev.lrDetails, {
                id: Date.now().toString(), lrNumber: '', date: new Date().toLocaleDateString('en-CA'), truckNumber: '', from: '', to: '',
                materialDetails: '', articles: 0, totalWeight: 0, freightAmount: 0, haltingCharge: 0, extraCharge: 0, advance: 0
            }]
        }));
    };
    
    const removeLrDetail = (index: number) => {
        setFormData(prev => ({ ...prev, lrDetails: prev.lrDetails.filter((_, i) => i !== index) }));
    };

    const calculatedTotals = useMemo(() => {
        const totalTripAmount = formData.lrDetails.reduce((sum, item) => sum + (item.freightAmount || 0) + (item.haltingCharge || 0) + (item.extraCharge || 0), 0);
        const subTotal = totalTripAmount;
        const amountAfterDiscount = totalTripAmount - formData.discount;
        const tdsDeduction = formData.tdsRate > 0 ? amountAfterDiscount * (formData.tdsRate / 100) : formData.tdsDeduction;
        const gstAmount = amountAfterDiscount * (formData.gstRate / 100);
        const invoiceValue = amountAfterDiscount + gstAmount;
        const netPayable = invoiceValue - formData.advanceReceived - tdsDeduction + formData.roundOff;
        return { totalTripAmount, subTotal, invoiceValue, netPayable, tdsDeduction };
    }, [formData.lrDetails, formData.discount, formData.gstRate, formData.tdsRate, formData.advanceReceived, formData.roundOff, formData.tdsDeduction]);

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            ...calculatedTotals,
        }));
    }, [calculatedTotals.totalTripAmount, calculatedTotals.invoiceValue, calculatedTotals.netPayable, calculatedTotals.tdsDeduction]);


    const handleSubmit = (e: FormEvent, isPreview: boolean = false) => {
        e.preventDefault();
        if (!formData.clientId) { alert('Please select a billing party.'); return; }
        
        const finalInvoice: Invoice = { ...formData, ...calculatedTotals };
        
        if (isPreview) {
            onPreview(finalInvoice);
        } else {
            onSave(finalInvoice);
        }
    };

    return (
        <form className="space-y-6 text-sm">
            <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4 border dark:border-gray-700 p-4 rounded-md">
                <legend className="px-2 font-semibold text-gray-700 dark:text-gray-300">Basic Details</legend>
                 <FormField label="Invoice Number">
                    <TextInput value={formData.id} readOnly className="bg-gray-200 dark:bg-slate-600 dark:text-gray-300 cursor-not-allowed" />
                </FormField>
                <FormField label="Invoice Date">
                    <TextInput type="date" name="date" value={formData.date} onChange={handleChange} />
                </FormField>
                <FormField label="Bill To">
                    <DropdownInput name="clientId" value={formData.clientId} onChange={handleChange} required>
                        <option value="">Select Company</option>
                        {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                    </DropdownInput>
                </FormField>
                {selectedClient && <div className="md:col-span-3 text-xs p-2 bg-blue-50 dark:bg-blue-900/50 rounded">
                    <p className="dark:text-gray-300"><b>GST:</b> {selectedClient.gstin} | <b>Address:</b> {selectedClient.address}</p>
                </div>}
             </fieldset>

            <fieldset className="border dark:border-gray-700 p-4 rounded-md space-y-3">
                <legend className="px-2 font-semibold text-gray-700 dark:text-gray-300">LR / Trip Details</legend>
                {formData.lrDetails.map((detail, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 border-b dark:border-gray-600 pb-3 items-end">
                        <div className="md:col-span-1"><FormField label="Date"><TextInput type="date" value={detail.date} onChange={e => handleLrDetailChange(index, 'date', e.target.value)} /></FormField></div>
                        <div className="md:col-span-1"><FormField label="LR No."><TextInput placeholder="LR No." value={detail.lrNumber} onChange={e => handleLrDetailChange(index, 'lrNumber', e.target.value)} /></FormField></div>
                        <div className="md:col-span-1"><FormField label="Truck No."><TextInput placeholder="Truck No." value={detail.truckNumber} onChange={e => handleLrDetailChange(index, 'truckNumber', e.target.value)} /></FormField></div>
                        <div className="md:col-span-1"><FormField label="From"><TextInput placeholder="Origin" value={detail.from} onChange={e => handleLrDetailChange(index, 'from', e.target.value)} /></FormField></div>
                        <div className="md:col-span-1"><FormField label="To"><TextInput placeholder="Destination" value={detail.to} onChange={e => handleLrDetailChange(index, 'to', e.target.value)} /></FormField></div>
                        <div className="md:col-span-2"><FormField label="Material"><TextInput placeholder="Material Details" value={detail.materialDetails} onChange={e => handleLrDetailChange(index, 'materialDetails', e.target.value)} /></FormField></div>
                        <div className="md:col-span-1"><FormField label="Articles"><TextInput type="number" placeholder="Pcs" value={detail.articles || ''} onChange={e => handleLrDetailChange(index, 'articles', parseFloat(e.target.value) || 0)} /></FormField></div>
                        <div className="md:col-span-1"><FormField label="Weight(kg)"><TextInput type="number" placeholder="Kg" value={detail.totalWeight || ''} onChange={e => handleLrDetailChange(index, 'totalWeight', parseFloat(e.target.value) || 0)} /></FormField></div>
                        <div className="md:col-span-1"><FormField label="Freight (₹)"><TextInput type="number" placeholder="Amt" value={detail.freightAmount || ''} onChange={e => handleLrDetailChange(index, 'freightAmount', parseFloat(e.target.value) || 0)} /></FormField></div>
                        <div className="md:col-span-2 flex items-center">
                            <button type="button" onClick={() => removeLrDetail(index)} className="text-red-500 hover:text-red-700 font-bold p-2">&times; Remove</button>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addLrDetail} className="text-sm text-blue-600 hover:underline">+ Add Trip</button>
            </fieldset>
             
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <fieldset className="space-y-4 p-4 border dark:border-gray-700 rounded-md">
                    <legend className="px-2 font-semibold text-gray-700 dark:text-gray-300">Additional Details</legend>
                    <FormField label="HSN Code"><TextInput name="hsnCode" value={formData.hsnCode || ''} onChange={handleChange} /></FormField>
                    <FormField label="Remarks"><TextAreaInput name="remarks" value={formData.remarks || ''} onChange={handleChange} /></FormField>
                    <p className="font-medium pt-2 border-t dark:border-gray-600">Bank Details</p>
                    <FormField label="Account Holder Name"><TextInput name="accountHolderName" value={formData.bankDetails?.accountHolderName} onChange={handleBankDetailsChange} /></FormField>
                    <FormField label="Bank Name"><TextInput name="bankName" value={formData.bankDetails?.bankName} onChange={handleBankDetailsChange} /></FormField>
                    <FormRow>
                        <FormField label="Account Number"><TextInput name="accountNumber" value={formData.bankDetails?.accountNumber} onChange={handleBankDetailsChange} /></FormField>
                        <FormField label="Bank IFSC Code"><TextInput name="ifscCode" value={formData.bankDetails?.ifscCode} onChange={handleBankDetailsChange} /></FormField>
                    </FormRow>
                </fieldset>
                
                <fieldset className="space-y-3 p-4 border dark:border-gray-700 rounded-md">
                    <legend className="px-2 font-semibold text-gray-700 dark:text-gray-300">Calculation</legend>
                    <div className="flex justify-between items-center border-b dark:border-gray-600 pb-2">
                         <h3 className="font-semibold text-base text-gray-700 dark:text-gray-300">Total Trip Amount</h3>
                         <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(calculatedTotals.totalTripAmount)}</span>
                    </div>

                    <FormRow>
                        <FormField label="Discount Amount"><TextInput type="number" name="discount" value={formData.discount || ''} onChange={handleNumericChange} placeholder="0.00" /></FormField>
                        <FormField label="GST Details"><DropdownInput name="gstRate" value={formData.gstRate} onChange={handleNumericChange}>
                            <option value="0">Nil (On reverse charge)%</option><option value="5">5.0%</option><option value="12">12.0%</option><option value="18">18.0%</option><option value="28">28.0%</option>
                        </DropdownInput></FormField>
                    </FormRow>
                    <div className="flex items-center space-x-2">
                        <h4 className="font-medium">TDS Deduction (-)</h4>
                        <InfoIcon className="w-4 h-4 text-gray-400" title="TDS is calculated on Total Trip Amount after discount."/>
                    </div>
                    <FormRow>
                        <FormField label="TDS %"><DropdownInput name="tdsRate" value={formData.tdsRate} onChange={handleNumericChange}>
                            <option value="0">0%</option><option value="1">1%</option><option value="2">2%</option><option value="5">5%</option><option value="10">10%</option>
                        </DropdownInput></FormField>
                        <FormField label="TDS Amount"><TextInput type="number" name="tdsDeduction" value={calculatedTotals.tdsDeduction.toFixed(2)} readOnly className="bg-gray-200 dark:bg-slate-600" /></FormField>
                    </FormRow>
                    
                    <FormField label="Round Off (+/-)"><TextInput type="number" name="roundOff" value={formData.roundOff || ''} onChange={handleNumericChange} placeholder="e.g. 0.50 or -0.50" /></FormField>

                    <div className="flex justify-between items-center pt-2 border-t dark:border-gray-600 font-bold text-xl text-blue-600">
                        <h4>Invoice Amount</h4>
                        <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(calculatedTotals.invoiceValue)}</span>
                    </div>
                    
                    <FormRow>
                        <FormField label="Advance Received"><TextInput type="number" name="advanceReceived" value={formData.advanceReceived || ''} onChange={handleNumericChange} /></FormField>
                        <FormField label="Advance Via"><DropdownInput name="advanceReceivedVia" value={formData.advanceReceivedVia} onChange={handleChange}>
                            <option value="Bank">Bank</option><option value="Cash">Cash</option><option value="Other">Other</option>
                        </DropdownInput></FormField>
                    </FormRow>
                    
                    <div className="flex justify-between items-center text-red-600 font-bold bg-red-50 dark:bg-red-900/50 p-2 rounded-md">
                        <h4>Payable Amount</h4>
                        <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(calculatedTotals.netPayable)}</span>
                    </div>
                     <FormField label="GST Filed By"><DropdownInput name="gstPayableBy" value={formData.gstPayableBy} onChange={handleChange}>
                            <option value="Consignor">Consignor</option><option value="Consignee">Consignee</option><option value="Transporter">Transporter</option>
                        </DropdownInput></FormField>
                </fieldset>
             </div>
             <div className="flex justify-center mt-6 space-x-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors w-1/4 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">CANCEL</button>
                <button type="button" onClick={(e) => handleSubmit(e, true)} className="bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors w-1/4">PREVIEW INVOICE</button>
                <button type="submit" onClick={(e) => handleSubmit(e, false)} className="bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors w-1/2">GENERATE INVOICE</button>
            </div>
        </form>
    );
};

export default InvoiceView;