app.factory('Viewspace', function($rootScope, $location, Auth, ProjectFunctions, Breadcrumbs, Extensions, RadialMenu) {

    /** page.js */
    var ACTION_MENU_ITEMS = [
        {
            text: 'Flag',
            imgUrl: 'img/actions/flag.png',
            click: function(menuItem) {
            }
        },
        {
            text: 'Archive',
            imgUrl: 'img/actions/archive.png',
            click: function(menuItem) {
            }
        },
        {
            text: 'Remove',
            imgUrl: 'img/actions/remove.png',
            click: function(menuItem) {
                console.log('menuItem: ', menuItem);
            }
        }
    ];

    /** 
     * Page class.
     * Holds the projects in a local array, as well as other 
     * info such as theme and viewport. Also, the element object 
     * is a data member.
     */
    function Page(name, element, theme, pageProject, viewport) {
        this.name = name;
        this.element = element;
        this.theme = theme;
        this.projects = [];
        this.pageProject = pageProject;
        this.viewport = viewport;
    }

    /**
     * Converts {x, y} stored in the local element space to
     * the way that it will be represented in the database.
     */
    Page.prototype.eltSpaceToZoomSpace = function(vec) {
        var $element = $(this.element);
        return {
            x: vec.x + this.viewport.left,
            y: vec.y + this.viewport.top
        };
    };

    /**
     * Converts {x, y} stored in zoom space (as stored in the database),
     * to the local way of displaying objects
     */
    Page.prototype.zoomSpaceToEltSpace = function(vec) {
        var $element = $(this.element);
        return {
            x: vec.x - this.viewport.left,
            y: vec.y - this.viewport.top
        };
    };

    /**
     * Handle the mouse panning around the page, as well as
     * updates the state of the viewport in the database. 
     */
    Page.prototype.handlePanning = function(newPos) {
        var ZOOM = this.viewport.zoom;

        Viewspace.dragTime++;

        var diff = {
            x: newPos.x - Viewspace.mousePosition.x,
            y: newPos.y - Viewspace.mousePosition.y
        };

        this.viewport.left -= diff.x * Viewspace.PAN_THETA / ZOOM;
        this.viewport.top  -= diff.y * Viewspace.PAN_THETA / ZOOM;

        // update viewport
        if (this.pageProject !== null && this.pageProject !== undefined) {
            this.pageProject.data.viewport = this.viewport;
            this.pageProject.ref
                .child('data')
                .child('viewport')
                .set(this.viewport);
        } else {
            Auth.getDatabase().ref('users')
                .child(Auth.getUser().key)
                .child('viewport')
                .set(this.viewport);
        }

        $('.project-circle').each(function() {
            $(this).css({
                "left": '+=' + (diff.x * Viewspace.PAN_THETA).toString(),
                "top" : '+=' + (diff.y * Viewspace.PAN_THETA).toString()
            });
        });
    };

    /**
     * Unbind all the events from the page.
     */
    Page.prototype.unbindEvents = function() {
        this.element.unbind();
    };

    /**
     * Sets up all the events of the page.
     */
    Page.prototype.bindEvents = function(userKey) {
        var $element = $(this.element);
        var page = this;

        $element.on('wheel mousewheel', function(e) {
            // only zoom if there are no elements being edited at the moment
            if (!Viewspace.hasFocusedObject()) {
                var delta;
                if (e.originalEvent.wheelDelta !== undefined) {
                    delta = e.originalEvent.wheelDelta;
                } else {
                    delta = e.originalEvent.deltaY * -1;
                }

                var deltaSign = Math.sign(delta);
                var nextZoom = page.viewport.zoom + (deltaSign * Viewspace.ZOOM_STEP);
                var oldZoom  = page.viewport.zoom;

                Viewspace.mousePosition = {
                    x: e.pageX - $element.offset().left,
                    y: e.pageY - $element.offset().top
                };

                if (nextZoom >= Viewspace.ZOOM_MIN && nextZoom <= Viewspace.ZOOM_MAX) {
                    page.viewport.zoomLevel += Math.sign(nextZoom - page.viewport.zoom);

                    var zoomRatio = nextZoom / page.viewport.zoom;
                    page.viewport.zoom = nextZoom;

                    var cursor = {
                        x: (e.pageX - $element.offset().left),
                        y: (e.pageY - $element.offset().top)
                    };

                    var viewportOffset = {
                        x: ((cursor.x * zoomRatio) - cursor.x) / page.viewport.zoom,
                        y: ((cursor.y * zoomRatio) - cursor.y) / page.viewport.zoom
                    };

                    // modify viewport left and top
                    page.viewport.left += viewportOffset.x;
                    page.viewport.top  += viewportOffset.y;

                    // update zoom for all projects in this page immediately
                    for (var i = 0; i < page.projects.length; i++) {
                        (function(project) {
                            var $projElement = $(project.element);

                            var currentLeft   = $projElement.position().left;
                            var currentTop    = $projElement.position().top;
                            var currentWidth  = $projElement.width();
                            var currentHeight = $projElement.height();
                            var newWidth  = Math.ceil(currentWidth  / oldZoom) * page.viewport.zoom;
                            var newHeight = Math.ceil(currentHeight / oldZoom) * page.viewport.zoom;

                            $projElement.css({
                                "width" : newWidth.toString(),
                                "height": newHeight.toString(),
                                "left": (((currentLeft + (currentWidth / 2)) / oldZoom - viewportOffset.x) * page.viewport.zoom - (newWidth  / 2)).toString() + 'px',
                                "top" : (((currentTop  + (currentWidth / 2)) / oldZoom - viewportOffset.y) * page.viewport.zoom - (newHeight / 2)).toString() + 'px',
                            });

                            // call the dedicated updateZoom function
                            (function(projectTypeFunctions) {
                                if (projectTypeFunctions !== undefined) {
                                    if (projectTypeFunctions.updateZoom !== undefined) {
                                        projectTypeFunctions.updateZoom($projElement, newWidth, newHeight);
                                    }
                                }
                            })(ProjectFunctions[project.data.type]);
                        })(page.projects[i]);
                    }

                    // update database with the viewport data
                    if (page.pageProject !== undefined && page.pageProject !== null) {
                        page.pageProject.data.viewport = page.viewport;
                        page.pageProject.ref
                            .child('data')
                            .child('viewport')
                            .set(page.viewport);
                    } else {
                        Auth.getDatabase().ref('users')
                            .child(Auth.getUser().key)
                            .child('viewport')
                            .set(page.viewport);
                    }
                }
            }
        }).on('dblclick', function(event) {
            if (event.target == this) {
                // add project item
                var position = { x: event.pageX, y: event.pageY };

                var radialMenuItems = RadialMenu.getRadialMenuItems(userKey, Viewspace, page, position);

                var showRadialMenu = function($element, position) {
                    var SELECTOR_SIZE = 250;
                    var HALF_SELECTOR_SIZE = SELECTOR_SIZE / 2;
                    var NUM_SHAPES = radialMenuItems.length;
                    var DEG_STEP = 360 / NUM_SHAPES;

                    var $radialMenu = $('<ul>')
                        .addClass('radial-menu')
                        .css({
                            "width"  : SELECTOR_SIZE.toString() + 'px',
                            "height" : SELECTOR_SIZE.toString() + 'px',
                            "left"   : (position.x - HALF_SELECTOR_SIZE).toString() + 'px',
                            "top"    : (position.y - HALF_SELECTOR_SIZE).toString() + 'px',
                            "opacity": 0
                        })
                        .append($('<h2>')
                            .addClass('radial-menu-title')
                            .append('Create'));
                        
                    var $blurredBackground = $('<div>')
                        .addClass('blurred-background')
                        .css({
                            "opacity": 0
                        })
                        .click(function() {
                            // remove menu on lose focus (after fade out)
                            $radialMenu.animate({
                                "opacity": 0
                            }, 200, function() {
                                $radialMenu.remove();
                            });

                            // remove blurred background
                            $blurredBackground.animate({
                                "opacity": 0
                            }, 200, function() {
                                $blurredBackground.remove();
                            });
                        });


                    var degrees = 0;

                    radialMenuItems.forEach(function(item) {
                        $radialMenu.append($('<li>')
                            .append($('<img src="' + item.url + '">'))
                            .hover(function() {
                                $('.radial-menu-title').html(item.title);
                            }, function() {
                                $('.radial-menu-title').html('Create');
                            })
                            .click(function(e) {
                                // don't bubble up the DOM
                                e.stopPropagation();

                                // remove the 'Create' menu
                                $radialMenu.animate({
                                    "opacity": 0
                                }, 200, function() {
                                    $radialMenu.remove();
                                });
                                
                                // remove blurred background
                                $blurredBackground.animate({
                                    "opacity": 0
                                }, 200, function() {
                                    $blurredBackground.remove();
                                });

                                if (item.select != undefined) {
                                    item.select();
                                }
                            })
                            .css({
                                "opacity": 1,
                                "transform": 'rotate(' + degrees + 'deg) translate(' + (HALF_SELECTOR_SIZE - 40) + 'px) rotate(' + (-1 * degrees) + 'deg)'
                            }));

                        degrees += DEG_STEP;
                    });
                    
                    $element.append($blurredBackground);
                    $element.append($radialMenu);
                    
                    $radialMenu.animate({
                        "opacity": 1
                    }, 200);
                    $blurredBackground.animate({
                        "opacity": 1
                    }, 200);

                    $radialMenu.attr('tabindex', -1).focus();
                };

                showRadialMenu($element, position);
            }
        }).on('mousedown touchstart', function(e) {
            // preventDefault() avoids dragging text in divs,
            // messing everything up
            e.preventDefault();

            var $this = $(this);
            var $offset = $this.offset();
            var $target = $(e.target);

            if (e.type == 'touchstart') {
                Viewspace.mousePosition = {
                    x: e.touches[0].pageX - $offset.left,
                    y: e.touches[0].pageY - $offset.top
                };
            }

            if ($target.is($this)) {
                Viewspace.mouseHoldId = window.setTimeout(function() {
                    showRipple = true;
                }, 250);

                $this.css('cursor', 'move');
                Viewspace.isPanning = true;
                console.log('panning');
            }
        }).on('mousemove touchmove', function(e) {
            var $this = $(this);
            var $offset = $this.offset();

            var newPos = null;

            if (e.type == 'touchmove') {
                e.preventDefault();
                newPos = {
                    x: e.touches[0].pageX - $offset.left,
                    y: e.touches[0].pageY - $offset.top
                };
            } else {
                newPos = { 
                    x: e.pageX - $offset.left,
                    y: e.pageY - $offset.top
                };
            }

            if (Viewspace.isPanning) {
                page.handlePanning(newPos);
            } else if (Viewspace.draggingState.isDraggingObject) {
                var halfSize = calculateZoomedSize(Viewspace.draggingState.draggingObject.data, page.viewport)/2;
                $(Viewspace.draggingState.draggingObject.element).css({
                    "top" : (newPos.y - halfSize).toString() + 'px',
                    "left": (newPos.x - halfSize).toString() + 'px',
                });
            }

            Viewspace.mousePosition = newPos;
        });
    };

    /**
     * Returns the html element of the page.
     */
    Page.prototype.getElement = function() {
        return this.element;
    };

    /**
     * Returns the current theme property.
     */
    Page.prototype.getTheme = function() {
        return this.theme;
    };

    /**
     * Sets the theme property to a new value,
     * as well as calls loadTheme() to update the element.
     */
    Page.prototype.setTheme = function(theme) {
        this.theme = null;
        this.theme = theme;
        this.loadTheme();
    };

    /**
     * Updates the element with the current 'theme' property.
     */
    Page.prototype.loadTheme = function() {
        var $element = $(this.element);
        var $videoWrapper = $element.find('.video-wrapper');
        var $background = null;

        if ($videoWrapper.length > 0) {
            if (this.theme.isVideo) {
                $background = $('<video playsinline autoplay muted loop>')
                    .append($('<source src="' + this.theme.backgroundUrl + '" type="video/mp4">'));
            } else {
                $background = $('<img src="' + this.theme.backgroundUrl + '">');
            }

            $background.addClass('video-bg');

            if (this.theme.blurAmt > 0) {
                $background.css('filter', 'blur(' + this.theme.blurAmt.toString() + 'px)');
            } else {
                $background.css('filter', '');
            }

            $videoWrapper.empty();
            $videoWrapper.html($background);
        }
    };

    /** 
     * Adds a project object to the local list of projects.
     * Does not update in the database because it is assumed that it is already
     * loaded from the database.
     */
    Page.prototype.addLoadedProject = function(project) {
        this.projects.push(project);
    };

    /** 
     * Adds a project object to the local list of projects, as well as
     * updates the database with the project object
     */
    Page.prototype.addProject = function(project) {
        // add project to DB
        var projectsRef = null;
        if (this.pageProject !== undefined && this.pageProject !== null) {
            projectsRef = this.pageProject.ref
                .child('data/subnodes');
        } else {
            projectsRef = Auth.getDatabase().ref('users')
                .child(Auth.getUser().key)
                .child('projects');
        }

        // copy object and push it to the database
        var projectObject = {};
        for (attrib in project) {
            if (project.hasOwnProperty(attrib) && attrib != 'element' && typeof project[attrib] !== 'function') {
                projectObject[attrib] = project[attrib];
            }
        }
        project.ref = projectsRef.push(projectObject);
        project.key = project.ref.key;
        this.projects.push(project);
    };

    Page.prototype.show = function() {
        var page = this;
        var $element = $(this.element);
        $element.css({
            "opacity": 0
        });
        if (page.theme !== undefined && page.theme !== null) {
            page.loadTheme();
        }
        var $pageContent = $('#page-content');
        $pageContent.html($element);
        $element.animate({"opacity": 1}, 300);
    };

    Page.prototype.clearProjectElements = function() {
        $(this.element)
            .find('.project-circle')
            .each(function() {
                $(this).remove();
            });
    };

    Page.prototype.loadProjectElement = function(userKey, project, animationTime) {
        var SIZE = (project.data.size != undefined) ? project.data.size : 200;
        var ZOOM = this.viewport.zoom;
        var SIZE_ZOOMED = SIZE * ZOOM;
        var HALF_SIZE = SIZE_ZOOMED / 2;

        var absPosition = this.zoomSpaceToEltSpace(project.position);

        var $projImg = SVG_OBJECTS[PROJECT_CLASS_SVG_NAMES[project.data.type]]
            .clone()
            .css('fill', project.data.color);

        var $projectCircleElement = $('<div>')
            .addClass('project-circle')
            .css({
                "left": (absPosition.x * ZOOM - HALF_SIZE).toString() + 'px',
                "top" : (absPosition.y * ZOOM - HALF_SIZE).toString() + 'px',
                "width" : SIZE_ZOOMED.toString() + 'px',
                "height": SIZE_ZOOMED.toString() + 'px',
                "opacity": 0
            })
            //.append(createActionsMenu(project))
            .animate({ opacity: 1 }, animationTime)
            .append($('<div>')
                .addClass('project-image')
                .append($projImg))
            .append(createProjectContent(project.data, this.viewport, false));

        var page = this;
        // bind click, double click, lose focus events
        bindProjectElementEvents($projectCircleElement, project.data, {
            update: function(element, data) {
                // update project name in db
                project.ref.child('data').update({ 
                    name: data.name 
                });
            },
            click: function() {
                Viewspace.handleObjectClick(userKey, project);
            },
            finishedDragging: function() {
                project.position = page.eltSpaceToZoomSpace({
                    x: Viewspace.mousePosition.x / page.viewport.zoom,
                    y: Viewspace.mousePosition.y / page.viewport.zoom
                });
                project.ref.update({
                    position: project.position
                });
            },
            loseFocus: function() { Viewspace.objectLoseFocus(); }
        });

        // set element properties
        $projectCircleElement.nameBefore = project.data.name;

        return $projectCircleElement;
    };

    /** Create visual elements for all objects in projects array */
    Page.prototype.loadProjectElements = function(userKey) {
        var $element = $(this.element);
        for (var i = 0; i < this.projects.length; i++) {
            this.projects[i].element = this.loadProjectElement(userKey, this.projects[i], 
                Math.min(250 + ((i / this.projects.length) * 100), 500));
            $element.append(this.projects[i].element);
            console.log('this.project[' + i + '].element = ', this.projects[i].element);
        }
    };

    /** Load projects from database into the array */
    Page.prototype.loadProjectsFromDatabase = function(userKey, loadElements) {
        var projectsRef = null;
        if (this.pageProject !== undefined && this.pageProject !== null) {
            projectsRef = this.pageProject.ref
                .child('data/subnodes');
        } else {
            projectsRef = Auth.getDatabase().ref('users')
                .child(userKey)
                .child('projects');
        }

        (function(page) {
            projectsRef.once('value', function(snapshot) {
                var snapshotValue = snapshot.val();

                if (snapshotValue !== undefined && snapshotValue !== null) {
                    var keys = Object.keys(snapshotValue);
                    for (var i = 0; i < keys.length; i++) {
                        (function(key) {
                            var project = snapshotValue[key];
                            project.key = key; // store the firebase key in the object
                            project.ref = projectsRef.child(key);
                            page.projects.push(project);
                        })(keys[i]);
                    }
                }

                if (loadElements) {
                    page.loadProjectElements(userKey);
                }
            });
        })(this);
    };

    /** 
     * Adds a brand new project element to the page.
     * The callbacks are used to trigger events on
     * success, or when the element is clicked.
     */
    Page.prototype.addCircle = function(position, data, callbacks) {
        if (data.size === undefined) {
            data.size = 200;
        }

        if (data.color === undefined) {
            data.color = randomColor({ 
                luminosity: 'light', 
                format: 'rgb'
            });
        }

        var ZOOM = this.viewport.zoom;
        var SIZE_ZOOMED = data.size * ZOOM;
        var HALF_SIZE = SIZE_ZOOMED / 2;
        var FONT_SIZE = roundTo(SIZE_ZOOMED / 10, 1);

        var $projectCircleElement = $('<div>')
            .addClass('project-circle')
            .css({
                "position": 'absolute',
                "background-color": 'transparent',
                "left": position.x,
                "top" : position.y,
                "font-size": FONT_SIZE.toString() + 'px'
            })
            .animate({
                "left": position.x - HALF_SIZE,
                "top" : position.y - HALF_SIZE,
                "width" : SIZE_ZOOMED.toString() + 'px',
                "height": SIZE_ZOOMED.toString() + 'px'
                },
                400, 'easeOutBounce', function() {
                    var $this  = $(this);
                    var $input = $this.find('.project-circle-text-edit');
                    if ($input.length != 0) {
                        $input.select();
                    }

                    // call the dedicated updateZoom function after animation is finished
                    (function(projectTypeFunctions) {
                        if (projectTypeFunctions !== undefined) {
                            if (projectTypeFunctions.updateZoom !== undefined) {
                                projectTypeFunctions.updateZoom($this, SIZE_ZOOMED, SIZE_ZOOMED);
                            }
                        }
                    })(ProjectFunctions[data.type]);
                })
            //.append(createActionsMenu().css('display', 'none'))
            .append($('<div>')
                .addClass('project-image')
                .append(SVG_OBJECTS[PROJECT_CLASS_SVG_NAMES[data.type]]
                    .clone()
                    .css('fill', data.color)))
            .append(createProjectContent(data, this.viewport, true));

        

        // set element properties
        $projectCircleElement.nameBefore = data.name;

        // bind click, double click, lose focus events
        bindProjectElementEvents($projectCircleElement, data, callbacks);

        $(this.element).append($projectCircleElement);
        
        Viewspace.setFocusedObject($projectCircleElement, data, callbacks);
        $projectCircleElement.attr('tabindex', -1).focus();
    };


    /** viewspace.js */
    var Viewspace = {
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

        init: function(user, page) {
            if (page !== undefined && page !== null) {
                this.currentPage = page;
            } else {
                // create root projects page
                this.currentPage = this.createHomePage(user);
                this.currentPage.parentPage = null;
            }

            this.currentPage.loadProjectsFromDatabase(user.key, true);
            this.currentPage.bindEvents(user.key);
            this.currentPage.show();

            // update breadcrumbs
            Breadcrumbs.update(user.key, Viewspace, Auth.getUser().preferences.enableAnimations.enabled);
        },

        createProjectUrl: function(userKey, current, next) {
            var pathParts = (next !== undefined && next !== null) ? [next.key] : [];
            var page = current;
            while (page !== undefined && page !== null) {
                if (page.pageProject !== undefined && page.pageProject !== null) {
                    // add firebase key
                    pathParts.push(page.pageProject.key);
                }
                page = page.parentPage;
            }

            var path = '/home/' + userKey;
            for (var i = pathParts.length - 1; i >= 0; i--) {
                path += '/' + pathParts[i].toString();
            }
            return path;
        },

        goToProjectUrl: function(userKey, current, next) {
            if (Auth.getUser().preferences.enableAnimations.enabled) {
                // remove items with animation
                $('#top-breadcrums, .video-wrapper, .project-circle').animate({"opacity": 0}, 350, () => {
                    $location.path(this.createProjectUrl(userKey, current, next));
                    $rootScope.$apply();
                });
            } else {
                $location.path(this.createProjectUrl(userKey, current, next));
                $rootScope.$apply();
            }
        },

        createPage: function(project, parentPage) {
            var page = new Page(
                project.data.name,
                $('<div class="page">')
                    .append('<div class="video-wrapper">'),
                project.data.theme,
                project,
                project.data.viewport);

            page.parentPage = parentPage;
            return page;
        },

        createHomePage: function(user) {
            return new Page('Home', $('<div class="page">').append('<div class="video-wrapper">'),
                user.theme, null, user.viewport)
        },

        getCurrentPage: function() {
            return this.currentPage;
        },

        setCurrentPage: function(userKey, newPage) {
            this.currentPage.unbindEvents();
            this.currentPage.clearProjectElements();
            this.currentPage = null;
            this.currentPage = newPage;
            this.currentPage.bindEvents();
            this.currentPage.show();
            this.currentPage.loadProjectElements();

            Breadcrumbs.update(userKey, this, Auth.getUser().preferences.enableAnimations.enabled);
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
        handleObjectClick: function(userKey, project) {
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

                            // now that I have dynamic routing I will just change the route.
                            // the other way was probably more efficient, but this is how it has to be 
                            // in order to change the url.
                            
                            // Bring the user to the nested project element
                            viewspace.goToProjectUrl(userKey, viewspace.getCurrentPage(), project);

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

    function bindProjectElementEvents(element, data, callbacks) {
        var $element = $(element);
        
        var itemHoldTimeoutId = null;

        $element.mousedown(function() {
            itemHoldTimeoutId = window.setTimeout(function() {
                Viewspace.setDraggingObject(element, data, {
                });
            }, 300);
        }).mouseup(function() {
            if (!Viewspace.draggingState.isDraggingObject) {
                if (itemHoldTimeoutId !== null) {
                    window.clearTimeout(itemHoldTimeoutId);
                    if (callbacks.click != undefined) {
                        callbacks.click();
                    }
                    itemHoldTimeoutId = null;
                }
            } else {
                Viewspace.clearObjectDrag();
                if (itemHoldTimeoutId !== null) {
                    // update project position in db??
                    if (callbacks.finishedDragging != undefined) {
                        callbacks.finishedDragging();
                    }
                }
            }
        }).on('dblclick', function() {
            if (Viewspace.itemClickTimeoutEnabled) {
                window.clearTimeout(Viewspace.itemClickTimeoutId);
                Viewspace.itemClickTimeoutEnabled = false;
            }
            // re-focus this object for editing.
            Viewspace.setFocusedObject(element, data, callbacks);

            // call the dedicated doubleClick function for this
            // project type (if it exists)
            (function(projectTypeFunctions) {
                if (projectTypeFunctions !== undefined) {
                    if (projectTypeFunctions.doubleClick !== undefined) {
                        projectTypeFunctions.doubleClick(element, data, callbacks);
                    }
                } else {
                    console.log('No functionality for type: "' + data.type.toString() + '"');
                }
            })(ProjectFunctions[data.type]);
        });
    }

    function createActionsMenu() {
        var $actionsMenu = $('<div>')
            .addClass('project-actions-menu');
        var $actionsMenuItems = $('<ul>');

        for (var i = 0; i < ACTION_MENU_ITEMS.length; i++) {
            (function(menuItem) {
                $actionsMenuItems.append($('<li>')
                    .append('<img src="' + menuItem.imgUrl + '">')
                    .click(function(e) {
                        // do not bubble up the DOM
                        e.stopPropagation();

                        menuItem.click(menuItem);
                    }));
            })(ACTION_MENU_ITEMS[i]);
        }

        $actionsMenu.append($actionsMenuItems);

        return $actionsMenu;
    }

    function createProjectContent(data, viewport, isNewlyCreated) {
        return (function(projectTypeFunctions) {
            if (projectTypeFunctions !== undefined) {
                if (projectTypeFunctions.createContent !== undefined) {
                    return projectTypeFunctions.createContent(data, viewport, isNewlyCreated, {
                        loseFocus: function() { Viewspace.objectLoseFocus(); }
                    });
                }
            } else {
                console.log('No functionality for type: "' + data.type.toString() + '"');
            }
            return null;
        })(ProjectFunctions[data.type]);
    }


    function handleObjectLoseFocus(element, data, callbacks) {
        (function(projectTypeFunctions) {
            if (projectTypeFunctions !== undefined) {
                if (projectTypeFunctions.loseFocus !== undefined) {
                    return projectTypeFunctions.loseFocus(element, data, callbacks);
                }
            } else {
                console.log('No functionality for type: "' + data.type.toString() + '"');
            }
            return null;
        })(ProjectFunctions[data.type]);
    }


    return Viewspace;
});