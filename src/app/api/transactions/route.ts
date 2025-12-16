import { NextRequest, NextResponse } from 'next/server';
import { Transaction } from '@/lib/types';

// Mock data store (in production, this would be Firebase)
const mockTransactions: Transaction[] = [];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const userTransactions = mockTransactions.filter(
      (t) => t.userId === userId
    );

    return NextResponse.json(
      { transactions: userTransactions },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, amount, type, date, category, userId } = body;

    // Validation - check for missing fields (but allow 0 for amount)
    if (
      description === undefined || description === null || description === '' ||
      amount === undefined || amount === null ||
      type === undefined || type === null || type === '' ||
      date === undefined || date === null || date === '' ||
      category === undefined || category === null || category === '' ||
      userId === undefined || userId === null || userId === ''
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json(
        { error: 'Type must be "income" or "expense"' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const newTransaction: Transaction = {
      id: `txn_${Date.now()}`,
      description,
      amount,
      type,
      date,
      category,
      userId,
    };

    mockTransactions.push(newTransaction);

    return NextResponse.json(
      { transaction: newTransaction },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

