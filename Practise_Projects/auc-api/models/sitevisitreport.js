module.exports = (sequelize, DataTypes) => {
  const SiteVisitReport = sequelize.define(
    "SiteVisitReport",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false,
      },
      customer_id: DataTypes.BIGINT,
      client_id: DataTypes.BIGINT,
      customer_debt_id: DataTypes.BIGINT,
      user_id: DataTypes.BIGINT,
      site_visit_date: DataTypes.DATEONLY,
      site_visit_time_in: DataTypes.TIME,
      site_visit_time_out: DataTypes.TIME,
      site_picture: DataTypes.ARRAY(DataTypes.STRING),
      site_visit_notes: DataTypes.STRING,
      other_notes: DataTypes.STRING,
      service_address: DataTypes.STRING,
      date_of_visit: DataTypes.DATEONLY,
      utility_visited: DataTypes.STRING,
      balance_to_be_resolved: DataTypes.STRING,
      direct_debit_status: DataTypes.STRING,
      letter_of_intent_left: DataTypes.STRING,
      letter_before_action_left: DataTypes.STRING,
      shutter_type: DataTypes.STRING,
      person_spoken_to: DataTypes.STRING,
      vulnerable_customer: DataTypes.STRING,
      is_the_business_trading: DataTypes.STRING,
      meter_reading_obtained: DataTypes.STRING,
      location: DataTypes.STRING,
      signs_of_meter_tampering: DataTypes.STRING,
      refused_acess: DataTypes.STRING,
      unable_to_locate_meter: DataTypes.STRING,
      acess_blocked: DataTypes.STRING,
      steps_taken_to_locate_meter: DataTypes.STRING,
      shared_supply: DataTypes.STRING,
      smart_meter_required: DataTypes.STRING,
      "3rd_party_warrant_required": DataTypes.STRING,
      meter_read_1: DataTypes.STRING,
      meter_read_2: DataTypes.STRING,
      meter_read_3: DataTypes.STRING,
      meter_read_4: DataTypes.STRING,
      meter_read_5: DataTypes.STRING,
      new_business_name: DataTypes.STRING,
      new_tenant_name: DataTypes.STRING,
      landline: DataTypes.STRING,
      mobile: DataTypes.STRING,
      COT_meter_readings: {
        type: DataTypes.STRING,
        field: 'COT_meter_readings',
      },
      lease_agreement: DataTypes.STRING,
      identification: DataTypes.STRING,
      new_signage: DataTypes.STRING,

      COT_letter_left: {
        type: DataTypes.STRING,
        field: 'COT_letter_left',
      },
      BMO_form: {
        type: DataTypes.STRING,
        field: 'BMO_form',
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        allowNull: true,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "SiteVisitReport",
      tableName: "site_visit_reports",
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",

    }
  );

  SiteVisitReport.associate = (models) => {
    SiteVisitReport.belongsTo(models.Customer, { foreignKey: "customer_id" });
    SiteVisitReport.belongsTo(models.Client, { foreignKey: "client_id" });
    SiteVisitReport.belongsTo(models.CustomerDebt, { foreignKey: "customer_debt_id", as:"debt"});
    SiteVisitReport.belongsTo(models.User, { foreignKey: "user_id" , as:"user"});
  };

  return SiteVisitReport;
};
