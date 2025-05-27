import { useState } from 'react';

export default function Tooltip({ children, content, position = 'right' }) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    right: 'left-full ml-2 top-1/2 transform -translate-y-1/2',
    left: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
    top: 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 transform -translate-x-1/2'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && content && (
        <div className={`
          absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg
          whitespace-nowrap pointer-events-none
          ${positionClasses[position]}
        `}>
          {content}
          {/* Seta do tooltip */}
          <div className={`
            absolute w-2 h-2 bg-gray-900 transform rotate-45
            ${position === 'right' ? '-left-1 top-1/2 -translate-y-1/2' : ''}
            ${position === 'left' ? '-right-1 top-1/2 -translate-y-1/2' : ''}
            ${position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' : ''}
            ${position === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2' : ''}
          `} />
        </div>
      )}
    </div>
  );
} 
