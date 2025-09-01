
import React from 'react';

interface PlaceholderViewProps {
  title: string;
}

const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title }) => {
  return (
    <div className="flex items-center justify-center h-full bg-white rounded-lg shadow">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 capitalize">{title.replace(/([A-Z])/g, ' $1').trim()}</h2>
        <p className="mt-2 text-gray-500">This feature is under construction.</p>
        <div className="mt-6">
            <svg className="mx-auto h-24 w-24 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.472-2.472a3.75 3.75 0 00-5.304-5.304L4.75 12a1.125 1.125 0 000 1.591l2.472 2.472zm.588-5.88l-2.472 2.472" />
            </svg>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderView;
