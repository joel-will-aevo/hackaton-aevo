const { PrismaClient } = require("./lib/prisma");

const prisma = new PrismaClient({ log: ["query"] });

async function main() {
  try {
    const count = await prisma.quiz.count();
    console.log("Quiz count:", count);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });