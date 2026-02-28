import React from 'react';

interface HandbookSectionProps {
  id?: string;
  title: string;
  children: React.ReactNode;
}

const HandbookSection: React.FC<HandbookSectionProps> = ({ id, title, children }) => (
  <section id={id} className="mb-12">
    <h2 className="text-2xl font-bold text-blue-800 mb-4 border-b-2 border-blue-200 pb-2">{title}</h2>
    <div className="pl-2">{children}</div>
  </section>
);

export default HandbookSection; 