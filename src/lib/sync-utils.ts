
import { db } from './client-db';
import { getSupabaseClient } from './supabase';
import { devLog } from './utils';

/**
 * Syncs all data from Local Database (Dexie) to Supabase.
 * This is a one-way sync: Local -> Supabase.
 * It attempts to preserve IDs, but will treat conflicts as "already exists" and skip or update.
 * For this version, we will UPSERT (update if exists) to ensure latest data.
 */
export async function syncLocalToSupabase() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Not connected to Supabase');
  }

  try {
    // 1. Fetch all local data
    const categories = await db.categories.toArray();
    const records = await db.records.toArray();
    const lineItems = await db.lineItems.toArray();

    devLog('Syncing:', { 
      categories: categories.length, 
      records: records.length, 
      lineItems: lineItems.length 
    });

    // 2. Sync Categories
    if (categories.length > 0) {
      const { error: catError } = await client
        .from('categories')
        .upsert(categories, { onConflict: 'id' });
      
      if (catError) {
        console.error('[Sync] Categories error');
        throw new Error('Failed to sync categories');
      }
    }

    // 3. Sync Records
    // We need to chunk records if there are too many, but Supabase handles reasonable batch sizes.
    // Let's do batches of 100 just in case.
    if (records.length > 0) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        // We need to ensure date format is compatible (ISO string), which it should be from Dexie if stored as string/Date
        // Dexie stores Date objects, Supabase expects ISO strings.
        const formattedBatch = batch.map(r => ({
          ...r,
          date: new Date(r.date).toISOString(),
          createdAt: new Date(r.createdAt).toISOString(),
          updatedAt: new Date(r.updatedAt).toISOString(),
        }));

        const { error: recError } = await client
          .from('records')
          .upsert(formattedBatch, { onConflict: 'id' });
        
        if (recError) {
          console.error('[Sync] Records batch error');
          throw new Error('Failed to sync records');
        }
      }
    }

    // 4. Sync Line Items
    if (lineItems.length > 0) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < lineItems.length; i += BATCH_SIZE) {
        const batch = lineItems.slice(i, i + BATCH_SIZE);
        const formattedBatch = batch.map(item => ({
            ...item,
            createdAt: new Date(item.createdAt).toISOString(),
            updatedAt: new Date(item.updatedAt).toISOString(),
        }));

        const { error: liError } = await client
          .from('line_items')
          .upsert(formattedBatch, { onConflict: 'id' });
        
        if (liError) {
          console.error('[Sync] Line items batch error');
          throw new Error('Failed to sync line items');
        }
      }
    }

    return { success: true, count: { 
      categories: categories.length, 
      records: records.length, 
      lineItems: lineItems.length 
    }};

  } catch (error) {
    console.error('[Sync] Failed');
    return { success: false, error: 'Sync failed. Please try again.' };
  }
}
