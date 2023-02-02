// gute nacht was here !

// import modules
const iplim = require("iplim")
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

// rate limiter
app.use(iplim({timeout: 1000 * 10 * 15, limit: 4, exclude: [], log: false}))
app.use(bodyParser.json())
app.set("trust proxy", true)

app.post('/routes/api', require('./routes/api.js'));
app.get('/', require('./routes/redirect.js'));
app.get('/routes/auth', require("./routes/auth.js"));
app.get('/routes/auth/refresh', require("./routes/refresh.js"));

app.listen(port, () => {console.log(`app listening at http://localhost:${port}`)})