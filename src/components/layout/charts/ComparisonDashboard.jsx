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
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

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
  ArcElement
);

const ComparisonDashboard = ({ avaliacoes = [] }) => {
  if (avaliacoes.length < 2) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
          <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Dados insuficientes</h3>
        <p className="mt-1 text-sm text-gray-500">
          É necessário ter pelo menos 2 avaliações para visualizar comparações.
        </p>
      </div>
    );
  }

  // Ordenar avaliações por data
  const sortedAvaliacoes = [...avaliacoes].sort((a, b) => 
    new Date(a.dataAvaliacao?.toDate ? a.dataAvaliacao.toDate() : a.dataAvaliacao) - 
    new Date(b.dataAvaliacao?.toDate ? b.dataAvaliacao.toDate() : b.dataAvaliacao)
  );

  const primeira = sortedAvaliacoes[0];
  const ultima = sortedAvaliacoes[sortedAvaliacoes.length - 1];

  // Função para calcular variação percentual
  const calcularVariacao = (inicial, final) => {
    if (!inicial || !final) return 0;
    return ((final - inicial) / inicial * 100);
  };

  // Função para determinar cor baseada na variação e tipo de métrica
  const getVariationColor = (variation, metricType = 'neutral') => {
    if (Math.abs(variation) < 0.1) return 'text-gray-600';
    
    switch (metricType) {
      case 'weight': // Para peso, depende do objetivo
        return variation > 0 ? 'text-orange-600' : 'text-red-600';
      case 'fat': // Para gordura, menos é melhor
        return variation > 0 ? 'text-red-600' : 'text-green-600';
      case 'muscle': // Para massa magra, mais é melhor
        return variation > 0 ? 'text-green-600' : 'text-red-600';
      default:
        return variation > 0 ? 'text-green-600' : 'text-red-600';
    }
  };

  // Preparar dados para gráfico de evolução temporal
  const labels = sortedAvaliacoes.map((av, index) => `Aval. ${index + 1}`);
  
  const evolutionData = {
    labels,
    datasets: [
      {
        label: 'Peso (kg)',
        data: sortedAvaliacoes.map(av => av.peso),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: '% Gordura',
        data: sortedAvaliacoes.map(av => av.percentualGordura),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
      {
        label: 'Massa Magra (kg)',
        data: sortedAvaliacoes.map(av => av.massaMagra),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y',
      }
    ]
  };

  const evolutionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Evolução Temporal'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Peso / Massa Magra (kg)'
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Gordura (%)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: 'Evolução das Métricas Principais',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
      }
    }
  };

  // Preparar dados para gráfico de composição corporal (doughnut)
  const latestComposition = {
    labels: ['Massa Magra', 'Gordura Corporal'],
    datasets: [{
      data: [
        ultima.massaMagra || 0,
        (ultima.peso || 0) - (ultima.massaMagra || 0)
      ],
      backgroundColor: ['#10b981', '#ef4444'],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  const compositionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Composição Corporal Atual',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toFixed(1)} kg (${percentage}%)`;
          }
        }
      }
    }
  };

  // Métricas de comparação
  const metricas = [
    {
      nome: 'Peso',
      inicial: primeira.peso,
      final: ultima.peso,
      unidade: 'kg',
      tipo: 'weight',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      )
    },
    {
      nome: '% Gordura',
      inicial: primeira.percentualGordura,
      final: ultima.percentualGordura,
      unidade: '%',
      tipo: 'fat',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      nome: 'Massa Magra',
      inicial: primeira.massaMagra,
      final: ultima.massaMagra,
      unidade: 'kg',
      tipo: 'muscle',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 113 0v1m0 0V11m0-5.5T6.5 15a2 2 0 104 0m-5 4v-3a1 1 0 011-1h4a1 1 0 011 1v3M7 15h10" />
        </svg>
      )
    },
    {
      nome: 'IMC',
      inicial: primeira.imc,
      final: ultima.imc,
      unidade: 'kg/m²',
      tipo: 'neutral',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Cards de Comparação */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricas.map((metrica) => {
          const variacao = calcularVariacao(metrica.inicial, metrica.final);
          const colorClass = getVariationColor(variacao, metrica.tipo);
          
          return (
            <div key={metrica.nome} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <div className="text-primary-600">
                    {metrica.icon}
                  </div>
                </div>
                <div className={`text-right ${colorClass}`}>
                  <div className="text-sm font-medium">
                    {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
                  </div>
                  <div className="text-xs">
                    {variacao > 0 ? '↗' : variacao < 0 ? '↘' : '→'}
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{metrica.nome}</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Inicial:</span>
                  <span className="font-medium">{metrica.inicial?.toFixed(1)} {metrica.unidade}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Atual:</span>
                  <span className="font-medium">{metrica.final?.toFixed(1)} {metrica.unidade}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Diferença:</span>
                  <span className={`font-semibold ${colorClass}`}>
                    {(metrica.final - metrica.inicial) > 0 ? '+' : ''}{(metrica.final - metrica.inicial)?.toFixed(1)} {metrica.unidade}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Evolução */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <div className="h-80">
            <Line options={evolutionOptions} data={evolutionData} />
          </div>
        </div>

        {/* Gráfico de Composição Corporal */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="h-80">
            <Doughnut options={compositionOptions} data={latestComposition} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Peso Total:</span>
              <span className="font-semibold">{ultima.peso?.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">% Massa Magra:</span>
              <span className="font-semibold text-green-600">
                {((ultima.massaMagra / ultima.peso) * 100)?.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Temporal */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Período</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary-600">{sortedAvaliacoes.length}</p>
            <p className="text-sm text-gray-600">Total de Avaliações</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-600">
              {Math.ceil((new Date(ultima.dataAvaliacao?.toDate ? ultima.dataAvaliacao.toDate() : ultima.dataAvaliacao) - 
                         new Date(primeira.dataAvaliacao?.toDate ? primeira.dataAvaliacao.toDate() : primeira.dataAvaliacao)) / 
                         (1000 * 60 * 60 * 24))}
            </p>
            <p className="text-sm text-gray-600">Dias de Acompanhamento</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {(sortedAvaliacoes.length / Math.max(1, Math.ceil((new Date(ultima.dataAvaliacao?.toDate ? ultima.dataAvaliacao.toDate() : ultima.dataAvaliacao) - 
                         new Date(primeira.dataAvaliacao?.toDate ? primeira.dataAvaliacao.toDate() : primeira.dataAvaliacao)) / 
                         (1000 * 60 * 60 * 24 * 30)))).toFixed(1)}
            </p>
            <p className="text-sm text-gray-600">Avaliações por Mês</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonDashboard; 
