// functions project types can have include:
// 'createContent', 'doubleClick', 'loseFocus', 'updateZoom'
var projectFunctions = {
    group: {
        createContent: function(data, viewport, isNewlyCreated) {
            var SIZE = (data.size != undefined) ? data.size : 200;
            var ZOOM = viewport.zoom;
            var SIZE_ZOOMED = SIZE * ZOOM;

            if (isNewlyCreated) {
                return $('<div>')
                    .addClass('project-circle-text')
                    .append($('<input type="text">')
                        .addClass('project-circle-text-edit')
                        .css({
                            "font-size": roundTo(SIZE_ZOOMED / 10, 1).toString() + 'px'
                        })
                        .val(!data.name ? '' : data.name)
                        .on('keyup', function(e) {
                            if (e.keyCode == 13) {
                                // enter key pressed, lose focus
                                // to signal finished editing
                                viewspace.objectLoseFocus();
                            }
                        }));
            } else {
                return $('<div>')
                    .addClass('project-circle-text')
                    .append($('<div>')
                        .addClass('project-title-div')
                        .css({
                            "font-size": roundTo(SIZE_ZOOMED / 10, 1).toString() + 'px'
                        })
                        .append(data.name));
            }
        },
        
        doubleClick: function(element, data, callbacks) {
            var $element = $(element);
            var $holder  = $element.find('.project-circle-text');
            if ($holder.length != 0) {
                var name  = $holder.find('.project-title-div').text();
                var $edit = $('<input type="text">')
                    .addClass('project-circle-text-edit')
                    .val(name)
                    .on('keyup', function(e) {
                        if (e.keyCode == 13) {
                            // enter key pressed, lose focus
                            // to signal finished editing
                            viewspace.objectLoseFocus();
                        }
                    });

                $holder.html($edit);
                $edit.select();
            }
        },

        loseFocus: function(element, data, callbacks) {
            var $element = $(element);
            var $txt     = $element.find('.project-circle-text');
            var $edit    = $txt.find('input');

            if ($edit.val() == undefined || $edit.val().trim().length == 0) {
                // remove object if you don't enter a value the first time
                if (!element.nameBefore || !element.nameBefore.length) {
                    $element.animate({
                        "left": ($element.position().left + ($element.width() / 2)).toString() + 'px',
                        "top" : ($element.position().top  + ($element.width() / 2)).toString() + 'px',
                        "width" : 0,
                        "height": 0
                    }, 200, 'linear', function() {
                        // remove it after the animation
                        $element.remove();
                    });
                } else {
                    // error, must enter a name for a project.
                    // revert to previous text
                    $edit.val(element.nameBefore);
                }
            } else {
                var value = $edit.val();
                element.nameBefore = value;

                // convert text element to div
                var $replacementDiv = $('<div>')
                    .addClass('project-title-div')
                    .append(element.nameBefore);

                $txt.append($replacementDiv);
                $edit.remove();

                // allow the action selector to be shown
                $element.find('.project-actions-menu').css('display', 'inline');

                // set property on the project 'name'.
                data.name = value;

                if (callbacks.success != undefined) {
                    callbacks.success(element, data);
                }
            }
        },

        updateZoom: function($element, newWidth, newHeight) {
            $element.find('.project-title-div').css({
                "font-size": roundTo(newWidth / 10, 1).toString() + 'px'
            });
        }
    },

    event: {
        createContent: function(data, viewport, isNewlyCreated) {
            var SIZE = (data.size != undefined) ? data.size : 200;
            var ZOOM = viewport.zoom;
            var SIZE_ZOOMED = SIZE * ZOOM;
            var HALF_SIZE = SIZE_ZOOMED / 2;

            var date       = new Date(data.eventInfo.date);
            var dateString = '';

            if (data.eventInfo.recurringDays === undefined || data.eventInfo.recurringDays.length == 0) {
                dateString = MONTH_NAMES_SHORT[date.getMonth()] + ' ' + 
                             date.getDate().toString() + ', ' + 
                             date.getFullYear().toString();
            } else {
                dateString = 'Every ';
                if (data.eventInfo.recurringDays.length == 1) {
                    dateString += WEEKDAY_NAMES[data.eventInfo.recurringDays[0]];
                } else if (data.eventInfo.recurringDays.length == 2) {
                    dateString += WEEKDAY_NAMES[data.eventInfo.recurringDays[0]];
                    dateString += ' and ' + WEEKDAY_NAMES[data.eventInfo.recurringDays[1]];
                } else if (data.eventInfo.recurringDays.length == 7) {
                    dateString += 'day';
                } else {
                    for (var i = 0; i < data.eventInfo.recurringDays.length; i++) {
                        dateString += WEEKDAY_NAMES[data.eventInfo.recurringDays[i]];
                        if (i != data.eventInfo.recurringDays.length - 1) {
                            dateString += ', ';
                        }
                    }
                }
            }

            var hour   = date.getHours();
            var minute = date.getMinutes();
            var isPm   = hour >= 12;

            hour = hour % 12;
            hour = hour != 0 ? hour : 12;

            var timeString = hour + ':' + ('0' + minute).slice(-2) + 
                (isPm ? ' PM' : ' AM');

            return $('<div>')
                .addClass('project-circle-text')
                .css({
                    "top": '45%',
                    "transform": 'translateX(-50%) translateY(-45%)'
                })
                .append($('<div>')
                    .addClass('project-title-div')
                    .css({
                        "font-size": roundTo(SIZE_ZOOMED / 8, 1).toString() + 'px'
                    })
                    .append(data.name)
                    .append($('<div>')
                        .addClass('project-title-event-date')
                        .css({
                            "margin-top": '5%',
                            "font-size" : roundTo(SIZE_ZOOMED / 14, 1).toString() + 'px'
                        })
                        .append($('<div>')
                            .append(dateString))
                        .append($('<div>')
                            .append(timeString))));
        },

        doubleClick: function(element, data, callbacks) {
            // TODO edit the event
        },

        loseFocus: function(element, data, callbacks) {
            if (callbacks.success != undefined) {
                callbacks.success(element, data);
            }
        },

        updateZoom: function($element, newWidth, newHeight) {
            $element.find('.project-title-div').css({
                "font-size": roundTo(newWidth / 8, 1).toString() + 'px'
            });
            $element.find('.project-title-event-date').css({
                "font-size": roundTo(newWidth / 14, 1).toString() + 'px'
            });
        }
    }
};