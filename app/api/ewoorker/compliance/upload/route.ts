export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth-options';
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { processDocument, type OCRResult } from '@/lib/ocr-service';

import logger from '@/lib/logger';
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó archivo" },
        { status: 400 }
      );
    }

    // Obtener perfil ewoorker
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json(
        { error: "Usuario sin empresa asociada" },
        { status: 400 }
      );
    }

    const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
      where: { companyId: user.companyId }
    });

    if (!perfil) {
      return NextResponse.json(
        { error: "Perfil ewoorker no encontrado" },
        { status: 404 }
      );
    }

    // Subir archivo a Vercel Blob
    const blob = await put(`ewoorker/documentos/${perfil.id}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    // Guardar en BD
    const documento = await prisma.ewoorkerDocumento.create({
      data: {
        perfilId: perfil.id,
        tipo: "DOCUMENTO_GENERAL", // Será categorizado por OCR
        categoria: "EMPRESA",
        nombreArchivo: file.name,
        urlArchivo: blob.url,
        tamanoBytes: file.size,
        mimeType: file.type,
        estado: "PENDIENTE_VALIDACION",
        requiereRevisionManual: false
      }
    });

    let ocrResult: OCRResult | null = null;
    let ocrErrorMessage: string | null = null;

    try {
      ocrResult = await processDocument(file, file.type);
    } catch (error) {
      ocrErrorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error("[EWOORKER_OCR]", error);
    }

    const requiereRevisionManual =
      !ocrResult || (typeof ocrResult.confidence === 'number' && ocrResult.confidence < 70);

    await prisma.ewoorkerDocumento.update({
      where: { id: documento.id },
      data: {
        datosExtraidos: ocrResult
          ? {
              text: ocrResult.text,
              lines: ocrResult.lines,
              language: ocrResult.language,
              processingTime: ocrResult.processingTime,
              fileType: ocrResult.fileType,
              pageCount: ocrResult.pageCount,
            }
          : null,
        confianzaOCR: ocrResult?.confidence ?? null,
        requiereRevisionManual,
        observaciones: ocrErrorMessage
          ? `OCR falló: ${ocrErrorMessage}`
          : null,
      },
    });

    return NextResponse.json({
      success: true,
      documento: {
        id: documento.id,
        nombreArchivo: documento.nombreArchivo,
        url: documento.urlArchivo,
        estado: documento.estado,
        ocrConfidence: ocrResult?.confidence ?? null,
        requiereRevisionManual
      }
    });

  } catch (error: unknown) {
    logger.error("[EWOORKER_UPLOAD_DOC]", error);
    return NextResponse.json(
      { error: "Error al subir documento" },
      { status: 500 }
    );
  }
}
