import { env } from 'next-runtime-env';

export const API_VERSION = env('NEXT_PUBLIC_API_VERSION') ?? 'api/v1'
export const API_URL = env('NEXT_PUBLIC_API_URL') ?? 'http://localhost:3000'
