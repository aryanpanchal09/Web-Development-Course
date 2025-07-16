const express = require("express");
const router = express.Router();
const { Country } = require("../models");
const logger = require("../utils/logger");
const { Op } = require("sequelize");

router.get("/list", async (req, res) => {
  try {
    const search = req.query.search || "";

    const countries = await Country.findAll({
      attributes: ["uuid", "name", "country_code", "phone_code"], 
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } }
        ],
      },
      attributes: { exclude: ['id'] },
      order: [["name", "ASC"]],
    });

    return res.sendSuccess(countries, "Countries fetched successfully");
  } catch (error) {
    logger.error('Error while list countries:',error);
    return res.sendError(error);
  }
});

module.exports = router;
