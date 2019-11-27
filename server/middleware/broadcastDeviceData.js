const { socketIO } = require('../config/socket');

module.exports = (req, res, next) => {
  if (req.body.locations) {
    socketIO('/tracker').emit('location-updated', req.body.locations[req.body.locations.length - 1]);
  }

  return next();
};