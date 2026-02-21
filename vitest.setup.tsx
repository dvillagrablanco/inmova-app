import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock framer-motion
vi.mock('framer-motion', () => {
  const motionProxy = new Proxy({}, {
    get: (_target, prop) => {
      if (typeof prop === 'string') {
        return ({ children, ...props }: any) => {
          const Tag = prop as any;
          const cleanProps = { ...props };
          ['initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap',
           'whileInView', 'variants', 'layout', 'layoutId', 'drag', 'dragConstraints',
           'onAnimationComplete', 'onDragEnd', 'onDragStart'].forEach(p => delete cleanProps[p]);
          return <Tag {...cleanProps}>{children}</Tag>;
        };
      }
      return undefined;
    },
  });
  return {
    motion: motionProxy,
    m: motionProxy,
    AnimatePresence: ({ children }: any) => children,
    LayoutGroup: ({ children }: any) => children,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn(), set: vi.fn() }),
    useMotionValue: (val: number) => val,
    useMotionTemplate: (...args: any[]) => '',
    useSpring: (val: any) => val,
    useTransform: (_val: any, _range: any, output: any) => output?.[0] ?? 0,
    useInView: () => true,
    useScroll: () => ({ scrollY: 0, scrollYProgress: 0 }),
    useReducedMotion: () => false,
  };
});

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Setup global mocks
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(cb: any) {}
} as any;

global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock PointerEvent for framer-motion
if (typeof window !== 'undefined' && !window.PointerEvent) {
  class MockPointerEvent extends MouseEvent {
    readonly pointerId: number = 0;
    readonly width: number = 1;
    readonly height: number = 1;
    readonly pressure: number = 0;
    readonly tiltX: number = 0;
    readonly tiltY: number = 0;
    readonly pointerType: string = 'mouse';
    readonly isPrimary: boolean = true;
    constructor(type: string, params: any = {}) {
      super(type, params);
    }
    getCoalescedEvents() { return []; }
    getPredictedEvents() { return []; }
  }
  (window as any).PointerEvent = MockPointerEvent;
}

if (typeof Element !== 'undefined' && !Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
}

const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));
Object.defineProperty(window, 'matchMedia', { writable: true, value: matchMediaMock });

if (typeof globalThis.matchMedia === 'undefined') {
  (globalThis as any).matchMedia = matchMediaMock;
}
