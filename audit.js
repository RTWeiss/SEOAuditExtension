chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg === 'request-audit-data') {
        sendResponse(performSeoAudit());
    }
});

chrome.runtime.sendMessage('audit-ready');
chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name === "seo-audit-results");
    port.onMessage.addListener(function(msg) {
        if(msg === 'request-audit-data') {
            port.postMessage(performSeoAudit());
        }
    });
});
