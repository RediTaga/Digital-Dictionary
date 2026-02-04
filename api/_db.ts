import { neon } from '@neondatabase/serverless';

/**
 * Neon serverless driver (HTTP) query helper.
 *
 * This uses the DATABASE_URL environment variable configured in Vercel.
 */
export const sql = neon(process.env.DATABASE_URL as string);
