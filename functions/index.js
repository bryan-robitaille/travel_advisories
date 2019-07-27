
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

function convertToSpeech(object){
    var tempText = "";
    for (var key in object){
        if(object.hasOwnProperty(key)){
            if(!Number.isInteger(Number(key))){
                if(key !== "intro"){
                    tempText = tempText + " \n " + key + " \n ";
                }                
                tempText = tempText + " " + convertToSpeech(object[key]);
            } else{
                tempText = tempText + " " + object[key];
            }
        }
    }
    return tempText;
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
    var index = 0
    for (var key in advisoryObject){
        if (advisoryObject.hasOwnProperty(key)){
            if (index < 1){         
                conv.ask(convertToSpeech(advisoryObject[key]));
                index++       

            }
        }
    }
    var h2Headings = Object.keys(advisoryObject);
    h2Headings.shift();
    conv.ask(`Would you like to know about: ${h2Headings}`);
    conv.ask(new Sugesstions(h2Headings))

});



// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
