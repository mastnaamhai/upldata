import React from 'react';
import type { Expense, AppSettings } from '../types';
import { PhoneIcon, MailIcon, GlobeIcon } from './icons';

interface ExpenseReportPDFProps {
    expenses: Expense[];
    settings: AppSettings;
    selectedFy: string;
    onBack: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value);

const ExpenseReportPDF: React.FC<ExpenseReportPDFProps> = ({ expenses, settings, selectedFy, onBack }) => {
    
    const company = settings.company;
    const [phone, email, website] = company.address.split('\n').slice(1).map(line => line.split(': ')[1]);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-gray-200 p-4 font-sans pdf-container-bg">
             <div className="flex justify-center items-center mb-4 no-print space-x-4">
                <button onClick={onBack} className="bg-gray-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-600">&larr; Back to Expenses</button>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700">Print Report</button>
            </div>
            <div id="print-area" className="max-w-4xl mx-auto bg-white shadow-lg text-xs">
                 <div className="p-8 border-2 border-gray-300">
                    <header className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{company.companyName}</h1>
                            <p className="text-gray-500">{company.address.split('\n')[0]}</p>
                        </div>
                        <div className="text-right">
                             <div className="inline-block bg-blue-100 text-blue-800 font-bold py-2 px-4 rounded-full text-lg">EXPENSE REPORT</div>
                             <p className="mt-2 text-gray-600">For Financial Year: <b>{selectedFy}</b></p>
                             <p className="text-gray-600">Report Date: <b>{new Date().toLocaleDateString('en-GB')}</b></p>
                        </div>
                    </header>
                    
                    <section className="mt-6">
                         <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                                    <th className="p-2 border-y">Date</th>
                                    <th className="p-2 border-y">Category</th>
                                    <th className="p-2 border-y">Description</th>
                                    <th className="p-2 border-y">Vehicle No.</th>
                                    <th className="p-2 border-y text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(expense => (
                                <tr key={expense.id} className="border-b">
                                    <td className="p-2">{new Date(expense.date).toLocaleDateString('en-GB', { timeZone: 'UTC' })}</td>
                                    <td className="p-2">{expense.category}</td>
                                    <td className="p-2 w-1/2">{expense.description}</td>
                                    <td className="p-2">{expense.vehicleNumber || '-'}</td>
                                    <td className="p-2 text-right font-mono">{formatCurrency(expense.amount)}</td>
                                </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-100 font-bold text-base">
                                    <td colSpan={4} className="p-2 text-right">Total Expenses</td>
                                    <td className="p-2 text-right font-mono">{formatCurrency(totalExpenses)}</td>
                                </tr>
                            </tfoot>
                         </table>
                    </section>
                    
                    <footer className="mt-12 pt-4 border-t-2 border-gray-200 text-right">
                        <div>
                             <p className="mb-12">For <b>{company.companyName}</b></p>
                             <p className="pt-2 border-t border-gray-400">Authorized Signatory</p>
                        </div>
                    </footer>
                     <p className="text-center text-gray-400 mt-4 text-xs">This is a computer generated report.</p>
                 </div>
            </div>
        </div>
    );
};

export default ExpenseReportPDF;