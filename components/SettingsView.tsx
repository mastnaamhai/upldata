import React, { useState, FormEvent, ChangeEvent } from 'react';
import type { AppSettings, CompanySettings, AppData } from '../types';
import { FormRow, FormField, TextInput, TextAreaInput } from './FormComponents';

type SettingsTab = 'profile' | 'appearance' | 'export';

interface SettingsViewProps {
    settings: AppSettings;
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    appData: AppData;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings, appData }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <CompanyProfileForm settings={settings} setSettings={setSettings} />;
            case 'appearance':
                return <AppearanceSettings settings={settings} setSettings={setSettings} />;
            case 'export':
                return <ExportData appData={appData} />;
            default:
                return null;
        }
    };

    const TabButton: React.FC<{ tab: SettingsTab, label: string }> = ({ tab, label }) => (
         <button 
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-4 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-4 text-gray-800 dark:text-gray-200">
            <div>
                <h2 className="text-2xl font-semibold ">Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your company profile, appearance, and data.</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                 <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                    <TabButton tab="profile" label="Company Profile" />
                    <TabButton tab="appearance" label="Appearance" />
                    <TabButton tab="export" label="Export Data" />
                 </div>
                 <div>
                    {renderContent()}
                 </div>
            </div>
        </div>
    );
};

interface CompanyProfileFormProps {
    settings: AppSettings;
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const CompanyProfileForm: React.FC<CompanyProfileFormProps> = ({ settings, setSettings }) => {
    const [formData, setFormData] = useState<CompanySettings>(settings.company);
    const [feedback, setFeedback] = useState('');

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid image file (PNG, JPG, JPEG).');
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSettings(prev => ({ ...prev, company: formData }));
        setFeedback('Settings saved successfully!');
        setTimeout(() => setFeedback(''), 3000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <FormRow>
                        <FormField label="Company Name">
                            <TextInput name="companyName" value={formData.companyName} onChange={handleChange} required />
                        </FormField>
                        <FormField label="GST Number">
                            <TextInput name="gstNumber" value={formData.gstNumber} onChange={handleChange} required />
                        </FormField>
                    </FormRow>
                    <FormField label="Company Address">
                        <TextAreaInput name="address" value={formData.address} onChange={handleChange} />
                    </FormField>
                    <fieldset className="border p-4 rounded-md dark:border-gray-600">
                        <legend className="px-2 font-semibold text-sm">Bank Account Details</legend>
                        <div className="space-y-4">
                            <FormField label="Account Holder Name"><TextInput name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} /></FormField>
                            <FormField label="Bank Name"><TextInput name="bankName" value={formData.bankName} onChange={handleChange} /></FormField>
                            <FormRow>
                                <FormField label="Account Number"><TextInput name="accountNumber" value={formData.accountNumber} onChange={handleChange} /></FormField>
                                <FormField label="IFSC Code"><TextInput name="ifscCode" value={formData.ifscCode} onChange={handleChange} /></FormField>
                            </FormRow>
                        </div>
                    </fieldset>
                </div>
                <div className="space-y-4">
                     <FormField label="Company Logo">
                        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md dark:border-gray-600">
                            {formData.logo ? (
                                <img src={formData.logo} alt="Logo Preview" className="h-24 w-auto mb-4" />
                            ) : <div className="h-24 flex items-center justify-center text-gray-400">No Logo</div>}
                            <input type="file" id="logo-upload" accept=".png, .jpg, .jpeg" onChange={handleLogoChange} className="hidden" />
                            <label htmlFor="logo-upload" className="cursor-pointer bg-gray-200 dark:bg-gray-700 text-sm font-medium px-3 py-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                                Upload Logo
                            </label>
                        </div>
                     </FormField>
                </div>
            </div>
             <div className="flex justify-end items-center space-x-4 pt-4">
                {feedback && <span className="text-sm text-green-600 dark:text-green-400">{feedback}</span>}
                <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save Changes</button>
            </div>
        </form>
    );
};

interface AppearanceSettingsProps {
    settings: AppSettings;
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ settings, setSettings }) => {
    const handleThemeChange = (theme: 'light' | 'dark') => {
        setSettings(prev => ({...prev, theme}));
    }

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Theme</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose how the application looks.</p>
            <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                    <input type="radio" name="theme" value="light" checked={settings.theme === 'light'} onChange={() => handleThemeChange('light')} className="form-radio text-blue-600" />
                    <span>Light Mode</span>
                </label>
                 <label className="flex items-center space-x-2">
                    <input type="radio" name="theme" value="dark" checked={settings.theme === 'dark'} onChange={() => handleThemeChange('dark')} className="form-radio text-blue-600" />
                    <span>Dark Mode</span>
                </label>
            </div>
        </div>
    );
};

type DataType = 'clients' | 'lorryReceipts' | 'invoices' | 'expenses';

interface ExportDataProps {
    appData: AppData;
}
const ExportData: React.FC<ExportDataProps> = ({ appData }) => {
    const [selectedData, setSelectedData] = useState<DataType[]>([]);

    const handleCheckboxChange = (type: DataType) => {
        setSelectedData(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };
    
    const arrayToCsv = (data: any[], columns: string[]): string => {
        const header = columns.join(',');
        const rows = data.map(obj => 
            columns.map(col => {
                let val = obj[col] === undefined || obj[col] === null ? '' : String(obj[col]);
                if (String(val).includes(',')) {
                    val = `"${val}"`;
                }
                return val;
            }).join(',')
        );
        return [header, ...rows].join('\n');
    };

    const handleExport = () => {
        if (selectedData.length === 0) {
            alert('Please select at least one data type to export.');
            return;
        }

        selectedData.forEach(type => {
            let csvContent = '';
            let columns: string[] = [];
            let data: any[] = [];
            let filename = `${type}_export_${new Date().toLocaleDateString('en-CA')}.csv`;

            switch(type) {
                case 'clients':
                    data = appData.clients;
                    columns = ['id', 'name', 'contactPerson', 'phone', 'email', 'gstin', 'address'];
                    break;
                case 'lorryReceipts':
                    data = appData.lrs;
                    columns = ['id', 'lrNumber', 'date', 'from', 'to', 'consignorId', 'consigneeId', 'vehicleNumber', 'paymentStatus', 'status'];
                    break;
                case 'invoices':
                    data = appData.invoices;
                    columns = ['id', 'date', 'clientId', 'invoiceValue', 'netPayable', 'status'];
                    break;
                case 'expenses':
                    data = appData.expenses;
                    columns = ['id', 'date', 'category', 'description', 'amount', 'vehicleNumber'];
                    break;
            }
            
            csvContent = arrayToCsv(data, columns);
            downloadCsv(csvContent, filename);
        });
    };
    
    const downloadCsv = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
         <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Export Data</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Download your data in CSV format.</p>
            
            <div className="space-y-2 mb-4">
                <p className="font-medium">Select data to export:</p>
                {(['clients', 'lorryReceipts', 'invoices', 'expenses'] as DataType[]).map(type => (
                    <label key={type} className="flex items-center space-x-2 capitalize">
                        <input type="checkbox" checked={selectedData.includes(type)} onChange={() => handleCheckboxChange(type)} className="form-checkbox text-blue-600 rounded" />
                        <span>{type.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                ))}
            </div>

            <button onClick={handleExport} className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700" disabled={selectedData.length === 0}>
                Export Selected Data
            </button>
        </div>
    );
}

export default SettingsView;