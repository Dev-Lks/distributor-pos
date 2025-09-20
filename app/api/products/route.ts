import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { products, Product } from '@/lib/products';

export async function POST() {
  try {
    // Check if products already exist
    const existingProducts = await prisma.product.findMany();
    if (existingProducts.length > 0) {
      return NextResponse.json({ message: 'Products already seeded' });
    }

    // Seed products
    const createdProducts = await prisma.product.createMany({
      data: products.map((product: Product) => ({
        id: product.id,
        name: product.name,
        size: product.size,
        price: product.price
      }))
    });

    return NextResponse.json({
      message: 'Products seeded successfully',
      count: createdProducts.count
    });
  } catch (error) {
    console.error('Error seeding products:', error);
    return NextResponse.json(
      { error: 'Failed to seed products' },
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