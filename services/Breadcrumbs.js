app.factory('Breadcrumbs', function() {
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
    };

    return Breadcrumbs;
});