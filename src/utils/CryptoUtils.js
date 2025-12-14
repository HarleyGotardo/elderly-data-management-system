const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class CryptoUtils {
  constructor() {
    // Default encryption key - in production, this should be stored securely
    // and potentially derived from user credentials or system configuration
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.tagLength = 16; // 128 bits
    this.saltLength = 32;
    
    // Initialize with a default key - in production, load from secure storage
    this.masterKey = this.generateOrLoadKey();
  }

  /**
   * Generate or load encryption key
   */
  generateOrLoadKey() {
    const keyPath = path.join(process.env.APPDATA || process.env.HOME || '.', '.edms_key');
    
    try {
      // Try to load existing key
      if (fs.existsSync(keyPath)) {
        const keyData = fs.readFileSync(keyPath, 'utf8');
        return Buffer.from(keyData, 'hex');
      }
    } catch (error) {
      console.warn('Could not load encryption key, generating new one');
    }
    
    // Generate new key
    const key = crypto.randomBytes(this.keyLength);
    
    try {
      // Save key for future use
      fs.writeFileSync(keyPath, key.toString('hex'), { mode: 0o600 });
    } catch (error) {
      console.warn('Could not save encryption key to disk');
    }
    
    return key;
  }

  /**
   * Derive key from password using PBKDF2
   * @param {string} password - Password to derive from
   * @param {Buffer} salt - Salt for key derivation
   */
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha256');
  }

  /**
   * Encrypt data
   * @param {Object|string} data - Data to encrypt
   * @param {string} password - Optional password for encryption
   */
  encrypt(data, password = null) {
    try {
      // Convert data to JSON string if it's an object
      const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Generate random IV and salt
      const iv = crypto.randomBytes(this.ivLength);
      const salt = crypto.randomBytes(this.saltLength);
      
      // Derive key
      const key = password ? this.deriveKey(password, salt) : this.masterKey;
      
      // Create cipher
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from('EDMS-DATA', 'utf8'));
      
      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      // Combine all components
      const encryptedData = {
        algorithm: this.algorithm,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        data: encrypted,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      return encryptedData;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data
   * @param {Object} encryptedData - Encrypted data object
   * @param {string} password - Optional password for decryption
   */
  decrypt(encryptedData, password = null) {
    try {
      // Validate encrypted data structure
      if (!encryptedData || !encryptedData.data || !encryptedData.iv || !encryptedData.salt || !encryptedData.tag) {
        throw new Error('Invalid encrypted data format');
      }
      
      // Extract components
      const salt = Buffer.from(encryptedData.salt, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');
      
      // Derive key
      const key = password ? this.deriveKey(password, salt) : this.masterKey;
      
      // Create decipher
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAAD(Buffer.from('EDMS-DATA', 'utf8'));
      decipher.setAuthTag(tag);
      
      // Decrypt data
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Try to parse as JSON, return as string if fails
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data. Invalid password or corrupted data.');
    }
  }

  /**
   * Encrypt and save to file
   * @param {Object|string} data - Data to encrypt
   * @param {string} filePath - Path to save encrypted file
   * @param {string} password - Optional password
   */
  encryptToFile(data, filePath, password = null) {
    try {
      const encryptedData = this.encrypt(data, password);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write encrypted data to file
      fs.writeFileSync(filePath, JSON.stringify(encryptedData, null, 2));
      
      console.log(`Encrypted data saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error encrypting to file:', error);
      throw error;
    }
  }

  /**
   * Read and decrypt from file
   * @param {string} filePath - Path to encrypted file
   * @param {string} password - Optional password
   */
  decryptFromFile(filePath, password = null) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // Read encrypted data
      const fileData = fs.readFileSync(filePath, 'utf8');
      const encryptedData = JSON.parse(fileData);
      
      // Decrypt and return
      return this.decrypt(encryptedData, password);
    } catch (error) {
      console.error('Error decrypting from file:', error);
      throw error;
    }
  }

  /**
   * Generate a secure hash for data integrity verification
   * @param {Object|string} data - Data to hash
   */
  generateHash(data) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Verify data integrity with hash
   * @param {Object|string} data - Data to verify
   * @param {string} expectedHash - Expected hash
   */
  verifyHash(data, expectedHash) {
    const actualHash = this.generateHash(data);
    return actualHash === expectedHash;
  }

  /**
   * Generate a unique batch ID for sync operations
   */
  generateBatchId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = crypto.randomBytes(4).toString('hex');
    return `BATCH-${timestamp}-${random}`;
  }

  /**
   * Create a secure signature for sync packets
   * @param {Object} data - Data to sign
   */
  signData(data) {
    const dataString = JSON.stringify(data);
    return crypto.createHmac('sha256', this.masterKey).update(dataString).digest('hex');
  }

  /**
   * Verify signature of sync packets
   * @param {Object} data - Data to verify
   * @param {string} signature - Signature to verify against
   */
  verifySignature(data, signature) {
    const expectedSignature = this.signData(data);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

export default CryptoUtils;
