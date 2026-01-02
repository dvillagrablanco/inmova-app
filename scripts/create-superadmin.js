process.env.DATABASE_URL = "postgresql://inmova_user:InmovaSecure2026DB@localhost:5432/inmova_production";

const bcrypt = require("./node_modules/bcryptjs");
const { PrismaClient } = require("./node_modules/@prisma/client");

const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Asegurar que existe una company
    const company = await prisma.company.upsert({
      where: { id: "default-company" },
      update: {},
      create: {
        id: "default-company",
        nombre: "Inmova Default Company",
        cif: "12345678A"
      }
    });
    
    console.log("✅ Company:", company.id);
    
    // 2. Crear/actualizar usuario
    const password = "Admin123!";
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.upsert({
      where: { email: "superadmin@inmova.app" },
      update: {
        password: hashedPassword,
        activo: true,
        role: "super_admin"
      },
      create: {
        email: "superadmin@inmova.app",
        name: "Super Admin",
        password: hashedPassword,
        activo: true,
        role: "super_admin",
        companyId: company.id
      }
    });
    
    console.log("✅ Usuario:", user.email, "- Role:", user.role);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
