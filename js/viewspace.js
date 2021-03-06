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

    ZOOM_MIN: 0.5,
    ZOOM_MAX: 10.0,
    ZOOM_STEP: 0.05,

    focusState: {
        isFocusedOnObject: false,
        focusedObject: null,
        callbacks: {
        }
    },

    draggingState: {
        isDraggingObject: false,
        draggingObject: null,
        callbacks: {
        }
    },

    init: function() {
        // create root projects page
        this.currentPage = new Page('Home', $('<div class="page">')
            .append('<div class="video-wrapper">'),
            loggedUser.theme, null, loggedUser.viewport);

        this.currentPage.loadProjectsFromDatabase();
        this.currentPage.parentPage = null;
        this.currentPage.bindEvents();
        this.currentPage.show();
    },

    setCurrentPage: function(newPage) {
        this.currentPage.unbindEvents();
        this.currentPage.clearProjectElements();
        this.currentPage = newPage;
        this.currentPage.bindEvents();
        this.currentPage.show();
        this.currentPage.loadProjectElements();
        updateBreadcrums();
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
            handleObjectLoseFocus(this.focusState.focusedObject.element, this.focusState.focusedObject.data, this.focusState.callbacks);
        }
        this.clearObjectFocus();
    },

    hasFocusedObject: function() {
        return this.focusState.isFocusedOnObject &&
               this.focusState.focusedObject != null;
    },

    setFocusedObject: function(element, data, callbacks) {
        this.focusState.isFocusedOnObject = true;
        this.focusState.focusedObject = {
            "element": element,
            "data"   : data
        };
        this.focusState.callbacks = callbacks;
    },

    clearObjectDrag: function() {
        this.draggingState = {
            isDraggingObject: false,
            draggingObject: null,
            callbacks: {
            }
        };
    },

    setDraggingObject: function(element, data, callbacks) {
        this.draggingState.isDraggingObject = true;
        this.draggingState.draggingObject = {
            "element": element,
            "data"   : data
        };
        this.draggingState.callbacks = callbacks;
    },

    /** Handles when an object/project was actually clicked,
     *  i.e not just clicked while dragging or cancelling editing for another project.
     * 
     *  @param project - The project data object of the element clicked.
    */
    handleObjectClick: function(project) {
        if (this.itemClickTimeoutEnabled) {
            window.clearTimeout(this.itemClickTimeoutId);
            this.itemClickTimeoutEnabled = false;
        } else {
            if (this.hasFocusedObject()) {
                this.objectLoseFocus();
            } else {
                (function(viewspace) {
                    viewspace.itemClickTimeoutEnabled = true;
                    viewspace.itemClickTimeoutId = window.setTimeout(function() {
                        viewspace.itemClickTimeoutEnabled = false;

                        if (project.data.type === 'group' || project.data.type === 'project' || project.data.type === 'event') {
                            // open the clicked project page
                            var pageBefore = viewspace.currentPage;
                            pageBefore.unbindEvents();
                            pageBefore.clearProjectElements();

                            viewspace.currentPage = new Page(
                                project.data.name,
                                $('<div class="page">')
                                    .append('<div class="video-wrapper">'),
                                project.data.theme,
                                project,
                                project.data.viewport);

                            viewspace.currentPage.loadProjectsFromDatabase();
                            viewspace.currentPage.parentPage = pageBefore;
                            viewspace.currentPage.bindEvents();
                            viewspace.currentPage.show();

                            updateBreadcrums();
                        } else {
                            console.log('Not implemented for type ' + project.data.type);
                        }
                    }, viewspace.projectClickTimeout);
                })(this);
            }
        }
    },

    toggleSidebar: function() {
        this.isSidebarVisible = !this.isSidebarVisible;

        var sidebarWidth = '0px';
        if (this.isSidebarVisible) {
            sidebarWidth = '300px';
            $mainSidebar.show(); 
        } else {
            // hide after the transition
            window.setTimeout(function() { $mainSidebar.hide(); }, 100);
        }

        $mainSidebar.css('width', sidebarWidth);
        $pageContent.css('margin-left', sidebarWidth);
    },
};