const dbPromise = require('../config.js');

class SeniorCitizenSeeder {
  /**
   * Run the database seeder
   */
  async run() {
    console.log('Seeding Senior Citizens...');
    
    try {
      const db = await dbPromise;
      // Seed sample senior citizens
      const seniorCitizens = [
        {
          osca_id: 'SC-001',
          ncsc_rrn: 'NCSC-001',
          last_name: 'Dela Cruz',
          first_name: 'Juan',
          middle_name: 'Santos',
          ext_name: 'Jr.',
          date_of_birth: '1950-01-15',
          sex: 'Male',
          civil_status: 'Married',
          citizenship: 'Filipino',
          is_ip: 0,
          ip_group: null,
          is_pwd: 0,
          pwd_type: null,
          region: 'NCR',
          province: 'Sample Province',
          municipality: 'Sample City',
          barangay: 'Barangay 1',
          house_number: '123',
          street: 'Rizal Street',
          spouse_name: 'Maria Dela Cruz',
          rep_1_name: 'Juan Dela Cruz II',
          rep_1_relationship: 'Son',
          rep_2_name: null,
          rep_2_relationship: null,
          rep_3_name: null,
          rep_3_relationship: null,
          beneficiary_primary: 'Juan Dela Cruz II',
          beneficiary_contingent: 'Maria Dela Cruz Jr.',
          status: 'APPROVED',
          compliance_check: 'PASS',
          global_duplicate_status: 'CLEAN',
          admin_assessment: 'APPROVED',
          admin_remarks: 'Verified documents',
          payment_status: 'PAID',
          payment_date: new Date().toISOString().split('T')[0],
          date_of_death: null,
          lgu_id: 1,
          locked: 0,
          submitted_at: new Date().toISOString()
        },
        {
          osca_id: 'SC-002',
          ncsc_rrn: 'NCSC-002',
          last_name: 'Reyes',
          first_name: 'Maria',
          middle_name: 'Garcia',
          ext_name: null,
          date_of_birth: '1955-03-20',
          sex: 'Female',
          civil_status: 'Widowed',
          citizenship: 'Filipino',
          is_ip: 0,
          ip_group: null,
          is_pwd: 1,
          pwd_type: 'Physical Disability',
          region: 'NCR',
          province: 'Sample Province',
          municipality: 'Sample City',
          barangay: 'Barangay 2',
          house_number: '456',
          street: 'Mabini Avenue',
          spouse_name: null,
          rep_1_name: 'Elena Reyes',
          rep_1_relationship: 'Daughter',
          rep_2_name: null,
          rep_2_relationship: null,
          rep_3_name: null,
          rep_3_relationship: null,
          beneficiary_primary: 'Elena Reyes',
          beneficiary_contingent: 'Carlos Reyes',
          status: 'PENDING_ADMIN_REVIEW',
          compliance_check: null,
          global_duplicate_status: null,
          admin_assessment: null,
          admin_remarks: null,
          payment_status: 'UNPAID',
          payment_date: null,
          date_of_death: null,
          lgu_id: 1,
          locked: 0,
          submitted_at: new Date().toISOString()
        },
        {
          osca_id: 'SC-003',
          ncsc_rrn: 'NCSC-003',
          last_name: 'Santos',
          first_name: 'Pedro',
          middle_name: 'Lopez',
          ext_name: 'Sr.',
          date_of_birth: '1948-07-10',
          sex: 'Male',
          civil_status: 'Married',
          citizenship: 'Filipino',
          is_ip: 1,
          ip_group: 'Igorot',
          is_pwd: 0,
          pwd_type: null,
          region: 'NCR',
          province: 'Sample Province',
          municipality: 'Sample City',
          barangay: 'Barangay 3',
          house_number: '789',
          street: 'Bonifacio Street',
          spouse_name: 'Linda Santos',
          rep_1_name: 'Pedro Santos Jr.',
          rep_1_relationship: 'Son',
          rep_2_name: null,
          rep_2_relationship: null,
          rep_3_name: null,
          rep_3_relationship: null,
          beneficiary_primary: 'Pedro Santos Jr.',
          beneficiary_contingent: 'Linda Santos',
          status: 'DRAFT',
          compliance_check: null,
          global_duplicate_status: null,
          admin_assessment: null,
          admin_remarks: null,
          payment_status: 'UNPAID',
          payment_date: null,
          date_of_death: null,
          lgu_id: 1,
          locked: 0,
          submitted_at: null
        },
        {
          osca_id: 'SC-004',
          ncsc_rrn: 'NCSC-004',
          last_name: 'Gonzales',
          first_name: 'Elena',
          middle_name: 'Ramos',
          ext_name: null,
          date_of_birth: '1960-05-25',
          sex: 'Female',
          civil_status: 'Single',
          citizenship: 'Filipino',
          is_ip: 0,
          ip_group: null,
          is_pwd: 0,
          pwd_type: null,
          region: 'NCR',
          province: 'Sample Province',
          municipality: 'Sample City',
          barangay: 'Barangay 4',
          house_number: '321',
          street: 'Quezon Boulevard',
          spouse_name: null,
          rep_1_name: 'Roberto Gonzales',
          rep_1_relationship: 'Brother',
          rep_2_name: null,
          rep_2_relationship: null,
          rep_3_name: null,
          rep_3_relationship: null,
          beneficiary_primary: 'Roberto Gonzales',
          beneficiary_contingent: 'Carmen Gonzales',
          status: 'CLEAN',
          compliance_check: 'PASS',
          global_duplicate_status: 'CLEAN',
          admin_assessment: null,
          admin_remarks: null,
          payment_status: 'UNPAID',
          payment_date: null,
          date_of_death: null,
          lgu_id: 1,
          locked: 0,
          submitted_at: new Date().toISOString()
        },
        {
          osca_id: 'SC-005',
          ncsc_rrn: 'NCSC-005',
          last_name: 'Mendoza',
          first_name: 'Ricardo',
          middle_name: 'Torres',
          ext_name: null,
          date_of_birth: '1945-11-30',
          sex: 'Male',
          civil_status: 'Married',
          citizenship: 'Filipino',
          is_ip: 0,
          ip_group: null,
          is_pwd: 1,
          pwd_type: 'Visual Disability',
          region: 'NCR',
          province: 'Sample Province',
          municipality: 'Sample City',
          barangay: 'Barangay 5',
          house_number: '567',
          street: 'Aguinaldo Street',
          spouse_name: 'Carmen Mendoza',
          rep_1_name: 'Ricardo Mendoza Jr.',
          rep_1_relationship: 'Son',
          rep_2_name: null,
          rep_2_relationship: null,
          rep_3_name: null,
          rep_3_relationship: null,
          beneficiary_primary: 'Ricardo Mendoza Jr.',
          beneficiary_contingent: 'Carmen Mendoza',
          status: 'PENDING_ADMIN_REVIEW',
          compliance_check: null,
          global_duplicate_status: null,
          admin_assessment: null,
          admin_remarks: null,
          payment_status: 'UNPAID',
          payment_date: null,
          date_of_death: null,
          lgu_id: 1,
          locked: 0,
          submitted_at: new Date().toISOString()
        }
      ];
      
      const stmt = db.prepare(`
        INSERT INTO senior_citizens (
          osca_id, ncsc_rrn, last_name, first_name, middle_name, ext_name,
          date_of_birth, sex, civil_status, citizenship, is_ip, ip_group, is_pwd, pwd_type,
          region, province, municipality, barangay, house_number, street,
          spouse_name, rep_1_name, rep_1_relationship, rep_2_name, rep_2_relationship,
          rep_3_name, rep_3_relationship, beneficiary_primary, beneficiary_contingent,
          status, compliance_check, global_duplicate_status, admin_assessment, admin_remarks,
          payment_status, payment_date, date_of_death, lgu_id, locked, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      seniorCitizens.forEach(senior => {
        stmt.run(
          senior.osca_id, senior.ncsc_rrn, senior.last_name, senior.first_name, senior.middle_name, senior.ext_name,
          senior.date_of_birth, senior.sex, senior.civil_status, senior.citizenship, senior.is_ip, senior.ip_group, senior.is_pwd, senior.pwd_type,
          senior.region, senior.province, senior.municipality, senior.barangay, senior.house_number, senior.street,
          senior.spouse_name, senior.rep_1_name, senior.rep_1_relationship, senior.rep_2_name, senior.rep_2_relationship,
          senior.rep_3_name, senior.rep_3_relationship, senior.beneficiary_primary, senior.beneficiary_contingent,
          senior.status, senior.compliance_check, senior.global_duplicate_status, senior.admin_assessment, senior.admin_remarks,
          senior.payment_status, senior.payment_date, senior.date_of_death, senior.lgu_id, senior.locked, senior.submitted_at
        );
        console.log(`  ✓ Created senior citizen: ${senior.first_name} ${senior.last_name} (${senior.osca_id}) - Status: ${senior.status}`);
      });
      
      console.log(`\n✅ ${seniorCitizens.length} senior citizens seeded successfully!`);
      
    } catch (error) {
      console.error('❌ Senior citizen seeding failed:', error);
      throw error;
    }
  }
  
  /**
   * Clear all senior citizens
   */
  async clear() {
    console.log('Clearing senior citizens...');
    const db = await dbPromise;
    db.exec('DELETE FROM senior_citizens');
    console.log('  ✓ All senior citizens cleared');
  }
}

module.exports = SeniorCitizenSeeder;
