const http = require('http')
const https = require('https')
const fs = require('fs')
const API_ROUTE = require('./router')
const SERVER_EXTENSION = require('./serverExtension')
const file = require('./assets/file')


//SSL Certificate
// const credentials = {
//    key: (process.env.node_env === "dev" || process.env.NODE_ENV === "dev") ? "" :
//       fs.readFileSync('path-to-your-privkey.pem', 'utf8'),

//    cert: (process.env.node_env === "dev" || process.env.NODE_ENV === "dev") ? "" :
//       fs.readFileSync('path-to-your-cert.pem', 'utf8'),

//    ca: (process.env.node_env === "dev" || process.env.NODE_ENV === "dev") ? "" :
//       fs.readFileSync('path-to-your-chain.pem', 'utf8')
// };


// Server App Function
const app = (req, res) => {
   // Allow CORS 
   res.setHeader('Access-Control-Allow-Origin', '*')
   res.setHeader('Access-Control-Allow-Credentials', true)
   res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

   //if the method is option; change the method and re-route 
   if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
      res.statusCode = 200
      return res.end()
   }

   let body = ''; //for the body of the request if the request has payload
   // get the payload
   req.on('data', (chunk) => {
      body += chunk
   })
   //on getting payload finished, run the script
   req.on('end', () => {
      SERVER_EXTENSION.httpExtension(req, res, body)
      API_ROUTE.use(req, res, req.url_pathname)
   })
}

//start the request listener
const httpServer = http.createServer(app)


// Listening port
const port = file.config.env === "local" ? 9000 : 8080;
httpServer.listen(port, (error) => {
   if (error) {
      console.log(error)
   } else {
      console.log("Server running on port " + port)
   }
})

