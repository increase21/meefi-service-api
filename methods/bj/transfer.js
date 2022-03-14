const helpers = require("../../assets/helpers")
const xml2JSON = require('xml2js')
const dbFunctions = require("../../model/v1.1/dbFunctions")
const errorCode = require("../../assets/error_code")
const file = require("../../assets/file")
const pObj = {}


pObj.TransferMTN = async (req, res, body, userData) => {
   //check if there's no action specified
   if (!body || !body._action) {
      return helpers.outputError(res, null, "Service unavailable. Action no specified")
   }

   let tranID = body._transaction_id;

   //if the action coming in, is to debit a customer
   if (body._action === "debit") {

      //request body to send to MTN
      let bodyDebit = `<?xml version="1.0" encoding="UTF-8"?>
<ns0:debitrequest xmlns:ns0="http://www.ericsson.com/em/emm/financial/v1_0">
     <fromfri>fri:${body.origin_fin_account}/msisdn</fromfri>
     <tofri>fri:mosave.sp/USER</tofri>
     <amount>
         <amount>${body._grand_total}</amount>
         <currency>XOF</currency>
     </amount>
     <externaltransactionid>${tranID}</externaltransactionid>
     <frommessage>${body.description}</frommessage>
     <tomessage>${body.description}</tomessage>
     <referenceid>${tranID}</referenceid>
 </ns0:debitrequest>`

      //send the request to the MTN service
      let sendReq = file.config.env === "live" ? await helpers.makeHTTRequest({
         url: 'https://100.64.142.133:8030/sdp-api/debit',
         body: bodyDebit, method: "POST"
      }).catch(e => ({ error: e })) : `<?xml version="1.0" encoding="UTF-8"?>
      <ns0:debitresponse xmlns:ns0="http://www.ericsson.com/em/emm/financial/v1_0">
       <transactionid>31023</transactionid>
       <status>PENDING</status>
      </ns0:debitresponse>`

      //check the response coming back
      if (sendReq && sendReq.error) {
         return helpers.outputError(res, null, `Error: ${body.origin_fin_name} service unreachable`)
      }

      //PArse the XML response 
      let parseRes = await xml2JSON.parseStringPromise(sendReq)

      let getTrxStatus;
      let getTrxID;
      let tranStatus = false

      // console.log(parseRes)
      //if the transaction is sent to MTN successfully
      if (parseRes) {
         //if the response has a positive reply
         if (parseRes.hasOwnProperty('ns0:debitresponse')) {
            getTrxID = parseRes['ns0:debitresponse'].transactionid[0]
            getTrxStatus = parseRes['ns0:debitresponse'].status[0]
            //sent the transaction status to true
            tranStatus = true
         } else if (parseRes.hasOwnProperty('ns0:errorResponse')) {
            getTrxStatus = parseRes['ns0:errorResponse']['$'].errorcode
         } else {
            getTrxStatus = "Request Failed"
         }
      } else {
         getTrxStatus = "Request Failed"
      }

      //if the request is sent successfully, update the DB to sent
      if (tranStatus === true) {
         let saveData = JSON.stringify({ "status": getTrxStatus, "transaction_id": getTrxID })
         //update the record
         let updateReg = await dbFunctions.query(`UPDATE transfer_transactions SET status_code=1, status='sent', origin_fin_data='${saveData}',origin_fin_status=1 WHERE id=${tranID}`)

         //if there's an error
         if (updateReg && updateReg.error) {
            console.log(updateReg.error)
            return helpers.outputError(res, errorCode.serverError, "Oops! something went wrong")
         }

         //check if the query failds
         if (!updateReg || updateReg.affectedRows === 0) {
            return helpers.outputError(res, errorCode.couldNotProcess, "Request Failed")
         }
         return helpers.outputSuccess(res, { status: "pending", transaction_id: tranID })
      }
      return helpers.outputError(res, errorCode.requestFailed, "Request Failed")
   } else {
      //if there's no local transaction id, abort the request
      if (!tranID || isNaN(tranID)) {
         return { status: false, msg: "Request Failed", code: errorCode.requestFailed }
      }

      //request body to send to MTN
      let bodyDebit = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <ns0:sptransferrequest xmlns:ns0="http://www.ericsson.com/em/emm/serviceprovider/v1_0/backend">
            <sendingfri>FRI:mosave.sp/USER</sendingfri>
            <receivingfri>FRI:${body.destination_fin_account}/MSISDN</receivingfri>
            <amount>
                <amount>${body.amount}</amount>
                <currency>XOF</currency>
            </amount>
            <providertransactionid>${tranID}</providertransactionid>
            <name>
                <firstname>${body.receiver_firstname}</firstname>
                <lastname>${body.receiver_lastname}</lastname>
            </name>
            <sendernote></sendernote>
            <receivermessage>Received</receivermessage>
            <referenceid>${tranID}</referenceid>
        </ns0:sptransferrequest>`

      //sending the request to MTN Service
      let sendReq = file.config.env === "live" ? await helpers.makeHTTRequest({
         url: 'https://100.64.142.133:8030/sdp-api/sptransfer',
         body: bodyDebit, method: "POST"
      }).catch(e => ({ error: e })) :
         `<?xml version="1.0" encoding="UTF-8"?>
      <ns0:sptransferresponse xmlns:ns0="http://www.ericsson.com/em/emm/serviceprovider/v1_0/backend">
       <transactionid>30827</transactionid>
      </ns0:sptransferresponse>`

      //check the response coming back
      if (sendReq && sendReq.error) {
         return {
            status: false, code: errorCode.requestFailed,
            msg: `Error: ${body.destination_fin_name} service unreachable`,
         }
      }

      //PArse the XML response 
      let parseRes = await xml2JSON.parseStringPromise(sendReq).catch(e => ({ error: e }))

      let getTrxStatus;
      let getTrxID;
      let tranStatus = false

      //if the transaction is sent to MTN successfully
      if (parseRes) {
         //if the response has a positive reply
         if (parseRes.hasOwnProperty('ns0:sptransferresponse')) {
            getTrxID = parseRes['ns0:sptransferresponse'].transactionid[0]
            // getTrxStatus = parseRes['ns0:debitresponse'].status[0]
            //sent the transaction status to true
            tranStatus = true
         } else if (parseRes.hasOwnProperty('ns0:errorResponse')) {
            getTrxStatus = parseRes['ns0:errorResponse']['$'].errorcode
         } else {
            getTrxStatus = "Request Failed"
         }
      } else {
         getTrxStatus = "Request Failed"
      }

      //if the request is sent successfully, update the DB to sent
      if (tranStatus === true) {
         //save the status and the transaction ID
         let saveData = JSON.stringify({ "status": "SUCCESS", "transaction_id": getTrxID })
         //update statement
         let query = `UPDATE transfer_transactions SET status_code=2,status='completed', destination_fin_data='${saveData}',destination_fin_status=2 WHERE id=${tranID}`
         //run the update
         let updateTran = await pObj.________updateTransaction(query).catch(e => ({ error: e }))

         //update the record
         if (!updateTran || updateTran.status !== true) return updateTran;

         return { status: true }
      }

      //update the transaction to failed
      let query = `UPDATE transfer_transactions SET status_code=3, status='failed', destination_fin_data='${JSON.stringify(parseRes)}',destination_fin_status=2 WHERE id=${tranID}`

      let updateTran = await pObj.________updateTransaction(query).catch(e => ({ error: e }))
      //return the response
      return {
         status: false, msg: `Request Failed`,
         code: errorCode.requestFailed
      }
   }
}


pObj.TransferMOOV = async (req, res, body, userData) => {
   //check if there's no action specified
   if (!body || !body._action) {
      return helpers.outputError(res, null, "Service unavailable. Action no specified")
   }

   let tranID = body._transaction_id;

   //if the request is a debit request
   if (body._action === "debit") {
      return helpers.outputError(res, null, "Debit feature not available at the moment")
   } else {

      //if there's no local transaction id, abort the request
      if (!tranID || isNaN(tranID)) {
         return { status: false, msg: "Request Failed", code: errorCode.requestFailed }
      }

      //request body to send to MOOV
      let bodyDebit = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:mmw="http://mmwservice/">
      <soapenv:Header/>
       <soapenv:Body><mmw:BankToWallet>
           <!--Optional:-->
           <token>AtT4hgQyhQV2MFeymwxTNkUfQDelyyxdDFBQ/y7X2AE=</token>
           <!--Optional:-->
           <request>
              <!--Optional:-->
              <accountnumber>111111111</accountnumber>
              <!--Optional:-->
              <bankbalanceafter>0</bankbalanceafter>
              <!--Optional:-->
              <bankbalancebefore>9690000</bankbalancebefore>
              <!--Optional:-->
              <banktransactionreferenceid>${tranID}</banktransactionreferenceid>
              <!--Optional:-->
              <firstname>${body.receiver_firstname}</firstname>
              <!--Optional:-->
              <lastname>${body.receiver_lastname}</lastname>
              <!--Optional:-->
              <msisdn>${body.destination_fin_account}</msisdn>
              <!--Optional:-->
              <secondname></secondname>
              <!--Optional:-->
              <timestamp>${new Date().toISOString()}</timestamp>
              <!--Optionalfundwallet:-->
              <transamount>${body.amount}</transamount>
           </request>
        </mmw:BankToWallet>
     </soapenv:Body>
  </soapenv:Envelope>`

      let sendReq = file.config.env === "live" ? await helpers.makeHTTRequest({
         url: 'https://100.64.142.133:8030/sdp-api/sptransfer',
         body: bodyDebit, method: "POST"
      }).catch(e => ({ error: e })) :
         `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
          <ns2:BankToWalletResponse xmlns:ns2="http://mmwservice/">
              <response>
                  <accountnumber>111111111</accountnumber>
                  <banktransactionreferenceid>116113276193</banktransactionreferenceid>
                  <message>SUCCESS</message>
                  <msisdn>22999248926</msisdn>
                  <status>0</status>
                  <timestamp>2021-01-22T16:00:23+00:00</timestamp>
                  <transamount>1485000</transamount>
                  <transid>420210122000188</transid>
              </response>
          </ns2:BankToWalletResponse>
      </soap:Body>
  </soap:Envelope>`


      let sendRegCredit = await xml2JSON.parseStringPromise(sendReq).catch(e => ({ error: e }))

      //check the response coming back
      if (sendRegCredit && sendRegCredit.error) {
         return {
            status: false, code: errorCode.requestFailed,
            msg: `Error: destination host is unreachable`
         }
      }

      let query = `UPDATE transfer_transactions SET status_code=3, status='failed', destination_fin_data='${JSON.stringify(sendRegCredit)}', destination_fin_status=3 WHERE id=${tranID}`

      //check if there's a valid response
      if (sendRegCredit && sendRegCredit.hasOwnProperty('soap:Envelope')) {
         sendRegCredit = sendRegCredit['soap:Envelope']['soap:Body'][0]

         //if does not have wallet-bank key
         if (!sendRegCredit.hasOwnProperty('ns2:BankToWalletResponse')) {
            let failTrans = await pObj.________updateTransaction(query).catch(e => ({ error: e }))
            return {
               status: false, msg: `Transaction Failed`,
               code: errorCode.requestFailed
            }
         }

         //get the next propert
         sendRegCredit = sendRegCredit['ns2:BankToWalletResponse'][0]

         //get the next property
         if (!sendRegCredit.hasOwnProperty('response')) {
            let failTrans = await pObj.________updateTransaction(query).catch(e => ({ error: e }))
            return {
               status: false, msg: `Transaction Failed`,
               code: errorCode.requestFailed
            }
         }

         //get the response
         sendRegCredit = sendRegCredit.response[0]
         //save the transaction details
         let saveData = JSON.stringify({
            "status": sendRegCredit.message[0],
            "transaction_id": sendRegCredit.transid[0]
         })

         //update the record 
         query = `UPDATE transfer_transactions SET status_code=2, status='completed', destination_fin_data='${saveData}', destination_fin_status=2 WHERE id=${tranID}`
         //update the record
         let updateTran = await pObj.________updateTransaction(query).catch(e => ({ error: e }))

         //update the record
         if (!updateTran || updateTran.status !== true) return updateTran;

         return { status: true }

      } else {
         let failTrans = await pObj.________updateTransaction(query).catch(e => ({ error: e }))
         return {
            status: false, msg: `Transaction Failed`,
            code: errorCode.requestFailed
         }
      }
   }
}




















/**
 * This is a private method 
 * **/
pObj.________updateTransaction = async (statement) => {
   //update the record
   let updateReg = await dbFunctions.query(statement).catch(e => ({ error: e }))

   //if there's an error
   if (updateReg && updateReg.error) {
      return {
         status: false, msg: `Oops! something went wrong`,
         code: errorCode.serverError
      }
   }

   //check if the query failds
   if (!updateReg || updateReg.affectedRows === 0) {
      return {
         status: false, msg: `Request Failed`,
         code: errorCode.couldNotProcess
      }
   }
   return {
      status: true
   }
}


module.exports = pObj