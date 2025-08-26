import jwt from 'jsonwebtoken';
import { supabase } from '../../config/supabaseClient.js';
import { config } from '../../config/config.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.accessToken || req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Unauthorized: No token provided.');
  }

  try {
    const decodedPayload = jwt.verify(token, config.jwtSecret);
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, username')
      .eq('id', decodedPayload.id)
      .single();

    if (error || !user) {
      throw new ApiError(401, 'Unauthorized: User not found or invalid token.');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, 'Unauthorized: Invalid token.');
    }
    throw err;
  }
});

// Middleware to verify the temporary token used for registration
export const verifyRegistrationToken = asyncHandler(async (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Unauthorized: Registration token is required.');
  }

  try {
    const decodedPayload = jwt.verify(token, config.jwtSecret);

    if (!decodedPayload.email || decodedPayload.type !== 'registration') {
      throw new ApiError(401, 'Unauthorized: Invalid registration token.');
    }

    // Attach the verified user details for the final registration step
    req.signupDetails = {
      name: decodedPayload.name,
      email: decodedPayload.email,
      hashedPassword: decodedPayload.hashedPassword,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, 'Unauthorized: Invalid registration token.');
    }
    throw err;
  }
});