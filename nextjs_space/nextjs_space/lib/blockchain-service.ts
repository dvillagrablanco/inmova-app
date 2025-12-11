import { prisma } from './db';
import { addMonths } from 'date-fns';

// ==========================================
// MÓDULO: BLOCKCHAIN Y TOKENIZACIÓN
// ==========================================

/**
 * Crea un token de propiedad inmobiliaria
 */
export async function createPropertyToken(data: {
  companyId: string;
  unitId?: string;
  buildingId?: string;
  nombre: string;
  simbolo: string;
  totalSupply: number;
  valorPropiedad: number;
  creadoPor: string;
}) {
  // Calcular precio por token
  const precioPorToken = data.valorPropiedad / data.totalSupply;

  const token = await prisma.propertyToken.create({
    data: {
      companyId: data.companyId,
      unitId: data.unitId,
      buildingId: data.buildingId,
      nombre: data.nombre,
      simbolo: data.simbolo,
      tokenSymbol: data.simbolo,
      totalSupply: data.totalSupply,
      tokensPorPropiedad: data.totalSupply,
      valorPropiedad: data.valorPropiedad,
      valorActual: data.valorPropiedad,
      precioPorToken,
      estado: 'draft',
      blockchain: 'Polygon',
      tokenStandard: 'ERC-20',
    },
  });

  return token;
}

/**
 * Emite un token (simulación)
 */
export async function emitToken(tokenId: string) {
  // Simulación de deployment en blockchain
  const contractAddress = `0x${Math.random().toString(16).substr(2, 40)}`;

  const token = await prisma.propertyToken.update({
    where: { id: tokenId },
    data: {
      estado: 'activo',
      contractAddress,
      fechaEmision: new Date(),
    },
  });

  return token;
}

/**
 * Registra un holder de tokens
 */
export async function registerTokenHolder(data: {
  tokenId: string;
  tenantId?: string;
  walletAddress: string;
  email?: string;
  nombre?: string;
  cantidadTokens: number;
  valorInvertido: number;
}) {
  const token = await prisma.propertyToken.findUnique({
    where: { id: data.tokenId },
  });

  if (!token) {
    throw new Error('Token no encontrado');
  }

  const porcentajePropiedad = (data.cantidadTokens / token.totalSupply) * 100;

  const holder = await prisma.tokenHolder.create({
    data: {
      ...data,
      porcentajePropiedad,
      kycVerificado: false,
    },
  });

  return holder;
}

/**
 * Distribuye rentas a los holders
 */
export async function distributeRent(tokenId: string, totalRent: number) {
  const holders = await prisma.tokenHolder.findMany({
    where: {
      tokenId,
      activo: true,
    },
  });

  const token = await prisma.propertyToken.findUnique({
    where: { id: tokenId },
  });

  if (!token) {
    throw new Error('Token no encontrado');
  }

  const distributions: any[] = [];

  for (const holder of holders) {
    const share = (holder.cantidadTokens / token.totalSupply) * totalRent;

    // Actualizar holder
    await prisma.tokenHolder.update({
      where: { id: holder.id },
      data: {
        rentasRecibidas: holder.rentasRecibidas + share,
        ultimaRenta: new Date(),
      },
    });

    // Registrar transacción
    await prisma.tokenTransaction.create({
      data: {
        tokenId,
        tipo: 'rent_distribution',
        toAddress: holder.walletAddress,
        cantidadTokens: holder.cantidadTokens,
        precioUnitario: share / holder.cantidadTokens,
        montoTotal: share,
        estado: 'completed',
      },
    });

    distributions.push({
      holder: holder.nombre || holder.email,
      amount: share,
    });
  }

  // Actualizar token
  await prisma.propertyToken.update({
    where: { id: tokenId },
    data: {
      rentaDistribuida: token.rentaDistribuida + totalRent,
      ultimaDistribucion: new Date(),
    },
  });

  return distributions;
}

/**
 * Transfiere tokens entre holders
 */
export async function transferTokens(data: {
  tokenId: string;
  fromAddress: string;
  toAddress: string;
  cantidadTokens: number;
  precioUnitario: number;
}) {
  const token = await prisma.propertyToken.findUnique({
    where: { id: data.tokenId },
  });

  if (!token) {
    throw new Error('Token no encontrado');
  }

  const fromHolder = await prisma.tokenHolder.findFirst({
    where: {
      tokenId: data.tokenId,
      walletAddress: data.fromAddress,
    },
  });

  if (!fromHolder || fromHolder.cantidadTokens < data.cantidadTokens) {
    throw new Error('Balance insuficiente');
  }

  // Reducir tokens del vendedor
  await prisma.tokenHolder.update({
    where: { id: fromHolder.id },
    data: {
      cantidadTokens: fromHolder.cantidadTokens - data.cantidadTokens,
      porcentajePropiedad:
        ((fromHolder.cantidadTokens - data.cantidadTokens) / token.totalSupply) * 100,
    },
  });

  // Aumentar tokens del comprador (o crear nuevo holder)
  const toHolder = await prisma.tokenHolder.findFirst({
    where: {
      tokenId: data.tokenId,
      walletAddress: data.toAddress,
    },
  });

  if (toHolder) {
    await prisma.tokenHolder.update({
      where: { id: toHolder.id },
      data: {
        cantidadTokens: toHolder.cantidadTokens + data.cantidadTokens,
        porcentajePropiedad:
          ((toHolder.cantidadTokens + data.cantidadTokens) / token.totalSupply) * 100,
      },
    });
  } else {
    await prisma.tokenHolder.create({
      data: {
        tokenId: data.tokenId,
        walletAddress: data.toAddress,
        cantidadTokens: data.cantidadTokens,
        porcentajePropiedad: (data.cantidadTokens / token.totalSupply) * 100,
        valorInvertido: data.cantidadTokens * data.precioUnitario,
      },
    });
  }

  // Registrar transacción
  const transaction = await prisma.tokenTransaction.create({
    data: {
      tokenId: data.tokenId,
      tipo: 'transfer',
      fromAddress: data.fromAddress,
      toAddress: data.toAddress,
      cantidadTokens: data.cantidadTokens,
      precioUnitario: data.precioUnitario,
      montoTotal: data.cantidadTokens * data.precioUnitario,
      estado: 'completed',
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    },
  });

  return transaction;
}

/**
 * Obtiene estadísticas de un token
 */
export async function getTokenStats(tokenId: string) {
  const token = await prisma.propertyToken.findUnique({
    where: { id: tokenId },
    include: {
      holders: true,
      transactions: true,
    },
  });

  if (!token) {
    throw new Error('Token no encontrado');
  }

  const totalInvertido = token.holders.reduce(
    (sum, h) => sum + h.valorInvertido,
    0
  );
  const rentasDistribuidas = token.rentaDistribuida;
  const roi = totalInvertido > 0 ? (rentasDistribuidas / totalInvertido) * 100 : 0;

  return {
    token,
    totalHolders: token.holders.length,
    totalInvertido,
    rentasDistribuidas,
    roi,
    transacciones: token.transactions.length,
  };
}

/**
 * Crea un NFT certificado
 */
export async function mintNFTCertificate(data: {
  companyId: string;
  tipo: string;
  unitId?: string;
  buildingId?: string;
  titulo: string;
  descripcion?: string;
  propietario?: string;
  walletAddress?: string;
  atributos?: any;
}) {
  // Simulación de minting
  const tokenId = `NFT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const contractAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
  const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;

  const nft = await prisma.nFTCertificate.create({
    data: {
      ...data,
      tokenId,
      contractAddress,
      txHash,
      mintedAt: new Date(),
      estado: 'minted',
    },
  });

  return nft;
}
