const helpers = require("../../assets/helpers")
const errorCode = require('../../assets/error_code')
const dbFunctions = require("../../model/v1.1/dbFunctions")

class api {
   constructor(req, res, body, userData) {
      this.req = req
      this.method = req.method.toLowerCase()
      this.res = res
      this.body = body
      this.userData = userData
      this.nameEnquiryCharge = 100

   }

   async nameEnquiry() {
      if (this.method !== "get") {
         return helpers.outputError(this.res, 405)
      }

      let country = helpers.getInputValueString(this.req.query, "country_code")
      let finAccount = helpers.getInputValueString(this.req.query, "fin_account")
      let finCode = helpers.getInputValueString(this.req.query, "fin_code")

      //check if there's country
      if (!country) {
         return helpers.outputError(this.res, errorCode.missingField, "country is required")
      }

      //check if the number is not submitted
      if (!finAccount) {
         return helpers.outputError(this.res, errorCode.missingField, "fin_account is required")
      }

      //check if the number is not submitted
      if (!finCode) {
         return helpers.outputError(this.res, errorCode.missingField, "fin_code is required")
      }

      //if the country code is more than 3 xters
      if (!helpers.isAlphabet(country) || country.length < 2 || country.length > 3) {
         return helpers.outputError(this.res, errorCode.missingField, "country is invalid")
      }

      if (!helpers.isNumberic(finAccount) || finAccount.length < 10 || finAccount.length > 16) {
         return helpers.outputError(this.res, errorCode.missingField, "fin_account is invalid")
      }

      let getPartner = await helpers.getParterList(country, finCode).catch(e => ({ error: e }))

      //if the response is not true
      if (getPartner.status !== true) {
         return helpers.outputError(this.res, getPartner.code, getPartner.msg)
      }

      //get the partners from the configuration setting
      let getSetinNameVal = await dbFunctions.query(`SELECT * FROM name_enq_config WHERE country_code='${country}' AND fin_id=${getPartner.data[0].id}`).catch(e => ({ error: e }))

      //check for error
      if (getSetinNameVal && getSetinNameVal.error) {
         console.log(getSetinNameVal.error)
         return helpers.outputSuccess(this.res, 503)
      }

      //if the response is not true
      if (!getSetinNameVal || getSetinNameVal.length === 0) {
         return helpers.outputError(this.res, null, "country_code not available")
      }

      //get the settings data from the data
      let settingData = getSetinNameVal[0]

      return await helpers.runConfigSettingData({
         req: this.req,
         res: this.res,
         body: this.req.query,
         userData: this.userData,
         getSetin: settingData,
         noFunctionNameError: "financial institution not available",
         JsonParseError: "Oops! financial institution not available for this request"
      })
   }


   async availablePartners() {
      if (this.method !== "get") {
         return helpers.outputError(this.res, 405)
      }

      let country = helpers.getInputValueString(this.req.query, "country_code")
      let requestType = helpers.getInputValueString(this.req.query, "request_type")

      //check if there's country
      if (!country) {
         return helpers.outputError(this.res, errorCode.missingField, "country_code is required")
      }

      //if the country code is more than 3 xters
      if (!helpers.isAlphabet(country) || country.length < 2 || country.length > 3) {
         return helpers.outputError(this.res, errorCode.missingField, "country_code is invalid")
      }

      //get the partners from the configuration setting
      let getSetin = await helpers.getParterList(country, undefined, false).catch(e => ({ error: e }))

      //if the status is not success
      if (getSetin.status !== true) {
         return helpers.outputError(this.res, 500)
      }

      // //check if there's country
      if (requestType) {
         // return await helpers.runConfigSetting({
         //    req: this.req,
         //    res: this.res, getSetin,
         //    body: this.req.query,
         //    nameValue: requestType,
         //    getSettingFailError: "Could not get the data",
         //    noNameError: "request type not available",
         //    JsonParseError: "Oops! request type not available at the moment"
         // })
      } else {
         return helpers.outputSuccess(this.res, getSetin.data)

      }

   }


   async transactionFee() {
      //check the method
      if (this.method !== "get") {
         return helpers.outputError(this.res, 405)
      }
      let amount = helpers.getInputValueString(this.req.query, 'amount')
      let country = helpers.getInputValueString(this.req.query, 'country')
      let finCode = helpers.getInputValueString(this.req.query, 'fin_code')


      if (!country) {
         return helpers.outputError(this.res, errorCode.missingField, "country is required")
      }

      //valid data the amount
      if (!amount) {
         return helpers.outputError(this.res, errorCode.missingField, "amount is required")
      }

      //if the country code is more than 3 xters
      if (!helpers.isAlphabet(country) || country.length < 2 || country.length > 3) {
         return helpers.outputError(this.res, errorCode.missingField, "country is invalid")
      }

      if (!helpers.isNumberic(amount) || parseFloat(amount) <= 0) {
         return helpers.outputError(this.res, errorCode.invalidField, "amount must be a number and must be greater than zero")
      }

      if (!finCode) {
         return helpers.outputError(this.res, null, "fin_code is required")
      }

      if (isNaN(finCode) || parseFloat(finCode) < 0) {
         return helpers.outputError(this.res, null, "fin_code is invalid")
      }

      //get the partners from the configuration setting
      let getPartnersList = await helpers.getParterList(country, finCode).catch(e => ({ error: e }))

      //check for error
      if (getPartnersList.status !== true) {
         console.log(getPartnersList.error)
         return helpers.outputError(this.res, getPartnersList.code, getPartnersList.msg)
      }

      let finData = getPartnersList.data[0]

      //get the partners from the configuration setting
      let getSetin = await dbFunctions.query(`SELECT * FROM transfer_config WHERE country_code='${country}' AND fin_id=${finData.id}`).catch(e => ({ error: e }))

      //check for error
      if (getSetin && getSetin.error) {
         console.log(getSetin.error)
         return helpers.outputError(this.res, 503)
      }

      //if the response is not true
      if (!getSetin || getSetin.length === 0) {
         return helpers.outputError(this.res, errorCode.notFound, finCode + " not available at the moment")
      }

      let settingData = getSetin[0]
      let feeCharge = helpers.getTransferCharge(settingData.fee_data, amount)

      console.log(settingData)

      return helpers.outputSuccess(this.res, { fee: feeCharge.fee, currency: feeCharge.currency })
   }


   async transfer(ID) {
      switch (this.method) {
         case 'post':
            if (ID) return helpers.outputError(this.res, 404)
            return this.______processTransfer().catch(e => {
               return helpers.outputError(this.res, 503)
            })
         default:
            return helpers.outputError(this.res, 405)
      }
   }


   async transferStatus(extID) {
      if (this.method !== "get") {
         return helpers.outputError(this.res, 405)
      }

      if (!extID) {
         return helpers.outputError(this.res, 404)
      }

      if (!helpers.isAlphabetNumeric(extID)) {
         return helpers.outputError(this.res, errorCode.invalidField, "Invalid id supplied")
      }

      let getTran = await dbFunctions.query(`SELECT tt.id as transaction_id, tt.destination_fin_account, tt.origin_fin_account,
      tt.status,tt.receiver_firstname,tt.receiver_lastname,tt.amount, tt.trans_fee,tt.grand_total,tt.description,tt.country_code,tt.created,
      o.name AS origin_fin_name, o.code AS origin_fin_code, d.name AS destination_fin_name, d.code AS destination_fin_code FROM transfer_transactions AS tt LEFT JOIN fin_partners AS o ON o.id = tt.origin_fin_id LEFT JOIN fin_partners AS d ON d.id = tt.destination_fin_id WHERE tt.merchant_id=${this.userData.id} AND tt.external_id=${extID}`).catch(e => ({ error: e }))

      //if there's an error
      if (getTran && getTran.error) {
         console.log(getTran)
         return helpers.outputError(this.res, 500)
      }

      if (!getTran || getTran.length === 0) {
         return helpers.outputError(this.res, errorCode.notFound, "Transaction not found")
      }

      // console.log(originFinData, dstFinData)
      return helpers.outputSuccess(this.res, getTran[0])
   }



   /**
    * THis is a private method to process transaction
    * **/

   async ______processTransfer() {

      let originFin = helpers.getInputValueString(this.body, 'origin_fin_code')
      let originFinAcc = helpers.getInputValueString(this.body, 'origin_fin_account')
      let destFin = helpers.getInputValueString(this.body, 'destination_fin_code')
      let destFinAcc = helpers.getInputValueString(this.body, 'destination_fin_account')
      let rFirstName = helpers.getInputValueString(this.body, 'receiver_firstname')
      let rLastName = helpers.getInputValueString(this.body, 'receiver_lastname')
      let amount = helpers.getInputValueString(this.body, 'amount')
      let desc = helpers.getInputValueString(this.body, 'description')
      let country = helpers.getInputValueString(this.body, 'country_code')
      let extID = helpers.getInputValueString(this.body, 'external_id')
      let appPlatform = helpers.getInputValueString(this.body, 'app_platform')

      if (!originFin) {
         return helpers.outputError(this.res, errorCode.missingField, "origin_fin_code is required")
      }

      if (isNaN(originFin)) {
         return helpers.outputError(this.res, errorCode.missingField, "invalid origin_fin_code")
      }

      if (!originFinAcc) {
         return helpers.outputError(this.res, errorCode.missingField, "origin_fin_account is required")
      }

      if (!destFin) {
         return helpers.outputError(this.res, errorCode.missingField, "destination_fin_code is required")
      }

      if (isNaN(destFin)) {
         return helpers.outputError(this.res, errorCode.missingField, "invalid destination_fin_code")
      }

      if (!destFinAcc) {
         return helpers.outputError(this.res, errorCode.missingField, "destination_fin_account is required")
      }

      if (!amount) {
         return helpers.outputError(this.res, errorCode.missingField, "amount is required")
      }

      if (!country) {
         return helpers.outputError(this.res, errorCode.missingField, "country is required")
      }

      if (!rFirstName) {
         return helpers.outputError(this.res, errorCode.missingField, "receiver_firstname is required")
      }

      if (!rLastName) {
         return helpers.outputError(this.res, errorCode.missingField, "receiver_lastname is required")
      }

      if (!helpers.isNumberic(amount) || parseFloat(amount) <= 0) {
         return helpers.outputError(this.res, errorCode.invalidField, "amount must be a number and must be greater than zero")
      }

      //if the country code is more than 3 xters
      if (!helpers.isAlphabet(country) || country.length < 2 || country.length > 3) {
         return helpers.outputError(this.res, errorCode.missingField, "country is invalid")
      }

      //validate external ID
      if (extID) {
         if (!helpers.isAlphabetNumeric(extID)) {
            return helpers.outputError(this.res, errorCode.invalidField, "external_id can only be alphanumeric")
         }
      }

      if (!appPlatform) {
         return helpers.outputError(this.res, null, "app_platform is required")
      }

      if (["ussd"].indexOf(appPlatform) === -1) {
         return helpers.outputError(this.res, null, "Invalid app_platform")
      }

      //get the name configuration file
      let getData = await helpers.getParterList(country).catch(e => ({ error: e }))

      //check error
      if (getData.status !== true) {
         console.log(getData.error)
         helpers.outputError(this.res, getData.code, getData.msg)
      }

      //get data out from the array
      let configSettings = getData.data;

      //if the financial institution are not available
      let originFinCheck = configSettings.findIndex(e => e.code === originFin)
      let dstFinCheck = configSettings.findIndex(e => e.code === destFin)


      //check if the do not exist
      if (originFinCheck === -1) {
         return helpers.outputError(this.res, null, "Origin financial institution not available")
      }

      //check if the do not exist
      if (dstFinCheck === -1) {
         return helpers.outputError(this.res, null, "Origin financial institution not available")
      }

      let originFinData = configSettings[originFinCheck]
      let destFinData = configSettings[dstFinCheck]

      //get the partners from the configuration setting
      let getOSetin = await dbFunctions.query(`SELECT * FROM transfer_config WHERE fin_id IN (${originFinData.id}, ${destFinData.id})`).catch(e => ({ error: e }))

      //check for error
      if (getOSetin && getOSetin.error) {
         console.log(getOSetin.error)
         return helpers.outputSuccess(this.res, 503)
      }

      //get the configuration settings for transfer
      let originConfigData = getOSetin.filter(e => e.fin_id === originFinData.id)
      let dstConfigData = getOSetin.filter(e => e.fin_id === destFinData.id)

      //if they are not settings for transfers
      if (!originConfigData || originConfigData.length === 0) {
         return helpers.outputError(this.res, null, originFin + " not available at the moment")
      }

      //if they are not settings for transfers
      if (!dstConfigData || dstConfigData.length === 0) {
         return helpers.outputError(this.res, null, destFin + " not available at the moment")
      }

      //remove the data from array
      originConfigData = originConfigData[0]
      dstConfigData = dstConfigData[0]


      //if the origin does not accept transfer
      if (originConfigData.accept_debit !== 1) {
         return helpers.outputError(this.res, null, originFin + " not available for this request")
      }

      //if the origin does not accept transfer
      if (dstConfigData.accept_credit !== 1) {
         return helpers.outputError(this.res, null, destFin + " not available for this request")
      }

      let originController;

      try {
         originController = require('../../methods' + originConfigData.route)
      } catch (e) {
         console.log(e)
         return helpers.outputError(this.res, null, "Oops! Country not available at the moment")
      }

      //if the method name does not exist
      if (typeof originController[originConfigData.method] !== "function") {
         return helpers.outputError(this.res, null, "Oops! " + originFin + " not available for this request")
      }


      let destController;
      try {
         destController = require('../../methods' + dstConfigData.route)
      } catch (e) {
         console.log(e)
         return helpers.outputError(this.res, null, "Oops! Country not available at the moment")
      }

      //if the method name does not exist
      if (typeof destController[dstConfigData.method] !== "function") {
         return helpers.outputError(this.res, null, "Oops! " + destFin + " not available for this request")
      }

      let dn = new Date()
      dn.setHours(dn.getHours() + 1)
      //ge the date
      let pureDate = dn.toISOString().substring(0, 10)
      //get the transaction charges
      let feeCharge = helpers.getTransferCharge(originConfigData.fee_data, amount)

      //if there's no charge return
      if (!feeCharge || !feeCharge.currency) {
         return helpers.outputError(this.res, null, "Transaction failed")
      }

      let transFee = parseFloat(feeCharge.fee)
      let totalAmount = parseFloat(amount) + transFee
      let extRef = extID ? extID : "meekfi-" + helpers.generateToken(10)

      //log the request before sending it out to get transaction ID
      let query = `INSERT INTO transfer_transactions (merchant_id,origin_fin_id,origin_fin_account,destination_fin_id,destination_fin_account,receiver_firstname,receiver_lastname,amount,country_code,created_date,created_month,created_year,trans_fee,trans_fee_value,trans_fee_type,grand_total, description, external_id, app_platform)VALUES(${this.userData.id}, ${originConfigData.fin_id},'${this.body.origin_fin_account}',${dstConfigData.fin_id},'${this.body.destination_fin_account}','${this.body.receiver_firstname}','${this.body.receiver_lastname}','${this.body.amount}','${this.body.country}','${pureDate}','${pureDate.substring(0, 7)}','${pureDate.substring(0, 4)}',${transFee},${feeCharge.charge_value},'${feeCharge.charge_type}',${totalAmount},'${this.body.description}','${extRef}','${appPlatform}')`

      let logReg = await dbFunctions.query(query).catch(e => ({ error: e }))

      //check error if there's 
      if (logReg && logReg.error) {
         //if it's a duplicate transaction
         if (logReg.error.code = 'ER_DUP_ENTRY') {
            return helpers.outputError(this.res, errorCode.duplicateRequest, "Duplicate transaction")
         }
         console.log(logReg.error)
         return helpers.outputError(this.res, errorCode.serverError, "Oops! something went wrong")
      }

      //check if the query failds
      if (!logReg || logReg.affectedRows === 0) {
         return helpers.outputError(res, errorCode.couldNotProcess, "Oops! something went wrong")
      }

      this.body._origin_data = originConfigData
      this.body._destination_data = dstConfigData
      this.body._transaction_id = logReg.insertId
      this.body._action = "debit"
      this.body._grand_total = totalAmount

      //process the debit
      return await originController[originConfigData.method](this.req, this.res, this.body, this.userData).catch(e => {
         console.log(e)
         helpers.outputError(this.res, 503)
      })
   }


   async ______getTransfer() {

   }



}




module.exports = api