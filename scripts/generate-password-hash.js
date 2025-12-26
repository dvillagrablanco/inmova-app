// Script para generar hash de password para el socio fundador
const bcrypt = require('bcryptjs');

const password = 'Ewoorker2025!Socio';

bcrypt.hash(password, 10).then(hash => {
  console.log('\n==============================================');
  console.log('🔐 HASH DE PASSWORD GENERADO');
  console.log('==============================================\n');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\n==============================================\n');
  console.log('Usa este hash en el SQL:\n');
  console.log(`UPDATE "User" SET password = '${hash}' WHERE email = 'socio@ewoorker.com';`);
  console.log('\n==============================================\n');
}).catch(err => {
  console.error('Error:', err);
});
