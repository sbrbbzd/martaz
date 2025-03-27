/**
 * Supabase client for frontend
 * 
 * This module provides a Supabase client instance that can be imported
 * and used throughout the frontend application.
 */

import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single instance of the Supabase client to be used across the app
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: fetch.bind(globalThis),
  },
});

export default supabase;

/**
 * Example usage:
 * 
 * import supabase from '@/lib/supabase';
 * 
 * // Query data
 * const { data, error } = await supabase
 *   .from('listings')
 *   .select('*')
 *   .eq('status', 'active');
 * 
 * // Insert data
 * const { data, error } = await supabase
 *   .from('listings')
 *   .insert([{ 
 *     title: 'New Listing', 
 *     price: 100,
 *     // other fields... 
 *   }]);
 * 
 * // Upload file to storage
 * const { data, error } = await supabase.storage
 *   .from('images')
 *   .upload('path/to/file.jpg', file);
 */
