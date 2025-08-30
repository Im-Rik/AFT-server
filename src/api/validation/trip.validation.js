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

const locationSchema = Joi.object({
    name: Joi.string().required(),
    location_date: Joi.date().iso().optional().allow(null), 
    order_index: Joi.number().integer().min(0).optional(),
    location_time: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().allow(null)
});

export const addLocationsSchema = Joi.object({
    locations: Joi.array().items(locationSchema).min(1).required()
});

export const updateLocationSchema = Joi.object({
    name: Joi.string().optional(),
    location_date: Joi.date().iso().optional().allow(null),
    order_index: Joi.number().integer().min(0).optional(),
    location_time: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().allow(null)
}).min(1);