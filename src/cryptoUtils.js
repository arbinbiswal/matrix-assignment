const crypto = require('crypto');

function hashValue(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function deriveKey(key) {
  // Derive a 32-byte key from the provided key using SHA-256
  return crypto.createHash('sha256').update(key).digest();
}

function encryptValue(text, key) {
  const iv = crypto.randomBytes(16);
  const derivedKey = deriveKey(key);
  const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptValue(encryptedWithIv, key) {
  const parts = encryptedWithIv.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const derivedKey = deriveKey(key);
  const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { hashValue, encryptValue, decryptValue };
