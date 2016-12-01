app.factory('Event', function(Auth) {
    var Event = {
        EVENT_SEARCH_RANGE: 28800000, // 8 hours

        setupEvent: function(project, projectRef, range) {
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
                    Event.createEventReminder(project, projectRef);
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

                                    Event.createEventReminder(projectOverdue, projectRef);
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
                                Event.createEventReminder(futureProject, projectRef);
                            }
                        }
                    });
                }
            }
        },

        /** 
         * Adds a timer to show a popup reminder for an event.
         */
        createEventReminder: function(project, ref) {
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
                                var msToEvent = Number.parseInt(project.data.eventInfo.date) - (new Date().getTime());
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
                            ref.child('data').child('eventInfo').set(project.data.eventInfo);

                            // TODO bring the user to the event??
                        }
                    });
                    toast.show();
                }, msToEvent - remindBeforeMs);
            })();
        },

        /** Searches all events and finds any that are today.
         *  Those that are on this day, a timeout is created to count down
         *  before showing an alert.
         */
        findEventsInRange: function(range) {
            $('.toast-wrapper').remove();
            if (Toast.toasts !== undefined) {
                Toast.toasts = [];
            }

            // start with global projects ref from datebase
            var projectsRef = Auth.getDatabase().ref('users')
                .child(Auth.getUser().key)
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
                                    Event.setupEvent(project, layerRef.child(keys[i]), range);

                                    if (project.data.subnodes != undefined && project.data.subnodes.length != 0) {
                                        // scan for subnodes of the event
                                        scanLayer(layerRef.child('data/subnodes'));
                                    }
                                } else if (project.data.type === 'group') {
                                    if (project.data.subnodes != undefined && project.data.subnodes.length != 0) {
                                        // scan for subnodes of the group
                                        scanLayer(layerRef.child('data/subnodes'));
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
                Event.findEventsInRange(range);
            }, range);
        }
    };

    return Event;
});