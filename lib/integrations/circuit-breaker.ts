type CircuitState = {
  failures: number;
  lastFailureAt: number;
  state: 'closed' | 'open';
};

const circuits = new Map<string, CircuitState>();

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  cooldownMs?: number;
}

export async function executeWithCircuitBreaker<T>(
  key: string,
  action: () => Promise<T>,
  options: CircuitBreakerOptions = {}
): Promise<T> {
  const failureThreshold = options.failureThreshold ?? 3;
  const cooldownMs = options.cooldownMs ?? 60_000;
  const state = circuits.get(key) || { failures: 0, lastFailureAt: 0, state: 'closed' };

  if (state.state === 'open') {
    const elapsed = Date.now() - state.lastFailureAt;
    if (elapsed < cooldownMs) {
      throw new Error(`Circuit breaker abierto para ${key}`);
    }
    state.state = 'closed';
    state.failures = 0;
  }

  try {
    const result = await action();
    circuits.set(key, { failures: 0, lastFailureAt: 0, state: 'closed' });
    return result;
  } catch (error) {
    const failures = state.failures + 1;
    const nextState: CircuitState = {
      failures,
      lastFailureAt: Date.now(),
      state: failures >= failureThreshold ? 'open' : 'closed',
    };
    circuits.set(key, nextState);
    throw error;
  }
}
