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
        x: (vec.x - ($element.width()  / 2) - $element.offset().left) + this.viewport.left,
        y: (vec.y - ($element.height() / 2) - $element.offset().top)  + this.viewport.top
    };
};

Page.prototype.zoomSpaceToEltSpace = function(vec) {
    var $element = $(this.element);
    return {
        x: ((vec.x - this.viewport.left) + ($element.width()  / 2) + $element.offset().left),
        y: ((vec.y - this.viewport.top)  + ($element.height() / 2) + $element.offset().top)
    };
};

Page.prototype.handlePanning = function(newPos) {
    var ZOOM = this.viewport.zoom;

    dragTime++;

    var diff = {
        x: newPos.x - mousePosition.x,
        y: newPos.y - mousePosition.y
    };

    this.viewport.left -= diff.x * PAN_THETA / ZOOM;
    this.viewport.top  -= diff.y * PAN_THETA / ZOOM;

    // update viewport
    if (this.pageProject != null && this.pageProject != undefined) {
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
            "left": "+=" + (diff.x * PAN_THETA).toString(),
            "top" : "+=" + (diff.y * PAN_THETA).toString()
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
        if (!hasFocusedObject()) {
            var delta;
            if (e.originalEvent.wheelDelta !== undefined) {
                delta = e.originalEvent.wheelDelta;
            } else {
                delta = e.originalEvent.deltaY * -1;
            }

            var deltaSign = Math.sign(delta);
            var nextZoom = page.viewport.zoom + (deltaSign * ZOOM_STEP);
            var oldZoom  = page.viewport.zoom;

            mousePosition = {
                x: e.pageX - $element.offset().left,
                y: e.pageY - $element.offset().top
            };

            if (nextZoom >= MIN_ZOOM && nextZoom <= MAX_ZOOM) {
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

                    var currentLeft = $this.position().left;
                    var currentTop  = $this.position().top;
                    var currentWidth  = $this.width();
                    var currentHeight = $this.height();
                    var newWidth  = 200 * page.viewport.zoom;
                    var newHeight = 200 * page.viewport.zoom;

                    $this.css({
                        "width" : newWidth.toString(),
                        "height": newHeight.toString(),
                        "left": (((currentLeft + (currentWidth / 2)) / oldZoom - viewportOffset.x) * page.viewport.zoom - (newWidth  / 2)).toString() + "px",
                        "top" : (((currentTop  + (currentWidth / 2)) / oldZoom - viewportOffset.y) * page.viewport.zoom - (newHeight / 2)).toString() + "px"
                    });
                });

                // update database with the viewport data
                if (page.pageProject != null && page.pageProject != undefined) {
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

            page.addCircle(position, {
                success:
                    function(element) {
                        var $element = $(element);

                        var name = "";
                        var $input = $element.find(".project-circle-text").find("input");

                        if ($input.length > 0) {
                            name = $input.val();
                        } else {
                            name = $element.find(".project-title-div").text();
                        }

                        projectToAdd = new Project(
                            name, 
                            page.eltSpaceToZoomSpace({
                                "x": position.x / page.viewport.zoom,
                                "y": position.y / page.viewport.zoom
                            }),
                            element,
                            element.projectClass);

                        projectToAdd.color = element.fillColor;

                        projectToAdd.theme = BUILTIN_THEMES["poly_2"]; /* Default theme for a new project */

                        switch (element.projectClass) {
                        case "group":
                            projectToAdd.viewport = {
                                "zoom": 1.0,
                                "zoomLevel": 0,
                                "left": 0,
                                "top" : 0
                            };
                            break;
                        case "event":
                            projectToAdd.eventInfo = {
                                "date"    : new Date().toString(), /* TODO add date/time picker */
                                "location": "no location", /* TODO: make this use google maps api?? */
                                "userInfo": ""
                            };
                            break;
                        default:
                            console.log("Unknown project class " + element.projectClass.toString());
                            break;
                        }

                        page.addProject(projectToAdd);
                    },
                click:
                    function() {
                        if (projectToAdd != null) {
                            if (itemClickTimeoutOn) {
                                clearTimeout(itemClickTimeoutId);
                                itemClickTimeoutOn = false;
                            } else {
                                if (hasFocusedObject()) {
                                    objectLoseFocus();
                                } else {
                                    handleObjectClick(projectToAdd);
                                }
                            }
                        }
                    }
                });
        }
    }).on("mousedown touchstart", function(e) {
        var $this = $(this);
        var $offset = $this.offset();
        var $target = $(e.target);

        if (e.type == "touchstart") {
            mousePosition = {
                x: e.touches[0].pageX - $offset.left,
                y: e.touches[0].pageY - $offset.top
            };
        }

        if ($target.is($this)) {
            mouseHoldId = setTimeout(function() {
                showRipple = true;
            }, 250);

            $this.css("cursor", "move");
            panning = true;
        }
    }).on("mousemove touchmove", function(e) {
        var $this = $(this);
        var $offset = $this.offset();

        var newPos = {};

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

        if (panning) {
            page.handlePanning(newPos);
        }

        mousePosition = newPos;
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
        $videoWrapper.empty();

        switch (this.theme.backgroundType) {
        case BackgroundType.VIDEO:
            $background = $("<video playsinline autoplay muted loop class=\"video-bg\">")
                .append($("<source src=\"" + this.theme.backgroundUrl + "\" type=\"video/mp4\">"));
            break;
        case BackgroundType.IMAGE:
            $background = $("<img class=\"video-bg\" src=\"" + this.theme.backgroundUrl + "\">");
            break;
        }

        if (this.theme.blurAmt > 0) {
            $background.css("filter", "blur(" + this.theme.blurAmt.toString() + "px)");
        } else {
            $background.css("filter", "");
        }

        $videoWrapper.append($background);
    }
};

Page.prototype.addProject = function(project) {
    // add project to DB
    var projectsRef = null;
    if (this.pageProject != null && this.pageProject != undefined) {
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
    var $pageContent = $("#page-content");
    $pageContent.empty();
    $pageContent.append(this.element);

    if (this.theme != undefined && this.theme != null) {
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
    var SIZE = 200;
    var ZOOM = this.viewport.zoom;
    var SIZE_ZOOMED = SIZE * ZOOM;
    var HALF_SIZE = SIZE_ZOOMED / 2;

    var absPosition = this.zoomSpaceToEltSpace(project.position);

    var $projectCircleElement = $("<div>")
        .addClass("project-circle")
        .css({
            "left": (absPosition.x * ZOOM - HALF_SIZE).toString() + "px",
            "top" : (absPosition.y * ZOOM - HALF_SIZE).toString() + "px",
            "width" : SIZE_ZOOMED.toString() + "px",
            "height": SIZE_ZOOMED.toString() + "px",
            "opacity": 0
        })
        .animate({ "opacity": 1 }, animationTime)
        .append($("<i class=\"fa fa-times-circle close-project-btn\">"))
        .append(SVG_OBJECTS[PROJECT_CLASS_SVG_NAMES[project.projectClass]].clone().css("fill", project.color))
        .append($("<div>")
            .addClass("project-circle-text")
            .append($("<div>")
                .addClass("project-title-div")
                .append(project.name)));

    /*var $clickElement = $projectCircleElement.find("svg");
    if ($clickElement.length == 0) {
        $clickElement = $projectCircleElement;
    }*/

    // bind click, double click, lose focus events
    bindProjectElementEvents($projectCircleElement, {
        click: function() {
            if (itemClickTimeoutOn) {
                clearTimeout(itemClickTimeoutId);
                itemClickTimeoutOn = false;
            } else {
                if (hasFocusedObject()) {
                    objectLoseFocus();
                } else {
                    handleObjectClick(project);
                }
            }
        }
    });

    // set element properties
    $projectCircleElement.valueBefore = project.name;
    $projectCircleElement.projectClass = project.projectClass;

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
    if (this.pageProject != null && this.pageProject != undefined) {
        projectsRef = this.pageProject.ref
            .child("subnodes");
    } else {
        projectsRef = database.ref("users")
            .child(loggedUser.key)
            .child("projects");
    }

    var page = this;

    projectsRef.once("value", function(snapshot) {
        var snapshotValue = snapshot.val();

        if (snapshotValue != undefined && snapshotValue != null) {
            var keys = Object.keys(snapshotValue);
            for (var i = 0; i < keys.length; i++) {
                (function(key) {
                    var project = snapshotValue[key];
                    project.ref = projectsRef.child(key);
                    page.projects.push(project);

                    console.log("Load project: ", project);
                })(keys[i]);
            }
        }

        page.loadProjectElements();
    });
};

Page.prototype.addCircle = function(position, callbacks) {
    var circleInfo = {
        size: 200,
        color: randomColor({ luminosity: "light", format: "rgb" }),
        projectClass: "group"
    };

    var ZOOM = this.viewport.zoom;
    var SIZE_ZOOMED = circleInfo.size * ZOOM;
    var HALF_SIZE = SIZE_ZOOMED / 2;
    var NUM_SHAPES = 4;
    var DEG_ACCUM = 360 / NUM_SHAPES;

    var $projectCircleElement = $("<div>")
        .addClass("project-circle")
        .css({
            "position": "absolute",
            "background-color": "transparent",
            "left": position.x,
            "top" : position.y,
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
        .append($("<i class=\"fa fa-times-circle close-project-btn\">"))
        .append(SVG_OBJECTS[PROJECT_CLASS_SVG_NAMES[circleInfo.projectClass]].clone().css("fill", circleInfo.color))
        .append($("<div>")
            .addClass("project-circle-text")
            .append($("<input type=\"text\">")
                .addClass("project-circle-text-edit")));

    // set element properties
    $projectCircleElement.fillColor    = circleInfo.color;
    $projectCircleElement.projectClass = circleInfo.projectClass;

    var changeProjectClass = function(newProjectClass) {
        if ($projectCircleElement.projectClass != newProjectClass) {
            if ($projectCircleElement.projectClass == "event") {
                // remove event related info.
                $projectCircleElement.remove(".project-event-info");
            }

            if (newProjectClass == "event") {
                // show the "New Event" modal

                $("#dialog").dialogBox({
                    "title": "Create Event",
                    "content": createCalendarElement(),
                    "effect": "sign",
                    "hasBtn": true,
                    "confirmValue": "OK",
                    "cancelValue" : "Cancel",
                    "confirm": function() {
                        // todo
                    },
                    "callback": function() {
                    }
                });
            }

            // re-create element
            $projectCircleElement.find("svg")
                .html(SVG_OBJECTS[PROJECT_CLASS_SVG_NAMES[newProjectClass]].clone());
            $projectCircleElement.projectClass = newProjectClass;
        }

        // go back to input focus
        var $input = $projectCircleElement.find("input");
        if ($input.length != 0) {
            $input.select();
        }
    };

    var $itemTypeSelector = $("<ul>")
        .addClass("circle-container")
        .css({
            position: "absolute",
            width: "100%",
            height: "100%"
        })
        .append($("<li>")
            .append($("<div>").append($("<img src=\"img/shapes/star.png\">"))
            .append($("<span>").append("Event")))
            .click(function() { 
                changeProjectClass("event");
            }))
        .append($("<li>")
            .append($("<div>").append($("<img src=\"img/shapes/triangle.png\">"))
            .append($("<span>").append("Reminder")))
            .click(function() { changeProjectClass("reminder"); }))
        .append($("<li>")
            .append($("<div>").append($("<img src=\"img/shapes/heart.png\">"))
            .append($("<span>").append("Favourite")))
            .click(function() { changeProjectClass("favourite"); }))
        .append($("<li>")
            .append($("<div>").append($("<img src=\"img/shapes/circle.png\">"))
            .append($("<span>").append("Group")))
            .click(function() { changeProjectClass("group"); }));

    /*var $clickElement = $projectCircleElement.find("svg");
    if ($clickElement.length == 0) {
        $clickElement = $projectCircleElement;
    }*/

    // bind click, double click, lose focus events
    bindProjectElementEvents($projectCircleElement, callbacks);

    $(this.element)
        .append($projectCircleElement
            .append($itemTypeSelector));

    setFocusedObject($projectCircleElement, callbacks);

    $projectCircleElement.attr("tabindex", -1).focus();

    $itemTypeSelector.animate({
        opacity: 1
    }, 200);

    for (var i = 0; i < NUM_SHAPES; i++) {
        var DEG = i * DEG_ACCUM;
        $(".circle-container>:nth-of-type(" + (i + 1) + ")").css({
            "opacity": 1,
            "transform": "rotate(" + DEG + "deg) translate(" + HALF_SIZE + "px) rotate(" + (-1 * DEG) + "deg)"
        });
    }
};

function bindProjectElementEvents(element, callbacks) {
    $(element).click(function() {
        if (callbacks.click != undefined) {
            callbacks.click();
        }
    }).on("dblclick", function() {
        if (itemClickTimeoutOn) {
            clearTimeout(itemClickTimeoutId);
            itemClickTimeoutOn = false;
        }

        // re-focus this object for editing.
        setFocusedObject(element, { });

        var name = $(element).find(".project-title-div").text();
        var holder = $(element).find(".project-circle-text");
        var edit = $("<input type=\"text\">")
            .addClass("project-circle-text-edit");

        edit.val(name);

        holder.empty();
        holder.append(edit);

        edit.select();
    });
}