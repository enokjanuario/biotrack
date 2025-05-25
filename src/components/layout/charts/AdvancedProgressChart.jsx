import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdvancedProgressChart = ({ 
  data, 
  type = 'line', 
  title, 
  showTrend = true,
  showGoal = false,
  goalValue = null,
  unit = '',
  color = '#3b82f6'
}) => {
  // Calcular tendência linear
  const calculateTrend = (dataPoints) => {
    if (dataPoints.length < 2) return [];
    
    const n = dataPoints.length;
    const xSum = dataPoints.reduce((sum, _, i) => sum + i, 0);
    const ySum = dataPoints.reduce((sum, val) => sum + (val || 0), 0);
    const xySum = dataPoints.reduce((sum, val, i) => sum + i * (val || 0), 0);
    const x2Sum = dataPoints.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;
    
    return dataPoints.map((_, i) => slope * i + intercept);
  };

  // Configurar dados do gráfico
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: title,
        data: data.data,
        borderColor: color,
        backgroundColor: type === 'line' ? `${color}20` : color,
        fill: type === 'line',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      }
    ]
  };

  // Adicionar linha de tendência se solicitado
  if (showTrend && data.data.length > 2) {
    const trendData = calculateTrend(data.data);
    chartData.datasets.push({
      label: 'Tendência',
      data: trendData,
      borderColor: '#94a3b8',
      backgroundColor: 'transparent',
      borderDash: [5, 5],
      pointRadius: 0,
      tension: 0,
    });
  }

  // Adicionar linha de meta se solicitado
  if (showGoal && goalValue !== null) {
    chartData.datasets.push({
      label: 'Meta',
      data: Array(data.labels.length).fill(goalValue),
      borderColor: '#10b981',
      backgroundColor: 'transparent',
      borderDash: [10, 5],
      pointRadius: 0,
    });
  }

  // Calcular estatísticas
  const values = data.data.filter(val => val !== null && val !== undefined);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const latest = values[values.length - 1];
  const previous = values[values.length - 2];
  const change = previous ? ((latest - previous) / previous * 100) : 0;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: title,
        font: {
          size: 18,
          weight: 'bold',
        },
        color: '#1f2937',
        padding: 20,
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: color,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1) + ' ' + unit;
            }
            return label;
          }
        }
      },
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          font: {
            size: 12,
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: '#f3f4f6',
        },
        title: {
          display: true,
          text: 'Data das Avaliações',
          font: {
            size: 12,
          }
        }
      },
      y: {
        grid: {
          color: '#f3f4f6',
        },
        title: {
          display: true,
          text: `Valor (${unit})`,
          font: {
            size: 12,
          }
        },
        beginAtZero: false,
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: '#ffffff',
      }
    }
  };

  return (
    <div className="relative">
      <div className="h-80 mb-4">
        {type === 'line' ? (
          <Line options={options} data={chartData} />
        ) : (
          <Bar options={options} data={chartData} />
        )}
      </div>
      
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-600">Atual</p>
          <p className="text-lg font-semibold text-gray-900">
            {latest?.toFixed(1)} {unit}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Variação</p>
          <p className={`text-lg font-semibold ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Média</p>
          <p className="text-lg font-semibold text-gray-900">
            {avg.toFixed(1)} {unit}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Amplitude</p>
          <p className="text-lg font-semibold text-gray-900">
            {(max - min).toFixed(1)} {unit}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedProgressChart; 