#!/usr/bin/env python3
"""
Revalidar DocuSign en servidor y enviar un envelope real si JWT es OK.

Obtiene credenciales esperadas desde documentación local y usa credenciales
de servidor desde scripts existentes (sin imprimir secretos).
"""

from __future__ import annotations

import os
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, "/home/ubuntu/.local/lib/python3.12/site-packages")

import paramiko


ROOT = Path(__file__).resolve().parents[1]
DOC_INTEGRACIONES = ROOT / "CREDENCIALES_INTEGRACIONES_INMOVA.md"
DOC_DOCUSIGN = ROOT / "DOCUSIGN_CREDENTIALS.md"
SERVER_SCRIPT = ROOT / "scripts" / "configure-docusign.py"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def extract_from_doc(doc_text: str, key: str) -> str | None:
    patterns = [
        rf"{re.escape(key)}\s*\|\s*`([^`]+)`",
        rf"{re.escape(key)}\s*=\s*([^\s]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, doc_text)
        if match:
            return match.group(1).strip()
    return None


def extract_server_config(script_text: str) -> dict[str, str]:
    def grab(pattern: str) -> str:
        match = re.search(pattern, script_text)
        if not match:
            raise RuntimeError(f"No se encontró {pattern}")
        return match.group(1)

    return {
        "host": grab(r'SERVER_IP\s*=\s*"([^"]+)"'),
        "username": grab(r'SERVER_USER\s*=\s*"([^"]+)"'),
        "password": grab(r'SERVER_PASSWORD\s*=\s*"([^"]+)"'),
        "app_path": grab(r'APP_PATH\s*=\s*"([^"]+)"'),
    }


def mask(value: str | None) -> str:
    if not value:
        return "MISSING"
    if len(value) <= 8:
        return "***"
    return f"{value[:4]}...{value[-4:]}"


def exec_cmd(client: paramiko.SSHClient, cmd: str, timeout: int = 60) -> tuple[int, str, str]:
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode("utf-8", errors="ignore")
    error = stderr.read().decode("utf-8", errors="ignore")
    return exit_status, output, error


def parse_env(env_content: str) -> dict[str, str]:
    env_vars: dict[str, str] = {}
    for line in env_content.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env_vars[key.strip()] = value.strip().strip('"').strip("'")
    return env_vars


def shell_escape(value: str) -> str:
    return "'" + value.replace("'", "'\"'\"'") + "'"


def main() -> int:
    if not DOC_INTEGRACIONES.exists():
        print("❌ No se encontró CREDENCIALES_INTEGRACIONES_INMOVA.md")
        return 1
    if not SERVER_SCRIPT.exists():
        print("❌ No se encontró scripts/configure-docusign.py")
        return 1

    integraciones_text = read_text(DOC_INTEGRACIONES)
    server_text = read_text(SERVER_SCRIPT)

    expected = {
        "DOCUSIGN_INTEGRATION_KEY": extract_from_doc(integraciones_text, "DOCUSIGN_INTEGRATION_KEY"),
        "DOCUSIGN_USER_ID": extract_from_doc(integraciones_text, "DOCUSIGN_USER_ID"),
        "DOCUSIGN_ACCOUNT_ID": extract_from_doc(integraciones_text, "DOCUSIGN_ACCOUNT_ID"),
        "DOCUSIGN_BASE_PATH": extract_from_doc(integraciones_text, "DOCUSIGN_BASE_PATH"),
    }

    missing_expected = [k for k, v in expected.items() if not v]
    if missing_expected:
        print(f"❌ Faltan credenciales en documentación: {', '.join(missing_expected)}")
        return 1

    signer_email = None
    signer_name = None
    if DOC_DOCUSIGN.exists():
        docusign_text = read_text(DOC_DOCUSIGN)
        email_match = re.search(r"\*\*Usuario\*\*:\s*([^\s]+)", docusign_text)
        name_match = re.search(r"\*\*Nombre\*\*:\s*(.+)", docusign_text)
        signer_email = email_match.group(1).strip() if email_match else None
        signer_name = name_match.group(1).strip() if name_match else None

    if not signer_email or not signer_name:
        print("❌ No se encontró firmante de prueba en DOCUSIGN_CREDENTIALS.md")
        return 1

    server = extract_server_config(server_text)

    print("🔐 Conectando al servidor...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        server["host"],
        username=server["username"],
        password=server["password"],
        timeout=20,
    )

    try:
        status, env_content, err = exec_cmd(
            client, f"cat {server['app_path']}/.env.production", timeout=30
        )
        if status != 0 or not env_content:
            print("❌ No se pudo leer .env.production")
            return 1

        env_vars = parse_env(env_content)

        print("📌 Validación de credenciales DocuSign (mask):")
        needs_update = False
        for key, expected_value in expected.items():
            current_value = env_vars.get(key)
            ok = current_value == expected_value
            print(
                f"  - {key}: {'OK' if ok else 'MISMATCH'} "
                f"(actual {mask(current_value)} / esperado {mask(expected_value)})"
            )
            if not ok:
                needs_update = True

        private_key = env_vars.get("DOCUSIGN_PRIVATE_KEY", "")
        if not private_key or len(private_key) < 200:
            print("❌ DOCUSIGN_PRIVATE_KEY ausente o inválida en servidor")
            return 1

        if needs_update:
            print("🛠️ Actualizando credenciales DocuSign en servidor...")
            lines = env_content.splitlines()

            def upsert(key: str, value: str) -> None:
                nonlocal lines
                found = False
                for i, line in enumerate(lines):
                    if line.strip().startswith(f"{key}="):
                        lines[i] = f"{key}={value}"
                        found = True
                        break
                if not found:
                    lines.append(f"{key}={value}")

            for key, value in expected.items():
                upsert(key, value)  # type: ignore[arg-type]

            new_content = "\n".join(lines)
            exec_cmd(
                client,
                "cp {0}/.env.production {0}/.env.production.backup.docusign.$(date +%Y%m%d_%H%M%S)".format(
                    server["app_path"]
                ),
                timeout=30,
            )
            exec_cmd(
                client,
                "cat > /tmp/inmova_env_update.txt << 'ENVEOF'\n{0}\nENVEOF".format(
                    new_content
                ),
                timeout=30,
            )
            exec_cmd(
                client,
                f"cp /tmp/inmova_env_update.txt {server['app_path']}/.env.production",
                timeout=30,
            )
            exec_cmd(
                client,
                f"cd {server['app_path']} && pm2 restart inmova-app --update-env",
                timeout=60,
            )
            time.sleep(8)
            print("✅ Credenciales actualizadas y PM2 reiniciado")
        else:
            print("✅ Credenciales ya estaban correctas")

        print("🚀 Ejecutando JWT + envío de envelope...")

        node_script = r"""
const crypto = require('crypto');
const fs = require('fs');

function loadEnv(path) {
  try {
    const content = fs.readFileSync(path, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const [key, ...rest] = line.split('=');
      const value = rest.join('=').replace(/^"|"$/g, '').replace(/^'|'$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (err) {
    console.log('ERROR', 'env_read_failed');
    process.exit(1);
  }
}

loadEnv('/opt/inmova-app/.env.production');

const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
const userId = process.env.DOCUSIGN_USER_ID;
const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
const basePath = process.env.DOCUSIGN_BASE_PATH;
const privateKey = (process.env.DOCUSIGN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const signerEmail = process.env.DOCUSIGN_TEST_SIGNER_EMAIL;
const signerName = process.env.DOCUSIGN_TEST_SIGNER_NAME;

function getOAuthBasePath() {
  if ((basePath || '').includes('demo')) return 'https://account-d.docusign.com';
  return 'https://account.docusign.com';
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function main() {
  try {
    if (!integrationKey || !userId || !accountId || !basePath || !privateKey) {
      console.log('MISSING_ENV');
      process.exit(2);
    }
    if (!signerEmail || !signerName) {
      console.log('MISSING_SIGNER');
      process.exit(3);
    }

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: integrationKey,
      sub: userId,
      aud: getOAuthBasePath().replace('https://', ''),
      iat: now,
      exp: now + 3600,
      scope: 'signature impersonation',
    };

    const jwtHeaderPayload = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(jwtHeaderPayload);
    signer.end();
    const signature = signer.sign(privateKey);
    const jwt = `${jwtHeaderPayload}.${base64url(signature)}`;

    const tokenResponse = await fetch(`${getOAuthBasePath()}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.log('ERROR', tokenData.error || tokenData.error_description || tokenResponse.status);
      process.exit(1);
    }

    const accessToken = tokenData.access_token;
    console.log('JWT_OK');

    const docContent = 'Documento de prueba Inmova\\n\\nfirma\\n';
    const docBase64 = Buffer.from(docContent, 'utf8').toString('base64');

    const envelopeDefinition = {
      emailSubject: 'Inmova - Prueba DocuSign',
      emailBlurb: 'Documento de prueba Inmova (automatizado).',
      documents: [
        {
          documentBase64: docBase64,
          name: 'inmova-test.txt',
          fileExtension: 'txt',
          documentId: '1',
        },
      ],
      recipients: {
        signers: [
          {
            email: signerEmail,
            name: signerName,
            recipientId: '1',
            routingOrder: '1',
            tabs: {
              signHereTabs: [
                {
                  anchorString: 'firma',
                  anchorUnits: 'pixels',
                  anchorYOffset: '10',
                  anchorXOffset: '20',
                },
              ],
            },
          },
        ],
      },
      status: 'sent',
    };

    const envelopeResponse = await fetch(`${basePath}/v2.1/accounts/${accountId}/envelopes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelopeDefinition),
    });

    const envelopeData = await envelopeResponse.json();
    if (!envelopeResponse.ok) {
      console.log('ERROR', envelopeData.errorCode || envelopeData.message || envelopeResponse.status);
      process.exit(1);
    }

    console.log('ENVELOPE_SENT', envelopeData.envelopeId || '');
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    console.log('ERROR', msg);
    process.exit(1);
  }
}

main();
"""

        exec_cmd(
            client,
            "cat > /tmp/inmova-docusign-send.js << 'NODEEOF'\n{0}\nNODEEOF".format(
                node_script.strip()
            ),
            timeout=30,
        )

        cmd = (
            f"cd {server['app_path']} && "
            f"DOCUSIGN_TEST_SIGNER_EMAIL={shell_escape(signer_email)} "
            f"DOCUSIGN_TEST_SIGNER_NAME={shell_escape(signer_name)} "
            "node /tmp/inmova-docusign-send.js"
        )

        status, output, error = exec_cmd(client, cmd, timeout=120)
        output = output.strip()
        error = error.strip()

        print("🧾 Resultado DocuSign:")
        if output:
            for line in output.splitlines():
                print(f"  {line}")
        if error:
            print("  STDERR:")
            print(f"  {error[:500]}")
        print(f"  Exit status: {status}")

        if status != 0:
            print("❌ Error al enviar envelope")
            return 1

        if "JWT_OK" in output and "ENVELOPE_SENT" in output:
            print("✅ JWT OK y envelope enviado")
            return 0

        print("⚠️ JWT no confirmado o envelope no enviado")
        return 1
    finally:
        client.close()


if __name__ == "__main__":
    raise SystemExit(main())
