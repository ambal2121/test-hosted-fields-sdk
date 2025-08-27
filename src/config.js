export const PAYADMIT_CONFIG = {
  // URL to load hosted fields from base SDK
  HOSTED_FIELDS_URL: 'https://card-fields.paymentiq.io/1.0.51/index.html',
  // HOSTED_FIELDS_URL: 'https://test-hostedpages.paymentiq.io/1.0.31/index.html',

  // Base backend PayAdmit API URL
  API_BASE_URL: 'http://localhost:8090/api/v1',

  PAYADMIT_TOKEN: 'hfy5cKO1pt0Qsa6Cb31DqjJSCuX1p04g',

  SERVICE: 'payadmit_card_service',

  // Timeout
  TIMEOUT: 30000 // 30s
};

export const DEFAULT_STYLES = `
  .hosted-input-container .error-message {
    color: #dc3545;
    font-size: 14px;
    margin-top: 4px;
  }

  #cvv-input {
    font-family: "text-security-disc";
    -webkit-text-security: disc;
  }
`;