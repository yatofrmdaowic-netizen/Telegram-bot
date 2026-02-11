const stats = {
  totalRequests: 0,
  success: 0,
  failed: 0
};

export function logSuccess() {
  stats.totalRequests++;
  stats.success++;
}

export function logFailure() {
  stats.totalRequests++;
  stats.failed++;
}

export function getStats() {
  return stats;
}
