/**
 * Encryption utilities for sensitive data
 */
const CryptoJS = require('crypto-js');
const dotenv = require('dotenv');

dotenv.config();

// Get encryption key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-for-development-only';

/**
 * Encrypts sensitive data
 * @param {string} data - Data to encrypt
 * @returns {string} - Encrypted data
 */
const encrypt = (data) => {
  if (!data) return null;
  return CryptoJS.AES.encrypt(data.toString(), ENCRYPTION_KEY).toString();
};

/**
 * Decrypts encrypted data
 * @param {string} encryptedData - Data to decrypt
 * @returns {string} - Decrypted data
 */
const decrypt = (encryptedData) => {
  if (!encryptedData) return null;
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Hashes data (one-way encryption, cannot be decrypted)
 * @param {string} data - Data to hash
 * @returns {string} - Hashed data
 */
const hash = (data) => {
  if (!data) return null;
  return CryptoJS.SHA256(data.toString()).toString();
};

module.exports = {
  encrypt,
  decrypt,
  hash
};