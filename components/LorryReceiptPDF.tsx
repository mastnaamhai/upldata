import React, { useState, useEffect } from 'react';
import type { LorryReceipt, Client, AppSettings, LorryReceiptCopyType } from '../types';
import LorryReceiptPDFLayout from './LorryReceiptPDFLayout';

interface LorryReceiptPDFProps {
    lr: LorryReceipt;
    clients: Client[];
    onBack: () => void;
    copyType: LorryReceiptCopyType | 'All';
    autoPrint?: boolean;
}
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

const TAndCPage: React.FC = () => (
    <div className="page-break p-6">
        <h2 className="text-lg font-bold mb-2">Terms and Conditions</h2>
            <ol className="list-decimal list-inside space-y-2 text-justify">
            <li>The transport operator hereby agrees to hold itself liable directly to the bank concerned, as if the Bank was a party, of the contract contained with right of recourse against the Operator, the full value goods handed over for carriage, storage and Delivery, should a Bank accept this lorry Receipt as a consignee / endorsee or in any other capacity for the purpose of providing advances and / or collection or discounting of bills of its customer, before or after the Transport Operator has been entrusted the goods.</li>
            <li>The transport Operator undertakes to deliver the goods in the same order and condition as received. The lorry receipt being surrendered to the bank, to its order, or to its assigns, has accepted it for lending and to the collection or discounting of bills of its customers or for collection or to its agents. Only the bank and the holder of the receipt entitled to the delivery as afore said shall have the right of recourse against the operator for any and all claims arising thereon.</li>
            <li>The right to entrust goods to any other lorry or service for transport of goods shall be with the Transport Operator. If the goods are entrusted by the transport operator to another entity, the other entity shall be considered the transport operator's agent, and the transport operator, notwithstanding the delivery of goods, the operator will be responsible for the safety of the goods and for their delivery at the destination by the hands of the other carrier referred to as the Transport Operator's agent.</li>
            <li>The consignor is the primary payer of all transport and incidental charges, if any, payable to the Transport Operator at their agreed location.</li>
            <li>Perishable goods lying undelivered after 48 hours of arrival can be disposed of by the Transport Operator's discretion without prior notice of thereof.</li>
            <li>Goods lying undelivered can be disposed off by the Transport Operator after 30 days of arrival after delivery to the consignor, bank, and the holder interested with a 15-day notice of such disposal of goods.</li>
            <li>The Consignee Bank accepting Lorry Receipt under clause 1 above will not be liable for payment of any charges arising out of any lien of the transport Operator against the consignor or the buyer. the Transport Operator shall deliver the goods unconditionally to the Bank on Payment of the normal freight and storage charges only in connection with the consignment in question, without claiming any lien on the goods in respect of any monies due by the consignor or the consignee to the Transport Operator on any other account whatsoever.</li>
            <li>The consignor is responsible for all consequence of any incorrect or false declaration.</li>
            <li>If the goods have been lost, destroyed, damaged or have deteriorated the compensation payable by the Transport operator shall not exceed the value declared.</li>
        </ol>
        <h2 className="text-lg font-bold mt-4 mb-2">Other Information</h2>
        <p>In case any dispute or difference arises between the parties with regard to the terms and conditions of this agreement or relating to the interpretation thereof and which could not be solved with mutual understanding then both parties require to approach the local jurisdiction selected by transporter to resolve the same with legal procedure.</p>
    </div>
);


const LorryReceiptPDF: React.FC<LorryReceiptPDFProps> = ({ lr, clients, onBack, copyType, autoPrint = false }) => {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    
    useEffect(() => {
        try {
            const item = window.localStorage.getItem('transpo-settings');
            if (item) {
                setSettings(JSON.parse(item));
            }
        } catch (error) {
            console.error("Failed to load settings for PDF", error);
        }
    }, []);

    const handlePrint = () => {
        window.print();
    };

    useEffect(() => {
        if (autoPrint) {
            setTimeout(handlePrint, 500);
        }
    }, [autoPrint]);
    
    const copyTypes: LorryReceiptCopyType[] = ['Consigner', 'Consignee', 'Driver', 'Office'];

    return (
        <div className="bg-gray-100 p-4 pdf-container-bg">
            <style>{`
                @media print {
                    .page-break { page-break-before: always; }
                }
            `}</style>
            <div className="flex justify-center items-center mb-4 no-print space-x-4">
                 <button onClick={onBack} className="bg-gray-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-600">
                    &larr; Back
                </button>
                 <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700">
                    Print / Download
                </button>
            </div>
           
            <div id="print-area" className="max-w-4xl mx-auto bg-white shadow-lg text-xs font-sans">
               {copyType === 'All' ? (
                   copyTypes.map((type, index) => (
                       <React.Fragment key={type}>
                           {index > 0 && <div className="page-break"></div>}
                           <LorryReceiptPDFLayout lr={lr} clients={clients} settings={settings} copyType={type} />
                           <TAndCPage />
                       </React.Fragment>
                   ))
               ) : (
                   <>
                        <LorryReceiptPDFLayout lr={lr} clients={clients} settings={settings} copyType={copyType} />
                        <TAndCPage />
                   </>
               )}
            </div>
        </div>
    );
};

export default LorryReceiptPDF;