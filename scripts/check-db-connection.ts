#!/usr/bin/env tsx

/**
 * Database Connection Checker
 * 
 * Verifies database connection and provides troubleshooting information
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking database connection...\n');

  // Check environment variables
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in .env file');
    process.exit(1);
  }

  // Parse connection string (without exposing password)
  try {
    const url = new URL(databaseUrl.replace(/^postgresql:/, 'http:'));
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.replace('/', '');
    const user = url.username;

    console.log('📋 Connection Details:');
    console.log(`   Host: ${host}`);
    console.log(`   Port: ${port}`);
    console.log(`   Database: ${database}`);
    console.log(`   User: ${user}`);
    console.log(`   Direct URL: ${directUrl ? 'Set' : 'Not set'}\n`);
  } catch (error) {
    console.warn('⚠️  Could not parse DATABASE_URL format');
  }

  // Try to connect
  console.log('🔌 Attempting to connect...');
  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to database!\n');

    // Test a simple query
    console.log('🧪 Testing query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query test successful!\n');

    // Check if tables exist
    console.log('📊 Checking tables...');
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    if (tables.length > 0) {
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach((table) => {
        console.log(`   - ${table.tablename}`);
      });
    } else {
      console.log('⚠️  No tables found. You may need to run migrations:');
      console.log('   npx prisma migrate dev');
    }

    console.log('\n✅ Database connection is working!');
    console.log('   You can now run: npm run seed:test');
  } catch (error: any) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error:', error.message);
    
    if (error.message.includes('Tenant or user not found')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Check if your Supabase project is paused');
      console.error('      → Go to https://supabase.com/dashboard');
      console.error('      → Check project status');
      console.error('   2. Verify your connection string is correct');
      console.error('      → Get it from Supabase Dashboard → Settings → Database');
      console.error('   3. Check if the database user exists');
    } else if (error.message.includes("Can't reach database server")) {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Check your network connection');
      console.error('   2. Verify the hostname is correct');
      console.error('   3. Check if Supabase project is active');
      console.error('   4. Try using DIRECT_URL instead of DATABASE_URL');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Verify your database password is correct');
      console.error('   2. Get fresh credentials from Supabase Dashboard');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

