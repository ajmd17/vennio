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

// pages are held in a linked list: each page contains a property 'parentPage'
var currentPage = null;

function updateBreadcrums() {
    var breadcrumsElement = $("#top-breadcrums");
    breadcrumsElement.empty();

    var elementsToAdd = [];

    var page = currentPage;
    while (page != null && page != undefined) {
        let li = $("<li>");
        let a = $("<a href=\"#\">").append(page.name);

        if (page == currentPage) {
            a.addClass("current");
        } else {
            let thisPage = page;
            a.click(function() {
                // navigate to parent page
                currentPage.unbindEvents();
                currentPage.clearProjectElements();
                currentPage = thisPage;
                currentPage.loadProjectElements();
                currentPage.bindEvents();
                currentPage.show();

                updateBreadcrums();
            });
        }

        elementsToAdd.push(li.append(a));

        page = page.parentPage;
    }

    for (var i = elementsToAdd.length - 1; i >= 0; i--) {
        breadcrumsElement.append(elementsToAdd[i]);
    }
}

function zoomCircle(circle, sign, zooming) {
    var diff = {
        x: (zoomData.mousePosition.x - $(circle).position().left) * 0.05,
        y: (zoomData.mousePosition.y - $(circle).position().top) * 0.05
    };

    $(circle).css({
        "width" : "+=" + (sign * 10).toString(),
        "height": "+=" + (sign * 10).toString(),
        "left": "-=" + (diff.x * sign).toString(),
        "top" : "-=" + (diff.y * sign).toString()
    });
}

function afterLogin() {
    if (loggedUser.currentThemeName == undefined ||
        loggedUser.currentThemeName == null) {
        loggedUser.currentThemeName = "poly";
    }

    // create root projects page
    currentPage = new Page("Projects", $("<div class=\"page\">")
        .append("<div class=\"video-wrapper\">"),
        themes[loggedUser.currentThemeName],
        null);
    currentPage.loadProjectsFromDatabase();
    currentPage.parentPage = null;
    currentPage.bindEvents();
    currentPage.show();

    updateBreadcrums();

    // to prevent scrolling in on the page
    $(window).bind("mousewheel", function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }).mouseup(function() {
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
