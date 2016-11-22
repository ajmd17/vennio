var viewspace = {
    // pages are held in a linked list: each page contains a property 'parentPage'
    currentPage: null,

    isSidebarVisible: false,

    isPanning: false,
    PAN_THETA: 0.5,

    showRipple: false,
    rippleSize: 100,

    dragTime: 0,
    mouseHoldId: 0,

    // on click, a timeout is set.
    // if clicked again, it is cleared.
    // else, the user is taken to the clicked project's page.
    itemClickTimeoutId: 0,
    itemClickTimeoutEnabled: false,
    projectClickTimeout: 300,
    mousePosition: { x: 0, y: 0 },

    ZOOM_MIN: 1.0,
    ZOOM_MAX: 10.0,
    ZOOM_STEP: 0.1,

    focusState: {
        isFocusedOnObject: false,
        focusedObject: null,
        callbacks: {
        }
    },

    init: function() {
        // create root projects page
        this.currentPage = new Page("Home", $("<div class=\"page\">")
            .append("<div class=\"video-wrapper\">"),
            loggedUser.theme, null, loggedUser.viewport);

        this.currentPage.loadProjectsFromDatabase();
        this.currentPage.parentPage = null;
        this.currentPage.bindEvents();
        this.currentPage.show();
    },

    clearObjectFocus: function() {
        this.focusState = {
            isFocusedOnObject: false,
            focusedObject: null,
            callbacks: {
            }
        }
    },

    objectLoseFocus: function() {
        if (this.focusState.isFocusedOnObject && this.focusState.focusedObject != null) {
            handleObjectLoseFocus(this.focusState.focusedObject, this.focusState.callbacks);
        }
        this.clearObjectFocus();
    },

    hasFocusedObject: function() {
        return this.focusState.isFocusedOnObject &&
            this.focusState.focusedObject != null;
    },

    setFocusedObject: function(element, callbacks) {
        this.focusState.isFocusedOnObject = true;
        this.focusState.focusedObject = element;
        this.focusState.callbacks = callbacks;
    },

    toggleSidebar: function() {
        this.isSidebarVisible = !this.isSidebarVisible;

        var sidebarWidth = "0px";
        if (this.isSidebarVisible) {
            sidebarWidth = "300px";
            $mainSidebar.show(); 
        } else {
            // hide after the transition
            window.setTimeout(function() { $mainSidebar.hide(); }, 100);
        }

        $mainSidebar.css("width", sidebarWidth);
        $pageContent.css("margin-left", sidebarWidth);
    },
};