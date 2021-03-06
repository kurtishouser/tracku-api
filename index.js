const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const { port, rootRoute, dbUser, dbPassword, dbHost, dbPort, dbName, ioPath } = require ('./server/config/env.js');
const routes = require('./server/routes');

// use this instead if MongoDB access control is not enabled
// mongoose.connect(`mongodb://${dbHost}:${dbPort}/${dbName}`)
mongoose.connect(`mongodb://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`,
  {useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => {
    console.log('Connected to MongoDB');

    const app = express();
    app.disable('x-powered-by');

    app.use(bodyParser.json({limit: '16mb'})); // increased to accommodate 1000 points/batch
    app.use(cors());

    app.use(rootRoute || '/', routes);

    app.use((req, res) => {
      res.sendStatus(404);
    });

    const serverPort = port || 5000;
    const server = app.listen(serverPort, () => {
      /* eslint-disable no-console */
      console.log(`Express server listening on port ${serverPort}`);
    });

    const io = require('./server/config/socket').init(server, {path: ioPath || '/socket.io'});
    io.of('/tracker').on('connection', socket => {
      console.log('Tracker client connected', socket.id);

      socket.on('disconnect', () => console.log('Tracker client disconnected', socket.id));
    });

    process.on('SIGINT', () => {
      console.log('Shutting down...');
      io.close();
      server.close(() => {
        mongoose.connection.close()
          .then(() => {
            console.log('Shutdown complete. Goodbye.');
            process.exit();
        });
      });
    });
  })
  .catch((error) => {
    console.log('Error connecting to MongoDB');
    console.log(error.message);
    console.log('Exiting...');
    process.exit();
  });
