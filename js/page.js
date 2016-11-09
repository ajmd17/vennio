function Page(name, element, theme) {
    this.name = name;
    this.element = element;
    this.theme = theme;
    this.projects = [];
}

Page.prototype.unbindEvents = function() {
    this.element.unbind();
}

Page.prototype.bindEvents = function() {
    $(this.element)
        .find(".project-circle")
        .each(function() {
            console.log($(this));
        });

    var me = this;
    $(this.element).bind("wheel mousewheel", function(e) {
        if (e.ctrlKey) {
            var delta;

            if (e.originalEvent.wheelDelta !== undefined) {
                delta = e.originalEvent.wheelDelta;
            } else {
                delta = e.originalEvent.deltaY * -1;
            }

            var deltaSign = Math.sign(delta);
            var nextZoom = zoomData.zoom + deltaSign;

            zoomData.mousePosition = {
                x: e.pageX,
                y: e.pageY
            };

            if (nextZoom > MIN_ZOOM && nextZoom < MAX_ZOOM) {
                zoomData.zoom = nextZoom;
                $(".project-circle").each(function() {
                    zoomCircle(this, deltaSign, true);
                });
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
                        me.addProject(projectToAdd);
                    },
                click:
                    function() {
                        console.log(projectToAdd);
                        if (projectToAdd !== null) {
                            // open the clicked project page
                            var pageBefore = currentPage;
                            pageBefore.unbindEvents();
                            pageBefore.clearProjectElements();

                            currentPage = new Page(projectToAdd.name,
                                $("<div class=\"page\">")
                                    .append("<div class=\"video-wrapper\">"));

                            currentPage.parentPage = pageBefore;

                            // TODO: add all sub projects to page here
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

        if (panning) {
            var diff = {
                x: (newPos.x - (zoomData.mousePosition.x)) * 0.5,
                y: (newPos.y - (zoomData.mousePosition.y)) * 0.5
            };

            $(".project-circle").each(function() {
                $(this).css({
                    "left": "+=" + diff.x.toString(),
                    "top" : "+=" + diff.y.toString()
                });
            });
        }
        zoomData.mousePosition = newPos;
    });
}

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
}

Page.prototype.addProject = function(project) {
    this.projects.push(project);
    // TODO: add project to DB here?
};

Page.prototype.show = function() {
    var pageContent = $("#page-content");
    pageContent.empty();
    pageContent.append(this.element);

    if (this.theme != undefined && this.theme != null) {
        this.loadTheme();
    }
}

Page.prototype.clearProjectElements = function() {
    $(this.element)
        .find(".project-circle")
        .each(function() {
            $(this).remove();
        });
}

Page.prototype.addCircle = function(position, callbacks) {
    var circleInfo = {
        size: 200,
        color: randomColor({luminosity: "light", format: "rgb"}),
    };

    const SIZE_ZOOMED = circleInfo.size + (zoomData.zoom * 10);

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


    var projectCircleElement = $("<div>")
        .addClass("project-circle")
        .css({
            "position": "absolute",
            "background-color": circleInfo.color,
            "left": position.x,
            "top" : position.y })
        .animate({
             "left": position.x - (SIZE_ZOOMED / 2),
             "top" : position.y - (SIZE_ZOOMED / 2),
             "width" : SIZE_ZOOMED.toString() + "px",
             "height": SIZE_ZOOMED.toString() + "px"},

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
}

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
}