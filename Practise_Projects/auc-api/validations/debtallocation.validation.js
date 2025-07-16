const joi = require("joi");

const minAmountCustom = (value, helpers) => {
    if (value === null || value === undefined) return value;
    if (value === 0) return helpers.error("any.invalid");
    return value;
};

const maxAmountCustom = (value, helpers) => {
    if (value === null || value === undefined) return value;
    if (value === 0) return helpers.error("any.invalid");
    return value;
};

const createRuleSchema = joi.object({
    user_id: joi.string().required(),
    min_amount: joi.number()
        .custom(minAmountCustom, "min_amount cannot be 0")
        .allow(null),
    max_amount: joi.number()
        .custom(maxAmountCustom, "max_amount cannot be 0")
        .allow(null)
        .when('min_amount', {
            is: joi.number().required(),
            then: joi.number().greater(joi.ref('min_amount')).allow(null),
            otherwise: joi.optional()
        }),
    aging: joi.object().optional()
}).with('max_amount', 'min_amount');

const updateRuleSchema = joi.object({
    user_id: joi.string().optional(),
    min_amount: joi.number()
        .custom(minAmountCustom, "min_amount cannot be 0")
        .allow(null),
    max_amount: joi.number()
        .custom(maxAmountCustom, "max_amount cannot be 0")
        .allow(null)
        .when('min_amount', {
            is: joi.number().required(),
            then: joi.number().greater(joi.ref('min_amount')).allow(null),
            otherwise: joi.optional()
        }),
    aging: joi.object().optional()
}).with('max_amount', 'min_amount');

module.exports = {
    createRuleSchema,
    updateRuleSchema
};