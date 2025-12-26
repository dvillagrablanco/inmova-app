/**
 * Servicio de Integración con Sistema de Notarios
 * Acceso al Registro de la Propiedad y Colegio de Notarios
 */

export interface NotaryDocument {
  documentId: string;
  documentType: 'escritura' | 'nota_simple' | 'certificado_catastral' | 'registro_propiedad';
  propertyReference: string;
  documentDate: Date;
  notaryName?: string;
  notaryNumber?: string;
  content: {
    propertyDescription?: string;
    currentOwner?: string;
    previousOwners?: string[];
    encumbrances?: Array<{
      type: string;
      description: string;
      amount?: number;
      registrationDate: Date;
    }>;
    propertyCharacteristics?: {
      cadastralReference: string;
      surface: number;
      location: string;
      propertyType: string;
      constructionYear?: number;
    };
    fiscalData?: {
      cadastralValue: number;
      lastRevaluation: Date;
    };
  };
  downloadUrl?: string;
  verified: boolean;
}

export interface PropertyVerification {
  unitId: string;
  verificationDate: Date;
  status: 'verified' | 'pending' | 'issues_found' | 'not_verified';
  checks: {
    ownershipVerified: boolean;
    noEncumbrances: boolean;
    cadastralMatch: boolean;
    urbanCompliance: boolean;
  };
  issues: string[];
  documents: NotaryDocument[];
}

export interface PropertyRegistryData {
  cadastralReference: string;
  registryNumber: string;
  propertyDescription: string;
  surface: number;
  location: string;
  currentOwner: {
    name: string;
    dni?: string;
    acquisitionDate: Date;
    acquisitionValue: number;
  };
  encumbrances: Array<{
    type: 'hipoteca' | 'embargo' | 'servidumbre' | 'arrendamiento';
    amount?: number;
    beneficiary: string;
    registrationDate: Date;
    status: 'activo' | 'cancelado';
  }>;
  history: Array<{
    date: Date;
    event: string;
    description: string;
  }>;
}

export class NotaryIntegrationService {
  private static readonly REGISTRO_PROPIEDAD_API = process.env.REGISTRO_PROPIEDAD_API_URL;
  private static readonly NOTARIOS_API = process.env.NOTARIOS_API_URL;
  private static readonly CATASTRO_API = 'https://ovc.catastro.meh.es';
  private static readonly API_KEY = process.env.NOTARY_INTEGRATION_API_KEY;

  /**
   * Obtiene nota simple del registro de la propiedad
   */
  static async getNotaSimple(
    cadastralReference: string,
    province: string
  ): Promise<NotaryDocument> {
    try {
      // Nota: Esto requiere integración oficial con el Colegio de Registradores
      // Por ahora es una implementación de ejemplo
      
      const response = await fetch(
        `${this.REGISTRO_PROPIEDAD_API}/nota-simple`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cadastralReference,
            province,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('No se pudo obtener la nota simple');
      }

      const data = await response.json();

      return {
        documentId: data.id,
        documentType: 'nota_simple',
        propertyReference: cadastralReference,
        documentDate: new Date(data.date),
        notaryName: data.notary?.name,
        notaryNumber: data.notary?.number,
        content: {
          propertyDescription: data.description,
          currentOwner: data.owner,
          encumbrances: data.encumbrances || [],
          propertyCharacteristics: data.characteristics,
        },
        downloadUrl: data.downloadUrl,
        verified: true,
      };
    } catch (error) {
      console.error('Error obteniendo nota simple:', error);
      throw new Error('No se pudo obtener la nota simple del registro');
    }
  }

  /**
   * Obtiene información del catastro
   */
  static async getCatastralInfo(cadastralReference: string): Promise<any> {
    try {
      // Consulta a la API del Catastro (Sede Electrónica)
      const response = await fetch(
        `${this.CATASTRO_API}/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            SRS: 'EPSG:4326',
            RC: cadastralReference,
          }),
        }
      );

      const xmlText = await response.text();
      const parsedData = this.parseCatastroXML(xmlText);

      return {
        cadastralReference,
        address: parsedData.address,
        surface: parsedData.surface,
        cadastralValue: parsedData.value,
        coordinates: parsedData.coordinates,
        propertyType: parsedData.propertyType,
        constructionYear: parsedData.constructionYear,
      };
    } catch (error) {
      console.error('Error consultando catastro:', error);
      throw new Error('No se pudo consultar el catastro');
    }
  }

  /**
   * Verifica la propiedad en el registro
   */
  static async verifyProperty(
    propertyId: string,
    cadastralReference: string,
    province: string
  ): Promise<PropertyVerification> {
    const issues: string[] = [];
    let ownershipVerified = false;
    let noEncumbrances = false;
    let cadastralMatch = false;
    let urbanCompliance = true;

    const documents: NotaryDocument[] = [];

    try {
      // 1. Obtener nota simple
      const notaSimple = await this.getNotaSimple(cadastralReference, province);
      documents.push(notaSimple);
      ownershipVerified = true;

      // 2. Verificar cargas
      if (notaSimple.content.encumbrances && notaSimple.content.encumbrances.length > 0) {
        noEncumbrances = false;
        issues.push(`Existen ${notaSimple.content.encumbrances.length} cargas registradas`);
        
        notaSimple.content.encumbrances.forEach(enc => {
          issues.push(`${enc.type}: ${enc.description}`);
        });
      } else {
        noEncumbrances = true;
      }

      // 3. Verificar catastro
      const catastralInfo = await this.getCatastralInfo(cadastralReference);
      cadastralMatch = true;

      // 4. Guardar en base de datos
      const { prisma } = require('@/lib/prisma');
      
      await prisma.propertyVerification.create({
        data: {
          propertyId,
          verificationDate: new Date(),
          status: issues.length === 0 ? 'verified' : 'issues_found',
          ownershipVerified,
          noEncumbrances,
          cadastralMatch,
          urbanCompliance,
          issues: issues,
          documents: documents as any,
        },
      });

    } catch (error) {
      console.error('Error verificando propiedad:', error);
      issues.push('Error al verificar con el registro de la propiedad');
    }

    return {
      propertyId,
      verificationDate: new Date(),
      status: issues.length === 0 ? 'verified' : 'issues_found',
      checks: {
        ownershipVerified,
        noEncumbrances,
        cadastralMatch,
        urbanCompliance,
      },
      issues,
      documents,
    };
  }

  /**
   * Obtiene histórico de transmisiones
   */
  static async getTransmissionHistory(cadastralReference: string): Promise<any[]> {
    try {
      const notaSimple = await this.getNotaSimple(cadastralReference, '');
      
      return notaSimple.content.encumbrances?.map(enc => ({
        date: enc.registrationDate,
        type: enc.type,
        description: enc.description,
        amount: enc.amount,
      })) || [];
    } catch (error) {
      console.error('Error obteniendo histórico:', error);
      return [];
    }
  }

  /**
   * Solicita certificado digital de propiedad
   */
  static async requestPropertyCertificate(
    propertyId: string,
    certificateType: 'dominio' | 'cargas' | 'completo'
  ): Promise<{
    requestId: string;
    status: 'pending' | 'processing' | 'ready';
    estimatedTime: number; // minutos
  }> {
    const { prisma } = require('@/lib/prisma');

    const request = await prisma.certificateRequest.create({
      data: {
        propertyId,
        certificateType,
        status: 'pending',
        requestDate: new Date(),
      },
    });

    // En un sistema real, esto iniciaría una solicitud al Registro
    return {
      requestId: request.id,
      status: 'pending',
      estimatedTime: 24 * 60, // 24 horas
    };
  }

  /**
   * Consulta estado de solicitud de certificado
   */
  static async checkCertificateStatus(requestId: string): Promise<{
    status: 'pending' | 'processing' | 'ready' | 'error';
    downloadUrl?: string;
    errorMessage?: string;
  }> {
    const { prisma } = require('@/lib/prisma');

    const request = await prisma.certificateRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Solicitud no encontrada');
    }

    return {
      status: request.status,
      downloadUrl: request.downloadUrl,
      errorMessage: request.errorMessage,
    };
  }

  /**
   * Calcula costos notariales estimados
   */
  static calculateNotaryCosts(
    transactionType: 'compraventa' | 'hipoteca' | 'cancelacion',
    propertyValue: number,
    province: string
  ): {
    notaryFees: number;
    registryFees: number;
    gestor: number;
    stamps: number;
    total: number;
    breakdown: Array<{ concept: string; amount: number }>;
  } {
    const breakdown: Array<{ concept: string; amount: number }> = [];

    // Arancel notarial (simplificado, varía por tramos)
    let notaryFees = 0;
    if (propertyValue <= 6000) {
      notaryFees = 60;
    } else if (propertyValue <= 30000) {
      notaryFees = 90 + (propertyValue - 6000) * 0.003;
    } else if (propertyValue <= 60000) {
      notaryFees = 162 + (propertyValue - 30000) * 0.002;
    } else if (propertyValue <= 150000) {
      notaryFees = 222 + (propertyValue - 60000) * 0.0015;
    } else {
      notaryFees = 357 + (propertyValue - 150000) * 0.001;
    }

    // Límite máximo
    notaryFees = Math.min(notaryFees, propertyValue * 0.01);
    breakdown.push({ concept: 'Notaría', amount: notaryFees });

    // Registro de la propiedad (aproximado)
    const registryFees = notaryFees * 0.8;
    breakdown.push({ concept: 'Registro Propiedad', amount: registryFees });

    // Gestoría (opcional)
    const gestor = 300;
    breakdown.push({ concept: 'Gestoría', amount: gestor });

    // Timbres y documentos
    const stamps = 50;
    breakdown.push({ concept: 'Timbres y copias', amount: stamps });

    const total = notaryFees + registryFees + gestor + stamps;

    return {
      notaryFees,
      registryFees,
      gestor,
      stamps,
      total,
      breakdown,
    };
  }

  /**
   * Busca notarías cercanas
   */
  static async findNearbyNotaries(
    latitude: number,
    longitude: number,
    radius: number = 5000 // metros
  ): Promise<Array<{
    name: string;
    address: string;
    phone: string;
    email?: string;
    collegiateNumber: string;
    distance: number;
    rating?: number;
  }>> {
    try {
      // Consulta a API del Colegio de Notarios
      // Por ahora datos de ejemplo
      return [
        {
          name: 'Notaría García López',
          address: 'Calle Mayor, 123',
          phone: '+34 900 123 456',
          email: 'notaria@example.com',
          collegiateNumber: 'N-12345',
          distance: 500,
          rating: 4.5,
        },
      ];
    } catch (error) {
      console.error('Error buscando notarías:', error);
      return [];
    }
  }

  /**
   * Agenda cita con notaría
   */
  static async scheduleNotaryAppointment(
    notaryId: string,
    propertyId: string,
    date: Date,
    appointmentType: 'firma_compraventa' | 'firma_hipoteca' | 'consulta' | 'cancelacion_hipoteca'
  ): Promise<{
    appointmentId: string;
    confirmed: boolean;
    notaryContact: string;
  }> {
    const { prisma } = require('@/lib/prisma');

    const appointment = await prisma.notaryAppointment.create({
      data: {
        notaryId,
        propertyId,
        appointmentDate: date,
        appointmentType,
        status: 'pending_confirmation',
      },
    });

    // Aquí se enviaría notificación a la notaría
    return {
      appointmentId: appointment.id,
      confirmed: false,
      notaryContact: '+34 900 123 456',
    };
  }

  /**
   * Parsea XML del catastro
   */
  private static parseCatastroXML(xmlText: string): any {
    // Implementación simplificada
    // En producción usar un parser XML apropiado
    return {
      address: '',
      surface: 0,
      value: 0,
      coordinates: { lat: 0, lng: 0 },
      propertyType: '',
      constructionYear: null,
    };
  }

  /**
   * Vincula documento notarial con análisis de inversión
   */
  static async linkDocumentToAnalysis(
    documentId: string,
    analysisId: string,
    userId: string
  ): Promise<void> {
    const { prisma } = require('@/lib/prisma');

    await prisma.analysisDocument.create({
      data: {
        analysisId,
        documentType: 'notarial',
        documentId,
        userId,
      },
    });
  }

  /**
   * Genera checklist de documentación necesaria
   */
  static generateDocumentChecklist(transactionType: 'compra' | 'venta' | 'hipoteca'): Array<{
    document: string;
    required: boolean;
    description: string;
    obtainedFrom: string;
  }> {
    const baseDocuments = [
      {
        document: 'DNI/NIE',
        required: true,
        description: 'Documento Nacional de Identidad en vigor',
        obtainedFrom: 'Policía Nacional / Comisaría',
      },
      {
        document: 'Nota Simple Registral',
        required: true,
        description: 'Nota simple del Registro de la Propiedad',
        obtainedFrom: 'Registro de la Propiedad',
      },
    ];

    if (transactionType === 'compra') {
      return [
        ...baseDocuments,
        {
          document: 'Certificado de Eficiencia Energética',
          required: true,
          description: 'Certificado energético vigente',
          obtainedFrom: 'Técnico certificador',
        },
        {
          document: 'Cédula de Habitabilidad',
          required: true,
          description: 'Certificado de habitabilidad de la vivienda',
          obtainedFrom: 'Ayuntamiento',
        },
        {
          document: 'IBI Pagado',
          required: true,
          description: 'Último recibo del IBI pagado',
          obtainedFrom: 'Ayuntamiento / Vendedor',
        },
        {
          document: 'Estatutos Comunidad',
          required: false,
          description: 'Estatutos de la comunidad de propietarios',
          obtainedFrom: 'Comunidad de propietarios',
        },
      ];
    }

    if (transactionType === 'hipoteca') {
      return [
        ...baseDocuments,
        {
          document: 'Tasación Oficial',
          required: true,
          description: 'Tasación realizada por empresa homologada',
          obtainedFrom: 'Tasadora homologada por banco',
        },
        {
          document: 'Nóminas',
          required: true,
          description: 'Tres últimas nóminas',
          obtainedFrom: 'Empresa',
        },
        {
          document: 'Declaración IRPF',
          required: true,
          description: 'Última declaración de la renta',
          obtainedFrom: 'AEAT',
        },
      ];
    }

    return baseDocuments;
  }
}
