
"use strict";

const { Disposition } = require("../../models");

const dispositionSeeder = async () => {
  const names = [
    "Business closed down",
    "Account needs reconciliation",
    "Agree to set up payment plan",
    "Agreed to pay the outstanding in full",
    "Billing issue",
    "Bills not Received",
    "Building demolished/ renovation",
    "Change Business",
    "Closed site",
    "Could Not Locate the Site",
    "Decision Maker not Available",
    "Domestic site",
    "Empty site",
    "Loss account",
    "Meter Issue",
    "No access to the site",
    "No one answered the call",
    "No Sign of Business",
    "Nobody on the site",
    "Ongoing complaint",
    "Payment plan set",
    "Potential COT",
    "Requested to email",
    "Site Not Located",
    "Unable to Locate Meter",
    "Upfornt payment made",
    "Will Full Defaulter",
    "In discussion",
    "Re-visit",
    "Paid all-clear"
  ];

  const now = new Date();

  const data = names.map(name => ({
    name,
    created_at: now,
    updated_at: now
  }));

  try {
    await Disposition.bulkCreate(data, {
      ignoreDuplicates: true,
    });
    console.log("Dispositions seeded successfully");
  } catch (error) {
    console.error("Error seeding dispositions:", error);
  }
};

module.exports = dispositionSeeder;
