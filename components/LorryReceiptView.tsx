import React, { useState, useMemo } from 'react';
import type { Client, LorryReceipt, LrBookingData, NewLrPayload } from '../types';
import LorryReceiptForm from './LorryReceiptForm';
import { SearchIcon, ChevronDownIcon, TrashIcon } from './icons';

const LorryReceiptCard: React.FC<{ 
    lr: LorryReceipt;
    onDelete: (id: string) => void;
    onViewDetails: (lr: LorryReceipt) => void;
}> = ({ lr, onDelete, onViewDetails }) => {

    const statusColors = {
        Booked: 'border-blue-500 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        Dispatched: 'border-orange-500 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
        'In Transit': 'border-purple-500 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
        Delivered: 'border-teal-500 bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
        Closed: 'border-green-500 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    };

    const borderColor = statusColors[lr.status].split(' ')[0];
    const statusBgColor = statusColors[lr.status].split(' ').slice(1).join(' ');

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-md border-l-4 ${borderColor} relative`}>
            <div className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full ${statusBgColor}`}>
                {lr.status}
            </div>
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-200">LR Number: {lr.lr_number}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Vehicle: {lr.vehicle_number || 'Not Dispatched'}</p>
                    </div>
                     <p className={`text-sm font-semibold`}>{lr.freight_type}</p>
                </div>

                <div className="flex items-center text-sm">
                    <div className="flex-1">
                        <p className="text-gray-500 dark:text-gray-400">From</p>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">{lr.origin_location}</p>
                    </div>
                    <div className="text-2xl text-gray-300 dark:text-gray-500 mx-4">&rarr;</div>
                    <div className="flex-1 text-right">
                        <p className="text-gray-500 dark:text-gray-400">To</p>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">{lr.destination_location}</p>
                    </div>
                </div>
                
                <div className="text-sm border-t dark:border-gray-700 pt-2">
                    <p><span className="text-gray-500 dark:text-gray-400">Consignor:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{lr.consignor_name}</span></p>
                    <p><span className="text-gray-500 dark:text-gray-400">Consignee:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{lr.consignee_name}</span></p>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700 px-4 py-2 flex justify-end space-x-4 border-t dark:border-gray-600">
                <button onClick={() => onViewDetails(lr)} className="text-xs font-medium text-blue-600 hover:underline">Manage / View Status</button>
                <button onClick={() => onDelete(lr.id)} className="text-xs font-medium text-red-600 hover:underline">Delete</button>
            </div>
        </div>
    );
};

interface LorryReceiptViewProps {
    selectedFy: string;
    lrs: LorryReceipt[];
    onSave: (lr: NewLrPayload) => Promise<LorryReceipt>;
    onDelete: (lrId: string) => void;
    onDispatch: (lrId: string, dispatchData: { vehicle_number: string; driver_name: string }) => Promise<LorryReceipt>;
    onUpdateTransit: (lrId: string, transitData: { location: string }) => Promise<LorryReceipt>;
    onDeliver: (lrId: string, deliveryData: { proof_of_delivery: string }) => Promise<LorryReceipt>;
    onClose: (lrId: string) => Promise<LorryReceipt>;
}

const LorryReceiptView: React.FC<LorryReceiptViewProps> = ({ selectedFy, lrs, onSave, onDelete, onDispatch, onUpdateTransit, onDeliver, onClose }) => {
    const [showForm, setShowForm] = useState(false);
    const [viewingLR, setViewingLR] = useState<LorryReceipt | null>(null); // For status management modal
    const [dispatchData, setDispatchData] = useState({ vehicle_number: '', driver_name: '' });
    const [location, setLocation] = useState('');
    const [pod, setPod] = useState(''); // Proof of Delivery
    const [nextLrNumber, setNextLrNumber] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const getNextLrNumber = () => {
        if (lrs.length === 0) return '1';
        const maxLrNum = lrs.reduce((max, lr) => {
            const num = parseInt(lr.lr_number, 10);
            return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        return (maxLrNum + 1).toString();
    };

    const handleGenerateClick = () => {
        setNextLrNumber(getNextLrNumber());
        setShowForm(true);
    };
    
    const handleSaveNewLR = (bookingData: LrBookingData) => {
        const newLrPayload: NewLrPayload = {
            ...bookingData,
            lr_number: nextLrNumber,
            booking_time: new Date().toISOString(),
            status: 'Booked',
        };
        onSave(newLrPayload).then(() => {
            setShowForm(false);
        }).catch(err => {
            // Error is handled in the API layer with an alert
            console.error("Save failed", err);
        });
    };
    
    const handleCancelForm = () => {
        setShowForm(false);
    }
    
    const filteredLRs = useMemo(() => {
        return lrs.filter(lr => {
            // TODO: Re-implement date filtering once date field is finalized
            const searchTermLower = searchTerm.toLowerCase();
            return (
                lr.lr_number.toLowerCase().includes(searchTermLower) ||
                (lr.vehicle_number && lr.vehicle_number.toLowerCase().includes(searchTermLower)) ||
                lr.origin_location.toLowerCase().includes(searchTermLower) ||
                lr.destination_location.toLowerCase().includes(searchTermLower) ||
                lr.consignor_name.toLowerCase().includes(searchTermLower) ||
                lr.consignee_name.toLowerCase().includes(searchTermLower)
            );
        });
    }, [lrs, searchTerm, selectedFy]);

    const paginatedLRs = useMemo(() => {
        return filteredLRs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredLRs, currentPage]);

    const totalPages = Math.ceil(filteredLRs.length / ITEMS_PER_PAGE);

    const handleDispatch = async () => {
        if (!viewingLR || !dispatchData.vehicle_number || !dispatchData.driver_name) {
            alert('Please provide vehicle number and driver name.');
            return;
        }
        try {
            const updatedLr = await onDispatch(viewingLR.id, dispatchData);
            setViewingLR(updatedLr); // Refresh the view with updated data
            setDispatchData({ vehicle_number: '', driver_name: '' }); // Reset form
        } catch (error) {
            console.error('Failed to dispatch LR:', error);
        }
    };

    const handleUpdateTransit = async () => {
        if (!viewingLR || !location) {
            alert('Please provide a location.');
            return;
        }
        try {
            const updatedLr = await onUpdateTransit(viewingLR.id, { location });
            setViewingLR(updatedLr);
            setLocation(''); // Reset form
        } catch (error) {
            console.error('Failed to update transit:', error);
        }
    };

    const handleDeliver = async () => {
        if (!viewingLR || !pod) {
            alert('Please provide Proof of Delivery.');
            return;
        }
        try {
            const updatedLr = await onDeliver(viewingLR.id, { proof_of_delivery: pod });
            setViewingLR(updatedLr);
            setPod('');
        } catch (error) {
            console.error('Failed to deliver LR:', error);
        }
    };

    const handleClose = async () => {
        if (!viewingLR) return;
        try {
            const updatedLr = await onClose(viewingLR.id);
            setViewingLR(updatedLr);
        } catch (error) {
            console.error('Failed to close LR:', error);
        }
    };

    // TODO: Implement the LR Status Management Modal/View
    if (viewingLR) {
         return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Manage LR: {viewingLR.lr_number}</h2>
                    <button onClick={() => setViewingLR(null)} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                </div>
                <p className="mt-2">Status: <span className="font-semibold">{viewingLR.status}</span></p>
                {viewingLR.current_location && <p className="text-sm">Current Location: {viewingLR.current_location}</p>}


                {viewingLR.status === 'Booked' && (
                    <div className="mt-4 border-t pt-4">
                        <h3 className="font-semibold">Dispatch Vehicle</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <FormField label="Vehicle Number">
                                <TextInput name="vehicle_number" value={dispatchData.vehicle_number} onChange={(e) => setDispatchData(prev => ({...prev, vehicle_number: e.target.value}))} />
                            </FormField>
                             <FormField label="Driver Name">
                                <TextInput name="driver_name" value={dispatchData.driver_name} onChange={(e) => setDispatchData(prev => ({...prev, driver_name: e.target.value}))} />
                            </FormField>
                        </div>
                        <button onClick={handleDispatch} className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-orange-600">
                            Mark as Dispatched
                        </button>
                    </div>
                )}

                {(viewingLR.status === 'Dispatched' || viewingLR.status === 'In Transit') && (
                     <div className="mt-4 border-t pt-4">
                        <h3 className="font-semibold">Update Transit Status</h3>
                        <div className="grid grid-cols-1 mt-2">
                             <FormField label="Current Location">
                                <TextInput name="location" value={location} onChange={(e) => setLocation(e.target.value)} />
                            </FormField>
                        </div>
                        <button onClick={handleUpdateTransit} className="mt-4 bg-purple-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-purple-600">
                            Update Location
                        </button>
                    </div>
                )}

                {viewingLR.status === 'In Transit' && (
                     <div className="mt-4 border-t pt-4">
                        <h3 className="font-semibold">Mark as Delivered</h3>
                        <div className="grid grid-cols-1 mt-2">
                             <FormField label="Proof of Delivery (Image URL or Text)">
                                <TextInput name="pod" value={pod} onChange={(e) => setPod(e.target.value)} />
                            </FormField>
                        </div>
                        <button onClick={handleDeliver} className="mt-4 bg-teal-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-teal-600">
                            Mark as Delivered
                        </button>
                    </div>
                )}

                {viewingLR.status === 'Delivered' && (
                     <div className="mt-4 border-t pt-4">
                        <h3 className="font-semibold">Close LR</h3>
                        <p className="text-xs text-gray-500">This is the final step. Once closed, an LR cannot be edited.</p>
                        <button onClick={handleClose} className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-green-600">
                            Close LR
                        </button>
                    </div>
                )}

                <div className="mt-6 border-t pt-4">
                    <h3 className="font-semibold">Documents</h3>
                    <button
                        onClick={() => window.open(`/api/lrs/${viewingLR.id}/pdf/booking`, '_blank')}
                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700"
                    >
                        Download Booking PDF
                    </button>
                    {(viewingLR.status === 'Dispatched' || viewingLR.status === 'In Transit' || viewingLR.status === 'Delivered' || viewingLR.status === 'Closed') && (
                         <button
                            onClick={() => window.open(`/api/lrs/${viewingLR.id}/pdf/dispatch`, '_blank')}
                            className="mt-2 ml-2 bg-orange-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-orange-600"
                        >
                            Download Dispatch PDF
                        </button>
                    )}
                    {viewingLR.status === 'Closed' && (
                         <button
                            onClick={() => window.open(`/api/lrs/${viewingLR.id}/pdf/closure`, '_blank')}
                            className="mt-2 ml-2 bg-green-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-green-600"
                        >
                            Download Final Summary PDF
                        </button>
                    )}
                </div>
            </div>
        );
    }
    
    if (showForm) {
        return <LorryReceiptForm onSave={handleSaveNewLR} onCancel={handleCancelForm} lrNumber={nextLrNumber} />;
    }

    return (
         <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Lorry Receipts</h2>
                 <button onClick={handleGenerateClick} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700">
                  Book New LR
                </button>
            </div>
             <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                 <div className="relative w-full md:w-1/3 mb-4">
                    <input type="text" placeholder="Search by LR No, Vehicle, Client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-gray-200"/>
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                    {paginatedLRs.map(lr => <LorryReceiptCard key={lr.id} lr={lr} onDelete={onDelete} onViewDetails={setViewingLR} />)}
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
