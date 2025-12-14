import { createClient } from '@supabase/supabase-js';
import { config } from '../config/supabase.js';

class SupabaseService {
  constructor() {
    this.supabase = createClient(config.url, config.anonKey);
  }

  // Generic fetch for any table
  async fetchTable(tableName, filters = {}, page = 1, limit = 50) {
    try {
      let query = this.supabase.from(tableName).select('*', { count: 'exact' });

      // Apply filters dynamically
      Object.entries(filters).forEach(([column, filter]) => {
        if (filter.operator && filter.value !== undefined) {
          switch (filter.operator) {
            case 'eq':
              query = query.eq(column, filter.value);
              break;
            case 'neq':
              query = query.neq(column, filter.value);
              break;
            case 'gt':
              query = query.gt(column, filter.value);
              break;
            case 'gte':
              query = query.gte(column, filter.value);
              break;
            case 'lt':
              query = query.lt(column, filter.value);
              break;
            case 'lte':
              query = query.lte(column, filter.value);
              break;
            case 'like':
              query = query.like(column, filter.value);
              break;
            case 'ilike':
              query = query.ilike(column, filter.value);
              break;
            case 'is':
              query = query.is(column, filter.value);
              break;
            case 'in':
              query = query.in(column, filter.value);
              break;
          }
        }
      });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data,
        total: count,
        page,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      throw error;
    }
  }

  // Generic create for any table
  async createRecord(tableName, record) {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error creating record in ${tableName}:`, error);
      throw error;
    }
  }

  // Generic update for any table
  async updateRecord(tableName, id, updates) {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error updating record in ${tableName}:`, error);
      throw error;
    }
  }

  // Generic delete for any table
  async deleteRecord(tableName, id) {
    try {
      const { error } = await this.supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting record from ${tableName}:`, error);
      throw error;
    }
  }

  // Get table structure (columns)
  async getTableStructure(tableName) {
    try {
      // For now, return a sample record to infer structure
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        return Object.keys(data[0]).map(key => ({
          name: key,
          type: typeof data[0][key],
          value: data[0][key]
        }));
      }
      
      return [];
    } catch (error) {
      console.error(`Error getting structure for ${tableName}:`, error);
      return [];
    }
  }
}

export default SupabaseService;
