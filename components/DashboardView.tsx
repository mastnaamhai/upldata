import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Outstanding, FinancialData, NavItem, Client, Invoice, Expense, Payment, LorryReceipt } from '../types';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value);

const formatYAxis = (value: number) => {
    if (value >= 1_00_00_000) return `${(value / 1_00_00_000).toFixed(1)}Cr`;
    if (value >= 1_00_000) return `${(value / 1_00_000).toFixed(1)}L`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toString();
}

const Card: React.FC<{ title: string; value: string; className?: string, children?: React.ReactNode }> = ({ title, value, className, children }) => (
    <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow ${className}`}>
        <h3 className="text-sm text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{value}</p>
        {children}
    </div>
);

interface DashboardViewProps {
  setActiveView: (view: NavItem) => void;
  selectedFy: string;
  clients: Client[];
  invoices: Invoice[];
  expenses: Expense[];
  payments: Payment[];
  lrs: LorryReceipt[];
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

const DashboardView: React.FC<DashboardViewProps> = ({ setActiveView, selectedFy, clients, invoices, expenses, payments, lrs }) => {

    const filteredInvoices = useMemo(() => invoices.filter(inv => dateIsInFy(inv.date, selectedFy)), [selectedFy, invoices]);
    const filteredExpenses = useMemo(() => expenses.filter(exp => dateIsInFy(exp.date, selectedFy)), [selectedFy, expenses]);
    const filteredPayments = useMemo(() => payments.filter(p => dateIsInFy(p.date, selectedFy)), [selectedFy, payments]);
    const filteredLRs = useMemo(() => lrs.filter(lr => dateIsInFy(lr.date, selectedFy)), [selectedFy, lrs]);

    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.invoiceValue, 0);
    const totalExpense = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netIncome = totalRevenue - totalExpense;

    const clientBalances = clients.map(client => {
        const invoicesTotal = filteredInvoices
            .filter(i => i.clientId === client.id)
            .reduce((sum, i) => sum + i.invoiceValue, 0);
        const paymentsTotal = filteredPayments
            .filter(p => p.clientId === client.id)
            .reduce((sum, p) => sum + p.amount, 0);
        return { name: client.name, amount: invoicesTotal - paymentsTotal };
    });

    const outstandingData: Outstanding[] = clientBalances
        .filter(b => b.amount > 0)
        .sort((a, b) => b.amount - a.amount);
    
    const monthlyData: { [key: string]: { revenue: number, expenses: number } } = {};
    const monthNames = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

    filteredInvoices.forEach(inv => {
        const monthIndex = new Date(inv.date).getMonth();
        let month = new Date(inv.date).toLocaleString('en-US', { month: 'short'});
        if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenses: 0 };
        monthlyData[month].revenue += inv.invoiceValue;
    });
     filteredExpenses.forEach(exp => {
        let month = new Date(exp.date).toLocaleString('en-US', { month: 'short'});
        if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenses: 0 };
        monthlyData[month].expenses += exp.amount;
    });
    
    const financialData: FinancialData[] = monthNames.map(month => ({
        month,
        revenue: monthlyData[month]?.revenue || 0,
        expenses: monthlyData[month]?.expenses || 0,
    }));

    const lrTotalAmount = filteredLRs.reduce((sum, lr) => sum + lr.freightDetails.basicFreight, 0);

    const documentSummaries = [
        { name: 'Lorry Receipt', count: filteredLRs.length, amount: lrTotalAmount },
        { name: 'Invoice', count: filteredInvoices.length, amount: totalRevenue },
    ];


  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Net Income" value={formatCurrency(netIncome)}>
             <div className="flex justify-between text-sm mt-2 dark:text-gray-400">
                <span>Revenue: <span className="font-medium text-green-600">{formatCurrency(totalRevenue)}</span></span>
                <span>Expense: <span className="font-medium text-red-600">{formatCurrency(totalExpense)}</span></span>
            </div>
        </Card>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow flex items-center justify-between">
            <div>
                <h3 className="text-sm text-gray-500 dark:text-gray-400">My Plan</h3>
                <p className="font-semibold text-gray-800 dark:text-gray-200">Expires in 0 Days</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Balance: 0.0, Sub Users: 0</p>
            </div>
            <div className="text-2xl font-bold text-blue-600">₹0.00</div>
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-slate-800 text-white p-4 rounded-lg shadow flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-bold">अब हम बनाएंगे, आपकी वेबसाइट</h3>
            <p className="text-sm">Create your own website</p>
            <button className="mt-2 text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-full">Contact your support executive</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Financial Year: {selectedFy.split(' ')[1]}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financialData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.3)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'rgb(100 116 139)' }} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12, fill: 'rgb(100 116 139)' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #4a5568', color: '#cbd5e0' }}
                formatter={(value: number) => formatCurrency(value)} />
              <Legend wrapperStyle={{fontSize: "12px", color: 'rgb(100 116 139)' }}/>
              <Bar dataKey="revenue" fill="#34D399" name="Revenue" />
              <Bar dataKey="expenses" fill="#F87171" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Daily Outstanding List</h3>
          <ul className="space-y-2">
            {outstandingData.slice(0, 5).map((item, index) => (
              <li key={index} className="flex justify-between items-center text-sm p-2 rounded-md bg-gray-50 dark:bg-slate-700">
                <span className="font-medium text-gray-600 dark:text-gray-300">{item.name}</span>
                <span className="font-bold text-red-500">{formatCurrency(item.amount)}</span>
              </li>
            ))}
             {outstandingData.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No outstanding payments.</p>}
          </ul>
           <button onClick={() => setActiveView('customerLedger')} className="text-xs text-blue-600 hover:underline mt-2">View More</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Document Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3">Document</th>
                <th scope="col" className="px-6 py-3 text-right">Count</th>
                <th scope="col" className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {documentSummaries.map((doc, index) => (
                <tr key={index} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 cursor-pointer" onClick={() => {
                    if (doc.name === 'Lorry Receipt') setActiveView('lorryReceipt');
                    if (doc.name === 'Invoice') setActiveView('invoice');
                }}>
                  <td className="px-6 py-4 font-medium text-blue-600 whitespace-nowrap">{doc.name}</td>
                  <td className="px-6 py-4 text-right">{doc.count}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(doc.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;