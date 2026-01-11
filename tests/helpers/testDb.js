const { sequelize } = require('../../src/models');

async function resetDb() {
  await sequelize.sync({ force: true });
}

async function closeDb() {
  await sequelize.close();
}

module.exports = {
  resetDb,
  closeDb
};

