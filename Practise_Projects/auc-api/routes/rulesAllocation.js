const express = require("express");
const router = express.Router();
const { DebtAllocationRule, User } = require("../models");
const logger = require("../utils/logger");
const { Op } = require("sequelize");
const validate = require("../middlewares/validate");
const { createRuleSchema, updateRuleSchema } = require("../validations/debtallocation.validation");
const { roleAccess } = require("../middlewares/auth");


router.post("/create-rules", roleAccess(["admin"]), validate(createRuleSchema), async (req, res) => {
    try {
        const { user_id, min_amount, max_amount, aging } = req.body;
        const user = await User.findOne({ where: { uuid: user_id } });
        if (!user) {
            return res.sendInvalidRequest("No user found with this ID");
        }

        const existingRule = await DebtAllocationRule.findOne({
            where: {
                user_id: user.id,
                deleted_at: null
            }
        });

        if (existingRule) {
            return res.sendInvalidRequest("A debt allocation rule already exists for this user");
        }

        const uniqueConditions = [];

        const agingString = aging ? JSON.stringify(aging) : null;

        if (
            min_amount !== undefined && min_amount !== null &&
            max_amount !== undefined && max_amount !== null &&
            agingString
        ) {
            uniqueConditions.push({
                min_amount: min_amount,
                max_amount: max_amount,
                aging: agingString
            });
        } else if (min_amount !== undefined && min_amount !== null && agingString) {
            uniqueConditions.push({
                min_amount: min_amount,
                max_amount: { [Op.is]: null },
                aging: agingString
            });
        } else if (max_amount !== undefined && max_amount !== null && agingString) {
            uniqueConditions.push({
                max_amount: max_amount,
                min_amount: { [Op.is]: null },
                aging: agingString
            });
        }

        if (uniqueConditions.length > 0) {
            const existingSameRule = await DebtAllocationRule.findOne({
                where: {
                    deleted_at: null,
                    [Op.or]: uniqueConditions
                }
            });

            if (existingSameRule) {
                return res.sendInvalidRequest("A debt allocation rule with the same min, max amount and aging already exists");
            }
        }
        const rule = await DebtAllocationRule.create({
            user_id: user.id,
            min_amount,
            max_amount,
            aging: agingString
        });

        return res.sendSuccess(
            rule,
            "Debt allocation rule created successfully"
        );
    } catch (error) {
        logger.error("Error creating debt allocation rule:", error);
        return res.sendError(error, "Error while creating debt allocation rule");
    }
});

router.get("/get-rules", roleAccess(["admin"]), async (req, res) => {
    try {
        const rules = await DebtAllocationRule.findAll({
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "first_name", "last_name", "email"]
                }
            ],
            where: {
                deleted_at: null
            }
        });

        if (!rules || rules.length === 0) {
            return res.sendResourceNotFound("No debt allocation rules found");
        }
  
        rules.forEach(rule => {
            if (rule.aging) {
                rule.aging = JSON.parse(rule.aging);
            }
        });

        return res.sendSuccess(rules, "Debt allocation rules fetched successfully");
    } catch (error) {
        logger.error("Error fetching debt allocation rules:", error);
        return res.sendError(error, "Error while fetching debt allocation rules");
    }
});

router.put("/update-rule/:id", roleAccess(["admin"]), validate(updateRuleSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, min_amount, max_amount, aging } = req.body;

        const rule = await DebtAllocationRule.findOne({ where: { uuid: id } });

        if (!rule) {
            return res.sendInvalidRequest("No debt allocation rule found with this ID");
        }

        const agingString = aging ? JSON.stringify(aging) : null;
        const uniqueConditions = [];

        if (
            min_amount !== undefined && min_amount !== null &&
            max_amount !== undefined && max_amount !== null &&
            agingString
        ) {
            uniqueConditions.push({
                min_amount: min_amount,
                max_amount: max_amount,
                aging: agingString
            });
        } else if (min_amount !== undefined && min_amount !== null && agingString) {
            uniqueConditions.push({
                min_amount: min_amount,
                max_amount: { [Op.is]: null },
                aging: agingString
            });
        } else if (max_amount !== undefined && max_amount !== null && agingString) {
            uniqueConditions.push({
                max_amount: max_amount,
                min_amount: { [Op.is]: null },
                aging: agingString
            });
        }

        if (uniqueConditions.length > 0) {
            const existingSameRule = await DebtAllocationRule.findOne({
                where: {
                    uuid: { [Op.ne]: id }, 
                    deleted_at: null,
                    [Op.or]: uniqueConditions
                }
            });

            if (existingSameRule) {
                return res.sendInvalidRequest("A debt allocation rule with the same min, max amount and aging already exists");
            }
        }

        var updateData = {};
        if (user_id !== undefined && user_id !== null) updateData.user_id = user_id;
        if (min_amount !== undefined && min_amount !== null) updateData.min_amount = min_amount;
        if (max_amount !== undefined && max_amount !== null) updateData.max_amount = max_amount;
        if (aging !== undefined && aging !== null) updateData.aging = agingString; 

        await rule.update(updateData); 


        return res.sendSuccess(rule, "Debt allocation rule updated successfully");
    } catch (error) {
        logger.error("Error updating debt allocation rule:", error);
        return res.sendError(error, "Error while updating debt allocation rule");
    }
});

router.delete("/delete-rule/:id", roleAccess(["admin"]), async (req, res) => {
    try {
        const deleteCount = await DebtAllocationRule.destroy({
            where: { uuid: req.params.id },
        });

        if (deleteCount === 0) {
            return res.sendInvalidRequest("No debt allocation rule found with this ID");
        }

        await rule.destroy();
        return res.sendSuccess(null, "Debt allocation rule deleted successfully");
    } catch (error) {
        logger.error("Error deleting debt allocation rule:", error);
        return res.sendError(error, "Error while deleting debt allocation rule");
    }
});

module.exports = router;


