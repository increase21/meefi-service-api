const helpers = require('./assets/helpers')
const fs = require('fs')
const noAuthResource = ['users', 'hooks']
const noJSON = ['hooks']
const dbFunctions = require('./model/v1.1/dbFunctions')
const router = {}


router.use = async (req, res, urlPath) => {
   //sanitize the url
   let url = urlPath.replace(/^\/+|\/+$/gi, '');
   //split the url
   let endpointParts = url.split('/');
   //get the request method
   let requestMethod = req.method.toLowerCase();

   //for documentation
   if (endpointParts.length === 1 && requestMethod === "get") {
      res.setHeader('Content-Type', 'text/html')
      return res.end(fs.readFileSync('./doc.html'))

   }
   //if the endpoint is greater than what is accepted
   if (endpointParts.length > 4 || endpointParts.length < 2) {
      return helpers.outputError(res, 404)
   }
   //if there's no method, run the index file
   if (endpointParts.length < 3) {
      endpointParts[2] = 'index'
   }

   let checkUser;

   //run authentication
   //check if required authentication is reuired
   if (noAuthResource.indexOf(endpointParts[1]) === -1) {
      // RUN AUTHENTICATION
      let header = req.headers.authorization
      // if there's no auth
      if (!header) {
         return helpers.outputError(res, 401)
      }
      if (!header.match(/^Bearer /)) {
         return helpers.outputError(res, 401)
      }
      //check the database here
      let APIKey = header.substr(7)
      //verify the APIKey
      //check if the APIKey is not valid
      if (!APIKey || APIKey.length !== 40) {
         return helpers.outputError(res, 401, "Invalid authorization")
      }

      //check the API key
      checkUser = await dbFunctions.getAPIKey(APIKey).catch(e => ({ error: e }))

      //if there's an error
      if (checkUser && checkUser.error) {
         return helpers.outputError(res, 500)
      }
      //if the api does not exist 
      if (!checkUser || checkUser.length === 0) {
         return helpers.outputError(res, null, "Invalid authorization")
      }
      checkUser = checkUser[0]

      //if the account is not approved
      if (checkUser.status_code !== 2) {
         return helpers.outputError(res, null, "Your account is not approved to use any resource")
      }
   }

   // require the file and execute
   var controller = null
   try {
      controller = require('./controllers/' + endpointParts[0] + '/' + endpointParts[1])
   } catch (e) {
      console.log(e)
      return helpers.outputError(res, 404);
   }

   let body = ''
   //parse the payload if it's a post request and
   if (requestMethod !== 'get' && req.body) {
      //if the request if a no JSON request
      if (noJSON.indexOf(endpointParts[1]) > -1) {
         body = req.body
      } else {
         //if the request is JSON
         try {
            body = typeof req.body === 'object' ? req.body : JSON.parse(req.body)
         } catch (e) {
            return helpers.outputError(res, 400);
         }
      }
   }


   //execute the method 
   let classParent = new controller(req, res, body, checkUser)
   //convert the method name to the naming convention of the code
   let cFName = endpointParts[2].replace(/\-{1}\w{1}/g, match => match.replace("-", "").toUpperCase());

   // check if the function name exist
   if (typeof classParent[cFName] === 'function') {
      try {
         return classParent[cFName](endpointParts[3]).catch(e => {
            console.log(e)
            helpers.outputError(res, 503)
         })
      } catch (e) {
         console.log(e)
         return helpers.outputError(res, 503);
      }
   } else {
      //if the function does not exist check if the last path is a parameter not a method
      //if the pathname is not exactly 3
      if (endpointParts.length !== 3) {
         return helpers.outputError(res, 404);
      }
      //set method name to index
      cFName = 'index'
      //if the method does not exist
      if (typeof classParent[cFName] !== 'function') {
         return helpers.outputError(res, 404);
      }
      //if it does not require a parameter
      if (!classParent[cFName].length) {
         return helpers.outputError(res, 404)
      }
      try {
         return classParent[cFName](endpointParts[2]).catch(e => {
            console.log(e)
            helpers.outputError(res, 503)
         })
      } catch (e) {
         console.log(e)
         return helpers.outputError(res, 404);
      }
   }
}
module.exports = router