import React, { useState, FormEvent, useEffect } from 'react';
import type { Client } from '../types';
import { RefreshCw } from './icons';
import { FormRow, FormField, TextInput, TextAreaInput } from './FormComponents';
import { getGstDetails } from '../data/api';

const emptyClient: Omit<Client, 'id'> = {
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
};

const ClientForm: React.FC<{
    onSave: (client: Omit<Client, 'id'> | Client) => void;
    onCancel: () => void;
    clientToEdit: Client | null;
}> = ({ onSave, onCancel, clientToEdit }) => {

    const [formData, setFormData] = useState<Omit<Client, 'id'> | Client>(clientToEdit || emptyClient);
    const [isFetchingGst, setIsFetchingGst] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            setError('Client Name is required.');
            return;
        }
        onSave(formData);
    };

    const handleFetchGstDetails = async () => {
        if (!formData.gstin || formData.gstin.length !== 15) {
            alert('Please enter a valid 15-character GSTIN.');
            return;
        }
        setIsFetchingGst(true);
        setError('');
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
        } catch (error: any) {
            setError(error.message || 'Failed to fetch GST details');
            console.error("Failed to fetch GST details", error);
        } finally {
            setIsFetchingGst(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg animate-fade-in">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{clientToEdit ? 'Edit Client' : 'Add New Client'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                    <FormRow>
                        <FormField label="Client / Company Name">
                            <TextInput name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Acme Corp" required />
                        </FormField>
                        <FormField label="GSTIN">
                            <div className="flex items-center space-x-2">
                                <TextInput name="gstin" value={formData.gstin} onChange={handleChange} placeholder="e.g. 29ABCDE1234F1Z5" maxLength={15} />
                                <button type="button" onClick={handleFetchGstDetails} disabled={isFetchingGst} className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300">
                                    {isFetchingGst ? <RefreshCw className="animate-spin" /> : 'Fetch'}
                                </button>
                            </div>
                        </FormField>
                    </FormRow>
                    <FormField label="Billing Address">
                        <TextAreaInput name="address" value={formData.address} onChange={handleChange} placeholder="Full billing address" />
                    </FormField>
                    <FormRow>
                        <FormField label="Contact Person">
                            <TextInput name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder="e.g. John Doe" />
                        </FormField>
                        <FormField label="Phone Number">
                            <TextInput name="phone" value={formData.phone} onChange={handleChange} placeholder="e.g. 9876543210" />
                        </FormField>
                    </FormRow>
                    <FormField label="Email Address">
                        <TextInput name="email" value={formData.email} onChange={handleChange} placeholder="e.g. contact@acme.com" />
                    </FormField>

                    {error && <p className="text-red-500 text-xs">{error}</p>}

                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onCancel} className="px-4 py-2 font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                        <button type="submit" className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{clientToEdit ? 'Save Changes' : 'Save Client'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientForm;
