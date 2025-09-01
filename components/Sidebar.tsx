import React, { useState } from 'react';
import type { NavItem } from '../types';
import { DashboardIcon, ReceiptIcon, InvoiceIcon, LedgerIcon, ChevronDownIcon, UsersIcon, WalletIcon, SettingsIcon } from './icons';

interface SidebarProps {
  activeView: NavItem;
  setActiveView: (view: NavItem) => void;
  financialYears: string[];
  selectedFy: string;
  setSelectedFy: (fy: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, financialYears, selectedFy, setSelectedFy }) => {
  const [isFyOpen, setIsFyOpen] = useState(false);

  const navItems: { id: NavItem; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" /> },
    { id: 'lorryReceipt', label: 'Lorry Receipt', icon: <ReceiptIcon className="w-5 h-5" /> },
    { id: 'invoice', label: 'Invoice', icon: <InvoiceIcon className="w-5 h-5" /> },
    { id: 'clients', label: 'Clients', icon: <UsersIcon className="w-5 h-5" /> },
    { id: 'expenses', label: 'Expenses', icon: <WalletIcon className="w-5 h-5" /> },
    { id: 'customerLedger', label: 'Customer / Supplier Ledger', icon: <LedgerIcon className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => {
    const isActive = activeView === item.id;
    return (
      <li key={item.id}>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveView(item.id);
          }}
          className={`flex items-center p-2 text-sm rounded-md transition-colors duration-200 ${
            isActive
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          {item.icon}
          <span className="ml-3">{item.label}</span>
        </a>
      </li>
    );
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-800 text-white flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">TranspoTruck</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 relative">
           <button 
                onClick={() => setIsFyOpen(!isFyOpen)}
                className="w-full flex justify-between items-center p-2 bg-blue-600 text-white rounded-md text-sm"
            >
                <span>{selectedFy}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isFyOpen ? 'rotate-180' : ''}`} />
            </button>
            {isFyOpen && (
                <div 
                    className="absolute z-10 mt-1 w-full bg-gray-700 rounded-md shadow-lg"
                    onMouseLeave={() => setIsFyOpen(false)}
                >
                    <ul className="py-1">
                        {financialYears.map(fy => (
                        <li key={fy}>
                            <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setSelectedFy(fy);
                                setIsFyOpen(false);
                            }}
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                            >
                            {fy}
                            </a>
                        </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
        <nav>
          <ul>
            {navItems.map((item) => (
              <NavLink key={item.id} item={item} />
            ))}
          </ul>
        </nav>
      </div>
      <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
        Version: 4.1.4
      </div>
    </aside>
  );
};

export default Sidebar;
