
'use strict';

// Use Sugesstions to possibly promt for h3 / h4 headings
const { dialogflow, Sugesstions } = require('actions-on-google');
const { getWebPage } = require("./scraper");
// Import the firebase-functions package for deployment.
const functions = require('firebase-functions');

// Instantiate the Dialogflow client.
const app = dialogflow({debug: true});

function randomPick(array){
    return array[Math.floor(Math.random()*array.length)];
}

function convertToSpeech(oject){
    var text = ""
    for (var key in oject){
        if(object.hasOwnProperty(key) && Number.isInteger(Number(key)) ){
            text = text + oject[key];
        }
    }
}


// Handle the Dialogflow intent named 'Default Welcome Intent'.
app.intent('Default Welcome Intent', (conv) => {
  // Questions for welcome intent
  var questions = [
      "Welcome! What country would you like travel advisories about?",
      "Hello!  What country would you like information about?",
      "Hi!  Where are you thinking of travelling to?",
  ];
  conv.ask(randomPick(questions));
});


// Handle the Dialogflow intent named 'country'.
// The intent collects a parameter named 'geo-country'.
app.intent('country', (conv, parameters) => {

    const advisoryObject = getWebPage(parameters["geo-country"]);

    for (var key in advisoryObject){
        var index = 0
        if (advisoryObject.hasOwnProperty(key)){
            if (index < 1){
                conv.ask(JSON.stringify(advisoryObject[key]));
            }
            else{
                var h2Headings = Object.keys(advisoryObject);
                h2Headings.shift();
                conv.ask(`Would you like to know about: ${h2Headings}`);
            }
        }
    }
});



// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
