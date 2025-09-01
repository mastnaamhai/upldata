import React, { useState, useMemo } from 'react';
import type { Client, LorryReceipt } from '../types';
import LorryReceiptForm from './LorryReceiptForm';
import LorryReceiptCopiesView from './LorryReceiptCopiesView';
import { SearchIcon } from './icons';

const LorryReceiptCard: React.FC<{ 
    lr: LorryReceipt; 
    clients: Client[];
    onEdit: (lr: LorryReceipt) => void;
    onDelete: (id: string) => void;
    onViewCopies: (lr: LorryReceipt) => void;
}> = ({ lr, clients, onEdit, onDelete, onViewCopies }) => {
    const isBilled = lr.status === 'Billed';
    const consignor = clients.find(c => c.id === lr.consignorId)?.name || 'N/A';
    const consignee = clients.find(c => c.id === lr.consigneeId)?.name || 'N/A';

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-md border-l-4 ${isBilled ? 'border-green-500' : 'border-yellow-500'} relative`}>
            <div className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full ${isBilled ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                {lr.status}
            </div>
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-200">LR Number: {lr.lrNumber}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Vehicle No: {lr.vehicleNumber}</p>
                    </div>
                     <p className={`text-sm font-semibold ${lr.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>{lr.paymentStatus}</p>
                </div>

                <div className="flex items-center text-sm">
                    <div className="flex-1">
                        <p className="text-gray-500 dark:text-gray-400">From</p>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">{lr.from}</p>
                    </div>
                    <div className="text-2xl text-gray-300 dark:text-gray-500 mx-4">&rarr;</div>
                    <div className="flex-1 text-right">
                        <p className="text-gray-500 dark:text-gray-400">To</p>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">{lr.to}</p>
                    </div>
                </div>
                
                <div className="text-sm border-t dark:border-gray-700 pt-2">
                    <p><span className="text-gray-500 dark:text-gray-400">Consignor:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{consignor}</span></p>
                    <p><span className="text-gray-500 dark:text-gray-400">Consignee:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{consignee}</span></p>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700 px-4 py-2 flex justify-end space-x-4 border-t dark:border-gray-600">
                <button onClick={() => onViewCopies(lr)} className="text-xs font-medium text-green-600 hover:underline">View Documents</button>
                <button className="text-xs font-medium text-blue-600 hover:underline">POD</button>
                <button onClick={() => onEdit(lr)} className="text-xs font-medium text-blue-600 hover:underline">Edit</button>
                <button onClick={() => onDelete(lr.id)} className="text-xs font-medium text-red-600 hover:underline">Delete</button>
                <button className="text-xs font-medium text-blue-600 hover:underline">Share</button>
            </div>
        </div>
    );
};

interface LorryReceiptViewProps {
    selectedFy: string;
    clients: Client[];
    lrs: LorryReceipt[];
    onAddClient: (clientData: Client) => Promise<Client>;
    onSave: (lr: LorryReceipt) => void;
    onDelete: (lrId: string) => void;
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


const LorryReceiptView: React.FC<LorryReceiptViewProps> = ({ selectedFy, clients, lrs, onAddClient, onSave, onDelete }) => {
    const [showForm, setShowForm] = useState(false);
    const [lrToCopiesView, setLrToCopiesView] = useState<LorryReceipt | null>(null);
    const [lrToEdit, setLrToEdit] = useState<LorryReceipt | null>(null);
    const [nextLrNumber, setNextLrNumber] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const getNextLrNumber = () => {
        if (lrs.length === 0) return '1';
        const maxLrNum = lrs.reduce((max, lr) => {
            const num = parseInt(lr.lrNumber, 10);
            return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        return (maxLrNum + 1).toString();
    };

    const handleGenerateClick = () => {
        setNextLrNumber(getNextLrNumber());
        setLrToEdit(null);
        setShowForm(true);
        setLrToCopiesView(null);
    };

    const handleEdit = (lr: LorryReceipt) => {
        setLrToEdit(lr);
        setShowForm(true);
        setLrToCopiesView(null);
    };
    
    const handleSaveLR = (lrData: LorryReceipt) => {
        onSave(lrData);
        const savedLR = 'id' in lrData && lrData.id 
            ? lrData
            : { ...lrData, id: Date.now().toString(), status: 'Un-Billed' as const };
            
        setShowForm(false);
        setLrToEdit(null);
        setLrToCopiesView(savedLR);
    };
    
    const handleCancelForm = () => {
        setShowForm(false);
        setLrToEdit(null);
        setLrToCopiesView(null);
    }
    
    const filteredLRs = useMemo(() => {
        return lrs.filter(lr => {
            if (!dateIsInFy(lr.date, selectedFy)) return false;

            const consignor = clients.find(c => c.id === lr.consignorId);
            const consignee = clients.find(c => c.id === lr.consigneeId);
            const searchTermLower = searchTerm.toLowerCase();

            return (
                lr.lrNumber.toLowerCase().includes(searchTermLower) ||
                lr.vehicleNumber.toLowerCase().includes(searchTermLower) ||
                lr.from.toLowerCase().includes(searchTermLower) ||
                lr.to.toLowerCase().includes(searchTermLower) ||
                (consignor && consignor.name.toLowerCase().includes(searchTermLower)) ||
                (consignee && consignee.name.toLowerCase().includes(searchTermLower))
            );
        });
    }, [lrs, searchTerm, selectedFy, clients]);

    const paginatedLRs = useMemo(() => {
        return filteredLRs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredLRs, currentPage]);

    const totalPages = Math.ceil(filteredLRs.length / ITEMS_PER_PAGE);

    if (lrToCopiesView) {
        return <LorryReceiptCopiesView lr={lrToCopiesView} clients={clients} onBack={() => setLrToCopiesView(null)} />;
    }
    
    if (showForm) {
        return <LorryReceiptForm onSave={handleSaveLR} onCancel={handleCancelForm} clients={clients} nextLrNumber={nextLrNumber} lrToEdit={lrToEdit} onAddClient={onAddClient} />;
    }

    return (
         <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Lorry Receipt</h2>
                 <button onClick={handleGenerateClick} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700">
                  Generate LR / Bilty
                </button>
            </div>
             <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                 <div className="relative w-full md:w-1/3 mb-4">
                    <input type="text" placeholder="Search by LR No, Vehicle, Client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-gray-200"/>
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                    {paginatedLRs.map(lr => <LorryReceiptCard key={lr.id} lr={lr} clients={clients} onEdit={handleEdit} onDelete={onDelete} onViewCopies={setLrToCopiesView} />)}
                    {paginatedLRs.length === 0 && <p className="text-center text-gray-500 py-4">No Lorry Receipts found.</p>}
                </div>
             </div>
             {totalPages > 1 && (
                 <div className="flex justify-center items-center mt-6 text-sm">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">&lt;</button>
                    <span className="px-4 py-1 dark:text-gray-300">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">&gt;</button>
                 </div>
             )}
        </div>
    );
};

export default LorryReceiptView;
