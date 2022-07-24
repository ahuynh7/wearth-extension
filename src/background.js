//unsustainable clothing retailer filter algorithm
//prone to bugs
const parseUrl = url => {
    url = new URL(url);
    url.pathname = url.pathname.slice(1);       //removes "/" from the beginning of pathname
    var condition = false;      //condition defines if alg finds a match

    //if url contains "shein" and if tab has landed on a catalog item
    if (url.hostname.includes("shein") && url.pathname.includes("cat")) {       //hardcode to shein
        condition = true;
    }

    return condition;
};

//listens for messages sent from contentScripts; debugging purposes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);
    sendResponse(true);
});

//listens for url changes
chrome.tabs.onUpdated.addListener((tabId, {status}, tab) => {
    if (status === "complete") {
        //algorithm to determine if url matches a non-sustainable clothing merchant
        //in this POC, we will hardcode the match to SHEIN
        if (parseUrl(tab.url)) {
            //content scripting for page manipulation/acquisition
            chrome.scripting.executeScript({
                target: {tabId},
                files: ["src/contentScripts.js"]
            });
        }
    }
});

chrome.tabs.onActivated.addListener(activeInfo => {
    console.log(activeInfo)
});