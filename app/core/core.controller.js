(function () {
    "use strict";

    angular
        .module('app.core')
        .controller('coreController', coreController);

    coreController.$inject = ['$scope', '$interval', '$location'];

    /* @ngInject */
    function coreController($scope, $interval, $location) {
        var vm = this;

        vm.data = {
            idSideTabsWindow: 0,
            idLastChromeWindow: 0,
            search: '',

            isNewTabFromSideTabs: false,

            windows: [],
            numberOfTabs: 0,
        };
        vm.optionsSettings = {
            openSide: 'left',
            backgroundColor: '',
            autoAdjustWidth: true,
            domainsList: []
        };
        vm.settings = {
            tabWidth: 250,
            showSettings: false,
            showTabsForSelectedWindow: false,
            showTabsGroupedPerWindow: false,
            showPinnedTabs: false,
            showSearch: false
        };
        vm.mainChromeWindow = {
            id: 0,
            left: 0,
            top: 0,
            width: 0,
            height: 0
        };

        vm.init = init;
        vm.initSideTabs = initSideTabs;
        vm.initChromeEvents = initChromeEvents;

        vm.initPreferences = initPreferences;
        vm.savePreferences = savePreferences;

        vm.clickCreateNewTab = clickCreateNewTab;
        vm.clickTab = clickTab;
        vm.clickCloseTab = clickCloseTab;
        vm.search = search;


        vm.clickMenuTab = clickMenuTab;
        vm.clickShowSettings = clickShowSettings;
        vm.clickShowSearch = clickShowSearch;
        vm.clickShowTabsForSelectedWindow = clickShowTabsForSelectedWindow;
        vm.clickShowTabsGroupedPerWindow = clickShowTabsGroupedPerWindow;
        vm.clickShowPinnedTabs = clickShowPinnedTabs;
        vm.clickMoreSettings = clickMoreSettings;

        vm.moveToSingleWindow = moveToSingleWindow
        vm.reorderTabs = reorderTabs
        vm.closeDuplicates = closeDuplicates

        vm.loadTabs = loadTabs;

        vm.isScrolledIntoView = isScrolledIntoView;
        vm.scrollTabIntoView = scrollTabIntoView;

        vm.checkChromeWindowPosition = checkChromeWindowPosition;
        vm.checkChromeWindowState = checkChromeWindowState;

        vm.onExit = onExit;

        // Chrome events

        vm.windowChanged = windowChanged;

        ////////////////

        function init() {

            vm.initPreferences();

        }

        function initSideTabs() {

            vm.mainChromeWindow.id = parseInt($location.search().idChromeWindow);
            vm.data.screenWidth = parseInt($location.search().screenWidth);
            vm.data.idLastChromeWindow = vm.mainChromeWindow.id;

            chrome.windows.getCurrent(function (wnd) {
                vm.data.idSideTabsWindow = wnd.id;
            });

            // INIT MAIN CHROME WINDOW
            chrome.windows.get(vm.mainChromeWindow.id, function (wnd) {
                chrome.windows.update(vm.mainChromeWindow.id,
                    {
                        'left': vm.optionsSettings.openSide === 'left' ? vm.settings.tabWidth : 0,
                        'width': vm.data.screenWidth - vm.settings.tabWidth
                    }
                );
            });

            // Auto adjust width
            if (vm.optionsSettings.autoAdjustWidth) {
            //    $interval(vm.checkChromeWindowPosition, 1000);
            }

            // Auto minimize/restore
            if (vm.optionsSettings.autoMinimize) {
            //    $interval(vm.checkChromeWindowState, 1000);
            }

            vm.loadTabs();

            // Revert Main Chrome Window to initial width when closing Side Tabs
            window.onbeforeunload = vm.onExit;

            vm.initChromeEvents();

        }

        function initChromeEvents() {

            chrome.windows.onFocusChanged.addListener(function (windowId) {
                vm.windowChanged(windowId)
            });
            chrome.windows.onCreated.addListener(function (tab) {
                vm.windowChanged();
            });
            chrome.windows.onRemoved.addListener(function (windowId) {
                vm.windowChanged();
            });
            chrome.tabs.onCreated.addListener(function (param) {
                vm.loadTabs();
            });
            chrome.tabs.onActivated.addListener(function (activeInfo) {
                vm.loadTabs();
            });
            chrome.tabs.onHighlighted.addListener(function (highlightInfo) {
                vm.loadTabs(function () {
                    if (highlightInfo.tabIds.length == 1) {
                        scrollTabIntoView({id: highlightInfo.tabIds[0]});
                    }
                });
            });
            chrome.tabs.onAttached.addListener(function (tabId, attachInfo) {
                vm.loadTabs();
            });
            chrome.tabs.onDetached.addListener(function (tabId, detachInfo) {
                vm.loadTabs();
            });
            chrome.tabs.onMoved.addListener(function (tabId, moveInfo) {
                vm.loadTabs();
            });
            chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
                vm.loadTabs();
            });
            chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
                vm.loadTabs();
            });

        }


        function initPreferences() {
            chrome.storage.sync.get(['tab', 'optionsSettings', 'sideTabsSettings'], function (items) {

                if (!items.tab) {
                    items.tab = {
                        height: 25,
                        width: 250,
                        fontSize: 11,
                        textColor: '#000000',

                        backgroundColor: {
                            top: '#DBD7D9',
                            bottom: '#C4C3C5'
                        },

                        hoverColor: {
                            top: '#F5F5F5',
                            bottom: '#E6E6E6'
                        },

                        highlightColor: '#F5F5F5',
                        borderColor: '#A9A9A9'
                    }
                } else {
                    items.tab = JSON.parse(items.tab);
                }

                if (!items.optionsSettings) {
                    items.optionsSettings = {
                        openSide: 'left',
                        backgroundColor: '#D4D4D4',
                        singleInstance: true,
                        autoAdjustWidth: true,
                        autoMinimize: true,
                        domainsList: []
                    }
                } else {
                    items.optionsSettings = JSON.parse(items.optionsSettings);
                }

                vm.optionsSettings = items.optionsSettings;

                if (!items.sideTabsSettings) {
                    items.sideTabsSettings = {
                        tabWidth: 250,
                        showTabsForSelectedWindow: false,
                        showTabsGroupedPerWindow: false,
                        showPinnedTabs: false
                    }
                } else {
                    items.sideTabsSettings = JSON.parse(items.sideTabsSettings);
                }

                vm.settings = items.sideTabsSettings;

                var style = angular.element('<style>')
                    .prop('type', 'text/css')
                    .html('\
                        body {\
                            font-size: ' + items.tab.fontSize + 'px;\
                            background-color: ' + items.optionsSettings.backgroundColor + ';\
                         }\
                        .tab {\
                            color: ' + items.tab.textColor + ';\
                            border-color: ' + items.tab.borderColor + '; \
                            background: linear-gradient(' + items.tab.backgroundColor.top + ', ' + items.tab.backgroundColor.bottom + ');\
                            height: ' + items.tab.height + 'px;\
                        }\
                        .tab.highlighted {\
                            background: ' + items.tab.highlightColor + '\
                        }\
                        .tab:hover {\
                            background: linear-gradient(' + items.tab.hoverColor.top + ', ' + items.tab.hoverColor.bottom + ');\
                        }\
                        .separator {\
                            background: + ' + items.tab.borderColor + ';\
                        }\
                        .window-separator {\
                            color: ' + items.tab.borderColor + ' \
                        }\
                    ');

                angular.element(document.querySelector('head')).append(style);


                vm.initSideTabs();

            })
        }

        function savePreferences() {
            chrome.storage.sync.set({
                sideTabsSettings: JSON.stringify(vm.settings)
            })

        }

        function clickCreateNewTab() {

            vm.isNewTabFromSideTabs = true;

            var windowId = vm.data.idLastChromeWindow ? vm.data.idLastChromeWindow : chrome.windows.WINDOW_ID_CURRENT;

            chrome.tabs.create({
                'windowId': windowId
            })

        }

        function clickTab(tab) {

            try {

                chrome.windows.get(tab.windowId, function (wnd) {

                    if (wnd.state == 'minimized' || vm.data.idLastChromeWindow != tab.windowId) {
                        chrome.windows.update(tab.windowId, {'focused': true}, function () {
                            chrome.tabs.update(tab.id, {'active': true}, function () {
                                chrome.windows.update(vm.data.idSideTabsWindow, {'focused': true}, function () {
                                    vm.loadTabs(function () {
                                        scrollTabIntoView(tab);
                                    });
                                });
                            });
                        })
                    }
                    else {
                        chrome.tabs.update(tab.id, {'active': true}, function () {
                            chrome.windows.update(vm.data.idSideTabsWindow, {'focused': true}, function () {
                                vm.loadTabs(function () {
                                    scrollTabIntoView(tab);
                                });
                            });
                        });
                    }
                })

            }
            catch (ex) {
                console.log(ex);
            }

        }

        function search(tab) {
            return vm.data.search.length > 0 && (
                tab.url.toLowerCase().indexOf(vm.data.search.toLowerCase()) !== -1 ||
                tab.title.toLowerCase().indexOf(vm.data.search.toLowerCase()) !== -1
            );
        }

        function clickCloseTab(tab) {
            closeTab(tab).then(vm.loadTabs);
        }
        function moveToSingleWindow() {
            orderTabs([]);
        }
        
    /*     [
       jira\.ds\.amcn\.com,
       (local\.amc\.com)|(local-amc-cms-br\.svc\.ds\.amcn\.com),
       (dev2?\.amc\.com)|(dev-amc-cms-br\.svc\.ds\.amcn\.com),
       (stage\.amc\.com)|(stage-amc-cms-br\.svc\.ds\.amcn\.com),
       confluence\.ds\.amcn\.com,
       (amcn\.com)|(amcnetworks\.com)|(amcnets\.com),
       stackoverflow\.com,
       php\.net,
       (tve\.helpdocsonline\.com)|(mpx\.theplatform\.com)
    ] */
        function reorderTabs() {
            var domainsList = vm.optionsSettings.domainsList || [];
            orderTabs(domainsList.map(el => new RegExp(el, "i")));
        }

        function closeDuplicates () {
            return getAllTabs().then(function (tabs) {
                let uniqueTabsUrls = [],
                duplicates=[];
                tabs.forEach(function (tab) {
                    const url = tab.url
                    if (uniqueTabsUrls.filter((tab_url) => tab_url == url).length) {
                        duplicates.push(tab)
                    } else{
                        uniqueTabsUrls.push(url);
                    };
                });
                Promise.race(duplicates.map(closeTab)).then(vm.loadTabs);
            });
        }

        function closeTab(tab) {
            return new Promise((resolve, reject) => {
                try {
                    chrome.tabs.remove(tab.id, resolve);
                } catch (er) {
                    reject(er);
                } 
            });
        }

        function clickMenuTab(clickedTab) {

        }
        function orderTabs(rules) {
            if (redrawIsLocked) {
                return;
            }
            redrawIsLocked = true;
            return getAllTabs()
                .then(function (tabs) {
                    var tabs = sortByDomain(tabs),
                        newWindows = [];
                    rules.push(/(\d|\D)*/);
                    rules.forEach(function(pattern, index) {
                        const newTabs = [];
                        const foundTabs = [];
                        
                        // search for tabs which fits the rule:
                        tabs.forEach(function (tab) {
                            if (pattern.test(tab.url)) {
                                foundTabs.push(tab.id);
                            } else {
                                newTabs.push(tab);
                            }
                        });
                        tabs = newTabs;
                        if (foundTabs.length) {
                            newWindows.push(createWndForTabs(foundTabs));
                        }
                    });
                    return Promise.all(newWindows);
                })
                .then((args) => {
                    redrawIsLocked = false;
                    setTimeout(loadTabs, 1000);
                });
        }

        function createWndForTabs(foundTabs) {
            return createWindow({
                tabId: foundTabs.shift()
            })
                .then(updateWindow)
                .then(function(wnd) { 
                    if (foundTabs.length) {
                        return moveTabsToWindow(foundTabs, wnd)
                    }
                }
            );
        }
        
        function getAllTabs() {
            return new Promise(function (resolve) {
                chrome.windows.getAll({"populate": true}, function (windows) {
                    var filteredWindows = [];
                    windows.filter(function (wnd) {
                        return wnd.type == "normal";
                    }).forEach(function (wnd) {
                        filteredWindows = filteredWindows.concat(wnd.tabs);
                    });
                    resolve(filteredWindows);
                });
            });
        }

        function moveTabsToWindow(tabs, win) {
            return  (win
                ? Promise.resolve(win) 
                : createWindow()
            ).then(function (wnd) {
                return new Promise(function (resolve) {
                    chrome.tabs.move(tabs, {windowId: wnd.id, index: -1}, function() {
                        console.log("moved");
                        resolve(wnd);
                    })
                }); 
            });
        }

        function createWindow(options) {
            return new Promise(function (resolve) {
                chrome.windows.create(Object.assign({type: chrome.windows.CreateType.NORMAL}, options || {}), resolve);
            });
        }

        function updateWindow(win) {
            return new Promise ((resolve, reject) => {
                chrome.windows.update(win.id, {
                    //   state: 'maximized'
                    width: 1920 - 400,
                    height: 1800,
                    left: 400,
                    top: 0
                }, resolve);
            });
        }

        function extractHostname(url) {
            var link = document.createElement('a');
            link.href = url;
            return link.hostname;
        }
        function extractRootDomain(domain) {
            var splitArr = domain.split('.'),
                arrLen = splitArr.length;

            //extracting the root domain here
            if (arrLen > 2) {
                domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
            }
            return domain;
        }

        function sortByDomain(tabs) {
            return tabs.sort(function (tab1, tab2) {
                var url1 = tab1.url || "",
                    url2 = tab2.url || "",
                    host1 = extractHostname(url1),
                    host2 = extractHostname(url2),
                    domain1 = extractRootDomain(host1),
                    domain2 = extractRootDomain(host2);

                if (host1 === host2) {
                    return url1 > url2 ? 1: -1;
                }else if (domain1 === domain2) {
                    return host1 > host2 ? 1: -1;
                } else {
                    return domain1 > domain2 ? 1: -1;
                }
            });
        }

        function clickShowSettings() {
            vm.settings.showSettings = !vm.settings.showSettings;
            vm.savePreferences();
        }

        function clickShowSearch() {
            vm.settings.showSearch = !vm.settings.showSearch;
            vm.savePreferences();

            if (!vm.settings.showSearch) {
                vm.data.search = '';
                return;
            }

            setTimeout(function () {
                document.getElementById('search').focus();
            }, 50);
        }

        function clickShowTabsForSelectedWindow() {
            vm.settings.showTabsForSelectedWindow = !vm.settings.showTabsForSelectedWindow;
            vm.savePreferences();
            vm.loadTabs();
        }

        function clickShowTabsGroupedPerWindow() {
            vm.settings.showTabsGroupedPerWindow = !vm.settings.showTabsGroupedPerWindow;
            vm.savePreferences();
        }

        function clickShowPinnedTabs() {
            vm.settings.showPinnedTabs = !vm.settings.showPinnedTabs;
            vm.savePreferences();
        }

        function clickMoreSettings() {
            chrome.runtime.openOptionsPage();
        }

        var redrawIsLocked=false;
        
        function loadTabs(callback) {
            !redrawIsLocked &&_loadTabs(callback);
        }

        function _loadTabs(callback) {
        
            chrome.windows.getAll({"populate": true}, function (windows) {

                // Reset number of tabs to 0;
                vm.data.numberOfTabs = 0;

                var filteredWindows = [];

                for (var i = 0; i < windows.length; i++) {
                    if (windows[i].type == "normal") {

                        if (vm.settings.showTabsForSelectedWindow) {
                            if (windows[i].id === vm.data.idLastChromeWindow) {
                                filteredWindows.push(windows[i]);
                            }
                        } else {
                            filteredWindows.push(windows[i]);
                        }

                        for (var j = 0; j < windows[i].tabs.length; j++) {
                            vm.data.numberOfTabs++;
                        }
                    }

                    /*
                     if (windows[i].id == vm.data.idLastChromeWindow) {
                     for (var j = 0; j < windows[i].tabs.length; j++) {
                     if (windows[i].tabs[j].highlighted) {
                     scrollTabIntoView(windows[i].tabs[j]);
                     }
                     }
                     }
                     */
                }

                vm.data.windows = filteredWindows;

                if (!$scope.$$phase) {
                    $scope.$digest();
                }


                /*
                for (var i = 0; i < vm.data.windows.length; i++) {
                    if (vm.data.windows[i].id == vm.data.idLastChromeWindow) {
                        for (var j = 0; j < vm.data.windows[i].tabs.length; j++) {
                            if (vm.data.windows[i].tabs[j].highlighted) {
                            }
                        }
                    }
                }
                */

                if (callback) {
                    callback();
                }

            });

        }

        function isScrolledIntoView(tab) {

            if (!tab) return;

            var tabsWrapper = document.querySelector('.tabs-wrapper');

            return ((tab.offsetTop + tab.offsetHeight <= (tabsWrapper.offsetHeight + tabsWrapper.scrollTop) * 0.9) &&
            (tab.offsetTop >= (tabsWrapper.scrollTop + tabsWrapper.offsetTop) * 1.1));

        }

        function scrollTabIntoView(selectedTab) {

            var tabs = document.querySelectorAll('.tab');

            for (var i = 0; i < tabs.length; i++) {
                var tab = angular.element(tabs[i]).scope().tab;
                if (!tab) continue;

                if (tab.id == selectedTab.id) {
                    var tabDiv = tabs[i];
                    break;
                }
            }

            if (vm.isScrolledIntoView(tabDiv) == false) {

                var tabsWrapper = document.querySelector('.tabs-wrapper');
                tabsWrapper.scrollTop = tabDiv.offsetTop - tabsWrapper.offsetHeight / 2;

            }
        }

        function checkChromeWindowPosition() {

            chrome.windows.get(vm.mainChromeWindow.id, function (wnd) {

                if (vm.mainChromeWindow.left != wnd.left ||
                    vm.mainChromeWindow.width != wnd.width) {

                    vm.mainChromeWindow.left = wnd.left;
                    vm.mainChromeWindow.width = wnd.width;

                    if (vm.optionsSettings.openSide === 'left') {

                        vm.settings.tabWidth = wnd.left;

                        chrome.windows.update(vm.data.idSideTabsWindow, {
                            width: vm.settings.tabWidth,
                            left: 0,
                            top: 0
                        });

                    } else {

                        vm.settings.tabWidth = screen.width - wnd.width;

                        chrome.windows.update(vm.data.idSideTabsWindow, {
                            left: wnd.width,
                            top: 0,
                            width: vm.settings.tabWidth
                        });

                    }

                    if (vm.settings.tabWidth > 30 && vm.settings.tabWidth < wnd.width - 30) {
                        savePreferences();
                    }

                }

            });

        }

        function checkChromeWindowState() {
            chrome.windows.get(vm.mainChromeWindow.id, function (wnd) {

                if (vm.mainChromeWindow.state != wnd.state) {

                    vm.mainChromeWindow.state = wnd.state;

                    if (wnd.state == 'minimized') {
                        chrome.windows.update(vm.data.idSideTabsWindow, {
                            state: 'minimized'
                        });
                    } else {
                        chrome.windows.update(vm.data.idSideTabsWindow, {
                            state: 'normal'
                        });
                    }
                }
            });
        }

        function windowChanged(windowId) {

            if (windowId != vm.data.idSideTabsWindow && windowId >= 0) {
                vm.data.idLastChromeWindow = windowId;
                vm.loadTabs();
            }

        }

        function onExit() {

            chrome.windows.update(vm.mainChromeWindow.id, {
                width: screen.width,
                left: 0
            });

        }

        vm.init();

    }

})();