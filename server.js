// in production servers the database linkage is not directly exposed . rather given through env . 
// dotenv is used to parse your secrets . suppose you want to push your code to github . then without the 
// .env your key is also gets pushed t0 the github . use this to not to push key 
const dotenv = require("dotenv");
const { MONGO_CLIENT_EVENTS } = require("mongodb");
// there is a module called config that process.env will give your key otherwise it will give you undefined 
dotenv.config();
// check is MONGO_URI exists 
// process.env is a global object storing all of your global variables . so just extracting it 
if(!process.env.MONGO_URI) {
    throw new Error("there exists no MONGO_URI")
}
// checking if the JWT exists 
if(!process.env.JWT_SECRET){
    throw new Error("You dont have the JWT token !!");
}
// exporting the object for scalability 
module.exports= {
    MONGO_URI : process.env.MONGO_URI,
    JWT_SECRET : process.env.JWT_SECRET,  
}



// there are many demerits even of session token , localstorage , cookie 
// session token ==> its migth possible that the token of A user gets stollen by the user B so user B can 
// misuse your token and create fake transactions to another account using your account
// Cookie ==> here the problem is CSRF ==> cross side request forgery . this is also possible you with your browser taking the 
// cookie visits the attackers website . attacker can use forms having the action route to your bank in this way you think your 
// are filling someothers form but actually your cookei gets misused 
// to store the Key in the localstorage of the client the attacker can also write the js query to to get the token from your memory 
//So the solution is to use both the ways . called an access key and the refresh key . only access key would do some 
//kind of transaction like important things but access key would bhi stotred in the memeory so quickly gets removed 
//when page will get refresh so you will need the refresh key to get the give the access key . 
//refresh key would be stored in the cookies . so if the attacker tries to do any kind of CSRF server wouldnt allow that 




