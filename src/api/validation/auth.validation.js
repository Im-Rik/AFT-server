import Joi from 'joi';

export const registerStepOneSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

export const verifyOtpSchema = Joi.object({
  otp: Joi.string().length(4).required(),
  signupToken: Joi.string().required()
});

export const checkUsernameSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required()
});

export const registerStepTwoSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required()
});

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