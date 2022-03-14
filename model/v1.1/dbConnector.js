const mysql = require('mysql');
const file = require('../../assets/file');

// Authorization Module
const dbConnector = {};

dbConnector.keepConnectionOpen = () => {
   // Create the database connection
   dbConnector.conn = mysql.createConnection(file.config.db);

   //add connection listener
   dbConnector.conn.connect((err) => {
      if (err) {
         console.log(err)
      } else {
         console.log('Database Connected At ' + new Date())
      }
   })

   // Handle error event that causes disconnection
   dbConnector.conn.on('error', em => {
      //set a wait time and reconnect
      setTimeout(() => {
         dbConnector.keepConnectionOpen();
      }, 1500);
   });

   // add the connection listener for error
   if (['disconnected', 'protocol_error'].indexOf(dbConnector.conn.state)) {
      //send a mail that database is not connection
   }
};

// create connection and keep it open
dbConnector.keepConnectionOpen();

module.exports = {
   conn: dbConnector.conn
};