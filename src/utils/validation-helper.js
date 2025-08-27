/**
 * Утилиты для валидации полей формы оплаты
 */

export class ValidationHelper {
  /**
   * Валидация имени держателя карты
   * @param {string} name - имя держателя карты
   * @returns {Object} результат валидации
   */
  static validateCardholderName(name) {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: 'Name is required' };
    }
    
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return { isValid: false, error: 'Name must be at least 2 characters' };
    }
    
    if (trimmedName.length > 50) {
      return { isValid: false, error: 'Name is too long' };
    }
    
    // Проверяем, что имя содержит только буквы, пробелы и дефисы
    if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
      return { isValid: false, error: 'Name contains invalid characters' };
    }
    
    return { isValid: true, error: null };
  }

  /**
   * Валидация номера карты (базовая проверка)
   * @param {string} encryptedCardNumber - зашифрованный номер карты
   * @returns {Object} результат валидации
   */
  static validateCardNumber(encryptedCardNumber) {
    if (!encryptedCardNumber) {
      return { isValid: false, error: 'Card number is required' };
    }
    
    if (encryptedCardNumber.startsWith('ERROR')) {
      return { isValid: false, error: 'Invalid card number' };
    }
    
    // Проверяем, что это зашифрованное значение (должно быть достаточно длинным)
    if (encryptedCardNumber.length < 10) {
      return { isValid: false, error: 'Invalid card number format' };
    }
    
    return { isValid: true, error: null };
  }

  /**
   * Валидация CVV (базовая проверка)
   * @param {string} encryptedCvv - зашифрованный CVV
   * @returns {Object} результат валидации
   */
  static validateCvv(encryptedCvv) {
    if (!encryptedCvv) {
      return { isValid: false, error: 'CVV is required' };
    }
    
    if (encryptedCvv.startsWith('ERROR')) {
      return { isValid: false, error: 'Invalid CVV' };
    }
    
    // Проверяем, что это зашифрованное значение
    if (encryptedCvv.length < 5) {
      return { isValid: false, error: 'Invalid CVV format' };
    }
    
    return { isValid: true, error: null };
  }

  /**
   * Валидация даты истечения карты
   * @param {string} expiryDate - дата в формате MM/YY
   * @returns {Object} результат валидации
   */
  static validateExpiryDate(expiryDate) {
    if (!expiryDate) {
      return { isValid: false, error: 'Expiry date is required' };
    }
    
    // Проверяем формат MM/YY
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return { isValid: false, error: 'Invalid date format (use MM/YY)' };
    }
    
    const [month, year] = expiryDate.split('/');
    const expMonth = parseInt(month, 10);
    const expYear = parseInt(year, 10);
    
    // Проверяем месяц
    if (expMonth < 1 || expMonth > 12) {
      return { isValid: false, error: 'Invalid month (must be 01-12)' };
    }
    
    // Проверяем год
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Последние 2 цифры
    const currentMonth = currentDate.getMonth() + 1; // getMonth() возвращает 0-11
    
    if (expYear < currentYear) {
      return { isValid: false, error: 'Card has expired' };
    }
    
    if (expYear === currentYear && expMonth < currentMonth) {
      return { isValid: false, error: 'Card has expired' };
    }
    
    // Проверяем, что карта не истекает слишком далеко в будущем (например, через 20 лет)
    if (expYear > currentYear + 20) {
      return { isValid: false, error: 'Expiry date is too far in the future' };
    }
    
    return { isValid: true, error: null };
  }

  /**
   * Валидация всех полей формы
   * @param {Object} formData - данные формы
   * @returns {Object} результат валидации
   */
  static validateAllFields(formData) {
    const results = {
      cardholderName: this.validateCardholderName(formData.cardholderName),
      cardNumber: this.validateCardNumber(formData.encCreditcardNumber),
      cvv: this.validateCvv(formData.encCvv),
      expiryDate: this.validateExpiryDate(formData.expiryDate)
    };
    
    const isValid = Object.values(results).every(result => result.isValid);
    const errors = Object.values(results)
      .filter(result => !result.isValid)
      .map(result => result.error);
    
    return {
      isValid,
      errors,
      fieldResults: results
    };
  }

  /**
   * Проверка алгоритма Луна для номера карты
   * @param {string} cardNumber - номер карты (только для тестирования)
   * @returns {boolean} результат проверки
   */
  static luhnCheck(cardNumber) {
    if (!cardNumber || typeof cardNumber !== 'string') {
      return false;
    }
    
    // Убираем все нецифровые символы
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return false;
    }
    
    let sum = 0;
    let isEven = false;
    
    // Идем справа налево
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i), 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  /**
   * Определение типа карты по номеру
   * @param {string} cardNumber - номер карты (только для тестирования)
   * @returns {string} тип карты
   */
  static getCardType(cardNumber) {
    if (!cardNumber) return 'unknown';
    
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    // Visa: начинается с 4
    if (/^4/.test(cleanNumber)) return 'visa';
    
    // Mastercard: начинается с 51-55 или 2221-2720
    if (/^5[1-5]/.test(cleanNumber) || /^2[2-7][2-9][0-9]/.test(cleanNumber)) return 'mastercard';
    
    // American Express: начинается с 34 или 37
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    
    // Discover: начинается с 6011, 622126-622925, 644-649, 65
    if (/^6(?:011|5|4[4-9]|22(?:1(?:2[6-9]|[3-9]\d)|[2-8]\d\d|9(?:[01]\d|2[0-5])))/.test(cleanNumber)) return 'discover';
    
    return 'unknown';
  }
}

export default ValidationHelper;
