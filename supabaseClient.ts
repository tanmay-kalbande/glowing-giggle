import { createClient, SupabaseClient, User, RealtimeChannel } from '@supabase/supabase-js';
import { Business, Category } from './types';
import { DataVersion } from './cacheService';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing!');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// Database Types (matching snake_case from DB)
// ============================================
export interface DbBusiness {
  id: string;
  category: string;
  shop_name: string;
  owner_name: string;
  contact_number: string;
  address?: string;
  opening_hours?: string;
  services?: string[];
  home_delivery?: boolean;
  payment_options?: string[];
  created_at?: string;
  updated_at?: string;
  avg_rating?: number;
  rating_count?: number;
}

// ============================================
// Helper Functions: Convert between formats
// ============================================
export const dbBusinessToBusiness = (db: DbBusiness): Business => ({
  id: db.id,
  category: db.category,
  shopName: db.shop_name,
  ownerName: db.owner_name,
  contactNumber: db.contact_number,
  address: db.address,
  openingHours: db.opening_hours,
  services: db.services || [],
  homeDelivery: db.home_delivery || false,
  paymentOptions: db.payment_options || [],
  avgRating: db.avg_rating || 0,
  ratingCount: db.rating_count || 0,
  createdAt: db.created_at,
});

export const businessToDbBusiness = (business: Business): Partial<DbBusiness> => ({
  id: business.id,
  category: business.category,
  shop_name: business.shopName,
  owner_name: business.ownerName,
  contact_number: business.contactNumber,
  address: business.address,
  opening_hours: business.openingHours,
  services: business.services || [],
  home_delivery: business.homeDelivery || false,
  payment_options: business.paymentOptions || [],
});

// ============================================
// Authentication Functions
// ============================================
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  const { data: adminProfile, error: adminError } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  
  if (adminError || !adminProfile) {
    await supabase.auth.signOut();
    throw new Error('You are not authorized as an admin');
  }
  
  return { user: data.user };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const isUserAdmin = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('id')
    .eq('id', userId)
    .single();
  
  return !error && !!data;
};

// ============================================
// Categories Functions
// ============================================
export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
};

// ============================================
// Businesses Functions
// ============================================
export const fetchBusinesses = async (): Promise<Business[]> => {
  // FIX: Replaced broken RPC call with a direct query and client-side processing.
  // This is more robust against backend SQL function errors.
  const { data, error } = await supabase
    .from('businesses')
    .select('*, business_ratings(rating)')
    .order('shop_name', { ascending: true });

  if (error) {
    console.error("Error fetching businesses with ratings:", error);
    // If the join fails, fall back to fetching just businesses
    return fetchBusinessesWithoutRatings();
  }
  
  // Process the data to calculate avgRating and ratingCount
  const businessesWithRatings = data.map(b => {
    const ratings = (b as any).business_ratings;
    const ratingCount = ratings.length;
    const avgRating = ratingCount > 0 
      ? ratings.reduce((sum: number, r: {rating: number}) => sum + r.rating, 0) / ratingCount 
      : 0;
    
    // Remove the temporary ratings array from the object
    const { business_ratings, ...rest } = b as any;

    return dbBusinessToBusiness({
      ...rest,
      avg_rating: avgRating,
      rating_count: ratingCount,
    } as DbBusiness);
  });

  return businessesWithRatings;
};

const fetchBusinessesWithoutRatings = async (): Promise<Business[]> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('shop_name', { ascending: true });
  
  if (error) throw error;
  return (data || []).map(dbBusinessToBusiness);
};

export const addBusiness = async (business: Business): Promise<Business> => {
  const dbBusiness = businessToDbBusiness(business);
  if (!dbBusiness.id) delete dbBusiness.id;
  
  const { data, error } = await supabase
    .from('businesses')
    .insert([dbBusiness])
    .select()
    .single();
  
  if (error) throw error;
  return dbBusinessToBusiness(data);
};

export const updateBusiness = async (business: Business): Promise<Business> => {
  const dbBusiness = businessToDbBusiness(business);
  
  const { data, error } = await supabase
    .from('businesses')
    .update(dbBusiness)
    .eq('id', business.id)
    .select()
    .single();
  
  if (error) throw error;
  return dbBusinessToBusiness(data);
};

export const deleteBusiness = async (businessId: string): Promise<void> => {
  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', businessId);
  
  if (error) throw error;
};

// This is a partial replacement for the rating-related functions in supabaseClient.ts
// Replace the existing rating functions with these improved versions

import { supabase } from './supabaseClient'; // Assuming main export exists

// ============================================
// RATING FUNCTIONS - Enhanced with Edit Support
// ============================================
interface AddRatingPayload {
  businessId: string;
  rating: number;
  deviceId: string;
  userName?: string;
}

interface RatingResponse {
  success: boolean;
  message: string;
  newAvgRating?: number;
  newRatingCount?: number;
  wasUpdate?: boolean;
}

export const addBusinessRating = async ({ 
  businessId, 
  rating, 
  deviceId,
  userName
}: AddRatingPayload): Promise<RatingResponse> => {
  if (rating < 1 || rating > 5) {
    throw new Error('रेटिंग १ ते ५ च्या दरम्यान असणे आवश्यक आहे.');
  }

  if (!businessId || businessId.trim() === '') {
    throw new Error('अवैध व्यवसाय ID.');
  }

  try {
    // Check for existing rating
    const { data: existingRating, error: checkError } = await supabase
      .from('business_ratings')
      .select('id, rating')
      .eq('business_id', businessId)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error checking existing rating:', checkError);
      throw new Error('रेटिंग तपासताना त्रुटी आली.');
    }

    let wasUpdate = false;

    if (existingRating) {
      // UPDATE existing rating
      wasUpdate = true;
      const { error: updateError } = await supabase
        .from('business_ratings')
        .update({ 
          rating,
          user_name: userName || null,
          created_at: new Date().toISOString() // Update timestamp
        })
        .eq('id', existingRating.id);

      if (updateError) {
        console.error('Error updating rating:', updateError);
        throw new Error('रेटिंग अपडेट करताना त्रुटी आली.');
      }
    } else {
      // INSERT new rating
      const { error: insertError } = await supabase
        .from('business_ratings')
        .insert([{
          business_id: businessId,
          rating,
          device_id: deviceId,
          user_name: userName || null
        }]);

      if (insertError) {
        console.error('Error inserting rating:', insertError);
        
        if (insertError.code === '23505') {
          throw new Error('तुम्ही या व्यवसायाला आधीच रेट केले आहे.');
        }
        
        if (insertError.code === '23503') {
          throw new Error('हा व्यवसाय अस्तित्वात नाही.');
        }
        
        throw new Error('रेटिंग सेव्ह करताना त्रुटी आली.');
      }
    }

    // Fetch updated statistics
    const stats = await getBusinessRatingStats(businessId);

    return {
      success: true,
      message: wasUpdate 
        ? '✓ तुमचे रेटिंग अपडेट झाले!' 
        : (userName 
            ? `✓ धन्यवाद ${userName}! तुमचे रेटिंग स्वीकारले आहे.` 
            : '✓ तुमचे रेटिंग स्वीकारले आहे, धन्यवाद!'),
      newAvgRating: stats.avgRating,
      newRatingCount: stats.ratingCount,
      wasUpdate
    };

  } catch (error: any) {
    console.error('Rating submission error:', error);
    throw error;
  }
};

export const getBusinessRatingStats = async (businessId: string): Promise<{ avgRating: number; ratingCount: number }> => {
  try {
    // Try RPC first
    const { data, error } = await supabase
      .rpc('get_business_ratings_stats', { p_business_id: businessId });

    if (!error && data) {
      return {
        avgRating: data.avgrating || 0,
        ratingCount: data.ratingcount || 0
      };
    }
  } catch (rpcError) {
    console.warn('RPC failed, using fallback:', rpcError);
  }

  // Fallback: Calculate from raw data
  const { data: ratings, error: ratingsError } = await supabase
    .from('business_ratings')
    .select('rating')
    .eq('business_id', businessId);

  if (ratingsError || !ratings) {
    console.error('Error in fallback rating fetch:', ratingsError);
    return { avgRating: 0, ratingCount: 0 };
  }

  const count = ratings.length;
  const avg = count > 0 
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / count 
    : 0;
  
  return { avgRating: avg, ratingCount: count };
};

export const hasDeviceRated = async (businessId: string, deviceId: string): Promise<boolean> => {
  try {
    // Try RPC first
    const { data, error } = await supabase
      .rpc('has_device_rated_business', { 
        p_business_id: businessId, 
        p_device_id: deviceId 
      });

    if (!error) {
      return !!data;
    }
  } catch (rpcError) {
    console.warn('RPC failed, using fallback:', rpcError);
  }

  // Fallback
  const { data: rating, error: ratingError } = await supabase
    .from('business_ratings')
    .select('id')
    .eq('business_id', businessId)
    .eq('device_id', deviceId)
    .maybeSingle();

  if (ratingError && ratingError.code !== 'PGRST116') {
    console.error('Error checking device rating:', ratingError);
    return false;
  }

  return !!rating;
};

export const getBusinessRatings = async (businessId: string) => {
  const { data, error } = await supabase
    .from('business_ratings')
    .select('rating, user_name, created_at, device_id')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching ratings:', error);
    return [];
  }

  return data || [];
};

// Get user's specific rating for a business
export const getUserRating = async (businessId: string, deviceId: string): Promise<number | null> => {
  const { data, error } = await supabase
    .from('business_ratings')
    .select('rating')
    .eq('business_id', businessId)
    .eq('device_id', deviceId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.rating;
};

// ============================================
// Admin Statistics
// ============================================
export interface AdminStatistics {
  total_businesses: number;
  total_categories: number;
  total_ratings: number;
  avg_rating_overall: number;
  businesses_with_delivery: number;
  recent_businesses: Array<{
    shop_name: string;
    owner_name: string;
    created_at: string;
  }>;
  top_rated_businesses: Array<{
    shop_name: string;
    owner_name: string;
    avg_rating: number;
    rating_count: number;
  }>;
  category_stats: Array<{
    category_name: string;
    business_count: number;
  }>;
  recent_ratings: Array<{
    business_name: string;
    rating: number;
    user_name: string | null;
    created_at: string;
  }>;
}

export const getAdminStatistics = async (): Promise<AdminStatistics | null> => {
  // FIX: Replaced broken RPC with a client-side implementation to ensure dashboard works.
  try {
    // Fetch all necessary raw data in parallel
    const [
      businessesData,
      categoriesData,
      ratingsData,
      deliveryData,
      recentRatingsData
    ] = await Promise.all([
      supabase.from('businesses').select('*, business_ratings(rating, created_at, user_name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name'),
      supabase.from('business_ratings').select('rating', { count: 'exact' }),
      supabase.from('businesses').select('id', { count: 'exact' }).eq('home_delivery', true),
      supabase.from('business_ratings').select('rating, user_name, created_at, businesses(shop_name)').order('created_at', { ascending: false }).limit(5)
    ]);

    // Check for errors in parallel fetches
    if (businessesData.error) throw businessesData.error;
    if (categoriesData.error) throw categoriesData.error;
    if (ratingsData.error) throw ratingsData.error;
    if (deliveryData.error) throw deliveryData.error;
    if (recentRatingsData.error) throw recentRatingsData.error;

    const allBusinesses = businessesData.data as any[];
    const allCategories = categoriesData.data;
    const totalRatings = ratingsData.count || 0;
    const totalBusinesses = allBusinesses.length;

    // Calculate overall average rating
    const totalRatingSum = allBusinesses.reduce((acc, b) => {
        return acc + b.business_ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
    }, 0);
    const avgRatingOverall = totalRatings > 0 ? totalRatingSum / totalRatings : 0;

    // Process businesses for top rated and category stats
    const processedBusinesses = allBusinesses.map(b => {
      const ratings = b.business_ratings;
      const ratingCount = ratings.length;
      const avgRating = ratingCount > 0 ? ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratingCount : 0;
      return { ...b, avgRating, ratingCount };
    });

    // Get top 5 rated businesses
    const topRatedBusinesses = [...processedBusinesses]
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5)
      .map(b => ({
        shop_name: b.shop_name,
        owner_name: b.owner_name,
        avg_rating: b.avgRating,
        rating_count: b.ratingCount,
      }));

    // Get recent 5 businesses
    const recentBusinesses = allBusinesses.slice(0, 5).map(b => ({
      shop_name: b.shop_name,
      owner_name: b.owner_name,
      created_at: b.created_at,
    }));

    // Calculate category stats
    const categoryMap = new Map(allCategories.map(c => [c.id, c.name]));
    const categoryCounts = allBusinesses.reduce((acc, b) => {
      const catName = categoryMap.get(b.category) || 'Uncategorized';
      acc[catName] = (acc[catName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const categoryStats = Object.entries(categoryCounts).map(([name, count]) => ({
      category_name: name,
      business_count: count,
    })).sort((a,b) => b.business_count - a.business_count);
    
    // Format recent ratings
    const recentRatings = (recentRatingsData.data as any[]).map((r: any) => ({
        business_name: r.businesses.shop_name,
        rating: r.rating,
        user_name: r.user_name,
        created_at: r.created_at
    }));

    return {
      total_businesses: totalBusinesses,
      total_categories: allCategories.length,
      total_ratings: totalRatings,
      avg_rating_overall: avgRatingOverall,
      businesses_with_delivery: deliveryData.count || 0,
      recent_businesses: recentBusinesses,
      top_rated_businesses: topRatedBusinesses,
      category_stats: categoryStats,
      recent_ratings: recentRatings,
    };

  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    return null;
  }
};

// ============================================
// Data Version/Sync Functions
// ============================================
export const getDataVersion = async (): Promise<DataVersion> => {
  try {
    const { count, error: countError } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true });
    if (countError) throw countError;
    
    const { data: businessUpdate, error: businessError } = await supabase
      .from('businesses')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    const { data: ratingUpdate, error: ratingError } = await supabase
      .from('business_ratings')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastBusinessUpdate = businessUpdate ? new Date(businessUpdate.updated_at) : new Date(0);
    const lastRatingUpdate = ratingUpdate ? new Date(ratingUpdate.created_at) : new Date(0);
    
    const last_updated = lastBusinessUpdate > lastRatingUpdate 
      ? lastBusinessUpdate.toISOString() 
      : lastRatingUpdate.toISOString();

    return {
      business_count: count || 0,
      last_updated,
      last_sync: 0,
    };
  } catch (error) {
    console.error('Error fetching data version:', error);
    return {
      business_count: -1,
      last_updated: new Date(0).toISOString(),
      last_sync: 0,
    };
  }
};

// ============================================
// Real-time Subscriptions
// ============================================
export const subscribeToBusinessChanges = (
  callback: (payload: any) => void
): RealtimeChannel => {
  return supabase
    .channel('public-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'businesses' },
      callback
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'business_ratings' },
      callback
    )
    .subscribe();
};
