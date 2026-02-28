// Database switcher - routes to correct database based on source
import { DatabaseSource } from './store';
import * as localDb from './client-db';
import * as supabaseDb from './supabase-db';
import { getSupabaseClient } from './supabase';

// Re-export types
export type { Category, Record, LineItem } from './client-db';
export type { Profile } from './supabase-db';

// Get the current database module based on source
function getDb(source: DatabaseSource) {
  if (source === 'supabase' && getSupabaseClient()) {
    return supabaseDb;
  }
  return localDb;
}

// Initialize default categories
export async function initDefaultCategories(source: DatabaseSource = 'supabase') {
  return getDb(source).initDefaultCategories();
}

// Category operations
export async function getCategories(source: DatabaseSource = 'supabase', type?: 'income' | 'expense') {
  if (source === 'supabase') {
    return supabaseDb.getCategories(type);
  }
  return localDb.getCategories(type);
}

export async function addCategory(
  source: DatabaseSource = 'supabase',
  name: string, 
  type: 'income' | 'expense', 
  isDefault: boolean = false
) {
  if (source === 'supabase') {
    return supabaseDb.addCategory(name, type, isDefault);
  }
  return localDb.addCategory(name, type, isDefault);
}

export async function updateCategory(
  source: DatabaseSource = 'supabase',
  id: string,
  updates: Partial<{ name: string; type: 'income' | 'expense'; isDefault: boolean }>
) {
  if (source === 'supabase') {
    return supabaseDb.updateCategory(id, updates);
  }
  return localDb.updateCategory(id, updates);
}

export async function deleteCategory(source: DatabaseSource = 'supabase', id: string) {
  if (source === 'supabase') {
    return supabaseDb.deleteCategory(id);
  }
  return localDb.deleteCategory(id);
}

// Record operations
export async function getRecords(source: DatabaseSource = 'supabase', month?: number, year?: number) {
  if (source === 'supabase') {
    return supabaseDb.getRecords(month, year);
  }
  return localDb.getRecords(month, year);
}

export async function addRecord(
  source: DatabaseSource = 'supabase',
  type: 'income' | 'expense',
  cashAmount: number,
  creditAmount: number,
  date: Date,
  note: string | null,
  lineItems: { name: string; cashAmount: number; creditAmount: number; categoryId: string; imageData?: string; imageName?: string }[]
) {
  if (source === 'supabase') {
    return supabaseDb.addRecord(type, cashAmount, creditAmount, date, note, lineItems);
  }
  return localDb.addRecord(type, cashAmount, creditAmount, date, note, lineItems);
}

export async function bulkAddRecords(
  source: DatabaseSource = 'supabase',
  records: {
    type: 'income' | 'expense';
    cashAmount: number;
    creditAmount: number;
    date: Date;
    note: string | null;
    lineItems: { name: string; cashAmount: number; creditAmount: number; categoryId: string; imageData?: string; imageName?: string }[];
  }[]
) {
  if (source === 'supabase') {
    return supabaseDb.bulkAddRecords(records);
  }
  return localDb.bulkAddRecords(records);
}

export async function updateRecord(
  source: DatabaseSource = 'supabase',
  id: string,
  type: 'income' | 'expense',
  cashAmount: number,
  creditAmount: number,
  date: Date,
  note: string | null,
  lineItems: { name: string; cashAmount: number; creditAmount: number; categoryId: string; imageData?: string; imageName?: string }[]
) {
  if (source === 'supabase') {
    return supabaseDb.updateRecord(id, type, cashAmount, creditAmount, date, note, lineItems);
  }
  return localDb.updateRecord(id, type, cashAmount, creditAmount, date, note, lineItems);
}

export async function deleteRecord(source: DatabaseSource = 'supabase', id: string) {
  if (source === 'supabase') {
    return supabaseDb.deleteRecord(id);
  }
  return localDb.deleteRecord(id);
}

// Backup and Restore
export async function createBackup(source: DatabaseSource = 'supabase') {
  if (source === 'supabase') {
    return supabaseDb.createBackup();
  }
  return localDb.createBackup();
}

export async function restoreBackup(
  source: DatabaseSource = 'supabase',
   
  backupData: any
) {
  if (source === 'supabase') {
    return supabaseDb.restoreBackup(backupData);
  }
  return localDb.restoreBackup(backupData);
}

// Export functions
export async function exportToJSON(source: DatabaseSource = 'supabase', month?: number, year?: number) {
  if (source === 'supabase') {
    return supabaseDb.exportToJSON(month, year);
  }
  return localDb.exportToJSON(month, year);
}

export async function exportToCSV(source: DatabaseSource = 'supabase', month?: number, year?: number) {
  if (source === 'supabase') {
    return supabaseDb.exportToCSV(month, year);
  }
  return localDb.exportToCSV(month, year);
}

// Clear all data
export async function clearAllData(source: DatabaseSource = 'supabase') {
  if (source === 'supabase') {
    return supabaseDb.clearAllData();
  }
  return localDb.clearAllData();
}

export async function getCurrentProfile() {
  return supabaseDb.getCurrentProfile();
}

export async function createLog(action: string, details: any) {
  return supabaseDb.createLog(action, details);
}
