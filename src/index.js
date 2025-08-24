import { HostedFields, Field, FieldTypes } from 'hosted-fields-sdk';
// import { PAYADMIT_CONFIG, DEFAULT_STYLES } from './config.js';
// import { enhanceEncryption } from './utils/encryption-helper.js';



class PayAdmitHostedFields {
  static init(config) {
    const fieldConfig = [
      {
        type: FieldTypes.TEXT,
        id: 'cardholder-name',
        name: 'cardholder-name',
        label: 'Cardholder Name',
        error: 'Invalid Cardholder Name',
        required: true,
        noAttributeValueFormatting: true,
        autocomplete: 'cc-name'
      },
      {
        type: FieldTypes.CREDITCARD_NUMBER,
        id: 'card-number',
        name: 'card-number',
        label: 'Card Number',
        error: 'Invalid Card Number',
        required: true,
        noAttributeValueFormatting: true,
        autocomplete: 'cc-number'
      },
      {
        type: FieldTypes.EXPIRY_MM_YYYY,
        id: 'expiry-date',
        name: 'expiry-date',
        label: 'MM/YY',
        error: 'Invalid Expiry Date',
        required: true,
        noAttributeValueFormatting: true,
        autocomplete: 'cc-exp'
      },
      {
        type: FieldTypes.CVV,
        id: 'cvv',
        name: 'cvv',
        label: 'CVV',
        error: 'Invalid CVV',
        required: true,
        noAttributeValueFormatting: true,
        autocomplete: 'cc-csc'
      }
    ];

    const fields = fieldConfig.map(conf => new Field(...Object.values(conf)));

    HostedFields.setup({
      merchantId: config.merchantId,
      hostedfieldsurl: PAYADMIT_CONFIG.HOSTED_FIELDS_URL, // Наш URL!
      fields: fields,
      styles: DEFAULT_STYLES + (config.customStyles || ''), // Наши стили + кастомные от мерчанта
      renderMode: 'multiple',
      autoFocusNext: true,
      callback: (data) => this._handleCallback(data, config.onTokenizeSuccess, config.onError),
      onLoadCallback: config.onLoad,
      el: config.containerId
    });

    return {
      tokenize: () => HostedFields.get(),
      reset: () => HostedFields.reset()
    };
  }

  static async _handleCallback(formData, onSuccess, onError) {
    // Это сердце логики!
    try {
      // 1. Проверяем ошибки валидации из общих полей
      if (formData.encCreditcardNumber?.startsWith('ERROR') || formData.encCvv?.startsWith('ERROR')) {
        throw new Error('Validation failed');
      }

      // 2. (ВАЖНО!) ДОПОЛНИТЕЛЬНОЕ ШИФРОВАНИЕ для PayAdmit.
      // Общий SDK уже зашифровал данные для своего бэкенда.
      // Нам нужно забрать эти зашифрованные данные и, возможно, зашифровать их ЕЩЕ РАЗ
      // по нашему алгоритму/с нашим ключом, который мы получим от бэкенда PayAdmit.
      const finalEncryptedData = await enhanceEncryption({
        encPan: formData.encCreditcardNumber,
        encCvv: formData.encCvv
      });

      // 3. Формируем данные для токенизации в формате PayAdmit
      const tokenizePayload = {
        operationType: 'TOKENIZE', // Ключевой момент!
        cardholderName: formData.cardHolder,
        expiryMonth: formData.expiryMonth,
        expiryYear: formData.expiryYear,
        ...finalEncryptedData // Добавляем перешифрованные pan и cvv
      };

      // 4. (Опционально, но лучше) Ваш пакет может САМ отправить запрос на /createPayment
      const response = await fetch(`${PAYADMIT_CONFIG.API_BASE_URL}/createPayment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenizePayload)
      });

      const tokenData = await response.json();
      // 5. Вызываем колбэк мерчанта с токеном
      onSuccess({ token: tokenData.token, mask: tokenData.mask });

    } catch (error) {
      onError(error);
    }
  }
}

export { PayAdmitHostedFields };