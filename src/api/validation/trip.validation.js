import Joi from 'joi';

export const createTripSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  currency: Joi.string().length(3).uppercase().required()
});

export const addParticipantsSchema = Joi.object({
  identifiers: Joi.array().items(Joi.string()).min(1).required()
});

export const updateRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'member').required()
});