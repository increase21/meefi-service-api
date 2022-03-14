const { conn } = require('./dbConnector');

const dbFunctions = {}

//function to get the user public key
dbFunctions.getAPIKey = (apiKey) => {
   return new Promise(resolve => {
      conn.query(`SELECT * FROM merchants WHERE api_key='${apiKey}' LIMIT 1`,
         (error, res) => resolve(error ? { error: error } : res))
   }).catch(e => ({ error: e }))
      .finally(e => ({ error: e }))
}

//function to get the user public key
dbFunctions.query = (qStatement) => {
   return new Promise(resolve => {
      conn.query(qStatement, (error, res) => resolve(error ? { error: error } : res))
   }).catch(e => ({ error: e }))
      .finally(e => ({ error: e }))
}


//function to get the user public key
dbFunctions.debitAccount = (amount, userID) => {
   return new Promise(resolve => {
      conn.query(`UPDATE merchants SET balance = (balance - ${amount}) WHERE id=${userID}`,
         (error, res) => resolve(error ? { error: error } : res))
   }).catch(e => ({ error: e }))
      .finally(e => ({ error: e }))
}


module.exports = dbFunctions;