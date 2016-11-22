/** Searches all events and finds any that are today.
 *  Those that are on this day, a timeout is created to count down
 *  before showing an alert.
 */
function findEventsInRange(range) {
    var now = new Date();

    // start with global projects ref from datebase
    var projectsRef = database.ref('users')
        .child(loggedUser.key)
        .child('projects');

    var scanLayer = function(layerRef) {
        layerRef.once('value', function(snapshot) {
            var snapshotValue = snapshot.val();
            if (snapshotValue !== undefined && snapshotValue !== null) {
                var keys = Object.keys(snapshotValue);
                for (var i = 0; i < keys.length; i++) {
                    (function(key) {
                        var project = snapshotValue[key];
                        var projectRef = layerRef.child(keys[i]);

                        var timer;
                        
                        if (project.data.type === 'event') {
                            var toast = null;

                            // check date to see it is in range
                            var msToEvent = parseInt(project.eventInfo.date) - now.getTime();
                            console.log('ms to ' + project.data.name + ': ' + msToEvent);
                            var remindBeforeMs = globalConfig.events.remindBeforeMinutes * 60 * 1000;

                            // check if acknowledged
                            if (!project.eventInfo.acknowledged) {
                               // console.log('ms to event "' + project.data.name + '" : ', msToEvent);
                                if (msToEvent >= 0 && msToEvent <= range) {
                                    // set up a timeout to show an alert on the event
                                    window.setTimeout(function() {
                                        // show a toast
                                        toast = new Toast(project.data.name,
                                            /* TODO: content (description, location etc) */
                                            "Click here to view the event.",
                                            {
                                                show: function() {
                                                    // create an interval to update the time overdue each minute
                                                    timer = window.setInterval(function() {
                                                        // recalculate ms to event
                                                        msToEvent = parseInt(project.eventInfo.date) - (Date.now().getTime());
                                                        toast.getElement()
                                                            .find(".toast-content")
                                                            .html(calculateOverdueString());
                                                    }, 60 * 1000);
                                                },
                                                hide: function() {
                                                    window.clearInterval(timer);
                                                },
                                                click: function() {
                                                    // set to acknowledged and update in database.
                                                    project.eventInfo.acknowledged = true;

                                                    projectRef.update({
                                                        "eventInfo": project.eventInfo
                                                    });

                                                    // TODO bring the user to the event
                                                }
                                            });

                                        toast.show();
                                    }, msToEvent - remindBeforeMs);
                                } else if (msToEvent < 0) {
                                    var overdueString = '';

                                    var calculateOverdueString = function() {
                                        var overdueByDays    = -msToEvent / (24 * 60 * 60 * 1000);
                                        var overdueByHours   = -msToEvent / (60 * 60 * 1000);
                                        var overdueByMinutes = -msToEvent / (60 * 1000);

                                        if (overdueByDays >= 1) {
                                            return Math.floor(overdueByDays).toString() + ' days overdue';
                                        } else if (overdueByHours >= 1) {
                                            return Math.floor(overdueByHours).toString() + ' hours overdue';
                                        } else {
                                            return Math.floor(overdueByMinutes).toString() + ' minutes overdue';
                                        }
                                    };
                                    
                                    // not acknowledged and overdue.
                                    // show a toast that says it's overdue
                                    toast = new Toast(project.data.name,
                                        /* TODO: content (description, location etc) */
                                        calculateOverdueString(),
                                        {
                                            show: function() {
                                                // create an interval to update the time overdue each minute
                                                timer = window.setInterval(function() {
                                                    // recalculate ms to event
                                                    msToEvent = parseInt(project.eventInfo.date) - (Date.now().getTime());
                                                    toast.getElement()
                                                        .find(".toast-content")
                                                        .html(calculateOverdueString());
                                                }, 60 * 1000);
                                            },
                                            hide: function() {
                                                window.clearInterval(timer);
                                            },
                                            click: function() {
                                                // set to acknowledged and update in database.
                                                project.eventInfo.acknowledged = true;
                                                projectRef.update({
                                                    "eventInfo": project.eventInfo
                                                });
                                                // TODO bring the user to the event
                                            },
                                        });

                                    toast.show();
                                }
                            }
                        } else if (project.data.type === 'group') {
                            // scan recursively
                            scanLayer(layerRef.child('subnodes'));
                        }
                    })(keys[i]);
                }
            }
        });
    };

    scanLayer(projectsRef);
}

function updateBreadcrums() {
    var $topBreadcrumbs = $("#top-breadcrums");
    $topBreadcrumbs.empty();

    var elementsToAdd = [];
    var page = viewspace.currentPage;

    while (page !== undefined && page !== null) {
        var $li = $("<li>");
        var $a = $("<a href=\"#\">").append(page.name);

        if (page == viewspace.currentPage) {
            $a.addClass("current");
        } else {
            (function(thisPage) {
                $a.click(function() {
                    // navigate to parent page
                    viewspace.setCurrentPage(thisPage);
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

function handleObjectLoseFocus(element, data, callbacks) {
    var $element = $(element);
    var $txt     = $element.find(".project-circle-text");
    var $edit    = $txt.find("input");

    if ($edit.val() == undefined || $edit.val().trim().length == 0) {
        // remove object if you don't enter a value the first time
        if (!element.valueBefore || !element.valueBefore.length) {
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
                    $edit.select();
                },
                "callback": function() {
                }
            });
        }
    } else {
        var value = $edit.val();
        element.valueBefore = value;

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

        // allow the action selector to be shown
        $element.find(".project-actions-menu").css("display", "inline");

        // set property on the project 'name'.
        data.name = value;

        if (callbacks.success != undefined) {
            callbacks.success(element, data);
        }
    }
}

function afterLogin() {
    // show the main content
    $("#login-window").remove();
    $("#after-login").show();

    // scan for events that are in range
    var EVENT_DATE_RANGE = 28800000; // 8 hours
    findEventsInRange(EVENT_DATE_RANGE);
    // set up another timeout to check
    // for events after the range
    window.setTimeout(function() {
        findEventsInRange(EVENT_DATE_RANGE);
    }, EVENT_DATE_RANGE);

    if (loggedUser.currentThemeName == undefined || loggedUser.currentThemeName == null) {
        loggedUser.currentThemeName = "poly";
    }

    viewspace.init();

    updateBreadcrums();

    // to prevent scrolling in on the page
    $(window).on("wheel mousewheel", function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }).click(function(e) {
        var $target = $(e.target);
        
        if ($target.is(".project-circle") || $(".project-circle").has($target).length != 0) {
            // let the click callback for the project handle it
        } else {
            viewspace.objectLoseFocus();
        }
    }).on("mouseup", function(e) {
        window.clearTimeout(viewspace.mouseHoldId);

        if (viewspace.showRipple && viewspace.dragTime == 0) {
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

        $(viewspace.currentPage.element).css("cursor", "auto");

        viewspace.isPanning = false;
        viewspace.dragTime = 0;
        viewspace.showRipple = false;
    });
}

$(document).ready(function() {
    var $menuBtn = $("#menu-btn");
    var $mainSidebar = $("#main-sidebar");
    var $pageContent = $("#page-content");

    $menuBtn.click(function() {
        $menuBtn.toggleClass("active");
        viewspace.toggleSidebar();
    });
});
