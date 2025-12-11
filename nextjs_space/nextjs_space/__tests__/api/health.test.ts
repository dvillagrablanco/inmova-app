import { NextRequest } from 'next/server';
import { GET } from '@/app/api/health/route';

describe('/api/health', () => {
  it('returns 200 OK status', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
  });

  it('returns status OK and version', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();
    
    expect(data.status).toBe('OK');
    expect(data.version).toBeDefined();
  });

  it('includes timestamp in response', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();
    
    expect(data.timestamp).toBeDefined();
    expect(typeof data.timestamp).toBe('string');
  });
});
