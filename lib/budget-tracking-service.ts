/**
 * BUDGET TRACKING SERVICE
 * Sistema de seguimiento de presupuestos por categorías (Flipping y Construcción)
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export type ExpenseCategory =
  | 'structural'
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'flooring'
  | 'painting'
  | 'kitchen'
  | 'bathrooms'
  | 'exterior'
  | 'landscaping'
  | 'permits'
  | 'labor'
  | 'materials'
  | 'professional_fees'
  | 'holding_costs'
  | 'contingency'
  | 'other';

export interface BudgetCategory {
  category: ExpenseCategory;
  name: string;
  budgeted: number;
  spent: number;
  committed: number; // Comprometido pero no pagado
  remaining: number;
  percentUsed: number;
  status: 'under_budget' | 'on_track' | 'over_budget';
  expenses: Expense[];
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Date;
  vendor?: string;
  invoiceNumber?: string;
  paymentStatus: 'pending' | 'paid' | 'overdue';
  notes?: string;
}

export interface BudgetTracking {
  projectId: string;
  projectName: string;
  totalBudget: number;
  totalSpent: number;
  totalCommitted: number;
  totalRemaining: number;
  percentUsed: number;
  categories: BudgetCategory[];
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  severity: 'info' | 'warning' | 'critical';
  category?: ExpenseCategory;
  message: string;
}

/**
 * Inicializa presupuesto por categorías
 */
export function initializeBudget(
  projectId: string,
  projectName: string,
  categoryBudgets: Partial<Record<ExpenseCategory, number>>
): BudgetTracking {
  const categories: BudgetCategory[] = [];
  let totalBudget = 0;

  Object.entries(categoryBudgets).forEach(([cat, budget]) => {
    if (budget && budget > 0) {
      const category = cat as ExpenseCategory;
      categories.push({
        category,
        name: getCategoryName(category),
        budgeted: budget,
        spent: 0,
        committed: 0,
        remaining: budget,
        percentUsed: 0,
        status: 'under_budget',
        expenses: [],
      });
      totalBudget += budget;
    }
  });

  return {
    projectId,
    projectName,
    totalBudget,
    totalSpent: 0,
    totalCommitted: 0,
    totalRemaining: totalBudget,
    percentUsed: 0,
    categories,
    alerts: [],
  };
}

/**
 * Añade un gasto al presupuesto
 */
export function addExpense(tracking: BudgetTracking, expense: Expense): BudgetTracking {
  const category = tracking.categories.find((c) => c.category === expense.category);

  if (!category) {
    throw new Error(`Categoría ${expense.category} no encontrada en el presupuesto`);
  }

  // Añadir gasto
  category.expenses.push(expense);

  // Actualizar spent o committed según estado de pago
  if (expense.paymentStatus === 'paid') {
    category.spent += expense.amount;
  } else {
    category.committed += expense.amount;
  }

  // Recalcular métricas
  return recalculateBudget(tracking);
}

/**
 * Marca un gasto como pagado
 */
export function markExpenseAsPaid(tracking: BudgetTracking, expenseId: string): BudgetTracking {
  for (const category of tracking.categories) {
    const expense = category.expenses.find((e) => e.id === expenseId);
    if (expense) {
      if (expense.paymentStatus !== 'paid') {
        // Mover de committed a spent
        category.committed -= expense.amount;
        category.spent += expense.amount;
        expense.paymentStatus = 'paid';
      }
      break;
    }
  }

  return recalculateBudget(tracking);
}

/**
 * Recalcula todas las métricas del presupuesto
 */
function recalculateBudget(tracking: BudgetTracking): BudgetTracking {
  tracking.totalSpent = 0;
  tracking.totalCommitted = 0;
  tracking.alerts = [];

  // Actualizar cada categoría
  tracking.categories.forEach((category) => {
    const totalUsed = category.spent + category.committed;
    category.remaining = category.budgeted - totalUsed;
    category.percentUsed = category.budgeted > 0 ? (totalUsed / category.budgeted) * 100 : 0;

    // Determinar estado
    if (category.percentUsed > 100) {
      category.status = 'over_budget';
      tracking.alerts.push({
        severity: 'critical',
        category: category.category,
        message: `❌ ${category.name} ha excedido el presupuesto en ${(category.percentUsed - 100).toFixed(1)}%`,
      });
    } else if (category.percentUsed > 90) {
      category.status = 'over_budget';
      tracking.alerts.push({
        severity: 'warning',
        category: category.category,
        message: `⚠️ ${category.name} está al ${category.percentUsed.toFixed(1)}% del presupuesto`,
      });
    } else if (category.percentUsed > 75) {
      category.status = 'on_track';
    } else {
      category.status = 'under_budget';
    }

    tracking.totalSpent += category.spent;
    tracking.totalCommitted += category.committed;
  });

  // Calcular totales
  tracking.totalRemaining = tracking.totalBudget - tracking.totalSpent - tracking.totalCommitted;
  tracking.percentUsed =
    tracking.totalBudget > 0
      ? ((tracking.totalSpent + tracking.totalCommitted) / tracking.totalBudget) * 100
      : 0;

  // Alertas globales
  if (tracking.percentUsed > 100) {
    tracking.alerts.unshift({
      severity: 'critical',
      message: `❌ PRESUPUESTO TOTAL EXCEDIDO en ${(tracking.percentUsed - 100).toFixed(1)}%`,
    });
  } else if (tracking.percentUsed > 90) {
    tracking.alerts.unshift({
      severity: 'warning',
      message: `⚠️ Presupuesto total al ${tracking.percentUsed.toFixed(1)}%`,
    });
  }

  return tracking;
}

/**
 * Genera reporte de presupuesto
 */
export function generateBudgetReport(tracking: BudgetTracking): string {
  return `
# REPORTE DE PRESUPUESTO
## ${tracking.projectName}

### 📊 RESUMEN GENERAL

**Presupuesto Total:** €${tracking.totalBudget.toLocaleString()}
**Gastado:** €${tracking.totalSpent.toLocaleString()}
**Comprometido:** €${tracking.totalCommitted.toLocaleString()}
**Restante:** €${tracking.totalRemaining.toLocaleString()}
**Porcentaje Usado:** ${tracking.percentUsed.toFixed(1)}%

---

### ⚠️ ALERTAS

${tracking.alerts.length > 0 ? tracking.alerts.map((a) => `${a.message}`).join('\n') : '✅ Sin alertas'}

---

### 💰 PRESUPUESTO POR CATEGORÍA

${tracking.categories
  .map((cat) => {
    const statusIcon =
      cat.status === 'over_budget' ? '❌' : cat.status === 'on_track' ? '⚠️' : '✅';
    return `
#### ${statusIcon} ${cat.name}

| Concepto | Importe |
|----------|--------:|
| Presupuestado | €${cat.budgeted.toLocaleString()} |
| Gastado | €${cat.spent.toLocaleString()} |
| Comprometido | €${cat.committed.toLocaleString()} |
| Restante | €${cat.remaining.toLocaleString()} |
| **% Usado** | **${cat.percentUsed.toFixed(1)}%** |

${
  cat.expenses.length > 0
    ? `
**Gastos:**
${cat.expenses.map((e) => `- ${format(e.date, 'dd/MM/yyyy')}: ${e.description} - €${e.amount.toLocaleString()} (${e.paymentStatus})`).join('\n')}
`
    : ''
}
`;
  })
  .join('\n')}

---

*Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}*
  `.trim();
}

/**
 * Proyección de gastos futuros
 */
export function projectBudget(
  tracking: BudgetTracking,
  additionalExpenses: Partial<Record<ExpenseCategory, number>>
): {
  currentRemaining: number;
  projectedRemaining: number;
  willExceedBudget: boolean;
  recommendations: string[];
} {
  let projectedSpending = tracking.totalSpent + tracking.totalCommitted;

  Object.entries(additionalExpenses).forEach(([cat, amount]) => {
    if (amount) {
      projectedSpending += amount;
    }
  });

  const projectedRemaining = tracking.totalBudget - projectedSpending;
  const willExceedBudget = projectedRemaining < 0;

  const recommendations: string[] = [];

  if (willExceedBudget) {
    recommendations.push(
      `Se proyecta exceder el presupuesto en €${Math.abs(projectedRemaining).toLocaleString()}`
    );
    recommendations.push('Considerar:');
    recommendations.push('- Renegociar precios con proveedores');
    recommendations.push('- Buscar alternativas más económicas');
    recommendations.push('- Aumentar el presupuesto si es viable');
    recommendations.push('- Reducir alcance en categorías no críticas');
  } else {
    recommendations.push('✅ El proyecto se mantiene dentro del presupuesto proyectado');
  }

  return {
    currentRemaining: tracking.totalRemaining,
    projectedRemaining,
    willExceedBudget,
    recommendations,
  };
}

function getCategoryName(category: ExpenseCategory): string {
  const names: Record<ExpenseCategory, string> = {
    structural: 'Obra Estructural',
    plumbing: 'Fontanería',
    electrical: 'Electricidad',
    hvac: 'Climatización',
    flooring: 'Suelos',
    painting: 'Pintura',
    kitchen: 'Cocina',
    bathrooms: 'Baños',
    exterior: 'Exterior',
    landscaping: 'Paisajismo',
    permits: 'Permisos y Licencias',
    labor: 'Mano de Obra',
    materials: 'Materiales',
    professional_fees: 'Honorarios Profesionales',
    holding_costs: 'Costes de Mantenimiento',
    contingency: 'Contingencia',
    other: 'Otros',
  };
  return names[category];
}
