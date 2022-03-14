const qs = require('qs')
const { URL } = require('url')
const ServerExtension = {}

//for custom request handler
ServerExtension.httpExtension = (req, res, body) => {
   req.body = body; //add the body as JSON BODY
   //for response status
   res.status = (code) => {
      if (!/^\d+/.test(code) || typeof code !== "number") throw new Error("Status code expected to be number but got " + typeof code)
      res.statusCode = code ? code : 200;
      return res;
   }
   //convert the response to JSON
   res.json = (param = {}) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(param))
   }
   //convert the response to xml
   res.xml = (param = '') => {
      res.setHeader('Content-Type', 'application/xml')
      res.end(param)
   }
   //convert the response to text/plain
   res.text = (param = '') => {
      res.setHeader('Content-Type', 'text/plain')
      res.end(param)
   }
   //get the query strings from the URL
   let search = new URL('http://www.google.com' + req.url).search;
   let pthName = new URL('http://www.google.com' + req.url).pathname;
   req.url_pathname = pthName //add the custom path
   req.query = search ? qs.parse(search.substr(1)) : {}
}


module.exports = ServerExtension;
