const MetricCard = ({ title, value, change, icon, color = "blue" }) => {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const textColor = isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-500';
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <p className={`text-sm font-medium flex items-center ${textColor}`}>
              {isPositive && <span className="mr-1">↑</span>}
              {isNegative && <span className="mr-1">↓</span>}
              {Math.abs(change)}%
            </p>
          )}
        </div>
        <div className={`bg-${color}-100 p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
