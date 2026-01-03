/**
 * ANALYTICS SERVICE - COMPREHENSIVE UNIT TESTS
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  trackEvent,
  trackPageView,
  trackOnboardingStart,
  trackOnboardingTaskComplete,
  trackOnboardingTaskSkip,
  trackOnboardingComplete,
} from '@/lib/analytics-service';

describe('📊 Analytics Service - Client-Side Tracking', () => {
  let mockGtag: ReturnType<typeof vi.fn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockGtag = vi.fn();
    (global as any).window = {
      gtag: mockGtag,
    };
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    delete (global as any).window;
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  test('✅ trackEvent() debe enviar evento a gtag', () => {
    trackEvent('test_event', { param1: 'value1' });

    expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', { param1: 'value1' });
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  test('✅ trackEvent() sin parámetros', () => {
    trackEvent('simple_event');

    expect(mockGtag).toHaveBeenCalledWith('event', 'simple_event', undefined);
  });

  test('❌ trackEvent() cuando gtag no está disponible', () => {
    delete (global as any).window.gtag;

    trackEvent('test_event');

    expect(consoleWarnSpy).toHaveBeenCalledWith('[Analytics] gtag not available');
  });

  test('✅ trackPageView() debe enviar page_view', () => {
    (global as any).document = { title: 'Test Page' };

    trackPageView('/test-page');

    expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
      page_path: '/test-page',
      page_title: 'Test Page',
    });

    delete (global as any).document;
  });

  test('✅ trackPageView() con título personalizado', () => {
    (global as any).document = { title: 'Default' };

    trackPageView('/test', 'Custom Title');

    expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
      page_path: '/test',
      page_title: 'Custom Title',
    });

    delete (global as any).document;
  });
});

describe('📊 Analytics Service - Onboarding Events', () => {
  let mockGtag: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGtag = vi.fn();
    (global as any).window = { gtag: mockGtag };
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    delete (global as any).window;
    vi.restoreAllMocks();
  });

  test('✅ trackOnboardingStart() debe enviar datos correctos', () => {
    trackOnboardingStart('user-123', 'property-management', 'beginner');

    expect(mockGtag).toHaveBeenCalledWith('event', 'onboarding_start', {
      user_id: 'user-123',
      vertical: 'property-management',
      experience_level: 'beginner',
    });
  });

  test('✅ trackOnboardingStart() sin parámetros opcionales', () => {
    trackOnboardingStart('user-456');

    expect(mockGtag).toHaveBeenCalledWith('event', 'onboarding_start', {
      user_id: 'user-456',
      vertical: undefined,
      experience_level: undefined,
    });
  });

  test('✅ trackOnboardingTaskComplete() debe enviar progreso', () => {
    trackOnboardingTaskComplete('task-1', 'Setup Profile', 50);

    expect(mockGtag).toHaveBeenCalledWith('event', 'onboarding_task_complete', {
      task_id: 'task-1',
      task_title: 'Setup Profile',
      progress_percentage: 50,
    });
  });

  test('✅ trackOnboardingTaskSkip() debe registrar skip', () => {
    trackOnboardingTaskSkip('task-2', 'Optional Task', 75);

    expect(mockGtag).toHaveBeenCalledWith('event', 'onboarding_task_skip', {
      task_id: 'task-2',
      task_title: 'Optional Task',
      progress_percentage: 75,
    });
  });

  test('✅ trackOnboardingComplete() debe enviar completion', () => {
    trackOnboardingComplete('user-789', 300, 5);

    expect(mockGtag).toHaveBeenCalledWith('event', 'onboarding_complete', {
      user_id: 'user-789',
      time_spent: 300,
      tasks_completed: 5,
    });
  });

  test('⚠️ trackOnboardingTaskComplete() con progreso 0', () => {
    trackOnboardingTaskComplete('task-0', 'Start', 0);

    expect(mockGtag).toHaveBeenCalledWith('event', 'onboarding_task_complete', {
      task_id: 'task-0',
      task_title: 'Start',
      progress_percentage: 0,
    });
  });

  test('⚠️ trackOnboardingTaskComplete() con progreso 100', () => {
    trackOnboardingTaskComplete('task-final', 'Finish', 100);

    expect(mockGtag).toHaveBeenCalledWith('event', 'onboarding_task_complete', {
      task_id: 'task-final',
      task_title: 'Finish',
      progress_percentage: 100,
    });
  });

  test('⚠️ trackOnboardingComplete() con tiempo 0', () => {
    trackOnboardingComplete('user-fast', 0, 5);

    expect(mockGtag).toHaveBeenCalled();
  });

  test('⚠️ trackOnboardingComplete() con 0 tareas', () => {
    trackOnboardingComplete('user-skip-all', 100, 0);

    expect(mockGtag).toHaveBeenCalled();
  });
});

describe('📊 Analytics Service - Edge Cases', () => {
  beforeEach(() => {
    (global as any).window = { gtag: vi.fn() };
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    delete (global as any).window;
    vi.restoreAllMocks();
  });

  test('⚠️ trackEvent() con eventos muy largos', () => {
    const longEvent = 'a'.repeat(500);
    trackEvent(longEvent);

    expect((global as any).window.gtag).toHaveBeenCalled();
  });

  test('⚠️ trackEvent() con parámetros complejos', () => {
    const complexParams = {
      nested: { deep: { value: 'test' } },
      array: [1, 2, 3],
      null: null,
      undefined: undefined,
    };

    trackEvent('complex_event', complexParams);

    expect((global as any).window.gtag).toHaveBeenCalledWith(
      'event',
      'complex_event',
      complexParams
    );
  });

  test('⚠️ trackPageView() con URLs especiales', () => {
    (global as any).document = { title: 'Test' };

    trackPageView('/path?query=1&foo=bar#anchor');

    expect((global as any).window.gtag).toHaveBeenCalled();

    delete (global as any).document;
  });

  test('⚠️ trackPageView() con caracteres especiales en título', () => {
    (global as any).document = { title: 'Test' };

    trackPageView('/test', 'Title with émojis 🎉 and symbols €$');

    expect((global as any).window.gtag).toHaveBeenCalledWith('event', 'page_view', {
      page_path: '/test',
      page_title: 'Title with émojis 🎉 and symbols €$',
    });

    delete (global as any).document;
  });
});
