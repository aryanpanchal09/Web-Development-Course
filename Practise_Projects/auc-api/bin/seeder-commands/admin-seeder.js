"use strict";
const {
  User,
  Role,
  Organization,
  SequalizeSeederMeta,
} = require("../../models");

const filesArr = [];
const getUserPromises = async () => {
  try {
    const adminRole = await Role.findOne({ where: { role_key: "admin" } });
    if (!adminRole) {
      console.log("Admin role not exists");
      return;
    }

    let orgObj = {
      org_name: "All Utility Collection Limited",
      org_type: "Utilities",
      org_email: "auclimited@mail.com",
      org_phone: "+490000000000",
      org_website: "www.auc.co.uk",
    };

    let [organization, created] = await Organization.findOrCreate({
      where: { org_email: orgObj.org_email },
      defaults: orgObj,
    }).catch((err) => {
      throw err;
    });

    let userObj = {
      first_name: "Admin",
      last_name: "AUC",
      email: "admin@auc.com",
      role_id: adminRole.id,
      phone_no: "+4900000000000",
      password: "admin@123",
      user_type: "admin"
    };

    const isUser = await User.findOne({ where: { email: userObj.email } });
    if (isUser) {
      console.log("AUC Admin already registered");
      return;
    }

    if (organization) {
      let userData = {
          first_name: userObj.first_name,
          last_name: userObj.last_name,
          email: userObj.email,
          role_id: userObj.role_id,
          phone_no: userObj.phone_no,
          password: userObj.password,
          user_type: userObj.user_type,
          organization_id: organization.id,
        },
        [user, created] = await User.findOrCreate({
          where: { email: userObj.email },
          defaults: userData,
        }).catch((err) => {
          throw err;
        });
    }
  } catch (error) {
    throw error;
  }
};

const userSeeder = async () => {
  try {
    await getUserPromises();
    await SequalizeSeederMeta.update(
      { is_modified: false },
      {
        where: {
          file_path: filesArr,
        },
      }
    );
    console.log("AUC Admin User Seeder Completed Successfully");
    return;
  } catch (error) {
    console.error("Error : Error While Creating AUC Admin User", error);
  }
};

module.exports = userSeeder;
