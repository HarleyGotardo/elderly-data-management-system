class DuplicateDetectionService {
  constructor(db) {
    this.db = db;
    
    // Configuration for duplicate detection
    this.config = {
      nameSimilarityThreshold: 0.8,
      exactMatchWeight: 1.0,
      similarNameWeight: 0.7,
      birthdateWeight: 0.9,
      addressWeight: 0.5,
      minScoreForDuplicate: 0.7
    };
  }

  /**
   * Check for duplicates within the same LGU (local scope)
   * @param {Object} record - Record to check
   * @param {string} lguId - LGU ID
   */
  checkLocalDuplicates(record, lguId) {
    const stmt = this.db.prepare(`
      SELECT id, osca_id, last_name, first_name, middle_name, 
             date_of_birth, house_number, street, barangay, municipality,
             sync_status, created_at
      FROM senior_citizens
      WHERE lgu_id = ?
      AND id != ?
      AND (
        (LOWER(last_name) = LOWER(?) AND LOWER(first_name) = LOWER(?) AND date_of_birth = ?)
        OR
        (LOWER(last_name) = LOWER(?) AND LOWER(first_name) = LOWER(?) AND date_of_birth = ?)
      )
      ORDER BY created_at DESC
    `);

    // Check exact name match and reversed name match
    const duplicates = stmt.all(
      lguId, record.id || '',
      record.last_name, record.first_name, record.date_of_birth,
      record.first_name, record.last_name, record.date_of_birth
    );

    return duplicates.map(dup => ({
      ...dup,
      duplicate_type: 'EXACT_NAME_DOB',
      confidence: 1.0,
      scope: 'LOCAL'
    }));
  }

  /**
   * Check for duplicates across all LGUs (global scope)
   * @param {Object} record - Record to check
   * @param {string} excludeLguId - LGU ID to exclude (current record's LGU)
   */
  checkGlobalDuplicates(record, excludeLguId) {
    const duplicates = [];

    // 1. Exact name and birthdate match
    const exactMatches = this.findExactMatches(record, excludeLguId);
    duplicates.push(...exactMatches);

    // 2. Similar name matches
    const similarMatches = this.findSimilarNameMatches(record, excludeLguId);
    duplicates.push(...similarMatches);

    // 3. Same birthdate with similar address
    const birthdateAddressMatches = this.findBirthdateAddressMatches(record, excludeLguId);
    duplicates.push(...birthdateAddressMatches);

    // Remove duplicates and sort by confidence score
    const uniqueDuplicates = this.deduplicateResults(duplicates);
    return uniqueDuplicates.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Find exact name and birthdate matches
   */
  findExactMatches(record, excludeLguId) {
    const stmt = this.db.prepare(`
      SELECT id, lgu_id, osca_id, last_name, first_name, middle_name,
             date_of_birth, house_number, street, barangay, municipality,
             sync_status, created_at
      FROM senior_citizens
      WHERE lgu_id != ?
      AND LOWER(last_name) = LOWER(?)
      AND LOWER(first_name) = LOWER(?)
      AND date_of_birth = ?
      ORDER BY created_at DESC
    `);

    const matches = stmt.all(
      excludeLguId,
      record.last_name,
      record.first_name,
      record.date_of_birth
    );

    return matches.map(match => ({
      ...match,
      duplicate_type: 'EXACT_NAME_DOB',
      confidence: 1.0,
      scope: 'GLOBAL'
    }));
  }

  /**
   * Find similar name matches using fuzzy matching
   */
  findSimilarNameMatches(record, excludeLguId) {
    // Split name into parts for better matching
    const lastNameParts = record.last_name.toLowerCase().split(' ');
    const firstNameParts = record.first_name.toLowerCase().split(' ');

    let whereClause = 'lgu_id != ? AND date_of_birth = ? AND (';
    const params = [excludeLguId, record.date_of_birth];

    // Build conditions for name parts
    const nameConditions = [];
    
    // Check each part of last name
    lastNameParts.forEach(part => {
      if (part.length > 2) {
        nameConditions.push('LOWER(last_name) LIKE ?');
        params.push(`%${part}%`);
      }
    });

    // Check each part of first name
    firstNameParts.forEach(part => {
      if (part.length > 2) {
        nameConditions.push('LOWER(first_name) LIKE ?');
        params.push(`%${part}%`);
      }
    });

    whereClause += nameConditions.join(' OR ') + ')';
    whereClause += ' AND LOWER(last_name) != ? AND LOWER(first_name) != ?';
    params.push(record.last_name.toLowerCase(), record.first_name.toLowerCase());

    const stmt = this.db.prepare(`
      SELECT id, lgu_id, osca_id, last_name, first_name, middle_name,
             date_of_birth, house_number, street, barangay, municipality,
             sync_status, created_at
      FROM senior_citizens
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT 20
    `);

    const matches = stmt.all(...params);

    // Calculate similarity scores
    return matches.map(match => {
      const similarity = this.calculateNameSimilarity(
        `${record.first_name} ${record.last_name}`,
        `${match.first_name} ${match.last_name}`
      );

      return {
        ...match,
        duplicate_type: 'SIMILAR_NAME_DOB',
        confidence: similarity * this.config.birthdateWeight,
        scope: 'GLOBAL'
      };
    }).filter(match => match.confidence >= this.config.minScoreForDuplicate);
  }

  /**
   * Find matches based on birthdate and address
   */
  findBirthdateAddressMatches(record, excludeLguId) {
    const stmt = this.db.prepare(`
      SELECT id, lgu_id, osca_id, last_name, first_name, middle_name,
             date_of_birth, house_number, street, barangay, municipality,
             sync_status, created_at
      FROM senior_citizens
      WHERE lgu_id != ?
      AND date_of_birth = ?
      AND barangay = ?
      AND municipality = ?
      AND LOWER(last_name) != ?
      AND LOWER(first_name) != ?
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const matches = stmt.all(
      excludeLguId,
      record.date_of_birth,
      record.barangay,
      record.municipality,
      record.last_name.toLowerCase(),
      record.first_name.toLowerCase()
    );

    return matches.map(match => ({
      ...match,
      duplicate_type: 'SAME_BIRTHDATE_ADDRESS',
      confidence: 0.6, // Medium confidence for same birthdate and address
      scope: 'GLOBAL'
    }));
  }

  /**
   * Calculate name similarity using simple string comparison
   * @param {string} name1 - First name
   * @param {string} name2 - Second name
   */
  calculateNameSimilarity(name1, name2) {
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();

    if (n1 === n2) return 1.0;

    // Simple Levenshtein distance implementation
    const distance = this.levenshteinDistance(n1, n2);
    const maxLength = Math.max(n1.length, n2.length);
    
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Remove duplicate results from the matches array
   */
  deduplicateResults(duplicates) {
    const seen = new Set();
    return duplicates.filter(dup => {
      const key = `${dup.id}_${dup.lgu_id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Mark records as duplicates
   * @param {string} recordId - Original record ID
   * @param {Array} duplicateIds - Array of duplicate record IDs
   * @param {string} adminNotes - Admin notes about the duplicate
   */
  markAsDuplicates(recordId, duplicateIds, adminNotes = null) {
    const transaction = this.db.transaction(() => {
      // Mark original record
      this.db.prepare(`
        UPDATE senior_citizens
        SET sync_status = 'CROSS_LGU_DUPLICATE',
            admin_notes = ?,
            duplicate_of = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(adminNotes, recordId);

      // Mark duplicate records
      const placeholders = duplicateIds.map(() => '?').join(',');
      this.db.prepare(`
        UPDATE senior_citizens
        SET sync_status = 'CROSS_LGU_DUPLICATE',
            admin_notes = ?,
            duplicate_of = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
      `).run(adminNotes, recordId, ...duplicateIds);
    });

    transaction();
  }

  /**
   * Approve record and mark duplicates as denied
   * @param {string} approvedId - Record to approve
   * @param {Array} duplicateIds - Array of duplicate record IDs to deny
   */
  approveAndDenyDuplicates(approvedId, duplicateIds) {
    const transaction = this.db.transaction(() => {
      // Approve the selected record
      this.db.prepare(`
        UPDATE senior_citizens
        SET sync_status = 'APPROVED',
            admin_decision_at = CURRENT_TIMESTAMP,
            is_readonly = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(approvedId);

      // Deny the duplicates
      if (duplicateIds.length > 0) {
        const placeholders = duplicateIds.map(() => '?').join(',');
        this.db.prepare(`
          UPDATE senior_citizens
          SET sync_status = 'DENIED',
              admin_decision_at = CURRENT_TIMESTAMP,
              admin_notes = 'Denied as duplicate of approved record',
              updated_at = CURRENT_TIMESTAMP
          WHERE id IN (${placeholders})
        `).run(...duplicateIds);
      }
    });

    transaction();
  }

  /**
   * Get duplicate report for admin
   * @param {Object} filters - Filter options
   */
  getDuplicateReport(filters = {}) {
    let query = `
      SELECT 
        sc1.id as record_id,
        sc1.lgu_id,
        sc1.osca_id,
        sc1.last_name,
        sc1.first_name,
        sc1.date_of_birth,
        sc1.barangay,
        sc1.city_municipality,
        sc1.sync_status,
        sc1.admin_notes,
        sc1.admin_decision_at,
        sc2.id as duplicate_id,
        sc2.lgu_id as duplicate_lgu_id,
        sc2.osca_id as duplicate_osca_id,
        sc2.last_name as duplicate_last_name,
        sc2.first_name as duplicate_first_name,
        sc2.barangay as duplicate_barangay,
        sc2.city_municipality as duplicate_city_municipality
      FROM senior_citizens sc1
      INNER JOIN senior_citizens sc2 ON sc1.duplicate_of = sc2.id OR sc2.duplicate_of = sc1.id
      WHERE sc1.sync_status = 'CROSS_LGU_DUPLICATE'
      AND sc1.id != sc2.id
    `;

    const params = [];

    // Add filters
    if (filters.lgu_id) {
      query += ' AND (sc1.lgu_id = ? OR sc2.lgu_id = ?)';
      params.push(filters.lgu_id, filters.lgu_id);
    }

    if (filters.date_from) {
      query += ' AND sc1.created_at >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND sc1.created_at <= ?';
      params.push(filters.date_to);
    }

    query += ' ORDER BY sc1.created_at DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Get statistics about duplicates
   */
  getDuplicateStatistics() {
    const stats = {};

    // Total duplicates
    const totalDuplicates = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM senior_citizens
      WHERE sync_status = 'CROSS_LGU_DUPLICATE'
    `).get();
    stats.total_duplicates = totalDuplicates.count;

    // Duplicates by LGU
    const byLgu = this.db.prepare(`
      SELECT lgu_id, COUNT(*) as count
      FROM senior_citizens
      WHERE sync_status = 'CROSS_LGU_DUPLICATE'
      GROUP BY lgu_id
      ORDER BY count DESC
    `).all();
    stats.by_lgu = byLgu;

    // Pending reviews
    const pending = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM senior_citizens
      WHERE sync_status = 'PENDING_REVIEW'
    `).get();
    stats.pending_review = pending.count;

    return stats;
  }
}

export default DuplicateDetectionService;
