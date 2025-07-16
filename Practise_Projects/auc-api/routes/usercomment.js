const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");
const validate = require("../middlewares/validate");
const { addCommentSchema, updateCommentSchema } = require("../validations/usercomment.validation");
const { UserComment, User, Customer, CustomerDebt } = require("../models");
const { roleAccess,checkIfUserActive, } = require("../middlewares/auth");


router.get("/list/:customer_id/:customer_debt_id",checkIfUserActive,roleAccess(["admin","client", "debt_collector", "debt_head"]), async (req, res) => {
    try {
        const { customer_id, customer_debt_id } = req.params;

        const customerDebt = await CustomerDebt.findOne({
            where: { uuid: customer_debt_id },
            include: [
                { model: Customer, as: "customer", where: { uuid: customer_id }, attributes: [] },
                {  model: UserComment, as: "usercomment",
                    include: [
                        { model: User, as: "user", attributes: ["uuid", "first_name", "last_name", "email", "user_type"] }
                    ],
                    attributes: {
                        exclude: ["customer_id", "customer_debt_id", "user_id", "deleted_at", "updated_at", "id"]
                    }
                }
            ],
            order: [[{ model: UserComment, as: "usercomment" }, "created_at", "DESC"]]
        });

        if (!customerDebt) {
            return res.sendInvalidRequest("Customer debt does not belong to this customer or doesn't exist");
        }

        if (!customerDebt.usercomment.length) {
            return res.sendSuccess([], "No comments found for this customer debt");
        }

        return res.sendSuccess(customerDebt.usercomment, "Comments fetched successfully");
    } catch (error) {
        logger.error("Error fetching customer comments:", error);
        return res.sendError(error);
    }
});

router.post("/add",checkIfUserActive,roleAccess(["admin","client", "debt_collector", "debt_head"]), validate(addCommentSchema), async (req, res) => {
    try {
        const { customer_id, user_id, customer_debt_id, comment } = req.body;
        const loggedInUser = req.user;
        const [customer, user, customerDebt] = await Promise.all([
            Customer.findOne({ where: { uuid: customer_id }, attributes: ["id"] }),
            User.findOne({ where: { uuid: user_id }, attributes: ["id", "uuid", "first_name", "last_name", "email"] }),
            CustomerDebt.findOne({ where: { uuid: customer_debt_id }, attributes: ["id", "user_id"] })
        ]);

        if (!customer || !user || !customerDebt) {
            return res.sendInvalidRequest("Invalid customer, user, or customer debt provided");
        }

        const newComment = await UserComment.create({
            customer_id: customer.id,
            user_id: user.id,
            customer_debt_id: customerDebt.id,
            comment,
        });
        const result = {
            uuid: newComment.uuid,
            comment: newComment.comment,
            created_at: newComment.created_at,
            user: {
                uuid: user.uuid,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
            },
        };

        return res.sendCreated(result, "Comment added successfully");

    } catch (error) {
        logger.error("Error adding comment:", error);
        return res.sendError(error);
    }
});

router.put("/update/:comment_id",checkIfUserActive, roleAccess(["admin", "client","debt_collector", "debt_head"]),validate(updateCommentSchema), async (req, res) => {
    try {
        const { comment_id } = req.params;
        const { comment } = req.body;
        const userRole = req.user.role;
        const loggedInUserId = req.user.id
        const existingComment = await UserComment.findOne({
            where: { uuid: comment_id },
            include: [
                { model: Customer, as: "customer", attributes: ["id", "uuid"] },
                { model: User, as: "user", attributes: ["id", "uuid", "first_name", "last_name", "email"] },
            ]
        });

        if (!existingComment) {
            return res.sendResourceNotFound("comment not found");
        }
        if (userRole !== "admin" && loggedInUserId !== existingComment.user.id) {
            return res.sendInvalidRequest("You are not authorized to update this comment");
        }
        await existingComment.update({ comment });
        const result = {
            uuid: existingComment.uuid,
            comment: existingComment.comment,
            updated_at: existingComment.updated_at,
            user: {
                uuid: existingComment.user.uuid,
                first_name: existingComment.user.first_name,
                last_name: existingComment.user.last_name,
                email: existingComment.user.email
            }
        };

        return res.sendSuccess(result, "Comment updated successfully");
    } catch (error) {
        logger.error("Error updating comment:", error);
        return res.sendError(error);
    }
});

router.delete("/delete/:comment_id",checkIfUserActive,roleAccess(["admin","client", "debt_collector", "debt_head"]), async (req, res) => {
    try {
        const userRole = req.user.role;
        const loggedInUserId = req.user.id;

        const whereClause = { uuid: req.params.comment_id };

        if (userRole !== "admin") {
            whereClause.user_id = loggedInUserId;
        }
        const deleteCount = await UserComment.destroy({ where: whereClause });
        if (deleteCount === 0) {
            return res.sendResourceNotFound("Comment not found or you are not authorized to update this comment");
        }
        
        return res.sendDeleted("Comment deleted successfully");
    } catch (error) {
        logger.error("Error deleting Comment:",error);
        return res.sendError(error);
    }
});


module.exports = router;