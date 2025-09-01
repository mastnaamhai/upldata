import React from 'react';
import type { Client, AppSettings } from '../types';

interface ClientListPDFProps {
    clients: Client[];
    settings: AppSettings;
    onBack: () => void;
}

const ClientListPDF: React.FC<ClientListPDFProps> = ({ clients, settings, onBack }) => {
    
    const company = settings.company;
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-gray-200 p-4 font-sans pdf-container-bg">
             <div className="flex justify-center items-center mb-4 no-print space-x-4">
                <button onClick={onBack} className="bg-gray-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-600">&larr; Back to Clients</button>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700">Print List</button>
            </div>
            <div id="print-area" className="max-w-4xl mx-auto bg-white shadow-lg text-xs">
                 <div className="p-8 border-2 border-gray-300">
                    <header className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{company.companyName}</h1>
                            <p className="text-gray-500">{company.address.split('\n')[0]}</p>
                        </div>
                        <div className="text-right">
                             <div className="inline-block bg-blue-100 text-blue-800 font-bold py-2 px-4 rounded-full text-lg">CLIENT DIRECTORY</div>
                             <p className="mt-2 text-gray-600">Report Date: <b>{new Date().toLocaleDateString('en-GB')}</b></p>
                        </div>
                    </header>
                    
                    <section className="mt-6">
                         <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                                    <th className="p-2 border-y">Client Name</th>
                                    <th className="p-2 border-y">GSTIN</th>
                                    <th className="p-2 border-y">Contact Person</th>
                                    <th className="p-2 border-y">Phone</th>
                                    <th className="p-2 border-y">Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map(client => (
                                <tr key={client.id} className="border-b">
                                    <td className="p-2 font-semibold">{client.name}</td>
                                    <td className="p-2 font-mono">{client.gstin}</td>
                                    <td className="p-2">{client.contactPerson}</td>
                                    <td className="p-2">{client.phone}</td>
                                    <td className="p-2">{client.address}</td>
                                </tr>
                                ))}
                            </tbody>
                         </table>
                    </section>
                    
                    <footer className="mt-12 pt-4 border-t-2 border-gray-200 text-right">
                         <p className="text-center text-gray-400 mt-4 text-xs">This is a computer generated report.</p>
                    </footer>
                 </div>
            </div>
        </div>
    );
};

export default ClientListPDF;