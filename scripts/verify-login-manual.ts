/**
 * Script para verificar el login manualmente usando fetch
 */

async function verifyLogin() {
  console.log('\n🔐 Verificando Login en inmovaapp.com\n');
  console.log('═'.repeat(60));

  try {
    // 1. Obtener CSRF token
    console.log('\n1️⃣ Obteniendo CSRF token...');
    const csrfResponse = await fetch('https://inmovaapp.com/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();
    console.log(`   ✅ CSRF Token obtenido: ${csrfToken.substring(0, 20)}...`);

    // 2. Intentar login
    console.log('\n2️⃣ Intentando login...');
    console.log('   Email: admin@inmova.app');
    console.log('   Password: Test1234!');

    const loginResponse = await fetch('https://inmovaapp.com/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'admin@inmova.app',
        password: 'Test1234!',
        csrfToken: csrfToken,
        callbackUrl: '/',
        json: 'true',
      }),
      redirect: 'manual', // No seguir redirects automáticamente
    });

    console.log(`\n   📊 Status: ${loginResponse.status}`);
    console.log(`   📍 Status Text: ${loginResponse.statusText}`);

    // Verificar el resultado
    if (loginResponse.status === 302 || loginResponse.status === 200) {
      console.log('\n   ✅ ¡LOGIN EXITOSO!');
      
      const location = loginResponse.headers.get('location');
      if (location) {
        console.log(`   📍 Redirect a: ${location}`);
      }

      const cookies = loginResponse.headers.get('set-cookie');
      if (cookies) {
        console.log(`   🍪 Cookies establecidas: ${cookies.substring(0, 100)}...`);
      }

      console.log('\n═'.repeat(60));
      console.log('✅ RESULTADO: Login funciona correctamente\n');
      
      return true;
    } else if (loginResponse.status === 401) {
      console.log('\n   ❌ LOGIN FALLIDO - Credenciales incorrectas');
      console.log('   Status: 401 Unauthorized');
      
      const text = await loginResponse.text();
      console.log(`   Respuesta: ${text.substring(0, 200)}`);
      
      console.log('\n═'.repeat(60));
      console.log('❌ RESULTADO: Credenciales incorrectas\n');
      
      return false;
    } else {
      console.log(`\n   ⚠️  Status inesperado: ${loginResponse.status}`);
      const text = await loginResponse.text();
      console.log(`   Respuesta: ${text.substring(0, 300)}`);
      
      return false;
    }
  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error);
    return false;
  }
}

// Ejecutar
verifyLogin()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
