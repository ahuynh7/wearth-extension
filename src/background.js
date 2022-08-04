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

    const results = [];

    //distributing scrapped metadata each hard-picked sustainable website, then filters for top 5 results
    const toEverlane = async () => {

    };

    const toPact = async () => {
        var myHeaders = new Headers();
        var raw = `blockId=product-grid-1593717194951&gender=${message.gender}&category=&style=&styleCode=&processHeading=false&productColumnSize=col-6+col-md-4&container=%23product-grid-1593717194951+.row.product-list&explodeCards=false&displayExplodedSwatch=false&action=get&pagePath=%2Fmen&options%5BexplodedSwatch%5D=false`;

        myHeaders.append("Accept", "application/json, text/javascript, */*; q=0.01");
        myHeaders.append("Accept-Language", "en-US,en;q=0.9");
        myHeaders.append("Connection", "keep-alive");
        myHeaders.append("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        myHeaders.append("Origin", "https://wearpact.com");
        myHeaders.append("Sec-Fetch-Dest", "empty");
        myHeaders.append("Sec-Fetch-Mode", "cors");
        myHeaders.append("Sec-Fetch-Site", "same-origin");
        myHeaders.append("X-Requested-With", "XMLHttpRequest");

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw, 
            redirect: 'follow'
        };
        var result = await fetch("https://wearpact.com/controller/product", requestOptions)
            .then(response => response.json())
            .then(result => result.data)
            .catch(error => console.log('error', error));

        //begin filtering alg.
        var category;
        message.color = message.color.split(" ").pop();

        if (!message.type) category = "tops & shirts";
        else if (message.type === "pullovers") category = "hoodies & sweatshirts";
        else if (message.waist_line) category = "pants & shorts";
        else category = "boxers & briefs";
        
        result = Object.values(result)
            .filter(e => e.category === category)      //narrows to specific clothing category
            .map(e => e.packs[Object.keys(e.packs)[0]].default);
        //TODO: fix bug where object names are overwriting each other
        result = Object.values(Object.assign({}, ...result))      //narrows to each article in a catalog
            .filter(e => e.primaryColor.map(e => e.color).includes(message.color));        //narrows to color
            
        //console.log(result);

        return result.splice(0, 5);
    };

    const toPatagonia = async () => {

    };

    toEverlane();
    toPact();
    toPatagonia();

    /* stardardized result to be stored
    {
        brand: ,
        name: ,
        link: ,
        image: ,
        price: 
    }
    */
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
    //console.log(activeInfo)
});