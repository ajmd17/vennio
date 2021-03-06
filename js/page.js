var ACTION_MENU_ITEMS = [
    {
        text: 'Flag',
        imgUrl: 'img/actions/flag.png',
        click: function() {
        }
    },
    {
        text: 'Archive',
        imgUrl: 'img/actions/archive.png',
        click: function() {
        }
    },
    {
        text: 'Remove',
        imgUrl: 'img/actions/remove.png',
        click: function() {
        }
    }
];

function Page(name, element, theme, pageProject, viewport) {
    this.name = name;
    this.element = element;
    this.theme = theme;
    this.projects = [];
    this.pageProject = pageProject;
    this.viewport = viewport;
}

Page.prototype.eltSpaceToZoomSpace = function(vec) {
    var $element = $(this.element);
    return {
        x: vec.x + this.viewport.left,
        y: vec.y + this.viewport.top
    };
};

Page.prototype.zoomSpaceToEltSpace = function(vec) {
    var $element = $(this.element);
    return {
        x: vec.x - this.viewport.left,
        y: vec.y - this.viewport.top
    };
};

Page.prototype.handlePanning = function(newPos) {
    var ZOOM = this.viewport.zoom;

    viewspace.dragTime++;

    var diff = {
        x: newPos.x - viewspace.mousePosition.x,
        y: newPos.y - viewspace.mousePosition.y
    };

    this.viewport.left -= diff.x * viewspace.PAN_THETA / ZOOM;
    this.viewport.top  -= diff.y * viewspace.PAN_THETA / ZOOM;

    // update viewport
    if (this.pageProject !== null && this.pageProject !== undefined) {
        this.pageProject.data.viewport = this.viewport;
        this.pageProject.ref
            .child('data')
            .child('viewport')
            .set(this.viewport);
    } else {
        database.ref('users')
            .child(loggedUser.key)
            .child('viewport')
            .set(this.viewport);
    }

    $('.project-circle').each(function() {
        $(this).css({
            "left": '+=' + (diff.x * viewspace.PAN_THETA).toString(),
            "top" : '+=' + (diff.y * viewspace.PAN_THETA).toString()
        });
    });
};

Page.prototype.unbindEvents = function() {
    this.element.unbind();
};

Page.prototype.bindEvents = function() {
    var $element = $(this.element);
    var page = this;

    $element.bind('wheel mousewheel', function(e) {
        // only zoom if there are no elements being edited at the moment
        if (!viewspace.hasFocusedObject()) {
            var delta;
            if (e.originalEvent.wheelDelta !== undefined) {
                delta = e.originalEvent.wheelDelta;
            } else {
                delta = e.originalEvent.deltaY * -1;
            }

            var deltaSign = Math.sign(delta);
            var nextZoom = page.viewport.zoom + (deltaSign * viewspace.ZOOM_STEP);
            var oldZoom  = page.viewport.zoom;

            viewspace.mousePosition = {
                x: e.pageX - $element.offset().left,
                y: e.pageY - $element.offset().top
            };

            if (nextZoom >= viewspace.ZOOM_MIN && nextZoom <= viewspace.ZOOM_MAX) {
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
                        })(projectFunctions[project.data.type]);
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
                    database.ref('users')
                        .child(loggedUser.key)
                        .child('viewport')
                        .set(page.viewport);
                }
            }
        }
    })
    .on('dblclick', function(event) {
        if (event.target == this) {
            // add project item
            var position = { x: event.pageX, y: event.pageY };
            var projectToAdd = null;

            var RADIAL_MENU_ITEMS = [{
                title: 'Event',
                url  : 'img/shapes/calendar.png',
                select: function() {
                    var $nameInput = $('<input type="text" placeholder="Name">');
                    var $dateInput = $('<input type="text" placeholder="Date">');
                    var $timeInput = $('<input type="text" placeholder="Time">');

                    var cal = new Calendar(new Date(), function(date) {
                        var year  = date.getFullYear();
                        var month = ('0' + (date.getMonth() + 1)).slice(-2);
                        var day   = ('0' + date.getDate()).slice(-2);
                        $dateInput.val(year + '/' + month + '/' + day);
                    });

                    var clock = new Clock(new Date(), function(date, mode) {
                        var hour   = date.getHours();
                        var minute = date.getMinutes();
                        
                        var isPm = hour >= 12;
                        hour = hour % 12;
                        hour = hour != 0 ? hour : 12;

                        $timeInput.val(hour + ':' + ('0' + minute).slice(-2) + 
                            (isPm ? ' PM' : ' AM'));
                    });

                    var clockTooltip = new Tooltip($timeInput, 'Pick Time', clock.getElement(), {
                        show: function() {
                            clock.updateSize();
                        },
                        hide: function() {
                        }
                    });

                    var calTooltip = new Tooltip($dateInput, '', cal.getElement(), {
                        show: function() {
                            cal.updateSize();
                        },
                        hide: function() {
                        }
                    });

                    // custom css modifications
                    calTooltip.getElement()
                        .find('.tooltip')
                        .css('border-radius', cal.getElement().css('border-radius'));
                    calTooltip.getElement()
                        .find('.tooltip-body')
                        .css('padding', 0);
                    clock.getElement()
                        .css('width', '180px');

                    var possibleDays = {
                        "Monday": 1,
                        "Tuesday": 2,
                        "Wednesday": 3,
                        "Thursday": 4,
                        "Friday": 5,
                        "Saturday": 6,
                        "Sunday": 0
                    };

                    var chosenRepetitionDays = [];

                    var $repeatDays = $('<div>')
                        .append($('<h3>')
                            .css({
                                "margin": '4px',
                                "padding": 0
                            })
                            .append('Repeat every:'));

                    

                    for (day in possibleDays) {
                        $repeatDays.append($('<div>')
                            .addClass('checklist-item')
                            .append('<i class="checkbox-icon fa fa-square-o">')
                            .append($('<div>')
                                .addClass('day-checkbox-text')
                                .append(day)))
                    }

                    var $eventModalContent = $('<ul>')
                        .addClass('form-list')
                        .append($('<li>')
                            .append($('<i>')
                                .addClass('fa fa-pencil list-item-icon'))
                            .append($nameInput))
                        .append($('<li>')
                            .append($('<div>')
                                .addClass('split split-left')
                                .append($('<i>')
                                    .addClass('fa fa-calendar list-item-icon'))
                                .append($dateInput))
                            .append($('<div>')
                                .addClass('split split-left')
                                .append($('<i>')
                                    .addClass('fa fa-clock-o list-item-icon'))
                                .append($timeInput)))
                        .append($repeatDays);

                    $eventModalContent.find('.checklist-item').click(function() {
                        var $this = $(this);
                        $this.toggleClass('checked');
                        $this.find('.checkbox-icon')
                            .toggleClass('fa-square-o')
                            .toggleClass('fa-check-square-o');

                        var day = $this.find('.day-checkbox-text').text();
                        var dayNumber = possibleDays[day];

                        var removeIndices = [];
                        for (var i = 0; i < chosenRepetitionDays.length; i++) {
                            if (chosenRepetitionDays[i] == dayNumber) {
                                // remove from array
                                removeIndices.push(i);
                            }
                        }
                        for (var i = 0; i < removeIndices.length; i++) {
                            chosenRepetitionDays.splice(i, 1);
                        }

                        if ($this.hasClass('checked')) {
                            // add element
                            chosenRepetitionDays.push(dayNumber);
                        }
                    });

                    var modal = new Modal('Create Event', $eventModalContent, [{
                        text: 'Create',
                        type: 'primary',
                        click: function() {
                            var projectData = {
                                name: $nameInput.val().trim(),
                                type: 'event',
                                theme: BUILTIN_THEMES['poly_2'],
                                viewport: {
                                    zoom: 1.0,
                                    zoomLevel: 0,
                                    left: 0,
                                    top : 0
                                },
                                eventInfo: {
                                    date: null,
                                    location: '',
                                    description: '',
                                    recurringDays: chosenRepetitionDays, 
                                    acknowledged: false,
                                    lastAcknowledged: new Date().getTime()
                                }
                            };

                            var validateInput = function() {
                                // verify name is not empty
                                if (!projectData.name || !projectData.name.length) {
                                    // TODO show error for invalid name
                                    return false;
                                }

                                // verify date is legal
                                var timestamp = Date.parse($dateInput.val() + ' ' + $timeInput.val());
                                if (!Number.isNaN(timestamp)) {
                                    projectData.eventInfo.date = new Date(timestamp).setSeconds(0);
                                } else {
                                    // TODO show error for invalid date.
                                    return false;
                                }

                                // return true at the end if everything has gone successfully
                                return true;
                            };
                            
                            if (validateInput()) {
                                // create event, then hide the modal
                                page.addCircle(position, projectData, {
                                    success: function(element, data) {
                                        projectToAdd = new Project(
                                            page.eltSpaceToZoomSpace({
                                                x: position.x / page.viewport.zoom,
                                                y: position.y / page.viewport.zoom
                                            }),
                                            element,
                                            data);

                                        page.addProject(projectToAdd);

                                        // create the event reminder
                                        setupEvent({
                                            position: projectToAdd.position,
                                            data: projectToAdd.data
                                        }, projectToAdd.ref, EVENT_SEARCH_RANGE);

                                        // hide modal once project is created
                                        modal.hide();

                                        // set 'nameBefore' property, so it doesn't act like we need to enter the name
                                        element.nameBefore = data.name;
                                    },
                                    update: function(element, data) {
                                        // update project name in db
                                        if (projectToAdd != null) {
                                            projectToAdd.ref.child('data').update({ 
                                                name: data.name 
                                            });
                                        }
                                    },
                                    click: function() {
                                        if (projectToAdd != null) {
                                            viewspace.handleObjectClick(projectToAdd);
                                        }
                                    },
                                    finishedDragging: function() {
                                        if (projectToAdd != null) {
                                            projectToAdd.position = page.eltSpaceToZoomSpace({
                                                x: viewspace.mousePosition.x / page.viewport.zoom,
                                                y: viewspace.mousePosition.y / page.viewport.zoom
                                            });
                                            projectToAdd.ref.update({
                                                position: projectToAdd.position
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    },
                    {
                        text: 'Cancel',
                        click: function() {
                            // hide the modal
                            modal.hide();
                        }
                    }]);

                    modal.show();
                    $nameInput.select();
                }
            },
            {
                title: 'Sticky',
                url  : 'img/shapes/sticky.png',
                select: function() {
                    var projectData = {
                        name: '',
                        type: 'sticky',
                        theme: BUILTIN_THEMES.poly_2,
                        noteInfo: {
                            text: ''
                        }
                    };

                    page.addCircle(position, projectData, {
                        success: function(element, data) {
                            projectToAdd = new Project(
                                page.eltSpaceToZoomSpace({
                                    x: position.x / page.viewport.zoom,
                                    y: position.y / page.viewport.zoom
                                }),
                                element,
                                data);
                            
                            page.addProject(projectToAdd);
                        },
                        update: function(element, data) {
                            // update project name in db
                            if (projectToAdd != null) {
                                projectToAdd.ref.child('data').update({ 
                                    name: data.name 
                                });
                            }
                        },
                        click: function() {
                            if (projectToAdd != null) {
                                viewspace.handleObjectClick(projectToAdd);
                            }
                        },
                        finishedDragging: function() {
                            if (projectToAdd != null) {
                                projectToAdd.position = page.eltSpaceToZoomSpace({
                                    x: viewspace.mousePosition.x / page.viewport.zoom,
                                    y: viewspace.mousePosition.y / page.viewport.zoom
                                });
                                projectToAdd.ref.update({
                                    position: projectToAdd.position
                                });
                            }
                        }
                    });
                }
            },
            {
                title: 'Project',
                url  : 'img/shapes/circle.png',
                select: function() {
                    var projectData = {
                        name: null,
                        type: 'group',
                        theme: BUILTIN_THEMES.poly_2,
                        viewport: {
                            zoom: 1.0,
                            zoomLevel: 0,
                            left: 0,
                            top : 0
                        }
                    };

                    page.addCircle(position, projectData, {
                        success: function(element, data) {
                            projectToAdd = new Project(
                                page.eltSpaceToZoomSpace({
                                    x: position.x / page.viewport.zoom,
                                    y: position.y / page.viewport.zoom
                                }),
                                element,
                                data);
                            
                            page.addProject(projectToAdd);
                        },
                        update: function(element, data) {
                            // update project name in db
                            if (projectToAdd != null) {
                                projectToAdd.ref.child('data').update({ 
                                    name: data.name 
                                });
                            }
                        },
                        click: function() {
                            if (projectToAdd != null) {
                                viewspace.handleObjectClick(projectToAdd);
                            }
                        },
                        finishedDragging: function() {
                            if (projectToAdd != null) {
                                projectToAdd.position = page.eltSpaceToZoomSpace({
                                    x: viewspace.mousePosition.x / page.viewport.zoom,
                                    y: viewspace.mousePosition.y / page.viewport.zoom
                                });
                                projectToAdd.ref.update({
                                    position: projectToAdd.position
                                });
                            }
                        }
                    });
                }
            },
            {
                title: 'Todo',
                url  : 'img/shapes/todo.png'
            }];

            var showRadialMenu = function($element, position) {
                var SELECTOR_SIZE = 250;
                var HALF_SELECTOR_SIZE = SELECTOR_SIZE / 2;
                var NUM_SHAPES = RADIAL_MENU_ITEMS.length;
                var DEG_STEP = 360 / NUM_SHAPES;

                var $blurredBackground = $('<div>')
                    .addClass('blurred-background')
                    .css({
                        "opacity": 0
                    });

                var $radialMenu = $('<ul>')
                    .addClass('radial-menu')
                    .css({
                        "width"  : SELECTOR_SIZE.toString() + 'px',
                        "height" : SELECTOR_SIZE.toString() + 'px',
                        "left"   : (position.x - HALF_SELECTOR_SIZE).toString() + 'px',
                        "top"    : (position.y - HALF_SELECTOR_SIZE).toString() + 'px',
                        "opacity": 0
                    })
                    .focusout(function() {
                        // remove menu on lose focus (after fade out)
                        var $this = $(this);
                        $this.animate({
                            "opacity": 0
                        }, 200, function() {
                            $this.remove();
                        });

                        // remove blurred background
                        $blurredBackground.animate({
                            "opacity": 0
                        }, 200, function() {
                            $blurredBackground.remove();
                        });
                    })
                    .append($('<h2>')
                        .addClass('radial-menu-title')
                        .append('Create'));

                var degrees = 0;

                RADIAL_MENU_ITEMS.forEach(function(item) {
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
    })
    .on('mousedown touchstart', function(e) {
        // preventDefault() avoids dragging text in divs,
        // messing everything up
        e.preventDefault();

        var $this = $(this);
        var $offset = $this.offset();
        var $target = $(e.target);

        if (e.type == 'touchstart') {
            viewspace.mousePosition = {
                x: e.touches[0].pageX - $offset.left,
                y: e.touches[0].pageY - $offset.top
            };
        }

        if ($target.is($this)) {
            viewspace.mouseHoldId = window.setTimeout(function() {
                showRipple = true;
            }, 250);

            $this.css('cursor', 'move');
            viewspace.isPanning = true;
            console.log('panning');
        }
    })
    .on('mousemove touchmove', function(e) {
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

        if (viewspace.isPanning) {
            page.handlePanning(newPos);
        } else if (viewspace.draggingState.isDraggingObject) {
            var halfSize = calculateZoomedSize(viewspace.draggingState.draggingObject.data, page.viewport)/2;
            $(viewspace.draggingState.draggingObject.element).css({
                "top" : (newPos.y - halfSize).toString() + 'px',
                "left": (newPos.x - halfSize).toString() + 'px',
            });
        }

        viewspace.mousePosition = newPos;
    });
};

Page.prototype.setTheme = function(theme) {
    this.theme = theme;
    this.loadTheme();
};

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

        $videoWrapper.html($background);
    }
};

Page.prototype.addProject = function(project) {
    // add project to DB
    var projectsRef = null;
    if (this.pageProject !== undefined && this.pageProject !== null) {
        projectsRef = this.pageProject.ref
            .child('subnodes');
    } else {
        projectsRef = database.ref('users')
            .child(loggedUser.key)
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
    this.projects.push(project);
};

Page.prototype.show = function() {
    $('#page-content').html(this.element);
    if (this.theme !== undefined && this.theme !== null) {
        this.loadTheme();
    }
};

Page.prototype.clearProjectElements = function() {
    $(this.element)
        .find('.project-circle')
        .each(function() {
            $(this).remove();
        });
};

Page.prototype.loadProjectElement = function(project, animationTime) {
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
        .append(createActionsMenu())
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
            viewspace.handleObjectClick(project);
        },
        finishedDragging: function() {
            project.position = page.eltSpaceToZoomSpace({
                x: viewspace.mousePosition.x / page.viewport.zoom,
                y: viewspace.mousePosition.y / page.viewport.zoom
            });
            project.ref.update({
                position: project.position
            });
        }
    });

    // set element properties
    $projectCircleElement.nameBefore = project.data.name;

    return $projectCircleElement;
};

/** Create visual elements for all objects in projects array */
Page.prototype.loadProjectElements = function() {
    var $element = $(this.element);
    for (var i = 0; i < this.projects.length; i++) {
        this.projects[i].element = this.loadProjectElement(this.projects[i], 
            Math.min(250 + ((i / this.projects.length) * 100), 500));
        $element.append(this.projects[i].element);
    }
};

/** Load projects from database into the array */
Page.prototype.loadProjectsFromDatabase = function() {
    var projectsRef = null;
    if (this.pageProject !== undefined && this.pageProject !== null) {
        projectsRef = this.pageProject.ref
            .child('subnodes');
    } else {
        projectsRef = database.ref('users')
            .child(loggedUser.key)
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
                        project.key = key;
                        project.ref = projectsRef.child(key);
                        page.projects.push(project);
                    })(keys[i]);
                }
            }
            page.loadProjectElements();
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
                })(projectFunctions[data.type]);
            })
        .append(createActionsMenu().css('display', 'none'))
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
    
    viewspace.setFocusedObject($projectCircleElement, data, callbacks);
    $projectCircleElement.attr('tabindex', -1).focus();
};

function bindProjectElementEvents(element, data, callbacks) {
    var $element = $(element);
    
    var itemHoldTimeoutId = null;

    $element.mousedown(function() {
        console.log('mousedown on project');
        itemHoldTimeoutId = window.setTimeout(function() {
            viewspace.setDraggingObject(element, data, {
            });
        }, 300);
    }).mouseup(function() {
        console.log('mouseup on project');
        if (!viewspace.draggingState.isDraggingObject) {
            if (itemHoldTimeoutId !== null) {
                window.clearTimeout(itemHoldTimeoutId);
                if (callbacks.click != undefined) {
                    callbacks.click();
                }
                itemHoldTimeoutId = null;
            }
        } else {
            viewspace.clearObjectDrag();
            if (itemHoldTimeoutId !== null) {
                // update project position in db??
                if (callbacks.finishedDragging != undefined) {
                    callbacks.finishedDragging();
                }
            }
        }
    })

    /*$element.click(function() {
        if (callbacks.click != undefined) {
            callbacks.click();
        }
    })*/.on("dblclick", function() {
        if (viewspace.itemClickTimeoutEnabled) {
            window.clearTimeout(viewspace.itemClickTimeoutId);
            viewspace.itemClickTimeoutEnabled = false;
        }
        // re-focus this object for editing.
        viewspace.setFocusedObject(element, data, callbacks);

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
        })(projectFunctions[data.type]);
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

                    menuItem.click(/* ... */);
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
                return projectTypeFunctions.createContent(data, viewport, isNewlyCreated);
            }
        } else {
            console.log('No functionality for type: "' + data.type.toString() + '"');
        }
        return null;
    })(projectFunctions[data.type]);
}