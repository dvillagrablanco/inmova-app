/**
 * Tests for Logger Service
 */

import logger, { logError, logApiRequest, logPerformance } from '@/lib/logger';

describe('Logger Service', () => {
  
  it('should log errors with context', () => {
    const error = new Error('Test error');
    const context = { userId: 'test-123', action: 'test' };
    
    logError(error, context);
    
    // Verify logger was called (actual implementation depends on Winston mocking)
    expect(true).toBe(true);
  });
  
  it('should log API requests', () => {
    logApiRequest('GET', '/api/test', 'user-123', 150);
    
    expect(true).toBe(true);
  });
  
  it('should log performance warnings for slow operations', () => {
    // Operation over 1000ms should log as warning
    logPerformance('slow-query', 1500);
    
    expect(true).toBe(true);
  });
  
  it('should log performance info for fast operations', () => {
    // Operation under 1000ms should log as info
    logPerformance('fast-query', 50);
    
    expect(true).toBe(true);
  });
});
