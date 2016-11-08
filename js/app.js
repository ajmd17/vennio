var sidebarVisible = false;
var panning = false;

const MIN_ZOOM = -10;
const MAX_ZOOM =  20;

var zoomData = {
    zoom: 0,
    viewLeft: 0,
    viewTop: 0,
    mousePosition: {
        x: 0,
        y: 0
    }
};

function randRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function mergeProperties(dst, src) {
    for (attr in src) {
        dst[attr] = src[attr];
    }
    return dst;
}

var BackgroundType = {
    IMAGE: 0,
    VIDEO: 1
};

function Theme(backgroundUrl, backgroundType, blurAmt) {
    this.backgroundUrl = backgroundUrl;
    this.backgroundType = backgroundType;
    this.blurAmt = blurAmt;
}

var themes = {
    "leaves": new Theme("videos/leaves.mp4", BackgroundType.VIDEO, 18),
    "stars":  new Theme("videos/stars.mp4", BackgroundType.VIDEO, 8),
    "woods":  new Theme("videos/woods.mp4", BackgroundType.VIDEO, 8),
    "autumn-leaf":  new Theme("videos/autumn-leaf.mp4", BackgroundType.VIDEO, 8),
    "poly":   new Theme("img/poly.png", BackgroundType.IMAGE, 0),
    "poly_2":   new Theme("img/poly_2.png", BackgroundType.IMAGE, 0),
    "hex":    new Theme("img/hex.png", BackgroundType.IMAGE, 6),
    "milky-way": new Theme("img/milky-way.jpg", BackgroundType.IMAGE, 5)
};
var currentTheme = null;

function Project(elt) {
    this.circle = {
        x: 0, // the X position of circle (only changes on drag)
        y: 0,
        size: 200,
        color: "#000",
        element: elt
    };
}

var projects = [];

function replaceSvg() {
    $("img.svg").each(function() {
        var $img = $(this);
        var imgID = $img.attr("id");
        var imgClass = $img.attr("class");
        var imgURL = $img.attr("src");

        $.get(imgURL, function(data) {
            var $svg = $(data).find("svg");

            if (imgID !== undefined) {
                $svg = $svg.attr("id", imgID);
            }
            if (imgClass !== undefined) {
                $svg = $svg.attr("class", imgClass + " replaced-svg");
            }

            $svg = $svg.removeAttr("xmlns:a");

            if (!$svg.attr("viewBox") && $svg.attr("height") && $svg.attr("width")) {
                $svg.attr("viewBox", "0 0 " + $svg.attr("height") + " " + $svg.attr("width"))
            }

            $img.replaceWith($svg);

        }, "xml");
    });
}

function setTheme(themeName) {
    var theme = themes[themeName];
    currentTheme = theme;
    var videoWrapper = $("#video-wrapper");
    videoWrapper.empty();
    if (theme.backgroundType == BackgroundType.VIDEO) {
        videoWrapper.append($("<video playsinline autoplay muted loop class=\"video-bg\">")
                    .append($("<source src=\"" + theme.backgroundUrl + "\" type=\"video/mp4\">")));
    } else if (theme.backgroundType == BackgroundType.IMAGE) {
        videoWrapper.append($("<img class=\"video-bg\" src=\"" + theme.backgroundUrl + "\">"));
    }

    $(".video-bg").css("filter", "blur(" + theme.blurAmt.toString() + "px)");
}

function zoomCircle(circle, sign, zooming) {
    var diff = {
        x: (zoomData.mousePosition.x - $(circle).position().left) * 0.05,
        y: (zoomData.mousePosition.y - $(circle).position().top) * 0.05
    };

    $(circle).css({
        "width": "+=" + (sign * 10).toString(),
        "height": "+=" + (sign * 10).toString()
    });

    $(circle).css({
        "left": "-=" + (diff.x * sign).toString(),
        "top": "-=" + (diff.y * sign).toString()
    });
}

function addProjectCircle(x, y) {
    var size = 200;//randRange(160, 300);
    var sizeZoomed = size + (zoomData.zoom * 10);
    var rgb = randomColor({luminosity: "light", format: "rgb"});
    var values = rgb.substring(rgb.indexOf('(') + 1, rgb.lastIndexOf(')')).split(/,\s*/);
    var color = "rgba(" + values[0] + ", " + values[1] + ", " + values[2] + ", 1.0)";

    var leaveFocus = function(circle, edit, txt) {
        if ($(edit).val() == "") {
            if (circle.valueBefore == undefined) {
                // remove object if you don't enter a value the first time
                var x = $(circle).position().left;
                var y = $(circle).position().top;
                var size = $(circle).width();
                $(circle).animate({
                    "left": x + (size / 2),
                    "top":  y + (size / 2),
                    width: 0,
                    height: 0
                }, 200, "linear", function() {
                    $(circle).remove();
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
            var value = $(edit).val();
            circle.valueBefore = value;
            // now recreate div
            var replacementDiv = $("<div>")
                .append(value);

            $(txt).append(replacementDiv);
            $(edit).remove();
        }
    };

    var circleElement = $("<div>").addClass("project-circle")
            .css({"position": "absolute",
                  "background-color": color,
                  "left": x,
                  "top":  y })
            .animate({
                   "left": x - (sizeZoomed / 2),
                   "top": y - (sizeZoomed / 2),
                   "width": sizeZoomed.toString() + "px",
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
                var circle = this;
                var txt = $(this).find(".project-circle-text");
                txt.empty();

                var edit = $("<input type=\"text\">")
                    .addClass("project-circle-text-edit")
                txt.append(edit);
                edit.select();
            })
            .focusout(function() {
                var txt = $(this).find(".project-circle-text");
                var edit = txt.find("input");
                leaveFocus(this, edit, txt);
            });

    $("#main-content").append(circleElement);

    var project = new Project(circleElement);
    project.circle.x = x;
    project.circle.y = y;
    project.circle.size = size;
    project.circle.color = color;
    projects.push(project);
}

function afterLogin() {
    if (loggedUser.currentThemeName == undefined ||
        loggedUser.currentThemeName == null) {
        loggedUser.currentThemeName = "poly";
    }

    setTheme(loggedUser.currentThemeName);

    var animTime = 500;
    var endSize = 10;
    var hoverColors = [
        "orange",
        "lime",
        "crimson",
        "royalblue"
    ];

    replaceSvg();

    $(".circle-container")
        .animate({
            width: endSize + "em",
            height: endSize + "em",
            opacity: 1,
        });

    const NUM_SHAPES = 4;
    const DEG_ACCUM = 360 / NUM_SHAPES;
    const HALF_SIZE = endSize / 2;

    for (let i = 0; i < NUM_SHAPES; i++) {
        const DEG = i * DEG_ACCUM;

        let setSvgColor = function(el, color) {
            var svg = el.find("svg path");
            svg.css("fill", color);
        };

        setTimeout(function() {
            setSvgColor($(".circle-container>:nth-of-type(" + (i+1) + ")"), hoverColors[i]);
        }, 100);

        $(".circle-container>:nth-of-type(" + (i+1) + ")")
            .css({
                opacity: 1,
                transform: "rotate(" + DEG + "deg) translate(" + HALF_SIZE + "em) rotate(" + (-1 * DEG) + "deg)"
            })
            /*.hover(function() {
                var el = $(this);
                var svg = el.find("svg path");
                svg.css("fill", hoverColors[i]);
            })*/;
    }

    $(window).bind('mousewheel', function(e) {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    });

    $("#main-container").css({"padding-top": $(".titlebar").height().toString() + "px"});
    $('#main-content').bind('wheel mousewheel', function(e) {
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
            addProjectCircle(event.pageX - $(this).offset().left, event.pageY - $(this).offset().top);
        }
    }).mousedown(function(e) {
        var target = $(e.target);
        if (target.is("#main-content")) {
            if (!panning) {
                $("#main-content").css("cursor", "-webkit-grab");
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

$(document).ready(function() {
    $("#menu-btn").click(function() {
        sidebarVisible = !sidebarVisible;
        $("#menu-btn").toggleClass("active");

        if (sidebarVisible) {
            var sidebarWidth = "300px";
            $("#main-sidebar").show();
            $("#main-sidebar").css({"width": sidebarWidth});
            $("#main-content").css({"margin-left": sidebarWidth});
        } else {
            $("#main-content").css({"margin-left": 0});
            $("#main-sidebar").css({"width": 0});
            setTimeout(function() {
                $("#main-sidebar").hide();
            }, 100);
        }
    });
});

$(window).mouseup(function() {
    if (panning) {
        $("#main-content").css("cursor", "auto");
    }
    panning = false;

});
