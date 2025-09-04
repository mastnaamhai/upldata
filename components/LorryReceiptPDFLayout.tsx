import React from 'react';
import type { LorryReceipt, Client, AppSettings, LorryReceiptCopyType } from '../types';

interface LorryReceiptPDFLayoutProps {
    lr: LorryReceipt;
    clients: Client[];
    settings: AppSettings;
    copyType: LorryReceiptCopyType;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0 }).format(value);

const LorryReceiptPDFLayout: React.FC<LorryReceiptPDFLayoutProps> = ({ lr, clients, settings, copyType }) => {
    const consignor = clients.find(c => c.id === lr.consignorId);
    const consignee = clients.find(c => c.id === lr.consigneeId);

    const { freightDetails } = lr;
    const subtotal = freightDetails.basicFreight + freightDetails.packingCharge + freightDetails.pickupCharge +
                     freightDetails.serviceCharge + freightDetails.loadingCharge + freightDetails.codDodCharge +
                     freightDetails.otherCharges;
    const sgst = subtotal * (freightDetails.sgstPercent / 100);
    const cgst = subtotal * (freightDetails.cgstPercent / 100);
    const totalFreight = subtotal + sgst + cgst;
    const remainingPayable = totalFreight - freightDetails.advancePaid;

    const goodsTotalPackages = lr.goods.reduce((sum, item) => sum + item.packages, 0);
    const goodsTotalActualWeight = lr.goods.reduce((sum, item) => sum + item.actualWeight, 0);
    const goodsTotalChargeWeight = lr.goods.reduce((sum, item) => sum + item.chargeWeight, 0);

    return (
        <div className="relative p-6 border-2 border-black">
            <div className="absolute inset-0 flex items-center justify-center -z-10">
                <p className="text-[90px] md:text-[120px] font-black text-gray-200 opacity-50 transform -rotate-45 select-none pointer-events-none">
                    {copyType.toUpperCase()} COPY
                </p>
            </div>
            <header className="text-center mb-4 border-b border-black pb-2">
                {settings.company.logo && <img src={settings.company.logo} alt="Company Logo" className="h-16 w-auto mx-auto mb-2" />}
                <h1 className="text-xl font-bold">{settings.company.companyName}</h1>
                {settings.company.address.split('\n').map((line, index) => (
                    <p key={index} className="text-[10px] leading-tight">{line}</p>
                ))}
                <p className="text-xs font-semibold">GSTIN: {settings.company.gstNumber}</p>
            </header>
            <div className="grid grid-cols-3 gap-4 border-y border-black py-1">
                <div className="col-span-2">
                    <p className="font-bold">Notice</p>
                    <p>Without the consignee's written permission this consignment will not be diverted, re-routed, or rebooked and it should be delivered at the destination. Lorry Receipt will be delivered to the only consignee. Without prior approval, Lorry Receipt can not be handover to anyone.</p>
                </div>
                <div className="text-center border-l border-black pl-2">
                    <p className="font-bold">AT OWNER'S RISK</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 my-2">
                <div>
                        <p><span className="font-bold">LR Date:</span> {new Date(lr.date).toLocaleDateString('en-GB')}</p>
                        <p><span className="font-bold">Transport Mode:</span> {lr.transportMode}</p>
                        <p><span className="font-bold">Delivery Type:</span> {lr.deliveryType}</p>
                </div>
                <div className="text-right">
                        <p><span className="font-bold">LR No:</span> {lr.lrNumber}</p>
                        <p><span className="font-bold">Payment Status:</span> {lr.paymentStatus}</p>
                </div>
            </div>
            <div className="border-y border-black py-1 grid grid-cols-2">
                <div>
                    <p><span className="font-bold">Vehicle Number:</span> {lr.vehicleNumber}</p>
                    <p><span className="font-bold">Driver Details:</span> {lr.driverName} - {lr.driverPhone}</p>
                </div>
                <div>
                    <p><span className="font-bold">E-Way Bill No:</span> {lr.eWayBillNumber}</p>
                    <p><span className="font-bold">Seal No:</span> {lr.sealNumber}</p>
                </div>
            </div>
                <div className="text-center text-sm font-semibold border-b border-black py-1">
                    {lr.isInsured ? (
                        <p><span className="font-bold">Insurance Details:</span> {lr.insuranceDetails}</p>
                    ) : (
                        <p>Insurance details is not available or not insured.</p>
                    )}
                </div>


            <div className="grid grid-cols-2 gap-4 border-b border-black py-2">
                <div>
                    <p className="font-bold underline">Consignor:</p>
                    <p className="font-semibold">{consignor?.name}</p>
                    <p>GST No: {consignor?.gstin}</p>
                    <p>Mobile: {consignor?.phone}</p>
                    <p>Address: {consignor?.address}</p>
                </div>
                <div>
                    <p className="font-bold underline">Consignee:</p>
                    <p className="font-semibold">{consignee?.name}</p>
                    <p>GST No: {consignee?.gstin}</p>
                    <p>Mobile: {consignee?.phone}</p>
                    <p>Address: {consignee?.address}</p>
                </div>
            </div>

            <div className="flex">
                <div className={lr.includeFreightDetails ? "w-2/3 pr-2" : "w-full"}>
                    <table className="w-full mt-2 border-collapse border border-black">
                        <thead>
                            <tr className="border border-black">
                                <th className="p-1 border border-black">Sr no.</th>
                                <th className="p-1 border border-black">HSN</th>
                                <th className="p-1 border border-black">Description of Goods</th>
                                <th className="p-1 border border-black">Method of Packing</th>
                                <th className="p-1 border border-black">Number of Packages</th>
                                <th className="p-1 border border-black">Actual Weight</th>
                                <th className="p-1 border border-black">Charged Weight</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lr.goods.map((item, index) => (
                                    <tr key={item.id}>
                                    <td className="p-1 border border-black text-center">{index + 1}</td>
                                    <td className="p-1 border border-black">{item.hsnCode}</td>
                                    <td className="p-1 border border-black">{item.productName}</td>
                                    <td className="p-1 border border-black">{item.packagingType}</td>
                                    <td className="p-1 border border-black text-right">{item.packages}</td>
                                    <td className="p-1 border border-black text-right">{item.actualWeight.toFixed(2)}</td>
                                    <td className="p-1 border border-black text-right">{item.chargeWeight.toFixed(2)}</td>
                                </tr>
                            ))}
                            {Array.from({ length: 10 - lr.goods.length }).map((_, i) => (
                                <tr key={`empty-${i}`}><td className="p-1 border border-black h-6" colSpan={7}></td></tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold">
                                <td className="p-1 border border-black" colSpan={4}>Total:</td>
                                <td className="p-1 border border-black text-right">{goodsTotalPackages}</td>
                                <td className="p-1 border border-black text-right">{goodsTotalActualWeight.toFixed(2)}</td>
                                <td className="p-1 border border-black text-right">{goodsTotalChargeWeight.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                {lr.includeFreightDetails && (
                    <div className="w-1/3 pl-2 mt-2">
                        <table className="w-full border-collapse border border-black">
                            <tbody>
                                {[
                                    { label: 'Total Basic Freight', value: freightDetails.basicFreight },
                                    { label: 'Packing & Unpacking Charge', value: freightDetails.packingCharge },
                                    { label: 'Pickup Charges & Door Delivery', value: freightDetails.pickupCharge },
                                    { label: 'Service Charge', value: freightDetails.serviceCharge },
                                    { label: 'Loading Charges & Unloading', value: freightDetails.loadingCharge },
                                    { label: 'Cash On Delivery(COD)', value: freightDetails.codDodCharge },
                                    { label: 'Other Charges', value: freightDetails.otherCharges },
                                ].map(item => (
                                    <tr key={item.label}><td className="p-1 border border-black">{item.label}</td><td className="p-1 border border-black text-right">{formatCurrency(item.value)}</td></tr>
                                ))}
                                <tr className="font-bold"><td className="p-1 border border-black">Subtotal</td><td className="p-1 border border-black text-right">{formatCurrency(subtotal)}</td></tr>
                                <tr><td className="p-1 border border-black">GST TAX (SGST {freightDetails.sgstPercent}%)</td><td className="p-1 border border-black text-right">{formatCurrency(sgst)}</td></tr>
                                <tr><td className="p-1 border border-black">GST TAX (CGST {freightDetails.cgstPercent}%)</td><td className="p-1 border border-black text-right">{formatCurrency(cgst)}</td></tr>
                                <tr className="font-bold"><td className="p-1 border border-black">Total Freight</td><td className="p-1 border border-black text-right">{formatCurrency(totalFreight)}</td></tr>
                                <tr><td className="p-1 border border-black">Advance Paid</td><td className="p-1 border border-black text-right">{formatCurrency(freightDetails.advancePaid)}</td></tr>
                                <tr className="font-bold"><td className="p-1 border border-black">Remaining Payable Amount</td><td className="p-1 border border-black text-right">{formatCurrency(remainingPayable)}</td></tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2 border-t border-black pt-2">
                <div className="font-bold">
                    <p>GST Payable by: {lr.gstPayableBy}</p>
                    <p>Remaining Amount to be paid by: {remainingPayable > 0 ? (lr.gstPayableBy === 'Consignee' ? 'Consignee' : 'Consignor') : 'N/A'}</p>
                    {copyType === 'Driver' && consignee && (
                        <div className="mt-2 p-2 border border-dashed border-black bg-yellow-50">
                            <p className="font-bold underline">Delivery Instructions:</p>
                            <p>Contact consignee ({consignee.name}) at {consignee.phone} upon arrival. Obtain signature and stamp upon delivery.</p>
                        </div>
                    )}
                </div>
                <div className="text-right font-bold">
                    <p>For {settings.company.companyName}</p>
                    {copyType === 'Office' ? (
                        <div className="mt-20">
                            <p className="pt-2 border-t border-gray-400">Received By (Signature & Stamp)</p>
                        </div>
                    ) : (
                        <div className="mt-20">
                            <p className="pt-2 border-t border-gray-400">(Authorised Signatory)</p>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2 border-y border-black py-1">
                <div>
                    <p className="font-bold">Other Remark:</p>
                    <p>{lr.otherRemark}</p>
                </div>
                <div className="border-l border-black pl-2">
                    <p className="font-bold">Schedule of demurrage charges</p>
                    <p>Demurrage charges applicable from reporting time after: {lr.demurrageAfterHours} hour.</p>
                    <p>Applicable Charge: {lr.demurrageChargePerHour} Per Hour.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-1">
                <div>
                    <p>Bank Name: {settings.company.bankName || lr.bankName}</p>
                    <p>Bank A/C No.: {settings.company.accountNumber || lr.bankAccountNo}</p>
                    <p>IFSC: {settings.company.ifscCode || lr.bankIfsc}</p>
                </div>
                <div className="text-sm">
                    <p>"Total amount of goods as per the invoice"</p>
                    <p>This is computer generated LR/ Bilty.</p>
                </div>
            </div>
        </div>
    );
};

export default LorryReceiptPDFLayout;
