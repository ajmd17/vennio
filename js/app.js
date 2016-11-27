var EVENT_SEARCH_RANGE = 28800000; // 8 hours

$(document).ready(function() {
    $('#menu-btn').click(function() {
        $(this).toggleClass('active');
        viewspace.toggleSidebar();
    });
});

function setupEvent(project, projectRef, range) {
    var isRecurring = (project.data.eventInfo.recurringDays !== undefined && 
        project.data.eventInfo.recurringDays.length !== 0);
    // check date to see it is in range
    var now = new Date();
    var projectDate = new Date(project.data.eventInfo.date);
    var msToEvent = projectDate.getTime() - now.getTime();

    // check if acknowledged
    if (!isRecurring && !project.data.eventInfo.acknowledged) {
        // simple one-time event
        if (msToEvent <= range) {
            createEventReminder(project, projectRef);
        }
    } else if (isRecurring) {
        // check for recurring days and set up events for them
        var lastAcknowledged = project.data.eventInfo.lastAcknowledged;
        
        if (lastAcknowledged !== undefined) {
            var lastAcknowledgedDate = new Date(lastAcknowledged);

            var nowCounter = new Date();
            var nowDay = Math.floor(nowCounter.getTime()/1000/60/60/24);
            var acknowledgedDay = Math.floor(lastAcknowledgedDate.getTime()/1000/60/60/24);

            // check difference in days
            if (nowDay > acknowledgedDay) {
                // create a single event for the last time the was missed
                while (nowCounter > lastAcknowledgedDate) {
                    if (project.data.eventInfo.recurringDays.contains(nowCounter.getDay())) {
                        (function() {
                            // copy the project to change the date
                            var projectOverdue = {};

                            copyProperties(projectOverdue, project);
                            
                            var overdueDate = new Date(projectDate.getTime());
                            overdueDate.setDate(nowCounter.getDate());
                            projectOverdue.data.eventInfo.date = overdueDate.getTime();
                            createEventReminder(projectOverdue, projectRef);
                        })();
                        
                        // break after 1 occurance of the event
                        break;
                    }
                    nowCounter.setDate(nowCounter.getDate() - 1);
                }
            }

            // now, add event for the future
            project.data.eventInfo.recurringDays.forEach(function(it) {
                var recurringDay = Number.parseInt(it);
                if (!Number.isNaN(recurringDay)) {
                    // if it's already past that day this week,
                    // set it for next week.
                    if (recurringDay <= now.getDay()) {
                        recurringDay += 7;
                    }

                    var futureDate = new Date(projectDate.getTime());
                    futureDate.setMonth(now.getMonth());
                    futureDate.setDate(now.getDate() + (recurringDay - now.getDay()));

                    if (futureDate.getTime() - now.getTime() <= range) {
                        var futureProject = {};
                        copyProperties(futureProject, project);
                        futureProject.data.eventInfo.date = futureDate.getTime();
                        createEventReminder(futureProject, projectRef);
                    }
                }
            });
        }
    }
}

/** 
 * Adds a timer to show a popup reminder for an event.
 */
function createEventReminder(project, ref) {
    var createEventString = function(msToEvent) {
        var overdueByDays    = Math.floor(-msToEvent / (24 * 60 * 60 * 1000));
        var overdueByHours   = Math.floor(-msToEvent / (60 * 60 * 1000));
        var overdueByMinutes = Math.floor(-msToEvent / (60 * 1000));
        
        if (overdueByDays >= 1) {
            return overdueByDays.toString() + ' day' +
                (overdueByDays == 1 ? '' : 's') + ' overdue';
        } else if (overdueByHours >= 1) {
            return overdueByHours.toString() + ' hour' +
                (overdueByHours == 1 ? '' : 's') + ' overdue';
        } else if (overdueByMinutes >= 1) {
            return overdueByMinutes.toString() + ' minute' +
                (overdueByMinutes == 1 ? '' : 's') + ' overdue';
        } else if (overdueByMinutes <= -1) {
            return 'in ' + (-overdueByMinutes).toString() + ' minute' +
                (overdueByMinutes == -1 ? '' : 's');
        } else if (overdueByHours <= -1) {
            return 'in ' + (-overdueByHours).toString() + ' hour' +
                (overdueByHours == -1 ? '' : 's');
        } else if (overdueByDays <= -1) {
            return 'in ' + (-overdueByDays).toString() + ' day' +
                (overdueByDays == -1 ? '' : 's');
        } else {
            return 'now';
        }
    };

    (function() {
        var msToEvent = parseInt(project.data.eventInfo.date) - new Date().getTime();
        var remindBeforeMs = globalConfig.events.remindBeforeMinutes * 60 * 1000;

        var timer = null;

        // set up a timeout to show an alert on the event
        window.setTimeout(function() {
            // show a toast
            var toast = new Toast('<i class="fa fa-bell-o" aria-hidden="true"></i> ' + project.data.name, '', {
                show: function() {
                    // create an interval to update the time overdue each minute
                    var showEventString = function() {
                        // recalculate ms to event
                        var msToEvent = parseInt(project.data.eventInfo.date) - (new Date().getTime());
                        toast.getElement()
                            .find('.toast-content')
                            .html(createEventString(msToEvent));
                    };
                    showEventString();

                    var msToNextFullMinute = (new Date().setSeconds(60)) - (new Date().getTime());
                    window.setTimeout(function() {
                        showEventString();
                        timer = window.setInterval(showEventString, 60 * 1000);
                    }, msToNextFullMinute);
                },
                
                hide: function() {
                    window.clearInterval(timer);
                },

                click: function() {
                    // set to acknowledged and update in database.
                    project.data.eventInfo.acknowledged = true;
                    // set last acknowledged day to be the timestamp
                    project.data.eventInfo.lastAcknowledged = new Date().getTime();
                    ref.child('data').update({
                        eventInfo: project.data.eventInfo
                    });

                    // TODO bring the user to the event
                }
            });
            toast.show();
        }, msToEvent - remindBeforeMs);
    })();
}

/** Searches all events and finds any that are today.
 *  Those that are on this day, a timeout is created to count down
 *  before showing an alert.
 */
function findEventsInRange(range) {
    $('.toast-wrapper').remove();
    if (toasts !== undefined) {
        toasts = [];
    }

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
                        if (project.data.type === 'event') {
                            setupEvent(project, layerRef.child(keys[i]).child('data'), range);

                            if (project.subnodes != undefined && project.subnodes.length != 0) {
                                // scan for subnodes of the event
                                scanLayer(layerRef.child('subnodes'));
                            }
                        } else if (project.data.type === 'group') {
                            if (project.subnodes != undefined && project.subnodes.length != 0) {
                                // scan for subnodes of the group
                                scanLayer(layerRef.child('subnodes'));
                            }
                        }
                    })(keys[i]);
                }
            }
        });
    };

    scanLayer(projectsRef);

    // set up another timeout to check
    // for events after the range
    window.setTimeout(function() {
        findEventsInRange(range);
    }, range);
}

function updateBreadcrums() {
    var $topBreadcrumbs = $('#top-breadcrums');
    $topBreadcrumbs.empty();

    var elementsToAdd = [];
    var page = viewspace.currentPage;

    while (page !== undefined && page !== null) {
        var $li = $('<li>');
        var $a  = $('<a href="#">').append(page.name);

        if (page == viewspace.currentPage) {
            $a.addClass('current');
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
    (function(projectTypeFunctions) {
        if (projectTypeFunctions !== undefined) {
            if (projectTypeFunctions.loseFocus !== undefined) {
                return projectTypeFunctions.loseFocus(element, data, callbacks);
            }
        } else {
            console.log('No functionality for type: "' + data.type.toString() + '"');
        }
        return null;
    })(projectFunctions[data.type]);
}

function afterLogin() {
    console.log('afterLogin()');

    // set up an interval to change the titlebar color based on the time of day
    window.setInterval(function() {
        /*var amt;
        $('.titlebar').css({
            "background-color": randomColor()
        });*/
    }, 1000 * 5 /* every 5 seconds */);

    // show the main content
    $('#login-window').remove();
    $('#after-login').show();

    $('#btn-view-alerts').click(function() {

    });

    $('#settings-btn').click(function() {
        $(this).toggleClass('active');
        $('#settings-menu').toggle();
    });

    $('#preferences-menu-item').click(function() {
        $('#settings-btn').removeClass('active');
        $('#settings-menu').hide();

        var modal = new Modal('Preferences', '', [{
            text: 'Apply',
            type: 'primary',
            click: function() {
                modal.hide();
            }
        },
        {
            text: 'Cancel',
            click: function() {
                // hide the modal
                modal.hide();
            }
        }]);

        modal.show();
    });

    $('#btn-select-theme').click(function() {

        var modal = null;

        var $themeSelectionContent = $('<div>')
            .addClass('theme-selection-content');
        var $staticThemeList = $('<ul>')
            .addClass('theme-selection');
        var $dynamicThemeList = $('<ul>')
            .addClass('theme-selection');

        var staticThemes = [];
        var dynamicThemes = [];

        for (theme in BUILTIN_THEMES) {
            var previousTheme = viewspace.currentPage.theme;
            (function(thisTheme) {
                if (thisTheme.previewUrl !== undefined && thisTheme.previewUrl !== null && thisTheme.previewUrl.length !== 0) {
                    if (thisTheme.backgroundType == BackgroundType.IMAGE) {
                        staticThemes.push(thisTheme);
                    } else if (thisTheme.backgroundType == BackgroundType.VIDEO) {
                        dynamicThemes.push(thisTheme);
                    }
                }
            })(BUILTIN_THEMES[theme]);
        }

        var appendThemePreview = function(thisTheme, $themeListElement) {
            $themeListElement.append($('<li>')
                .addClass('theme-selection-item')
                .append($('<img src="' + thisTheme.previewUrl + '">'))
                .hover(function() {
                    viewspace.currentPage.setTheme(thisTheme);
                }, function() {
                    viewspace.currentPage.setTheme(previousTheme);
                })
                .click(function() {
                    viewspace.currentPage.setTheme(thisTheme);
                    previousTheme = thisTheme;
                    modal.hide();

                    // update in database
                    var dataRef = null;
                    if (viewspace.currentPage.pageProject !== undefined && viewspace.currentPage.pageProject !== null) {
                        dataRef = viewspace.currentPage.pageProject.ref
                            .child('data');
                    } else {
                        dataRef = database.ref('users')
                            .child(loggedUser.key);
                    }
                    dataRef.update({
                        theme: thisTheme
                    });
                }));
        };

        staticThemes.forEach(function(thisTheme) {
            appendThemePreview(thisTheme, $staticThemeList);
        });

        dynamicThemes.forEach(function(thisTheme) {
            appendThemePreview(thisTheme, $dynamicThemeList);
        });

        $themeSelectionContent
            .append($('<h3>')
                .append('Static Themes'))
            .append($('<hr>'))
            .append($staticThemeList);

        if (dynamicThemes.length != 0) {
            $themeSelectionContent.append(
                $('<h3>')
                    .append('Dynamic Themes'))
                .append($('<hr>'))
                .append($dynamicThemeList);
        }

        modal = new Modal('', $themeSelectionContent);
        modal.show();
    });

    // scan for events that are in range
    findEventsInRange(EVENT_SEARCH_RANGE);

    if (loggedUser.currentThemeName == undefined || loggedUser.currentThemeName == null) {
        loggedUser.currentThemeName = 'poly';
    }

    viewspace.init();

    updateBreadcrums();

    // to prevent scrolling in on the page
    $(window).on('wheel mousewheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    })
    .click(function(e) {
        var $target = $(e.target);
        if (!$target.is('.project-circle') && !$('.project-circle').has($target).length) {
            viewspace.objectLoseFocus();
        }
    })
    .on('mouseup', function(e) {
        console.log('mouseup on document');
        window.clearTimeout(viewspace.mouseHoldId);

        if (viewspace.showRipple && viewspace.dragTime == 0) {
            var $pageContent = $('#page-content');

            $('.ripple').remove();

            var posX = $pageContent.offset().left;
            var posY = $pageContent.offset().top;

            $pageContent.prepend($('<span class="ripple">')
                .css({
                    "width":  RIPPLE_SIZE,
                    "height": RIPPLE_SIZE,
                    "left": (e.pageX - posX - (RIPPLE_SIZE / 2)).toString() + 'px',
                    "top":  (e.pageY - posY - (RIPPLE_SIZE / 2)).toString() + 'px'
                }).addClass('rippleEffect')
            );
        }

        $(viewspace.currentPage.element).css('cursor', 'auto');

        // clear dragging, panning, etc.
        viewspace.clearObjectDrag();
        viewspace.isPanning = false;
        viewspace.dragTime = 0;
        viewspace.showRipple = false;
    });
}