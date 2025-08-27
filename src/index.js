import { HostedFields, Field, FieldTypes } from 'hosted-fields-sdk';
import { PAYADMIT_CONFIG, DEFAULT_STYLES } from "./config.js";
import { pemToArrayBuffer, u8ToB64 } from './utils/crypto-helper.js';

class PayAdmitHostedFields {
  static init(config) {
    console.log("init config" , config)
    const fieldConfig = [
      {
        type: FieldTypes.TEXT,
        id: 'cardholder-name',
        name: 'cardholder-name',
        label: 'Cardholder name',
        error: 'Cardholder',
        helpKey: 'Invalid Cardholder name',
        visible: true,
        required: true
      },
      {
        type: FieldTypes.CREDITCARD_NUMBER,
        id: 'card-number',
        name: 'cardNumber',
        label: 'Card Number',
        error: 'Credit card',
        helpKey: 'Invalid Card Number',
        visible: true,
        required: true,
        noAttributeValueFormatting: true,
        autocomplete: 'cc-number'
      },
      {
        type: FieldTypes.EXPIRY_MM_YYYY,
        id: 'expiry-date',
        name: 'expiryDate',
        label: 'MM/YY',
        error: 'Invalid Expiry Date',
        visible: true,
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
        visible: true,
        required: true,
        noAttributeValueFormatting: true,
        autocomplete: 'cc-csc'

        // type: FieldTypes.CVV,
        // id: 'cvv',
        // name: 'cvv',
        // label: 'CVV',
        // error: 'CVV not valid',
        // helpKey: 'CVV',
        // visible: true,
        // required: true,
        // noAttributeValueFormatting: true,
        // autocomplete: 'cc-csc'
      }
    ];

    const fields = fieldConfig.map(conf => new Field(...Object.values(conf)));

    HostedFields.setup({
      merchantId: config.merchantId,
      hostedfieldsurl: PAYADMIT_CONFIG.HOSTED_FIELDS_URL,
      fields: fields,
      styles: DEFAULT_STYLES + (config.customStyles || ''),
      renderMode: 'multiple',
      autoFocusNext: true,
      onTokenizeSuccess: config.onTokenizeSuccess,
      callback: () => {
        return (data, errors) => {
          console.log("callback p1", data)
          console.log("callback p2", errors)
          // if (!PayAdmitHostedFields._validateCardNumber(data.cardNumber)) {
          //   config.onError?.(new Error("Invalid card number (Luhn check failed)"));
          //   return;
          // }

          return PayAdmitHostedFields._handleCallback(
            data,
            config.onTokenizeSuccess,
            config.onError
          );
        };
      },
      onLoadCallback: config.onLoad,
      // onLoadCallback: () => {
      //   const fields = document.querySelectorAll('iframe');
      //   fields.forEach((f) => {
      //     f.contentWindow.addEventListener('input', (e) => {
      //      console.log('input')
      //     })
      //   })
      // },
      el: config.containerId
    });

    return {
      tokenize: () => HostedFields.get(),
      reset: () => HostedFields.reset()
    };
  }

  static _validateCardNumber(value) {
    if (!value) return false;

    let check = 0;
    let even = false;

    for (let n = value.length - 1; n >= 0; n--) {
      let digit = parseInt(value.charAt(n), 10);

      if (even) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      check += digit;
      even = !even;
    }

    return (check % 10 === 0);
  }


  static async _handleCallback(formData, onSuccess, onError) {

    console.log('formData!!!!', formData);
    try {
      // --- TODO VALIDATION ---
      if (formData?.encCreditcardNumber?.startsWith('ERROR') || formData?.encCvv?.startsWith('ERROR')) {
        throw new Error('Validation failed');
      }

      let options = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        method: "POST",
      };
        // --- 1. TODO Get keys from backend ---
        // const r = await fetch(`${PAYADMIT_CONFIG.API_BASE_URL}/hpf/session`, options);
        // const { kid, publicKeyPem, sessionId } = await r.json();

      const kid = "test kid";
      const publicKeyPem = `-----BEGIN PUBLIC KEY-----
                                  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwU3R5F0G1lFi0aZ4fF2p
                                  8G0lIDcA7j3bKpMP7p7O2nqz1J1Jb+yeVJ5I7ZB5WjJY9q1eYjYQYejg5M+Y3YqJ
                                  0hCzsmq7QJm3s4vHjh8Tq+6cwY8uO+Kv+Uu5o1tGmU4rQ1JvG9xwZh2+3khT8FhY
                                  E8wJz0L9Bq6qG4Z2FtF6jXHptq1xhWxJx1g9xFf8pXsSm/xbIvFmJQYwqD3L1mRW
                                  pU3SngP8wGgJoG+3nSExsQ4/GrU4l5Oej7MRRmC7v7GjZxkO+IKP94Wkbk3FhVkL
                                  zBjhWwQGfG/dm8iG7i1fVZ7wbl9a0tP2cDxF7hT2Wmnq2Eyj7e2w1aHkH1m0qx3t
                                  AwIDAQAB
                            -----END PUBLIC KEY-----`;
      const sessionId = "testSession123";

      const publicKey = await crypto.subtle.importKey(
        'spki',
        pemToArrayBuffer(publicKeyPem),
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['wrapKey', 'encrypt']
      );

        // --- 2. Generate AES-key ---
        const aesKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'wrapKey']
        );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const aad = new TextEncoder().encode(sessionId + '|' + location.origin);

      const payload = JSON.stringify({
        pan: formData.encCreditcardNumber,
        cvv: formData.encCvv,
        exp: formData.expiryDate,
        cardholderName: formData.cardholderName
      });

      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: aad },
        aesKey,
        new TextEncoder().encode(payload)
      );

      const wrappedKey = await crypto.subtle.wrapKey('raw', aesKey, publicKey, { name: 'RSA-OAEP' });

      // --- 3.Tokenize ---
      const body = {
        kid,
        iv: u8ToB64(iv),
        wrappedKey: u8ToB64(new Uint8Array(wrappedKey)),
        cipherText: u8ToB64(new Uint8Array(ciphertext)),
        sessionId
      };

      const res = await fetch(`${PAYADMIT_CONFIG.API_BASE_URL}/hpf/tokenize`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: "application/json",
          'Content-Type': 'application/json',
          Authorization: `Bearer ${PAYADMIT_CONFIG.PAYADMIT_TOKEN}`
        },
        body: JSON.stringify(body)
      });

      const tokenData = await res.json();
      onSuccess?.({ token: tokenData.result.token });

      // onSuccess({ token: tokenData.token, mask: tokenData.mask });

    } catch (error) {
      onError(error);
    }
  }
}

export { PayAdmitHostedFields };