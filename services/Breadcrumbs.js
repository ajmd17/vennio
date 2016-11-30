app.factory('Breadcrumbs', function($rootScope, $location) {
    var Breadcrumbs = {
        update: function(viewspace) {
            var $topBreadcrumbs = $('#top-breadcrums');
            $topBreadcrumbs.empty();

            var elementsToAdd = [];

            var page = viewspace.getCurrentPage();
            while (page !== undefined && page !== null) {
                var $li = $('<li>');
                var $a  = $('<a>').append(page.name);

                if (page == viewspace.getCurrentPage()) {
                    $a.addClass('current');
                } else {
                    (function(thisPage) {
                        $a.click(function() {
                            // navigate to parent page
                            //viewspace.setCurrentPage(thisPage);

                            if (thisPage.pageProject !== undefined && thisPage.pageProject !== null) {
                                var pathParts = [project.key];
                                var page = viewspace.getCurrentPage();
                                while (page !== undefined && page !== null) {
                                    if (page.pageProject !== undefined && page.pageProject !== null) {
                                        // add firebase key
                                        pathParts.push(page.pageProject.key);
                                    }
                                    page = page.parentPage;
                                }

                                console.log('pathParts = ', pathParts);
                                var path = '/home';
                                for (var i = pathParts.length - 1; i >= 0; i--) {
                                    path += '/' + pathParts[i].toString();
                                }
                                
                                $location.path(path);
                                $rootScope.$apply();
                            }
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
    };

    return Breadcrumbs;
});