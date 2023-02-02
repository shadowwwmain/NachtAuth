const axios = require("axios");
const { getNetworth } = require("skyhelper-networth");
const networthParser = require("./networthParser.js");
const config = require('../../../config.json');
const apiKey = config.apiKey;

async function networthCalc(uuid) {
    const apiUrl = "https://api.hypixel.net/skyblock/profiles";
    try {
        const response = await axios.get(apiUrl, {
          params: { key: apiKey, uuid },
          headers: { "Accept-Encoding": "gzip,deflate,compress" },
        });

        const data = response.data;
        if (!data.success || data.profiles == null || (data.success == false || null)) {
          return ["0", "No profile data found. 🙁"];
        }
        if (data.profiles == null) {
          return ["0", "No profile data found. 🙁"];
        }
        let richestProfile;
        for (let i = 0; i < data.profiles.length; i++) {
        
          let profile = data.profiles[i];
          let bank = profile.banking?.balance;
          let profileNetworth = await getNetworth(profile["members"][uuid], bank);
          if (richestProfile == null) {
            richestProfile = profileNetworth;
          } else if (richestProfile.unsoulboundNetworth < profileNetworth.unsoulboundNetworth) {
            richestProfile = profileNetworth;
            }
          } 
    const description = await networthParser(richestProfile);
    return [richestProfile["unsoulboundNetworth"], richestProfile["networth"], description];
  }catch(error){
    return ["0", "No profile data found. 🙁"];
  }
}

module.exports = networthCalc;