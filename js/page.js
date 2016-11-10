const ZOOM_THETA = 0.05;

function Page(name, element, theme, pageProject, viewport) {
    this.name = name;
    this.element = element;
    this.theme = theme;
    this.projects = [];
    this.pageProject = pageProject;
    this.viewport = viewport;
}

Page.prototype.unbindEvents = function() {
    this.element.unbind();
};

Page.prototype.bindEvents = function() {
    $(this.element)
        .find(".project-circle")
        .each(function() {
            console.log($(this));
        });

    var me = this;
    $(this.element).bind("wheel mousewheel", function(e) {
        if (e.ctrlKey) {
            // on ctrl + scroll, zoom in on each circle element
            var delta;

            if (e.originalEvent.wheelDelta !== undefined) {
                delta = e.originalEvent.wheelDelta;
            } else {
                delta = e.originalEvent.deltaY * -1;
            }

            var deltaSign = Math.sign(delta);
            var nextZoom = me.viewport.zoom + deltaSign;

            mousePosition = {
                x: e.pageX,
                y: e.pageY
            };

            if (nextZoom > MIN_ZOOM && nextZoom < MAX_ZOOM) {
                me.viewport.viewLeft = mousePosition.x;
                me.viewport.viewTop  = mousePosition.y;
                me.viewport.zoom = nextZoom;
                $(".project-circle").each(function() {
                    // zoom in on the element
                    var diff = {
                        x: (me.viewport.viewLeft - $(this).position().left) * ZOOM_THETA,
                        y: (me.viewport.viewTop  - $(this).position().top)  * ZOOM_THETA
                    };

                    $(this).css({
                        "width" : "+=" + (deltaSign * 10).toString(),
                        "height": "+=" + (deltaSign * 10).toString(),
                        "left": "-=" + (diff.x * deltaSign).toString(),
                        "top" : "-=" + (diff.y * deltaSign).toString()
                    });
                });

                // update database with the viewport data
                if (me.pageProject != null && me.pageProject != undefined) {
                    me.pageProject.viewport = me.viewport;
                    me.pageProject.ref.child("viewport").set(me.viewport);
                } else {
                    database.ref("users")
                        .child(loggedUser.key)
                        .child("viewport")
                        .set(me.viewport);
                }
            }
        }
    }).dblclick(function(event) {
        if (event.target == this) {
            // add project item
            var position = {
                x: event.pageX - $(this).offset().left,
                y: event.pageY - $(this).offset().top
            };

            let projectToAdd = null;

            me.addCircle(position, {
                success:
                    function(element) {
                        var name = "";

                        var input = $(element).find(".project-circle-text").find("input");
                        if (input.length > 0) {
                            name = input.val();
                        } else {
                            name = $(element).find(".project-title-div").text();
                        }

                        projectToAdd = new Project(name, position, element);

                        var diff = {
                            x: (me.viewport.viewLeft - position.x) * ZOOM_THETA,
                            y: (me.viewport.viewTop  - position.y) * ZOOM_THETA
                        };

                        var newPosition = {
                            x: position.x + (diff.x * me.viewport.zoom),
                            y: position.y + (diff.y * me.viewport.zoom)
                        };

                        projectToAdd.position = newPosition;

                        projectToAdd.color = element.css("background-color");
                        projectToAdd.viewport = {
                            zoom: 0,
                            viewLeft: 0,
                            viewTop: 0
                        };
                        projectToAdd.theme = themes["poly_2"]; /* Default theme for a new project */
                        me.addProject(projectToAdd);
                    },
                click:
                    function() {
                        if (projectToAdd !== null) {
                            // open the clicked project page
                            var pageBefore = currentPage;
                            pageBefore.unbindEvents();
                            pageBefore.clearProjectElements();

                            currentPage = new Page(projectToAdd.name,
                                $("<div class=\"page\">")
                                    .append("<div class=\"video-wrapper\">"),
                                    projectToAdd.theme, projectToAdd,
                                    // create new viewport object for the newly created page.
                                    {
                                        zoom: 0,
                                        viewLeft: 0,
                                        viewTop: 0
                                    });

                            currentPage.parentPage = pageBefore;
                            currentPage.bindEvents();
                            currentPage.show();

                            updateBreadcrums();
                        }
                    }
                });
        }
    }).mousedown(function(e) {
        var target = $(e.target);
        if (target.is($(this))) {
            mouseHoldId = setTimeout(function() {
                showRipple = true;
            }, 250);

            if (!panning) {
                $(this).css("cursor", "-webkit-grab");
            }
            panning = true;
        } else if (target.is(".project-circle")){
            console.log("mousedown on circle");
        }
    }).mousemove(function(e) {
        var newPos = {
            x: e.pageX,
            y: e.pageY
        };

        const PAN_THETA = 0.5;

        if (panning) {
            dragTime++;
            var diff = {
                x: newPos.x - mousePosition.x,
                y: newPos.y - mousePosition.y
            };

            $(".project-circle").each(function() {
                $(this).css({
                    "left": "+=" + (diff.x * PAN_THETA).toString(),
                    "top" : "+=" + (diff.y * PAN_THETA).toString()
                });
            });
        }
        mousePosition = newPos;
    });
};

Page.prototype.setTheme = function(theme) {
    this.theme = theme;
    this.loadTheme();
};

Page.prototype.loadTheme = function() {
    var videoWrapper = $(this.element).find(".video-wrapper");

    if (videoWrapper.length > 0) {
        videoWrapper.empty();

        var background = null;

        if (this.theme.backgroundType == BackgroundType.VIDEO) {
            background = $("<video playsinline autoplay muted loop class=\"video-bg\">")
                .append($("<source src=\"" + this.theme.backgroundUrl + "\" type=\"video/mp4\">"));
        } else if (this.theme.backgroundType == BackgroundType.IMAGE) {
            background = $("<img class=\"video-bg\" src=\"" + this.theme.backgroundUrl + "\">");
        }

        if (this.theme.blurAmt > 0) {
            background.css("filter", "blur(" + this.theme.blurAmt.toString() + "px)");
        } else {
            background.css("filter", "");
        }

        videoWrapper.append(background);
    }
};

Page.prototype.addProject = function(project) {
    // add project to DB
    var projectsRef = null;
    if (this.pageProject != null && this.pageProject != undefined) {
        projectsRef = this.pageProject.ref.child("subnodes");
    } else {
        projectsRef = database.ref("users")
            .child(loggedUser.key)
            .child("projects");
    }

    var projectObject = {
        "name": project.name,
        "position": project.position,
        "color": project.color,
        "viewport": project.viewport,
        "theme": project.theme
    };

    project.ref = projectsRef.push(projectObject);

    this.projects.push(project);
};

Page.prototype.show = function() {
    var pageContent = $("#page-content");
    pageContent.empty();
    pageContent.append(this.element);

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

/** Create visual elements for all objects in projects array */
Page.prototype.loadProjectElements = function() {
    for (let i = 0; i < this.projects.length; i++) {
        const size = 200;
        const SIZE_ZOOMED = size + (this.viewport.zoom * 10);

        let project = this.projects[i];
        let position = project.position;
        let absPosition = {
            x: position.x - (SIZE_ZOOMED / 2),
            y: position.y - (SIZE_ZOOMED / 2)
        };
        let diff = {
            x: (this.viewport.viewLeft - position.x) * ZOOM_THETA,
            y: (this.viewport.viewTop  - position.y) * ZOOM_THETA
        };

        let projectCircleElement = $("<div>")
            .addClass("project-circle")
            .css({
                "position": "absolute",
                "background-color": project.color,
                "left": position.x - (diff.x * this.viewport.zoom),
                "top" : position.y - (diff.y * this.viewport.zoom),
                "width" : SIZE_ZOOMED.toString() + "px",
                "height": SIZE_ZOOMED.toString() + "px",
                "opacity": 0
            })
            .animate({
                "opacity": 1
            }, Math.min(250 + ((i / this.projects.length) * 100), 500))
            .append($("<div>")
                .addClass("project-circle-text")
                .append($("<div>")
                    .addClass("project-title-div")
                    .append(project.name)));

        let callbacks = {
            click: function() {
                // open the clicked project page
                var pageBefore = currentPage;
                pageBefore.unbindEvents();
                pageBefore.clearProjectElements();

                currentPage = new Page(project.name,
                    $("<div class=\"page\">")
                        .append("<div class=\"video-wrapper\">"),
                        project.theme,
                        project, project.viewport);

                currentPage.loadProjectsFromDatabase();
                currentPage.parentPage = pageBefore;
                currentPage.bindEvents();
                currentPage.show();

                updateBreadcrums();
            }
        };

        projectCircleElement.valueBefore = project.name;
        // bind click, double click, lose focus events
        bindProjectElementEvents(projectCircleElement, callbacks);
        $(this.element).append(projectCircleElement);
    }
};

/** Load projects from database into the array */
Page.prototype.loadProjectsFromDatabase = function() {
    var projectsRef = null;
    if (this.pageProject != null && this.pageProject != undefined) {
        projectsRef = this.pageProject.ref.child("subnodes");
    } else {
        projectsRef = database.ref("users")
            .child(loggedUser.key)
            .child("projects");
    }

    var me = this;

    projectsRef.once("value", function(snapshot) {
        var snapshotValue = snapshot.val();

        if (snapshotValue != undefined && snapshotValue != null) {
            let keys = Object.keys(snapshotValue);
            for (let i = 0; i < keys.length; i++) {
                let project = snapshotValue[keys[i]];
                project.ref = projectsRef.child(keys[i]);
                me.projects.push(project);
            }
        }

        me.loadProjectElements();
    });
};

Page.prototype.addCircle = function(position, callbacks) {
    var circleInfo = {
        size: 200,
        color: randomColor({luminosity: "light", format: "rgb"}),
    };

    const SIZE_ZOOMED = circleInfo.size + (this.viewport.zoom * 10);

    const ANIM_TIME = 200;
    const HOVER_COLORS = [
        "orange",
        "lime",
        "crimson",
        "royalblue"
    ];

    var itemTypeSelector = $("<ul>")
        .addClass("circle-container")
        .css({
            position: "absolute",
            width: "100%",
            height: "100%"})
        .append($("<li>")
            .append($("<img src=\"img/shapes/star.svg\" class=\"svg\">")))
        .append($("<li>")
            .append($("<img src=\"img/shapes/triangle.svg\" class=\"svg\">")))
        .append($("<li>")
            .append($("<img src=\"img/shapes/heart.svg\" class=\"svg\">")))
        .append($("<li>")
            .append($("<img src=\"img/shapes/circle.svg\" class=\"svg\">")));

    var absPosition = {
        x: position.x - (SIZE_ZOOMED / 2),
        y: position.y - (SIZE_ZOOMED / 2)
    };

    var projectCircleElement = $("<div>")
        .addClass("project-circle")
        .css({
            "position": "absolute",
            "background-color": circleInfo.color,
            "left": position.x,
            "top" : position.y,
        })
        .animate({
             "left": absPosition.x,
             "top" : absPosition.y,
             "width" : SIZE_ZOOMED.toString() + "px",
             "height": SIZE_ZOOMED.toString() + "px"
            },
            400, "easeOutBounce", function() {
                $(this).find("input").select();
            })
        .append($("<div>")
            .addClass("project-circle-inner"))
        .append($("<div>")
            .addClass("project-circle-text")
            .append($("<input type=\"text\">")
                .addClass("project-circle-text-edit")));

    // bind click, double click, lose focus events
    bindProjectElementEvents(projectCircleElement, callbacks);

    $(this.element)
        .append(projectCircleElement
            .append(itemTypeSelector));

    itemTypeSelector.animate({
        opacity: 1
    }, ANIM_TIME);

    replaceSvg($(itemTypeSelector).find("img.svg"));

    const NUM_SHAPES = 4;
    const DEG_ACCUM = 360 / NUM_SHAPES;
    const HALF_SIZE = circleInfo.size / 2;

    for (let i = 0; i < NUM_SHAPES; i++) {
        const DEG = i * DEG_ACCUM;
        let item = $(".circle-container>:nth-of-type(" + (i+1) + ")");

        setTimeout(function() {
            item.find("svg path").css("fill", HOVER_COLORS[i]);
        }, 100);

        item.css({
            opacity: 1,
            transform: "rotate(" + DEG + "deg) translate(" + HALF_SIZE + "px) rotate(" + (-1 * DEG) + "deg)"
        });
    }
};

function elementLoseFocus(element, callbacks) {
    var txt = $(element).find(".project-circle-text");
    var edit = txt.find("input");

    if ($(edit).val() == "") {
        if (element.valueBefore == undefined) {
            // remove object if you don't enter a value the first time
            var left =  $(element).position().left + ($(element).width() / 2);
            var right = $(element).position().top  + ($(element).width() / 2);
            $(element).animate({
                "left": left,
                "top" : right,
                "width" : 0,
                "height": 0
            }, 200, "linear", function() {
                // remove it after the animation
                $(element).remove();
            });
        } else {
            // error, must enter a name
            $("#dialog").dialogBox({
                title: "Project Name Empty",
                content: "Please enter a name for the project.",
                effect: "sign",
                hasBtn: true,
                confirmValue: "OK",
                confirm: function() {
                    $(edit).select();
                },
                callback: function() {
                }
            });
        }
    } else {
        element.valueBefore = edit.val();
        // convert text element to div
        let replacementDiv = $("<div>")
            .addClass("project-title-div")
            .append(element.valueBefore);
        $(txt).append(replacementDiv);
        $(edit).remove();

        // remove object type selector
        var typeSelector = $(element).find(".circle-container");
        $(typeSelector).animate({
            "opacity": 0
        }, 150, "linear", function() {
            // remove it after the animation
            $(typeSelector).remove();
        })

        if (callbacks.success != undefined) {
            callbacks.success(element);
        }
    }
};

function bindProjectElementEvents(element, callbacks) {
    $(element).click(function() {
        if (callbacks.click != undefined) {
            callbacks.click();
        }
    }).dblclick(function() {
        var txt = $(element).find(".project-circle-text");
        var edit = $("<input type=\"text\">")
            .addClass("project-circle-text-edit")

        txt.empty();
        txt.append(edit);

        edit.select();
    }).focusout(function() {
        elementLoseFocus(element, callbacks);
    });
};