import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatDate } from './formatDate';
import { FOTO_TIPOS } from './imageUpload';

// Função para carregar imagem e converter para base64
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
      try {
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
};

export const generatePDFReport = async (aluno, avaliacoes, stats) => {
  // Criar instância do jsPDF
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentY = margin;

  // Função para adicionar nova página se necessário
  const checkPageBreak = (neededHeight) => {
    if (currentY + neededHeight > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // Função para adicionar texto com quebra de linha automática
  const addText = (text, x, y, fontSize = 10, fontStyle = 'normal', maxWidth = contentWidth) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    
    const lines = pdf.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.4;
    
    checkPageBreak(lines.length * lineHeight);
    
    lines.forEach((line, index) => {
      pdf.text(line, x, currentY + (index * lineHeight));
    });
    
    currentY += lines.length * lineHeight + 2;
    return lines.length * lineHeight;
  };

  // CABEÇALHO DO RELATÓRIO
  try {
    // Título principal
    pdf.setFillColor(41, 128, 185);
    pdf.rect(margin, currentY, contentWidth, 15, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RELATÓRIO DE EVOLUÇÃO FÍSICA', pageWidth / 2, currentY + 10, { align: 'center' });
    
    currentY += 20;
    
    // Subtítulo
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Acompanhamento Profissional de Composição Corporal', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 5;
    
    pdf.setFontSize(10);
    pdf.text(`Gerado em ${formatDate(new Date())}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;

    // DADOS PESSOAIS
    pdf.setTextColor(0, 0, 0);
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, currentY, contentWidth, 8, 'F');
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DADOS PESSOAIS', margin + 5, currentY + 5);
    
    currentY += 12;
    
    // Informações do aluno em duas colunas
    const col1X = margin + 5;
    const col2X = margin + (contentWidth / 2);
    const startY = currentY;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Coluna 1
    pdf.text(`Nome: ${aluno.nome}`, col1X, currentY);
    currentY += 5;
    pdf.text(`Idade: ${aluno.idade} anos`, col1X, currentY);
    currentY += 5;
    pdf.text(`Sexo: ${aluno.sexo === 'M' ? 'Masculino' : aluno.sexo === 'F' ? 'Feminino' : 'Não informado'}`, col1X, currentY);
    currentY += 5;
    pdf.text(`Altura: ${aluno.altura} cm`, col1X, currentY);
    
    // Coluna 2
    currentY = startY;
    pdf.text(`Objetivo: ${aluno.objetivo || 'Não definido'}`, col2X, currentY);
    currentY += 5;
    pdf.text(`Total de Avaliações: ${stats.totalAvaliacoes || 0}`, col2X, currentY);
    currentY += 5;
    pdf.text(`Primeira Avaliação: ${stats.primeiraAvaliacao || 'N/A'}`, col2X, currentY);
    currentY += 5;
    pdf.text(`Última Avaliação: ${stats.ultimaAvaliacao || 'N/A'}`, col2X, currentY);
    currentY += 5;
    pdf.text(`Período: ${stats.periodoMonitoramento || 0} dias`, col2X, currentY);
    
    currentY += 15;

    // RESUMO EXECUTIVO (se houver mais de uma avaliação)
    if (avaliacoes.length > 1) {
      checkPageBreak(30);
      
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, currentY, contentWidth, 8, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RESUMO EXECUTIVO', margin + 5, currentY + 5);
      
      currentY += 15;
      
      // Cards de variação em grid 2x2
      const cardWidth = (contentWidth - 10) / 2;
      const cardHeight = 20;
      
      // Card 1 - Peso
      pdf.setFillColor(219, 234, 254);
      pdf.rect(margin, currentY, cardWidth, cardHeight, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Variação de Peso', margin + 5, currentY + 5);
      pdf.setFontSize(14);
      const variacaoPeso = stats.variacaoPeso ? `${stats.variacaoPeso > 0 ? '+' : ''}${stats.variacaoPeso.toFixed(1)} kg` : 'N/A';
      pdf.text(variacaoPeso, margin + 5, currentY + 12);
      
      // Card 2 - Gordura
      pdf.setFillColor(254, 226, 226);
      pdf.rect(margin + cardWidth + 5, currentY, cardWidth, cardHeight, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Variação % Gordura', margin + cardWidth + 10, currentY + 5);
      pdf.setFontSize(14);
      const variacaoGordura = stats.variacaoGordura ? `${stats.variacaoGordura > 0 ? '+' : ''}${stats.variacaoGordura.toFixed(1)}%` : 'N/A';
      pdf.text(variacaoGordura, margin + cardWidth + 10, currentY + 12);
      
      currentY += cardHeight + 5;
      
      // Card 3 - IMC
      pdf.setFillColor(220, 252, 231);
      pdf.rect(margin, currentY, cardWidth, cardHeight, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Variação IMC', margin + 5, currentY + 5);
      pdf.setFontSize(14);
      const variacaoIMC = stats.variacaoIMC ? `${stats.variacaoIMC > 0 ? '+' : ''}${stats.variacaoIMC.toFixed(1)}` : 'N/A';
      pdf.text(variacaoIMC, margin + 5, currentY + 12);
      
      // Card 4 - Massa Magra
      pdf.setFillColor(237, 233, 254);
      pdf.rect(margin + cardWidth + 5, currentY, cardWidth, cardHeight, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Variação Massa Magra', margin + cardWidth + 10, currentY + 5);
      pdf.setFontSize(14);
      const variacaoMassaMagra = stats.variacaoMassaMagra ? `${stats.variacaoMassaMagra > 0 ? '+' : ''}${stats.variacaoMassaMagra.toFixed(1)} kg` : 'N/A';
      pdf.text(variacaoMassaMagra, margin + cardWidth + 10, currentY + 12);
      
      currentY += cardHeight + 15;
    }

    // FOTOS DAS AVALIAÇÕES (se houver)
    const avaliacoesComFotos = avaliacoes.filter(av => av.fotos && Object.keys(av.fotos).length > 0);
    
    if (avaliacoesComFotos.length > 0) {
      checkPageBreak(50);
      
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, currentY, contentWidth, 8, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REGISTRO FOTOGRÁFICO', margin + 5, currentY + 5);
      
      currentY += 15;
      
      // Labels para os tipos de foto
      const labels = {
        [FOTO_TIPOS.FRENTE]: 'Frente',
        [FOTO_TIPOS.LADO_DIREITO]: 'Lado Dir.',
        [FOTO_TIPOS.LADO_ESQUERDO]: 'Lado Esq.',
        [FOTO_TIPOS.COSTAS]: 'Costas'
      };
      
      // Mostrar fotos das últimas 3 avaliações ou todas se forem menos
      const avaliacoesParaMostrar = avaliacoesComFotos.slice(-3);
      
      for (const avaliacao of avaliacoesParaMostrar) {
        try {
          checkPageBreak(60);
          
          // Título da avaliação
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Avaliação de ${formatDate(avaliacao.dataAvaliacao?.toDate())}`, margin, currentY);
          currentY += 8;
          
          // Grid de fotos (2x2)
          const fotoWidth = (contentWidth - 15) / 4;
          const fotoHeight = 40;
          let fotoX = margin;
          let fotosNaLinha = 0;
          
          const ordemTipos = [FOTO_TIPOS.FRENTE, FOTO_TIPOS.LADO_DIREITO, FOTO_TIPOS.LADO_ESQUERDO, FOTO_TIPOS.COSTAS];
          
          for (const tipo of ordemTipos) {
            const foto = avaliacao.fotos[tipo];
            
            if (foto?.url) {
              try {
                // Carregar e redimensionar imagem
                const imageData = await loadImageAsBase64(foto.url);
                
                // Adicionar imagem ao PDF
                pdf.addImage(imageData, 'JPEG', fotoX, currentY, fotoWidth, fotoHeight);
                
                // Adicionar label da foto
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'normal');
                const labelWidth = pdf.getStringUnitWidth(labels[tipo]) * 8 / pdf.internal.scaleFactor;
                const labelX = fotoX + (fotoWidth - labelWidth) / 2;
                pdf.text(labels[tipo], labelX, currentY + fotoHeight + 4);
                
              } catch (imageError) {
                console.error('Erro ao carregar imagem:', imageError);
                
                // Desenhar placeholder se não conseguir carregar a imagem
                pdf.setFillColor(240, 240, 240);
                pdf.rect(fotoX, currentY, fotoWidth, fotoHeight, 'F');
                
                pdf.setTextColor(120, 120, 120);
                pdf.setFontSize(8);
                pdf.text('Imagem não', fotoX + fotoWidth/2, currentY + fotoHeight/2 - 2, { align: 'center' });
                pdf.text('disponível', fotoX + fotoWidth/2, currentY + fotoHeight/2 + 2, { align: 'center' });
                pdf.setTextColor(0, 0, 0);
              }
            } else {
              // Placeholder para foto não disponível
              pdf.setFillColor(250, 250, 250);
              pdf.rect(fotoX, currentY, fotoWidth, fotoHeight, 'F');
              pdf.setDrawColor(200, 200, 200);
              pdf.rect(fotoX, currentY, fotoWidth, fotoHeight);
              
              pdf.setTextColor(120, 120, 120);
              pdf.setFontSize(8);
              pdf.text(labels[tipo], fotoX + fotoWidth/2, currentY + fotoHeight/2, { align: 'center' });
              pdf.setTextColor(0, 0, 0);
            }
            
            fotoX += fotoWidth + 5;
            fotosNaLinha++;
            
            // Quebrar linha a cada 4 fotos
            if (fotosNaLinha === 4) {
              fotoX = margin;
              fotosNaLinha = 0;
            }
          }
          
          currentY += fotoHeight + 15;
          
        } catch (error) {
          console.error('Erro ao processar fotos da avaliação:', error);
          pdf.setTextColor(120, 120, 120);
          pdf.setFontSize(9);
          pdf.text('Erro ao carregar fotos desta avaliação', margin, currentY);
          pdf.setTextColor(0, 0, 0);
          currentY += 10;
        }
      }
      
      if (avaliacoesComFotos.length > 3) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(120, 120, 120);
        pdf.text(`Mostrando fotos das últimas 3 avaliações de ${avaliacoesComFotos.length} disponíveis.`, margin, currentY);
        pdf.setTextColor(0, 0, 0);
        currentY += 10;
      }
    }

    // HISTÓRICO DE AVALIAÇÕES
    if (avaliacoes.length > 0) {
      checkPageBreak(50);
      
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, currentY, contentWidth, 8, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('HISTÓRICO DETALHADO DE AVALIAÇÕES', margin + 5, currentY + 5);
      
      currentY += 15;
      
      // Cabeçalho da tabela
      const colWidths = [25, 20, 20, 25, 25, 55];
      const headers = ['Data', 'Peso (kg)', 'IMC', '% Gordura', 'Massa Magra (kg)', 'Observações'];
      
      pdf.setFillColor(229, 231, 235);
      pdf.rect(margin, currentY, contentWidth, 8, 'F');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      
      let colX = margin;
      headers.forEach((header, index) => {
        pdf.text(header, colX + 2, currentY + 5);
        colX += colWidths[index];
      });
      
      currentY += 10;
      
      // Dados da tabela
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      
      avaliacoes.forEach((avaliacao, index) => {
        checkPageBreak(8);
        
        if (index % 2 === 0) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, currentY - 2, contentWidth, 8, 'F');
        }
        
        colX = margin;
        const rowData = [
          formatDate(avaliacao.dataAvaliacao?.toDate()),
          avaliacao.peso?.toFixed(1) || '-',
          avaliacao.imc?.toFixed(1) || '-',
          avaliacao.percentualGordura ? `${avaliacao.percentualGordura.toFixed(1)}%` : '-',
          avaliacao.massaMagra?.toFixed(1) || '-',
          (avaliacao.observacoes || '-').substring(0, 30) + (avaliacao.observacoes && avaliacao.observacoes.length > 30 ? '...' : '')
        ];
        
        rowData.forEach((data, colIndex) => {
          const maxWidth = colWidths[colIndex] - 4;
          const lines = pdf.splitTextToSize(data, maxWidth);
          pdf.text(lines[0], colX + 2, currentY + 3);
          colX += colWidths[colIndex];
        });
        
        currentY += 8;
      });
      
      currentY += 10;
    }

    // ANÁLISE E RECOMENDAÇÕES
    if (avaliacoes.length > 1) {
      checkPageBreak(60);
      
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, currentY, contentWidth, 8, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ANÁLISE E RECOMENDAÇÕES', margin + 5, currentY + 5);
      
      currentY += 15;
      
      // Observações
      pdf.setFillColor(239, 246, 255);
      pdf.rect(margin, currentY, contentWidth, 25, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Observações do Período:', margin + 5, currentY + 5);
      
      currentY += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      
      const observacoes = [
        `• Duração do acompanhamento: ${stats.periodoMonitoramento} dias com ${stats.totalAvaliacoes} avaliações realizadas.`,
        `• Frequência de avaliações: ${(stats.totalAvaliacoes / Math.max(1, Math.ceil(stats.periodoMonitoramento / 30))).toFixed(1)} avaliações por mês.`
      ];
      
      if (stats.variacaoPeso !== 0) {
        observacoes.push(`• Tendência de peso: ${stats.variacaoPeso > 0 ? 'Ganho' : 'Perda'} de ${Math.abs(stats.variacaoPeso).toFixed(1)} kg no período.`);
      }
      
      if (stats.variacaoGordura !== 0) {
        observacoes.push(`• Composição corporal: ${stats.variacaoGordura > 0 ? 'Aumento' : 'Redução'} de ${Math.abs(stats.variacaoGordura).toFixed(1)}% na gordura corporal.`);
      }
      
      if (avaliacoesComFotos.length > 0) {
        observacoes.push(`• Registro fotográfico: ${avaliacoesComFotos.length} avaliações com fotos para acompanhamento visual da evolução.`);
      }
      
      observacoes.forEach(obs => {
        const lines = pdf.splitTextToSize(obs, contentWidth - 10);
        lines.forEach(line => {
          pdf.text(line, margin + 5, currentY);
          currentY += 4;
        });
      });
      
      currentY += 5;
      
      // Recomendações
      pdf.setFillColor(240, 253, 244);
      pdf.rect(margin, currentY, contentWidth, 20, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recomendações:', margin + 5, currentY + 5);
      
      currentY += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      
      const recomendacoes = [
        '• Manter regularidade nas avaliações para acompanhamento preciso da evolução.',
        '• Considerar fatores externos que podem influenciar os resultados (hidratação, horário, etc.).',
        '• Ajustar estratégias de treinamento e nutrição baseadas nos dados coletados.',
        '• Documentar observações específicas a cada avaliação para melhor contexto dos resultados.',
        '• Manter padronização na captura das fotos (iluminação, posição, roupas) para melhor comparação.'
      ];
      
      recomendacoes.forEach(rec => {
        const lines = pdf.splitTextToSize(rec, contentWidth - 10);
        lines.forEach(line => {
          checkPageBreak(4);
          pdf.text(line, margin + 5, currentY);
          currentY += 4;
        });
      });
    }

    // RODAPÉ
    currentY = pageHeight - 30;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    
    currentY += 5;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120);
    
    pdf.text('Relatório gerado automaticamente pelo Sistema de Avaliação Física', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    pdf.text(`Data de geração: ${formatDate(new Date())} | Profissional responsável: Administrador`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    pdf.text('Este relatório contém informações confidenciais e deve ser tratado com sigilo profissional.', pageWidth / 2, currentY, { align: 'center' });

    // Salvar o PDF
    const fileName = `relatorio_evolucao_${aluno.nome.replace(/\s+/g, '_')}_${formatDate(new Date()).replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);
    
    return true;
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};

export const generateChartPDF = async (chartElement, aluno, chartTitle) => {
  try {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true
    });
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    
    // Adicionar título
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${chartTitle} - ${aluno.nome}`, pageWidth / 2, margin + 10, { align: 'center' });
    
    // Adicionar gráfico
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', margin, margin + 20, imgWidth, imgHeight);
    
    // Salvar
    const fileName = `grafico_${chartTitle.toLowerCase().replace(/\s+/g, '_')}_${aluno.nome.replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF do gráfico:', error);
    throw error;
  }
}; 