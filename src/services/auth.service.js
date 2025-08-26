import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabaseClient.js';
import { ApiError } from '../utils/ApiError.js';
import { generateOtp, hashOtp, compareOtp } from '../utils/otp.js';
import { sendOtpEmail } from './email.service.js';
import { generateSignupToken } from './token.service.js';
import { config } from '../config/config.js';

const initiateSignup = async (name, email, password) => {
  const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists.');
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await sendOtpEmail(email, otp);

  const tokenPayload = { name, email, hashedPassword, otpHash };
  return generateSignupToken(tokenPayload);
};

const verifySignupOtp = async (signupToken, otp) => {
  try {
    const decoded = jwt.verify(signupToken, config.jwtSecret, { clockTolerance: 10 }); // Add 10 seconds of tolerance
    const isOtpValid = await compareOtp(otp, decoded.otpHash);
    if (!isOtpValid) throw new ApiError(400, 'Invalid OTP.');
    return { name: decoded.name, email: decoded.email, hashedPassword: decoded.hashedPassword };
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token. Please try again.');
  }
};

const isUsernameAvailable = async (username) => {
  const { data } = await supabase.from('users').select('id').eq('username', username).single();
  return !data;
};

const completeSignup = async (signupDetails, username) => {
  const usernameIsAvailable = await isUsernameAvailable(username);
  if (!usernameIsAvailable) throw new ApiError(409, 'This username is no longer available.');

  const { data: newUser, error } = await supabase
    .from('users')
    .insert([{
      name: signupDetails.name,
      email: signupDetails.email,
      username: username,
      hashed_password: signupDetails.hashedPassword,
    }])
    .select('id, name, email, username, created_at')
    .single();

  if (error) throw new ApiError(500, 'Could not create user.', [error.message]);
  return newUser;
};

const loginUserByCredentials = async (identifier, password) => {
  const { data: user } = await supabase.from('users').select('id, email, username, hashed_password').or(`email.eq.${identifier},username.eq.${identifier}`).single();
  if (!user) throw new ApiError(401, 'Invalid credentials.');
  const isPasswordCorrect = await bcrypt.compare(password, user.hashed_password);
  if (!isPasswordCorrect) throw new ApiError(401, 'Invalid credentials.');
  const { hashed_password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const authService = {
  initiateSignup, verifySignupOtp, isUsernameAvailable, completeSignup, loginUserByCredentials
};