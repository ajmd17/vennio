function Page(element, theme) {
    this.element = element;
    this.theme = theme;
    this.projects = [];

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

            me.addCircle(position, {
                success:
                    function(element) {
                        var name = $(element).find(".project-circle-text").find("input").val();
                        me.addProject(new Project(name, position, element));
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

    var videoWrapper = $(this.element).find(".video-wrapper");
    videoWrapper.empty();

    var background = null;

    if (theme.backgroundType == BackgroundType.VIDEO) {
        background = $("<video playsinline autoplay muted loop class=\"video-bg\">")
            .append($("<source src=\"" + theme.backgroundUrl + "\" type=\"video/mp4\">"));
    } else if (theme.backgroundType == BackgroundType.IMAGE) {
        background = $("<img class=\"video-bg\" src=\"" + theme.backgroundUrl + "\">");
    }

    if (theme.blurAmt > 0) {
        background.css("filter", "blur(" + theme.blurAmt.toString() + "px)");
    } else {
        background.css("filter", "");
    }

    videoWrapper.append(background);
};

Page.prototype.addProject = function(project) {
    this.projects.push(project);
    // TODO: add project to DB here?
};

Page.prototype.reloadProjectElements = function() {
    $(this.element).clear();
    for (var i = 0; i < this.projects.length; i++) {
        $(this.element).append(this.projects[i].element);
    }
};

Page.prototype.addCircle = function(position, callbacks) {
    var circleInfo = {
        size: 200,
        color: randomColor({luminosity: "light", format: "rgb"}),
    };

    var sizeZoomed = circleInfo.size + (zoomData.zoom * 10);

    var projectCircleElement = $("<div>")
        .addClass("project-circle")

        .css({
            "position": "absolute",
            "background-color": circleInfo.color,
            "left": position.x,
            "top" : position.y })

        .animate({
             "left": position.x - (sizeZoomed / 2),
             "top" : position.y - (sizeZoomed / 2),
             "width" : sizeZoomed.toString() + "px",
             "height": sizeZoomed.toString() + "px"},

             400, "easeOutBounce", function() {
                 $(this).find("input").select();
             })
        .append($("<div>")
            .addClass("project-circle-inner"))
        .append($("<div>")
            .addClass("project-circle-text")
            .append($("<input type=\"text\">")
            .addClass("project-circle-text-edit")))

        // single-clicking a circle opens the project page
        .click(function() {
            // TODO
        })

        // double-clicking a circle allows you to edit the title
        .dblclick(function() {
            var txt = $(this).find(".project-circle-text");
            var edit = $("<input type=\"text\">")
                .addClass("project-circle-text-edit")

            txt.empty();
            txt.append(edit);

            edit.select();
        })

        .focusout(function() {
            elementLoseFocus(this, callbacks);
        });

    $(this.element).append(projectCircleElement);
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
                "top":  right,
                "width":  0,
                "height": 0
            }, 200, "linear", function() {
                // remove it after the animation
                $(element).remove();
            })
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
        let replacementDiv = $("<div>").append(element.valueBefore);
        $(txt).append(replacementDiv);
        $(edit).remove();

        if (callbacks.success != undefined) {
            callbacks.success(element);
        }
    }
}
