const helpers = require("../../assets/helpers")


const pObj = {}


pObj.nameEquiry = async (req, res, body, userData, settingData) => {
   let country = helpers.getInputValueString(body, 'country')

   //if the country code is more than 3 xters
   if (!helpers.isAlphabet(country) || country.length < 2 || country.length > 3) {
      return helpers.outputError(this.res, errorCode.missingField, "country is invalid")
   }

   //get the partners from the configuration setting
   let partners = await helpers.getConfigSettings(country, 'name_enq_config').catch(e => ({ error: e }))

   //check for error
   if (partners && partners.error) {
      console.log(partners.error)
      return helpers.outputSuccess(this.res, 503)
   }

   //if the response is not true
   if (partners.status !== true) {
      return helpers.outputError(this.res, null, partners.msg ? partners.msg : "Could not verify the fin_name")
   }

   //get all the partner names
   let prtnrNames = partners.config_settings.map(e => e.name)

   return helpers.outputSuccess(res, prtnrNames)
}

pObj.transfer = async (req, res, body, userData, settingData) => {
   let country = helpers.getInputValueString(body, 'country')

   //if the country code is more than 3 xters
   if (!helpers.isAlphabet(country) || country.length < 2 || country.length > 3) {
      return helpers.outputError(this.res, errorCode.missingField, "country is invalid")
   }

   //get the partners from the configuration setting
   let partners = await helpers.getConfigSettings(country, 'transfer_config').catch(e => ({ error: e }))

   //check for error
   if (partners && partners.error) {
      console.log(partners.error)
      return helpers.outputSuccess(this.res, 503)
   }

   //if the response is not true
   if (partners.status !== true) {
      return helpers.outputError(this.res, null, partners.msg ? partners.msg : "Could not verify the fin_name")
   }

   //get all the partner names
   let prtnrNames = partners.config_settings.map(e => e.name)

   return helpers.outputSuccess(res, prtnrNames)
}


module.exports = pObj