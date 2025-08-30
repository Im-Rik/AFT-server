import Joi from 'joi';

const commonExpenseFields = {
    description: Joi.string().required(),
    amount: Joi.number().positive().required(),
    category: Joi.string().required(),
    subCategory: Joi.string().allow('').optional(),
    location: Joi.string().allow('').optional(),
    locationFrom: Joi.string().allow('').optional(),
    locationTo: Joi.string().allow('').optional(),
    paidByUserId: Joi.string().uuid().required(),
};

const equalSplitSchema = Joi.object({
    ...commonExpenseFields,
    splitType: Joi.string().valid('equal').required(),
    splits: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

const exactSplitSchema = Joi.object({
    ...commonExpenseFields,
    splitType: Joi.string().valid('exact').required(),
    splits: Joi.array().items(
        Joi.object({
            userId: Joi.string().uuid().required(),
            amount: Joi.number().positive().required()
        })
    ).min(1).required(),
});

export const addExpenseSchema = Joi.alternatives().try(
    equalSplitSchema,
    exactSplitSchema
);