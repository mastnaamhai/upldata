import React from 'react';

export const FormRow: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;

export const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        {children}
    </div>
);

export const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input 
        {...props} 
        className={`w-full p-2 border rounded-md bg-gray-100 text-sm focus:ring-blue-500 focus:border-blue-500 ${props.className || ''}`} 
    />
);

export const TextAreaInput: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea 
        {...props}
        rows={props.rows || 3}
        className={`w-full p-2 border rounded-md bg-gray-100 text-sm focus:ring-blue-500 focus:border-blue-500 ${props.className || ''}`}
    ></textarea>
);


export const DropdownInput: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select 
        {...props}
        className={`w-full p-2 border rounded-md bg-gray-100 text-sm focus:ring-blue-500 focus:border-blue-500 ${props.className || ''}`}
    >
        {props.children}
    </select>
);
