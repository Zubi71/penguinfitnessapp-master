import React from 'react';

interface HandbookChecklistProps {
  items: string[];
}

const HandbookChecklist: React.FC<HandbookChecklistProps> = ({ items }) => (
  <ul className="list-none pl-0 space-y-2">
    {items.map((item, idx) => (
      <li key={idx} className="flex items-start">
        <input type="checkbox" className="form-checkbox text-blue-600 mt-1 mr-2" disabled />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export default HandbookChecklist; 