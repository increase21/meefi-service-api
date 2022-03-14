const helpers = require("../../assets/helpers")
const pObj = {}


pObj.runAllTypes = async (req, res, body, userData, settingData) => {

   let amount = parseFloat(helpers.getInputValueString(body, 'amount'))

   console.log(settingData)

   //if there's no data config 
   if (!settingData || !settingData.fin_id) {
      return helpers.outputError(res, null, "Transfer fee is not available for this partner")
   }

   let feeCharge = 0
   let feeCurrency = ''
   //run the settings based on type
   if (settingData.charge_type === "fixed") {
      feeCharge = settingData.charge_value
      feeCurrency = settingData.currency
   } else if (settingData.charge_type === "percent") {
      p = parseFloat(settingData.charge_value)
      feeCharge = ((p / 100) * amount).toFixed(2)
      feeCurrency = settingData.currency
   } else {
      let ranData = settingData.data
      //sort the data
      ranData.sort((a, b) => b.amount - a.amount)
      //get the fee assocaited with the amount
      let getValue = ranData[ranData.findIndex(e => e.amount >= amount && amount <= e.amount)]

      //if the ammount is not found bcos the incoming value
      //is bigger than the settings, take the first bigger value
      if (!getValue || !getValue.charge_value) {
         getValue = ranData[0]
      }
      //do the calculation based on the fee settings
      if (getValue.charge_type === "percent") {
         p = parseFloat(getValue.charge_value)
         feeCharge = ((p / 100) * amount).toFixed(2)
         feeCurrency = getValue.currency
      } else {
         chargeFee = getValue.charge_value
         feeCurrency = getValue.currency
      }
   }

   return helpers.outputSuccess(res, { fee: feeCharge, currency: feeCurrency })
}


module.exports = pObj