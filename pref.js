/*global $ console */

var PrefManager = {};
var Pref = PrefManager;

function pref(label){
    return PrefManager.getOption(label);
}

(function(){

	var defaults = {
        'enabled': true,
        'invertScroll': false,
        'invertZoom': false,
        'enableForFrames': true,
        'isolateZoomScroll': true,
        'frameRequireFocus': true,
        'scrollSpeed': 50
	};

	function getDefault(label) {
        return defaults[label];
	}

	function getOptions() {
        return $.extend({}, defaults, safari.extension.settings);
	}

    PrefManager.getAllOptions = function() {
        return getOptions();
    };

	PrefManager.setOption = function(key, value) {
        safari.extension.settings[key] = value;
        $(window).trigger('preferenceChanged', [{key: key, value: value}]);
	};

	PrefManager.getOption = function(key) {
		var options = getOptions();
		if (!options) return getDefault(key);
		var output = options[key];
		if (output === undefined)
			return getDefault(key);
		return output;
	};

    PrefManager.onPreferenceChanged = function(key, func) {
        $(window).bind('preferenceChanged', function(event, pair) {
            if (pair.key === key)
                func(pair);
        });
    };

    // support for PrefReader which reads preferences from content scripts (which do not have access
    // to localStorage of the extension)

    $(window).bind('preferenceChanged', function(event, pair) {
        Extension.forAllTabs(function (tab) {
            Message.tab.sendMessage(tab, 'preferenceChanged', pair);
        });
    });

    Message.extension.addListener(function(action, data, sender, sendResponse) {
        switch(action) {
            case 'setPreference':
                PrefManager.setOption(data.key, data.value);
                break;
            case 'getAllPreferences':
                var allOptions = $.extend(defaults, PrefManager.getAllOptions());
                sendResponse(allOptions);
                break;
        }
    });

})();
