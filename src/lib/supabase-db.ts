import { getSupabaseClient, testSupabaseConnection } from './supabase';

// Simple in-memory cache
let profilesCache: { data: Profile[], timestamp: number } | null = null;
let logsCache: { data: AuditLog[], timestamp: number } | null = null;
let currentProfileCache: { data: Profile | null, userId: string, timestamp: number } | null = null;
let categoriesCache: { data: Category[], timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000; // 1 minute
const CATEGORIES_CACHE_TTL = 10 * 60 * 1000; // 10 minutes for categories (they rarely change)

// Types (same as client-db)
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  isDefault: boolean;
  userId?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LineItem {
  id: string;
  name: string;
  cashAmount: number;
  creditAmount: number;
  categoryId: string;
  recordId: string;
  imageData?: string;
  imageName?: string;
  userId?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Record {
  id: string;
  type: 'income' | 'expense';
  cashAmount: number;
  creditAmount: number;
  date: Date;
  note: string | null;
  lineItems: LineItem[];
  userId?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  email: string;
  isApproved: boolean;
  canEdit: boolean;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  createdAt: string;
  user_email?: string; // Optional join
}

// Helper functions
const generateId = () => crypto.randomUUID();

// Initialize default categories
export async function initDefaultCategories() {
  const client = getSupabaseClient();
  if (!client) return;

  // Check if session exists first
  const { data: { session } } = await client.auth.getSession();
  if (!session) return;

  const { data: existing } = await client.from('categories').select('id').limit(1);
  
  if (existing && existing.length > 0) return;

  const defaultCategories: Category[] = [
    { id: generateId(), name: 'Default', type: 'income', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
    { id: generateId(), name: 'Default', type: 'expense', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
    { id: generateId(), name: 'Salary', type: 'income', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
    { id: generateId(), name: 'Freelance', type: 'income', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
    { id: generateId(), name: 'Investment', type: 'income', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
    { id: generateId(), name: 'Bonus', type: 'income', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
    { id: generateId(), name: 'Food', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
    { id: generateId(), name: 'Transport', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
    { id: generateId(), name: 'Shopping', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
    { id: generateId(), name: 'Bills', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
    { id: generateId(), name: 'Entertainment', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
    { id: generateId(), name: 'Health', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
    { id: generateId(), name: 'Education', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
    { id: generateId(), name: 'Rent', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
    { id: generateId(), name: 'Utilities', type: 'expense', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
  ];
  
  await client.from('categories').insert(defaultCategories);
}

// Category operations
export async function getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  // Check cache first (categories rarely change)
  if (categoriesCache && (Date.now() - categoriesCache.timestamp < CATEGORIES_CACHE_TTL)) {
    const cached = categoriesCache.data;
    return type ? cached.filter(c => c.type === type) : cached;
  }

  const { data, error } = await client.from('categories').select('*');
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  
  const result = data || [];
  categoriesCache = { data: result, timestamp: Date.now() };
  
  // Return filtered if type is specified
  return type ? result.filter(c => c.type === type) : result;
}

export async function addCategory(name: string, type: 'income' | 'expense', isDefault: boolean = false): Promise<string> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Not connected to Supabase');

  const id = generateId();
  const now = new Date();
  
  if (isDefault) {
    await client.from('categories').update({ isDefault: false }).eq('type', type);
  }
  
  const { data: { session } } = await client.auth.getSession();
  const userId = session?.user.id;
  
  await client.from('categories').insert({
    id,
    name,
    type,
    isDefault,
    userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
  });
  
  // Clear categories cache
  categoriesCache = null;
  
  return id;
}

export async function deleteCategory(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Not connected to Supabase');

  const { data: lineItems } = await client.from('line_items').select('id').eq('categoryId', id);
  
  if (lineItems && lineItems.length > 0) {
    throw new Error('Cannot delete category with existing records');
  }
  
  await client.from('categories').delete().eq('id', id);
  
  // Clear categories cache
  categoriesCache = null;
}

export async function updateCategory(id: string, updates: Partial<{ name: string; type: 'income' | 'expense'; isDefault: boolean }>): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Not connected to Supabase');

  const now = new Date();
  
  if (updates.isDefault) {
    // If setting as default, unset other defaults of the same type
    const { data: cat } = await client.from('categories').select('type').eq('id', id).single();
    if (cat) {
      await client.from('categories').update({ isDefault: false }).eq('type', cat.type);
    }
  }

  const { error } = await client.from('categories').update({
    ...updates,
    updatedAt: now,
  }).eq('id', id);
  
  if (error) throw error;
  
  // Clear categories cache
  categoriesCache = null;
}

// Record operations
export async function getRecords(month?: number, year?: number): Promise<Record[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  let query = client.from('records').select(`
    *,
    line_items (*)
  `);
  
  if (month !== undefined && year !== undefined) {
    const startDate = new Date(year, month, 1, 0, 0, 0, 0).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
    query = query.gte('date', startDate).lte('date', endDate);
  } else if (year !== undefined) {
    const startDate = new Date(year, 0, 1, 0, 0, 0, 0).toISOString();
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();
    query = query.gte('date', startDate).lte('date', endDate);
  }
  
  const { data, error } = await query.order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching records:', error);
    return [];
  }
  
  // Transform line_items to lineItems for consistency
  return (data || []).map((record: Record & { line_items: LineItem[] }) => ({
    ...record,
    lineItems: record.line_items || [],
  }));
}

export async function addRecord(
  type: 'income' | 'expense',
  cashAmount: number,
  creditAmount: number,
  date: Date,
  note: string | null,
  lineItems: { name: string; cashAmount: number; creditAmount: number; categoryId: string; imageData?: string; imageName?: string }[]
): Promise<string> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Not connected to Supabase');

  const id = generateId();
  const now = new Date();
  
  const { data: { session } } = await client.auth.getSession();
  const userId = session?.user.id;

  // Check for existing record of same type on this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: existing } = await client
    .from('records')
    .select('id')
    .eq('type', type)
    .gte('date', startOfDay.toISOString())
    .lte('date', endOfDay.toISOString())
    .eq('userId', userId)
    .single();

  if (existing) {
    await updateRecord(existing.id, type, cashAmount, creditAmount, date, note, lineItems);
    return existing.id;
  }

  await client.from('records').insert({
    id,
    type,
    cashAmount,
    creditAmount,
    date: date.toISOString(),
    note,
    userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
  });
  
  if (lineItems.length > 0) {
    const lineItemsToAdd = lineItems.map(item => ({
      id: generateId(),
      name: item.name,
      cashAmount: item.cashAmount,
      creditAmount: item.creditAmount,
      categoryId: item.categoryId,
      recordId: id,
      imageData: item.imageData,
      imageName: item.imageName,
      createdAt: now,
      updatedAt: now,
    }));
    
    await client.from('line_items').insert(lineItemsToAdd);
  }
  
  return id;
}

export async function bulkAddRecords(
  records: {
    type: 'income' | 'expense';
    cashAmount: number;
    creditAmount: number;
    date: Date;
    note: string | null;
    lineItems: { name: string; cashAmount: number; creditAmount: number; categoryId: string; imageData?: string; imageName?: string }[];
  }[]
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Not connected to Supabase');

  const { data: { session } } = await client.auth.getSession();
  const userId = session?.user.id;
  const now = new Date();
  const recordsToInsert: any[] = [];
  const lineItemsToInsert: any[] = [];

  for (const recordData of records) {
    // Check for existing record of same type on this date
    const startOfDay = new Date(recordData.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(recordData.date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: existing } = await client
      .from('records')
      .select('id')
      .eq('type', recordData.type)
      .gte('date', startOfDay.toISOString())
      .lte('date', endOfDay.toISOString())
      .eq('userId', userId)
      .single();

    if (existing) {
      await updateRecord(existing.id, recordData.type, recordData.cashAmount, recordData.creditAmount, recordData.date, recordData.note, recordData.lineItems);
      continue;
    }

    const recordId = generateId();
    recordsToInsert.push({
      id: recordId,
      type: recordData.type,
      cashAmount: recordData.cashAmount,
      creditAmount: recordData.creditAmount,
      date: recordData.date.toISOString(),
      note: recordData.note,
      createdAt: now,
      updatedAt: now,
    });

    if (recordData.lineItems && recordData.lineItems.length > 0) {
      recordData.lineItems.forEach(item => {
        lineItemsToInsert.push({
          id: generateId(),
          name: item.name,
          cashAmount: item.cashAmount,
          creditAmount: item.creditAmount,
          categoryId: item.categoryId,
          recordId: recordId,
          imageData: item.imageData,
          imageName: item.imageName,
          createdAt: now,
          updatedAt: now,
        });
      });
    }
  }

  if (recordsToInsert.length > 0) {
    const { error: recError } = await client.from('records').insert(recordsToInsert);
    if (recError) throw new Error(`Failed to bulk insert records: ${recError.message}`);
  }
  
  if (lineItemsToInsert.length > 0) {
    const { error: liError } = await client.from('line_items').insert(lineItemsToInsert);
    if (liError) throw new Error(`Failed to bulk insert line items: ${liError.message}`);
  }
}

export async function updateRecord(
  id: string,
  type: 'income' | 'expense',
  cashAmount: number,
  creditAmount: number,
  date: Date,
  note: string | null,
  lineItems: { name: string; cashAmount: number; creditAmount: number; categoryId: string; imageData?: string; imageName?: string }[]
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Not connected to Supabase');

  const now = new Date();
  
  const { data: { session } } = await client.auth.getSession();
  const userId = session?.user.id;

  await client.from('records').update({
    type,
    cashAmount,
    creditAmount,
    date: date.toISOString(),
    note,
    updatedBy: userId,
    updatedAt: now,
  }).eq('id', id);
  
  await client.from('line_items').delete().eq('recordId', id);
  
  if (lineItems.length > 0) {
    const lineItemsToAdd = lineItems.map(item => ({
      id: generateId(),
      name: item.name,
      cashAmount: item.cashAmount,
      creditAmount: item.creditAmount,
      categoryId: item.categoryId,
      recordId: id,
      imageData: item.imageData,
      imageName: item.imageName,
      createdAt: now,
      updatedAt: now,
    }));
    
    await client.from('line_items').insert(lineItemsToAdd);
  }
}

export async function deleteRecord(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Not connected to Supabase');

  await client.from('line_items').delete().eq('recordId', id);
  await client.from('records').delete().eq('id', id);
}

// Backup and Restore
export async function createBackup() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Not connected to Supabase');

  const { data: categories } = await client.from('categories').select('*');
  const { data: records } = await client.from('records').select('*');
  const { data: lineItems } = await client.from('line_items').select('*');
  
  return {
    version: '3.0',
    timestamp: new Date().toISOString(),
    source: 'supabase',
    data: {
      categories: categories || [],
      records: records || [],
      lineItems: lineItems || [],
    },
  };
}

export async function restoreBackup(backupData: {
  source?: string;
  data: {
    categories: Category[];
    records: Record[];
    lineItems: LineItem[];
  };
}): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Not connected to Supabase');

  // Basic validation
  if (!backupData || !backupData.data) {
    throw new Error('Invalid backup data');
  }

  try {
    // 1. Clear existing data (in reverse order of dependencies)
    // We don't need .neq('id', '0') because UUIDs are never '0' anyway, and it causes syntax error
    
    // Delete all line items
    const { error: liError } = await client.from('line_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
    // Note: To delete all rows in Supabase without a WHERE clause, you often need to be explicit or use a dummy condition.
    // However, since we have RLS enabled and policies allow delete true, we can try to use a condition that is always true like id IS NOT NULL if supported, or just use a valid UUID for not equal.
    // The previous error was because '0' is not a valid UUID.
    
    // Better approach: Use a valid UUID format for the negative check if we really need a filter,
    // or just rely on RLS policies. But client libraries often block unrestricted deletes.
    // Let's use a condition that matches everything authenticatable via RLS or use a valid UUID.
    
    // Let's try to delete where id is not null (if library supports) or not equal to a dummy valid UUID.
    const dummyUuid = '00000000-0000-0000-0000-000000000000';
    
    const { error: liError2 } = await client.from('line_items').delete().neq('id', dummyUuid);
    if (liError2) throw new Error(`Failed to clear line_items: ${liError2.message}`);

    const { error: recError } = await client.from('records').delete().neq('id', dummyUuid);
    if (recError) throw new Error(`Failed to clear records: ${recError.message}`);

    const { error: catError } = await client.from('categories').delete().neq('id', dummyUuid);
    if (catError) throw new Error(`Failed to clear categories: ${catError.message}`);
    
    // 2. Insert new data
    // Categories
    if (backupData.data.categories?.length > 0) {
      const { error } = await client.from('categories').insert(backupData.data.categories);
      if (error) throw new Error(`Failed to restore categories: ${error.message}`);
    }
    
    // Records
    if (backupData.data.records?.length > 0) {
      // Ensure dates are ISO strings and remove lineItems (which is a relation, not a column)
      const records = backupData.data.records.map(r => {
         
        const { lineItems, ...recordData } = r as any;
        return {
          ...recordData,
          date: typeof r.date === 'string' ? r.date : new Date(r.date).toISOString(),
          createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date(r.createdAt).toISOString(),
          updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date(r.updatedAt).toISOString(),
        };
      });

      const { error } = await client.from('records').insert(records);
      if (error) throw new Error(`Failed to restore records: ${error.message}`);
    }
    
    // Line Items
    if (backupData.data.lineItems?.length > 0) {
       const lineItems = backupData.data.lineItems.map(item => ({
        ...item,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date(item.createdAt).toISOString(),
        updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date(item.updatedAt).toISOString(),
      }));

      const { error } = await client.from('line_items').insert(lineItems);
      if (error) throw new Error(`Failed to restore line_items: ${error.message}`);
    }

  } catch (err) {
    console.error('Restore failed:', err);
    throw err; // Re-throw to be handled by UI
  }
}

// Export functions
export async function exportToJSON(month?: number, year?: number) {
  const records = await getRecords(month, year);
  return {
    exportDate: new Date().toISOString(),
    records,
  };
}

export async function exportToCSV(month?: number, year?: number): Promise<string> {
  const records = await getRecords(month, year);
  const categories = await getCategories();
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  const headers = ['Date', 'Type', 'Item Name', 'Category', 'Cash Amount', 'Credit Amount', 'Total', 'Note'];
  const csvRows = [headers.join(',')];
  
  for (const record of records) {
    const date = new Date(record.date);
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    
    if (record.lineItems.length === 0) {
      const total = (record.cashAmount || 0) + (record.creditAmount || 0);
      const row = [
        formattedDate,
        record.type,
        '',
        '',
        record.cashAmount.toString(),
        record.creditAmount.toString(),
        total.toString(),
        `"${(record.note || '').replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    } else {
      for (const item of record.lineItems) {
        const itemTotal = (item.cashAmount || 0) + (item.creditAmount || 0);
        const row = [
          formattedDate,
          record.type,
          `"${item.name.replace(/"/g, '""')}"`,
          categoryMap.get(item.categoryId) || 'Default',
          item.cashAmount.toString(),
          item.creditAmount.toString(),
          itemTotal.toString(),
          `"${(record.note || '').replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(','));
      }
    }
  }
  
  return csvRows.join('\n');
}

// Clear all data
export async function clearAllData(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Not connected to Supabase');

  await client.from('line_items').delete().neq('id', '0');
  await client.from('records').delete().neq('id', '0');
  await client.from('categories').delete().neq('id', '0');
}

// Profile operations
export async function getProfiles(): Promise<Profile[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  // Check cache
  if (profilesCache && (Date.now() - profilesCache.timestamp < CACHE_TTL)) {
    return profilesCache.data;
  }

  const { data, error } = await client.from('profiles').select('*').order('email');
  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
  
  const result = data || [];
  profilesCache = { data: result, timestamp: Date.now() };
  return result;
}

export async function updateProfile(id: string, updates: Partial<Profile>): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Not connected to Supabase');

  const { error } = await client.from('profiles').update(updates).eq('id', id);
  if (error) throw error;
  
  // Clear caches to ensure fresh data on next fetch
  profilesCache = null;
  currentProfileCache = null;
}

// Promise-based profile cache to prevent race conditions
let currentProfilePromise: Promise<Profile | null> | null = null;

export async function getCurrentProfile(): Promise<Profile | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data: { session } } = await client.auth.getSession();
  if (!session) {
    currentProfileCache = null;
    currentProfilePromise = null;
    return null;
  }

  const userId = session.user.id;

  // Check valid cache first
  if (currentProfileCache && 
      currentProfileCache.userId === userId && 
      (Date.now() - currentProfileCache.timestamp < 3600000)) { // 1 hour TTL
    return currentProfileCache.data;
  }

  // If already fetching, return the existing promise
  if (currentProfilePromise) {
    return currentProfilePromise;
  }

  // Start new fetch and store promise
  currentProfilePromise = (async () => {
    try {
      const { data, error } = await client.from('profiles').select('*').eq('id', userId).single();
      if (error) {
        console.error('Error fetching current profile:', error);
        return null;
      }
      
      currentProfileCache = { data, userId, timestamp: Date.now() };
      return data;
    } finally {
      // Keep promise for a short while to catch rapid successive calls even if first failed,
      // but the cache above is the primary long-term storage.
      // We clear the promise after completion so next call (after TTL) can refetch.
      currentProfilePromise = null;
    }
  })();

  return currentProfilePromise;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  // Check cache
  if (logsCache && (Date.now() - logsCache.timestamp < CACHE_TTL)) {
    return logsCache.data;
  }

  const { data: logs, error } = await client
    .from('audit_logs')
    .select('*')
    .order('createdAt', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching logs. Full error:', error);
    console.error('Error message:', error.message);
    return [];
  }

  // Manually fetch emails to avoid "more than one relationship" join error
  const userIds = [...new Set((logs || []).map(log => log.userId).filter(Boolean))];
  
  let result: AuditLog[] = [];

  if (userIds.length > 0) {
    const { data: profiles } = await client
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    if (profiles) {
      const emailMap = new Map(profiles.map(p => [p.id, p.email]));
      result = (logs || []).map(log => ({
        ...log,
        user_email: emailMap.get(log.userId) || 'System'
      }));
    } else {
      result = (logs || []).map(log => ({ ...log, user_email: 'System' }));
    }
  } else {
    result = (logs || []).map(log => ({ ...log, user_email: 'System' }));
  }

  logsCache = { data: result, timestamp: Date.now() };
  return result;
}

// Clear cache helper
export function clearAdminCache() {
  profilesCache = null;
  logsCache = null;
  currentProfileCache = null;
  categoriesCache = null;
}

// Clear categories cache (call when categories are modified)
export function clearCategoriesCache() {
  categoriesCache = null;
}

// Clear current profile cache (call when user logs out or profile is updated)
export function clearCurrentProfileCache() {
  currentProfileCache = null;
}

export async function createLog(action: string, details: any): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const { data: { session } } = await client.auth.getSession();
  if (!session) return;

  await client.from('audit_logs').insert({
    userId: session.user.id,
    action,
    details
  });
}

// Test connection
export { testSupabaseConnection };
