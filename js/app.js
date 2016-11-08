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
    "autumn-leaf": new Theme("videos/autumn-leaf.mp4", BackgroundType.VIDEO, 8),
    "poly":   new Theme("img/poly.png", BackgroundType.IMAGE, 0),
    "poly_2": new Theme("img/poly_2.png", BackgroundType.IMAGE, 0),
    "hex":    new Theme("img/hex.png", BackgroundType.IMAGE, 6),
    "milky-way": new Theme("img/milky-way.jpg", BackgroundType.IMAGE, 5)
};

var currentPage = null;

function zoomCircle(circle, sign, zooming) {
    var diff = {
        x: (zoomData.mousePosition.x - $(circle).position().left) * 0.05,
        y: (zoomData.mousePosition.y - $(circle).position().top) * 0.05
    };

    $(circle).css({
        "width": "+=" + (sign * 10).toString(),
        "height": "+=" + (sign * 10).toString(),
        "left": "-=" + (diff.x * sign).toString(),
        "top": "-=" + (diff.y * sign).toString()
    });
}

function afterLogin() {
    currentPage = new Page($("#projects-page"));

    if (loggedUser.currentThemeName == undefined ||
        loggedUser.currentThemeName == null) {
        loggedUser.currentThemeName = "poly";
    }

    currentPage.setTheme(themes[loggedUser.currentThemeName]);

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

        let item = $(".circle-container>:nth-of-type(" + (i+1) + ")");

        setTimeout(function() {
            item.find("svg path").css("fill", hoverColors[i]);
        }, 100);

        item.css({
            opacity: 1,
            transform: "rotate(" + DEG + "deg) translate(" + HALF_SIZE + "em) rotate(" + (-1 * DEG) + "deg)"
        });
    }

    // to prevent scrolling in on the page
    $(window).bind("mousewheel", function(e) {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    })
    .mouseup(function() {
        if (panning) {
            $(currentPage.element).css("cursor", "auto");
        }
        panning = false;
    });


    $("#main-container").css({"padding-top": $(".titlebar").height().toString() + "px"});

}

$(document).ready(function() {
    $("#menu-btn").click(function() {
        sidebarVisible = !sidebarVisible;
        $("#menu-btn").toggleClass("active");

        if (sidebarVisible) {
            var sidebarWidth = "300px";
            $("#main-sidebar").show();
            $("#main-sidebar").css({"width": sidebarWidth});
            $("#page-content").css({"margin-left": sidebarWidth});
        } else {
            $("#page-content").css({"margin-left": 0});
            $("#main-sidebar").css({"width": 0});
            setTimeout(function() {
                $("#main-sidebar").hide();
            }, 100);
        }
    });
});
