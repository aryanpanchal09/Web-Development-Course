"use strict";
const SequalizeSeeder = require("./../bin/seeder-commands/sequelize-seeder-meta.js");
const countrySeeder = require("./../bin/seeder-commands/countries-seeder.js");
const modulesSeeder = require("./../bin/seeder-commands/role-permissions/module-seeder.js");
const rolesSeeder = require("./../bin/seeder-commands/role-permissions/role-seeder.js");
const permissionsSeeder = require("./../bin/seeder-commands/role-permissions/permission-seeder.js");
const superAdminSeeder = require("./../bin/seeder-commands/super-admin-seeder");
const adminSeeder = require("./../bin/seeder-commands/admin-seeder");
const dispositionSeeder = require("../bin/seeder-commands/disposition-seeder.js");
const emailSeeder = require("../bin/seeder-commands/email-template-seeder.js");

module.exports = {
  async up() {
    console.log('Sequalize Meta Seeder Started:');
    await SequalizeSeeder();
    console.log('Modules Seeder Started:');
    await modulesSeeder();
    console.log('Roles Seeder Started:');
    await rolesSeeder();
    console.log('Permissions Seeder Started:');
    await permissionsSeeder();
    console.log('countrySeeder Started:');
    await countrySeeder();
    console.log('superAdminSeeder Started:');
    await superAdminSeeder();    
    console.log('AdminSeeder Started:');
    await adminSeeder();
    console.log('dispositionSeeder Started:');
    await dispositionSeeder();
    console.log("email seeder started");
    await emailSeeder();
  },

  async down() {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     *
     * THERE WILL BE NO CODE IN DOWN METHOD FOR SEEDERS
     * AS WE'LL ALWAYS CHECK FOR DUPLICATION BEFORE INSERTING ANY RECORD
     */
  },
};
