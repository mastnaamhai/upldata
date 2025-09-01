import React, { useState, FormEvent, useMemo, useEffect } from 'react';
import type { Expense, ExpenseCategory, AppSettings } from '../types';
import { SearchIcon } from './icons';
import { FormRow, FormField, TextInput, TextAreaInput, DropdownInput } from './FormComponents';
import ExpenseReportPDF from './ExpenseReportPDF';

const expenseCategories: ExpenseCategory[] = ['Fuel', 'Salary', 'Office Rent', 'Maintenance', 'Toll', 'Other'];

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

const ExpenseForm: React.FC<{ 
    onSave: (expense: Expense) => void; 
    onCancel: () => void;
    expenseToEdit: Expense | null;
}> = ({ onSave, onCancel, expenseToEdit }) => {
    const [formData, setFormData] = useState<Omit<Expense, 'id'> | Expense>(expenseToEdit || { date: new Date().toLocaleDateString('en-CA'), category: 'Fuel', description: '', amount: 0, vehicleNumber: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            switch(name) {
                case 'category':
                    return { ...prev, category: value as ExpenseCategory };
                case 'amount':
                    return { ...prev, amount: parseFloat(value) || 0 };
                default:
                    return { ...prev, [name]: value };
            }
        });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(formData as Expense);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg animate-fade-in mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">{expenseToEdit ? 'Edit Expense' : 'Add New Expense'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormRow>
                    <FormField label="Date">
                        <TextInput type="date" name="date" value={formData.date} onChange={handleChange} required />
                    </FormField>
                    <FormField label="Category">
                        <DropdownInput name="category" value={formData.category} onChange={handleChange} required>
                            {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </DropdownInput>
                    </FormField>
                </FormRow>
                <FormField label="Description">
                    <TextAreaInput name="description" value={formData.description} onChange={handleChange} placeholder="e.g. Diesel for trip to Mumbai" required rows={2}></TextAreaInput>
                </FormField>
                <FormRow>
                    <FormField label="Amount">
                        <TextInput type="number" name="amount" value={formData.amount > 0 ? formData.amount : ''} onChange={handleChange} placeholder="0.00" required />
                    </FormField>
                    <FormField label="Vehicle Number (Optional)">
                        <TextInput type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} placeholder="e.g. MH-01-AB-1234" />
                    </FormField>
                </FormRow>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{expenseToEdit ? 'Save Changes' : 'Save Expense'}</button>
                </div>
            </form>
        </div>
    );
};

interface ExpenseViewProps {
    selectedFy: string;
    expenses: Expense[];
    onSave: (expense: Expense) => void;
    onDelete: (expenseId: string) => void;
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


const ExpenseView: React.FC<ExpenseViewProps> = ({ selectedFy, expenses, onSave, onDelete }) => {
    const [showForm, setShowForm] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    useEffect(() => {
        try {
            const item = window.localStorage.getItem('transpo-settings');
            if (item) setSettings(JSON.parse(item));
        } catch (error) { console.error("Failed to load settings", error); }
    }, []);

    const handleAddNew = () => {
        setExpenseToEdit(null);
        setShowForm(true);
    };

    const handleEdit = (expense: Expense) => {
        const formattedExpense = { ...expense, date: new Date(expense.date).toLocaleDateString('en-CA') };
        setExpenseToEdit(formattedExpense);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setExpenseToEdit(null);
    };

    const handleSave = (expense: Expense) => {
        onSave(expense);
        setShowForm(false);
        setExpenseToEdit(null);
    };
    
    const filteredExpenses = useMemo(() => expenses.filter(expense => {
        if (!dateIsInFy(expense.date, selectedFy)) return false;
        
        const term = searchTerm.toLowerCase();
        return (
            expense.description.toLowerCase().includes(term) ||
            expense.category.toLowerCase().includes(term) ||
            (expense.vehicleNumber && expense.vehicleNumber.toLowerCase().includes(term))
        );
    }), [expenses, searchTerm, selectedFy]);
    
    if (showPreview) {
        return <ExpenseReportPDF expenses={filteredExpenses} settings={settings} selectedFy={selectedFy} onBack={() => setShowPreview(false)} />;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Expenses</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage all your business expenses.</p>
                </div>
                {!showForm && (
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setShowPreview(true)} className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-700">
                          Generate Report
                        </button>
                        <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700">
                          Add New Expense
                        </button>
                    </div>
                )}
            </div>

            {showForm && <ExpenseForm onSave={handleSave} onCancel={handleCancel} expenseToEdit={expenseToEdit} />}

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <div className="relative w-1/3">
                        <input type="text" placeholder="Search expenses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-gray-200"/>
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3">Vehicle No.</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map(expense => (
                                <tr key={expense.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600">
                                    <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString('en-IN', { timeZone: 'UTC' })}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-200">{expense.category}</span></td>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{expense.description}</td>
                                    <td className="px-6 py-4">{expense.vehicleNumber || '-'}</td>
                                    <td className="px-6 py-4 font-mono text-right">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(expense.amount)}</td>
                                    <td className="px-6 py-4 space-x-2">
                                        <button onClick={() => handleEdit(expense)} className="font-medium text-blue-600 hover:underline">Edit</button>
                                        <button onClick={() => onDelete(expense.id)} className="font-medium text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ExpenseView;