import { describe, expect, it } from 'vitest';

describe('buildUserDataContext', () => {
  it('incluye los datos del usuario y las notas adicionales en el contexto de IA', async () => {
    const { buildUserDataContext } =
      await import('@/app/api/investment/analysis/ai-analyze-proposal/route');

    const context = buildUserDataContext(
      {
        ibi_anual: '6200',
        estado_cubierta: 'reformada en 2022',
      },
      'El broker confirmó 2 vacíos y una derrama pendiente.'
    );

    expect(context).toContain('DATOS ADICIONALES APORTADOS POR EL USUARIO');
    expect(context).toContain('ibi_anual: 6200');
    expect(context).toContain('estado_cubierta: reformada en 2022');
    expect(context).toContain('El broker confirmó 2 vacíos y una derrama pendiente.');
  });
});
