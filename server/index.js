require('dotenv').config()

var express=require('express');
var cors = require('cors');
const plaid = require('plaid');
var bodyParser = require('body-parser');
var app=express();

var PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID
var PLAID_PUBLIC_KEY = process.env.PLAID_PUBLIC_KEY

//secrets for environment
var PLAID_SECRET_SANDBOX = process.env.PLAID_SECRET_SANDBOX;
var PLAID_SECRET_DEVELOPMENT = process.env.PLAID_SECRET_DEVELOPMENT

//environment
var sandbox = plaid.environments.sandbox;
var development = plaid.environments.development;



const plaidClient = new plaid.Client(PLAID_CLIENT_ID, PLAID_SECRET_DEVELOPMENT, PLAID_PUBLIC_KEY, development, {version: '2018-05-22'});

// We store the access_token in memory
// In production, store it in a secure persistent data store
var ACCESS_TOKEN = null;
var PUBLIC_TOKEN = null;
var ITEM_ID = null;

 app.use(cors())
 app.use(bodyParser.json());


app.post('/plaid_exchange',function(request,response, next) {
    PUBLIC_TOKEN = request.body.public_token;
    plaidClient.exchangePublicToken(PUBLIC_TOKEN, function(error, tokenResponse) {
        if (error != null) {
            var msg = 'Could not exchange public_token!';
            console.log(msg + '\n' + JSON.stringify(error));
            return response.json({
              error: msg
            });
        }
    ITEM_ID = tokenResponse.item_id;
        response.json({
            access_token: tokenResponse.access_token,
            item_id: ITEM_ID,
            error: false
        });
    });
});

// Get Account Balances
// https://plaid.com/docs/#balance
app.post('/balances', function(request, response, next) {
    ACCESS_TOKEN = request.body.access_token;
    plaidClient.getBalance(ACCESS_TOKEN, function(error, balanceResponse) {
      if (error != null) {
        return response.json({
          error: error
        });
      }
      response.json({error: null, balances: balanceResponse});
    });
  });

var server=app.listen(3001,function() {});
