var ACTION_MENU_ITEMS = [
    {
        text: "Flag",
        imgUrl: "img/actions/flag.png",
        click: function() {
        }
    },
    {
        text: "Archive",
        imgUrl: "img/actions/archive.png",
        click: function() {
        }
    },
    {
        text: "Remove",
        imgUrl: "img/actions/remove.png",
        click: function() {
        }
    },
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
        this.pageProject.viewport = this.viewport;
        this.pageProject.ref
            .child("viewport")
            .set(this.viewport);
    } else {
        database.ref("users")
            .child(loggedUser.key)
            .child("viewport")
            .set(this.viewport);
    }

    $(".project-circle").each(function() {
        $(this).css({
            "left": "+=" + (diff.x * viewspace.PAN_THETA).toString(),
            "top" : "+=" + (diff.y * viewspace.PAN_THETA).toString()
        });
    });
};

Page.prototype.unbindEvents = function() {
    this.element.unbind();
};

Page.prototype.bindEvents = function() {
    var $element = $(this.element);
    var page = this;

    $element.bind("wheel mousewheel", function(e) {
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
                var sign = Math.sign(nextZoom - page.viewport.zoom);
                page.viewport.zoomLevel += sign;

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

                // update each project element immediately
                $(".project-circle").each(function() {
                    var $this = $(this);

                    var currentLeft   = $this.position().left;
                    var currentTop    = $this.position().top;
                    var currentWidth  = $this.width();
                    var currentHeight = $this.height();
                    var newWidth  = Math.ceil(currentWidth  / oldZoom) * page.viewport.zoom;
                    var newHeight = Math.ceil(currentHeight / oldZoom) * page.viewport.zoom;

                    $this.css({
                        "width" : newWidth.toString(),
                        "height": newHeight.toString(),
                        "left": (((currentLeft + (currentWidth / 2)) / oldZoom - viewportOffset.x) * page.viewport.zoom - (newWidth  / 2)).toString() + "px",
                        "top" : (((currentTop  + (currentWidth / 2)) / oldZoom - viewportOffset.y) * page.viewport.zoom - (newHeight / 2)).toString() + "px",
                        "font-size": roundTo(newWidth / 10, 1).toString() + "px"
                    });
                });

                // update database with the viewport data
                if (page.pageProject !== null && page.pageProject !== undefined) {
                    page.pageProject.viewport = page.viewport;
                    page.pageProject.ref
                        .child("viewport")
                        .set(page.viewport);
                } else {
                    database.ref("users")
                        .child(loggedUser.key)
                        .child("viewport")
                        .set(page.viewport);
                }
            }
        }
    }).on("dblclick", function(event) {
        if (event.target == this) {
            // add project item
            var position = { x: event.pageX, y: event.pageY };
            var projectToAdd = null;

            var RADIAL_MENU_ITEMS = [
                {
                    title: "Event",
                    url  : "img/shapes/calendar.png",
                    select: function() {
                        var $nameInput = $("<input type=\"text\" placeholder=\"Name\">");
                        var $dateInput = $("<input type=\"text\" placeholder=\"Date\">");
                        var $timeInput = $("<input type=\"text\" placeholder=\"Time\">");

                        var cal = new Calendar(new Date(), function(date) {
                            var year  = date.getFullYear();
                            var month = ("0" + (date.getMonth() + 1)).slice(-2);
                            var day   = ("0" + date.getDate()).slice(-2);
                            $dateInput.val(year + "/" + month + "/" + day);
                        });

                        var clock = new Clock(new Date(), function(date, mode) {
                            var hour   = date.getHours();
                            var minute = date.getMinutes();
                            
                            var isPm = hour >= 12;
                            hour = hour % 12;
                            hour = hour != 0 ? hour : 12;

                            $timeInput.val(hour + ":" + ("0" + minute).slice(-2) + 
                                (isPm ? " PM" : " AM"));
                        });

                        var clockTooltip = new Tooltip($timeInput, "Pick Time", clock.getElement(), {
                            show: function() {
                                clock.updateSize();
                            },
                            hide: function() {
                            }
                        });

                        var calTooltip = new Tooltip($dateInput, "", cal.getElement(), {
                            show: function() {
                                cal.updateSize();
                            },
                            hide: function() {
                            }
                        });

                        // custom css modifications
                        calTooltip.getElement()
                            .find(".tooltip")
                            .css("border-radius", cal.getElement().css("border-radius"));
                        calTooltip.getElement()
                            .find(".tooltip-body")
                            .css("padding", 0);
                        clock.getElement()
                            .css("width", "180px");

                        var $eventModalContent = $("<ul>")
                            .addClass("form-list")
                            .append($("<li>")
                                .append($("<i>")
                                    .addClass("fa fa-pencil list-item-icon"))
                                .append($nameInput))
                            .append($("<li>")
                                .append($("<div>")
                                    .addClass("split split-left")
                                    .append($("<i>")
                                        .addClass("fa fa-calendar list-item-icon"))
                                    .append($dateInput))
                                .append($("<div>")
                                    .addClass("split split-left")
                                    .append($("<i>")
                                        .addClass("fa fa-clock-o list-item-icon"))
                                    .append($timeInput)));

                        var modal = new Modal("Create Event", $eventModalContent, [
                            {
                                text: "Create",
                                type: "primary",
                                click: function() {
                                    // verify the input is valid
                                    var inputValid = true;

                                    var eventName = $nameInput.val().trim();
                                    var eventDate = null;

                                    // verify name is not empty
                                    if (!eventName || !eventName.length) {
                                        // TODO show error for invalid name
                                        inputValid = false;
                                    }

                                    // verify date is legal
                                    var timestamp = Date.parse($dateInput.val() + " " + $timeInput.val());
                                    if (!Number.isNaN(timestamp)) {
                                        eventDate = new Date(timestamp);
                                    } else {
                                        // TODO show error for invalid date.
                                        inputValid = false;
                                    }
                                    
                                    if (inputValid) {
                                        // create event, then hide the modal
                                        page.addCircle(position, "event", eventName, {
                                            success:
                                                function(element, data) {
                                                    var $element = $(element);

                                                    projectToAdd = new Project(
                                                        page.eltSpaceToZoomSpace({
                                                            x: position.x / page.viewport.zoom,
                                                            y: position.y / page.viewport.zoom
                                                        }),
                                                        element,
                                                        data);

                                                    projectToAdd.theme = BUILTIN_THEMES["poly_2"]; // Default theme for a new project

                                                    // event info
                                                    projectToAdd.eventInfo = {
                                                        "date"        : eventDate.getTime(),
                                                        "location"    : "no location", // TODO: make this use google maps api?? 
                                                        "userInfo"    : "",
                                                        "acknowledged": false,
                                                    };

                                                    // set 'valueBefore' property, so it doesn't act like we need to enter the name
                                                    element.valueBefore = eventName;
                                                    
                                                    page.addProject(projectToAdd);

                                                    // hide modal once project is created
                                                    modal.hide();
                                                },
                                            click:
                                                function() {
                                                    if (projectToAdd != null) {
                                                        viewspace.handleObjectClick(projectToAdd);
                                                    }
                                                }
                                            });
                                    }
                                }
                            },
                            {
                                text: "Cancel",
                                click: function() {
                                    // hide the modal
                                    modal.hide();
                                }
                            }
                        ]);

                        modal.show();
                        $nameInput.select();
                    }
                },
                {
                    title: "Pin",
                    url  : "img/shapes/pin.png"
                },
                {
                    title: "Sticky",
                    url  : "img/shapes/sticky.png",
                    select: function() {
                        page.addCircle(position, "sticky", "", {
                        success:
                            function(element, data) {
                                var $element = $(element);
                                
                                projectToAdd = new Project(
                                    page.eltSpaceToZoomSpace({
                                        x: position.x / page.viewport.zoom,
                                        y: position.y / page.viewport.zoom
                                    }),
                                    element,
                                    data);

                                projectToAdd.theme = BUILTIN_THEMES["poly_2"]; // Default theme for a new project
                                
                                page.addProject(projectToAdd);
                            },
                        click:
                            function() {
                                if (projectToAdd != null) {
                                    viewspace.handleObjectClick(projectToAdd);
                                }
                            }
                        });
                    }
                },
                {
                    title: "Project",
                    url  : "img/shapes/circle.png",
                    select: function() {
                        page.addCircle(position, "group", null, {
                        success:
                            function(element, data) {
                                var $element = $(element);
                                
                                projectToAdd = new Project(
                                    page.eltSpaceToZoomSpace({
                                        x: position.x / page.viewport.zoom,
                                        y: position.y / page.viewport.zoom
                                    }),
                                    element,
                                    data);

                                projectToAdd.theme = BUILTIN_THEMES["poly_2"]; // Default theme for a new project
                                projectToAdd.viewport = {
                                    zoom: 1.0,
                                    zoomLevel: 0,
                                    left: 0,
                                    top : 0
                                };
                                
                                page.addProject(projectToAdd);
                            },
                        click:
                            function() {
                                if (projectToAdd != null) {
                                    viewspace.handleObjectClick(projectToAdd);
                                }
                            }
                        });
                    }
                },
                {
                    title: "Task",
                    url  : "img/shapes/todo.png"
                },
            ];

            var showRadialMenu = function($element, position) {
                var SELECTOR_SIZE = 250;
                var HALF_SELECTOR_SIZE = SELECTOR_SIZE / 2;
                var NUM_SHAPES = RADIAL_MENU_ITEMS.length;
                var DEG_STEP = 360 / NUM_SHAPES;

                var $blurredBackground = $("<div>")
                    .addClass("blurred-background")
                    .css({
                        "opacity": 0
                    });

                var $radialMenu = $("<ul>")
                    .addClass("radial-menu")
                    .css({
                        "width"  : SELECTOR_SIZE.toString() + "px",
                        "height" : SELECTOR_SIZE.toString() + "px",
                        "left"   : (position.x - HALF_SELECTOR_SIZE).toString() + "px",
                        "top"    : (position.y - HALF_SELECTOR_SIZE).toString() + "px",
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
                    .append($("<h2>")
                        .addClass("radial-menu-title")
                        .append("Create"))

                var degrees = 0;

                RADIAL_MENU_ITEMS.forEach(function(item) {
                    $radialMenu.append($("<li>")
                        .append($("<img src=\"" + item.url + "\">"))
                        .hover(function() {
                            $(".radial-menu-title").html(item.title);
                        }, function() {
                            $(".radial-menu-title").html("Create");
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
                            "transform": "rotate(" + degrees + "deg) translate(" + (HALF_SELECTOR_SIZE - 40) + "px) rotate(" + (-1 * degrees) + "deg)"
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

                $radialMenu.attr("tabindex", -1).focus();
            };

            showRadialMenu($element, position);
        }
    }).on("mousedown touchstart", function(e) {
        var $this = $(this);
        var $offset = $this.offset();
        var $target = $(e.target);

        if (e.type == "touchstart") {
            viewspace.mousePosition = {
                x: e.touches[0].pageX - $offset.left,
                y: e.touches[0].pageY - $offset.top
            };
        }

        if ($target.is($this)) {
            viewspace.mouseHoldId = window.setTimeout(function() {
                showRipple = true;
            }, 250);

            $this.css("cursor", "move");
            viewspace.isPanning = true;
        }
    }).on("mousemove touchmove", function(e) {
        var $this = $(this);
        var $offset = $this.offset();

        var newPos = null;

        if (e.type == "touchmove") {
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
    var $videoWrapper = $element.find(".video-wrapper");
    var $background = null;

    if ($videoWrapper.length > 0) {
        switch (this.theme.backgroundType) {
        case BackgroundType.VIDEO:
            $background = $("<video playsinline autoplay muted loop>")
                .append($("<source src=\"" + this.theme.backgroundUrl + "\" type=\"video/mp4\">"));
            break;
        case BackgroundType.IMAGE:
            $background = $("<img src=\"" + this.theme.backgroundUrl + "\">");
            break;
        }

        $background.addClass("video-bg");

        if (this.theme.blurAmt > 0) {
            $background.css("filter", "blur(" + this.theme.blurAmt.toString() + "px)");
        } else {
            $background.css("filter", "");
        }

        $videoWrapper.html($background);
    }
};

Page.prototype.addProject = function(project) {
    // add project to DB
    var projectsRef = null;
    if (this.pageProject !== undefined && this.pageProject !== null) {
        projectsRef = this.pageProject.ref
            .child("subnodes");
    } else {
        projectsRef = database.ref("users")
            .child(loggedUser.key)
            .child("projects");
    }

    var projectObject = project;
    delete projectObject.element;
    project.ref = projectsRef.push(projectObject);
    this.projects.push(project);
};

Page.prototype.show = function() {
    $("#page-content").html(this.element);
    if (this.theme !== undefined && this.theme !== null) {
        this.loadTheme();
    }
};

Page.prototype.clearProjectElements = function() {
    $(this.element)
        .find(".project-circle")
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
                .css("fill", project.data.color);

    var $projectCircleElement = $("<div>")
        .addClass("project-circle")
        .css({
            "left": (absPosition.x * ZOOM - HALF_SIZE).toString() + "px",
            "top" : (absPosition.y * ZOOM - HALF_SIZE).toString() + "px",
            "width" : SIZE_ZOOMED.toString() + "px",
            "height": SIZE_ZOOMED.toString() + "px",
            "font-size": roundTo(SIZE_ZOOMED / 10, 1).toString() + "px",
            "opacity": 0
        })
        .append(createActionsMenu())
        .animate({ "opacity": 1 }, animationTime)
        .append($("<div>")
            .addClass("project-image")
            .append($projImg))
        .append($("<div>")
            .addClass("project-circle-text")
            .append($("<div>")
                .addClass("project-title-div")
                .append(project.data.name)));

    // bind click, double click, lose focus events
    bindProjectElementEvents($projectCircleElement, project.data, {
        success: function(element, data) {
            // TODO change project name in db?
            console.log("Success editing element: ", element, "data: ", data);
        },
        click: function() {
            viewspace.handleObjectClick(project);
        },
    });

    // set element properties
    $projectCircleElement.valueBefore  = project.data.name;

    return $projectCircleElement;
};

/** Create visual elements for all objects in projects array */
Page.prototype.loadProjectElements = function() {
    var $element = $(this.element);
    for (var i = 0; i < this.projects.length; i++) {
        $element.append(this.loadProjectElement(this.projects[i], 
            Math.min(250 + ((i / this.projects.length) * 100), 500)));
    }
};

/** Load projects from database into the array */
Page.prototype.loadProjectsFromDatabase = function() {
    var projectsRef = null;
    if (this.pageProject !== undefined && this.pageProject !== null) {
        projectsRef = this.pageProject.ref
            .child("subnodes");
    } else {
        projectsRef = database.ref("users")
            .child(loggedUser.key)
            .child("projects");
    }

    (function(page) {
        projectsRef.once("value", function(snapshot) {
            var snapshotValue = snapshot.val();

            if (snapshotValue !== undefined && snapshotValue !== null) {
                var keys = Object.keys(snapshotValue);
                for (var i = 0; i < keys.length; i++) {
                    (function(key) {
                        var project = snapshotValue[key];
                        project.ref = projectsRef.child(key);
                        page.projects.push(project);
                    })(keys[i]);
                }
            }
            page.loadProjectElements();
        });
    })(this);
};

Page.prototype.addCircle = function(position, type, projectName, callbacks) {
    var data = {
        "name": projectName,
        "size": 200,
        "color": randomColor({ 
            "luminosity": "light", 
            "format": "rgb" 
        }),
        "type": type
    };

    var ZOOM = this.viewport.zoom;
    var SIZE_ZOOMED = data.size * ZOOM;
    var HALF_SIZE = SIZE_ZOOMED / 2;
    var FONT_SIZE = roundTo(SIZE_ZOOMED / 10, 1);

    var $projectCircleElement = $("<div>")
        .addClass("project-circle")
        .css({
            "position": "absolute",
            "background-color": "transparent",
            "left": position.x,
            "top" : position.y,
            "font-size": FONT_SIZE.toString() + "px",
        })
        .animate({
             "left": position.x - HALF_SIZE,
             "top" : position.y - HALF_SIZE,
             "width" : SIZE_ZOOMED.toString() + "px",
             "height": SIZE_ZOOMED.toString() + "px"
            },
            400, "easeOutBounce", function() {
                var $input = $(this).find("input");
                if ($input.length != 0) {
                    $input.select();
                }
            })
        .append(createActionsMenu().css("display", "none"))
        .append($("<div>")
            .addClass("project-image")
            .append(SVG_OBJECTS[PROJECT_CLASS_SVG_NAMES[data.type]]
                .clone()
                .css("fill", data.color)))
        .append($("<div>")
            .addClass("project-circle-text")
            .append($("<input type=\"text\">")
                .addClass("project-circle-text-edit")
                .val(!projectName ? "" : projectName)
                .css({
                    "font-size": FONT_SIZE.toString() + "px"
                })
                .on("keyup", function(e) {
                    if (e.keyCode == 13) {
                        // enter key pressed
                        viewspace.objectLoseFocus();
                    }
                }))
            );

    // set element properties
    $projectCircleElement.valueBefore  = data.name;

    // bind click, double click, lose focus events
    bindProjectElementEvents($projectCircleElement, data, callbacks);

    $(this.element).append($projectCircleElement);
    
    viewspace.setFocusedObject($projectCircleElement, data, callbacks);
    $projectCircleElement.attr("tabindex", -1).focus();
};

function bindProjectElementEvents(element, data, callbacks) {
    var $element = $(element);

    $element.click(function() {
        if (callbacks.click != undefined) {
            callbacks.click();
        }
    }).on("dblclick", function() {
        if (viewspace.itemClickTimeoutEnabled) {
            window.clearTimeout(viewspace.itemClickTimeoutId);
            viewspace.itemClickTimeoutEnabled = false;
        }

        // re-focus this object for editing.
        viewspace.setFocusedObject(element, data, callbacks);

        var name = $element.find(".project-title-div").text();

        var $holder = $element.find(".project-circle-text");
        var $edit   = $("<input type=\"text\">")
            .addClass("project-circle-text-edit")
            .val(name);

        $holder.html($edit);
        $edit.select();
    });
}

function createActionsMenu() {
    var $actionsMenu = $("<div>")
        .addClass("project-actions-menu");
    var $actionsMenuItems = $("<ul>");

    for (var i = 0; i < ACTION_MENU_ITEMS.length; i++) {
        (function(menuItem) {
            $actionsMenuItems.append($("<li>")
                .append("<img src=\"" + menuItem.imgUrl + "\">")
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