import Joi from 'joi';

// Define the common fields that are always required.
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

// Define the schema for an "equal" split.
const equalSplitSchema = Joi.object({
    ...commonExpenseFields,
    splitType: Joi.string().valid('equal').required(),
    splits: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

// Define the schema for an "exact" split.
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

// The final schema accepts EITHER the equal or the exact structure.
export const addExpenseSchema = Joi.alternatives().try(
    equalSplitSchema,
    exactSplitSchema
);