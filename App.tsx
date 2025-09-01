
import React, { useState, useEffect, useMemo } from 'react';
import type { NavItem, AppSettings, Client, LorryReceipt, Invoice, Expense, Payment, AppData } from './types';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import InvoiceView from './components/InvoiceView';
import LorryReceiptView from './components/LorryReceiptView';
import LoginScreen from './components/LoginScreen';
import ClientView from './components/ClientView';
import ExpenseView from './components/ExpenseView';
import LedgerView from './components/LedgerView';
import SettingsView from './components/SettingsView';
import * as api from './data/api';
import { TruckIcon } from './components/icons';

// In a real application, this would be handled by a secure backend authentication service.
const CORRECT_PASSWORD = 'password123'; 

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

const financialYears = ['FY 2024-25', 'FY 2025-26', 'FY 2026-27'];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<NavItem>('dashboard');
  const [selectedFy, setSelectedFy] = useState('FY 2025-26');
  
  const [appData, setAppData] = useState<AppData>({
      clients: [],
      invoices: [],
      lrs: [],
      expenses: [],
      payments: [],
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
      try {
          const item = window.localStorage.getItem('transpo-settings');
          return item ? JSON.parse(item) : defaultSettings;
      } catch (error) {
          console.error("Failed to parse settings from localStorage", error);
          return defaultSettings;
      }
  });

  // Load all data from API on initial mount
  useEffect(() => {
    if (isAuthenticated) {
        setIsLoading(true);
        api.getAppData().then(data => {
            setAppData(data);
            setIsLoading(false);
        }).catch(() => setIsLoading(false)); // Handle error case
    }
  }, [isAuthenticated]);

  useEffect(() => {
      try {
          window.localStorage.setItem('transpo-settings', JSON.stringify(settings));
          
          const root = window.document.documentElement;
          if (settings.theme === 'dark') {
              root.classList.add('dark');
          } else {
              root.classList.remove('dark');
          }
      } catch (error) {
          console.error("Failed to save settings to localStorage", error);
      }
  }, [settings]);

  const handleLogin = (password: string): boolean => {
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  // --- Data Handler Functions ---

  const handleSaveClient = async (clientData: Client): Promise<Client> => {
    const savedClient = await api.saveClient(clientData);
    setAppData(prev => {
        const clientExists = prev.clients.some(c => c.id === savedClient.id);
        const newClients = clientExists
            ? prev.clients.map(c => c.id === savedClient.id ? savedClient : c)
            : [savedClient, ...prev.clients];
        return { ...prev, clients: newClients };
    });
    return savedClient;
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client? This cannot be undone.')) {
        await api.deleteClient(clientId);
        setAppData(prev => ({ ...prev, clients: prev.clients.filter(c => c.id !== clientId)}));
    }
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
      const { updatedInvoice, updatedLrs } = await api.saveInvoice(invoice);
      setAppData(prev => {
          const exists = prev.invoices.some(i => i.id === updatedInvoice.id);
          const newInvoices = exists
              ? prev.invoices.map(i => (i.id === updatedInvoice.id ? updatedInvoice : i))
              : [updatedInvoice, ...prev.invoices];
          
          // Create a map of the updated LRs for efficient lookup
          const updatedLrsMap = new Map(updatedLrs.map(lr => [lr.id, lr]));
          
          const newLrs = prev.lrs.map(lr => updatedLrsMap.get(lr.id) || lr);

          return { ...prev, invoices: newInvoices, lrs: newLrs };
      });
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
      if (window.confirm('Are you sure you want to delete this invoice? This will mark associated Lorry Receipts as Un-Billed.')) {
          const { updatedLrs } = await api.deleteInvoice(invoiceId);
          setAppData(prev => {
              const newInvoices = prev.invoices.filter(i => i.id !== invoiceId);
              
              const updatedLrsMap = new Map(updatedLrs.map(lr => [lr.id, lr]));
              const newLrs = prev.lrs.map(lr => updatedLrsMap.get(lr.id) || lr);

              return { ...prev, invoices: newInvoices, lrs: newLrs };
          });
      }
  };

  const handleSaveLR = async (lr: LorryReceipt) => {
      const savedLr = await api.saveLR(lr);
      setAppData(prev => {
          const exists = prev.lrs.some(l => l.id === savedLr.id);
          const updatedLRs = exists
            ? prev.lrs.map(l => l.id === savedLr.id ? savedLr : l)
            : [savedLr, ...prev.lrs]
          return { ...prev, lrs: updatedLRs };
      });
  };

  const handleDeleteLR = async (lrId: string) => {
      if (window.confirm('Are you sure you want to delete this Lorry Receipt?')) {
          await api.deleteLR(lrId);
          setAppData(prev => ({ ...prev, lrs: prev.lrs.filter(l => l.id !== lrId) }));
      }
  };

  const handleSaveExpense = async (expense: Expense) => {
      const savedExpense = await api.saveExpense(expense);
      setAppData(prev => {
          const exists = prev.expenses.some(e => e.id === savedExpense.id);
          const updatedExpenses = exists
            ? prev.expenses.map(e => e.id === savedExpense.id ? savedExpense : e)
            : [savedExpense, ...prev.expenses]
          return { ...prev, expenses: updatedExpenses };
      });
  };

  const handleDeleteExpense = async (expenseId: string) => {
      if (window.confirm('Are you sure you want to delete this expense?')) {
          await api.deleteExpense(expenseId);
          setAppData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== expenseId) }));
      }
  };

  const handleSavePayment = async (paymentData: Omit<Payment, 'id'>) => {
      const newPayment = await api.savePayment(paymentData);
      setAppData(prev => ({ ...prev, payments: [newPayment, ...prev.payments] }));
  };

  const unbilledLRs = useMemo(() => appData.lrs.filter(lr => lr.status === 'Un-Billed'), [appData.lrs]);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-slate-900">
            <div className="text-center">
                <TruckIcon className="w-16 h-16 text-blue-600 animate-bounce mx-auto" />
                <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Connecting to Server...</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Please make sure the backend is running.</p>
            </div>
        </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView setActiveView={setActiveView} selectedFy={selectedFy} {...appData} />;
      case 'invoice':
        return <InvoiceView selectedFy={selectedFy} clients={appData.clients} invoices={appData.invoices} unbilledLRs={unbilledLRs} onSave={handleSaveInvoice} onDelete={handleDeleteInvoice} />;
      case 'lorryReceipt':
        return <LorryReceiptView selectedFy={selectedFy} clients={appData.clients} lrs={appData.lrs} onAddClient={handleSaveClient} onSave={handleSaveLR} onDelete={handleDeleteLR} />;
      case 'clients':
        return <ClientView clients={appData.clients} onSave={handleSaveClient} onDelete={handleDeleteClient} />;
      case 'expenses':
        return <ExpenseView selectedFy={selectedFy} expenses={appData.expenses} onSave={handleSaveExpense} onDelete={handleDeleteExpense} />;
      case 'customerLedger':
        return <LedgerView selectedFy={selectedFy} clients={appData.clients} invoices={appData.invoices} payments={appData.payments} onSavePayment={handleSavePayment} />;
      case 'settings':
        return <SettingsView settings={settings} setSettings={setSettings} appData={appData} />;
      default:
        return <DashboardView setActiveView={setActiveView} selectedFy={selectedFy} {...appData} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-800 font-sans">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        financialYears={financialYears}
        selectedFy={selectedFy}
        setSelectedFy={setSelectedFy}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-slate-900 p-4">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
