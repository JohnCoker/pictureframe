const path = require('path');

module.exports = {
  /**
   * Directory in which picture files are located.
   */
  pictures: path.join(__dirname, '../pictures'),

  /**
   * If true, POST, PUT and DELETE are supported to upload and remove images.
   */
  uploads: true,

  /**
   * Allowed picture image file extensions.
   */
  extensions: ['jpg', 'jpeg', 'png'],
};
