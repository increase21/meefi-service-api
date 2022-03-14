const helpers = require("../../assets/helpers")
const bcrypt = require('bcrypt')
const validator = require('validator')
const dbFunctions = require('../../model/v1.1/dbFunctions')


class users {
   constructor(req, res, body, userData) {
      this.req = req
      this.method = req.method.toLowerCase()
      this.res = res
      this.body = body
      this.userData = userData

   }


   async register() {
      let name = helpers.getInputValueString(this.body, "name")
      let email = helpers.getInputValueString(this.body, "email")
      let phone = helpers.getInputValueString(this.body, "phone")
      let password = helpers.getInputValueString(this.body, "password")

      //validate the payload
      if (!name) {
         return helpers.outputError(this.res, null, "Name is required")
      }
      //check if the name is too long
      if (name.length > 45) {
         return helpers.outputError(this.res, null, "Name too long")
      }

      if (!/^[a-z0-9\s\-\&]+$/i.test(name)) {
         return helpers.outputError(this.res, null, "Special character not allowed in name")
      }

      if (!/[a-z]/i.test(name)) {
         return helpers.outputError(this.res, null, "Name should contain alphebets")
      }

      if (!email) {
         return helpers.outputError(this.res, null, "Email is required")
      }

      if (!validator.default.isEmail(email)) {
         return helpers.outputError(this.res, null, "Invalid email")
      }

      if (!phone) {
         return helpers.outputError(this.res, null, "Phone is required")
      }

      if (!/^[0-9\+]/.test(phone)) {
         return helpers.outputError(this.res, null, "Invalid phone number. phone number should include country code and the contact cell number")
      }

      if (phone.length < 10) {
         return helpers.outputError(this.res, null, "phone number too short")
      }

      if (phone.length < 14) {
         return helpers.outputError(this.res, null, "phone number too long")
      }

      if (!password) {
         return helpers.outputError(this.res, null, "password is required")
      }

      if (password.length < 8 || !/[0-9]/.test(password) || !/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
         return helpers.outputError(this.res, null, "password must be minimun of 8 characters, having atleast one uppercase, one lowercase and one number")
      }


      //check the phone and the email
      let checkUser = await dbFunctions.query(`SElECT * FROM merchants WHERE email='${email}' OR phone='${phone}' LIMIT 1`)

      //if there's an error
      if (checkUser && checkUser.error) {
         return helpers.outputError(this.res, 500)
      }

      if (checkUser && checkUser.length > 0) {
         //if email 
         checkUser = checkUser[0]
         if (checkUser.phone === phone) {
            return helpers.outputError(this.res, null, "Phone number already in use")
         } else if (checkUser.email === email) {
            return helpers.outputError(this.res, null, "Email number already in use")
         } else {
            return helpers.outputError(this.res, null, "Phone number or email already in use")
         }
      }
      //hash the password
      let hashPass = bcrypt.hashSync(password, 10)
      //generate an api key
      let genAPIKey = helpers.generateToken(40)
      //save the data
      let saveUser = await dbFunctions.query(`INSERT INTO merchants (name, email, phone, password, api_key)
      VALUES('${name}', '${email}', '${phone}', '${hashPass}', '${genAPIKey}')`)

      // console.log(saveUser)
      //check error
      if (saveUser && saveUser.error) {
         return helpers.outputError(this.res, 500)
      }

      //check if not executed
      if (!saveUser.affectedRows) {
         return helpers.outputSuccess(this.res, null, helpers.errorText.failToProcess)
      }

      return helpers.outputSuccess(this.res, {
         name, email, phone, api_key: genAPIKey
      })
   }

   async login() {
      let email = helpers.getInputValueString(this.body, "email")
      let password = helpers.getInputValueString(this.body, "password")

      if (!email) {
         return helpers.outputError(this.res, null, "Email is required")
      }

      if (!validator.default.isEmail(email)) {
         return helpers.outputError(this.res, null, "Invalid email")
      }

      if (!password) {
         return helpers.outputError(this.res, null, "password is required")
      }

      if (password.length < 8 || !/[0-9]/.test(password) || !/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
         return helpers.outputError(this.res, null, "Email or password incorrect")
      }

      //check the phone and the email
      let checkUser = await dbFunctions.query(`SElECT name, phone, email, api_key, balance, password FROM merchants WHERE email='${email}' LIMIT 1`)

      //check error
      if (checkUser && checkUser.error) {
         return helpers.outputError(this.res, 500)
      }
      //check if the account does not exist
      if (!checkUser || checkUser.length === 0) {
         return helpers.outputError(this.res, null, "Account not found")
      }
      checkUser = checkUser[0]
      // console.log(checkUser)
      //decrypt the password
      if (!bcrypt.compareSync(password, checkUser.password)) {
         // return helpers.outputError(this.res, null, "Email or password incorrect")
      }
      //remove the password
      delete checkUser.password

      return helpers.outputSuccess(this.res, checkUser)
   }

   async users() {

      if (this.method !== "get") {
         return helpers.outputError(this.res, 405)
      }

      let page = helpers.getInputValueString(this.req.query, 'page')

      //check the phone and the email
      let checkUser = await dbFunctions.query(`SElECT *, NULL as password FROM merchants ORDER BY id DESC LIMIT 50`)

      //check if there's an
      if (checkUser && checkUser.error) {
         return helpers.outputError(this.res, 500)
      }
      helpers.outputSuccess(this.res, checkUser)
   }

   async stat() {
      if (this.method !== "get") {
         return helpers.outputError(this.res, 405)
      }
      let userID = helpers.getInputValueString(this.req.query, 'id')

      //if there's no ID
      if (!userID) {
         return helpers.outputError(this.res, null, "user_id is required")
      }
      //invalid user id
      if (isNaN(userID)) {
         return helpers.outputError(this.res, null, "Invalid user_id")
      }

      let query = `SELECT *, (SELECT COUNT(*) FROM transfer_transactions WHERE id=${userID}) AS tnx_total, (SELECT COUNT(*) FROM transfer_transactions WHERE failure_status=1 AND id=${userID}) AS tnx_failure, (SELECT COUNT(*) FROM transfer_transactions WHERE transfer_status=3 AND id=${userID}) AS tnx_success, NULL AS password FROM merchants WHERE id=${userID}`

      let getData = await dbFunctions.query(query).catch(e => ({ error: e }))

      //check the error
      if (getData && getData.error) {
         console.log("error while getting user stat", getData.error)
         return helpers.outputError(this.res, 500)
      }
      //remove from the array
      if (getData && getData.length > 0) {
         getData = getData[0]
      }

      return helpers.outputSuccess(this.res, getData)

   }

   async fees(id) {

      if (this.method === "get") {
         let name = helpers.getInputValueString(this.req.query, 'name')
         let country = helpers.getInputValueString(this.req.query, 'country')

         let query = "SELECT * FROM `fee_charges`"
         let partQuery = ' WHERE id IS NOT NULL'
         //if there's an id 
         if (id) {
            if (isNaN(id) || parseInt(id) < 1) {
               return helpers.outputError(this.res, null, "Invalid id")
            }
            partQuery += ` AND id=${id}`
         }

         if (name) {
            if (!name) {
               return helpers.outputError(this.res, null, "name is required")
            }
            if (!/^[a-z\-]+$/.test(name)) {
               return helpers.outputError(this.res, null, "invalid name. name must be alphabet with no space")
            }

            if (name.length < 2) {
               return helpers.outputError(this.res, null, "name too short")
            }
            if (name.length > 30) {
               return helpers.outputError(this.res, null, "name too long")
            }
            partQuery += ` AND name=${name}`
         }

         if (country) {
            //if the name is too long
            if (country < 2) {
               return helpers.outputError(this.res, null, "country name too short")
            }
            //if the name is too long
            if (country > 3) {
               return helpers.outputError(this.res, null, "country name too long")
            }
            partQuery += ` AND country=${country}`
         }

         query += partQuery

         //save the data
         let saveData = await dbFunctions.query(query)
         // console.log(saveData)
         //if there's an error
         if (saveData && saveData.error) {
            return helpers.outputError(this.res, 500)
         }
         return helpers.outputSuccess(this.res, saveData)
      }

      //check method
      else if (["post", "put"].indexOf(this.method) > -1) {
         //if post and there's id
         if (this.method === "post" && id) {
            return helpers.outputError(this.res, 404)
         } else if (this.method === "put" && !id) {
            return helpers.outputError(this.res, 404)
         }

         let name = helpers.getInputValueString(this.body, 'name')
         let country = helpers.getInputValueString(this.body, 'country')
         let chargeCurrency = helpers.getInputValueString(this.body, 'charge_currency')
         let chargeType = helpers.getInputValueString(this.body, 'charge_type')
         let chargeValue = helpers.getInputValueString(this.body, 'charge_value')

         if (!name) {
            return helpers.outputError(this.res, null, "name is required")
         }
         name = name.toLowerCase()
         if (!/^[a-z\-]+$/.test(name)) {
            return helpers.outputError(this.res, null, "invalid name. name must be alphabet with no space")
         }

         if (name.length < 2) {
            return helpers.outputError(this.res, null, "name too short")
         }
         if (name.length > 30) {
            return helpers.outputError(this.res, null, "name too long")
         }

         //valid
         if (!country) {
            return helpers.outputError(this.res, null, "country is required")
         }
         //if the name is too long
         if (country.length < 2) {
            return helpers.outputError(this.res, null, "country name too short")
         }
         //if the name is too long
         if (country.length > 3) {
            return helpers.outputError(this.res, null, "country name too long")
         }
         //if there's no amount
         if (!chargeCurrency) {
            return helpers.outputError(this.res, null, "charge currency is required")
         }
         //if there's no amount
         if (!chargeCurrency) {
            return helpers.outputError(this.res, null, "charge currency is required")
         }
         //if there's no valid currency
         if (!/^[A-Z]+$/i.test(chargeCurrency) || chargeCurrency.length !== 3) {
            return helpers.outputError(this.res, null, "invalid charge currency. must be in capital letter. e.g USD or NGN")
         }
         //check the type
         if (!chargeType) {
            return helpers.outputError(this.res, null, "charge type is required")
         }

         //if invalid charge
         if (["range", "percent", "fix"].indexOf(chargeType) === -1) {
            return helpers.outputError(this.res, null, "charge type is invalid. expecting percent, range or fix")
         }
         //if the type not submitted
         if (!chargeType) {
            return helpers.outputError(this.res, null, "charge type is invalid. expecting percent, range or fix")
         }
         //if the charge type is not range
         if (chargeType !== "range") {
            if (!chargeValue) {
               return helpers.outputError(this.res, null, "charge value is required")
            }
         }

         if (chargeType === "fix") {
            //check the value
            if (isNaN(chargeValue) || parseInt(chargeValue) < 0) {
               return helpers.outputError(this.res, null, "invalid charge value.")
            }
         } else if (chargeType === "percent") {
            //if the value is not valid
            if (!/^\d+\.?\d?\%$/.test(chargeValue)) {
               return helpers.outputError(this.res, null, "invalid charge value for percent. value must in like X%")
            }
            //check if the percent is more than 100
            if (parseInt(chargeValue.replace('%', '')) > 100) {
               return helpers.outputError(this.res, null, "percent can not be more than 100%")
            }
         } else {
            //if there's no charge value
            if (!chargeValue) {
               return helpers.outputError(this.res, null, "charge value is required")
            }
            let sCharge = chargeValue.replace(/\n/g, ",").split(",")
            // console.log(sCharge)
            //check the pattern for each of the fee
            for (let i of sCharge) {
               //if the format is invalid
               if (!/^\d+\=\d+\.?\d+?$/.test(i)) {
                  return helpers.outputError(this.res, null, "one of the range fee is invalid. value must be in amount=charge_value format")
               }
            }
            chargeValue = sCharge
            // return helpers.outputSuccess(this.res)
         }
         country = country.toUpperCase()
         chargeCurrency = chargeCurrency.toUpperCase()

         let saveData;
         if (id) {
            saveData = await dbFunctions.query(`UPDATE fee_charges SET name='${name}', country='${country}',charge_type='${chargeType}',
            charge_value='${chargeValue}', charge_currency='${chargeCurrency}' WHERE id=${id}`)
         } else {
            saveData = await dbFunctions.query(`INSERT INTO fee_charges (name,country,charge_type,charge_value,charge_currency) 
         VALUES('${name}', '${country}', '${chargeType}', '${chargeValue}', '${chargeCurrency}')`)
         }

         // console.log(saveData)
         //check for error
         if (saveData && saveData.error) {
            if (saveData.error.code === "ER_DUP_ENTRY") {
               return helpers.outputError(this.res, null, "fee name already exist for this country")
            }
            console.log("error whilw saving fee", saveData.error)
            return helpers.outputError(this.res, 500)
         }
         //if nothing executed
         if (!saveData || !saveData.affectedRows) {
            return helpers.outputError(this.res, null, helpers.errorText.failToProcess)
         }
         //add the id
         this.body.id = id ? id : saveData.insertId

         return helpers.outputSuccess(this.res, this.body)
      }

      else if (this.method === "delete") {

         //check the id
         if (!id) {
            return helpers.outputSuccess(this.res, null, "record id is required")
         }
         if (!/^\d+$/.test(id)) {
            return helpers.outputError(this.res, null, "Invalid record id")
         }
         //check and update if exist
         let deleteData = await dbFunctions.query(`DELETE FROM fee_charges WHERE id=${id}`)
         //check for error
         if (deleteData && deleteData.error) {
            console.log("error while deleting fee", deleteData.error)
            return helpers.outputError(this.res, 500)
         }
         //if the query fail to execute
         if (!deleteData || !deleteData.affectedRows) {
            return helpers.outputError(this.res, null, helpers.errorText.failToProcess)
         }
         return helpers.outputSuccess(this.res)

      }

      else {
         return helpers.outputError(this.res, 405)
      }

   }

   async transactions() {
      if (this.method !== "get") {
         return helpers.outputError(this.res, 405)
      }

      let page = helpers.getInputValueString(this.req.query, 'page')
      let country = helpers.getInputValueString(this.req.query, 'country')
      let status = helpers.getInputValueString(this.req.query, 'transfer_status')

      let query = `SELECT * FROM transfer_transactions WHERE id IS NOT NULL`;

      //country
      if (country) {
         query += ` AND country='${country}'`
      }
      //the name
      if (status) {
         //check the error
         if (["0", "1", "2", "3", "4"].indexOf(status) === -1) {
            return helpers.outputError(this.res, null, "transfer status is invalid. expecting 0,1,2,3")
         }
         //for statuses
         if (status === "4") {
            query += ` AND failure_status=${status}`
         } else {
            query += ` AND transfer_status=${status}`
         }
      }

      query += ` ORDER BY id DESC`
      let startIndex = 0
      //check the page
      if (page) {
         //if not a number
         if (!/^\d+$/.test(page)) {
            return helpers.outputError(this.res, null, "Page is invalid. expecting a number")
         }
         startIndex = page ? (page - 1) * 50 : 0
      }
      query += ` LIMIT ${startIndex}, 50`


      //save the transaction
      let getData = await dbFunctions.query(query).catch(e => ({ error: e }))
      // console.log(getData)
      //check error
      if (getData && getData.error) {
         return helpers.outputError(this.res, 500)
      }

      return helpers.outputSuccess(this.res, getData)
   }

   async nameEnquiry() {

      if (this.method !== "get") {
         return helpers.outputError(this.res, 405)
      }
      let query = `SELECT name_enquiries.*, merchants.name, merchants.email FROM name_enquiries 
      LEFT JOIN merchants ON merchants.id=name_enquiries.merchants_id LIMIT 50`

      //save the data
      let saveData = await dbFunctions.query(query).catch(e => ({ error: e }))
      // console.log(saveData)
      //if there's an error
      if (saveData && saveData.error) {
         return helpers.outputError(this.res, 500)
      }
      return helpers.outputSuccess(this.res, saveData)
   }
}


module.exports = users;