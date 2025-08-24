export const PAYADMIT_CONFIG = {
  // URL для загрузки hosted fields из базового SDK
  HOSTED_FIELDS_URL: 'https://card-fields.paymentiq.io/1.0.51/index.html',

  // Базовый URL API бэкенда PayAdmit
  API_BASE_URL: 'https://api.payadmit.com', // Для продакшена
  // API_BASE_URL: 'https://api.staging.payadmit.com', // Для тестового стенда

  // Название сервиса для платежного метода (если требуется базовым SDK)
  SERVICE: 'payadmit_card_service',

  // Таймаут для операций (опционально)
  TIMEOUT: 30000 // 30 секунд
};

export const DEFAULT_STYLES = `
  .hosted-input-container .input-container input {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 12px;
    font-size: 16px;
    width: 100%;
    box-sizing: border-box;
  }
  
  .hosted-input-container .input-container input:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
  
  .hosted-input-container .error-message {
    color: #dc3545;
    font-size: 14px;
    margin-top: 4px;
  }
`;