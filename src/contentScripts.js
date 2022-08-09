//set in local storage product metadata scraped from webpage
chrome.storage.local.set({
    variables: {        //variables of item to be filtered
        gender: document.getElementsByClassName("product-intro__head-name")[0]?.innerText
            .toLowerCase()
            .includes("men") ? 
                "men" : "women",
        name: document.getElementsByClassName("product-intro__head-name")[0]?.innerText,
        price: document.getElementsByClassName("original")[0]?.innerText.slice(3),
        ...[...document.getElementsByClassName("product-intro__description-table")[0]?.children]
            //parses SHEIN's product description element
            .reduce((acc, curr) => ({
                ...acc,
                [curr.children[0].innerText.slice(0, -1).toLowerCase().replace(/\s/g, "_")]: curr.children[1].innerText.toLowerCase()}
            ), {})
    }
});

//gets storage metadata then sends to service worker
chrome.storage.local.get(
    ["variables"],       //if null argument, then gets all data in storage
    result => {
        chrome.runtime.sendMessage(result.variables);
    }
);