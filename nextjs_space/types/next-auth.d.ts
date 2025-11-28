/**
 * Extensión de tipos de NextAuth
 * Agrega campos personalizados al User y Session
 */

import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: 'administrador' | 'gestor' | 'operador';
    companyId: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'administrador' | 'gestor' | 'operador';
      companyId: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'administrador' | 'gestor' | 'operador';
    companyId: string;
  }
}
