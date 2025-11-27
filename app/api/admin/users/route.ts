import { NextRequest, NextResponse } from 'next/server';
import { isValidAdminRequest } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  // Validate admin authentication
  const authHeader = request.headers.get('Authorization');
  if (!isValidAdminRequest(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerClient();

    // Fetch users with their coupon data using a join
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        created_at,
        coupons (
          id,
          code,
          name,
          type,
          used_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Transform the data to flatten the coupon relationship
    const transformedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      registeredAt: user.created_at,
      couponType: user.coupons?.type || null,
      couponCode: user.coupons?.code || null,
      couponName: user.coupons?.name || null,
      wonAt: user.coupons?.used_at || null,
    }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Error in admin users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

