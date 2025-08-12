import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabaseClient.js';
import { ApiError } from '../utils/ApiError.js';

const signupUser = async (name, email, username, password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, username, hashed_password: hashedPassword }])
    .select('id, name, email, username, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'Email or username already exists.');
    }
    throw new ApiError(500, 'Could not create user.', [error.message]);
  }

  return data;
};

const loginUserByCredentials = async (identifier, password) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, username, hashed_password')
    .or(`email.eq.${identifier},username.eq.${identifier}`)
    .single();

  if (error || !user) {
    throw new ApiError(401, 'Invalid credentials.');
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.hashed_password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Invalid credentials.');
  }

  const { hashed_password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const authService = {
  signupUser,
  loginUserByCredentials,
};