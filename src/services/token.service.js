import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { ApiError } from '../utils/ApiError.js';

export const generateTokenForUser = (user) => {
  if (!config.jwtSecret) {
    throw new ApiError(500, 'JWT_SECRET is not defined in the environment variables.');
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    username: user.username
  };

  return jwt.sign(tokenPayload, config.jwtSecret, {
    expiresIn: '90d',
  });
};

export const generateSignupToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '10m' });
};

export const generateRegistrationToken = (payload) => {
  return jwt.sign(
    { ...payload, type: 'registration' },
    config.jwtSecret,
    { expiresIn: '15m' }
  );
};

export const generatePasswordResetToken = (user) => {
  return jwt.sign(
    { id: user.id, type: 'password-reset' },
    config.jwtSecret,
    { expiresIn: '15m' } // Token is valid for 15 minutes
  );
};