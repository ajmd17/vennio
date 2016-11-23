// functions project types can have include:
// 'createContent', 'doubleClick', 'loseFocus'
var projectFunctions = {
    group: {
        createContent: function(data, isNewlyCreated) {
            if (isNewlyCreated) {
                return $('<div>')
                    .addClass('project-circle-text')
                    .append($('<input type="text">')
                        .addClass('project-circle-text-edit')
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
                    .val(name);

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
        }
    },

    event: {
        createContent: function(data, isNewlyCreated) {
            return $('<div>')
                .addClass('project-circle-text')
                .css({
                    "top": '35%',
                    "transform": 'translateX(-50%) translateY(-35%)'
                })
                .append($('<div>')
                    .addClass('project-title-div')
                    .append(data.name));
        },

        doubleClick: function(element, data, callbacks) {
            // TODO edit the event
        },

        loseFocus: function(element, data, callbacks) {
            if (callbacks.success != undefined) {
                callbacks.success(element, data);
            }
        }
    },
};