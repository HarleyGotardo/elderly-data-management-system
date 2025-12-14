// Entry point for all services - bundles them together to avoid code-splitting issues
import DuplicateDetectionService from './DuplicateDetectionService.js';
import USBExportService from './USBExportService.js';
import USBImportService from './USBImportService.js';
import StatusUpdateService from './StatusUpdateService.js';
import AutoSyncService from './AutoSyncService.js';
import SyncWorkflowService from './SyncWorkflowService.js';
import SupabaseSyncService from './SupabaseSyncService.js';
import CryptoUtils from '../utils/CryptoUtils.js';

// Export all services
export {
  DuplicateDetectionService,
  USBExportService,
  USBImportService,
  StatusUpdateService,
  AutoSyncService,
  SyncWorkflowService,
  SupabaseSyncService,
  CryptoUtils
};

// Also export defaults for compatibility
export default {
  DuplicateDetectionService,
  USBExportService,
  USBImportService,
  StatusUpdateService,
  AutoSyncService,
  SyncWorkflowService,
  SupabaseSyncService,
  CryptoUtils
};
