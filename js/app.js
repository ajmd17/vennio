var sidebarVisible = false;

var dragging = false;

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

function zoomCircle(circle, sign, zooming) {
    var diff = {
        x: (zoomData.mousePosition.x - $(circle).position().left - ($(circle).width()/2)) * 0.05,
        y: (zoomData.mousePosition.y - $(circle).position().top - ($(circle).height()/2)) * 0.05
    };

    if (zooming) {
        $(circle).css({
            "width": "+=" + (sign * 10).toString(),
            "height": "+=" + (sign * 10).toString()
        });
    }

    $(circle).css({
        "left": "-=" + (diff.x * sign).toString(),
        "top": "-=" + (diff.y * sign).toString()
    });
}

function addProjectCircle(x, y) {
    var size = 200;//randRange(160, 300);
    var sizeZoomed = size + (zoomData.zoom * 10);
    var color = randomColor({luminosity: "light"});

    $("#main-content")
        .append($("<div>").addClass("project-circle")
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
                .addClass("project-circle-text")
                .append($("<input type=\"text\">")
                            .addClass("project-circle-text-edit")
                            .val("Text here")
                            .css({"width" : "100%",
                                  "height": "100%"})))

            // double-clicking a circle allows you to edit the title
            .dblclick(function() {
                var input = $(this).find("input");
                input.select();
            })
            .focusout(function() {
                var input = $(this).find("input");
            })
        );
}

$(document).ready(function() {
    $("#main-container").css({"padding-top": $(".titlebar").height().toString() + "px"});
    $('#main-content').bind('wheel mousewheel', function(e) {
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
    }).dblclick(function(event) {
        if (event.target == this) {
            // add project item
            addProjectCircle(event.pageX - $(this).offset().left, event.pageY - $(this).offset().top);
        }
    }).mousedown(function() {
        dragging = true;
    }).mousemove(function(e) {
        var newPos = {
            x: e.pageX,
            y: e.pageY
        };

        if (dragging) {
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

$(document).mouseup(function() {
    dragging = false;
});
