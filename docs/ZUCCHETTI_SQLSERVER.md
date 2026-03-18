# 🔗 Zucchetti SQL Server - Conexión Directa a Contabilidad

## Resumen

Conexión directa al SQL Server de Zucchetti (`server.avannubo.com:33680`) para leer datos contables de las sociedades del Grupo Vidaro.

## Sociedades Configuradas

| Clave | Usuario SQL         | Sociedad INMOVA              | Company ID INMOVA    |
|-------|---------------------|------------------------------|----------------------|
| RSQ   | `CONT_RSQ_RO`      | Rovida S.L.                  | `rovida-sl`          |
| VID   | `CONT_VID_RO`      | Vidaro Inversiones S.L.      | `vidaro-inversiones` |
| VIR   | `CONT_VIR_RO`      | Viroda Inversiones S.L.U.    | `viroda-inversiones` |

## Variables de Entorno

```env
# Servidor compartido
ZUCCHETTI_SERVER=server.avannubo.com
ZUCCHETTI_PORT=33680

# Sociedad RSQ
ZUCCHETTI_RSQ_USER=CONT_RSQ_RO
ZUCCHETTI_RSQ_PASS=<password>

# Sociedad VID (Vidaro)
ZUCCHETTI_VID_USER=CONT_VID_RO
ZUCCHETTI_VID_PASS=<password>

# Sociedad VIR (Viroda)
ZUCCHETTI_VIR_USER=CONT_VIR_RO
ZUCCHETTI_VIR_PASS=<password>
```

## Prerequisito: Autorización de IP

⚠️ **IMPORTANTE**: El servidor SQL de Zucchetti requiere que la IP del servidor de INMOVA esté autorizada en el firewall.

**IP del servidor de producción**: `157.180.119.236`

Contactar con Avannubo/Zucchetti para autorizar esta IP en el acceso al puerto `33680`.

**Síntoma si la IP no está autorizada**: Conexión TCP exitosa pero `ECONNRESET` al enviar datos TDS.

## Archivos Clave

| Archivo | Descripción |
|---------|-------------|
| `lib/zucchetti-sqlserver.ts` | Servicio de conexión: pools, discovery, queries |
| `scripts/discover-zucchetti-schema.ts` | Discovery de esquema (tablas, columnas, datos) |
| `app/api/accounting/zucchetti/query/route.ts` | API para consultas ad-hoc |
| `app/api/accounting/zucchetti/test-connection/route.ts` | API para probar conexión |
| `app/api/accounting/zucchetti/status/route.ts` | Status integración (incluye SQL Server) |

## API Endpoints

### POST /api/accounting/zucchetti/test-connection
Prueba la conexión a SQL Server para cada sociedad configurada.
- **Auth**: Admin/SuperAdmin
- **Response**: `{ sqlServer: { configured, results: {...} }, altaiApi: {...} }`

### GET /api/accounting/zucchetti/query
Consulta datos del SQL Server.
- **Auth**: Admin/SuperAdmin
- **Params**:
  - `company`: RSQ | VID | VIR
  - `type`: databases | tables | columns | sample | count
  - `database`: nombre de la BD
  - `table`: nombre de tabla
  - `schema`: schema (default: dbo)
  - `limit`: max filas (default: 10, max: 100)

**Ejemplos**:
```
GET /api/accounting/zucchetti/query?company=VID&type=databases
GET /api/accounting/zucchetti/query?company=VID&database=XXX&type=tables
GET /api/accounting/zucchetti/query?company=VID&database=XXX&type=sample&table=Asientos&limit=5
```

## Scripts

### Discovery de Esquema
```bash
npx tsx scripts/discover-zucchetti-schema.ts
```

Resultado: `data/zucchetti-schema-discovery.json` (gitignored)

## Arquitectura

```
┌─────────────────────┐
│  INMOVA (Next.js)   │
│                     │
│  lib/zucchetti-     │
│  sqlserver.ts       │────── SQL Server TDS ──────▶ server.avannubo.com:33680
│                     │                              ┌──────────────┐
│  Connection Pool    │                              │  SQL Server  │
│  (mssql/tedious)    │                              │              │
│                     │                              │  BD RSQ      │
│                     │                              │  BD VID      │
│                     │                              │  BD VIR      │
│                     │                              └──────────────┘
│                     │
│  lib/zucchetti-     │
│  altai-service.ts   │────── REST API (HTTPS) ────▶ wsaltaifacturas.altai.es
│                     │                              (escritura de asientos)
└─────────────────────┘
```

**SQL Server** = lectura de contabilidad (plan de cuentas, diario, saldos)
**Altai API** = escritura de asientos (INMOVA → Zucchetti)

## Próximos Pasos

1. ✅ Instalar `mssql` y configurar credenciales
2. ✅ Crear servicio de conexión con pooling
3. ✅ Crear script de discovery
4. ✅ Crear API endpoints (query, test-connection, status)
5. ⬜ **Autorizar IP en firewall de Avannubo** ← BLOQUEANTE
6. ⬜ Ejecutar discovery para conocer esquema de tablas
7. ⬜ Implementar funciones de lectura contable específicas
8. ⬜ Sincronización automática SQL Server → INMOVA
9. ⬜ UI con botón de sync en /contabilidad
10. ⬜ Cron job de sincronización

---

_Última actualización: 18 Marzo 2026_
