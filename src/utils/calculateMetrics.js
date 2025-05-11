/**
 * Calcula o IMC (Índice de Massa Corporal)
 * @param {number} peso - Peso em kg
 * @param {number} altura - Altura em cm
 * @returns {number} IMC calculado com duas casas decimais
 */
export function calcularIMC(peso, altura) {
    if (!peso || !altura) return null;
    
    // Altura em metros (converter de cm para m)
    const alturaMetros = altura / 100;
    
    // Fórmula do IMC: peso / (altura * altura)
    const imc = peso / (alturaMetros * alturaMetros);
    
    return parseFloat(imc.toFixed(2));
  }
  
  /**
   * Classifica o IMC conforme padrões da OMS
   * @param {number} imc - Valor do IMC calculado
   * @returns {string} Classificação do IMC
   */
  export function classificarIMC(imc) {
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
  
  /**
   * Calcula a massa magra com base no peso e percentual de gordura
   * @param {number} peso - Peso em kg
   * @param {number} percentualGordura - Percentual de gordura
   * @returns {number} Massa magra em kg
   */
  export function calcularMassaMagra(peso, percentualGordura) {
    if (!peso || percentualGordura === undefined || percentualGordura === null) return null;
    
    const massaMagra = peso * (1 - (percentualGordura / 100));
    
    return parseFloat(massaMagra.toFixed(2));
  }
  
  /**
   * Calcula a massa gorda com base no peso e percentual de gordura
   * @param {number} peso - Peso em kg
   * @param {number} percentualGordura - Percentual de gordura
   * @returns {number} Massa gorda em kg
   */
  export function calcularMassaGorda(peso, percentualGordura) {
    if (!peso || percentualGordura === undefined || percentualGordura === null) return null;
    
    const massaGorda = peso * (percentualGordura / 100);
    
    return parseFloat(massaGorda.toFixed(2));
  }
  
  /**
   * Calcula a Taxa Metabólica Basal usando a fórmula de Harris-Benedict
   * @param {number} peso - Peso em kg
   * @param {number} altura - Altura em cm
   * @param {number} idade - Idade em anos
   * @param {string} sexo - 'M' para masculino, 'F' para feminino
   * @returns {number} Taxa Metabólica Basal em kcal
   */
  export function calcularTMB(peso, altura, idade, sexo) {
    if (!peso || !altura || !idade || !sexo) return null;
    
    let tmb;
    
    if (sexo.toUpperCase() === 'M') {
      // Fórmula para homens
      tmb = 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * idade);
    } else {
      // Fórmula para mulheres
      tmb = 447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * idade);
    }
    
    return Math.round(tmb);
  }
  
  /**
   * Calcula o percentual de gordura pelo método de 7 dobras cutâneas
   * @param {Object} dobras - Objeto com as 7 dobras (em mm)
   * @param {number} idade - Idade em anos
   * @param {string} sexo - 'M' para masculino, 'F' para feminino
   * @returns {number} Percentual de gordura
   */
  export function calcularPercentualGordura7Dobras(dobras, idade, sexo) {
    if (!dobras || !idade || !sexo) return null;
    
    // Soma das 7 dobras
    const somaDobras = 
      (dobras.tricipital || 0) +
      (dobras.subescapular || 0) +
      (dobras.peitoral || 0) +
      (dobras.axilarMedia || 0) +
      (dobras.suprailiaca || 0) +
      (dobras.abdominal || 0) +
      (dobras.coxa || 0);
    
    // Densidade corporal
    let densidadeCorporal;
    
    if (sexo.toUpperCase() === 'M') {
      // Fórmula para homens (Jackson & Pollock)
      densidadeCorporal = 1.112 - (0.00043499 * somaDobras) + (0.00000055 * somaDobras * somaDobras) - (0.00028826 * idade);
    } else {
      // Fórmula para mulheres (Jackson, Pollock & Ward)
      densidadeCorporal = 1.097 - (0.00046971 * somaDobras) + (0.00000056 * somaDobras * somaDobras) - (0.00012828 * idade);
    }
    
    // Percentual de gordura pela fórmula de Siri
    const percentualGordura = ((4.95 / densidadeCorporal) - 4.5) * 100;
    
    return parseFloat(percentualGordura.toFixed(2));
  }
  
  /**
   * Calcula o percentual de gordura pelo método de 3 dobras cutâneas
   * @param {Object} dobras - Objeto com as dobras necessárias (em mm)
   * @param {number} idade - Idade em anos
   * @param {string} sexo - 'M' para masculino, 'F' para feminino
   * @returns {number} Percentual de gordura
   */
  export function calcularPercentualGordura3Dobras(dobras, idade, sexo) {
    if (!dobras || !idade || !sexo) return null;
    
    let somaDobras;
    let densidadeCorporal;
    
    if (sexo.toUpperCase() === 'M') {
      // Para homens: peitoral, abdominal e coxa
      somaDobras = (dobras.peitoral || 0) + (dobras.abdominal || 0) + (dobras.coxa || 0);
      densidadeCorporal = 1.10938 - (0.0008267 * somaDobras) + (0.0000016 * somaDobras * somaDobras) - (0.0002574 * idade);
    } else {
      // Para mulheres: tricipital, suprailiaca e coxa
      somaDobras = (dobras.tricipital || 0) + (dobras.suprailiaca || 0) + (dobras.coxa || 0);
      densidadeCorporal = 1.099421 - (0.0009929 * somaDobras) + (0.0000023 * somaDobras * somaDobras) - (0.0001392 * idade);
    }
    
    // Percentual de gordura pela fórmula de Siri
    const percentualGordura = ((4.95 / densidadeCorporal) - 4.5) * 100;
    
    return parseFloat(percentualGordura.toFixed(2));
  }
  
  /**
   * Calcula o percentual de gordura baseado em circunferências (Fórmula Navy)
   * @param {Object} circ - Objeto com as circunferências (em cm)
   * @param {number} altura - Altura em cm
   * @param {string} sexo - 'M' para masculino, 'F' para feminino
   * @returns {number} Percentual de gordura
   */
  export function calcularPercentualGorduraNavy(circ, altura, sexo) {
    if (!circ || !altura || !sexo) return null;
    
    let percentualGordura;
    
    if (sexo.toUpperCase() === 'M') {
      // Para homens: cintura, pescoço, altura
      const cintura = circ.cintura || 0;
      const pescoco = circ.pescoco || 0;
      
      percentualGordura = 495 / (1.0324 - 0.19077 * Math.log10(cintura - pescoco) + 0.15456 * Math.log10(altura)) - 450;
    } else {
      // Para mulheres: cintura, quadril, pescoço, altura
      const cintura = circ.cintura || 0;
      const quadril = circ.quadril || 0;
      const pescoco = circ.pescoco || 0;
      
      percentualGordura = 495 / (1.29579 - 0.35004 * Math.log10(cintura + quadril - pescoco) + 0.22100 * Math.log10(altura)) - 450;
    }
    
    return parseFloat(percentualGordura.toFixed(2));
  }