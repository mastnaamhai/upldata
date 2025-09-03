import React, { useState, FormEvent, useMemo, useEffect } from 'react';
import type { Client, AppSettings } from '../types';
import { SearchIcon } from './icons';
import ClientForm from './ClientForm';
import ClientListPDF from './ClientListPDF';

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