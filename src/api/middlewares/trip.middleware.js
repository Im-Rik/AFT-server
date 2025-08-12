import { supabase } from '../../config/supabaseClient.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const isTripAdmin = asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const userId = req.user.id;

  if (!tripId) {
    throw new ApiError(400, 'Trip ID is missing from request parameters.');
  }

  const { data, error } = await supabase
    .from('trip_participants')
    .select('role')
    .match({ user_id: userId, trip_id: tripId })
    .single();

  if (error || !data) {
    throw new ApiError(404, 'Forbidden: You are not a participant of this trip.');
  }

  if (data.role !== 'admin') {
    throw new ApiError(403, 'Forbidden: Admin access required.');
  }

  next();
});

export const isTripMember = asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const userId = req.user.id;

  if (!tripId) {
    throw new ApiError(400, 'Trip ID is missing from request parameters.');
  }

  const { count, error } = await supabase
    .from('trip_participants')
    .select('*', { count: 'exact', head: true })
    .match({ user_id: userId, trip_id: tripId });

  if (error) throw error;

  if (count === 0) {
    throw new ApiError(403, 'Forbidden: You are not a participant of this trip.');
  }

  next();
});