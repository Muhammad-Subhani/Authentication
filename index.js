// all the require stuff 
const express = require("express")
const app = express()
const morgan = require("morgan"); // provides extra information about the request  
const { log } = require("node:console");
const port = 3000;
const { MONGO_URI: link } = require("./server.js");
const { connect_to_DB } = require("./connections/connection.js");
const console = require("node:console");
const cookieparser = require("cookie-parser")
const router = require("./routers/route1.js");
const log_router = require("./routers/logs.js")
// for middlewares
app.use(cookieparser());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
//linking the database
connect_to_DB(link)
  .then(() => { console.log("database got connected !") })
  .catch((err) => { console.log(`not connected ${err}`) })

// putting the links of api 
app.use("/api/auth", router);
//logout 
app.use("/auth", log_router);

// starting the app 
app.listen(port, () => {
  console.log(`the server  is started at ${port}`)
});
