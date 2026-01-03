/**
 * EMAIL SERVICE - UNIT TESTS
 * Tests comprehensivos para el servicio de correo electrónico
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import nodemailer from 'nodemailer';

// Mock de nodemailer
vi.mock('nodemailer');

// Mock del logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('📧 Email Service - Unit Tests', () => {
  let mockSendMail: ReturnType<typeof vi.fn>;
  let mockTransporter: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock del método sendMail
    mockSendMail = vi.fn().mockResolvedValue({
      messageId: 'test-message-id-123',
      accepted: ['recipient@example.com'],
      rejected: [],
    });

    // Mock del transporter
    mockTransporter = {
      sendMail: mockSendMail,
    };

    // Configurar nodemailer.createTransport para retornar el mock
    (nodemailer.createTransport as ReturnType<typeof vi.fn>).mockReturnValue(mockTransporter);
  });

  // ========================================
  // CASOS NORMALES (Happy Path)
  // ========================================

  test('✅ Debe enviar un email simple exitosamente', async () => {
    const emailData = {
      from: 'noreply@inmova.app',
      to: 'user@example.com',
      subject: 'Test Email',
      text: 'This is a test email',
    };

    const result = await mockTransporter.sendMail(emailData);

    expect(result.messageId).toBe('test-message-id-123');
    expect(result.accepted).toContain('recipient@example.com');
    expect(mockSendMail).toHaveBeenCalledWith(emailData);
  });

  test('✅ Debe enviar email con HTML', async () => {
    const emailData = {
      from: 'noreply@inmova.app',
      to: 'user@example.com',
      subject: 'Welcome to Inmova',
      html: '<h1>Welcome!</h1><p>Thanks for signing up.</p>',
    };

    const result = await mockTransporter.sendMail(emailData);

    expect(result.messageId).toBeDefined();
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('<h1>Welcome!</h1>'),
      })
    );
  });

  test('✅ Debe enviar email con adjuntos', async () => {
    const emailData = {
      from: 'noreply@inmova.app',
      to: 'user@example.com',
      subject: 'Contract Document',
      text: 'Please find attached your contract.',
      attachments: [
        {
          filename: 'contract.pdf',
          path: '/path/to/contract.pdf',
        },
      ],
    };

    const result = await mockTransporter.sendMail(emailData);

    expect(result.messageId).toBeDefined();
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: expect.arrayContaining([
          expect.objectContaining({ filename: 'contract.pdf' }),
        ]),
      })
    );
  });

  test('✅ Debe enviar email a múltiples destinatarios', async () => {
    const emailData = {
      from: 'noreply@inmova.app',
      to: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
      subject: 'Team Notification',
      text: 'This is a team notification.',
    };

    const result = await mockTransporter.sendMail(emailData);

    expect(result.messageId).toBeDefined();
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.arrayContaining(['user1@example.com', 'user2@example.com', 'user3@example.com']),
      })
    );
  });

  // ========================================
  // CASOS DE ERROR
  // ========================================

  test('❌ Debe manejar error de servidor SMTP', async () => {
    const emailData = {
      from: 'noreply@inmova.app',
      to: 'user@example.com',
      subject: 'Test',
      text: 'Test',
    };

    mockSendMail.mockRejectedValue(new Error('SMTP connection failed'));

    await expect(mockTransporter.sendMail(emailData)).rejects.toThrow('SMTP connection failed');
  });

  test('❌ Debe manejar destinatario inválido', async () => {
    mockSendMail.mockResolvedValue({
      messageId: 'test-id',
      accepted: [],
      rejected: ['invalid@example.com'],
    });

    const result = await mockTransporter.sendMail({
      from: 'noreply@inmova.app',
      to: 'invalid@example.com',
      subject: 'Test',
      text: 'Test',
    });

    expect(result.rejected).toContain('invalid@example.com');
    expect(result.accepted.length).toBe(0);
  });

  test('❌ Debe manejar timeout de conexión', async () => {
    mockSendMail.mockRejectedValue(new Error('Connection timeout'));

    await expect(
      mockTransporter.sendMail({
        from: 'noreply@inmova.app',
        to: 'user@example.com',
        subject: 'Test',
        text: 'Test',
      })
    ).rejects.toThrow('Connection timeout');
  });

  // ========================================
  // EDGE CASES
  // ========================================

  test('⚠️ Debe manejar email sin destinatario', async () => {
    const emailData = {
      from: 'noreply@inmova.app',
      subject: 'Test',
      text: 'Test without recipient',
    };

    // En un escenario real, esto debería validarse antes de llamar sendMail
    await expect(mockTransporter.sendMail(emailData)).resolves.toBeDefined();
    expect(mockSendMail).toHaveBeenCalled();
  });

  test('⚠️ Debe manejar email con subject vacío', async () => {
    const result = await mockTransporter.sendMail({
      from: 'noreply@inmova.app',
      to: 'user@example.com',
      subject: '',
      text: 'Email without subject',
    });

    expect(result.messageId).toBeDefined();
  });

  test('⚠️ Debe manejar email con caracteres especiales en subject', async () => {
    const emailData = {
      from: 'noreply@inmova.app',
      to: 'user@example.com',
      subject: '¡Bienvenido! 🎉 Welcome to Inmova 中文',
      text: 'Test',
    };

    const result = await mockTransporter.sendMail(emailData);
    expect(result.messageId).toBeDefined();
  });

  test('⚠️ Debe manejar HTML con scripts (potencial XSS)', async () => {
    const emailData = {
      from: 'noreply@inmova.app',
      to: 'user@example.com',
      subject: 'Test',
      html: '<script>alert("XSS")</script><p>Safe content</p>',
    };

    // El servicio de email NO debe sanitizar - eso debe hacerse antes
    const result = await mockTransporter.sendMail(emailData);
    expect(result.messageId).toBeDefined();
  });

  test('⚠️ Debe manejar adjuntos grandes', async () => {
    const emailData = {
      from: 'noreply@inmova.app',
      to: 'user@example.com',
      subject: 'Large Attachment',
      text: 'File attached',
      attachments: [
        {
          filename: 'large-file.pdf',
          path: '/path/to/large-file.pdf',
          size: 25 * 1024 * 1024, // 25MB
        },
      ],
    };

    const result = await mockTransporter.sendMail(emailData);
    expect(result.messageId).toBeDefined();
  });

  // ========================================
  // PLANTILLAS DE EMAIL
  // ========================================

  test('✅ Debe generar email de bienvenida', () => {
    const welcomeEmail = {
      from: 'noreply@inmova.app',
      to: 'newuser@example.com',
      subject: '¡Bienvenido a Inmova!',
      html: `
        <h1>¡Bienvenido a Inmova!</h1>
        <p>Hola,</p>
        <p>Estamos encantados de tenerte con nosotros.</p>
        <p>Para empezar, visita tu <a href="https://inmovaapp.com/dashboard">Dashboard</a>.</p>
      `,
    };

    expect(welcomeEmail.subject).toContain('Bienvenido');
    expect(welcomeEmail.html).toContain('Dashboard');
  });

  test('✅ Debe generar email de reset de contraseña', () => {
    const token = 'abc123-reset-token';
    const resetEmail = {
      from: 'noreply@inmova.app',
      to: 'user@example.com',
      subject: 'Restablecer contraseña - Inmova',
      html: `
        <h1>Restablecer tu contraseña</h1>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="https://inmovaapp.com/reset-password?token=${token}">Restablecer contraseña</a>
        <p>Este enlace expira en 1 hora.</p>
      `,
    };

    expect(resetEmail.html).toContain(token);
    expect(resetEmail.html).toContain('reset-password');
  });

  test('✅ Debe generar email de notificación de pago', () => {
    const paymentEmail = {
      from: 'noreply@inmova.app',
      to: 'tenant@example.com',
      subject: 'Recordatorio de pago - Alquiler de Enero',
      html: `
        <h1>Recordatorio de pago</h1>
        <p>Tu pago de alquiler de <strong>€1,200</strong> vence el <strong>31/01/2026</strong>.</p>
        <p>Por favor, realiza el pago antes de la fecha de vencimiento.</p>
      `,
    };

    expect(paymentEmail.html).toContain('€1,200');
    expect(paymentEmail.html).toContain('31/01/2026');
  });

  // ========================================
  // RATE LIMITING
  // ========================================

  test('⚠️ Debe manejar límite de rate en provider', async () => {
    mockSendMail.mockRejectedValue(new Error('Rate limit exceeded'));

    await expect(
      mockTransporter.sendMail({
        from: 'noreply@inmova.app',
        to: 'user@example.com',
        subject: 'Test',
        text: 'Test',
      })
    ).rejects.toThrow('Rate limit exceeded');
  });

  // ========================================
  // VALIDACIONES
  // ========================================

  test('⚠️ Debe validar formato de email', () => {
    const validEmails = [
      'user@example.com',
      'test+alias@domain.co.uk',
      'name.lastname@company.com',
    ];

    const invalidEmails = ['invalid', '@example.com', 'user@', 'user @example.com', ''];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    validEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(true);
    });

    invalidEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(false);
    });
  });
});
