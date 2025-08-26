import Joi from 'joi';

// Schema for the first step of registration (name, email, password)
export const registerStepOneSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

// Schema for verifying the OTP, requires the token from step 1
export const verifyOtpSchema = Joi.object({
  otp: Joi.string().length(4).required(),
  signupToken: Joi.string().required()
});

// Schema for checking username availability
export const checkUsernameSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required()
});

// Schema for the final step of registration (username)
export const registerStepTwoSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required()
});

// Unchanged schema for user login
export const loginSchema = Joi.object({
  identifier: Joi.string().required(),
  password: Joi.string().required()
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required(),
});