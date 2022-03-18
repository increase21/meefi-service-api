const helpers = {}
const request = require('request')
const dbFunctions = require('../model/v1.1/dbFunctions')
const errorCode = require('./error_code')

// for generating token
const randomToken = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-'
helpers.generateToken = (len) => {
   let token = ''
   let xLen = randomToken.length - 1;
   for (let i = 0; i < len; i++) {
      token += randomToken.charAt(Math.random() * xLen)
   }
   return token
}

// for checking input fields
helpers.getInputValueString = (inputObj, field) => {
   return inputObj instanceof Object && inputObj.hasOwnProperty(field) && typeof inputObj[field] === 'string'
      ? inputObj[field].trim() : ''
}

// for getting input fields number
helpers.getInputValueNumber = (inputObj, field) => {
   return inputObj instanceof Object && inputObj.hasOwnProperty(field) && typeof inputObj[field] === 'number'
      ? inputObj[field] : 'none'
}

// for getting input fields object
helpers.getInputValueObject = (inputObj, field) => {
   return inputObj instanceof Object && inputObj.hasOwnProperty(field) && typeof inputObj[field] === 'object' ? inputObj[field] : ''
}

// for getting input fields array
helpers.getInputValueArray = (inputObj, field) => {
   return inputObj instanceof Object && inputObj.hasOwnProperty(field) && inputObj[field] instanceof Array ? inputObj[field] : ''
}

//check alphabet character
helpers.isAlphabet = (input) => {
   return /^[a-z]+$/i.test(input)
}

//check alphabet character
helpers.isNumberic = (input) => {
   return /^\d+\.?(\d+)?$/.test(input)
}


//check alphabet character
helpers.isAlphabetNumeric = (input) => {
   return /^[a-z0-9]+$/i.test(input)
}


helpers.getStartIndex = (page, item = 50) => {
   if (!page || isNaN(page)) return 0
   return (page - 1) * 50
}


helpers.makeHTTRequest = (data = { url: '', method: '', headers: {}, body: {} }) => {
   return new Promise(resolve => {
      request({
         headers: data?.headers ? data.headers : {},
         uri: data.url,
         body: data.body ? data.body : '',
         method: data.method ? data.method : "POST",
      }, (error, res) => resolve(error ? { error: error } : res.body))
   })
}


helpers.outputError = (response, code, message) => {
   //if there's an http code
   if (/^\d+$/.test(code)) {
      response.statusCode = code
   }

   let outputObj = {}
   switch (code) {
      case 400:
         outputObj = {
            code: code,
            error: typeof message !== 'undefined' ? message : `Bad Request`
         }
         break
      case 401:
         outputObj = {
            code: code,
            error: typeof message !== 'undefined' ? message : `Unauthorized`
         }
         break
      case 404:
         outputObj = {
            code: code,
            error: typeof message !== 'undefined' ? message : `Requested resources does not exist`
         }
         break
      case 405:
         outputObj = {
            code: code,
            error: typeof message !== 'undefined' ? message : `Method Not Allowed`
         }
         break
      case 406:
         outputObj = {
            code: code,
            error: typeof message !== 'undefined' ? message : `Requested Not Acceptable`
         }
         break;
      case 500:
         outputObj = {
            code: code,
            code: errorCode.serverError,
            error: typeof message !== 'undefined' ? message : `Oops! Something went wrong.`
         }
         break;
      case 502:
         outputObj = {
            code: code,
            error: typeof message !== 'undefined' ? message : `Connection Refused`
         }
         break;
      case 503:
         outputObj = {
            code: code,
            error: typeof message !== 'undefined' ? message : `Service Unavailable`
         }
         break;
      default:
         outputObj = {
            status: "error",
            code,
            msg: message
         }
   }
   response.json(outputObj)
}

//function to get available partners by country
helpers.getParterList = async (countryCode, finCode, selectID = true) => {
   let query = `SELECT ${selectID ? "id AS id," : ""} name, code, country_code FROM fin_partners WHERE country_code='${countryCode}'`
   if (finCode) {
      query += ` AND code=${finCode}`
   }
   //get the name configuration file
   let getData = await dbFunctions.query(query).catch(e => ({ error: e }))

   //check error
   if (getData && getData.error) {
      console.log(getData.error)
      return { status: false, msg: "Oops!! Something went wrong", code: 500 }
   }


   //if the data is not available
   if (!getData || getData.length === 0) {
      return {
         status: false, code: errorCode.notFound,
         msg: `Record not found for country ${countryCode} ${finCode ? "and fin_code " + finCode : ''}`
      }
   }
   return { status: true, data: getData }
}

//for getting configuration data
helpers.getConfigSettings = async (country, dbName) => {
   //get the name configuration file
   let getData = await dbFunctions.query(`SELECT * FROM ${dbName} WHERE country_code='${country}'`).catch(e => ({ error: e }))

   //check error
   if (getData && getData.error) {
      console.log(getData.error)
      return { status: false, msg: "Oops!! Something went wrong" }
      //   return helpers.outputError(this.res, 500)
   }

   //if the data is not available
   if (!getData || getData.length === 0) {
      return { status: false, msg: "Country not available at the moment" }
   }
   //get data out from the array
   getData = getData[0]
   let configSettings;
   //get the configSettings
   try {
      configSettings = JSON.parse(getData.config_settings)
   } catch (e) {
      console.log(e)
      return { status: false, msg: "Oops! Country not available at the moment" }
   }

   return { status: true, config_settings: configSettings }
}

//for running configuration setting

helpers.runConfigSettingData = (data = { req, res, body, userData, getSetin, noFunctionNameError, JsonParseError, }) => {
   //get the entrire configuration settings
   let fileRoute = data.getSetin.route
   let fileMethod = data.getSetin.method

   var configController;

   //require the file if it exist
   try {
      configController = require("../methods" + fileRoute)
   } catch (e) {
      console.log(e)
      return helpers.outputError(data.res, null, data.JsonParseError)
   }

   //if the method name exist
   if (typeof configController[fileMethod] === "function") {
      return configController[fileMethod](data.req, data.res, data.body, data.userData, data.getSetin).catch(e => {
         console.log(e)
         helpers.outputError(data.res, 503)
      })
   } else {
      //if the method name does not exist
      return helpers.outputError(data.res, null, data.noFunctionNameError)
   }
}


//for logging name enquries
helpers.logNameCheckRequests = async (data = { userID: '', finAccount: '', finCode: '', countryCode: '', externalRef: '' }) => {
   // console.log(data)
   //if there are no important data
   if (!data || !data.userID || !data.finAccount || !data.finCode) return

   let query = `INSERT INTO name_enquiries (merchant_id, fin_code, fin_account, country_code, ext_ref)VALUES(${data.userID}, '${data.finCode}', '${data.finAccount}', '${data.countryCode}', '${data.externalRef}')`
   //save the data
   let saveReq = await dbFunctions.query(query).catch(e => ({ error: e }))

   //check error
   if (saveReq && saveReq.error) {
      console.log("error while saving name check log", saveReq.error)
   }

   if (!saveReq.affectedRows) {
      console.log("could not save name check logs", saveReq)
   }

   return
}

//for calculating transfer fee and returning the value and the currency
helpers.getTransferCharge = (feeData, amount) => {
   //if the day
   if (!feeData) return {}
   try {
      feeData = typeof feeData == "object" ? feeData : JSON.parse(feeData)
   } catch (e) { }

   if (!feeData.charge_type) return {}

   let feeCharge = 0
   let feeCurrency = ''
   let chargeValue = 0
   let chargeType = ''
   amount = parseFloat(amount)
   //run the settings based on type
   if (feeData.charge_type === "fixed") {
      feeCharge = feeData.charge_value
      feeCurrency = feeData.currency
      chargeValue = feeData.charge_value
      chargeType = feeData.charge_type
   } else if (feeData.charge_type === "percent") {
      p = parseFloat(feeData.charge_value)
      feeCharge = ((p / 100) * amount).toFixed(2)
      feeCurrency = feeData.currency
      chargeValue = feeData.charge_value
      chargeType = feeData.charge_type
   } else {
      let ranData = feeData.data
      //sort the data
      ranData.sort((a, b) => b.amount - a.amount)
      //get the fee assocaited with the amount
      // console.log(ranData)
      // console.log(ranData)
      let getValue = ranData[ranData.findIndex(e => parseFloat(e.amount) >= amount && amount <= parseFloat(e.amount))]
      //if the ammount is not found bcos the incoming value
      //is bigger than the settings, take the first bigger value
      if (!getValue || !getValue.charge_value) {
         getValue = ranData[0]
      }

      // console.log(getValue)

      //do the calculation based on the fee settings
      if (getValue.charge_type === "percent") {
         p = parseFloat(getValue.charge_value)
         feeCharge = ((p / 100) * amount).toFixed(2)
         feeCurrency = getValue.currency
         chargeValue = getValue.charge_value
         chargeType = feeData.charge_type

      } else {
         feeCharge = getValue.charge_value
         feeCurrency = getValue.currency
         chargeValue = getValue.charge_value
         chargeType = feeData.charge_type

      }
   }

   return { fee: feeCharge, currency: feeCurrency, charge_value: chargeValue, charge_type: chargeType }
}

helpers.errorText = {
   failToProcess: "Could not complete your request. please retry"
}

helpers.telcoAvailable = ["mtn", "moov"]

helpers.outputSuccess = (response, data) => {
   response.json({ status: "success", code: "CS200", data })
}
module.exports = helpers;