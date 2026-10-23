// src/utils/logger.ts
export function logWithDate(context: string, message: string) {
  const now = new Date();
  // Formato legible: YYYY-MM-DD HH:mm:ss
  const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${timestamp}] [${context}] ${message}`);
}