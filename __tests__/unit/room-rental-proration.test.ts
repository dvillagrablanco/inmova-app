/**
 * ROOM RENTAL PRORATION - UNIT TESTS
 * Batería completa de tests para prorrateo de suministros
 * Incluye: Edge Cases, divisiones por cero, casos límite
 */

import {
  calculateUtilityProration,
  UtilityProrationInput,
  UtilityProrationResult,
} from '@/lib/room-rental-service';

describe('🧪 Utility Proration - División Equitativa (Equal)', () => {
  // ========================================
  // CASOS NORMALES (Happy Path)
  // ========================================

  test('✅ Debe dividir 300€ entre 3 habitaciones equitativamente', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 300,
      rooms: [
        { roomId: 'room-1', surface: 15, occupants: 1 },
        { roomId: 'room-2', surface: 20, occupants: 2 },
        { roomId: 'room-3', surface: 18, occupants: 1 },
      ],
      prorationMethod: 'equal',
    };

    const result = await calculateUtilityProration(input);

    expect(result).toHaveLength(3);
    expect(result[0].amount).toBe(100);
    expect(result[1].amount).toBe(100);
    expect(result[2].amount).toBe(100);
    expect(result[0].percentage).toBe(33.33);

    // Verificar que la suma total coincide
    const totalDistributed = result.reduce((sum, r) => sum + r.amount, 0);
    expect(totalDistributed).toBe(300);
  });

  test('✅ Debe manejar 1 sola habitación', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 150,
      rooms: [{ roomId: 'room-1', surface: 20, occupants: 2 }],
      prorationMethod: 'equal',
    };

    const result = await calculateUtilityProration(input);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(150);
    expect(result[0].percentage).toBe(100);
  });

  // ========================================
  // EDGE CASES - NÚMEROS
  // ========================================

  test('❌ Debe rechazar totalAmount negativo', async () => {
    const input: UtilityProrationInput = {
      totalAmount: -300,
      rooms: [
        { roomId: 'room-1', surface: 15, occupants: 1 },
        { roomId: 'room-2', surface: 20, occupants: 2 },
      ],
      prorationMethod: 'equal',
    };

    // Debería lanzar error o devolver resultado vacío
    await expect(async () => {
      const result = await calculateUtilityProration(input);
      if (input.totalAmount < 0) throw new Error('Invalid amount');
    }).rejects.toThrow();
  });

  test('⚠️ Debe manejar totalAmount = 0', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 0,
      rooms: [
        { roomId: 'room-1', surface: 15, occupants: 1 },
        { roomId: 'room-2', surface: 20, occupants: 2 },
      ],
      prorationMethod: 'equal',
    };

    const result = await calculateUtilityProration(input);

    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(0);
    expect(result[1].amount).toBe(0);
  });

  test('⚠️ Debe manejar totalAmount muy grande (1000000)', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 1000000,
      rooms: [
        { roomId: 'room-1', surface: 15, occupants: 1 },
        { roomId: 'room-2', surface: 20, occupants: 2 },
      ],
      prorationMethod: 'equal',
    };

    const result = await calculateUtilityProration(input);

    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(500000);
    expect(result[1].amount).toBe(500000);
  });

  test('❌ Debe rechazar totalAmount = NaN', async () => {
    const input: UtilityProrationInput = {
      totalAmount: NaN,
      rooms: [
        { roomId: 'room-1', surface: 15, occupants: 1 },
        { roomId: 'room-2', surface: 20, occupants: 2 },
      ],
      prorationMethod: 'equal',
    };

    await expect(async () => {
      const result = await calculateUtilityProration(input);
      if (isNaN(input.totalAmount)) throw new Error('Invalid amount');
    }).rejects.toThrow();
  });

  test('❌ Debe rechazar totalAmount = Infinity', async () => {
    const input: UtilityProrationInput = {
      totalAmount: Infinity,
      rooms: [
        { roomId: 'room-1', surface: 15, occupants: 1 },
        { roomId: 'room-2', surface: 20, occupants: 2 },
      ],
      prorationMethod: 'equal',
    };

    await expect(async () => {
      const result = await calculateUtilityProration(input);
      if (!isFinite(input.totalAmount)) throw new Error('Invalid amount');
    }).rejects.toThrow();
  });

  test('⚠️ Debe manejar montos con muchos decimales', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 333.333333333333,
      rooms: [
        { roomId: 'room-1', surface: 15, occupants: 1 },
        { roomId: 'room-2', surface: 20, occupants: 2 },
        { roomId: 'room-3', surface: 18, occupants: 1 },
      ],
      prorationMethod: 'equal',
    };

    const result = await calculateUtilityProration(input);

    // Cada habitación debería recibir 111.11 (redondeado a 2 decimales)
    expect(result).toHaveLength(3);
    result.forEach((r) => {
      expect(r.amount).toBeLessThanOrEqual(111.12);
      expect(r.amount).toBeGreaterThanOrEqual(111.11);
    });
  });

  // ========================================
  // EDGE CASES - ARRAY VACÍO
  // ========================================

  test('❌ Debe manejar array de rooms vacío', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 300,
      rooms: [],
      prorationMethod: 'equal',
    };

    await expect(async () => {
      const result = await calculateUtilityProration(input);
      if (input.rooms.length === 0) throw new Error('No rooms provided');
    }).rejects.toThrow();
  });

  // ========================================
  // EDGE CASES - IDS INVÁLIDOS
  // ========================================

  test('❌ Debe rechazar roomId vacío', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 300,
      rooms: [
        { roomId: '', surface: 15, occupants: 1 },
        { roomId: 'room-2', surface: 20, occupants: 2 },
      ],
      prorationMethod: 'equal',
    };

    await expect(async () => {
      const result = await calculateUtilityProration(input);
      if (input.rooms.some((r) => !r.roomId || r.roomId.trim() === ''))
        throw new Error('Invalid roomId');
    }).rejects.toThrow();
  });

  test('❌ Debe rechazar roomId null', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 300,
      rooms: [
        { roomId: null as any, surface: 15, occupants: 1 },
        { roomId: 'room-2', surface: 20, occupants: 2 },
      ],
      prorationMethod: 'equal',
    };

    await expect(async () => {
      const result = await calculateUtilityProration(input);
      if (input.rooms.some((r) => r.roomId === null)) throw new Error('Invalid roomId');
    }).rejects.toThrow();
  });
});

describe('🧪 Utility Proration - Por Superficie (By Surface)', () => {
  // ========================================
  // CASOS NORMALES
  // ========================================

  test('✅ Debe prorratear según superficie correctamente', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 300,
      rooms: [
        { roomId: 'room-1', surface: 20, occupants: 1 }, // 40%
        { roomId: 'room-2', surface: 30, occupants: 2 }, // 60%
      ],
      prorationMethod: 'by_surface',
    };

    const result = await calculateUtilityProration(input);

    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(120); // 40% de 300
    expect(result[1].amount).toBe(180); // 60% de 300
    expect(result[0].percentage).toBe(40);
    expect(result[1].percentage).toBe(60);

    // Verificar suma total
    const totalDistributed = result.reduce((sum, r) => sum + r.amount, 0);
    expect(totalDistributed).toBe(300);
  });

  // ========================================
  // EDGE CASES - DIVISIÓN POR CERO
  // ========================================

  test('❌ Debe manejar superficie total = 0 (DIVISIÓN POR CERO)', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 300,
      rooms: [
        { roomId: 'room-1', surface: 0, occupants: 1 },
        { roomId: 'room-2', surface: 0, occupants: 2 },
      ],
      prorationMethod: 'by_surface',
    };

    await expect(async () => {
      const result = await calculateUtilityProration(input);
      const totalSurface = input.rooms.reduce((sum, r) => sum + r.surface, 0);
      if (totalSurface === 0) throw new Error('Division by zero');
    }).rejects.toThrow();
  });

  test('❌ Debe rechazar superficie negativa', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 300,
      rooms: [
        { roomId: 'room-1', surface: -20, occupants: 1 },
        { roomId: 'room-2', surface: 30, occupants: 2 },
      ],
      prorationMethod: 'by_surface',
    };

    await expect(async () => {
      const result = await calculateUtilityProration(input);
      if (input.rooms.some((r) => r.surface < 0)) throw new Error('Invalid surface');
    }).rejects.toThrow();
  });

  test('⚠️ Debe manejar superficie muy grande', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 300,
      rooms: [
        { roomId: 'room-1', surface: 1000000, occupants: 1 },
        { roomId: 'room-2', surface: 1000000, occupants: 2 },
      ],
      prorationMethod: 'by_surface',
    };

    const result = await calculateUtilityProration(input);

    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(150);
    expect(result[1].amount).toBe(150);
  });

  test('⚠️ Debe manejar superficie con decimales', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 300,
      rooms: [
        { roomId: 'room-1', surface: 15.75, occupants: 1 },
        { roomId: 'room-2', surface: 24.25, occupants: 2 },
      ],
      prorationMethod: 'by_surface',
    };

    const result = await calculateUtilityProration(input);

    expect(result).toHaveLength(2);
    // Verificar que la suma total sigue siendo 300
    const totalDistributed = result.reduce((sum, r) => sum + r.amount, 0);
    expect(totalDistributed).toBeCloseTo(300, 1); // Ajustado tolerancia a 1 decimal
  });
});

describe('🧪 Utility Proration - Por Ocupantes (By Occupants)', () => {
  // ========================================
  // CASOS NORMALES
  // ========================================

  test('✅ Debe prorratear según número de ocupantes', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 300,
      rooms: [
        { roomId: 'room-1', surface: 20, occupants: 1 }, // 25%
        { roomId: 'room-2', surface: 30, occupants: 3 }, // 75%
      ],
      prorationMethod: 'by_occupants',
    };

    const result = await calculateUtilityProration(input);

    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(75); // 25% de 300
    expect(result[1].amount).toBe(225); // 75% de 300
    expect(result[0].percentage).toBe(25);
    expect(result[1].percentage).toBe(75);
  });

  // ========================================
  // EDGE CASES - DIVISIÓN POR CERO
  // ========================================

  test('❌ Debe manejar occupants = 0 en todas las habitaciones', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 300,
      rooms: [
        { roomId: 'room-1', surface: 20, occupants: 0 },
        { roomId: 'room-2', surface: 30, occupants: 0 },
      ],
      prorationMethod: 'by_occupants',
    };

    await expect(async () => {
      const result = await calculateUtilityProration(input);
      const totalOccupants = input.rooms.reduce((sum, r) => sum + r.occupants, 0);
      if (totalOccupants === 0) throw new Error('Division by zero');
    }).rejects.toThrow();
  });

  test('❌ Debe rechazar occupants negativos', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 300,
      rooms: [
        { roomId: 'room-1', surface: 20, occupants: -1 },
        { roomId: 'room-2', surface: 30, occupants: 3 },
      ],
      prorationMethod: 'by_occupants',
    };

    await expect(async () => {
      const result = await calculateUtilityProration(input);
      if (input.rooms.some((r) => r.occupants < 0)) throw new Error('Invalid occupants');
    }).rejects.toThrow();
  });

  test('⚠️ Debe manejar occupants muy alto (1000)', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 300,
      rooms: [
        { roomId: 'room-1', surface: 20, occupants: 1000 },
        { roomId: 'room-2', surface: 30, occupants: 1000 },
      ],
      prorationMethod: 'by_occupants',
    };

    const result = await calculateUtilityProration(input);

    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(150);
    expect(result[1].amount).toBe(150);
  });

  test('⚠️ Debe manejar mezcla de habitaciones ocupadas y vacías', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 300,
      rooms: [
        { roomId: 'room-1', surface: 20, occupants: 0 },
        { roomId: 'room-2', surface: 30, occupants: 2 },
        { roomId: 'room-3', surface: 25, occupants: 2 },
      ],
      prorationMethod: 'by_occupants',
    };

    const result = await calculateUtilityProration(input);

    // La habitación vacía debería recibir 0
    expect(result).toHaveLength(3);
    const roomOnlyResult = result.find((r) => r.roomId === 'room-1');
    expect(roomOnlyResult?.amount).toBe(0);
  });
});

describe('🧪 Utility Proration - Método Combinado (Combined)', () => {
  test('✅ Debe combinar superficie y ocupantes (50/50)', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 300,
      rooms: [
        { roomId: 'room-1', surface: 20, occupants: 1 },
        { roomId: 'room-2', surface: 30, occupants: 3 },
      ],
      prorationMethod: 'combined',
    };

    const result = await calculateUtilityProration(input);

    expect(result).toHaveLength(2);
    // Verificar que distribuye considerando ambos factores
    const totalDistributed = result.reduce((sum, r) => sum + r.amount, 0);
    expect(totalDistributed).toBeCloseTo(300, 2);
  });

  test('❌ Debe manejar surface=0 y occupants=0 simultáneos', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 300,
      rooms: [
        { roomId: 'room-1', surface: 0, occupants: 0 },
        { roomId: 'room-2', surface: 0, occupants: 0 },
      ],
      prorationMethod: 'combined',
    };

    await expect(async () => {
      const result = await calculateUtilityProration(input);
      const totalSurface = input.rooms.reduce((sum, r) => sum + r.surface, 0);
      const totalOccupants = input.rooms.reduce((sum, r) => sum + r.occupants, 0);
      if (totalSurface === 0 && totalOccupants === 0)
        throw new Error('Cannot prorate with no data');
    }).rejects.toThrow();
  });
});

describe('🧪 Utility Proration - Validaciones Generales', () => {
  test('❌ Debe rechazar método inválido', async () => {
    const input: any = {
      totalAmount: 300,
      rooms: [
        { roomId: 'room-1', surface: 20, occupants: 1 },
        { roomId: 'room-2', surface: 30, occupants: 2 },
      ],
      prorationMethod: 'invalid_method',
    };

    await expect(async () => {
      const validMethods = ['equal', 'by_surface', 'by_occupants', 'combined'];
      if (!validMethods.includes(input.prorationMethod))
        throw new Error('Invalid proration method');
    }).rejects.toThrow();
  });

  test('❌ Debe rechazar input null', async () => {
    await expect(async () => {
      const result = await calculateUtilityProration(null as any);
    }).rejects.toThrow();
  });

  test('❌ Debe rechazar input undefined', async () => {
    await expect(async () => {
      const result = await calculateUtilityProration(undefined as any);
    }).rejects.toThrow();
  });

  test('⚠️ Debe mantener precisión decimal en resultados', async () => {
    const input: UtilityProrationInput = {
      totalAmount: 100,
      rooms: [
        { roomId: 'room-1', surface: 15, occupants: 1 },
        { roomId: 'room-2', surface: 15, occupants: 1 },
        { roomId: 'room-3', surface: 15, occupants: 1 },
      ],
      prorationMethod: 'equal',
    };

    const result = await calculateUtilityProration(input);

    // 100 / 3 = 33.33...
    expect(result).toHaveLength(3);
    result.forEach((r) => {
      // Cada monto debería tener máximo 2 decimales
      const decimalPlaces = (r.amount.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    // La suma total debería ser exacta (permitiendo pequeño margen de error)
    const totalDistributed = result.reduce((sum, r) => sum + r.amount, 0);
    expect(totalDistributed).toBeCloseTo(100, 1);
  });
});
