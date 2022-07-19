

//listens for url changes
chrome.tabs.onUpdated.addListener((tabId, {status}, tab) => {
    console.log(status)
    if (status === "complete") {
        //content scripting for page manipulation/acquisition
        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ["src/contentScripts.js"]
        });
        
        console.log(tab);
    }
});