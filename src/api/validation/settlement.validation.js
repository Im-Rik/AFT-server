import Joi from 'joi';

export const addSettlementSchema = Joi.object({
    fromUserId: Joi.string().uuid().required(),
    toUserId: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
    method: Joi.string().optional(),
    note: Joi.string().allow('').optional()
});