const Joi = require('joi');

const addTemplateSchema = Joi.object({
  name: Joi.string().trim().replace(/\s+/g, ' ').min(3).max(100).required(),
  subject: Joi.string().max(255).required(),
  html: Joi.string().required(),
  text: Joi.string().allow('', null),
  type: Joi.string().optional(),
  variables: Joi.array().items(Joi.string()).optional(),
  // status: Joi.string().valid("active", "inactive", "archived").default("active"),
});

const updateTemplateSchema = Joi.object({
  name: Joi.string().trim().replace(/\s+/g, ' ').min(3).max(100).required(),
  subject: Joi.string().max(255).optional(),
  html: Joi.string().optional(),
  text: Joi.string().allow('', null),
  type: Joi.string().optional(),
  variables: Joi.array().items(Joi.string()).optional(),
  // status: Joi.string().valid("active", "inactive", "archived").optional(),
});

const sendEmailSchema = Joi.object({
  to: Joi.string().email().required(),
  data: Joi.object().required(),
});

module.exports = {
  addTemplateSchema,
  updateTemplateSchema,
  sendEmailSchema,
};
