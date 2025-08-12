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
    expiresIn: '1d',
  });
};