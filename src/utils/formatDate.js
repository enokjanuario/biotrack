/**
 * Formata uma data para o formato DD/MM/YYYY
 * @param {Date} date - Objeto Date para formatar
 * @returns {string} Data formatada
 */
export function formatDate(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) {
      return '';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
  
  /**
   * Formata uma data para o formato YYYY-MM-DD (formato para inputs do tipo date)
   * @param {Date} date - Objeto Date para formatar
   * @returns {string} Data formatada
   */
  export function formatDateForInput(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) {
      return '';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Calcula a diferença em dias entre duas datas
   * @param {Date} date1 - Primeira data
   * @param {Date} date2 - Segunda data
   * @returns {number} Diferença em dias
   */
  export function dateDiffInDays(date1, date2) {
    if (!date1 || !date2 || !(date1 instanceof Date) || !(date2 instanceof Date)) {
      return null;
    }
    
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    
    return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Formata uma data para exibir há quanto tempo ela ocorreu
   * @param {Date} date - Data para formatar
   * @returns {string} Texto relativo (ex: "há 2 dias")
   */
  export function timeAgo(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) {
      return '';
    }
    
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return interval === 1 ? 'há 1 ano' : `há ${interval} anos`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return interval === 1 ? 'há 1 mês' : `há ${interval} meses`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return interval === 1 ? 'há 1 dia' : `há ${interval} dias`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return interval === 1 ? 'há 1 hora' : `há ${interval} horas`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return interval === 1 ? 'há 1 minuto' : `há ${interval} minutos`;
    }
    
    return 'há alguns segundos';
  }
