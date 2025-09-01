import React from 'react';
import type { Client, AppSettings, LedgerTransaction } from '../types';
import { PhoneIcon, MailIcon, GlobeIcon } from './icons';

interface LedgerPDFProps {
    client: Client;
    transactions: LedgerTransaction[];
    totals: { totalBilled: number; totalReceived: number; balance: number };
    settings: AppSettings;
    selectedFy: string;
    onBack: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value);

const LedgerPDF: React.FC<LedgerPDFProps> = ({ client, transactions, totals, settings, selectedFy, onBack }) => {
    
    const company = settings.company;
    const [phone, email, website] = company.address.split('\n').slice(1).map(line => line.split(': ')[1]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-gray-200 p-4 font-sans pdf-container-bg">
             <div className="flex justify-center items-center mb-4 no-print space-x-4">
                <button onClick={onBack} className="bg-gray-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-600">&larr; Back to Ledger</button>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700">Print Statement</button>
            </div>
            <div id="print-area" className="max-w-4xl mx-auto bg-white shadow-lg text-xs">
                 <div className="p-8 border-2 border-gray-300">
                    <header className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{company.companyName}</h1>
                            <p className="text-gray-500">{company.address.split('\n')[0]}</p>
                            <p className="font-mono"><b>GST No:</b> {company.gstNumber}</p>
                        </div>
                        <div className="text-right">
                             <div className="inline-block bg-blue-100 text-blue-800 font-bold py-2 px-4 rounded-full text-lg">ACCOUNT STATEMENT</div>
                             <div className="mt-4 space-y-1 text-gray-600">
                                 <div className="flex items-center justify-end"><PhoneIcon className="w-4 h-4 mr-2" /><span>{phone}</span></div>
                                 <div className="flex items-center justify-end"><MailIcon className="w-4 h-4 mr-2" /><span>{email}</span></div>
                                 <div className="flex items-center justify-end"><GlobeIcon className="w-4 h-4 mr-2" /><span>{website}</span></div>
                             </div>
                        </div>
                    </header>

                    <section className="grid grid-cols-2 gap-8 my-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h2 className="font-bold text-gray-500 uppercase tracking-wide mb-2">Statement For:</h2>
                            <p className="font-bold text-base text-gray-800">{client.name}</p>
                            <p className="text-gray-600">{client.address}</p>
                            <p className="mt-2 font-mono"><b>GST No:</b> {client.gstin}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg text-right">
                             <div className="grid grid-cols-2">
                                 <span className="font-bold text-gray-500">Statement Date:</span>
                                 <span className="text-gray-800">{new Date().toLocaleDateString('en-GB')}</span>
                                 <span className="font-bold text-gray-500">Financial Year:</span>
                                 <span className="text-gray-800 font-mono">{selectedFy}</span>
                             </div>
                        </div>
                    </section>
                    
                     <section className="grid grid-cols-3 gap-4 mb-4 text-center">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <h4 className="text-sm text-gray-500">Total Billed</h4>
                            <p className="text-lg font-bold text-blue-700">{formatCurrency(totals.totalBilled)}</p>
                        </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                            <h4 className="text-sm text-gray-500">Total Received</h4>
                            <p className="text-lg font-bold text-green-700">{formatCurrency(totals.totalReceived)}</p>
                        </div>
                            <div className="p-3 bg-red-50 rounded-lg">
                            <h4 className="text-sm text-gray-500">Outstanding Balance</h4>
                            <p className="text-lg font-bold text-red-700">{formatCurrency(totals.balance)}</p>
                        </div>
                    </section>
                    
                    <section>
                         <table className="w-full text-left border-collapse">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 border-y">Date</th>
                                    <th className="px-6 py-3 border-y">Particulars</th>
                                    <th className="px-6 py-3 text-right border-y">Debit</th>
                                    <th className="px-6 py-3 text-right border-y">Credit</th>
                                    <th className="px-6 py-3 text-right border-y">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx, index) => (
                                    <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-2">{new Date(tx.date).toLocaleDateString('en-GB', { timeZone: 'UTC' })}</td>
                                        <td className="px-6 py-2 font-medium text-gray-800">
                                            {tx.type === 'invoice' ? `Invoice #${tx.id}` : `Payment Received (${tx.mode})`}
                                            {tx.type === 'payment' && tx.notes && <p className="text-xs text-gray-500">{tx.notes}</p>}
                                        </td>
                                        <td className="px-6 py-2 text-right font-mono">{tx.debit > 0 ? formatCurrency(tx.debit) : '-'}</td>
                                        <td className="px-6 py-2 text-right font-mono text-green-600">{tx.credit > 0 ? formatCurrency(tx.credit) : '-'}</td>
                                        <td className="px-6 py-2 text-right font-mono font-semibold">{formatCurrency(tx.balance)}</td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-8 text-gray-500">No transactions for this client.</td></tr>
                                )}
                            </tbody>
                         </table>
                    </section>
                    
                    <footer className="mt-8 pt-4 border-t-2 border-gray-200 grid grid-cols-2 gap-8 text-xs">
                        <div>
                             <h3 className="font-bold uppercase text-gray-500 mb-1">Bank Details</h3>
                             <p><b>Bank:</b> {company.bankName}</p>
                             <p><b>A/C No:</b> {company.accountNumber}</p>
                             <p><b>IFSC:</b> {company.ifscCode}</p>
                        </div>
                         <div className="text-right">
                             <p className="mb-12">For <b>{company.companyName}</b></p>
                             <p className="pt-2 border-t border-gray-400">Authorized Signatory</p>
                        </div>
                    </footer>
                     <p className="text-center text-gray-400 mt-4 text-xs">This is a computer generated statement.</p>
                 </div>
            </div>
        </div>
    );
};

export default LedgerPDF;