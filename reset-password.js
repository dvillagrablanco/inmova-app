// Script simple para resetear contraseña
const bcrypt = require('bcryptjs');

const password = 'Test1234!';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
