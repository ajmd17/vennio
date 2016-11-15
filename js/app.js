var sidebarVisible = false;
var panning = false;
var dragTime = 0;
var mouseHoldId = 0;
var showRipple = false;

// on click, a timeout is set.
// if clicked again, it is cleared.
// else, the user is taken to the clicked project's page.
var itemClickTimeoutId = 0;
var itemClickTimeoutOn = false;

var MIN_ZOOM = 1.0;
var MAX_ZOOM = 10.0;
var ZOOM_STEP = 0.1;
var ZOOM_THETA = 0.1;
var PAN_THETA = 0.5;
var RIPPLE_SIZE = 100;
var PROJECT_CLICK_TIMEOUT = 300;

var focusState = {
    isFocusedOnObject: false,
    focusedObject: null,
    callbacks: {
    }
};

var mousePosition = {
    x: 0,
    y: 0
};

// pages are held in a linked list: each page contains a property 'parentPage'
var currentPage = null;

function updateBreadcrums() {
    var $topBreadcrumbs = $("#top-breadcrums");
    $topBreadcrumbs.empty();

    var elementsToAdd = [];
    var page = currentPage;

    while (page != null && page != undefined) {
        var $li = $("<li>");
        var $a = $("<a href=\"#\">").append(page.name);

        if (page == currentPage) {
            $a.addClass("current");
        } else {
            (function(thisPage) {
                $a.click(function() {
                    // navigate to parent page
                    currentPage.unbindEvents();
                    currentPage.clearProjectElements();
                    currentPage = thisPage;
                    currentPage.bindEvents();
                    currentPage.show();
                    currentPage.loadProjectElements();

                    updateBreadcrums();
                });
            })(page);
        }

        $li.append($a);
        elementsToAdd.push($li);

        page = page.parentPage;
    }

    for (var i = elementsToAdd.length - 1; i >= 0; i--) {
        $topBreadcrumbs.append(elementsToAdd[i]);
    }
}

function handleObjectLoseFocus(element, callbacks) {
    var $element = $(element);
    var $txt = $element.find(".project-circle-text");
    var $edit = $txt.find("input");

    if ($edit.val() == "") {
        // remove object if you don't enter a value the first time
        if (element.valueBefore == undefined) {
            $element.animate({
                "left": ($element.position().left + ($element.width() / 2)).toString() + "px",
                "top" : ($element.position().top  + ($element.width() / 2)).toString() + "px",
                "width" : 0,
                "height": 0
            }, 200, "linear", function() {
                // remove it after the animation
                $element.remove();
            });
        } else {
            // error, must enter a name
            $("#dialog").dialogBox({
                "title": "Project Name Empty",
                "content": "Please enter a name for the project.",
                "effect": "sign",
                "hasBtn": true,
                "confirmValue": "OK",
                "confirm": function() {
                    $(edit).select();
                },
                "callback": function() {
                }
            });
        }
    } else {
        element.valueBefore = $edit.val();

        // convert text element to div
        var $replacementDiv = $("<div>")
            .addClass("project-title-div")
            .append(element.valueBefore);

        $txt.append($replacementDiv);
        $edit.remove();

        // remove object type selector after animation
        $element.find(".circle-container").animate({
            "opacity": 0
        }, 150, "linear", function() {
            $(this).remove();
        });

        if (callbacks.success != undefined) {
            callbacks.success(element);
        }
    }
}

function clearObjectFocus() {
    focusState = {
        isFocusedOnObject: false,
        focusedObject: null,
        callbacks: {
        }
    };
}

function objectLoseFocus() {
    if (focusState.isFocusedOnObject && focusState.focusedObject != null) {
        handleObjectLoseFocus(focusState.focusedObject, focusState.callbacks);
    }
    clearObjectFocus();
}

function hasFocusedObject() {
    return focusState.isFocusedOnObject && focusState.focusedObject != null;
}

function setFocusedObject(element, callbacks) {
    focusState.isFocusedOnObject = true;
    focusState.focusedObject = element;
    focusState.callbacks = callbacks;
}

/** Handles when an object/project was actually clicked,
 *  i.e not just clicked while dragging or cancelling editing for another project.
 * 
 *  @param project - The project data object of the element clicked.
*/
function handleObjectClick(project) {
    itemClickTimeoutOn = true;
    itemClickTimeoutId = setTimeout(function() {
        switch (project.projectClass) {
        case "group":
            // open the clicked project page
            var pageBefore = currentPage;
            pageBefore.unbindEvents();
            pageBefore.clearProjectElements();

            currentPage = new Page(
                project.name,
                $("<div class=\"page\">")
                    .append("<div class=\"video-wrapper\">"),
                project.theme,
                project,
                project.viewport);

            currentPage.loadProjectsFromDatabase();
            currentPage.parentPage = pageBefore;
            currentPage.bindEvents();
            currentPage.show();

            updateBreadcrums();

            break;

        case "event":
            // show event data
            if (project.eventInfo == undefined || project.eventInfo == null) {
                console.log("Error loading data about the event");
            } else {
                // TODO
            }

            break;

        default:
            console.log("unknown project class: ", project.projectClass);
            break;
        }

        itemClickTimeoutOn = false;
    }, PROJECT_CLICK_TIMEOUT);
}

function afterLogin() {
    if (loggedUser.currentThemeName == undefined ||
        loggedUser.currentThemeName == null) {
        loggedUser.currentThemeName = "poly";
    }

    // create root projects page
    currentPage = new Page("Home", $("<div class=\"page\">")
        .append("<div class=\"video-wrapper\">"),
        loggedUser.theme,
        null,
        loggedUser.viewport);

    currentPage.loadProjectsFromDatabase();
    currentPage.parentPage = null;
    currentPage.bindEvents();
    currentPage.show();

    updateBreadcrums();

    // to prevent scrolling in on the page
    $(window).on("wheel mousewheel", function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }).click(function(e) {
        var $target = $(e.target);
        console.log("CLICK! ", e);

        if ($target.is(".project-circle") || $(".project-circle").has($target).length != 0) {
            // let the click callback for the project handle it
        } else {
            objectLoseFocus();
        }

    }).on("mouseup", function(e) {
        clearTimeout(mouseHoldId);

        if (showRipple && dragTime == 0) {
            var $pageContent = $("#page-content");

            $(".ripple").remove();

            var posX = $pageContent.offset().left;
            var posY = $pageContent.offset().top;

            $pageContent.prepend($("<span class=\"ripple\">")
                .css({
                    "width":  RIPPLE_SIZE,
                    "height": RIPPLE_SIZE,
                    "left": (e.pageX - posX - (RIPPLE_SIZE / 2)).toString() + "px",
                    "top":  (e.pageY - posY - (RIPPLE_SIZE / 2)).toString() + "px"
                }).addClass("rippleEffect")
            );
        }

        $(currentPage.element).css("cursor", "auto");

        panning = false;
        dragTime = 0;
        showRipple = false;
    });

    $("#main-container").css({ 
        "padding-top": $(".titlebar").height().toString() + "px" 
    });
}

$(document).ready(function() {
    var $menuBtn = $("#menu-btn");
    var $mainSidebar = $("#main-sidebar");
    var $pageContent = $("#page-content");

    $menuBtn.click(function() {
        $menuBtn.toggleClass("active");

        sidebarVisible = !sidebarVisible;
        if (sidebarVisible) {
            var sidebarWidth = "300px";
            
            $mainSidebar.show();
            $mainSidebar.css({ "width": sidebarWidth });
            $pageContent.css({ "margin-left": sidebarWidth });
        } else {
            $pageContent.css({ "margin-left": 0 });
            $mainSidebar.css({ "width": 0 });

            // hide after transition
            setTimeout(function() {
                $mainSidebar.hide();
            }, 100);
        }
    });
});
