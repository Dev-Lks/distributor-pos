import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { products, Product } from '@/lib/products';

export async function POST() {
  try {
    console.log('POST /api/products - Starting product seeding');

    // Check if products already exist
    const existingProducts = await prisma.product.findMany();
    if (existingProducts.length > 0) {
      console.log(`Products already exist: ${existingProducts.length} products found`);
      return NextResponse.json({ message: 'Products already seeded' });
    }

    console.log(`Seeding ${products.length} products...`);

    // Seed products
    const createdProducts = await prisma.product.createMany({
      data: products.map((product: Product) => ({
        id: product.id,
        name: product.name,
        size: product.size,
        price: product.price
      }))
    });

    console.log(`Successfully seeded ${createdProducts.count} products`);
    return NextResponse.json({
      message: 'Products seeded successfully',
      count: createdProducts.count
    });
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
    const products = await prisma.product.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}