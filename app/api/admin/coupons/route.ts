import { NextRequest, NextResponse } from 'next/server';
import { isValidAdminRequest } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase';
import { CouponType, ALL_COUPON_TYPES, CouponTypeDisplayNames } from '@/types/enums';

export async function GET(request: NextRequest) {
  // Validate admin authentication
  const authHeader = request.headers.get('Authorization');
  if (!isValidAdminRequest(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    
    // Get filter parameters
    const usedFilter = searchParams.get('used'); // "true" | "false" | null
    const typeFilter = searchParams.get('type'); // CouponType value | null

    // Build query
    let query = supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (usedFilter === 'true') {
      query = query.eq('used', true);
    } else if (usedFilter === 'false') {
      query = query.eq('used', false);
    }

    if (typeFilter && ALL_COUPON_TYPES.includes(typeFilter as CouponType)) {
      query = query.eq('type', typeFilter);
    }

    const { data: coupons, error } = await query;

    if (error) {
      console.error('Error fetching coupons:', error);
      return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
    }

    // Transform the data
    const transformedCoupons = coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      name: coupon.name,
      displayName: CouponTypeDisplayNames[coupon.type as CouponType] || coupon.name,
      used: coupon.used,
      usedAt: coupon.used_at,
      createdAt: coupon.created_at,
    }));

    return NextResponse.json({ coupons: transformedCoupons });
  } catch (error) {
    console.error('Error in admin coupons API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Validate admin authentication
  const authHeader = request.headers.get('Authorization');
  if (!isValidAdminRequest(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const body = await request.json();
    
    const { type, codes } = body as { type: string; codes: string[] };

    // Validate input
    if (!type || !ALL_COUPON_TYPES.includes(type as CouponType)) {
      return NextResponse.json({ error: 'Invalid coupon type' }, { status: 400 });
    }

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json({ error: 'No codes provided' }, { status: 400 });
    }

    // Get the display name for this type
    const name = CouponTypeDisplayNames[type as CouponType] || type;

    let imported = 0;
    const duplicates: string[] = [];
    const errors: string[] = [];

    // Insert each code
    for (const code of codes) {
      const trimmedCode = code.trim();
      if (!trimmedCode) {
        continue;
      }

      const { error } = await supabase
        .from('coupons')
        .insert({
          code: trimmedCode,
          name,
          type,
          used: false,
        });

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation - code already exists
          duplicates.push(trimmedCode);
        } else {
          errors.push(`Failed to insert ${trimmedCode}: ${error.message}`);
        }
      } else {
        imported++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped: duplicates.length,
      duplicates,
      errors,
    });
  } catch (error) {
    console.error('Error in admin coupons import:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Validate admin authentication
  const authHeader = request.headers.get('Authorization');
  if (!isValidAdminRequest(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    // Check if coupon is used (has a user associated)
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('id, used')
      .eq('id', id)
      .single();

    if (fetchError || !coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    if (coupon.used) {
      return NextResponse.json({ error: 'Cannot delete a used coupon' }, { status: 400 });
    }

    // Delete the coupon
    const { error: deleteError } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting coupon:', deleteError);
      return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin coupon delete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

