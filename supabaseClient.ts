import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Business, Category } from './types';
import { DataVersion } from './cacheService';

// Fix for TypeScript error: Property 'env' does not exist on type 'ImportMeta'.
// Vite replaces these variables at build time, so we can safely cast to 'any' to bypass the type check.
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
  // These fields come from the RPC call
  avg_rating?: number;
  rating_count?: number;
}

// ============================================
// Helper Functions: Convert between formats
// ============================================

// Convert DB format (snake_case) to App format (camelCase)
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
  avgRating: db.avg_rating,
  ratingCount: db.rating_count,
  createdAt: db.created_at,
});

// Convert App format (camelCase) to DB format (snake_case)
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
  // Use an RPC call to a Postgres function to get businesses with aggregated ratings
  // This is more efficient than fetching all ratings and calculating on the client.
  const { data, error } = await supabase.rpc('get_businesses_with_ratings');
  
  if (error) {
    console.error("Error fetching businesses with ratings:", error);
    // Fallback to fetching businesses without ratings if RPC fails
    return fetchBusinessesWithoutRatings();
  }
  return (data || []).map(dbBusinessToBusiness);
};

const fetchBusinessesWithoutRatings = async (): Promise<Business[]> => {
    const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('shop_name', { ascending: true });
  
  if (error) throw error;
  return (data || []).map(dbBusinessToBusiness);
}

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

// ============================================
// RATING FUNCTIONS - Enhanced Version
// ============================================

interface AddRatingPayload {
  businessId: string;
  rating: number;
  deviceId: string;
}

interface RatingResponse {
  success: boolean;
  message: string;
  newAvgRating?: number;
  newRatingCount?: number;
}

/**
 * Adds a rating for a business with enhanced error handling and validation
 * @param businessId - The ID of the business being rated
 * @param rating - The rating value (1-5)
 * @param deviceId - Unique device identifier to prevent duplicate ratings
 * @returns Promise with rating response details
 */
export const addBusinessRating = async ({ 
  businessId, 
  rating, 
  deviceId 
}: AddRatingPayload): Promise<RatingResponse> => {
  // Validate rating value
  if (rating < 1 || rating > 5) {
    throw new Error('रेटिंग १ ते ५ च्या दरम्यान असणे आवश्यक आहे.');
  }

  // Validate businessId
  if (!businessId || businessId.trim() === '') {
    throw new Error('अवैध व्यवसाय ID.');
  }

  try {
    // First check if this device has already rated this business
    const { data: existingRating, error: checkError } = await supabase
      .from('business_ratings')
      .select('id, rating')
      .eq('business_id', businessId)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing rating:', checkError);
      throw new Error('रेटिंग तपासताना त्रुटी आली.');
    }

    // If already rated, inform the user
    if (existingRating) {
      throw new Error('तुम्ही या व्यवसायाला आधीच रेट केले आहे.');
    }

    // Insert the new rating
    const { error: insertError } = await supabase
      .from('business_ratings')
      .insert([{
        business_id: businessId,
        rating,
        device_id: deviceId
      }]);

    if (insertError) {
      console.error('Error inserting rating:', insertError);
      
      // Handle unique constraint violation (duplicate rating)
      if (insertError.code === '23505') {
        throw new Error('तुम्ही या व्यवसायाला आधीच रेट केले आहे.');
      }
      
      // Handle foreign key constraint (business doesn't exist)
      if (insertError.code === '23503') {
        throw new Error('हा व्यवसाय अस्तित्वात नाही.');
      }
      
      throw new Error('रेटिंग सेव्ह करताना त्रुटी आली.');
    }

    // Fetch updated rating statistics
    const { data: stats, error: statsError } = await supabase
      .from('business_ratings')
      .select('rating')
      .eq('business_id', businessId);

    if (statsError) {
      console.error('Error fetching rating stats:', statsError);
      // Rating was saved, but we couldn't get updated stats
      return {
        success: true,
        message: 'तुमचे रेटिंग स्वीकारले आहे, धन्यवाद!'
      };
    }

    // Calculate new statistics
    const ratings = stats || [];
    const totalRatings = ratings.length;
    const sumRatings = ratings.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    return {
      success: true,
      message: 'तुमचे रेटिंग स्वीकारले आहे, धन्यवाद!',
      newAvgRating: avgRating,
      newRatingCount: totalRatings
    };

  } catch (error: any) {
    console.error('Rating submission error:', error);
    throw error;
  }
};

/**
 * Fetches all ratings for a specific business
 * @param businessId - The ID of the business
 * @returns Array of rating objects
 */
export const getBusinessRatings = async (businessId: string) => {
  const { data, error } = await supabase
    .from('business_ratings')
    .select('rating, created_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching ratings:', error);
    throw error;
  }

  return data || [];
};

/**
 * Gets rating statistics for a business
 * @param businessId - The ID of the business
 * @returns Object with average rating and count
 */
export const getBusinessRatingStats = async (businessId: string) => {
  const { data, error } = await supabase
    .from('business_ratings')
    .select('rating')
    .eq('business_id', businessId);

  if (error) {
    console.error('Error fetching rating stats:', error);
    return { avgRating: 0, ratingCount: 0 };
  }

  const ratings = data || [];
  const count = ratings.length;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  const avg = count > 0 ? sum / count : 0;

  return {
    avgRating: avg,
    ratingCount: count
  };
};

/**
 * Checks if a device has already rated a specific business
 * @param businessId - The ID of the business
 * @param deviceId - The device identifier
 * @returns Boolean indicating if already rated
 */
export const hasDeviceRated = async (
  businessId: string, 
  deviceId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('business_ratings')
      .select('id')
      .eq('business_id', businessId)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (error) {
      console.error('Error checking rating status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasDeviceRated:', error);
    return false;
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
    
    // Check last update on both businesses and ratings table
    const { data: businessUpdate, error: businessError } = await supabase
      .from('businesses')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
      
    const { data: ratingUpdate, error: ratingError } = await supabase
      .from('business_ratings')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (businessError && businessError.code !== 'PGRST116') throw businessError;
    if (ratingError && ratingError.code !== 'PGRST116') throw ratingError;
    
    const lastBusinessUpdate = businessUpdate ? new Date(businessUpdate.updated_at) : new Date(0);
    const lastRatingUpdate = ratingUpdate ? new Date(ratingUpdate.created_at) : new Date(0);
    
    const last_updated = lastBusinessUpdate > lastRatingUpdate ? lastBusinessUpdate.toISOString() : lastRatingUpdate.toISOString();

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
) => {
  return supabase
    .channel('public-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'businesses' },
      callback
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'business_ratings' },
      callback
    )
    .subscribe();
};
