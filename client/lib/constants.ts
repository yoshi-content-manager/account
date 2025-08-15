import { unstable_noStore as noStore } from 'next/cache';
noStore();

export const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'api/v1'
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
