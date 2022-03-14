const fs = require('fs')
const xml2JSON = require('xml2js');
const helpers = require("../../assets/helpers")
const errorCode = require("../../assets/error_code")
const dbFunctions = require('../../model/v1.1/dbFunctions');
const file = require('../../assets/file');
const nameEnquiry = {}


// THIS METHOD QUERIES NAME FOR MTN 
nameEnquiry.QueryMTN = async (req, res, body, userData, settingData) => {
   //get the find number
   let finAccount = helpers.getInputValueString(body, 'fin_account')
   // console.log(body)
   //check the number provided is it's invalid
   if (!helpers.isNumberic(finAccount) || finAccount.length < 10 || finAccount.length > 16) {
      return helpers.outputError(res, errorCode.missingField, "fin_account is invalid")
   }

   //xml data to send out
   let sendBody = `<?xml version="1.0" encoding="UTF-8"?>
         <ns0:getaccountholderpersonalinformationrequest xmlns:ns0="http://www.ericsson.com/em/emm/provisioning/v1_0">
             <identity>ID:${finAccount}/MSISDN</identity>
         </ns0:getaccountholderpersonalinformationrequest>`

   //confirm the number
   let getData = file.config.env === "live" ? await helpers.makeHTTRequest({
      url: "https://100.64.142.133:8030/sdp-api/getaccountholderpersonalinformation",
      headers: { "Content-Type": "application/xml" },
      body: sendBody
   }).catch(e => ({ error: e })) : fs.readFileSync('./folder/mtn_name_success.xml')

   //check error
   if (getData && getData.error) {
      console.log(getData, "error")
      return helpers.outputError(res, null, "Name enquiry fail")
   }


   let getJSON = await xml2JSON.parseStringPromise(getData, { trim: true }).catch(e => ({ error: e }))

   // console.log(getJSON)
   //if there's error
   if (getJSON && getJSON.error) {
      return helpers.outputError(res, null, "Name enquiry failed")
   }

   //check the property
   if (getJSON.hasOwnProperty('ns0:getaccountholderpersonalinformationresponse')) {
      getJSON = getJSON['ns0:getaccountholderpersonalinformationresponse'].information
      //get the data
      getJSON = getJSON[0]

      //getting the params
      let name = getJSON.name ? getJSON.name[0] : ''
      let gender = getJSON.gender ? getJSON.gender[0] : ''

      //re convert the name
      let fname = name.firstname ? name.firstname[0] : ''
      let sname = name.surname ? name.surname[0] : ''

      getJSON = { firstname: fname, lastname: sname, gender, fin_account: finAccount, fin_name: body.fin_name }

   } else {
      getJSON = {}
   }

   let saveLog = await helpers.logNameCheckRequests({
      userID: userData.id,
      finAccount: finAccount,
      finCode: body.fin_code,
      countryCode: body.country_code,
      externalRef: body.reference_id ? body.reference_id : ''
   }).catch(e => ({ error: e }))
   // console.log(saveLog)

   return helpers.outputSuccess(res, getJSON)

}



// THIS METHOD QUERIES NAME FOR MOOV
nameEnquiry.QueryMOOV = async (req, res, body, userData, settingData) => {
   //get the find number
   let finAccount = helpers.getInputValueString(body, 'fin_account')
   // console.log(body)
   //check the number provided is it's invalid
   if (!helpers.isNumberic(finAccount) || finAccount.length < 10 || finAccount.length > 16) {
      return helpers.outputError(res, errorCode.missingField, "fin_account is invalid")
   }

   //xml data to send out
   let sendBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:mmw="http://mmwservice/">
   <soapenv:Header/>
   <soapenv:Body>
   <mmw:getMobileAccountStatus>
   <!--Optional:-->
    <token>kQvOcIXaXKCNvHyPyrjn9CdbmFGHKW321dC4OUzKWKUxNde3nK</token>
     <!--Optional:-->
       <request>
          <!--Optional:-->
            <msisdn>${finAccount}</msisdn>
       </request>
     </mmw:getMobileAccountStatus>
   </soapenv:Body>
   </soapenv:Envelope>`

   //confirm the number
   let getData = file.config.env === "live" ? await helpers.makeHTTRequest({
      url: "https://100.64.191.163:443/MMWService",
      headers: { "Content-Type": "application/xml" },
      body: sendBody
   }).catch(e => ({ error: e })) : fs.readFileSync('./folder/moov_name_success.xml')

   //check error
   if (getData && getData.error) {
      console.log(getData, "error")
      return helpers.outputError(res, null, "Name enquiry fail")
   }


   let getJSON = await xml2JSON.parseStringPromise(getData, { trim: true }).catch(e => ({ error: e }))

   // console.log(getJSON)
   //if there's error
   if (getJSON && getJSON.error) {
      return helpers.outputError(res, null, "Name enquiry failed")
   }

   //check the property
   //check the properties
   if (getJSON && getJSON.hasOwnProperty('soap:Envelope')) {
      getJSON = getJSON['soap:Envelope']['soap:Body']

      if (getJSON) {
         getJSON = getJSON[0]
      } else {
         getJSON = {}
      }
      // of the data exist
      if (getJSON && getJSON.hasOwnProperty('ns2:getMobileAccountStatusResponse')) {
         getJSON = getJSON['ns2:getMobileAccountStatusResponse']
         //if the data exist
         if (getJSON && getJSON.length > 0) {
            getJSON = getJSON[0].response

            if (getJSON && getJSON.length > 0) {
               getJSON = getJSON[0]
            } else {
               getJSON = {}
            }

            getJSON = {
               firstname: getJSON.firstname ? getJSON.firstname[0] : '',
               lastname: getJSON.lastname ? getJSON.lastname[0] : '',
               gender: '', fin_account: finAccount, fin_name: body.fin_name,
            }

         } else {
            getJSON = {}
         }
      } else {
         getJSON = {}
      }
   } else {
      getJSON = {}
   }

   let saveLog = await helpers.logNameCheckRequests({
      userID: userData.user_id,
      finAccount: finAccount,
      finCode: body.fin_code,
      countryCode: body.country_code,
      externalRef: body.reference_id
   }).catch(e => ({ error: e }))

   return helpers.outputSuccess(res, getJSON)

}





module.exports = nameEnquiry