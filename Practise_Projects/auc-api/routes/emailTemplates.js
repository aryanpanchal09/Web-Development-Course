const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");
const { Op } = require("sequelize");
const { EmailTemplate } = require("../models");
const validate = require("../middlewares/validate");
const { addTemplateSchema, updateTemplateSchema } = require("../validations/emailtemplate.validation");

router.get("/list", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();

    const templates = await EmailTemplate.findAll({
      where: {
        name: {
          [Op.iLike]: `%${search}%`,
        },
      },
      attributes: {exclude:["html", "text", "type", "createdAt","updatedAt","deletedAt","variables","id"]},
      order: [["created_at", "DESC"]],
    });

    return res.sendSuccess(templates, "Email templates fetched successfully");
  } catch (error) {
    logger.error("Error fetching email templates:", error);
    return res.sendError(error);
  }
});

router.post("/add",validate(addTemplateSchema), async (req, res) => {
  try {
    const { name, subject, html, text, variables, type, status } = req.body;

    const existingTemplate = await EmailTemplate.findOne({ where: { name } });
    if (existingTemplate) {
      return res.sendSuccess(
        {},
        "Email template with this name already exists"
      );
    }

    const newTemplate = await EmailTemplate.create({
      name,
      subject,
      html,
      text,
      variables,
      type,
      status,
    });

    const result = {
      uuid: newTemplate.uuid,
      name: newTemplate.name,
      subject: newTemplate.subject,
    };

    return res.sendCreated(result, "Email template added successfully");
  } catch (error) {
    logger.error("Error adding email template");
    return res.sendError(error);
  }
});

router.get("/:templateId",async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await EmailTemplate.findOne({
      where: { uuid: templateId },
      attributes: { exclude: ["id","variable","createdAt","updatedAt","deletedAt"] }, 
    });

    if (!template) {
      return res.sendResourceNotFound("Email template not found");
    }

    return res.sendSuccess(template, "Email template fetched successfully");
  } catch (error) {
    console.error("Error fetching email template:",error);
    return res.sendError(error);
  }
});
router.put("/update/:templateId",validate(updateTemplateSchema) , async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await EmailTemplate.findOne({
      where: { uuid: templateId },
    });

    if (!template) {
      return res.sendResourceNotFound("Email template not found");
    }

    await template.update(req.body);

    const result = {
      uuid: template.uuid,
      name: template.name,
      subject: template.subject,
    };

    return res.sendSuccess(result, "Email template updated successfully");
  } catch (error) {
    logger.error("Error updating email template:",error);
    return res.sendError(error);
  }
});

router.delete("/delete/:templateId", async (req, res) => {
  try {
    const deleteCount = await EmailTemplate.destroy({
    where: { uuid: req.params.templateId },
    });

    if (deleteCount === 0) {
      return res.sendResourceNotFound("Email template not found");
    }
    
    return res.sendDeleted("Email template deleted successfully");
  } catch (error) {
    logger.error("Error deleting email template:",error);
    return res.sendError(error);
  }
});

module.exports = router;


