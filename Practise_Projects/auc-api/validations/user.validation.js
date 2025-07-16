const Joi = require("joi");

const signupSchema = Joi.object({
  first_name: Joi.string().trim().replace(/\s+/g, ' ').min(3).max(100).required(),
  
  last_name: Joi.string().trim().replace(/\s+/g, ' ').min(3).max(100).required(),
  unique_id: Joi.string().min(3).max(50).optional(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone_no: Joi.string().required(),
  // owner_id: Joi.string().optional(),
  org_name: Joi.string().allow("", null).optional(),
  org_type: Joi.string().allow("", null).optional(),
  org_email: Joi.string().allow("", null).optional(),
  org_phone: Joi.string().allow("", null).optional(),
  org_website: Joi.string().allow("", null).optional(),
  address1: Joi.string().allow("", null).optional(),
  address2: Joi.string().allow("", null).optional(),
  address3: Joi.string().allow("", null).optional(),
  town: Joi.string().allow("", null).optional(),
  country: Joi.string().allow("", null).optional(),
  postal_code: Joi.array().items(Joi.string()).allow("", null).optional().default([]),
});

const addDebCollectorSchema = Joi.object({
  first_name: Joi.string().trim().replace(/\s+/g, ' ').min(3).max(100).required(),
  last_name: Joi.string().trim().replace(/\s+/g, ' ').min(3).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone_no: Joi.string().required(),
  address1: Joi.string().required(),
  address2: Joi.string().allow("", null).optional(),
  address3: Joi.string().allow("", null).optional(),
  town: Joi.string().required(),
  country: Joi.string().required(),
  postal_code: Joi.array().items(Joi.string()).allow("", null).optional().default([]),
  user_type: Joi.string().valid('debt_head', 'debt_collector', 'admin').required(),
  debt_head_id: Joi.string().allow("", null).optional(),
});

const updateDebCollectorSchema = Joi.object({
  first_name: Joi.string().trim().replace(/\s+/g, ' ').min(3).max(100).optional(),
  last_name: Joi.string().trim().replace(/\s+/g, ' ').min(3).max(100).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  phone_no: Joi.string().optional(),
  address1: Joi.string().optional(),
  address2: Joi.string().allow("", null).optional(),
  address3: Joi.string().allow("", null).optional(),
  town: Joi.string().optional(),
  country: Joi.string().optional(),
  postal_code: Joi.array().items(Joi.string()).allow("", null).optional().default([]),
  user_type: Joi.string().valid('debt_head', 'debt_collector').optional(),
  debt_head_id: Joi.string().allow("", null).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().replace(/\s+/g, ' ').email().required(),
  password: Joi.string().min(6).required(),
});

module.exports = { signupSchema, loginSchema, addDebCollectorSchema, updateDebCollectorSchema };
