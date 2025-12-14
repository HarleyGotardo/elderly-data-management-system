import Controller from './Controller.js';
import SeniorCitizen from '../Models/SeniorCitizen.js';
import db from '../../database/config.js';

class SeniorCitizenController extends Controller {
  constructor() {
    super();
    // Import SyncWorkflowService dynamically to avoid main process issues
    this.SyncWorkflowService = null;
  }

  async getWorkflowService() {
    if (!this.SyncWorkflowService) {
      // Import from the services index to avoid code-splitting issues
      const module = await import('../../src/services/index.js');
      this.SyncWorkflowService = module.SyncWorkflowService;
    }
    return this.SyncWorkflowService;
  }
  /**
   * Get all senior citizens for the LGU
   */
  async index() {
    return this.handle(async () => {
      const { page, limit, offset } = this.getPaginationParams();
      const { status, search } = this.request.query;
      
      // Get LGU ID from session/auth (for now, hardcoded)
      const lguId = 1; // TODO: Get from authenticated user
      
      let seniors;
      let total;
      
      if (search) {
        // Search by name
        seniors = SeniorCitizen.where('full_name', 'LIKE', `%${search}%`);
        total = seniors.length;
      } else if (status) {
        // Filter by status
        seniors = SeniorCitizen.getByStatus(status, lguId);
        total = seniors.length;
      } else {
        // Get all for LGU
        seniors = SeniorCitizen.getByLgu(lguId, limit, offset);
        total = SeniorCitizen.where('lgu_id', '=', lguId).length;
      }
      
      const paginatedSeniors = this.paginate(seniors, total, page, limit);
      
      return this.success(paginatedSeniors, 'Senior citizens retrieved successfully');
    });
  }

  /**
   * Get a specific senior citizen
   */
  async show() {
    return this.handle(async () => {
      const id = this.request.params.id;
      
      if (!id) {
        return this.error('ID is required', 400);
      }
      
      const senior = SeniorCitizen.find(id);
      
      if (!senior) {
        return this.error('Senior citizen not found', 404);
      }
      
      // Check if user can access this record (LGU scope)
      const lguId = 1; // TODO: Get from authenticated user
      if (senior.get('lgu_id') !== lguId) {
        return this.error('Access denied', 403);
      }
      
      return this.success(senior.toJSON(), 'Senior citizen retrieved successfully');
    });
  }

  /**
   * Create a new senior citizen
   */
  async store() {
    return this.handle(async () => {
      const data = this.request.body;
      
      // Get LGU ID from session/auth
      const lguId = 1; // TODO: Get from authenticated user
      data.lgu_id = lguId;
      
      // Use SyncWorkflowService for validation and creation
      const WorkflowService = await this.getWorkflowService();
      const workflow = new WorkflowService(db, lguId);
      
      const result = await workflow.addApplicant(data);
      
      if (!result.success) {
        return this.error(result.error, 400);
      }
      
      // Return the created record
      const senior = SeniorCitizen.find(result.recordId);
      
      return this.success(senior.toJSON(), 'Senior citizen created successfully');
    });
  }

  /**
   * Update a senior citizen
   */
  async update() {
    return this.handle(async () => {
      const id = this.request.params.id;
      const data = this.request.body;
      
      if (!id) {
        return this.error('ID is required', 400);
      }
      
      const senior = SeniorCitizen.find(id);
      
      if (!senior) {
        return this.error('Senior citizen not found', 404);
      }
      
      // Check if user can access this record
      const lguId = 1; // TODO: Get from authenticated user
      if (senior.get('lgu_id') !== lguId) {
        return this.error('Access denied', 403);
      }
      
      // Check if record is locked
      if (senior.isLocked()) {
        return this.error('Record is locked and cannot be modified', 403);
      }
      
      // Check if already submitted
      if (senior.get('status') === 'PENDING_ADMIN_REVIEW') {
        return this.error('Cannot modify record that has been submitted for review', 403);
      }
      
      // Validate data
      const errors = SeniorCitizen.validate(data);
      if (errors) {
        return this.error('Validation failed', 422, errors);
      }
      
      // Check for duplicate if name or DOB changed
      if (data.full_name !== senior.get('full_name') || data.date_of_birth !== senior.get('date_of_birth')) {
        const existing = SeniorCitizen.checkDuplicateInLgu(
          data.full_name,
          data.date_of_birth,
          lguId
        );
        
        if (existing && existing.get('id') !== senior.get('id')) {
          return this.error('Applicant already exists in your list', 409);
        }
      }
      
      // Update senior citizen
      senior.update(data);
      
      return this.success(senior.toJSON(), 'Senior citizen updated successfully');
    });
  }

  /**
   * Delete a senior citizen
   */
  async destroy() {
    return this.handle(async () => {
      const id = this.request.params.id;
      
      if (!id) {
        return this.error('ID is required', 400);
      }
      
      const senior = SeniorCitizen.find(id);
      
      if (!senior) {
        return this.error('Senior citizen not found', 404);
      }
      
      // Check if user can access this record
      const lguId = 1; // TODO: Get from authenticated user
      if (senior.get('lgu_id') !== lguId) {
        return this.error('Access denied', 403);
      }
      
      // Check if record is locked
      if (senior.isLocked()) {
        return this.error('Record is locked and cannot be deleted', 403);
      }
      
      // Check if already submitted
      if (senior.get('status') === 'PENDING_ADMIN_REVIEW') {
        return this.error('Cannot delete record that has been submitted for review', 403);
      }
      
      // Delete senior citizen
      senior.delete();
      
      return this.success(null, 'Senior citizen deleted successfully');
    });
  }

  /**
   * Submit senior citizen to admin for review
   */
  async submit() {
    return this.handle(async () => {
      const id = this.request.params.id;
      
      if (!id) {
        return this.error('ID is required', 400);
      }
      
      // Get LGU ID from session/auth
      const lguId = 1; // TODO: Get from authenticated user
      
      // Use SyncWorkflowService for submission
      const WorkflowService = await this.getWorkflowService();
      const workflow = new WorkflowService(db, lguId);
      
      const result = await workflow.submitToAdmin(id);
      
      if (!result.success) {
        return this.error(result.error, 400);
      }
      
      // Return the updated record
      const senior = SeniorCitizen.find(id);
      
      return this.success(senior.toJSON(), result.message);
    });
  }

  /**
   * Export data for syncing
   */
  async export() {
    return this.handle(async () => {
      const { status, dateFrom, dateTo } = this.request.query;
      
      // Get LGU ID
      const lguId = 1; // TODO: Get from authenticated user
      
      let query = `SELECT * FROM ${SeniorCitizen.tableName} WHERE lgu_id = ?`;
      let params = [lguId];
      
      if (status) {
        query += ` AND status = ?`;
        params.push(status);
      }
      
      if (dateFrom) {
        query += ` AND created_at >= ?`;
        params.push(dateFrom);
      }
      
      if (dateTo) {
        query += ` AND created_at <= ?`;
        params.push(dateTo);
      }
      
      const db = require('../../database/config');
      const stmt = db.prepare(query);
      const records = stmt.all(...params);
      
      // Create export data
      const exportData = {
        metadata: {
          lgu_id: lguId,
          export_date: new Date().toISOString(),
          record_count: records.length
        },
        records: records.map(record => ({
          ...record,
          // Remove sensitive fields if needed
        }))
      };
      
      return this.success(exportData, 'Data exported successfully');
    });
  }

  /**
   * Import status updates from admin
   */
  async import() {
    return this.handle(async () => {
      const { updates } = this.request.body;
      
      if (!updates || !Array.isArray(updates)) {
        return this.error('Invalid update data', 400);
      }
      
      const lguId = 1; // TODO: Get from authenticated user
      let updatedCount = 0;
      const errors = [];
      
      for (const update of updates) {
        try {
          const senior = SeniorCitizen.find(update.id);
          
          if (!senior || senior.get('lgu_id') !== lguId) {
            errors.push(`Record ID ${update.id} not found or access denied`);
            continue;
          }
          
          // Update admin fields
          const updateData = {
            status: update.status,
            compliance_check: update.compliance_check,
            global_duplicate_status: update.global_duplicate_status,
            admin_assessment: update.admin_assessment,
            admin_remarks: update.admin_remarks,
            payment_status: update.payment_status,
            payment_date: update.payment_date,
            date_of_death: update.date_of_death
          };
          
          // Lock if approved
          if (update.status === 'APPROVED') {
            updateData.locked = 1;
          }
          
          senior.update(updateData);
          updatedCount++;
        } catch (error) {
          errors.push(`Error updating record ID ${update.id}: ${error.message}`);
        }
      }
      
      return this.success({
        updated_count: updatedCount,
        errors: errors
      }, `Import completed. Updated ${updatedCount} records.`);
    });
  }

  /**
   * Get statistics for dashboard
   */
  async stats() {
    return this.handle(async () => {
      const lguId = 1; // TODO: Get from authenticated user
      
      const db = require('../../database/config');
      
      // Get counts by status
      const statusCounts = db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM ${SeniorCitizen.tableName} 
        WHERE lgu_id = ? 
        GROUP BY status
      `).all(lguId);
      
      // Get total count
      const totalCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM ${SeniorCitizen.tableName} 
        WHERE lgu_id = ?
      `).get(lguId);
      
      // Get vulnerable sector counts
      const ipCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM ${SeniorCitizen.tableName} 
        WHERE lgu_id = ? AND is_ip = 1
      `).get(lguId);
      
      const pwdCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM ${SeniorCitizen.tableName} 
        WHERE lgu_id = ? AND is_pwd = 1
      `).get(lguId);
      
      const stats = {
        total: totalCount.count,
        by_status: statusCounts.reduce((acc, item) => {
          acc[item.status] = item.count;
          return acc;
        }, {}),
        vulnerable_sectors: {
          ip: ipCount.count,
          pwd: pwdCount.count
        }
      };
      
      return this.success(stats, 'Statistics retrieved successfully');
    });
  }
}

export default SeniorCitizenController;
