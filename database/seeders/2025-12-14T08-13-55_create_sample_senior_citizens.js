const db = require('../config');

module.exports = {
  async run() {
    const insertStmt = db.prepare(`
      INSERT INTO senior_citizens (
        osca_id, last_name, first_name, date_of_birth, sex, 
        civil_status, citizenship, region, province, municipality, 
        barangay, lgu_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleSeniors = [
      ['OSCA-2023-0001', 'Reyes', 'Juan', '1945-03-15', 'Male', 'Married', 'Filipino', 'NCR', 'Metro Manila', 'Quezon City', 'Barangay 123', 1, 'APPROVED'],
      ['OSCA-2023-0002', 'Cruz', 'Carmen', '1950-07-22', 'Female', 'Widowed', 'Filipino', 'CAR', 'Benguet', 'Baguio City', 'Camp 7', 1, 'PENDING_ADMIN_REVIEW'],
      ['OSCA-2023-0003', 'Santos', 'Antonio', '1938-11-30', 'Male', 'Married', 'Filipino', 'Region IV-A', 'Laguna', 'Santa Rosa', 'Malitlit', 1, 'DRAFT'],
      ['OSCA-2023-0004', 'Gonzales', 'Rosalinda', '1948-05-10', 'Female', 'Single', 'Filipino', 'Region III', 'Pampanga', 'Angeles City', 'Balibago', 1, 'CLEAN'],
      ['OSCA-2023-0005', 'Mendoza', 'Francisco', '1955-09-18', 'Male', 'Legally Separated', 'Dual', 'Region III', 'Zambales', 'Subic', 'Calapacuan', 1, 'HOLD']
    ];

    const transaction = db.transaction(() => {
      for (const senior of sampleSeniors) {
        insertStmt.run(...senior);
      }
    });

    transaction();
    console.log('Sample senior citizens data seeded successfully! (' + sampleSeniors.length + ' records)');
  },

  async down() {
    db.exec("DELETE FROM senior_citizens WHERE osca_id LIKE 'OSCA-2023-%'");
    console.log('Sample senior citizens data removed!');
  }
};
