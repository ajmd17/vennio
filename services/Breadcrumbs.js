app.factory('Breadcrumbs', function($rootScope, $location) {
    return {
        update: function(viewspace) {
            var $topBreadcrumbs = $('#top-breadcrums');
            $topBreadcrumbs.empty();

            var elementsToAdd = [];

            var page = viewspace.getCurrentPage();
            while (page !== undefined && page !== null) {
                var $a  = $('<a>').append(page.name);
                if (page == viewspace.getCurrentPage()) {
                    $a.addClass('current');
                } else {
                    (function(thisPage) {
                        $a.click(function() {
                            // navigate to parent page
                            viewspace.goToProjectUrl(thisPage);
                        });
                    })(page);
                }

                elementsToAdd.push($('<li>').append($a));

                page = page.parentPage;
            }

            for (var i = elementsToAdd.length - 1; i >= 0; i--) {
                $topBreadcrumbs.append(elementsToAdd[i]);
            }
        }
    };
});