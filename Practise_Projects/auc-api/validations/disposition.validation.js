const Joi = require("joi");

const addDispositionSchema = Joi.object({
  name: Joi.string().trim().replace(/\s+/g, ' ').min(3).max(100).required(),
});

module.exports = { addDispositionSchema };
