import React from 'react';

const ProgressWidget = ({ 
  title, 
  value, 
  maxValue, 
  unit = '', 
  color = 'blue',
  trend = null, // 'up', 'down', 'stable'
  showPercentage = false 
}) => {
  const percentage = Math.min(100, (value / maxValue) * 100);
  
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500',
      lightBg: 'bg-blue-100',
      text: 'text-blue-600',
      ring: 'ring-blue-500'
    },
    green: {
      bg: 'bg-green-500',
      lightBg: 'bg-green-100',
      text: 'text-green-600',
      ring: 'ring-green-500'
    },
    red: {
      bg: 'bg-red-500',
      lightBg: 'bg-red-100',
      text: 'text-red-600',
      ring: 'ring-red-500'
    },
    purple: {
      bg: 'bg-purple-500',
      lightBg: 'bg-purple-100',
      text: 'text-purple-600',
      ring: 'ring-purple-500'
    },
    orange: {
      bg: 'bg-orange-500',
      lightBg: 'bg-orange-100',
      text: 'text-orange-600',
      ring: 'ring-orange-500'
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return (
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        );
      case 'down':
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const currentColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        {trend && (
          <div className="flex items-center">
            {getTrendIcon()}
          </div>
        )}
      </div>
      
      <div className="mb-3">
        <div className="flex items-baseline">
          <span className={`text-2xl font-bold ${currentColor.text}`}>
            {value.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500 ml-1">{unit}</span>
          {showPercentage && (
            <span className="text-sm text-gray-500 ml-2">
              ({percentage.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="relative">
        <div className={`h-2 ${currentColor.lightBg} rounded-full overflow-hidden`}>
          <div 
            className={`h-full ${currentColor.bg} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Labels da escala */}
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0</span>
          <span>{maxValue} {unit}</span>
        </div>
      </div>

      {/* Indicador circular para percentual */}
      {showPercentage && (
        <div className="mt-3 flex justify-center">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={currentColor.text}
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${percentage}, 100`}
                strokeLinecap="round"
                fill="transparent"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-semibold ${currentColor.text}`}>
                {percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressWidget; 