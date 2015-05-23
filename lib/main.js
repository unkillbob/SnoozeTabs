/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
strict:true, undef:true, unused:true, curly:true, browser:true, white:true,
moz:true, esnext:false, indent:2, maxerr:50, devel:true, node:true, boss:true,
globalstrict:true, nomen:false, newcap:false */

"use strict";

var base64 = require('sdk/base64');
var chrome = require('chrome');
var {data, id, name} = require('sdk/self');
var {Panel} = require('sdk/panel');
var prefs = require('sdk/simple-prefs');
// var micropilot = require('./micropilot');
var notifications = require('sdk/notifications');
var {setTimeout, clearTimeout} = require('sdk/timers');
var snooze = require('./snooze');
var tabs = require('sdk/tabs');
var ui = require('sdk/ui');

const STUDY_ID = 'snoozetabs';
const UPLOAD_URL = 'https://snoozetabs.paas.allizom.org/data/' + STUDY_ID;


/**
 * The things I do to get an attached panel to show up.  Seriously.
 */
var showButtonPanel = function (button, panel) {
  var wm = chrome.Cc["@mozilla.org/appshell/window-mediator;1"]
                     .getService(chrome.Ci.nsIWindowMediator);
  var win = wm.getMostRecentWindow("navigator:browser");
  var buttonElem = win.document.getElementById("button--" + id.replace("@","-at-") + "-" + button.id);
  panel.show(null, buttonElem);
};


var wakeupId;
var nextWakeup = function (bookmark) {
  // Do something with the bookmark.
  if (bookmark) {
    var tabExists = false;
    for each (var tab in tabs) {
      if (tab.url === bookmark.url) {
        tabExists = true;
        break;
      }
    }
    if (!tabExists) {
      tabs.open({url: bookmark.url, inBackground: true});
    }

    notifications.notify({
      title: "SnoozeTabs",
      text: bookmark.title,
      iconURL: snooze.getThumbnail(bookmark) || data.url("PanelHeader@2x.png"),
      data: bookmark.url,
      onClick: function (data) {
        for each (var tab in tabs) {
          if (tab.url === data) {
            tab.activate();
            return;
          }
        }
        tabs.open({url: data});
      }
    });
    snooze.opened(bookmark);
  }

  // And snooze until it's time to wake up next.
  snooze.getNextWakeup().then(function (result) {
    wakeupId = setTimeout(nextWakeup, result.timeout, result.bookmark);
  });
}

var snoozePanel = Panel({
  width: 240,
  height: 350,
  contentURL: data.url('snoozePanel.html'),
  contentScriptFile: data.url('content-script.js'),
  onShow: function () {
    button.icon = colourIcon;
  },
  onHide: function () {
    button.icon = greyIcon;
  }
});

snoozePanel.port.on("chromeEvent", function (e) {

  if (e.kind === 'buttonClicked') {
    snooze.handleEvent(e.data).then(function (url) {
      if (tabs.activeTab.url === url) {
        tabs.activeTab.close()
      } else {
        for each (var tab in tabs) {
          if (tab.url === url) {
            tab.close();
            break;
          }
        }
      }
      snoozePanel.hide();

      // Reset the amount of time we should wait,
      // because the new value may be less than the old one.
      if (wakeupId) {
        clearTimeout(wakeupId);
      }
      nextWakeup();
    }, function (error) {
      console.log(error);
    });
  } else if (e.kind === 'manageClicked') {
    snooze.getSnoozedGroup().then(function (group) {
      var wm = chrome.Cc["@mozilla.org/appshell/window-mediator;1"]
                         .getService(chrome.Ci.nsIWindowMediator);
      var win = wm.getMostRecentWindow("navigator:browser");
      win.PlacesCommandHook.showPlacesOrganizer(group.id);
    });
  } else {
    console.log('Unknown message of', e.kind, e.data);
  }
});


/* Should have sizes of 18, 32, 36, and 64. */
var greyIcon = {
  '18': './Snooze18_Grey.png',
  '32': './Snooze32_Grey.png',
  '36': './Snooze36_Grey.png',
  '64': './Snooze64_Grey.png'
};
var colourIcon = {
  '18': './Snooze18.png',
  '32': './Snooze32.png',
  '36': './Snooze36.png',
  '64': './Snooze64.png'
};

var button = ui.ActionButton({
  id: 'snoozetabs-btn',
  label: 'Snooze',
  icon: greyIcon,
  onClick: function (button) {
    showButtonPanel(button, snoozePanel);
  }
});


exports.main = function () {
  nextWakeup();
};

exports.onUnload = function () {
  if (wakeupId) {
    clearTimeout(wakeupId);
  }
};