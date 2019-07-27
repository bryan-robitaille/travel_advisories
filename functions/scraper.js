const request = require("request-promise");
const fs = require("fs");
const parse = require("cheerio");
const url = "https://travel.gc.ca/destinations-print/"

const htmlFile = parse.load(fs.readFileSync("./result.html"));

function getChildrenText(element, cheerioObject, h3Heading, h4Heading){
    var array = []

    if (cheerioObject(element).children().length > 0 && element.tagName !== "p"){
        cheerioObject(element).children().each((i, elem) => {
            var [result, tempH3, tempH4] = getChildrenText(elem, cheerioObject, h3Heading, h4Heading);
            if (result !== ""){
                array[i] = result;
            }
            h3Heading = tempH3;
            h4Heading = tempH4;          
        });
    }
    if( element.tagName === "h3") {
        h3Heading = cheerioObject(element).contents().text();
        h4Heading = null;
        return ["", h3Heading, h4Heading];
    }
    if( element.tagName === "h4") {
        h4Heading = cheerioObject(element).contents().text();
        return ["", h3Heading, h4Heading];
    }


    if(element.tagName === "summary"){
        return ["", h3Heading, h4Heading] ;
    }
    var result = array.length > 0 ? array : cheerioObject(element).text();
    return [result, h3Heading, h4Heading];
}

function isEmpty(obj) {
   
    var empty = true;

    if (typeof obj === "string" || obj instanceof String){
        return empty;
    }
    else{
        const keys = Object.keys(obj);
        keys.map((key) => {
            if (!Number.isInteger(Number(key))){
                empty = false && empty;
            }
        });
    }

    return empty;  

}

function flattenArray(array){
    const keys = Object.keys(array);
    keys.map((key) => {
        if (Number.isInteger(Number(key)) && Array.isArray(array[key])){
            array[key] = [].concat.apply([], array[key]);
            array[key] = array[key].filter(Boolean);
        }
    });

    return array;
}

function flattenStructure(object){
    for (var key in object){
        if(object.hasOwnProperty(key)){    

             
            if (!isEmpty(object[key])){
                flattenStructure(object[key]);
            } 
            
            if (Array.isArray(object[key])){
                if (object[key].length > 0){
                    object[key] = flattenArray(object[key]);
                } else {
                    delete object[key];
                }

            } 
            
            
        }
    }

    return object;

}

function getHeadings(html){
    var headingObject = {};
    
    // Set headings
    html("main > h2").each((i, elem) => {
        var h2Heading = html(elem).contents().text();
        var h3Heading = null;
        var h4Heading = null;

        html(elem).nextUntil("h2").each((i, elem)=>{

            let tempResult = [];
            [tempResult, h3Heading, h4Heading] = getChildrenText(elem, html, h3Heading, h4Heading);
            if (Array.isArray(tempResult)){
                tempResult = [].concat.apply([], tempResult);
            }
            if (tempResult === "" || tempResult === typeof "undefined"){
                return;
            }

            if (h2Heading) {
                if(!headingObject[h2Heading]){
                    headingObject[h2Heading] = {};
                    headingObject[h2Heading].intro = []
                }
                if (h3Heading) {
                    if(!headingObject[h2Heading][h3Heading]){
                        headingObject[h2Heading][h3Heading] = [];
                    }
                    if (h4Heading) {
                        if(!headingObject[h2Heading][h3Heading][h4Heading]){
                            headingObject[h2Heading][h3Heading][h4Heading] = [];
                        }
                        headingObject[h2Heading][h3Heading][h4Heading].push(tempResult);
                    } else {
                        headingObject[h2Heading][h3Heading].push(tempResult);
                    }
                } else {
                    headingObject[h2Heading].intro.push(tempResult);
                }
            } else {
                console.log("error - No H2 heading found");
            }

        });
    });
    
    return flattenStructure(headingObject);   
}

function getWebPage(country){
    var urlSafeCountry = country.replace(/\s+/g, '-').toLowerCase();
    travelUrl = url + urlSafeCountry;
    /*
    return request(travelUrl).then((html) => {
        return getHeadings(parse.load(html));
    });
    */
   return getHeadings(htmlFile);
}

module.exports = {
    getWebPage
}