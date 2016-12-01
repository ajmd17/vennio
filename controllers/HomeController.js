app.controller('HomeController', function($scope, $location, $routeParams, Auth, AuthWaitForSignIn, Viewspace, Breadcrumbs, Extensions, Event) {
    // reset toast height
    Toast.totalToastHeight = 0;
    console.log('$routeParams = ', $routeParams);
    
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

    /** Load the preferences */
    function loadPreferences() {
        Toast.animations = Auth.getUser().preferences.enableAnimations.enabled;
    }

    // main entry point for when login is verified
    function afterLogin() {
        loadPreferences();

        $('#share-btn').click(function() {
            var pageStr = '';

            if (Breadcrumbs.parts.length == 1) {
                pageStr = 'all';
            } else {
                pageStr = '"';
                var start = Breadcrumbs.parts.length - 2;
                if (Breadcrumbs.parts.length > 3) {
                    start = 2;
                    pageStr += '...';
                }
                for (var i = start; i >= 0; i--) {
                    if (i == start) {
                        // remove leading '/'
                        pageStr += Breadcrumbs.parts[i].slice(1);
                    } else {
                        pageStr += Breadcrumbs.parts[i];
                    }
                }
                pageStr += '"';
            }

            var $shareUrlInput = $('<input type="text" class="share-url-input">')
                .addClass()
                .css({
                    "max-width": '100%',
                    "margin": 0
                })
                .val(window.location.href);

            var $shareContent = $('<ul>')
                .addClass('form-list')
                .append($('<li>')
                    .append($shareUrlInput));

            var modal = new Modal('Share ' + pageStr, $shareContent,  [{
                text: 'OK',
                type: 'primary',
                click: function() {
                    modal.hide();
                }
            }], {
                show: function() {
                    $shareUrlInput.attr('tabindex', -1).select();
                }
            });

            modal.show();
        });

        $('#settings-btn').click(function() {
            $(this).toggleClass('active');
            $('#settings-menu').toggle();
        });

        $('#preferences-menu-item').click(function() {
            $('#settings-btn').removeClass('active');
            $('#settings-menu').hide();

            var userRef = Auth.getDatabase().ref('users')
                .child(Auth.getUser().key);

            var preferencesItems = null;
            if (Auth.getUser().preferences !== undefined && Auth.getUser().preferences !== null) {
                preferencesItems = Auth.getUser().preferences;
            } else {
                preferencesItems = {
                    "enableAnimations": {
                        "pretty": "Enable Animations",
                        "enabled": true
                    },
                }; // default prefs
                userRef.update({
                    "preferences": preferencesItems
                });
                loadPreferences();
            }

            var $preferencesContent = $('<div>')
            
            Object.keys(preferencesItems).forEach(function(it) {
                var $item = $('<div>')
                .addClass('checklist-item')
                .append('<i class="checkbox-icon fa fa-square-o">')
                .append($('<div>')
                    .addClass('day-checkbox-text')
                    .append(preferencesItems[it].pretty));

                $item[0].prefItemId = it;

                if (preferencesItems[it].enabled) {
                    $item.addClass('checked');
                    $item.find('.checkbox-icon')
                        .toggleClass('fa-square-o')
                        .toggleClass('fa-check-square-o');
                }

                $preferencesContent.append($item);
            });

            $preferencesContent.find('.checklist-item').click(function() {
                var $this = $(this);
                $this.toggleClass('checked');
                $this.find('.checkbox-icon')
                    .toggleClass('fa-square-o')
                    .toggleClass('fa-check-square-o');

                preferencesItems[$this[0].prefItemId].enabled = $this.hasClass('checked');

            });

            var modal = new Modal('Preferences', $preferencesContent, [{
                text: 'Apply',
                type: 'primary',
                click: function() {
                    // update preferences
                    userRef.update({
                        "preferences": preferencesItems
                    });
                    // reload prefs
                    loadPreferences();

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

        $('#log-out-btn').click(function() {
            console.log('log out clicked');
            // sign out firebase
            Auth.getAuth().$signOut().then(function() {
                $location.path('/');
            }, function(err) {
                // something happened
                alert(err.toString());
            })
        });

        

        // scan for events that are in range
        Event.findEventsInRange(Event.EVENT_SEARCH_RANGE);

        if (Auth.getUser().currentThemeName == undefined || Auth.getUser().currentThemeName == null) {
            Auth.getUser().currentThemeName = 'poly';
        }

        console.log('$routeParams = ', $routeParams);

        // parse $routeParams
        if ($routeParams.project !== undefined) {
            // $routeParams has been defined to we know
            // that the user is loading a project via url
            (function(projectKeyArray) {
                // 1st parameter of routeparams should be the user id
                // if there are no paramters then assume Auth.getUser().key
                var userKey = projectKeyArray.length === 0 ? Auth.getUser().key : projectKeyArray[0];
                var projectRef = Auth.getDatabase().ref('users')
                    .child(userKey);

                console.log('projectRef = ', projectRef);

                loadUser(userKey, projectRef, function(user) {

                    // create root projects page
                    var projectPage = Viewspace.createHomePage(user);

                    if (projectKeyArray.length == 1) {
                        // load the homepage right away, no other sub projects
                        // init viewspace for user
                        Viewspace.init(user, projectPage);
                        afterViewspaceInit(user.key);
                        
                    } else {

                        // load projects from db so we can
                        // use the breadcrumbs to go back
                        projectPage.loadProjectsFromDatabase(userKey, false);

                        (function loadPageFromUrl(i) {
                            projectRef = projectRef.child(i == 1 ? 'projects' : 'data/subnodes')
                                .child(projectKeyArray[i]);

                            projectRef.once('value', function(snapshot) {
                                var loadedProject = snapshot.val();
                                if (loadedProject !== undefined && loadedProject !== null) {
                                    // set up the ties back to the database
                                    loadedProject.ref = projectRef;
                                    loadedProject.key = projectRef.key;

                                    projectPage = Viewspace.createPage(loadedProject, projectPage);

                                    if (i + 1 < projectKeyArray.length) {
                                        // load projects from db so we can
                                        // use the breadcrumbs to go back
                                        projectPage.loadProjectsFromDatabase(userKey, false);
                                        // do next
                                        loadPageFromUrl(i + 1);
                                    } else {
                                        // no more projects to load
                                        // now load the project on the Viewspace service.

                                        // init viewspace for user
                                        Viewspace.init(user, projectPage);
                                        afterViewspaceInit(user.key);
                                    }
                                } else {
                                    console.log('could not load snapshotValue for projectRef: ', projectRef);
                                }
                            });
                        })(1);
                    }

                });

            })($routeParams.project.split('/'));
        } else {
            // init Viewspace with no loaded project
            // no key has been provided so assume it's the logged in user's id
            Viewspace.init(Auth.getUser(), null);
            afterViewspaceInit(Auth.getUser().key);
        }

        function loadUser(userKey, projectRef, after) {
            if (userKey != Auth.getUser().key) {
                // another user other than the logged in one.
                // have to load the info from firebase
                projectRef.once('value').then(function(snapshot) {
                    var otherUser = snapshot.val();
                    otherUser.key = userKey;

                    after(otherUser);
                }).catch(function(err) {
                    window.alert(err);
                });
            } else {
                after(Auth.getUser());
            }
        }

        function afterViewspaceInit(userKey) {
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
                                    .child(userKey);
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

            // to prevent scrolling in on the page
            $(window).on('wheel mousewheel', function(e) {
                if (e.ctrlKey) {
                    e.preventDefault();
                }
            }).click(function(e) {
                var $target = $(e.target);
                if (!$target.is('.project-circle') && !$('.project-circle').has($target).length) {
                    Viewspace.objectLoseFocus();
                }
            }).on('mouseup', function(e) {
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
        };
    }
});