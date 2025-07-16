'use strict';
module.exports = (sequelize, DataTypes) => {
  const blacklisttoken = sequelize.define('blacklisttoken', {
    token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    tableName: 'blacklisttokens',
    underscored: true,
    paranoid: true,           
    deletedAt: 'deleted_at',  
    createdAt: 'created_at', 
    updatedAt: 'updated_at'   
  });

   blacklisttoken.associate = function(models) {
    blacklisttoken.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };


  return blacklisttoken;
};
