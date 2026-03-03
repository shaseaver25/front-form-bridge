/**
 * Untyped Supabase client for tables not yet in the generated types.
 * 
 * Usage:
 *   import { db } from "@/integrations/supabase/db";
 *   const { data } = await db.from("some_table").select("*");
 * 
 * Once the types.ts is regenerated with all tables, migrate
 * these usages back to the typed `supabase` client.
 */
import { supabase } from './client';

export const db = supabase as any;
