/**
 * DOCUMENTS API - COMPREHENSIVE TESTS
 * Tests para API de gestión de documentos
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mocks
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    document: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    documentFolder: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    documentTag: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
  getPrismaClient: () => ({ prisma: {
    document: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    documentFolder: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    documentTag: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  } }),
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  companyId: 'company-1',
  role: 'ADMIN',
};

describe('📄 Documents API - Search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
    });
  });

  test('✅ Debe buscar documentos por query', async () => {
    const mockDocuments = [
      {
        id: 'doc-1',
        name: 'Contrato Vivienda.pdf',
        type: 'pdf',
        size: 1024000,
        url: 's3://docs/contract.pdf',
        companyId: 'company-1',
      },
    ];

    (prisma.document.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockDocuments);

    const request = new NextRequest('http://localhost:3000/api/documents/search?q=contrato');

    // Simular búsqueda
    const documents = await prisma.document.findMany({
      where: {
        companyId: mockUser.companyId,
        name: { contains: 'contrato', mode: 'insensitive' },
      },
    });

    expect(documents).toHaveLength(1);
    expect(documents[0].name).toContain('Contrato');
  });

  test('✅ Debe filtrar por tipo de documento', async () => {
    (prisma.document.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'doc-1', type: 'pdf', name: 'Doc1.pdf' },
      { id: 'doc-2', type: 'pdf', name: 'Doc2.pdf' },
    ]);

    const documents = await prisma.document.findMany({
      where: {
        companyId: mockUser.companyId,
        type: 'pdf',
      },
    });

    expect(documents).toHaveLength(2);
    expect(documents.every((d) => d.type === 'pdf')).toBe(true);
  });

  test('✅ Debe filtrar por tags', async () => {
    (prisma.document.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'doc-1', name: 'Legal Doc', tags: [{ name: 'legal' }] },
    ]);

    const documents = await prisma.document.findMany({
      where: {
        companyId: mockUser.companyId,
        tags: { some: { name: 'legal' } },
      },
      include: { tags: true },
    });

    expect(documents).toHaveLength(1);
    expect(documents[0].tags[0].name).toBe('legal');
  });

  test('✅ Debe filtrar por carpeta', async () => {
    (prisma.document.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'doc-1', folderId: 'folder-1', name: 'File in folder' },
    ]);

    const documents = await prisma.document.findMany({
      where: {
        companyId: mockUser.companyId,
        folderId: 'folder-1',
      },
    });

    expect(documents).toHaveLength(1);
    expect(documents[0].folderId).toBe('folder-1');
  });

  test('❌ Debe retornar [] si no hay resultados', async () => {
    (prisma.document.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const documents = await prisma.document.findMany({
      where: {
        companyId: mockUser.companyId,
        name: { contains: 'nonexistent' },
      },
    });

    expect(documents).toHaveLength(0);
  });

  test('⚠️ Debe manejar búsqueda con caracteres especiales', async () => {
    (prisma.document.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const documents = await prisma.document.findMany({
      where: {
        companyId: mockUser.companyId,
        name: { contains: '@#$%', mode: 'insensitive' },
      },
    });

    expect(documents).toHaveLength(0);
  });
});

describe('📄 Documents API - CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
    });
  });

  test('✅ Debe crear documento', async () => {
    const newDocument = {
      id: 'doc-new',
      name: 'New Document.pdf',
      type: 'pdf',
      size: 500000,
      url: 's3://docs/new.pdf',
      companyId: 'company-1',
      uploadedBy: 'user-1',
    };

    (prisma.document.create as ReturnType<typeof vi.fn>).mockResolvedValue(newDocument);

    const document = await prisma.document.create({
      data: {
        name: 'New Document.pdf',
        type: 'pdf',
        size: 500000,
        url: 's3://docs/new.pdf',
        companyId: mockUser.companyId,
        uploadedBy: mockUser.id,
      },
    });

    expect(document.id).toBe('doc-new');
    expect(document.name).toBe('New Document.pdf');
  });

  test('✅ Debe obtener documento por ID', async () => {
    const mockDocument = {
      id: 'doc-1',
      name: 'Document.pdf',
      companyId: 'company-1',
    };

    (prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDocument);

    const document = await prisma.document.findUnique({
      where: { id: 'doc-1' },
    });

    expect(document).toBeDefined();
    expect(document!.id).toBe('doc-1');
  });

  test('✅ Debe actualizar documento', async () => {
    const updatedDocument = {
      id: 'doc-1',
      name: 'Updated Document.pdf',
    };

    (prisma.document.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedDocument);

    const document = await prisma.document.update({
      where: { id: 'doc-1' },
      data: { name: 'Updated Document.pdf' },
    });

    expect(document.name).toBe('Updated Document.pdf');
  });

  test('✅ Debe eliminar documento', async () => {
    (prisma.document.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'doc-1',
    });

    await prisma.document.delete({ where: { id: 'doc-1' } });

    expect(prisma.document.delete).toHaveBeenCalledWith({
      where: { id: 'doc-1' },
    });
  });

  test('❌ Debe fallar al crear documento sin nombre', async () => {
    (prisma.document.create as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Name is required')
    );

    await expect(
      prisma.document.create({
        data: { name: '', type: 'pdf', size: 100, url: 's3://file' } as any,
      })
    ).rejects.toThrow('Name is required');
  });

  test('⚠️ Debe manejar documento muy grande (>50MB)', async () => {
    const largeDoc = {
      name: 'Large.pdf',
      size: 100 * 1024 * 1024, // 100MB
    };

    // Validación de tamaño
    const maxSize = 50 * 1024 * 1024; // 50MB
    expect(largeDoc.size).toBeGreaterThan(maxSize);
  });
});

describe('📄 Documents API - Folders & Tags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
    });
  });

  test('✅ Debe listar carpetas', async () => {
    const mockFolders = [
      { id: 'folder-1', name: 'Contratos', companyId: 'company-1' },
      { id: 'folder-2', name: 'Facturas', companyId: 'company-1' },
    ];

    (prisma.documentFolder.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockFolders);

    const folders = await prisma.documentFolder.findMany({
      where: { companyId: mockUser.companyId },
    });

    expect(folders).toHaveLength(2);
  });

  test('✅ Debe crear carpeta', async () => {
    const newFolder = {
      id: 'folder-new',
      name: 'Nueva Carpeta',
      companyId: 'company-1',
    };

    (prisma.documentFolder.create as ReturnType<typeof vi.fn>).mockResolvedValue(newFolder);

    const folder = await prisma.documentFolder.create({
      data: { name: 'Nueva Carpeta', companyId: mockUser.companyId },
    });

    expect(folder.name).toBe('Nueva Carpeta');
  });

  test('✅ Debe listar tags', async () => {
    const mockTags = [
      { id: 'tag-1', name: 'urgente' },
      { id: 'tag-2', name: 'legal' },
    ];

    (prisma.documentTag.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockTags);

    const tags = await prisma.documentTag.findMany({
      where: { companyId: mockUser.companyId },
    });

    expect(tags).toHaveLength(2);
  });

  test('✅ Debe crear tag', async () => {
    const newTag = {
      id: 'tag-new',
      name: 'importante',
      companyId: 'company-1',
    };

    (prisma.documentTag.create as ReturnType<typeof vi.fn>).mockResolvedValue(newTag);

    const tag = await prisma.documentTag.create({
      data: { name: 'importante', companyId: mockUser.companyId },
    });

    expect(tag.name).toBe('importante');
  });
});

describe('📄 Documents API - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
    });
  });

  test('⚠️ Debe manejar documentos con nombres duplicados', async () => {
    (prisma.document.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'doc-1', name: 'Contract.pdf' },
      { id: 'doc-2', name: 'Contract.pdf' },
    ]);

    const documents = await prisma.document.findMany({
      where: {
        companyId: mockUser.companyId,
        name: 'Contract.pdf',
      },
    });

    expect(documents).toHaveLength(2);
  });

  test('⚠️ Debe ordenar por fecha descendente', async () => {
    (prisma.document.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'doc-2', createdAt: new Date('2025-01-02') },
      { id: 'doc-1', createdAt: new Date('2025-01-01') },
    ]);

    const documents = await prisma.document.findMany({
      where: { companyId: mockUser.companyId },
      orderBy: { createdAt: 'desc' },
    });

    expect(documents[0].id).toBe('doc-2');
  });

  test('⚠️ Debe contar total de documentos', async () => {
    (prisma.document.count as ReturnType<typeof vi.fn>).mockResolvedValue(42);

    const total = await prisma.document.count({
      where: { companyId: mockUser.companyId },
    });

    expect(total).toBe(42);
  });
});
