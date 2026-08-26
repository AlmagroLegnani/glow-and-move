// Uso: node scripts/promote-admin.js correo@ejemplo.com
// No hay forma de crear el primer admin desde la app (sería circular), así que se hace una
// vez por script directo contra la DB.
const prisma = require('../src/lib/prisma');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Uso: node scripts/promote-admin.js correo@ejemplo.com');
    process.exit(1);
  }
  const user = await prisma.user.update({ where: { email }, data: { role: 'admin' } });
  console.log(`${user.email} ahora es admin.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
