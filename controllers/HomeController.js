app.controller('HomeController', function($scope, $location, Auth, AuthWaitForSignIn, Viewspace, Extensions, Event) {
    if (Auth.getUser() === null) {
        $scope.isSignedIn = false;
        Auth.handleLogin(AuthWaitForSignIn, function() {
            $scope.isSignedIn = true;
            $scope.$apply();
            afterLogin();
        });
    } else {
        $scope.isSignedIn = true;
        $(document).ready(afterLogin);
    }

    $scope.redirectToLoginPage = function() {
        $location.path('/');
    };
    
    /** app.js */

    $(document).ready(function() {
        $('#menu-btn').click(function() {
            $(this).toggleClass('active');
            Viewspace.toggleSidebar();
        });
    });

    // main entry point for when login is verified
    function afterLogin() {
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

            for (theme in Extensions.builtinThemes) {
                var previousTheme = Viewspace.getCurrentPage().getTheme();
                (function(thisTheme) {
                    if (thisTheme.previewUrl !== undefined && thisTheme.previewUrl !== null && thisTheme.previewUrl.length !== 0) {
                        if (thisTheme.isVideo) {
                            dynamicThemes.push(thisTheme);
                        } else {
                            staticThemes.push(thisTheme);
                        }
                    }
                })(Extensions.builtinThemes[theme]);
            }

            var appendThemePreview = function(thisTheme, $themeListElement) {
                $themeListElement.append($('<li>')
                    .addClass('theme-selection-item')
                    .append($('<img src="' + thisTheme.previewUrl + '">'))
                    .hover(function() {
                        Viewspace.getCurrentPage().setTheme(thisTheme);
                    }, function() {
                        Viewspace.getCurrentPage().setTheme(previousTheme);
                    })
                    .click(function() {
                        Viewspace.getCurrentPage().setTheme(thisTheme);
                        previousTheme = thisTheme;
                        modal.hide();

                        // update in database
                        var dataRef = null;
                        if (Viewspace.getCurrentPage().pageProject !== undefined && Viewspace.getCurrentPage().pageProject !== null) {
                            dataRef = Viewspace.getCurrentPage().pageProject.ref
                                .child('data');
                        } else {
                            dataRef = Auth.getDatabase().ref('users')
                                .child(Auth.getUser().key);
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
        Event.findEventsInRange(Event.EVENT_SEARCH_RANGE);

        if (Auth.getUser().currentThemeName == undefined || Auth.getUser().currentThemeName == null) {
            Auth.getUser().currentThemeName = 'poly';
        }

        Viewspace.init();

        // to prevent scrolling in on the page
        $(window).on('wheel mousewheel', function(e) {
            if (e.ctrlKey) {
                e.preventDefault();
            }
        })
        .click(function(e) {
            var $target = $(e.target);
            if (!$target.is('.project-circle') && !$('.project-circle').has($target).length) {
                Viewspace.objectLoseFocus();
            }
        })
        .on('mouseup', function(e) {
            console.log('mouseup on document');
            window.clearTimeout(Viewspace.mouseHoldId);

            if (Viewspace.showRipple && Viewspace.dragTime == 0) {
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

            $(Viewspace.getCurrentPage().getElement()).css('cursor', 'auto');

            // clear dragging, panning, etc.
            Viewspace.clearObjectDrag();
            Viewspace.isPanning = false;
            Viewspace.dragTime = 0;
            Viewspace.showRipple = false;
        });
    }

    
});