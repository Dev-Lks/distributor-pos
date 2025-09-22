import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { products, Product } from '@/lib/products';

export async function POST() {
  try {
    console.log('POST /api/products - Starting product seeding');

    console.log(`Upserting ${products.length} products...`);

    let count = 0;
    for (const p of products) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: { name: p.name, size: p.size, price: p.price },
        create: { id: p.id, name: p.name, size: p.size, price: p.price }
      });
      count += 1;
    }

    console.log(`Successfully upserted ${count} products`);
    return NextResponse.json({ message: 'Products upserted successfully', count });
  } catch (error) {
    console.error('Error seeding products:', error);
    return NextResponse.json(
      { error: 'Failed to seed products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('GET /api/products - Starting request');

    // Check database connection
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    console.log('Fetching products from database...');
    const products = await prisma.product.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`Found ${products.length} products`);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}