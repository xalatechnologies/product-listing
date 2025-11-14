/**
 * Script to add credits to a user account
 * Usage: tsx scripts/add-credits.ts <email> <amount>
 */

import { PrismaClient, CreditType } from "@prisma/client";

const prisma = new PrismaClient();

async function addCredits(email: string, amount: number) {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || user.email} (ID: ${user.id})`);

    // Create credit transaction
    const transaction = await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount,
        type: CreditType.BONUS,
        description: `Manual credit addition - ${amount} credits`,
        metadata: {
          source: "manual_addition",
          addedBy: "admin",
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Calculate current balance
    const balanceResult = await prisma.creditTransaction.aggregate({
      where: { userId: user.id },
      _sum: { amount: true },
    });

    const balance = balanceResult._sum.amount || 0;

    console.log(`\n✅ Successfully added ${amount} credits to ${email}`);
    console.log(`📊 Transaction ID: ${transaction.id}`);
    console.log(`💰 New balance: ${balance} credits`);
    console.log(`\nTransaction details:`);
    console.log(`  - Type: ${transaction.type}`);
    console.log(`  - Amount: ${transaction.amount}`);
    console.log(`  - Description: ${transaction.description}`);
    console.log(`  - Created: ${transaction.createdAt.toISOString()}`);
  } catch (error) {
    console.error("❌ Error adding credits:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const email = process.argv[2];
const amount = parseInt(process.argv[3] || "1000", 10);

if (!email) {
  console.error("Usage: tsx scripts/add-credits.ts <email> [amount]");
  console.error("Example: tsx scripts/add-credits.ts ibrahim@xala.no 1000");
  process.exit(1);
}

if (isNaN(amount) || amount <= 0) {
  console.error("❌ Amount must be a positive number");
  process.exit(1);
}

addCredits(email, amount);

