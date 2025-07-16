const express = require("express");
const router = express.Router();
const { Disposition } = require("../models");
const logger = require("../utils/logger");
const { Op } = require("sequelize");
const validate = require("../middlewares/validate");
const {
  addDispositionSchema,
} = require("../validations/disposition.validation");
 
 
router.get("/list", async (req, res) => {
  try {
    const search = req.query.search || " ";
 
    const dispositions = await Disposition.findAll({
      where: {
        name: { [Op.iLike]: `%${search}%` },
      },
      attributes: ["uuid", "name"],
      order: [["name", "ASC"]],
    });
 
    return res.sendSuccess(dispositions, "Dispositions list successfully");
  } catch (error) {
    logger.error("Error while fetching dispositions:",error);
    return res.sendError(error);
  }
});
 
 
router.post("/add", validate(addDispositionSchema), async (req, res) => {
  try {
    const { name } = req.body;
 
    const existingDisposition = await Disposition.findOne({ where: { name } });
    if (existingDisposition) {
      return res.sendDuplicate("Disposition already exists");
    }
 
    const newDisposition = await Disposition.create({ name });
    const result = {
      uuid: newDisposition.uuid,
      name: newDisposition.name,
    };
 
    return res.sendCreated(result, "Disposition added successfully");
  } catch (error) {
    logger.error("Error adding disposition:",error);
    return res.sendError(error);
  }
});
 
router.put("/update/:dispositionId",validate(addDispositionSchema), async (req, res) => {
  try {
    const { dispositionId } = req.params;
 
    const disposition = await Disposition.findOne({
      where: { uuid: dispositionId },
    });
 
    if (!disposition) {
      return res.sendResourceNotFound("Disposition not found");
    }
 
    await disposition.update(req.body);
    const result = {
      uuid: disposition.uuid,
      name: disposition.name,
    };
 
    return res.sendSuccess(result, "Disposition updated successfully");
  } catch (error) {
    logger.error("Error updating disposition:",error);
    return res.sendError(error);
  }
});
 
 
router.delete("/delete/:dispositionId", async (req, res) => {
  try {
    const deletedCount = await Disposition.destroy({
      where: { uuid: req.params.dispositionId }
    });

    if (deletedCount === 0) {
      return res.sendResourceNotFound("Disposition not found");
    }
    
    return res.sendDeleted("Disposition deleted successfully");
  } catch (error) {
    logger.error("Error deleting disposition",error);
    return res.sendError(error);
  }
});
 
module.exports = router;