"use strict";
const { User, Role, SequalizeSeederMeta, sequelize } = require("../../models");

const filesArr = [];
const getUserPromises = async () => {
  const t = await sequelize.transaction();
  try {
    const superAdminRole = await Role.findOne({
      where: { role_key: "super_admin" },
    });
    if (!superAdminRole) {
      console.error("Superadmin role not exists");
      throw new Error("Superadmin role not exists");
    }
    let userArray = [
      {
        first_name: "Admin",
        last_name: "AzentraTech",
        email: "info@azentratech.com",
        role_id: superAdminRole.id,
        phone_no: "+4900000000000",
        password: "admin@123",
      },
    ];

    const promises = userArray.map(async (userElm) => {
      const isUser = await User.findOne({ where: { email: userElm.email } });
      if (isUser) {
        console.log("Superadmin already registered");
        return;
      }

      let userData = {
          first_name: userElm.first_name,
          last_name: userElm.last_name,
          email: userElm.email,
          role_id: userElm.role_id,
          phone_no: userElm.phone_no,
          password: userElm.password,
          user_type: "super_admin"
        },
        [user, created] = await User.findOrCreate({
          where: { email: userElm.email },
          defaults: userData,
          transaction: t,
        }).catch((err) => {
          throw err;
        });
      await t.commit();
    });
    return promises;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const userSeeder = async () => {
  try {
    const promises = await getUserPromises();
    const result = await Promise.all(promises);
    await SequalizeSeederMeta.update(
      { is_modified: false },
      {
        where: {
          file_path: filesArr,
        },
      }
    );
    console.log("Super Admin  User Seeder Completed Successfully");
    return result;
  } catch (error) {
    console.error("Error : Error While Creating Super Admin User Admin", error);
  }
};

module.exports = userSeeder;
