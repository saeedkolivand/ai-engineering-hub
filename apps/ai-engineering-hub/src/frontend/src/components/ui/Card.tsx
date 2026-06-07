import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => (
  <div className="bg-white rounded shadow p-4">
    <h2 className="font-semibold mb-2">{title}</h2>
    {children}
  </div>
);