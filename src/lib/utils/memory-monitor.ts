/**
 * Memory usage monitor
 * Helps track memory usage and identify potential memory leaks
 */

// Only run on server
if (typeof window === 'undefined') {
  // Start monitoring memory usage
  const memoryMonitor = setInterval(() => {
    try {
      const memoryUsage = process.memoryUsage();
      
      // Convert to MB for readability
      const formatMemory = (bytes: number) => Math.round(bytes / 1024 / 1024);
      
      // Log memory usage every 5 minutes or when RSS is high
      const rssInMB = formatMemory(memoryUsage.rss);
      const heapTotalInMB = formatMemory(memoryUsage.heapTotal);
      const heapUsedInMB = formatMemory(memoryUsage.heapUsed);
      
      // Log if memory usage is high or every 5 minutes
      if (rssInMB > 500 || Math.random() < 0.01) { // ~1% chance to log (approx every 5 mins with 3s interval)
        console.log(`Memory usage - RSS: ${rssInMB} MB, Heap Total: ${heapTotalInMB} MB, Heap Used: ${heapUsedInMB} MB`);
        
        // If memory usage is very high, force garbage collection if possible
        if (rssInMB > 1000 && global.gc) {
          console.log('Memory usage is high, forcing garbage collection');
          global.gc();
        }
      }
    } catch (error) {
      // Ignore errors in memory monitoring
    }
  }, 3000); // Check every 3 seconds
  
  // Clean up on process exit
  process.on('exit', () => {
    clearInterval(memoryMonitor);
  });
  
  // Handle SIGTERM gracefully
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, cleaning up...');
    clearInterval(memoryMonitor);
    process.exit(0);
  });
}

// Export a dummy function to allow importing this file
export function initMemoryMonitor() {
  // Memory monitor is initialized automatically
  return true;
}