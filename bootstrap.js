/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

let NS_XUL = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
let PREF_DOMAIN = 'extensions.websocket-disabler.';
let PREF_ENABLED = 'enabled';

var prefs = Components.classes['@mozilla.org/preferences-service;1']
        .getService(Components.interfaces.nsIPrefService);

function install(data, reason) {}
function uninstall(data, reason) {}

// Add the menu item to the Web Developer menu entry
function startup(data, reason) {

    Components.utils.import('chrome://websocket-disabler/content/menu.jsm');
    Components.utils.import('chrome://websocket-disabler/content/watchwindows.jsm');

    // Set the default for the add-on
    prefs.getDefaultBranch(PREF_DOMAIN).setBoolPref(PREF_ENABLED, false);

    // Use a boolean to keep track of whether WebSockets are enabled or not and
    // declare a simple function to generate the menu label based on that
    var enabled = prefs.getBranch(PREF_DOMAIN).getBoolPref(PREF_ENABLED);
    function menuItemTitle() {
        return (enabled ? "Enable" : "Disable") + " WebSockets";
    }

    // Run a callback each time a new window is opened and for all windows that
    // exist when the add-on first starts
    watchWindows(function(window) {

        // Create the menu item, which will be added to the bottom of the
        // developer menu in each window
        var item = addItemToDesktopMenu(
            window,
            'menuWebDeveloperPopup',
            'menu_websocket_disabler',
            menuItemTitle(),
            function() {

                // Toggle the enabled state of WebSockets
                enabled = !enabled;

                // Update the menu item's label
                item.setAttribute('label', menuItemTitle());

                // Store the pref
                prefs.getBranch(PREF_DOMAIN).setBoolPref(PREF_ENABLED, enabled);
            }
        );

        // This is a nasty hack but it works - every time the location
        // of a browser object changes, remove the WebSocket property
        // from the browser's window object
        window.gBrowser.addTabsProgressListener({
            onLocationChange: function(browser) {
                if(enabled) {
                    browser.contentWindow.wrappedJSObject.WebSocket = undefined;
                }
            }
        });
    });
}

// Remove the entry from the Web Developer menu
function shutdown(data, reason) {

    Components.utils.import('chrome://websocket-disabler/content/unload.jsm');

    // Unless the application is shutting down, remove the items
    if(reason != APP_SHUTDOWN) {
        unload();
    }

    // Clear the defaults if not set
    var branch = prefs.getDefaultBranch(PREF_DOMAIN);
    if (!branch.prefHasUserValue(PREF_ENABLED)) {
        branch.deleteBranch(PREF_ENABLED);
    }
}
