import React, { useState, FormEvent } from 'react';
import type { LrBookingData } from '../types';
import { FormRow, FormField, TextInput, DropdownInput, TextAreaInput } from './FormComponents';

interface LorryReceiptFormProps {
    onSave: (lrBookingData: LrBookingData) => void;
    onCancel: () => void;
    lrNumber: string;
}

const LorryReceiptForm: React.FC<LorryReceiptFormProps> = ({ onSave, onCancel, lrNumber }) => {
    
    const [formData, setFormData] = useState<LrBookingData>({
        consignor_name: '',
        consignee_name: '',
        origin_location: '',
        destination_location: '',
        goods_description: '',
        quantity: 0,
        weight: 0,
        freight_type: 'Due',
        freight_amount: 0,
        hide_freight_in_pdf: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        // Basic validation
        if (!formData.consignor_name || !formData.consignee_name || !formData.origin_location || !formData.destination_location) {
            alert('Please fill out all required fields.');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">Book New Lorry Receipt</h2>
            <form onSubmit={handleSubmit} className="space-y-6">

                <fieldset className="border dark:border-gray-700 p-4 rounded-md">
                    <legend className="px-2 font-semibold text-gray-700 dark:text-gray-300">LR Number: {lrNumber}</legend>
                    <FormRow>
                        <FormField label="Consignor Name">
                            <TextInput name="consignor_name" value={formData.consignor_name} onChange={handleChange} required />
                        </FormField>
                        <FormField label="Consignee Name">
                            <TextInput name="consignee_name" value={formData.consignee_name} onChange={handleChange} required />
                        </FormField>
                    </FormRow>
                    <FormRow>
                        <FormField label="Origin">
                            <TextInput name="origin_location" value={formData.origin_location} onChange={handleChange} required />
                        </FormField>
                        <FormField label="Destination">
                            <TextInput name="destination_location" value={formData.destination_location} onChange={handleChange} required />
                        </FormField>
                    </FormRow>
                </fieldset>

                <fieldset className="border dark:border-gray-700 p-4 rounded-md">
                    <legend className="px-2 font-semibold text-gray-700 dark:text-gray-300">Goods Details</legend>
                     <FormField label="Goods Description">
                        <TextAreaInput name="goods_description" value={formData.goods_description} onChange={handleChange} rows={3} required />
                    </FormField>
                    <FormRow>
                        <FormField label="Quantity">
                            <TextInput type="number" name="quantity" value={formData.quantity || ''} onChange={handleNumericChange} required />
                        </FormField>
                        <FormField label="Weight (kg)">
                            <TextInput type="number" name="weight" value={formData.weight || ''} onChange={handleNumericChange} required />
                        </FormField>
                    </FormRow>
                </fieldset>

                 <fieldset className="border dark:border-gray-700 p-4 rounded-md">
                    <legend className="px-2 font-semibold text-gray-700 dark:text-gray-300">Freight Details</legend>
                    <FormRow>
                        <FormField label="Freight Type">
                            <DropdownInput name="freight_type" value={formData.freight_type} onChange={handleChange}>
                                <option value="Due">Due</option>
                                <option value="Paid">Paid</option>
                            </DropdownInput>
                        </FormField>
                        <FormField label="Freight Amount (₹)">
                            <TextInput type="number" name="freight_amount" value={formData.freight_amount || ''} onChange={handleNumericChange} required />
                        </FormField>
                    </FormRow>
                    <div className="flex items-center space-x-2 mt-4">
                        <input type="checkbox" id="hide_freight_in_pdf" name="hide_freight_in_pdf" checked={formData.hide_freight_in_pdf} onChange={(e) => setFormData(prev => ({...prev, hide_freight_in_pdf: e.target.checked}))} className="h-4 w-4 rounded" />
                        <label htmlFor="hide_freight_in_pdf" className="text-sm font-medium text-gray-700 dark:text-gray-300">Hide Freight Amount in PDF</label>
                    </div>
                </fieldset>

                <div className="flex justify-end space-x-2 pt-6">
                    <button type="button" onClick={onCancel} className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Cancel</button>
                    <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Book LR</button>
                </div>
            </form>
        </div>
    );
};

export default LorryReceiptForm;