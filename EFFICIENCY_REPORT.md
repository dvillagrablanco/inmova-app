# Efficiency Analysis Report - inmova-app

**Date:** January 21, 2026  
**Analyzed by:** Devin

## Executive Summary

This report identifies several efficiency issues in the inmova-app codebase that could impact performance, particularly in database-heavy operations and React component rendering. The most critical issue involves sequential database queries inside loops, which can cause significant latency when processing multiple records.

## Issue 1: Sequential Database Queries in Loops (Critical)

**Severity:** High  
**Impact:** Database latency multiplied by number of iterations  
**Files Affected:**

- `lib/bi-service.ts` (lines 50-71, 268-296)
- `lib/accounting-service.ts` (lines 146-170, 196-230, 286-314)
- `lib/onboarding-email-service.ts` (lines 287-316)

**Description:**

Multiple service files execute database queries inside `for` loops using `await`, causing each query to wait for the previous one to complete. This pattern is known as the "N+1 query problem" and results in O(n) database round trips instead of O(1).

**Example from `lib/bi-service.ts`:**

```typescript
for (let i = months - 1; i >= 0; i--) {
  const date = subMonths(now, i);
  const start = startOfMonth(date);
  const end = endOfMonth(date);

  // This query runs sequentially for each month
  const payments = await prisma.payment.findMany({
    where: {
      contract: { tenant: { companyId } },
      fechaPago: { gte: start, lte: end },
      estado: 'pagado',
    },
  });
  // ...
}
```

**Recommended Fix:**

Use `Promise.all()` to execute queries in parallel:

```typescript
const queries = Array.from({ length: months }, (_, i) => {
  const date = subMonths(now, months - 1 - i);
  const start = startOfMonth(date);
  const end = endOfMonth(date);

  return prisma.payment
    .findMany({
      where: {
        contract: { tenant: { companyId } },
        fechaPago: { gte: start, lte: end },
        estado: 'pagado',
      },
    })
    .then((payments) => ({
      periodo: format(date, 'yyyy-MM'),
      payments,
    }));
});

const results = await Promise.all(queries);
```

## Issue 2: Redundant Date Object Creation (Low)

**Severity:** Low  
**Impact:** Minor memory allocation overhead  
**Files Affected:**

- `lib/b2b-invoice-pdf.ts` (line 252)
- `app/api/ewoorker/dashboard/stats/route.ts` (line 121)

**Description:**

Multiple `new Date()` calls are made in the same expression when a single Date object could be reused.

**Example from `lib/b2b-invoice-pdf.ts`:**

```typescript
`Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`;
```

**Recommended Fix:**

```typescript
const now = new Date();
`Generado el ${now.toLocaleDateString('es-ES')} a las ${now.toLocaleTimeString('es-ES')}`;
```

## Issue 3: Filter-Then-Map Patterns (Low)

**Severity:** Low  
**Impact:** Two array iterations instead of one  
**Files Affected:**

- `components/onboarding/SetupProgressWidget.tsx` (line 115)
- `components/tutorials/OnboardingChecklist.tsx` (line 142)
- `app/api/onboarding/documents/apply/route.ts` (lines 177-180)

**Description:**

Several places use `.filter().map()` chains where a single `.reduce()` or `.flatMap()` could accomplish the same result in one pass.

**Example:**

```typescript
completedActions: updatedActions.filter((a) => a.completed).map((a) => a.id);
```

**Recommended Fix:**

```typescript
completedActions: updatedActions.reduce((acc, a) => {
  if (a.completed) acc.push(a.id);
  return acc;
}, [] as string[]);
```

Note: For small arrays, the readability of filter-then-map may outweigh the performance benefit of reduce.

## Issue 4: Limited Use of React Memoization (Medium)

**Severity:** Medium  
**Impact:** Unnecessary re-renders in complex components  
**Files Affected:** Various components in `/components`

**Description:**

While some components use `useMemo` and `useCallback`, many complex components with expensive computations or callbacks passed to children do not leverage memoization. This can cause unnecessary re-renders.

**Recommendation:**

Audit components that:

1. Perform expensive calculations in render
2. Pass callbacks to child components
3. Render large lists

Add `useMemo` for computed values and `useCallback` for event handlers where appropriate.

## Priority Recommendations

1. **High Priority:** Fix sequential database queries in `bi-service.ts` and `accounting-service.ts` - these are likely to cause noticeable latency in production
2. **Medium Priority:** Add memoization to frequently-rendered components
3. **Low Priority:** Optimize Date object creation and filter-map patterns

## Implementation Plan

This PR will address Issue 1 by refactoring `lib/bi-service.ts` to use `Promise.all()` for parallel query execution in the `analyzeRevenueTrends` and `compareMultiPeriod` functions.
