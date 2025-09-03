import React, { useState, FormEvent, useMemo, useEffect } from 'react';
import type { LorryReceipt, Client, GoodsItem, FreightDetails } from '../types';
import { FormRow, FormField, TextInput, DropdownInput, TextAreaInput } from './FormComponents';
import ClientForm from './ClientForm';


interface LorryReceiptFormProps {
    onSave: (lr: Omit<LorryReceipt, 'id' | 'status'> | LorryReceipt) => void;
    onCancel: () => void;
    clients: Client[];
    nextLrNumber: string;
    lrToEdit: LorryReceipt | null;
    onAddClient: (clientData: Omit<Client, 'id'>) => Promise<Client>;
}

const initialFreightDetails: FreightDetails = {
    basicFreight: 0, packingCharge: 0, pickupCharge: 0, serviceCharge: 0,
    loadingCharge: 0, codDodCharge: 0, otherCharges: 0, sgstPercent: 0, cgstPercent: 0, advancePaid: 0,
};

const emptyFormData: Omit<LorryReceipt, 'id' | 'status'> = {
    lrNumber: '',
    date: new Date().toLocaleDateString('en-CA'),
    from: '',
    to: '',
    consignorId: '',
    consigneeId: '',
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    paymentStatus: 'To Pay',
    transportMode: 'By Road',
    deliveryType: 'Door',
    goods: [],
    freightDetails: initialFreightDetails,
    gstPayableBy: 'Consignee',
    demurrageAfterHours: 1,
    demurrageChargePerHour: 0,
    otherRemark: "Total amount of goods as per the invoice",
    bankName: '',
    bankAccountNo: '',
    bankIfsc: '',
    receiverComments: '',
    isPickupDeliverySameAsPartyAddress: true,
    includeFreightDetails: false,
};

const mockHsnDatabase: { [key: string]: string | string[] } = {
    '330741': 'Agarbatti and other odoriferous preparations',
    '870899': 'Other parts and accessories of motor vehicles',
    '620342': 'Men\'s or boys\' trousers of cotton',
    '996511': ['Road transport services of freight by refrigerator vehicles', 'Road transport services of freight by other means'],
    '080450': 'Guavas, mangoes and mangosteens',
};

const fetchHsnData = async (hsnCode: string): Promise<string | string[] | null> => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    if (mockHsnDatabase[hsnCode]) {
        return mockHsnDatabase[hsnCode];
    }
    return null;
};

const LorryReceiptForm: React.FC<LorryReceiptFormProps> = ({ onSave, onCancel, clients, nextLrNumber, lrToEdit, onAddClient }) => {
    
    const [formData, setFormData] = useState<Omit<LorryReceipt, 'id' | 'status'> | LorryReceipt>(() => {
        if (lrToEdit) {
            return {
                ...lrToEdit,
                date: new Date(lrToEdit.date).toLocaleDateString('en-CA'),
            };
        }
        return {
            ...emptyFormData,
            lrNumber: nextLrNumber,
            goods: [{ id: Date.now().toString(), productName: '', packagingType: '', hsnCode: '', packages: 0, actualWeight: 0, chargeWeight: 0, freightRate: 0 }]
        };
    });
    
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [clientFieldToSet, setClientFieldToSet] = useState<'consignorId' | 'consigneeId' | null>(null);
    const [formErrors, setFormErrors] = useState<{ driverName?: string; driverPhone?: string; hsn?: { [key: number]: string } }>({});
    const [hsnResults, setHsnResults] = useState<{ [key: number]: string[] }>({});
    const [isHsnLoading, setIsHsnLoading] = useState<{ [key: number]: boolean }>({});
    const [isProductNameManual, setIsProductNameManual] = useState<{ [key: number]: boolean }>({ 0: true });

    const selectedConsignor = useMemo(() => clients.find(c => c.id === formData.consignorId), [formData.consignorId, clients]);
    const selectedConsignee = useMemo(() => clients.find(c => c.id === formData.consigneeId), [formData.consigneeId, clients]);
    
    useEffect(() => {
        if (formData.isPickupDeliverySameAsPartyAddress) {
            setFormData(prev => ({
                ...prev,
                from: selectedConsignor?.address || prev.from,
                to: selectedConsignee?.address || prev.to,
            }));
        }
    }, [formData.isPickupDeliverySameAsPartyAddress, selectedConsignor, selectedConsignee]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handlePartyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (value === 'add-new') {
            setClientFieldToSet(name as 'consignorId' | 'consigneeId');
            setIsClientModalOpen(true);
        } else {
            handleChange(e);
        }
    };
    
    const handleSaveNewClient = async (clientData: Omit<Client, 'id'>) => {
        const newClient = await onAddClient(clientData);
        if (clientFieldToSet) {
            setFormData(prev => ({ ...prev, [clientFieldToSet]: newClient.id }));
        }
        setIsClientModalOpen(false);
        setClientFieldToSet(null);
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setFormData(prev => ({
            ...prev,
            isPickupDeliverySameAsPartyAddress: isChecked,
            from: isChecked ? selectedConsignor?.address || '' : '',
            to: isChecked ? selectedConsignee?.address || '' : '',
        }));
    };

    const handleFreightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            freightDetails: {
                ...prev.freightDetails,
                [name]: parseFloat(value) || 0,
            }
        }));
    };

    const handleGoodsChange = (index: number, field: keyof GoodsItem, value: string | number) => {
        setFormData(prev => {
            const newGoods = [...prev.goods];
            const item = { ...newGoods[index] };
            (item[field] as any) = value;
            newGoods[index] = item;
            return { ...prev, goods: newGoods };
        });
    };

    const addGoodsItem = () => {
        setFormData(prev => ({
            ...prev,
            goods: [...prev.goods, {
                id: Date.now().toString(),
                productName: '', packagingType: '', hsnCode: '',
                packages: 0, actualWeight: 0, chargeWeight: 0, freightRate: 0,
            }]
        }));
        setIsProductNameManual(prev => ({...prev, [formData.goods.length]: true }));
    };
    
    const removeGoodsItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            goods: prev.goods.filter((_, i) => i !== index)
        }));
    };
    
    const handleHsnBlur = async (index: number) => {
        const item = formData.goods[index];
        if (!item.hsnCode || item.hsnCode.length !== 6) {
            setFormErrors(prev => ({ ...prev, hsn: {...prev.hsn, [index]: 'HSN code must be 6 digits.' }}));
            return;
        }

        const newHsnErrors = {...formErrors.hsn};
        delete newHsnErrors[index];
        setFormErrors(prev => ({ ...prev, hsn: newHsnErrors }));
        
        const newResults = {...hsnResults};
        delete newResults[index];
        setHsnResults(newResults);

        setIsHsnLoading(prev => ({ ...prev, [index]: true }));
        setIsProductNameManual(prev => ({...prev, [index]: false}));

        const result = await fetchHsnData(item.hsnCode);
        if (result) {
            if (typeof result === 'string') {
                handleGoodsChange(index, 'productName', result);
                setIsProductNameManual(prev => ({...prev, [index]: true})); // Allow editing even if found
            } else { // It's an array
                setHsnResults(prev => ({ ...prev, [index]: result }));
                handleGoodsChange(index, 'productName', '');
            }
        } else {
            handleGoodsChange(index, 'productName', ''); 
            setIsProductNameManual(prev => ({...prev, [index]: true}));
        }
        setIsHsnLoading(prev => ({ ...prev, [index]: false }));
    };


    const totals = useMemo(() => {
        const { freightDetails } = formData;
        const subtotal = freightDetails.basicFreight + freightDetails.packingCharge + freightDetails.pickupCharge +
                         freightDetails.serviceCharge + freightDetails.loadingCharge + freightDetails.codDodCharge +
                         freightDetails.otherCharges;
        const sgst = subtotal * (freightDetails.sgstPercent / 100);
        const cgst = subtotal * (freightDetails.cgstPercent / 100);
        const totalFreight = subtotal + sgst + cgst;
        const remainingPayable = totalFreight - freightDetails.advancePaid;
        return { subtotal, sgst, cgst, totalFreight, remainingPayable };
    }, [formData.freightDetails]);

    const validateForm = (): boolean => {
        const errors: { driverName?: string; driverPhone?: string; hsn?: { [key: number]: string } } = {};
        const nameRegex = /^[a-zA-Z\s]+$/;
        const phoneRegex = /^[6-9]\d{9}$/;

        if (!formData.driverName || !nameRegex.test(formData.driverName)) {
            errors.driverName = 'Please enter a valid name (alphabetic characters only).';
        }
        if (!formData.driverPhone || !phoneRegex.test(formData.driverPhone)) {
            errors.driverPhone = 'Please enter a valid 10-digit Indian mobile number.';
        }
        
        formData.goods.forEach((item, index) => {
            if (!item.hsnCode || item.hsnCode.length !== 6) {
                 if(!errors.hsn) errors.hsn = {};
                 errors.hsn[index] = 'HSN code must be 6 digits.';
            }
        });

        setFormErrors(errors);
        return Object.keys(errors).length === 0 && (!errors.hsn || Object.keys(errors.hsn).length === 0);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            alert('Please fix the errors before submitting.');
            return;
        }
        if(!formData.consignorId || !formData.consigneeId) {
            alert("Please select Consignor and Consignee");
            return;
        }
        onSave(formData);
    };

    return (
        <>
        {isClientModalOpen && <ClientForm onSave={handleSaveNewClient} onCancel={() => setIsClientModalOpen(false)} clientToEdit={null} />}
        <div className="bg-white p-6 rounded-lg shadow-lg animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6">{lrToEdit ? 'Edit' : 'Generate'} Lorry Receipt / Bilty</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <fieldset className="border p-4 rounded-md">
                    <legend className="px-2 font-semibold text-gray-700">Basic Details</legend>
                    <FormRow>
                        <FormField label="LR Number">
                            <TextInput value={formData.lrNumber} readOnly className="bg-gray-200 cursor-not-allowed" />
                        </FormField>
                        <FormField label="Date">
                            <TextInput type="date" name="date" value={formData.date} onChange={handleChange} required />
                        </FormField>
                    </FormRow>
                </fieldset>

                <fieldset className="border p-4 rounded-md space-y-4">
                    <legend className="px-2 font-semibold text-gray-700">Party & Address Details</legend>
                    <FormRow>
                        <FormField label="Consignor (Sender)">
                            <DropdownInput name="consignorId" value={formData.consignorId} onChange={handlePartyChange} required>
                                <option value="">Select Consignor</option>
                                {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                                <option value="add-new" className="font-bold text-blue-600">+ Add New Client</option>
                            </DropdownInput>
                        </FormField>
                        <FormField label="Consignee (Receiver)">
                           <DropdownInput name="consigneeId" value={formData.consigneeId} onChange={handlePartyChange} required>
                                <option value="">Select Consignee</option>
                                {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                                <option value="add-new" className="font-bold text-blue-600">+ Add New Client</option>
                            </DropdownInput>
                        </FormField>
                    </FormRow>
                    {selectedConsignor && <div className="text-xs p-2 bg-blue-50 rounded"><b>Consignor Address:</b> {selectedConsignor.address}</div>}
                    {selectedConsignee && <div className="text-xs p-2 bg-green-50 rounded"><b>Consignee Address:</b> {selectedConsignee.address}</div>}
                    
                    <div className="pt-2">
                         <div className="flex items-center space-x-2 mb-2">
                            <input type="checkbox" id="sameAddress" checked={formData.isPickupDeliverySameAsPartyAddress} onChange={handleCheckboxChange} />
                            <label htmlFor="sameAddress" className="text-sm font-medium">Pickup and Delivery Same as Party Address</label>
                        </div>
                        <FormRow>
                           <FormField label={formData.isPickupDeliverySameAsPartyAddress ? "From (Origin)" : "Loading Address"}>
                                <TextAreaInput name="from" value={formData.from} onChange={handleChange} rows={2} placeholder="Pickup / Loading Address" required />
                            </FormField>
                            <FormField label={formData.isPickupDeliverySameAsPartyAddress ? "To (Destination)" : "Delivery Address"}>
                                <TextAreaInput name="to" value={formData.to} onChange={handleChange} rows={2} placeholder="Destination / Delivery Address" required />
                            </FormField>
                        </FormRow>
                    </div>
                </fieldset>

                <fieldset className="border p-4 rounded-md space-y-4">
                    <legend className="px-2 font-semibold text-gray-700">Shipment Details</legend>
                     <FormRow>
                        <FormField label="Vehicle Number">
                            <TextInput name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} placeholder="e.g. MH01AB1234" required />
                        </FormField>
                        <FormField label="Payment Status">
                            <DropdownInput name="paymentStatus" value={formData.paymentStatus} onChange={handleChange}>
                                <option value="To Pay">To Pay</option>
                                <option value="Paid">Paid</option>
                                <option value="Part Paid">Part Paid</option>
                            </DropdownInput>
                        </FormField>
                    </FormRow>
                    <FormRow>
                         <FormField label="Driver's Name">
                            <TextInput name="driverName" value={formData.driverName} onChange={handleChange} placeholder="e.g. Suresh Kumar" required />
                            {formErrors.driverName && <p className="text-red-500 text-xs mt-1">{formErrors.driverName}</p>}
                        </FormField>
                        <FormField label="Driver's Phone Number">
                            <TextInput name="driverPhone" value={formData.driverPhone} onChange={handleChange} placeholder="10-digit mobile number" required />
                            {formErrors.driverPhone && <p className="text-red-500 text-xs mt-1">{formErrors.driverPhone}</p>}
                        </FormField>
                    </FormRow>
                </fieldset>

                 <fieldset className="border p-4 rounded-md">
                    <legend className="px-2 font-semibold text-gray-700">Goods Details</legend>
                    <div className="space-y-3">
                        {formData.goods.map((item, index) => (
                             <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 border-b pb-3 items-start">
                                <div className="md:col-span-2">
                                    <FormField label="HSN Code">
                                    <TextInput placeholder="6-digit HSN" value={item.hsnCode} onChange={e => handleGoodsChange(index, 'hsnCode', e.target.value)} onBlur={() => handleHsnBlur(index)} maxLength={6} />
                                    {isHsnLoading[index] && <p className="text-xs text-blue-500">Fetching...</p>}
                                    {formErrors.hsn?.[index] && <p className="text-red-500 text-xs mt-1">{formErrors.hsn[index]}</p>}
                                    </FormField>
                                </div>
                                
                                <div className="md:col-span-4">
                                     <FormField label="Product Name">
                                    {hsnResults[index] && hsnResults[index].length > 1 ? (
                                        <DropdownInput value={item.productName} onChange={e => handleGoodsChange(index, 'productName', e.target.value)} >
                                            <option value="">Select Product</option>
                                            {hsnResults[index].map(product => <option key={product} value={product}>{product}</option>)}
                                        </DropdownInput>
                                    ) : (
                                        <TextInput placeholder="Product Name" value={item.productName} onChange={e => handleGoodsChange(index, 'productName', e.target.value)} readOnly={!isProductNameManual[index]} className={!isProductNameManual[index] ? 'bg-gray-200 cursor-not-allowed' : ''} />
                                    )}
                                    {isProductNameManual[index] && !hsnResults[index] && !isHsnLoading[index] && item.hsnCode?.length === 6 && (
                                        <p className="text-xs text-gray-500">HSN not found. Please enter manually.</p>
                                    )}
                                    </FormField>
                                </div>

                                <div className="md:col-span-2"><FormField label="Packaging"><TextInput placeholder="e.g. Box, Bag" value={item.packagingType} onChange={e => handleGoodsChange(index, 'packagingType', e.target.value)} /></FormField></div>
                                <div className="md:col-span-1"><FormField label="Packages"><TextInput placeholder="0" type="number" value={item.packages || ''} onChange={e => handleGoodsChange(index, 'packages', parseInt(e.target.value) || 0)} /></FormField></div>
                                <div className="md:col-span-1"><FormField label="Actual Wt."><TextInput placeholder="0.00" type="number" value={item.actualWeight || ''} onChange={e => handleGoodsChange(index, 'actualWeight', parseInt(e.target.value) || 0)} /></FormField></div>
                                <div className="md:col-span-2 flex items-end">
                                    <FormField label="Charge Wt.">
                                        <div className="flex items-center">
                                            <TextInput placeholder="0.00" type="number" value={item.chargeWeight || ''} onChange={e => handleGoodsChange(index, 'chargeWeight', parseInt(e.target.value) || 0)} />
                                            <button type="button" onClick={() => removeGoodsItem(index)} className="ml-2 text-red-500 hover:text-red-700 p-2">&times;</button>
                                        </div>
                                    </FormField>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addGoodsItem} className="mt-2 text-sm text-blue-600 hover:underline">+ Add Item</button>
                 </fieldset>

                <div className="pt-2">
                    <div className="flex items-center space-x-2 mb-2">
                        <input type="checkbox" id="includeFreightDetails" name="includeFreightDetails" checked={formData.includeFreightDetails} onChange={e => setFormData(prev => ({ ...prev, includeFreightDetails: e.target.checked }))} />
                        <label htmlFor="includeFreightDetails" className="text-sm font-medium">Include Freight Details</label>
                    </div>
                </div>

                {formData.includeFreightDetails && (
                    <fieldset className="border p-4 rounded-md">
                        <legend className="px-2 font-semibold text-gray-700">Freight Calculation</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                            <div className="space-y-2">
                                <FormRow>
                                    <FormField label="Basic Freight"><TextInput type="number" name="basicFreight" value={formData.freightDetails.basicFreight || ''} onChange={handleFreightChange} /></FormField>
                                    <FormField label="Packing Charge"><TextInput type="number" name="packingCharge" value={formData.freightDetails.packingCharge || ''} onChange={handleFreightChange} /></FormField>
                                </FormRow>
                                <FormRow>
                                    <FormField label="Pickup Charge"><TextInput type="number" name="pickupCharge" value={formData.freightDetails.pickupCharge || ''} onChange={handleFreightChange} /></FormField>
                                    <FormField label="Loading Charge"><TextInput type="number" name="loadingCharge" value={formData.freightDetails.loadingCharge || ''} onChange={handleFreightChange} /></FormField>
                                </FormRow>
                                <FormRow>
                                    <FormField label="Other Charges"><TextInput type="number" name="otherCharges" value={formData.freightDetails.otherCharges || ''} onChange={handleFreightChange} /></FormField>
                                    <FormField label="Advance Paid"><TextInput type="number" name="advancePaid" value={formData.freightDetails.advancePaid || ''} onChange={handleFreightChange} /></FormField>
                                </FormRow>
                            </div>
                            <div className="space-y-2 text-sm border-t md:border-t-0 md:border-l md:pl-4 mt-4 md:mt-0 pt-4 md:pt-0">
                                <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span> <span className="font-medium">{totals.subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-600">SGST:</span> <span className="font-medium">{totals.sgst.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-600">CGST:</span> <span className="font-medium">{totals.cgst.toFixed(2)}</span></div>
                                <div className="flex justify-between font-bold text-base border-t pt-1"><span className="text-gray-800">Total Freight:</span> <span>{totals.totalFreight.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-600">Advance Paid:</span> <span className="font-medium text-green-600">-{formData.freightDetails.advancePaid.toFixed(2)}</span></div>
                                <div className="flex justify-between font-bold text-base text-red-600 border-t pt-1"><span >Remaining Payable:</span> <span>{totals.remainingPayable.toFixed(2)}</span></div>
                            </div>
                        </div>
                    </fieldset>
                )}

                <fieldset className="border p-4 rounded-md">
                    <legend className="px-2 font-semibold text-gray-700">Other Details</legend>
                    <FormField label="Other Remarks"><TextAreaInput name="otherRemark" value={formData.otherRemark} onChange={handleChange} rows={2} /></FormField>
                    <FormRow>
                        <FormField label="Bank Name"><TextInput name="bankName" value={formData.bankName} onChange={handleChange} /></FormField>
                        <FormField label="Bank A/C No."><TextInput name="bankAccountNo" value={formData.bankAccountNo} onChange={handleChange} /></FormField>
                        <FormField label="IFSC Code"><TextInput name="bankIfsc" value={formData.bankIfsc} onChange={handleChange} /></FormField>
                    </FormRow>
                     <FormRow>
                        <FormField label="Demurrage After (Hours)"><TextInput type="number" name="demurrageAfterHours" value={formData.demurrageAfterHours || ''} onChange={handleChange} /></FormField>
                        <FormField label="Demurrage Charge (Per Hour)"><TextInput type="number" name="demurrageChargePerHour" value={formData.demurrageChargePerHour || ''} onChange={handleChange} /></FormField>
                    </FormRow>
                </fieldset>

                <div className="flex justify-end space-x-2 pt-6">
                    <button type="button" onClick={onCancel} className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                    <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{lrToEdit ? 'Update LR' : 'Generate LR'}</button>
                </div>
            </form>
        </div>
        </>
    );
};

export default LorryReceiptForm;