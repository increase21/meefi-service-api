const xml2JSON = require('xml2js');
const fs = require('fs')
const helpers = require("../../assets/helpers")
const dbFunctions = require('../../model/v1.1/dbFunctions');
const errorCode = require('../../assets/error_code');

class hooks {
   constructor(req, res, body, userData) {
      this.req = req
      this.method = req.method.toLowerCase()
      this.res = res
      this.body = body
      this.userData = userData

   }

   //this function handles MTN hook debit complete. 
   async mtnTransferComplete() {

      let payload = await xml2JSON.parseStringPromise(this.body).catch(e => ({ error: e }))

      //check if there's error
      if (!payload || payload.error) {
         TODO://
         return helpers.outputError(this.res, errorCode.requestFailed, "No valid payload")
      }

      //if the key is not present
      if (!payload.hasOwnProperty('ns0:debitcompletedrequest')) {
         TODO: //notify
         return helpers.outputError(this.res, errorCode.requestFailed, "No valid payload")
      }

      //get the data out
      payload = payload['ns0:debitcompletedrequest']

      // console.log(payload)
      //get the transaction id
      let myTxnID = payload.externaltransactionid[0]
      //get the transaction status
      let resStatus = payload.status[0]

      //if there's no transaction ID, end the request
      if (!myTxnID || isNaN(myTxnID) || myTxnID < 1) {
         return helpers.outputError(this.res, errorCode.requestFailed, "No valid payload")
      }

      //get the transaction
      let getRecord = await dbFunctions.query(`SELECT * FROM transfer_transactions WHERE id=${myTxnID}`).catch(e => ({ error: e }))

      //if there's an error
      if (getRecord && getRecord.error) {
         return helpers.outputError(this.res, errorCode.serverError, "Somethng went wrong")
      }

      //if there's no record
      if (!getRecord || getRecord.length === 0) {
         return helpers.outputError(this.res, errorCode.notFound, "transaction not found")
      }

      //if the transaction was not successfully sent
      getRecord = getRecord[0]
      if (parseInt(getRecord.origin_fin_status) !== 1) {
         return helpers.outputError(this.res, errorCode.notFound, "Fraud Detected!")
      }

      //if the transaction is not successful, update the record to fail
      if (resStatus !== "SUCCESSFUL") {
         //update the record
         let failRecord = await this._____updateTransactionRecord(`UPDATE transfer_transactions SET origin_fin_status=3, status_code=3, status='failed', origin_fin_data ='${JSON.stringify(payload)}' WHERE id=${myTxnID}`).catch(e => ({ error: e }))
         //reply MTN
         return this._____replyMTNResponse()
      }

      //add a payload to reference the transaction
      let responsePayload = JSON.stringify({
         transactionid: myTxnID,
         status: resStatus,
      })

      let query = `UPDATE transfer_transactions SET origin_fin_status=2, origin_fin_data='${responsePayload}' WHERE id=${myTxnID}`

      //update the transaction to success
      if (!await this._____updateTransactionRecord(query)) {
         return this._____replyMTNResponse()
      }

      //load the credited financial configuration and run the credit
      let getConfig = await helpers.getConfigSettings(getRecord.country_code, 'transfer_config').catch(e => ({ error: e }))

      //if there's no data return
      if (!getConfig || getConfig.status !== true) {
         return this._____replyMTNResponse()
      }

      // console.log(getConfig)

      //get the destination name configuration
      let destData = getConfig.config_settings[getConfig.config_settings.findIndex(e => parseInt(e.fin_id) === parseInt(getRecord.destination_fin_id))]

      let destController;
      try {
         destController = require('../../methods' + destData.route)
      } catch (e) {
         console.log(e)
         return this._____replyMTNResponse()
      }

      let sendData = {
         receiver_lastname: getRecord.receiver_lastname,
         receiver_firstname: getRecord.receiver_firstname,
         transaction_id: myTxnID,
         destination_fin_account: getRecord.destination_fin_account,
         amount: getRecord.amount,
         _action: "credit",
         _transaction_id: getRecord.id

      }

      //send the credit request to the destination controller/file
      let runCredit = await destController[destData.method](this.req, this.res, sendData).catch(e => ({ error: e }))
      //reply MTN
      return this._____replyMTNResponse()

   }













   /**
    * Private Method: To reply MTN response when the debit is completed
    */
   _____replyMTNResponse() {
      return this.res.xml(`<?xml version="1.0" encoding="UTF-8"?>
      <ns0:debitcompletedresponse xmlns:ns0="http://www.ericsson.com/em/emm/callback/v1_2"/>`)
   }

   /**
    * Private function to update transaction
    */
   async _____updateTransactionRecord(statement) {
      // console.log(statement)
      let updateTrans = await dbFunctions.query(statement).catch(e => ({ error: e }))

      // console.log(updateTrans)
      //if there's an error occurred
      if (updateTrans && updateTrans.error) {
         console.log("Trasaction update error occurred", updateTrans.error)
         return false
      }
      //if the query does not execute
      if (!updateTrans || !updateTrans.affectedRows) {
         console.log("Trasaction failed to update", updateTrans)
         return false
      }
      return true;

   }

}
module.exports = hooks

