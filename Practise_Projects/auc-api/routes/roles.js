const express = require("express");
const router = express.Router();
const { Role } = require("../models");
const logger = require("../utils/logger");

router.get("/list", async (req, res) => {
  try {
    const roles = await Role.findAll( {attributes: { exclude: ['id'] }});

    return res.sendSuccess(roles, "Roles list successfully");
  } catch (error) {
    logger.error('Error while fetching roles:', error);
    return res.sendError(error);
  }
});

module.exports = router;
