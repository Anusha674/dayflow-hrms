import React from 'react';

export const ScrollPillBar = ({ items, activeItem, onItemClick }) => {
  return (
    <div className="scroll-pill-bar">
      {items.map((item) => {
        const id = typeof item === 'string' ? item : item.id;
        const label = typeof item === 'string' ? item : item.label;
        const isActive = activeItem === id;

        return (
          <button
            key={id}
            onClick={() => onItemClick(id)}
            className={`pill-item ${isActive ? 'active' : ''}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
