import React, { useState, FormEvent, useMemo, useEffect } from 'react';
import type { Client, AppSettings } from '../types';
import { SearchIcon, RefreshCw } from './icons';
import { FormRow, FormField, TextInput, TextAreaInput } from './FormComponents';
import ClientListPDF from './ClientListPDF';
import { getGstDetails } from '../data/api';

const emptyClient: Omit<Client, 'id'> = {
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
};

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


const ClientForm: React.FC<{ 
    onSave: (client: Client) => void; 
    onCancel: () => void;
    clientToEdit: Client | null;
}> = ({ onSave, onCancel, clientToEdit }) => {

    const [formData, setFormData] = useState<Omit<Client, 'id'> | Client>(clientToEdit || emptyClient);
    const [isFetchingGst, setIsFetchingGst] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(formData as Client);
    };

    const handleFetchGstDetails = async () => {
        if (!formData.gstin || formData.gstin.length !== 15) {
            alert('Please enter a valid 15-character GSTIN.');
            return;
        }
        setIsFetchingGst(true);
        try {
            const details = await getGstDetails(formData.gstin);
            if (details) {
                setFormData(prev => ({
                    ...prev,
                    name: details.tradeName || details.legalName,
                    address: details.address,
                }));
                alert('GST details fetched and fields populated!');
            }
        } catch (error) {
            // The apiFetch function already shows a generic alert.
            // We could add more specific UI feedback here if needed.
            console.error("Failed to fetch GST details", error);
        } finally {
            setIsFetchingGst(false);
        }
    };


    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg animate-fade-in mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">{clientToEdit ? 'Edit Client' : 'Add New Client'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormRow>
                    <FormField label="Client / Company Name">
                        <TextInput name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Acme Corp" required />
                    </FormField>
                    <FormField label="GSTIN">
                        <div className="flex items-center space-x-2">
                            <TextInput name="gstin" value={formData.gstin} onChange={handleChange} placeholder="e.g. 29ABCDE1234F1Z5" required maxLength={15} />
                            <button type="button" onClick={handleFetchGstDetails} disabled={isFetchingGst} className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300">
                                {isFetchingGst ? <RefreshCw className="animate-spin" /> : 'Fetch'}
                            </button>
                        </div>
                    </FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Contact Person">
                        <TextInput name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder="e.g. John Doe" />
                    </FormField>
                    <FormField label="Phone Number">
                        <TextInput name="phone" value={formData.phone} onChange={handleChange} placeholder="e.g. 9876543210" required />
                    </FormField>
                </FormRow>
                 <FormField label="Email Address">
                    <TextInput name="email" value={formData.email} onChange={handleChange} placeholder="e.g. contact@acme.com" />
                </FormField>
                <FormField label="Billing Address">
                    <TextAreaInput name="address" value={formData.address} onChange={handleChange} placeholder="Full billing address" />
                </FormField>

                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{clientToEdit ? 'Save Changes' : 'Save Client'}</button>
                </div>
            </form>
        </div>
    );
};


interface ClientViewProps {
    clients: Client[];
    onSave: (client: Client) => void;
    onDelete: (clientId: string) => void;
}

const ClientView: React.FC<ClientViewProps> = ({ clients, onSave, onDelete }) => {
    const [showForm, setShowForm] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
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
        setClientToEdit(null);
        setShowForm(true);
    };

    const handleEdit = (client: Client) => {
        setClientToEdit(client);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setClientToEdit(null);
    };

    const handleSave = (client: Client) => {
        onSave(client);
        setShowForm(false);
        setClientToEdit(null);
    };
    
    const filteredClients = useMemo(() => clients.filter(client => {
        const term = searchTerm.toLowerCase();
        return (
            client.name.toLowerCase().includes(term) ||
            client.contactPerson.toLowerCase().includes(term) ||
            client.phone.includes(term) ||
            client.gstin.toLowerCase().includes(term)
        );
    }), [clients, searchTerm]);

    if (showPreview) {
        return <ClientListPDF clients={filteredClients} settings={settings} onBack={() => setShowPreview(false)} />;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Clients</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your clients and their details.</p>
                </div>
                {!showForm && (
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setShowPreview(true)} className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-700">
                            Print List
                        </button>
                        <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700">
                          Add New Client
                        </button>
                    </div>
                )}
            </div>

            {showForm && <ClientForm onSave={handleSave} onCancel={handleCancel} clientToEdit={clientToEdit} />}

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <div className="relative w-1/3">
                        <input type="text" placeholder="Search clients..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-gray-200"/>
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-6 py-3">Client Name</th>
                                <th className="px-6 py-3">Contact Person</th>
                                <th className="px-6 py-3">Phone</th>
                                <th className="px-6 py-3">GSTIN</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map(client => (
                                <tr key={client.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{client.name}</td>
                                    <td className="px-6 py-4">{client.contactPerson}</td>
                                    <td className="px-6 py-4">{client.phone}</td>
                                    <td className="px-6 py-4 font-mono">{client.gstin}</td>
                                    <td className="px-6 py-4 space-x-2">
                                        <button onClick={() => handleEdit(client)} className="font-medium text-blue-600 hover:underline">Edit</button>
                                        <button onClick={() => onDelete(client.id)} className="font-medium text-red-600 hover:underline">Delete</button>
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

export default ClientView;