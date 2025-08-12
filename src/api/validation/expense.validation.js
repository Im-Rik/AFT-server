import Joi from 'joi';

export const addExpenseSchema = Joi.object({
    description: Joi.string().required(),
    amount: Joi.number().positive().required(),
    category: Joi.string().required(),
    subCategory: Joi.string().allow('').optional(),
    location: Joi.string().allow('').optional(),
    locationFrom: Joi.string().allow('').optional(),
    locationTo: Joi.string().allow('').optional(),
    paidByUserId: Joi.string().uuid().required(),
    splitType: Joi.string().valid('equal', 'exact').required(),
    splits: Joi.array().min(1).required().items(
        Joi.when('splitType', {
            is: 'equal',
            then: Joi.string().uuid().required(),
            otherwise: Joi.object({
                userId: Joi.string().uuid().required(),
                amount: Joi.number().positive().required()
            })
        })
    )
});