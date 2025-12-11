/**
 * Servicio de Integración con Bankinter (Open Banking PSD2)
 * 
 * Este servicio implementa la integración completa con Bankinter a través de
 * la plataforma Redsys PSD2, soportando:
 * - AIS (Account Information Service)
 * - PIS (Payment Initiation Service)
 * - COF (Confirmation of Funds)
 * 
 * @requires Certificados eIDAS (QWAC y QSealC)
 * @requires Licencia TPP del regulador
 * @requires Registro en Redsys PSD2 Platform
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as fs from 'fs';
import * as https from 'https';
import { prisma } from './db';
import logger, { logError } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const REDSYS_CONFIG = {
  // URLs según entorno (sandbox o producción)
  apiUrl: process.env.REDSYS_API_URL || 'https://apis-i.redsys.es:20443/psd2/xs2a/api-entrada-xs2a/services',
  oauthUrl: process.env.REDSYS_OAUTH_URL || 'https://apis-i.redsys.es:20443/psd2/xs2a/api-oauth-xs2a',
  bankinterCode: process.env.REDSYS_BANKINTER_CODE || 'bankinter',
  
  // Credenciales OAuth
  clientId: process.env.REDSYS_CLIENT_ID,
  clientSecret: process.env.REDSYS_CLIENT_SECRET,
  
  // Rutas de certificados eIDAS
  certificates: {
    qwac: {
      cert: process.env.REDSYS_CERTIFICATE_PATH,
      key: process.env.REDSYS_CERTIFICATE_KEY_PATH
    },
    qseal: {
      cert: process.env.REDSYS_SEAL_CERTIFICATE_PATH,
      key: process.env.REDSYS_SEAL_KEY_PATH
    }
  },
  
  // URLs de callback
  redirectUri: process.env.NEXT_PUBLIC_APP_URL + '/api/open-banking/callback',
  
  // Configuración de timeouts
  timeout: 30000, // 30 segundos
  
  // Versión de la API
  apiVersion: '1.1'
};

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

interface BankAccount {
  resourceId: string;
  iban?: string;
  currency: string;
  name?: string;
  product?: string;
  cashAccountType?: string;
  status?: string;
  bban?: string;
  ownerName?: string;
}

interface Balance {
  balanceAmount: {
    currency: string;
    amount: string;
  };
  balanceType: string;
  referenceDate?: string;
  lastChangeDateTime?: string;
}

interface Transaction {
  transactionId: string;
  bookingDate: string;
  valueDate?: string;
  transactionAmount: {
    currency: string;
    amount: string;
  };
  creditorName?: string;
  creditorAccount?: {
    iban: string;
  };
  debtorName?: string;
  debtorAccount?: {
    iban: string;
  };
  remittanceInformationUnstructured?: string;
  bankTransactionCode?: string;
  proprietaryBankTransactionCode?: string;
}

interface ConsentRequest {
  access: {
    accounts?: Array<{ iban?: string; currency?: string }>;
    balances?: Array<{ iban?: string; currency?: string }>;
    transactions?: Array<{ iban?: string; currency?: string }>;
    allPsd2?: 'allAccounts';
  };
  recurringIndicator: boolean;
  validUntil: string; // ISO 8601 date
  frequencyPerDay: number;
  combinedServiceIndicator?: boolean;
}

interface PaymentInitiationRequest {
  instructedAmount: {
    currency: string;
    amount: string;
  };
  debtorAccount: {
    iban: string;
    currency: string;
  };
  creditorAccount: {
    iban: string;
    currency?: string;
  };
  creditorName: string;
  remittanceInformationUnstructured?: string;
  requestedExecutionDate?: string;
}

// ============================================================================
// CLASE PRINCIPAL DEL SERVICIO
// ============================================================================

export class BankinterIntegrationService {
  private axiosInstance: AxiosInstance;
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = this.checkConfiguration();
    this.axiosInstance = this.createAxiosInstance();
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  private checkConfiguration(): boolean {
    const requiredVars = [
      'REDSYS_API_URL',
      'REDSYS_CLIENT_ID',
      'REDSYS_CLIENT_SECRET',
      'REDSYS_CERTIFICATE_PATH',
      'REDSYS_CERTIFICATE_KEY_PATH'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      logger.warn(`⚠️ Bankinter Integration: Faltan variables de entorno: ${missing.join(', ')}`);
      logger.warn('🔧 El servicio funcionará en MODO DEMO');
      return false;
    }

    // Verificar que los archivos de certificados existan
    try {
      if (REDSYS_CONFIG.certificates.qwac.cert && !fs.existsSync(REDSYS_CONFIG.certificates.qwac.cert)) {
        logger.warn(`⚠️ Certificado QWAC no encontrado en: ${REDSYS_CONFIG.certificates.qwac.cert}`);
        return false;
      }
      if (REDSYS_CONFIG.certificates.qwac.key && !fs.existsSync(REDSYS_CONFIG.certificates.qwac.key)) {
        logger.warn(`⚠️ Clave QWAC no encontrada en: ${REDSYS_CONFIG.certificates.qwac.key}`);
        return false;
      }
    } catch (error) {
      logger.warn('⚠️ Error verificando certificados:', error);
      return false;
    }

    logger.info('✅ Bankinter Integration: Configuración completa');
    return true;
  }

  /**
   * Crea una instancia de Axios con los certificados eIDAS
   */
  private createAxiosInstance(): AxiosInstance {
    if (!this.isConfigured) {
      // Retornar instancia básica sin certificados para modo demo
      return axios.create({
        timeout: REDSYS_CONFIG.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    try {
      // Cargar certificados
      const cert = fs.readFileSync(REDSYS_CONFIG.certificates.qwac.cert!);
      const key = fs.readFileSync(REDSYS_CONFIG.certificates.qwac.key!);

      // Crear agente HTTPS con certificados
      const httpsAgent = new https.Agent({
        cert,
        key,
        rejectUnauthorized: true // Verificar certificados del servidor
      });

      return axios.create({
        httpsAgent,
        timeout: REDSYS_CONFIG.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Request-ID': uuidv4(),
          'PSU-IP-Address': '127.0.0.1' // Se actualizará con la IP real del usuario
        }
      });
    } catch (error) {
      logError(error as Error, { context: 'BankinterIntegrationService.createAxiosInstance' });
      throw new Error('Error al crear instancia de Axios con certificados');
    }
  }

  /**
   * Genera headers comunes para las peticiones
   */
  private getCommonHeaders(psuIpAddress?: string): Record<string, string> {
    return {
      'X-Request-ID': uuidv4(),
      'PSU-IP-Address': psuIpAddress || '127.0.0.1',
      'TPP-Redirect-URI': REDSYS_CONFIG.redirectUri
    };
  }

  // ==========================================================================
  // AUTENTICACIÓN OAUTH 2.0
  // ==========================================================================

  /**
   * Obtiene un access token de OAuth
   */
  async getAccessToken(): Promise<string> {
    if (!this.isConfigured) {
      logger.info('🔧 MODO DEMO: Retornando token simulado');
      return 'DEMO_TOKEN_' + Date.now();
    }

    try {
      const response = await this.axiosInstance.post(
        `${REDSYS_CONFIG.oauthUrl}/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: REDSYS_CONFIG.clientId!,
          client_secret: REDSYS_CONFIG.clientSecret!,
          scope: 'AIS PIS COF'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      logger.info('✅ Access token obtenido correctamente');
      return response.data.access_token;
    } catch (error) {
      logError(error as Error, { context: 'BankinterIntegrationService.getAccessToken' });
      throw new Error('Error al obtener access token de Bankinter');
    }
  }

  // ==========================================================================
  // ACCOUNT INFORMATION SERVICE (AIS)
  // ==========================================================================

  /**
   * Crea un consentimiento AIS para acceder a información de cuentas
   */
  async createAISConsent(
    companyId: string,
    userId: string,
    psuIpAddress: string,
    validDays: number = 90
  ): Promise<{ consentId: string; scaRedirectUrl: string }> {
    if (!this.isConfigured) {
      logger.info('🔧 MODO DEMO: Creando consentimiento simulado');
      return {
        consentId: 'DEMO_CONSENT_' + Date.now(),
        scaRedirectUrl: '/api/open-banking/demo-callback'
      };
    }

    try {
      const accessToken = await this.getAccessToken();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + Math.min(validDays, 90)); // Máximo 90 días

      const consentRequest: ConsentRequest = {
        access: {
          allPsd2: 'allAccounts'
        },
        recurringIndicator: true,
        validUntil: validUntil.toISOString().split('T')[0],
        frequencyPerDay: 4
      };

      const response = await this.axiosInstance.post(
        `${REDSYS_CONFIG.apiUrl}/${REDSYS_CONFIG.bankinterCode}/v1/consents`,
        consentRequest,
        {
          headers: {
            ...this.getCommonHeaders(psuIpAddress),
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const consentId = response.data.consentId;
      const scaRedirectUrl = response.data._links.scaRedirect.href;

      // Guardar consentimiento en la base de datos
      await prisma.bankConnection.create({
        data: {
          companyId,
          proveedor: 'bankinter_redsys',
          proveedorItemId: consentId,
          nombreBanco: 'Bankinter',
          tipoCuenta: 'corriente',
          moneda: 'EUR',
          estado: 'pendiente_autorizacion' as any,
          consentId,
          consentValidUntil: validUntil,
          ultimaSync: new Date()
        }
      });

      logger.info(`✅ Consentimiento AIS creado: ${consentId}`);

      return {
        consentId,
        scaRedirectUrl
      };
    } catch (error) {
      logError(error as Error, { context: 'BankinterIntegrationService.createAISConsent' });
      throw new Error('Error al crear consentimiento AIS');
    }
  }

  /**
   * Obtiene el estado de un consentimiento
   */
  async getConsentStatus(consentId: string): Promise<string> {
    if (!this.isConfigured) {
      return 'valid';
    }

    try {
      const accessToken = await this.getAccessToken();

      const response = await this.axiosInstance.get(
        `${REDSYS_CONFIG.apiUrl}/${REDSYS_CONFIG.bankinterCode}/v1/consents/${consentId}/status`,
        {
          headers: {
            ...this.getCommonHeaders(),
            'Authorization': `Bearer ${accessToken}`,
            'Consent-ID': consentId
          }
        }
      );

      return response.data.consentStatus;
    } catch (error) {
      logError(error as Error, { context: 'BankinterIntegrationService.getConsentStatus' });
      throw new Error('Error al obtener estado del consentimiento');
    }
  }

  /**
   * Obtiene la lista de cuentas bancarias
   */
  async getAccounts(consentId: string): Promise<BankAccount[]> {
    if (!this.isConfigured) {
      logger.info('🔧 MODO DEMO: Retornando cuentas simuladas');
      return [
        {
          resourceId: 'DEMO_ACCOUNT_1',
          iban: 'ES1234567890123456789012',
          currency: 'EUR',
          name: 'Cuenta Corriente Demo',
          product: 'Cuenta Nómina',
          cashAccountType: 'CACC',
          status: 'enabled',
          ownerName: 'Demo User'
        }
      ];
    }

    try {
      const accessToken = await this.getAccessToken();

      const response = await this.axiosInstance.get(
        `${REDSYS_CONFIG.apiUrl}/${REDSYS_CONFIG.bankinterCode}/v1/accounts`,
        {
          headers: {
            ...this.getCommonHeaders(),
            'Authorization': `Bearer ${accessToken}`,
            'Consent-ID': consentId
          }
        }
      );

      return response.data.accounts;
    } catch (error) {
      logError(error as Error, { context: 'BankinterIntegrationService.getAccounts' });
      throw new Error('Error al obtener cuentas bancarias');
    }
  }

  /**
   * Obtiene los saldos de una cuenta
   */
  async getBalances(consentId: string, accountId: string): Promise<Balance[]> {
    if (!this.isConfigured) {
      return [
        {
          balanceAmount: { currency: 'EUR', amount: '5000.00' },
          balanceType: 'interimAvailable'
        }
      ];
    }

    try {
      const accessToken = await this.getAccessToken();

      const response = await this.axiosInstance.get(
        `${REDSYS_CONFIG.apiUrl}/${REDSYS_CONFIG.bankinterCode}/v1/accounts/${accountId}/balances`,
        {
          headers: {
            ...this.getCommonHeaders(),
            'Authorization': `Bearer ${accessToken}`,
            'Consent-ID': consentId
          }
        }
      );

      return response.data.balances;
    } catch (error) {
      logError(error as Error, { context: 'BankinterIntegrationService.getBalances' });
      throw new Error('Error al obtener saldos');
    }
  }

  /**
   * Obtiene las transacciones de una cuenta
   */
  async getTransactions(
    consentId: string,
    accountId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<Transaction[]> {
    if (!this.isConfigured) {
      logger.info('🔧 MODO DEMO: Retornando transacciones simuladas');
      return [];
    }

    try {
      const accessToken = await this.getAccessToken();

      const params: any = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await this.axiosInstance.get(
        `${REDSYS_CONFIG.apiUrl}/${REDSYS_CONFIG.bankinterCode}/v1/accounts/${accountId}/transactions`,
        {
          params,
          headers: {
            ...this.getCommonHeaders(),
            'Authorization': `Bearer ${accessToken}`,
            'Consent-ID': consentId
          }
        }
      );

      return response.data.transactions.booked || [];
    } catch (error) {
      logError(error as Error, { context: 'BankinterIntegrationService.getTransactions' });
      throw new Error('Error al obtener transacciones');
    }
  }

  // ==========================================================================
  // PAYMENT INITIATION SERVICE (PIS)
  // ==========================================================================

  /**
   * Inicia un pago SEPA
   */
  async initiatePayment(
    companyId: string,
    userId: string,
    psuIpAddress: string,
    paymentData: PaymentInitiationRequest
  ): Promise<{ paymentId: string; scaRedirectUrl: string }> {
    if (!this.isConfigured) {
      logger.info('🔧 MODO DEMO: Iniciando pago simulado');
      return {
        paymentId: 'DEMO_PAYMENT_' + Date.now(),
        scaRedirectUrl: '/api/open-banking/demo-callback'
      };
    }

    try {
      const accessToken = await this.getAccessToken();

      const response = await this.axiosInstance.post(
        `${REDSYS_CONFIG.apiUrl}/${REDSYS_CONFIG.bankinterCode}/v1/payments/sepa-credit-transfers`,
        paymentData,
        {
          headers: {
            ...this.getCommonHeaders(psuIpAddress),
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const paymentId = response.data.paymentId;
      const scaRedirectUrl = response.data._links.scaRedirect.href;

      logger.info(`✅ Pago iniciado: ${paymentId}`);

      return {
        paymentId,
        scaRedirectUrl
      };
    } catch (error) {
      logError(error as Error, { context: 'BankinterIntegrationService.initiatePayment' });
      throw new Error('Error al iniciar pago');
    }
  }

  /**
   * Obtiene el estado de un pago
   */
  async getPaymentStatus(paymentId: string): Promise<string> {
    if (!this.isConfigured) {
      return 'ACCP'; // Accepted Customer Profile
    }

    try {
      const accessToken = await this.getAccessToken();

      const response = await this.axiosInstance.get(
        `${REDSYS_CONFIG.apiUrl}/${REDSYS_CONFIG.bankinterCode}/v1/payments/sepa-credit-transfers/${paymentId}/status`,
        {
          headers: {
            ...this.getCommonHeaders(),
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data.transactionStatus;
    } catch (error) {
      logError(error as Error, { context: 'BankinterIntegrationService.getPaymentStatus' });
      throw new Error('Error al obtener estado del pago');
    }
  }

  // ==========================================================================
  // FUNCIONES DE ALTO NIVEL PARA INMOVA
  // ==========================================================================

  /**
   * Conecta una cuenta bancaria de Bankinter
   */
  async conectarCuentaBankinter(
    companyId: string,
    userId: string,
    psuIpAddress: string
  ): Promise<{ consentId: string; authUrl: string }> {
    try {
      const { consentId, scaRedirectUrl } = await this.createAISConsent(
        companyId,
        userId,
        psuIpAddress
      );

      return {
        consentId,
        authUrl: scaRedirectUrl
      };
    } catch (error) {
      logError(error as Error, { context: 'BankinterIntegrationService.conectarCuentaBankinter' });
      throw error;
    }
  }

  /**
   * Sincroniza transacciones de Bankinter
   */
  async sincronizarTransaccionesBankinter(
    connectionId: string,
    diasAtras: number = 90
  ): Promise<{ transacciones: any[]; total: number }> {
    try {
      // Obtener la conexión
      const connection = await prisma.bankConnection.findUnique({
        where: { id: connectionId }
      });

      if (!connection || !connection.consentId) {
        throw new Error('Conexión bancaria no encontrada o sin consentimiento válido');
      }

      // Verificar estado del consentimiento
      const consentStatus = await this.getConsentStatus(connection.consentId);
      if (consentStatus !== 'valid') {
        throw new Error('Consentimiento no válido. Es necesario renovar la autorización.');
      }

      // Obtener cuentas
      const accounts = await this.getAccounts(connection.consentId);
      
      if (accounts.length === 0) {
        return { transacciones: [], total: 0 };
      }

      // Obtener transacciones de todas las cuentas
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - diasAtras);
      const dateTo = new Date();

      const allTransactions = [];

      for (const account of accounts) {
        const transactions = await this.getTransactions(
          connection.consentId,
          account.resourceId,
          dateFrom.toISOString().split('T')[0],
          dateTo.toISOString().split('T')[0]
        );

        // Guardar transacciones en la base de datos
        for (const transaction of transactions) {
          // Evitar duplicados
          const existente = await prisma.bankTransaction.findFirst({
            where: {
              proveedorTxId: transaction.transactionId
            }
          });

          if (!existente && connection.companyId) {
            await prisma.bankTransaction.create({
              data: {
                companyId: connection.companyId,
                connectionId,
                proveedorTxId: transaction.transactionId,
                fecha: new Date(transaction.bookingDate),
                fechaContable: transaction.valueDate ? new Date(transaction.valueDate) : null,
                descripcion: transaction.remittanceInformationUnstructured || '',
                monto: parseFloat(transaction.transactionAmount.amount),
                moneda: transaction.transactionAmount.currency,
                tipoTransaccion: parseFloat(transaction.transactionAmount.amount) > 0 ? 'ingreso' : 'gasto',
                creditorName: transaction.creditorName,
                creditorIban: transaction.creditorAccount?.iban,
                debtorName: transaction.debtorName,
                debtorIban: transaction.debtorAccount?.iban,
                rawData: transaction as any,
                estado: 'pendiente_revision'
              }
            });
          }

          allTransactions.push(transaction);
        }
      }

      // Actualizar última sincronización
      await prisma.bankConnection.update({
        where: { id: connectionId },
        data: { ultimaSync: new Date() }
      });

      logger.info(`✅ ${allTransactions.length} transacciones sincronizadas de Bankinter`);

      return {
        transacciones: allTransactions,
        total: allTransactions.length
      };
    } catch (error) {
      logError(error as Error, { context: 'BankinterIntegrationService.sincronizarTransaccionesBankinter' });
      throw error;
    }
  }

  /**
   * Verifica ingresos de un inquilino usando su cuenta de Bankinter
   */
  async verificarIngresosBankinter(
    tenantId: string,
    mesesAnalisis: number = 3
  ): Promise<any> {
    try {
      // Obtener la conexión bancaria del inquilino
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          bankConnections: {
            where: {
              proveedor: 'bankinter_redsys',
              estado: 'conectado'
            },
            take: 1
          }
        }
      });

      if (!tenant || tenant.bankConnections.length === 0) {
        throw new Error('No se encontró conexión bancaria activa de Bankinter para el inquilino');
      }

      const connection = tenant.bankConnections[0];

      // Sincronizar transacciones recientes
      const diasAnalisis = mesesAnalisis * 30;
      await this.sincronizarTransaccionesBankinter(connection.id, diasAnalisis);

      // Obtener transacciones de ingresos
      const transactions = await prisma.bankTransaction.findMany({
        where: {
          connectionId: connection.id,
          tipoTransaccion: 'ingreso',
          fecha: {
            gte: new Date(Date.now() - diasAnalisis * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { fecha: 'desc' }
      });

      // Analizar ingresos
      const ingresosPorMes: { [key: string]: number } = {};
      transactions.forEach(tx => {
        const mes = `${tx.fecha.getFullYear()}-${String(tx.fecha.getMonth() + 1).padStart(2, '0')}`;
        ingresosPorMes[mes] = (ingresosPorMes[mes] || 0) + tx.monto;
      });

      const ingresos = Object.values(ingresosPorMes);
      const ingresosPromedio = ingresos.reduce((a, b) => a + b, 0) / ingresos.length;
      const ingresosMinimos = Math.min(...ingresos);
      const ingresosMaximos = Math.max(...ingresos);

      // Calcular estabilidad (coeficiente de variación invertido)
      const desviacion = Math.sqrt(
        ingresos.reduce((sum, val) => sum + Math.pow(val - ingresosPromedio, 2), 0) / ingresos.length
      );
      const coefVariacion = (desviacion / ingresosPromedio) * 100;
      const estabilidad = Math.max(0, Math.min(100, 100 - coefVariacion));

      // Identificar fuentes de ingresos
      const fuentesIngresos = [...new Set(
        transactions
          .filter(tx => tx.debtorName)
          .map(tx => tx.debtorName!)
          .slice(0, 5)
      )];

      const informe = {
        tenantId,
        fechaVerificacion: new Date(),
        ingresosPromedio,
        ingresosMinimos,
        ingresosMaximos,
        estabilidad,
        fuentesIngresos,
        totalTransacciones: transactions.length,
        recomendacion: this.generarRecomendacionIngresos(ingresosPromedio, estabilidad),
        verificado: true,
        proveedor: 'bankinter'
      };

      logger.info(`✅ Ingresos verificados para tenant ${tenantId}: €${ingresosPromedio.toFixed(2)}/mes`);

      return informe;
    } catch (error) {
      logError(error as Error, { context: 'BankinterIntegrationService.verificarIngresosBankinter' });
      throw error;
    }
  }

  /**
   * Concilia pagos de alquileres con transacciones bancarias
   */
  async conciliarPagosBankinter(
    companyId: string,
    mesesAtras: number = 1
  ): Promise<{ conciliados: number; total: number }> {
    try {
      // Obtener conexiones bancarias de la compañía
      const connections = await prisma.bankConnection.findMany({
        where: {
          companyId,
          proveedor: 'bankinter_redsys',
          estado: 'conectado'
        }
      });

      if (connections.length === 0) {
        return { conciliados: 0, total: 0 };
      }

      // Sincronizar transacciones de todas las conexiones
      for (const connection of connections) {
        await this.sincronizarTransaccionesBankinter(connection.id, mesesAtras * 30);
      }

      // Obtener pagos pendientes
      const fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - mesesAtras);

      const pagosPendientes = await prisma.payment.findMany({
        where: {
          contract: {
            unit: {
              building: {
                companyId
              }
            }
          },
          estado: 'pendiente',
          fechaVencimiento: {
            gte: fechaInicio
          }
        },
        include: {
          contract: {
            include: {
              tenant: true,
              unit: true
            }
          }
        }
      });

      let conciliados = 0;

      // Intentar conciliar cada pago con transacciones
      for (const pago of pagosPendientes) {
        const tenant = pago.contract.tenant;
        
        // Buscar transacción que coincida
        const transaccion = await prisma.bankTransaction.findFirst({
          where: {
            connection: {
              companyId
            },
            monto: {
              gte: pago.monto * 0.99, // Tolerancia del 1%
              lte: pago.monto * 1.01
            },
            fecha: {
              gte: new Date(pago.fechaVencimiento.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 días antes
              lte: new Date(pago.fechaVencimiento.getTime() + 10 * 24 * 60 * 60 * 1000) // 10 días después
            },
            OR: [
              { creditorName: { contains: tenant.nombreCompleto, mode: 'insensitive' } },
              { debtorName: { contains: tenant.nombreCompleto, mode: 'insensitive' } },
              { descripcion: { contains: pago.periodo || '', mode: 'insensitive' } }
            ]
          }
        });

        if (transaccion) {
          // Marcar pago como conciliado
          await prisma.payment.update({
            where: { id: pago.id },
            data: {
              estado: 'pagado',
              fechaPago: transaccion.fecha,
              metodoPago: 'transferencia_bancaria'
            }
          });

          // También actualizar el estado de la transacción
          await prisma.bankTransaction.update({
            where: { id: transaccion.id },
            data: {
              estado: 'conciliado',
              paymentId: pago.id
            }
          });

          conciliados++;
          logger.info(`✅ Pago conciliado: ${pago.id} con transacción ${transaccion.proveedorTxId}`);
        }
      }

      return {
        conciliados,
        total: pagosPendientes.length
      };
    } catch (error) {
      logError(error as Error, { context: 'BankinterIntegrationService.conciliarPagosBankinter' });
      throw error;
    }
  }

  /**
   * Genera recomendación basada en análisis de ingresos
   */
  private generarRecomendacionIngresos(ingresosPromedio: number, estabilidad: number): string {
    if (ingresosPromedio >= 3000 && estabilidad >= 80) {
      return 'Excelente capacidad de pago. Ingresos altos y muy estables.';
    } else if (ingresosPromedio >= 2000 && estabilidad >= 70) {
      return 'Buena capacidad de pago. Ingresos estables.';
    } else if (ingresosPromedio >= 1500 && estabilidad >= 60) {
      return 'Capacidad de pago moderada. Ingresos variables.';
    } else if (estabilidad < 50) {
      return 'Ingresos inestables. Se recomienda solicitar aval o garantía adicional.';
    } else {
      return 'Capacidad de pago limitada. Evaluar ratio renta/ingresos cuidadosamente.';
    }
  }
}

// ============================================================================
// INSTANCIA SINGLETON
// ============================================================================

export const bankinterService = new BankinterIntegrationService();

// ============================================================================
// FUNCIÓN DE VERIFICACIÓN
// ============================================================================

/**
 * Verifica si el servicio de Bankinter está configurado y listo para usar
 */
export function isBankinterConfigured(): boolean {
  return bankinterService['isConfigured'];
}
