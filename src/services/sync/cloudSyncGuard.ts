let suppressedDepth = 0;

export function isCloudSyncSuppressed(): boolean {
  return suppressedDepth > 0;
}

export async function withCloudSyncSuppressed<T>(fn: () => Promise<T>): Promise<T> {
  suppressedDepth++;
  try {
    return await fn();
  } finally {
    suppressedDepth--;
  }
}
