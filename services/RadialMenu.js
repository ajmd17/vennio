app.factory('RadialMenu', function(Extensions, Event) {


    /** project.js */
    function Project(position, element, data) {
        this.position     = position;
        this.element      = element;
        this.data         = data;
    }

    Project.prototype.getPosition = function() {
        return this.position;
    };

    Project.prototype.setPosition = function(position) {
        this.position = position;
        if (this.element != undefined) {
            // TODO move it
        }
    };

    var RadialMenu = {
        getRadialMenuItems: function(viewspace, page, position) { 
            return [{
                    title: 'Event',
                    url  : 'img/shapes/calendar.png',
                    select: function() {
                        var $nameInput = $('<input type="text" placeholder="Name">');
                        var $dateInput = $('<input type="text" placeholder="Date">');
                        var $timeInput = $('<input type="text" placeholder="Time">');

                        var cal = new Calendar(new Date(), function(date) {
                            var year  = date.getFullYear();
                            var month = ('0' + (date.getMonth() + 1)).slice(-2);
                            var day   = ('0' + date.getDate()).slice(-2);
                            $dateInput.val(year + '/' + month + '/' + day);
                        });

                        var clock = new Clock(new Date(), function(date, mode) {
                            var hour   = date.getHours();
                            var minute = date.getMinutes();
                            
                            var isPm = hour >= 12;
                            hour = hour % 12;
                            hour = hour != 0 ? hour : 12;

                            $timeInput.val(hour + ':' + ('0' + minute).slice(-2) + 
                                (isPm ? ' PM' : ' AM'));
                        });

                        var clockTooltip = new Tooltip($timeInput, 'Pick Time', clock.getElement(), {
                            show: function() {
                                clock.updateSize();
                            },
                            hide: function() {
                            }
                        });

                        var calTooltip = new Tooltip($dateInput, '', cal.getElement(), {
                            show: function() {
                                cal.updateSize();
                            },
                            hide: function() {
                            }
                        });

                        // custom css modifications
                        calTooltip.getElement()
                            .find('.tooltip')
                            .css('border-radius', cal.getElement().css('border-radius'));
                        calTooltip.getElement()
                            .find('.tooltip-body')
                            .css('padding', 0);
                        clock.getElement()
                            .css('width', '180px');

                        var possibleDays = {
                            "Monday": 1,
                            "Tuesday": 2,
                            "Wednesday": 3,
                            "Thursday": 4,
                            "Friday": 5,
                            "Saturday": 6,
                            "Sunday": 0
                        };

                        var chosenRepetitionDays = [];

                        var $repeatDays = $('<div>')
                            .append($('<h3>')
                                .css({
                                    "margin": '4px',
                                    "padding": 0
                                })
                                .append('Repeat every:'));

                        

                        for (day in possibleDays) {
                            $repeatDays.append($('<div>')
                                .addClass('checklist-item')
                                .append('<i class="checkbox-icon fa fa-square-o">')
                                .append($('<div>')
                                    .addClass('day-checkbox-text')
                                    .append(day)))
                        }

                        var $eventModalContent = $('<ul>')
                            .addClass('form-list')
                            .append($('<li>')
                                .append($('<i>')
                                    .addClass('fa fa-pencil list-item-icon'))
                                .append($nameInput))
                            .append($('<li>')
                                .append($('<div>')
                                    .addClass('split split-left')
                                    .append($('<i>')
                                        .addClass('fa fa-calendar list-item-icon'))
                                    .append($dateInput))
                                .append($('<div>')
                                    .addClass('split split-left')
                                    .append($('<i>')
                                        .addClass('fa fa-clock-o list-item-icon'))
                                    .append($timeInput)))
                            .append($repeatDays);

                        $eventModalContent.find('.checklist-item').click(function() {
                            var $this = $(this);
                            $this.toggleClass('checked');
                            $this.find('.checkbox-icon')
                                .toggleClass('fa-square-o')
                                .toggleClass('fa-check-square-o');

                            var day = $this.find('.day-checkbox-text').text();
                            var dayNumber = possibleDays[day];

                            var removeIndices = [];
                            for (var i = 0; i < chosenRepetitionDays.length; i++) {
                                if (chosenRepetitionDays[i] == dayNumber) {
                                    // remove from array
                                    removeIndices.push(i);
                                }
                            }
                            for (var i = 0; i < removeIndices.length; i++) {
                                chosenRepetitionDays.splice(i, 1);
                            }

                            if ($this.hasClass('checked')) {
                                // add element
                                chosenRepetitionDays.push(dayNumber);
                            }
                        });

                        var modal = new Modal('Create Event', $eventModalContent, [{
                            text: 'Create',
                            type: 'primary',
                            click: function() {
                                var projectData = {
                                    name: $nameInput.val().trim(),
                                    type: 'event',
                                    theme: Extensions.builtinThemes['poly_2'],
                                    viewport: {
                                        zoom: 1.0,
                                        zoomLevel: 0,
                                        left: 0,
                                        top : 0
                                    },
                                    eventInfo: {
                                        date: null,
                                        location: '',
                                        description: '',
                                        recurringDays: chosenRepetitionDays, 
                                        acknowledged: false,
                                        lastAcknowledged: new Date().getTime()
                                    }
                                };

                                var validateInput = function() {
                                    // verify name is not empty
                                    if (!projectData.name || !projectData.name.length) {
                                        // TODO show error for invalid name
                                        return false;
                                    }

                                    // verify date is legal
                                    var timestamp = Date.parse($dateInput.val() + ' ' + $timeInput.val());
                                    if (!Number.isNaN(timestamp)) {
                                        projectData.eventInfo.date = new Date(timestamp).setSeconds(0);
                                    } else {
                                        // TODO show error for invalid date.
                                        return false;
                                    }

                                    // return true at the end if everything has gone successfully
                                    return true;
                                };
                                
                                if (validateInput()) {
                                    // create event, then hide the modal
                                    page.addCircle(position, projectData, {
                                        success: function(element, data) {
                                            projectToAdd = new Project(
                                                page.eltSpaceToZoomSpace({
                                                    x: position.x / page.viewport.zoom,
                                                    y: position.y / page.viewport.zoom
                                                }),
                                                element,
                                                data);

                                            page.addProject(projectToAdd);

                                            // create the event reminder
                                            Event.setupEvent({
                                                position: projectToAdd.position,
                                                data: projectToAdd.data
                                            }, projectToAdd.ref, Event.EVENT_SEARCH_RANGE);

                                            // hide modal once project is created
                                            modal.hide();

                                            // set 'nameBefore' property, so it doesn't act like we need to enter the name
                                            element.nameBefore = data.name;
                                        },
                                        update: function(element, data) {
                                            // update project name in db
                                            if (projectToAdd != null) {
                                                projectToAdd.ref.child('data').update({ 
                                                    name: data.name 
                                                });
                                            }
                                        },
                                        click: function() {
                                            if (projectToAdd != null) {
                                                viewspace.handleObjectClick(projectToAdd);
                                            }
                                        },
                                        finishedDragging: function() {
                                            if (projectToAdd != null) {
                                                projectToAdd.position = page.eltSpaceToZoomSpace({
                                                    x: viewspace.mousePosition.x / page.viewport.zoom,
                                                    y: viewspace.mousePosition.y / page.viewport.zoom
                                                });
                                                projectToAdd.ref.update({
                                                    position: projectToAdd.position
                                                });
                                            }
                                        },
                                        loseFocus: function() { viewspace.objectLoseFocus(); }
                                    });
                                }
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
                        $nameInput.select();
                    }
                },
                {
                    title: 'Sticky',
                    url  : 'img/shapes/sticky.png',
                    select: function() {
                        var projectData = {
                            name: '',
                            type: 'sticky',
                            theme: Extensions.builtinThemes['poly_2'],
                            noteInfo: {
                                text: ''
                            }
                        };

                        page.addCircle(position, projectData, {
                            success: function(element, data) {
                                projectToAdd = new Project(
                                    page.eltSpaceToZoomSpace({
                                        x: position.x / page.viewport.zoom,
                                        y: position.y / page.viewport.zoom
                                    }),
                                    element,
                                    data);
                                
                                page.addProject(projectToAdd);
                            },
                            update: function(element, data) {
                                // update project name in db
                                if (projectToAdd != null) {
                                    projectToAdd.ref.child('data').update({ 
                                        name: data.name 
                                    });
                                }
                            },
                            click: function() {
                                if (projectToAdd != null) {
                                    viewspace.handleObjectClick(projectToAdd);
                                }
                            },
                            finishedDragging: function() {
                                if (projectToAdd != null) {
                                    projectToAdd.position = page.eltSpaceToZoomSpace({
                                        x: viewspace.mousePosition.x / page.viewport.zoom,
                                        y: viewspace.mousePosition.y / page.viewport.zoom
                                    });
                                    projectToAdd.ref.update({
                                        position: projectToAdd.position
                                    });
                                }
                            },
                            loseFocus: function() { viewspace.objectLoseFocus(); }
                        });
                    }
                },
                {
                    title: 'Project',
                    url  : 'img/shapes/circle.png',
                    select: function() {
                        var projectData = {
                            name: null,
                            type: 'group',
                            theme: Extensions.builtinThemes['poly_2'],
                            viewport: {
                                zoom: 1.0,
                                zoomLevel: 0,
                                left: 0,
                                top : 0
                            }
                        };

                        page.addCircle(position, projectData, {
                            success: function(element, data) {
                                projectToAdd = new Project(
                                    page.eltSpaceToZoomSpace({
                                        x: position.x / page.viewport.zoom,
                                        y: position.y / page.viewport.zoom
                                    }),
                                    element,
                                    data);
                                
                                page.addProject(projectToAdd);
                            },
                            update: function(element, data) {
                                // update project name in db
                                if (projectToAdd != null) {
                                    projectToAdd.ref.child('data').update({ 
                                        name: data.name 
                                    });
                                }
                            },
                            click: function() {
                                if (projectToAdd != null) {
                                    viewspace.handleObjectClick(projectToAdd);
                                }
                            },
                            finishedDragging: function() {
                                if (projectToAdd != null) {
                                    projectToAdd.position = page.eltSpaceToZoomSpace({
                                        x: viewspace.mousePosition.x / page.viewport.zoom,
                                        y: viewspace.mousePosition.y / page.viewport.zoom
                                    });
                                    projectToAdd.ref.update({
                                        position: projectToAdd.position
                                    });
                                }
                            },
                            loseFocus: function() { viewspace.objectLoseFocus(); }
                        });
                    }
                },
                {
                    title: 'Task',
                    url  : 'img/shapes/todo.png'
                }]
        }
    };

    return RadialMenu;
});