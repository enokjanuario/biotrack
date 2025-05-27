import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatDate } from './formatDate';

/**
 * Exporta uma avaliação física para PDF
 * @param {Object} avaliacao - Dados da avaliação
 * @param {Object} aluno - Dados do aluno
 * @returns {jsPDF} Documento PDF
 */
export function exportarAvaliacaoPDF(avaliacao, aluno) {
  // Criar novo documento PDF
  const doc = new jsPDF();
  
  // Adicionar logo e título
  // doc.addImage(logoBase64, 'PNG', 10, 10, 50, 25);
  doc.setFontSize(22);
  doc.setTextColor(41, 75, 163);
  doc.text('Avaliação Física', 105, 20, { align: 'center' });
  
  // Adicionar informações do aluno
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Aluno: ${aluno.nome}`, 14, 40);
  doc.text(`Data: ${formatDate(avaliacao.dataAvaliacao.toDate())}`, 14, 48);
  
  if (aluno.idade) {
    doc.text(`Idade: ${aluno.idade} anos`, 14, 56);
  }
  
  if (aluno.objetivo) {
    doc.text(`Objetivo: ${aluno.objetivo}`, 14, 64);
  }
  
  // Adicionar linha divisória
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 70, 196, 70);
  
  // Tabela de Composição Corporal
  doc.setFontSize(16);
  doc.setTextColor(41, 75, 163);
  doc.text('Composição Corporal', 14, 80);
  
  const composicaoData = [
    ['Métrica', 'Valor', 'Classificação'],
    ['Peso', `${avaliacao.peso} kg`, ''],
    ['Altura', `${avaliacao.altura} cm`, ''],
    ['IMC', avaliacao.imc, classificarIMC(avaliacao.imc)],
    ['% Gordura', `${avaliacao.percentualGordura}%`, classificarPercentualGordura(avaliacao.percentualGordura, aluno.sexo)],
    ['Massa Magra', `${avaliacao.massaMagra} kg`, ''],
    ['Massa Gorda', `${avaliacao.massaGorda} kg`, '']
  ];
  
  doc.autoTable({
    startY: 85,
    head: [['Métrica', 'Valor', 'Classificação']],
    body: composicaoData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [41, 75, 163] },
    styles: { fontSize: 10 }
  });
  
  // Verificar se há circunferências para adicionar
  if (avaliacao.circunferencias && Object.keys(avaliacao.circunferencias).length > 0) {
    let currentY = doc.autoTable.previous.finalY + 15;
    
    doc.setFontSize(16);
    doc.setTextColor(41, 75, 163);
    doc.text('Circunferências', 14, currentY);
    
    const circunferenciasData = Object.entries(avaliacao.circunferencias).map(([key, value]) => {
      return [key.replace(/([A-Z])/g, ' $1').trim(), `${value} cm`];
    });
    
    doc.autoTable({
      startY: currentY + 5,
      head: [['Medida', 'Valor']],
      body: circunferenciasData,
      theme: 'striped',
      headStyles: { fillColor: [41, 75, 163] },
      styles: { fontSize: 10 }
    });
  }
  
  // Verificar se há testes físicos para adicionar
  if (avaliacao.testes && Object.keys(avaliacao.testes).length > 0) {
    let currentY = doc.autoTable.previous.finalY + 15;
    
    doc.setFontSize(16);
    doc.setTextColor(41, 75, 163);
    doc.text('Testes Físicos', 14, currentY);
    
    const testesData = Object.entries(avaliacao.testes).map(([key, value]) => {
      return [key.replace(/([A-Z])/g, ' $1').trim(), value];
    });
    
    doc.autoTable({
      startY: currentY + 5,
      head: [['Teste', 'Resultado']],
      body: testesData,
      theme: 'striped',
      headStyles: { fillColor: [41, 75, 163] },
      styles: { fontSize: 10 }
    });
  }
  
  // Verificar se há observações para adicionar
  if (avaliacao.observacoes) {
    let currentY = doc.autoTable.previous.finalY + 15;
    
    // Verificar se é necessário adicionar uma nova página
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(41, 75, 163);
    doc.text('Observações', 14, currentY);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const splitObservacoes = doc.splitTextToSize(avaliacao.observacoes, 180);
    doc.text(splitObservacoes, 14, currentY + 10);
  }
  
  // Rodapé
  const totalPagesExp = '{total_pages_count_string}';
  const pageCount = doc.internal.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      `Avaliação gerada em ${formatDate(new Date())}`,
      doc.internal.pageSize.width - 14,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }
  
  return doc;
}

/**
 * Exporta uma lista de avaliações para PDF
 * @param {Array} avaliacoes - Lista de avaliações
 * @param {Object} aluno - Dados do aluno
 * @returns {jsPDF} Documento PDF
 */
export function exportarHistoricoPDF(avaliacoes, aluno) {
  // Criar novo documento PDF
  const doc = new jsPDF();
  
  // Adicionar logo e título
  // doc.addImage(logoBase64, 'PNG', 10, 10, 50, 25);
  doc.setFontSize(22);
  doc.setTextColor(41, 75, 163);
  doc.text('Histórico de Avaliações', 105, 20, { align: 'center' });
  
  // Adicionar informações do aluno
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Aluno: ${aluno.nome}`, 14, 40);
  doc.text(`Relatório gerado em: ${formatDate(new Date())}`, 14, 48);
  
  // Adicionar linha divisória
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 55, 196, 55);
  
  // Dados para a tabela principal
  const tableData = avaliacoes.map(av => {
    return [
      formatDate(av.dataAvaliacao.toDate()),
      `${av.peso} kg`,
      `${av.percentualGordura}%`,
      av.imc,
      av.avaliador || '-'
    ];
  });
  
  // Tabela de histórico
  doc.setFontSize(16);
  doc.setTextColor(41, 75, 163);
  doc.text('Resumo das Avaliações', 14, 65);
  
  doc.autoTable({
    startY: 70,
    head: [['Data', 'Peso', '% Gordura', 'IMC', 'Avaliador']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 75, 163] },
    styles: { fontSize: 10 }
  });
  
  // Gráfico de evolução (texto explicativo)
  if (avaliacoes.length > 1) {
    let currentY = doc.autoTable.previous.finalY + 15;
    
    // Verificar se é necessário adicionar uma nova página
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(41, 75, 163);
    doc.text('Análise de Evolução', 14, currentY);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Calcular diferenças entre primeira e última avaliação
    const primeira = avaliacoes[avaliacoes.length - 1]; // Mais antiga
    const ultima = avaliacoes[0]; // Mais recente
    
    const diffPeso = (ultima.peso - primeira.peso).toFixed(2);
    const diffGordura = (ultima.percentualGordura - primeira.percentualGordura).toFixed(2);
    
    const evolucaoTexto = `Período analisado: ${formatDate(primeira.dataAvaliacao.toDate())} a ${formatDate(ultima.dataAvaliacao.toDate())}\n\n` +
      `Variação de Peso: ${diffPeso > 0 ? '+' : ''}${diffPeso} kg\n` +
      `Variação de % Gordura: ${diffGordura > 0 ? '+' : ''}${diffGordura}%\n`;
    
    doc.text(evolucaoTexto, 14, currentY + 10);
  }
  
  // Rodapé
  const pageCount = doc.internal.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      `Relatório gerado em ${formatDate(new Date())}`,
      doc.internal.pageSize.width - 14,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }
  
  return doc;
}

/**
 * Classifica o percentual de gordura conforme padrões
 * @param {number} percentual - Percentual de gordura
 * @param {string} sexo - 'M' para masculino, 'F' para feminino
 * @returns {string} Classificação do percentual de gordura
 */
function classificarPercentualGordura(percentual, sexo) {
  if (!percentual || !sexo) return '';
  
  if (sexo.toUpperCase() === 'M') {
    // Classificação para homens
    if (percentual < 6) return 'Atlético / Essencial';
    if (percentual < 14) return 'Fitness / Bom';
    if (percentual < 18) return 'Aceitável';
    if (percentual < 25) return 'Sobrepeso';
    return 'Obesidade';
  } else {
    // Classificação para mulheres
    if (percentual < 13) return 'Atlético / Essencial';
    if (percentual < 21) return 'Fitness / Bom';
    if (percentual < 25) return 'Aceitável';
    if (percentual < 32) return 'Sobrepeso';
    return 'Obesidade';
  }
}

/**
 * Classifica o IMC conforme padrões da OMS
 * @param {number} imc - Valor do IMC
 * @returns {string} Classificação do IMC
 */
function classificarIMC(imc) {
  if (!imc) return '';
  
  if (imc < 18.5) {
    return 'Abaixo do Peso';
  } else if (imc < 25) {
    return 'Peso Normal';
  } else if (imc < 30) {
    return 'Sobrepeso';
  } else if (imc < 35) {
    return 'Obesidade Grau I';
  } else if (imc < 40) {
    return 'Obesidade Grau II';
  } else {
    return 'Obesidade Grau III';
  }
}
