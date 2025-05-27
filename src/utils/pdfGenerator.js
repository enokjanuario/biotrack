import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { formatDate } from './formatDate';

// Constantes para tipos de foto
const FOTO_TIPOS = {
  FRENTE: 'frente',
  LADO_DIREITO: 'ladoDireito', 
  LADO_ESQUERDO: 'ladoEsquerdo',
  COSTAS: 'costas'
};

// Labels para os tipos de foto
const FOTO_LABELS = {
  [FOTO_TIPOS.FRENTE]: 'Frente',
  [FOTO_TIPOS.LADO_DIREITO]: 'Lado Direito',
  [FOTO_TIPOS.LADO_ESQUERDO]: 'Lado Esquerdo',
  [FOTO_TIPOS.COSTAS]: 'Costas'
};

// Função para carregar imagem como base64
const loadImageAsBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
};

// Função para capturar gráfico como imagem
const captureChartAsImage = async (chartContainer) => {
  try {
    if (!chartContainer) {
      console.warn('Container do gráfico não encontrado');
      return null;
    }

    // Aguardar renderização completa
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Capturando gráfico:', {
      width: chartContainer.offsetWidth,
      height: chartContainer.offsetHeight,
      visible: chartContainer.offsetWidth > 0 && chartContainer.offsetHeight > 0
    });

    const canvas = await html2canvas(chartContainer, {
      backgroundColor: '#ffffff',
      scale: 2, // Qualidade boa sem sobrecarregar
      useCORS: true,
      allowTaint: true, // Permitir elementos externos
      logging: true, // Ativar logs para debug
      imageTimeout: 15000,
      removeContainer: false,
      width: Math.max(chartContainer.offsetWidth, 800),
      height: Math.max(chartContainer.offsetHeight, 400),
      ignoreElements: (element) => {
        // Ignorar elementos que podem causar problemas
        return element.tagName === 'IFRAME' || 
               element.classList?.contains('tooltip') ||
               element.style?.position === 'fixed';
      }
    });
    
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    console.log('Gráfico capturado com sucesso', dataUrl.length);
    return dataUrl;
  } catch (error) {
    console.error('Erro ao capturar gráfico:', error);
    return null;
  }
};

// Função para carregar imagem base64 como data URL
const loadBase64Image = (base64Data) => {
  return new Promise((resolve) => {
    if (!base64Data) {
      resolve(null);
      return;
    }
    
    // Se já é uma data URL completa
    if (base64Data.startsWith('data:image/')) {
      resolve(base64Data);
      return;
    }
    
    // Se é apenas o base64 sem prefixo
    resolve(`data:image/jpeg;base64,${base64Data}`);
  });
};

// Função auxiliar para exibir fotos de uma avaliação
const exibirFotosAvaliacao = async (pdf, avaliacao, x, y, width) => {
  const fotoWidth = (width - 15) / 2;
  const fotoHeight = 40;
  
  const ordemFotos = [FOTO_TIPOS.FRENTE, FOTO_TIPOS.LADO_DIREITO, FOTO_TIPOS.LADO_ESQUERDO, FOTO_TIPOS.COSTAS];
  let currentX = x;
  let currentYPos = y;
  let fotosNaLinha = 0;
  
  for (const tipoFoto of ordemFotos) {
    if (avaliacao.fotos && avaliacao.fotos[tipoFoto]) {
      try {
        // Usar .url que já está processado pela função prepararDadosFotosParaExibicao
        const base64Data = avaliacao.fotos[tipoFoto].url;
        const imgData = await loadBase64Image(base64Data);
        if (imgData) {
          pdf.addImage(imgData, 'JPEG', currentX, currentYPos, fotoWidth, fotoHeight);
          
          // Label da foto
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text(FOTO_LABELS[tipoFoto], currentX + 2, currentYPos + fotoHeight + 5);
          
          fotosNaLinha++;
          if (fotosNaLinha % 2 === 0) {
            currentYPos += fotoHeight + 10;
            currentX = x;
          } else {
            currentX += fotoWidth + 5;
          }
        }
      } catch (error) {
        console.error(`Erro ao carregar foto ${tipoFoto}:`, error);
      }
    }
  }
};

// Função auxiliar para exibir fotos comparativas lado a lado
const exibirFotosComparativo = async (pdf, primeira, ultima, x, y, width) => {
  const colWidth = (width - 10) / 2;
  const fotoWidth = (colWidth - 15) / 2;
  const fotoHeight = 25;
  
  const ordemFotos = [FOTO_TIPOS.FRENTE, FOTO_TIPOS.LADO_DIREITO, FOTO_TIPOS.LADO_ESQUERDO, FOTO_TIPOS.COSTAS];
  
  for (let i = 0; i < ordemFotos.length; i++) {
    const tipoFoto = ordemFotos[i];
    
    // Layout 2x2: linha = Math.floor(i/2), coluna = i%2
    const linha = Math.floor(i / 2);
    const coluna = i % 2;
    const fotoX = coluna * (fotoWidth + 5);
    const fotoY = y + (linha * (fotoHeight + 8));
    
    // Foto da primeira avaliação
    if (primeira.fotos && primeira.fotos[tipoFoto]) {
      try {
        const base64Data = primeira.fotos[tipoFoto].url;
        const imgData = await loadBase64Image(base64Data);
        if (imgData) {
          pdf.addImage(imgData, 'JPEG', x + fotoX, fotoY, fotoWidth, fotoHeight);
          pdf.setFontSize(7);
          pdf.setTextColor(100, 100, 100);
          pdf.text(FOTO_LABELS[tipoFoto], x + fotoX + 1, fotoY + fotoHeight + 4);
        }
      } catch (error) {
        console.error(`Erro ao carregar foto ${tipoFoto} primeira:`, error);
      }
    }
    
    // Foto da última avaliação
    if (ultima.fotos && ultima.fotos[tipoFoto]) {
      try {
        const base64Data = ultima.fotos[tipoFoto].url;
        const imgData = await loadBase64Image(base64Data);
        if (imgData) {
          pdf.addImage(imgData, 'JPEG', x + colWidth + 10 + fotoX, fotoY, fotoWidth, fotoHeight);
          pdf.setFontSize(7);
          pdf.setTextColor(100, 100, 100);
          pdf.text(FOTO_LABELS[tipoFoto], x + colWidth + 10 + fotoX + 1, fotoY + fotoHeight + 4);
        }
      } catch (error) {
        console.error(`Erro ao carregar foto ${tipoFoto} última:`, error);
      }
    }
  }
};

export const generatePDFReport = async (aluno, avaliacoes, stats, chartElements = {}) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentY = margin;

  // Função para adicionar nova página se necessário
  const checkPageBreak = (neededHeight) => {
    if (currentY + neededHeight > pageHeight - margin - 15) {
      pdf.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // Função para adicionar linha divisória
  const addDivider = (color = [200, 200, 200]) => {
    pdf.setDrawColor(...color);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;
  };

  try {
    // CABEÇALHO DO RELATÓRIO - Similar à página web
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Título central
    pdf.setTextColor(37, 99, 235);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RELATÓRIO DE EVOLUÇÃO FÍSICA', pageWidth / 2, currentY + 15, { align: 'center' });
    
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Acompanhamento Profissional de Composição Corporal', pageWidth / 2, currentY + 25, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.text(`Gerado em ${formatDate(new Date())}`, pageWidth / 2, currentY + 33, { align: 'center' });

    currentY += 50;

    // INFORMAÇÕES DO ALUNO
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, currentY, contentWidth, 35, 'F');
    
    pdf.setDrawColor(37, 99, 235);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, currentY, contentWidth, 35);
    
    pdf.setTextColor(37, 99, 235);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DADOS PESSOAIS', margin + 5, currentY + 8);
    
    // Informações em grid 2x2
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const col1X = margin + 5;
    const col2X = margin + (contentWidth / 2);
    
    pdf.text(`Nome: ${aluno.nome}`, col1X, currentY + 15);
    pdf.text(`Altura: ${aluno.altura} cm`, col2X, currentY + 15);
    
    pdf.text(`Idade: ${aluno.idade || 'N/A'} anos`, col1X, currentY + 20);
    pdf.text(`Sexo: ${aluno.sexo === 'M' ? 'Masculino' : aluno.sexo === 'F' ? 'Feminino' : 'Não informado'}`, col2X, currentY + 20);
    
    pdf.text(`Objetivo: ${(aluno.objetivo || 'Não definido').substring(0, 40)}${aluno.objetivo && aluno.objetivo.length > 40 ? '...' : ''}`, col1X, currentY + 25);
    pdf.text(`Total de Avaliações: ${stats.totalAvaliacoes || 0}`, col2X, currentY + 25);
    
    pdf.text(`Período: ${stats.periodoMonitoramento || 0} dias`, col1X, currentY + 30);
    pdf.text(`Última Avaliação: ${stats.ultimaAvaliacao || 'N/A'}`, col2X, currentY + 30);
    
    currentY += 45;

    // RESUMO EXECUTIVO
    if (avaliacoes.length > 1) {
      checkPageBreak(60);
      
      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RESUMO EXECUTIVO', margin, currentY);
      
      currentY += 12;
      
      // Grid 2x2 de cards
      const cardWidth = (contentWidth - 5) / 2;
      const cardHeight = 25;
      
      // Card 1 - Peso (azul)
      pdf.setFillColor(239, 246, 255);
      pdf.rect(margin, currentY, cardWidth, cardHeight, 'F');
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(0.3);
      pdf.rect(margin, currentY, cardWidth, cardHeight);
      
      pdf.setTextColor(59, 130, 246);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VARIAÇÃO DE PESO', margin + 3, currentY + 6);
      
      pdf.setFontSize(16);
      pdf.setTextColor(30, 64, 175);
      const variacaoPeso = stats.variacaoPeso ? `${stats.variacaoPeso > 0 ? '+' : ''}${stats.variacaoPeso.toFixed(1)} kg` : 'N/A';
      pdf.text(variacaoPeso, margin + 3, currentY + 15);
      
      pdf.setFontSize(8);
      pdf.setTextColor(75, 85, 99);
      const trendPeso = stats.variacaoPeso > 0 ? 'Ganho' : stats.variacaoPeso < 0 ? 'Redução' : 'Estável';
      pdf.text(trendPeso, margin + 3, currentY + 20);
      
      // Card 2 - Gordura (laranja)
      pdf.setFillColor(255, 247, 237);
      pdf.rect(margin + cardWidth + 5, currentY, cardWidth, cardHeight, 'F');
      pdf.setDrawColor(251, 146, 60);
      pdf.setLineWidth(0.3);
      pdf.rect(margin + cardWidth + 5, currentY, cardWidth, cardHeight);
      
      pdf.setTextColor(251, 146, 60);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('% GORDURA CORPORAL', margin + cardWidth + 8, currentY + 6);
      
      pdf.setFontSize(16);
      pdf.setTextColor(194, 65, 12);
      const variacaoGordura = stats.variacaoGordura ? `${stats.variacaoGordura > 0 ? '+' : ''}${stats.variacaoGordura.toFixed(1)}%` : 'N/A';
      pdf.text(variacaoGordura, margin + cardWidth + 8, currentY + 15);
      
      pdf.setFontSize(8);
      pdf.setTextColor(75, 85, 99);
      const trendGordura = stats.variacaoGordura > 0 ? 'Aumento' : stats.variacaoGordura < 0 ? 'Redução' : 'Estável';
      pdf.text(trendGordura, margin + cardWidth + 8, currentY + 20);
      
      currentY += cardHeight + 5;
      
      // Card 3 - IMC (verde)
      pdf.setFillColor(240, 253, 244);
      pdf.rect(margin, currentY, cardWidth, cardHeight, 'F');
      pdf.setDrawColor(34, 197, 94);
      pdf.setLineWidth(0.3);
      pdf.rect(margin, currentY, cardWidth, cardHeight);
      
      pdf.setTextColor(34, 197, 94);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ÍNDICE DE MASSA CORPORAL', margin + 3, currentY + 6);
      
      pdf.setFontSize(16);
      pdf.setTextColor(21, 128, 61);
      const variacaoIMC = stats.variacaoIMC ? `${stats.variacaoIMC > 0 ? '+' : ''}${stats.variacaoIMC.toFixed(1)}` : 'N/A';
      pdf.text(variacaoIMC, margin + 3, currentY + 15);
      
      pdf.setFontSize(8);
      pdf.setTextColor(75, 85, 99);
      const trendIMC = stats.variacaoIMC > 0 ? 'Aumento' : stats.variacaoIMC < 0 ? 'Redução' : 'Estável';
      pdf.text(trendIMC, margin + 3, currentY + 20);
      
      // Card 4 - Massa Magra (roxo)
      pdf.setFillColor(250, 245, 255);
      pdf.rect(margin + cardWidth + 5, currentY, cardWidth, cardHeight, 'F');
      pdf.setDrawColor(147, 51, 234);
      pdf.setLineWidth(0.3);
      pdf.rect(margin + cardWidth + 5, currentY, cardWidth, cardHeight);
      
      pdf.setTextColor(147, 51, 234);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MASSA MAGRA', margin + cardWidth + 8, currentY + 6);
      
      pdf.setFontSize(16);
      pdf.setTextColor(126, 34, 206);
      const variacaoMassaMagra = stats.variacaoMassaMagra ? `${stats.variacaoMassaMagra > 0 ? '+' : ''}${stats.variacaoMassaMagra.toFixed(1)} kg` : 'N/A';
      pdf.text(variacaoMassaMagra, margin + cardWidth + 8, currentY + 15);
      
      pdf.setFontSize(8);
      pdf.setTextColor(75, 85, 99);
      const trendMassaMagra = stats.variacaoMassaMagra > 0 ? 'Ganho' : stats.variacaoMassaMagra < 0 ? 'Redução' : 'Estável';
      pdf.text(trendMassaMagra, margin + cardWidth + 8, currentY + 20);
      
      currentY += cardHeight + 15;
    }

    // GRÁFICOS DE EVOLUÇÃO
    if (avaliacoes.length > 1) {
      checkPageBreak(120);
      
      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('GRÁFICOS DE EVOLUÇÃO', margin, currentY);
      
      currentY += 12;
      
      // Capturar gráficos de composição corporal
      const chartTypes = ['peso', 'gordura', 'imc'];
      
      console.log('Elementos de gráfico disponíveis:', Object.keys(chartElements));
      
      for (const chartType of chartTypes) {
        if (chartElements[chartType]) {
          try {
            console.log(`Processando gráfico ${chartType}...`);
            checkPageBreak(85);
            
            const chartImage = await captureChartAsImage(chartElements[chartType]);
            
            if (chartImage && chartImage.length > 1000) { // Verificar se a imagem foi realmente capturada
              pdf.setTextColor(0, 0, 0);
              pdf.setFontSize(12);
              pdf.setFont('helvetica', 'bold');
              
              const chartTitles = {
                peso: 'Evolução do Peso Corporal',
                gordura: 'Evolução do Percentual de Gordura',
                imc: 'Evolução do Índice de Massa Corporal'
              };
              
              pdf.text(chartTitles[chartType], margin, currentY);
              currentY += 8;
              
              const chartWidth = contentWidth;
              const chartHeight = 70; // Aumentado para melhor visualização
              
              pdf.addImage(chartImage, 'PNG', margin, currentY, chartWidth, chartHeight);
              currentY += chartHeight + 15; // Mais espaço entre gráficos
              
              console.log(`Gráfico ${chartType} adicionado com sucesso`);
            } else {
              console.warn(`Gráfico ${chartType} não pôde ser capturado ou está vazio`);
              
              // Adicionar placeholder se o gráfico não foi capturado
              pdf.setTextColor(150, 150, 150);
              pdf.setFontSize(10);
              pdf.text(`[Gráfico ${chartType} não disponível]`, margin, currentY);
              currentY += 15;
            }
          } catch (error) {
            console.error(`Erro ao processar gráfico ${chartType}:`, error);
            
            // Adicionar indicação de erro
            pdf.setTextColor(200, 50, 50);
            pdf.setFontSize(10);
            pdf.text(`[Erro ao carregar gráfico ${chartType}]`, margin, currentY);
            currentY += 15;
          }
        } else {
          console.warn(`Elemento do gráfico ${chartType} não encontrado`);
        }
      }

      // Gráfico de circunferências se disponível
      if (chartElements.circunferencias) {
        try {
          console.log('Processando gráfico de circunferências...');
          checkPageBreak(85);
          
          const circChart = await captureChartAsImage(chartElements.circunferencias);
          
          if (circChart && circChart.length > 1000) {
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Evolução das Circunferências', margin, currentY);
            currentY += 8;
            
            const chartWidth = contentWidth;
            const chartHeight = 70; // Aumentado para melhor visualização
            
            pdf.addImage(circChart, 'PNG', margin, currentY, chartWidth, chartHeight);
            currentY += chartHeight + 15; // Mais espaço entre gráficos
            
            console.log('Gráfico de circunferências adicionado com sucesso');
          } else {
            console.warn('Gráfico de circunferências não pôde ser capturado ou está vazio');
            
            // Adicionar placeholder
            pdf.setTextColor(150, 150, 150);
            pdf.setFontSize(10);
            pdf.text('[Gráfico de circunferências não disponível]', margin, currentY);
            currentY += 15;
          }
        } catch (error) {
          console.error('Erro ao capturar gráfico de circunferências:', error);
          
          // Adicionar indicação de erro
          pdf.setTextColor(200, 50, 50);
          pdf.setFontSize(10);
          pdf.text('[Erro ao carregar gráfico de circunferências]', margin, currentY);
          currentY += 15;
        }
      } else {
        console.warn('Elemento do gráfico de circunferências não encontrado');
      }
    }

    // HISTÓRICO DETALHADO
    if (avaliacoes.length > 0) {
      checkPageBreak(60);
      
      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('HISTÓRICO DETALHADO DE AVALIAÇÕES', margin, currentY);
      
      currentY += 12;
      
      // Cabeçalho da tabela
      const colWidths = [22, 18, 15, 18, 20, 75];
      const headers = ['Data', 'Peso', 'IMC', '% Gordura', 'M. Magra', 'Observações'];
      
      pdf.setFillColor(37, 99, 235);
      pdf.rect(margin, currentY, contentWidth, 10, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      
      let colX = margin;
      headers.forEach((header, index) => {
        pdf.text(header, colX + 2, currentY + 6);
        colX += colWidths[index];
      });
      
      currentY += 12;
      
      // Dados da tabela
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      
      avaliacoes.forEach((avaliacao, index) => {
        checkPageBreak(10);
        
        if (index % 2 === 0) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, currentY - 2, contentWidth, 10, 'F');
        }
        
        colX = margin;
        const rowData = [
          formatDate(avaliacao.dataAvaliacao?.toDate()),
          avaliacao.peso ? `${avaliacao.peso.toFixed(1)}kg` : '-',
          avaliacao.imc?.toFixed(1) || '-',
          avaliacao.percentualGordura ? `${avaliacao.percentualGordura.toFixed(1)}%` : '-',
          avaliacao.massaMagra ? `${avaliacao.massaMagra.toFixed(1)}kg` : '-',
          (avaliacao.observacoes || '-').substring(0, 35) + (avaliacao.observacoes && avaliacao.observacoes.length > 35 ? '...' : '')
        ];
        
        rowData.forEach((data, colIndex) => {
          const maxWidth = colWidths[colIndex] - 3;
          const lines = pdf.splitTextToSize(data.toString(), maxWidth);
          pdf.text(lines[0] || '', colX + 2, currentY + 4);
          colX += colWidths[colIndex];
        });
        
        currentY += 10;
      });
      
      currentY += 10;
    }

    // SEÇÃO DE FOTOS - Evolução Fotográfica
    const avaliacoesComFotos = avaliacoes.filter(av => av.fotos && Object.keys(av.fotos).length > 0);
    
    if (avaliacoesComFotos.length > 0) {
      checkPageBreak(100);
      
      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EVOLUÇÃO FOTOGRÁFICA', margin, currentY);
      
      currentY += 15;
      
      // Subtítulo explicativo
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Comparativo visual entre primeira e última avaliação com fotos', margin, currentY);
      
      currentY += 20;
      
      // Mostrar primeira e última avaliação com fotos lado a lado
      const primeiraComFoto = avaliacoesComFotos[0];
      const ultimaComFoto = avaliacoesComFotos[avaliacoesComFotos.length - 1];
      
      if (primeiraComFoto && ultimaComFoto) {
        // Se for a mesma avaliação, mostrar apenas uma vez
        if (primeiraComFoto.id === ultimaComFoto.id) {
          checkPageBreak(120);
          
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`AVALIAÇÃO ÚNICA - ${formatDate(primeiraComFoto.dataAvaliacao?.toDate())}`, margin, currentY);
          
          currentY += 15;
          
          await exibirFotosAvaliacao(pdf, primeiraComFoto, margin, currentY, contentWidth);
          currentY += 85; // Altura para grid 4 fotos com labels
        } else {
          // Mostrar comparativo lado a lado
          checkPageBreak(90); // Altura adequada para grid 2x2
          
          // Títulos das colunas
          const colWidth = (contentWidth - 10) / 2;
          
          pdf.setTextColor(37, 99, 235);
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('PRIMEIRA AVALIAÇÃO', margin, currentY);
          pdf.text('ÚLTIMA AVALIAÇÃO', margin + colWidth + 10, currentY);
          
          pdf.setTextColor(107, 114, 128);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(formatDate(primeiraComFoto.dataAvaliacao?.toDate()), margin, currentY + 8);
          pdf.text(formatDate(ultimaComFoto.dataAvaliacao?.toDate()), margin + colWidth + 10, currentY + 8);
          
          currentY += 20;
          
          // Exibir fotos lado a lado
          await exibirFotosComparativo(pdf, primeiraComFoto, ultimaComFoto, margin, currentY, contentWidth);
          currentY += 75; // Altura para grid 2x2 com labels
        }
      }
    }

    // SEÇÃO DE CIRCUNFERÊNCIAS - Evolução das Medidas
    const avaliacoesComCirc = avaliacoes.filter(av => av.circunferencias && Object.keys(av.circunferencias).length > 0);
    
    if (avaliacoesComCirc.length > 0) {
      checkPageBreak(100);
      
      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EVOLUÇÃO DAS CIRCUNFERÊNCIAS', margin, currentY);
      
      currentY += 15;
      
      // Subtítulo explicativo
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      currentY += 15;
      
      // Pegar primeira e última avaliação com circunferências
      const primeiraCirc = avaliacoesComCirc[0];
      const ultimaCirc = avaliacoesComCirc[avaliacoesComCirc.length - 1];
      
      if (primeiraCirc && ultimaCirc && primeiraCirc.id !== ultimaCirc.id) {
        // Tabela comparativa
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Comparativo Primeira vs Última Avaliação', margin, currentY);
        
        currentY += 10;
        
        // Cabeçalho da tabela de circunferências
        const circColWidths = [40, 25, 25, 25];
        const circHeaders = ['Medida', 'Primeira', 'Última', 'Variação'];
        
        pdf.setFillColor(37, 99, 235);
        pdf.rect(margin, currentY, contentWidth, 8, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        
        let circColX = margin;
        circHeaders.forEach((header, index) => {
          pdf.text(header, circColX + 2, currentY + 5);
          circColX += circColWidths[index];
        });
        
        currentY += 10;
        
        // Dados das circunferências
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        
        const circunferenciasComuns = Object.keys(primeiraCirc.circunferencias).filter(
          circ => ultimaCirc.circunferencias[circ] !== undefined
        );
        
        circunferenciasComuns.forEach((circ, index) => {
          checkPageBreak(8);
          
          if (index % 2 === 0) {
            pdf.setFillColor(249, 250, 251);
            pdf.rect(margin, currentY - 1, contentWidth, 8, 'F');
          }
          
          const primeira = primeiraCirc.circunferencias[circ];
          const ultima = ultimaCirc.circunferencias[circ];
          const variacao = ultima - primeira;
          const percentual = (variacao / primeira) * 100;
          
          circColX = margin;
          const circRowData = [
            circ.replace(/([A-Z])/g, ' $1').trim(),
            `${primeira.toFixed(1)} cm`,
            `${ultima.toFixed(1)} cm`,
            `${variacao > 0 ? '+' : ''}${variacao.toFixed(1)} cm (${percentual > 0 ? '+' : ''}${percentual.toFixed(1)}%)`
          ];
          
          circRowData.forEach((data, colIndex) => {
            const maxWidth = circColWidths[colIndex] - 3;
            const lines = pdf.splitTextToSize(data.toString(), maxWidth);
            
            if (colIndex === 3) {
              // Colorir variação
              if (Math.abs(variacao) > 0.5) {
                if (variacao > 0) {
                  pdf.setTextColor(220, 38, 38); // vermelho para aumento
                } else {
                  pdf.setTextColor(34, 197, 94); // verde para redução
                }
              } else {
                pdf.setTextColor(100, 100, 100);
              }
            } else {
              pdf.setTextColor(0, 0, 0);
            }
            
            pdf.text(lines[0] || '', circColX + 2, currentY + 4);
            circColX += circColWidths[colIndex];
          });
          
          currentY += 8;
        });
        
        currentY += 10;
      }
    }

    // ANÁLISE PROFISSIONAL
    if (avaliacoes.length > 1) {
      checkPageBreak(80);
      
      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ANÁLISE PROFISSIONAL', margin, currentY);
      
      currentY += 12;
      
      // Box de observações
      pdf.setFillColor(239, 246, 255);
      pdf.rect(margin, currentY, contentWidth, 30, 'F');
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(0.3);
      pdf.rect(margin, currentY, contentWidth, 30);
      
      pdf.setTextColor(59, 130, 246);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OBSERVAÇÕES DO PERÍODO', margin + 5, currentY + 7);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      
      const observacoes = [
        `• Período monitorado: ${stats.periodoMonitoramento || 0} dias com ${stats.totalAvaliacoes || 0} avaliações`,
        `• Frequência: ${((stats.totalAvaliacoes || 0) / Math.max(1, Math.ceil((stats.periodoMonitoramento || 0) / 30))).toFixed(1)} avaliações/mês`
      ];
      
      if (Math.abs(stats.variacaoPeso || 0) > 0.1) {
        observacoes.push(`• Peso: ${stats.variacaoPeso > 0 ? 'Ganho' : 'Redução'} de ${Math.abs(stats.variacaoPeso).toFixed(1)}kg`);
      }
      
      if (Math.abs(stats.variacaoGordura || 0) > 0.1) {
        observacoes.push(`• Gordura: ${stats.variacaoGordura > 0 ? 'Aumento' : 'Redução'} de ${Math.abs(stats.variacaoGordura).toFixed(1)}%`);
      }
      
      let textY = currentY + 12;
      observacoes.forEach(obs => {
        pdf.text(obs, margin + 5, textY);
        textY += 4;
      });
      
      currentY += 35;
      
      // Box de recomendações
      pdf.setFillColor(240, 253, 244);
      pdf.rect(margin, currentY, contentWidth, 25, 'F');
      pdf.setDrawColor(34, 197, 94);
      pdf.setLineWidth(0.3);
      pdf.rect(margin, currentY, contentWidth, 25);
      
      pdf.setTextColor(34, 197, 94);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RECOMENDAÇÕES', margin + 5, currentY + 7);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      
      const recomendacoes = [
        '• Manter regularidade nas avaliações para monitoramento preciso',
        '• Considerar fatores externos (hidratação, horário, etc.)',
        '• Documentar observações específicas em cada avaliação'
      ];
      
      textY = currentY + 12;
      recomendacoes.forEach(rec => {
        pdf.text(rec, margin + 5, textY);
        textY += 4;
      });
      
      currentY += 30;
    }

    // RODAPÉ - Adicionar na última página existente
    checkPageBreak(50);
    
    currentY = Math.max(currentY + 20, pageHeight - 40);
    addDivider([37, 99, 235]);
    
    pdf.setTextColor(37, 99, 235);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SISTEMA DE AVALIAÇÃO FÍSICA', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 8;
    pdf.setTextColor(75, 85, 99);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Relatório gerado em ${formatDate(new Date())} | Profissional: Administrador`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 5;
    pdf.setFontSize(8);
    pdf.text('Este documento contém informações confidenciais e deve ser tratado com sigilo profissional.', pageWidth / 2, currentY, { align: 'center' });

    // Numeração de páginas
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(8);
      pdf.text(`${i} / ${totalPages}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
    }

    // Salvar PDF
    const fileName = `relatorio_evolucao_${aluno.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    return true;
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};

export const generateChartPDF = async (chartElement, aluno, chartTitle) => {
  try {
    if (!chartElement) {
      throw new Error('Elemento do gráfico não encontrado');
    }

    // Aguardar renderização
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Gerando PDF do gráfico:', chartTitle);
    
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2, // Qualidade boa e confiável
      useCORS: true,
      allowTaint: true,
      logging: true,
      imageTimeout: 15000,
      removeContainer: false,
      width: Math.max(chartElement.offsetWidth, 800),
      height: Math.max(chartElement.offsetHeight, 400)
    });
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    
    // Título
    pdf.setTextColor(37, 99, 235);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(chartTitle, pageWidth / 2, margin + 15, { align: 'center' });
    
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${aluno.nome} - ${formatDate(new Date())}`, pageWidth / 2, margin + 25, { align: 'center' });
    
    // Adicionar gráfico com dimensões otimizadas
    const imgData = canvas.toDataURL('image/png', 1.0);
    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, pageHeight - margin * 2 - 60);
    
    pdf.addImage(imgData, 'PNG', margin, margin + 40, imgWidth, imgHeight, undefined, 'FAST');
    
    // Rodapé
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(8);
    pdf.text('Sistema de Avaliação Física - BioTrack', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Salvar
    const fileName = `grafico_${chartTitle.toLowerCase().replace(/\s+/g, '_')}_${aluno.nome.replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF do gráfico:', error);
    throw error;
  }
}; 
