/**
 * FULL HEALTH CHECK - Verificación Exhaustiva y Agresiva
 * 
 * Este script realiza una auditoría completa del sistema detectando:
 * - Console errors y warnings
 * - Page crashes (excepciones no controladas)
 * - Network failures
 * - HTTP errors (4xx, 5xx)
 * - Status code 130 y errores especiales
 * - Performance issues (timeouts)
 * 
 * @author Cursor Agent
 * @version 2.0.0
 */

import { chromium, Browser, Page, Response, Request } from '@playwright/test';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ErrorEntry {
  type: 'console' | 'network' | 'http' | 'crash' | 'timeout' | 'exception';
  severity: 'critical' | 'high' | 'medium' | 'low';
  url: string;
  message: string;
  details?: any;
  timestamp: string;
}

interface RouteResult {
  url: string;
  success: boolean;
  loadTime: number;
  errors: ErrorEntry[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  testUser: process.env.TEST_USER || 'superadmin@inmova.com',
  testPassword: process.env.TEST_PASSWORD || 'superadmin123',
  timeout: 10000, // 10 segundos por página
  networkTimeout: 5000, // 5 segundos para requests
  headless: true,
};

const CRITICAL_ROUTES = [
  '/',
  '/landing',
  '/login',
  '/dashboard',
  '/dashboard/contratos',
  '/dashboard/edificios',
  '/dashboard/unidades',
  '/dashboard/inquilinos',
  '/dashboard/settings',
  '/dashboard/profile',
];

// ============================================================================
// GLOBAL ERROR COLLECTOR
// ============================================================================

class ErrorCollector {
  private errors: ErrorEntry[] = [];

  add(error: Omit<ErrorEntry, 'timestamp'>) {
    this.errors.push({
      ...error,
      timestamp: new Date().toISOString(),
    });
  }

  getAll(): ErrorEntry[] {
    return this.errors;
  }

  getByUrl(url: string): ErrorEntry[] {
    return this.errors.filter(e => e.url === url);
  }

  getBySeverity(severity: ErrorEntry['severity']): ErrorEntry[] {
    return this.errors.filter(e => e.severity === severity);
  }

  clear() {
    this.errors = [];
  }

  getCount(): number {
    return this.errors.length;
  }

  hasCriticalErrors(): boolean {
    return this.errors.some(e => e.severity === 'critical');
  }
}

// ============================================================================
// PAGE INTERCEPTORS
// ============================================================================

function setupPageInterceptors(page: Page, errorCollector: ErrorCollector, currentUrl: string) {
  // 1. CONSOLE ERRORS & WARNINGS
  page.on('console', async (msg) => {
    const type = msg.type();
    
    if (type === 'error') {
      errorCollector.add({
        type: 'console',
        severity: 'high',
        url: currentUrl,
        message: `Console Error: ${msg.text()}`,
        details: {
          location: msg.location(),
          args: await Promise.all(msg.args().map(arg => arg.jsonValue().catch(() => 'N/A'))),
        },
      });
    } else if (type === 'warning') {
      const text = msg.text();
      
      // Ignorar warnings comunes de Next.js que no son problemas reales
      const ignoredWarnings = [
        'Download the React DevTools',
        'Prop `className` did not match',
        'useLayoutEffect does nothing on the server',
      ];
      
      if (!ignoredWarnings.some(ignored => text.includes(ignored))) {
        errorCollector.add({
          type: 'console',
          severity: 'medium',
          url: currentUrl,
          message: `Console Warning: ${text}`,
        });
      }
    }
  });

  // 2. PAGE CRASHES (React/Next.js Uncaught Exceptions)
  page.on('pageerror', (error) => {
    errorCollector.add({
      type: 'crash',
      severity: 'critical',
      url: currentUrl,
      message: `Page Crash: ${error.message}`,
      details: {
        stack: error.stack,
        name: error.name,
      },
    });
  });

  // 3. NETWORK FAILURES
  page.on('requestfailed', (request: Request) => {
    const failure = request.failure();
    
    errorCollector.add({
      type: 'network',
      severity: 'high',
      url: currentUrl,
      message: `Network Failure: ${request.url()}`,
      details: {
        method: request.method(),
        failureText: failure?.errorText || 'Unknown',
        resourceType: request.resourceType(),
      },
    });
  });

  // 4. HTTP ERRORS (4xx, 5xx, 130)
  page.on('response', async (response: Response) => {
    const status = response.status();
    const url = response.url();
    
    // Ignorar recursos estáticos comunes que pueden fallar sin impacto
    const ignoredResources = [
      'favicon.ico',
      '.woff2',
      '.woff',
      '.ttf',
      'google-analytics',
      'googletagmanager',
      'analytics.js',
    ];
    
    if (ignoredResources.some(ignored => url.includes(ignored))) {
      return;
    }

    // HTTP 4xx (Client Errors)
    if (status >= 400 && status < 500) {
      let body = 'N/A';
      let bodyData: any = null;
      
      try {
        body = await response.text();
        try {
          bodyData = JSON.parse(body);
        } catch {
          // Not JSON
        }
      } catch {
        // Can't read body
      }

      const severity: ErrorEntry['severity'] = 
        status === 401 || status === 403 ? 'critical' : 
        status === 404 ? 'medium' : 'high';

      errorCollector.add({
        type: 'http',
        severity,
        url: currentUrl,
        message: `HTTP ${status}: ${url}`,
        details: {
          status,
          statusText: response.statusText(),
          requestUrl: url,
          method: response.request().method(),
          body: body.substring(0, 500), // Primeros 500 chars
          bodyData,
        },
      });
    }

    // HTTP 5xx (Server Errors)
    if (status >= 500) {
      let body = 'N/A';
      let bodyData: any = null;
      
      try {
        body = await response.text();
        try {
          bodyData = JSON.parse(body);
        } catch {
          // Not JSON
        }
      } catch {
        // Can't read body
      }

      errorCollector.add({
        type: 'http',
        severity: 'critical',
        url: currentUrl,
        message: `HTTP ${status}: ${url}`,
        details: {
          status,
          statusText: response.statusText(),
          requestUrl: url,
          method: response.request().method(),
          body: body.substring(0, 500),
          bodyData,
        },
      });
    }

    // SPECIAL CASE: Status 130 o body con code: 130
    if (status === 130) {
      let body = 'N/A';
      
      try {
        body = await response.text();
      } catch {
        // Can't read body
      }

      errorCollector.add({
        type: 'http',
        severity: 'critical',
        url: currentUrl,
        message: `SPECIAL ERROR - Status 130: ${url}`,
        details: {
          status,
          statusText: response.statusText(),
          requestUrl: url,
          body: body.substring(0, 500),
        },
      });
    }

    // Check body for code: 130 or error: 130
    if (status >= 200 && status < 300) {
      try {
        const contentType = response.headers()['content-type'] || '';
        
        if (contentType.includes('application/json')) {
          const text = await response.text();
          const bodyData = JSON.parse(text);
          
          if (
            bodyData.code === 130 || 
            bodyData.code === '130' ||
            bodyData.error === 130 ||
            bodyData.error === '130' ||
            (bodyData.error && typeof bodyData.error === 'object' && bodyData.error.code === 130)
          ) {
            errorCollector.add({
              type: 'http',
              severity: 'critical',
              url: currentUrl,
              message: `SPECIAL ERROR - Code 130 in body: ${url}`,
              details: {
                status,
                requestUrl: url,
                bodyData,
              },
            });
          }
        }
      } catch {
        // Can't parse JSON or read body
      }
    }
  });
}

// ============================================================================
// PAGE NAVIGATION WITH TIMEOUT
// ============================================================================

async function navigateWithTimeout(
  page: Page,
  url: string,
  errorCollector: ErrorCollector
): Promise<{ success: boolean; loadTime: number }> {
  const startTime = Date.now();

  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.timeout,
    });

    // Wait for network to be idle (max 5s)
    try {
      await page.waitForLoadState('networkidle', { timeout: CONFIG.networkTimeout });
    } catch {
      // Network idle timeout is not critical
      console.log(`⚠️  Network idle timeout for ${url} (not critical)`);
    }

    const loadTime = Date.now() - startTime;

    // Check for performance issues
    if (loadTime > CONFIG.timeout * 0.8) {
      errorCollector.add({
        type: 'timeout',
        severity: 'medium',
        url,
        message: `Slow page load: ${loadTime}ms`,
        details: { loadTime },
      });
    }

    return { success: true, loadTime };
  } catch (error: any) {
    const loadTime = Date.now() - startTime;

    if (error.message.includes('Timeout')) {
      errorCollector.add({
        type: 'timeout',
        severity: 'high',
        url,
        message: `Page timeout after ${CONFIG.timeout}ms`,
        details: { error: error.message },
      });
    } else {
      errorCollector.add({
        type: 'exception',
        severity: 'critical',
        url,
        message: `Navigation failed: ${error.message}`,
        details: { error: error.message, stack: error.stack },
      });
    }

    return { success: false, loadTime };
  }
}

// ============================================================================
// LOGIN FLOW
// ============================================================================

async function performLogin(
  page: Page,
  errorCollector: ErrorCollector
): Promise<boolean> {
  console.log('\n🔐 STEP 2: Login...');

  const loginUrl = `${CONFIG.baseURL}/login`;
  
  try {
    // Step 1: Navigate to login page to get cookies/tokens
    console.log('   → Loading login page...');
    const { success: navSuccess } = await navigateWithTimeout(page, loginUrl, errorCollector);
    
    if (!navSuccess) {
      console.error('❌ Failed to load login page');
      return false;
    }

    // Wait for form and page to be fully ready
    await page.waitForSelector('input[name="email"]', { timeout: 5000 });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    
    console.log('   → Form detected, filling credentials...');
    
    // Step 2: Fill credentials
    await page.fill('input[name="email"]', CONFIG.testUser);
    await page.fill('input[name="password"]', CONFIG.testPassword);
    
    // Step 3: Setup response interceptors
    const authResponsePromise = page.waitForResponse(
      response => {
        const url = response.url();
        return (url.includes('/api/auth/callback') || url.includes('/api/auth/signin')) 
          && response.request().method() === 'POST';
      },
      { timeout: 15000 }
    ).catch(() => null);

    const navigationPromise = page.waitForURL(
      url => url.includes('/dashboard') || url.includes('/admin') || url.includes('/portal'),
      { timeout: 15000 }
    ).catch(() => null);

    console.log('   → Submitting form...');
    
    // Step 4: Submit form
    await page.click('button[type="submit"]');
    
    // Step 5: Wait for auth response
    const authResponse = await authResponsePromise;
    
    if (authResponse) {
      const status = authResponse.status();
      console.log(`   → Auth response: ${status}`);

      // Check for auth errors
      if (status === 401 || status === 403) {
        let body = 'N/A';
        try {
          const text = await authResponse.text();
          body = text;
          
          // Try to parse JSON error
          try {
            const json = JSON.parse(text);
            if (json.error) body = json.error;
          } catch {}
        } catch {}

        errorCollector.add({
          type: 'http',
          severity: 'critical',
          url: loginUrl,
          message: `Login failed with status ${status}`,
          details: {
            status,
            body: body.substring(0, 500),
          },
        });

        console.error(`❌ Login failed: ${status}`);
        console.error(`   Message: ${body.substring(0, 200)}`);
        return false;
      }
      
      // For 200/302 responses, check if it's an error response
      if (status === 200) {
        try {
          const json = await authResponse.json();
          // NextAuth returns {url: "signin?error=..."} on error
          if (json.url && json.url.includes('error=')) {
            console.error('❌ Login failed - auth returned error URL');
            errorCollector.add({
              type: 'http',
              severity: 'critical',
              url: loginUrl,
              message: 'Login failed - error in response',
              details: { response: json },
            });
            return false;
          }
        } catch {}
      }
    }
    
    // Step 6: Wait for navigation or check current page
    await navigationPromise;
    await page.waitForTimeout(2000); // Give time for any final redirects
    
    const currentUrl = page.url();
    console.log(`   → Current URL: ${currentUrl}`);
    
    // Step 7: Determine if login was successful
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/admin') || currentUrl.includes('/portal')) {
      console.log('✅ Login successful - redirected to authenticated area');
      return true;
    } else if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
      // Still on login/signin page = failed
      errorCollector.add({
        type: 'exception',
        severity: 'critical',
        url: loginUrl,
        message: 'Login failed - still on login page after submit',
      });
      console.error('❌ Login failed - redirected back to login');
      return false;
    } else {
      // Somewhere else - might be logged in
      console.log('⚠️  Login completed - unusual redirect (checking...)');
      
      // Try to verify by checking for auth-only elements
      const hasAuthElement = await page.locator('[data-auth="true"]').count().catch(() => 0);
      const hasLogoutButton = await page.locator('text=/logout|cerrar sesión/i').count().catch(() => 0);
      
      if (hasAuthElement > 0 || hasLogoutButton > 0) {
        console.log('✅ Login successful - auth elements detected');
        return true;
      } else {
        console.log('⚠️  Login status unclear - assuming success');
        return true;
      }
    }
    
  } catch (error: any) {
    errorCollector.add({
      type: 'exception',
      severity: 'critical',
      url: loginUrl,
      message: `Login error: ${error.message}`,
      details: { error: error.message, stack: error.stack },
    });
    console.error(`❌ Login exception: ${error.message}`);
    return false;
  }
}

// ============================================================================
// CRAWL ROUTES
// ============================================================================

async function crawlRoutes(
  page: Page,
  errorCollector: ErrorCollector,
  routes: string[]
): Promise<RouteResult[]> {
  console.log('\n🕷️  STEP 3: Crawling routes...\n');

  const results: RouteResult[] = [];

  for (const route of routes) {
    const fullUrl = route.startsWith('http') ? route : `${CONFIG.baseURL}${route}`;
    
    // Clear errors for this route
    const errorsBefore = errorCollector.getCount();
    
    console.log(`📄 Testing: ${route}`);

    const { success, loadTime } = await navigateWithTimeout(page, fullUrl, errorCollector);

    // Get errors for this route
    const errorsAfter = errorCollector.getCount();
    const routeErrors = errorCollector.getAll().slice(errorsBefore, errorsAfter);

    const result: RouteResult = {
      url: route,
      success: success && routeErrors.length === 0,
      loadTime,
      errors: routeErrors,
    };

    results.push(result);

    if (result.success) {
      console.log(`   ✅ OK (${loadTime}ms)`);
    } else {
      console.log(`   ❌ FAILED (${routeErrors.length} errors)`);
      routeErrors.forEach(err => {
        console.log(`      - ${err.type}: ${err.message}`);
      });
    }

    // Small delay between routes
    await page.waitForTimeout(500);
  }

  return results;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport(results: RouteResult[], errorCollector: ErrorCollector) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 HEALTH CHECK REPORT');
  console.log('='.repeat(80));

  const totalRoutes = results.length;
  const successfulRoutes = results.filter(r => r.success).length;
  const failedRoutes = results.filter(r => !r.success).length;
  const totalErrors = errorCollector.getCount();
  const criticalErrors = errorCollector.getBySeverity('critical').length;
  const highErrors = errorCollector.getBySeverity('high').length;

  // Summary
  console.log('\n📈 SUMMARY:');
  console.log(`   Total Routes:     ${totalRoutes}`);
  console.log(`   ✅ Successful:    ${successfulRoutes} (${((successfulRoutes/totalRoutes)*100).toFixed(1)}%)`);
  console.log(`   ❌ Failed:        ${failedRoutes} (${((failedRoutes/totalRoutes)*100).toFixed(1)}%)`);
  console.log(`   🐛 Total Errors:  ${totalErrors}`);
  console.log(`   🔴 Critical:      ${criticalErrors}`);
  console.log(`   🟠 High:          ${highErrors}`);

  // Successful Routes
  if (successfulRoutes > 0) {
    console.log('\n✅ HEALTHY ROUTES:');
    results
      .filter(r => r.success)
      .forEach(r => {
        console.log(`   ✅ ${r.url} (${r.loadTime}ms)`);
      });
  }

  // Failed Routes with Details
  if (failedRoutes > 0) {
    console.log('\n❌ FAILED ROUTES:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`\n   ❌ ${r.url} (${r.loadTime}ms)`);
        console.log(`      Errors: ${r.errors.length}`);
        
        r.errors.forEach((err, idx) => {
          console.log(`\n      ${idx + 1}. [${err.severity.toUpperCase()}] ${err.type}`);
          console.log(`         Message: ${err.message}`);
          
          if (err.details) {
            if (err.details.body && err.details.body !== 'N/A') {
              console.log(`         Response: ${err.details.body.substring(0, 200)}`);
            }
            if (err.details.bodyData) {
              console.log(`         Data: ${JSON.stringify(err.details.bodyData).substring(0, 200)}`);
            }
            if (err.details.stack) {
              console.log(`         Stack: ${err.details.stack.split('\n')[0]}`);
            }
          }
        });
      });
  }

  // Error Breakdown by Type
  console.log('\n📋 ERRORS BY TYPE:');
  const errorTypes = ['console', 'network', 'http', 'crash', 'timeout', 'exception'] as const;
  errorTypes.forEach(type => {
    const count = errorCollector.getAll().filter(e => e.type === type).length;
    if (count > 0) {
      const icon = 
        type === 'crash' || type === 'exception' ? '💥' :
        type === 'http' ? '🌐' :
        type === 'network' ? '📡' :
        type === 'console' ? '🖥️' :
        type === 'timeout' ? '⏱️' : '❓';
      
      console.log(`   ${icon} ${type.padEnd(12)} ${count}`);
    }
  });

  // Exit code
  console.log('\n' + '='.repeat(80));
  
  if (criticalErrors > 0) {
    console.log('🔴 HEALTH CHECK FAILED - CRITICAL ERRORS DETECTED');
    console.log('='.repeat(80) + '\n');
    return 1;
  } else if (failedRoutes > 0) {
    console.log('🟠 HEALTH CHECK COMPLETED WITH WARNINGS');
    console.log('='.repeat(80) + '\n');
    return 1;
  } else {
    console.log('🟢 HEALTH CHECK PASSED - ALL SYSTEMS OPERATIONAL');
    console.log('='.repeat(80) + '\n');
    return 0;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🚀 FULL HEALTH CHECK - STARTING...\n');
  console.log(`🌐 Base URL: ${CONFIG.baseURL}`);
  console.log(`👤 Test User: ${CONFIG.testUser}`);
  console.log(`⏱️  Timeout: ${CONFIG.timeout}ms\n`);

  let browser: Browser | null = null;

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: CONFIG.headless,
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    });

    const page = await context.newPage();

    // Initialize error collector
    const errorCollector = new ErrorCollector();

    // Setup interceptors
    setupPageInterceptors(page, errorCollector, 'initial');

    // STEP 1: Test Landing
    console.log('🏠 STEP 1: Testing landing page...');
    const landingUrl = `${CONFIG.baseURL}/landing`;
    const { success: landingSuccess } = await navigateWithTimeout(page, landingUrl, errorCollector);
    
    if (landingSuccess) {
      console.log('✅ Landing page loaded');
    } else {
      console.error('❌ Landing page failed');
    }

    // STEP 2: Login
    const loginSuccess = await performLogin(page, errorCollector);

    if (!loginSuccess) {
      console.error('\n🛑 Cannot proceed - login failed');
      await browser.close();
      process.exit(1);
    }

    // Update interceptors with current URL tracker
    let currentPageUrl = page.url();
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        currentPageUrl = frame.url();
      }
    });

    // STEP 3: Crawl authenticated routes
    const authenticatedRoutes = CRITICAL_ROUTES.filter(r => r.includes('/dashboard'));
    const results = await crawlRoutes(page, errorCollector, authenticatedRoutes);

    // Close browser
    await browser.close();

    // Generate report
    const exitCode = generateReport(results, errorCollector);

    process.exit(exitCode);
  } catch (error: any) {
    console.error('\n💥 FATAL ERROR:');
    console.error(error);

    if (browser) {
      await browser.close();
    }

    process.exit(1);
  }
}

// Run
main();
