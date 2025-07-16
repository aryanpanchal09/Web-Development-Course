const Joi = require("joi");

const addCommentSchema = Joi.object({
  customer_id: Joi.string().uuid().trim().replace(/\s+/g, ' ').required(),
  user_id: Joi.string().trim().replace(/\s+/g, ' ').uuid().required(),
  customer_debt_id: Joi.string().trim().replace(/\s+/g, ' ').uuid().required(),
  comment: Joi.string().min(1).trim().replace(/\s+/g, ' ').required(),
});

const updateCommentSchema = Joi.object({
  comment: Joi.string().min(1).required(),
});

module.exports = {
  addCommentSchema,
  updateCommentSchema,
};
