import React, { useState } from 'react';
import type { LorryReceipt, Client, LorryReceiptCopyType } from '../types';
import LorryReceiptPDF from './LorryReceiptPDF';
import { EyeIcon, DownloadIcon } from './icons';

interface LorryReceiptCopiesViewProps {
    lr: LorryReceipt;
    clients: Client[];
    onBack: () => void;
}

const copyTypes: { id: LorryReceiptCopyType, name: string }[] = [
    { id: 'Consigner', name: 'Consigner Copy' },
    { id: 'Consignee', name: 'Consignee Copy' },
    { id: 'Driver', name: "Driver's Copy" },
    { id: 'Office', name: 'Office Copy' },
];

const LorryReceiptCopiesView: React.FC<LorryReceiptCopiesViewProps> = ({ lr, clients, onBack }) => {
    const [preview, setPreview] = useState<{ copyType: LorryReceiptCopyType | 'All', autoPrint: boolean } | null>(null);

    if (preview) {
        return <LorryReceiptPDF 
            lr={lr} 
            clients={clients} 
            onBack={() => setPreview(null)}
            copyType={preview.copyType}
            autoPrint={preview.autoPrint}
        />
    }

    const consignorName = clients.find(c => c.id === lr.consignorId)?.name || 'N/A';

    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800">Lorry Receipt Documents</h2>
                    <p className="text-sm text-gray-500">LR No: <span className="font-bold">{lr.lrNumber}</span> for {consignorName}</p>
                </div>
                <button onClick={onBack} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-300">
                    &larr; Back
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-700">Available Copies</h3>
                    <button 
                        onClick={() => setPreview({ copyType: 'All', autoPrint: true })}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        <span>Download All (.pdf)</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {copyTypes.map(copy => (
                        <div key={copy.id} className="border rounded-lg p-4 flex justify-between items-center bg-gray-50">
                            <span className="font-medium text-gray-800">{copy.name}</span>
                            <div className="flex items-center space-x-2">
                                <button 
                                    onClick={() => setPreview({ copyType: copy.id, autoPrint: false })}
                                    title={`Preview ${copy.name}`}
                                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                >
                                    <EyeIcon className="w-5 h-5" />
                                </button>
                                 <button 
                                    onClick={() => setPreview({ copyType: copy.id, autoPrint: true })}
                                    title={`Download ${copy.name}`}
                                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-100 rounded-full transition-colors"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LorryReceiptCopiesView;
