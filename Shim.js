var Message = {};

(function() {

    Message.tab = {};
    var responders = {};

    function getResponderID () {
        var id = Math.floor(Math.random() * 1e6) + 1;
        while (id in responders) id++;
        return id;
    }

    Message.tab.addListener = function (listener) {
        safari.self.addEventListener('message', function (event) {
            var action = event.name;
            var data = event.message;
            var sendResponse = function () {
                Message.extension.sendMessage('__sendResponse', {
                    _rID: data._rID,
                    response: arguments
                });
            };
            listener.call(this, action, data, event.target, sendResponse);
        }, false);
    };

    Message.tab.sendMessage = function (target, action, data, responseCallback) {
        data = data || {};
        if (responseCallback) {
            var rID = getResponderID();
            data._rID = rID;
            responders[rID] = responseCallback;
        }

        var sender = target.page || target || safari.self.tab ||
            safari.application.activeBrowserWindow.activeTab.page;
        sender.dispatchMessage(action, data);
    };

    var mapOrigins = [
        'https://maps.google.com'
    ];

    function postMessageToGMaps(win, data) {
        mapOrigins.forEach(function (origin) {
            win.postMessage(data, origin);
        });
    }

    Message.extension = {};

    Message.extension.addListener = function (listener) {
        var target = safari.application || safari.self;
        target.addEventListener('message', function (event) {
            var action = event.name;
            var data = event.message;
            var sendResponse = function () {
                Message.extension.sendMessage('__sendResponse', {
                    _rID: data._rID,
                    response: arguments
                });
            };
            listener.call(this, action, data, event.target, sendResponse);
            if (data._allFrames) {
                var frames = document.getElementsByTagName('iframe');
                frames = Array.prototype.slice.call(frames);
                var windows = frames.map(function (frame) { return frame.contentWindow; });
                windows.forEach(function (win) {
                    postMessageToGMaps(win, {
                        name: action,
                        message: data
                    });
                });
            }
        }, false);
        window.addEventListener('message', function (event) {
            var data = event.data;
            console.log(data);
            listener.call(this, data.name, data.message, null, sendResponse);
        }, false);
    };

    Message.extension.sendMessage = function (action, data, responseCallback) {
        if (responseCallback) {
            var rID = getResponderID();
            data._rID = rID;
            responders[rID] = responseCallback;
        }

        var sender = safari.self.tab || safari.application.activeBrowserWindow.activeTab.page;
        sender.dispatchMessage(action, data);
    };

    function toArray(obj) {
        var arr = [];
        for (var i in obj) {
            arr[i] = obj[i];
        }
        return arr;
    }

    Message.extension.addListener(function (action, data, sender) {
        if (action === '__sendResponse') {
            var responder = data._rID && responders[data._rID];
            if (responder) responder.apply(this, toArray(data.response));
            delete responders[data._rID];
        }
    });

})();

var Extension = {};

(function () {

    Extension.getURL = function (path) {
        if (path.indexOf('/') === 0) path = path.substr(1);
        return safari.extension.baseURI + path;
    };

    Extension.forAllTabs = function (fn) {
        safari.application.browserWindows.forEach(function (window) {
            window.tabs.forEach(function (tab) {
                if (tab.page) fn(tab.page);
            });
        });
    };

}());
