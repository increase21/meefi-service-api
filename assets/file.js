const file = {}

let cred = {
   local: {
      user: "root",
      password: "",
      host: "localhost",
      database: "ussd_app",
      encoding: 'utf8'
   },
   live: {
      user: "rumeek1",
      password: "M24@Bn#ADb",
      host: "https://host.meekfi.com/pa",
      database: "meeki_ussd_app",
      encoding: 'utf8'
   }
}

file.config = {}
//the environment working on
file.config.env = "live"

// the database url to connect
file.config.db = file.config.env === "live" ? cred.live : cred.local

module.exports = file