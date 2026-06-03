import { createClient } from '@vercel/kv';

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.STORAGE_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.STORAGE_TOKEN;

export const kv = (url && token) 
  ? createClient({ url, token }) 
  : { 
      get: async () => { throw new Error('Database not configured'); },
      set: async () => { throw new Error('Database not configured'); }
    };
