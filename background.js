chrome.runtime.onConnect.addListener((port) => {
    console.assert(port.name === "popup-background");

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            files: ['audit.js']
        });
    });

    chrome.runtime.onMessage.addListener((msg, sender) => {
        if (msg === 'audit-ready' && sender.tab) {
            port.postMessage('audit-ready');
        } else if (msg === 'request-audit-data') {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                chrome.scripting.sendMessage(tabs[0].id, 'request-audit-data');
            });
        } else {
            port.postMessage(msg);
        }
    });        
});
