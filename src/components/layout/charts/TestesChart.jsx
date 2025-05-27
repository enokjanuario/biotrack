import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TestesChart = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 0,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Evolução dos Testes Físicos',
        font: {
          size: 16,
        },
      },
      legend: {
        position: 'top',
        labels: {
          boxWidth: 15,
          font: {
            size: 11
          }
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Repetições / Tempo / Distância',
          font: {
            size: 12,
          },
        },
      }
    },
  };

  return <Line options={options} data={data} />;
};

export default TestesChart;
