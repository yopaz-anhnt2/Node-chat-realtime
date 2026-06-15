"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("direct_messages", "deliveredAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("direct_messages", "seenAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("direct_messages", "deliveredAt");
    await queryInterface.removeColumn("direct_messages", "seenAt");
  },
};
