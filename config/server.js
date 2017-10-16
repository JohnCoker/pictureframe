const path = require('path');

module.exports = {
  /**
   * Directory in which picture files are located.
   */
  pictures: path.join(__dirname, '../pictures'),

  /**
   * If true, PUT and DELETE is supported to upload and remove images.
   */
  uploads: true,

  /**
   * Allowed picture image extensions.
   */
  extensions: ['jpg', 'jpeg', 'png'],
};
