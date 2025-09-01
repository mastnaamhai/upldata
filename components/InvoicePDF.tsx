import React from 'react';
import type { Invoice, Client, AppSettings } from '../types';
import { PhoneIcon, MailIcon, GlobeIcon } from './icons';

interface InvoicePDFProps {
    invoice: Invoice;
    client: Client;
    settings: AppSettings;
    onBack: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value);
const formatNumber = (value: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(value);

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, client, settings, onBack }) => {
    
    const company = settings.company;
    const { totalTripAmount, discount, invoiceValue, advanceReceived, netPayable } = invoice;
    const [phone, email, website] = company.address.split('\n').slice(1).map(line => line.split(': ')[1]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-gray-200 p-4 font-sans pdf-container-bg">
             <div className="flex justify-center items-center mb-4 no-print space-x-4">
                <button onClick={onBack} className="bg-gray-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-600">&larr; Back to Form</button>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700">Print Invoice</button>
            </div>
            <div id="print-area" className="max-w-4xl mx-auto bg-white shadow-lg text-xs">
                 <div className="p-8 border-2 border-gray-300">
                    <header className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{company.companyName}</h1>
                            <p className="text-gray-500">{company.address.split('\n')[0]}</p>
                        </div>
                        <div className="text-right">
                             <div className="inline-block bg-blue-100 text-blue-800 font-bold py-2 px-4 rounded-full text-lg">TAX INVOICE</div>
                             <div className="mt-4 space-y-1 text-gray-600">
                                 <div className="flex items-center justify-end"><PhoneIcon className="w-4 h-4 mr-2" /><span>{phone}</span></div>
                                 <div className="flex items-center justify-end"><MailIcon className="w-4 h-4 mr-2" /><span>{email}</span></div>
                                 <div className="flex items-center justify-end"><GlobeIcon className="w-4 h-4 mr-2" /><span>{website}</span></div>
                             </div>
                        </div>
                    </header>

                    <section className="grid grid-cols-2 gap-8 my-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h2 className="font-bold text-gray-500 uppercase tracking-wide mb-2">Bill To:</h2>
                            <p className="font-bold text-base text-gray-800">{client.name}</p>
                            <p className="text-gray-600">{client.address}</p>
                            <p className="mt-2 font-mono"><b>GST No:</b> {client.gstin}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg text-right">
                             <div className="grid grid-cols-2">
                                 <span className="font-bold text-gray-500">Date:</span>
                                 <span className="text-gray-800">{new Date(invoice.date).toLocaleDateString('en-GB')}</span>
                                 <span className="font-bold text-gray-500">Invoice Number:</span>
                                 <span className="text-gray-800 font-mono">{invoice.id}</span>
                                 <span className="font-bold text-gray-500">Branch:</span>
                                 <span className="text-gray-800">--</span>
                             </div>
                        </div>
                    </section>
                    
                    <section>
                         <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                                    <th className="p-2 border-y">LR/GR/Bilty Number</th>
                                    <th className="p-2 border-y">Truck Number</th>
                                    <th className="p-2 border-y">From - To</th>
                                    <th className="p-2 border-y">Material Details</th>
                                    <th className="p-2 border-y text-right">Total Weight</th>
                                    <th className="p-2 border-y text-right">Trip Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.lrDetails.map(lr => (
                                <tr key={lr.id} className="border-b">
                                    <td className="p-2">{lr.lrNumber || '-'} <br/> <span className="text-gray-500">{new Date(lr.date).toLocaleDateString('en-GB')}</span></td>
                                    <td className="p-2">{lr.truckNumber}</td>
                                    <td className="p-2">{lr.from} - {lr.to}</td>
                                    <td className="p-2">{lr.materialDetails}</td>
                                    <td className="p-2 text-right">{lr.totalWeight.toFixed(2)} KGS</td>
                                    <td className="p-2 text-right font-mono">{formatNumber(lr.freightAmount)}</td>
                                </tr>
                                ))}
                                {Array.from({ length: Math.max(0, 5 - invoice.lrDetails.length) }).map((_, i) => (
                                    <tr key={`empty-${i}`} className="border-b"><td className="p-2 h-8" colSpan={6}></td></tr>
                                ))}
                            </tbody>
                         </table>
                    </section>
                    
                    <section className="grid grid-cols-2 gap-8 mt-4">
                        <div className="space-y-2 text-sm text-gray-600">
                             <p><b>HSN / SAC:</b> {invoice.hsnCode || '996511'}</p>
                             <p><b>Remarks:</b> {invoice.remarks || '-'}</p>
                             <p className="py-2 px-4 bg-gray-100 rounded-md mt-4"><b>GST Payable by:</b> {invoice.gstPayableBy}</p>
                        </div>
                        <div className="text-sm">
                             <table className="w-full">
                                <tbody>
                                    <tr><td className="p-2 text-gray-500">SUB TOTAL</td><td className="p-2 text-right font-mono">{formatNumber(totalTripAmount)}</td></tr>
                                    <tr><td className="p-2 text-gray-500">DISCOUNT</td><td className="p-2 text-right font-mono">- {formatNumber(discount)}</td></tr>
                                    <tr className="font-bold border-t"><td className="p-2">TOTAL TRIP AMOUNT</td><td className="p-2 text-right font-mono">{formatNumber(totalTripAmount - discount)}</td></tr>
                                    <tr className="font-bold text-lg border-y-2 border-black"><td className="p-2">INVOICE VALUE</td><td className="p-2 text-right font-mono">{formatNumber(invoiceValue)}</td></tr>
                                    <tr><td className="p-2 text-gray-500">ADVANCE RECEIVED</td><td className="p-2 text-right font-mono">- {formatNumber(advanceReceived)}</td></tr>
                                    <tr className="font-bold text-lg bg-gray-100"><td className="p-2">NET PAYABLE</td><td className="p-2 text-right font-mono">{formatCurrency(netPayable)}</td></tr>
                                </tbody>
                             </table>
                        </div>
                    </section>
                    
                    <footer className="mt-8 pt-4 border-t-2 border-gray-200 grid grid-cols-2 gap-8 text-xs">
                        <div>
                             <h3 className="font-bold uppercase text-gray-500 mb-1">Terms & Conditions</h3>
                             <ol className="list-decimal list-inside text-gray-500 space-y-1">
                                <li>All disputes subject to our local jurisdiction.</li>
                                <li>Penalty/ Interest will be charged if is not paid on presentation.</li>
                                <li>GST will be paid by {invoice.gstPayableBy}.</li>
                             </ol>
                        </div>
                         <div className="text-right">
                             <p className="mb-12">For <b>{company.companyName}</b></p>
                             <p className="pt-2 border-t border-gray-400">Authorized Signatory</p>
                        </div>
                    </footer>
                     <p className="text-center text-gray-400 mt-4 text-xs">This is a computer generated invoice / bill.</p>
                 </div>
            </div>
        </div>
    );
};

export default InvoicePDF;