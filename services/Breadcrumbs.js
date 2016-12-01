app.factory('Breadcrumbs', function($rootScope, $location) {
    return {
        parts: [],

        update: function(userKey, viewspace) {
            var $topBreadcrumbs = $('#top-breadcrums');
            $topBreadcrumbs.empty();

            var elementsToAdd = [];

            var pageTitle = 'Vennio';
            this.parts = []; // clear project title

            var page = viewspace.getCurrentPage();
            while (page !== undefined && page !== null) {
                if (page.parentPage !== undefined && page.parentPage !== null) {
                    this.parts.push('/' + page.name);
                } else {
                    this.parts.push(page.name);
                }

                var $li = $('<li>');
                if (page == viewspace.getCurrentPage()) {
                    $li.append($('<a>').addClass('current').append(page.name));
                } else {
                    var $a = $('<a>').append(page.name);
                    (function(thisPage) {
                        $a.click(function() {
                            // navigate to parent page
                            viewspace.goToProjectUrl(userKey, thisPage);
                        });
                    })(page);
                    $li.append($a);
                }

                elementsToAdd.push($li);

                page = page.parentPage;
            }

            for (var i = elementsToAdd.length - 1; i >= 0; i--) {
                if (globalConfig.visuals.enableAnimations) {
                    // animate each item
                    $topBreadcrumbs.append(elementsToAdd[i]
                        .css('opacity', 0)
                        .animate({"opacity": 1}, 
                            150 + (((elementsToAdd.length - (i + 1)) / elementsToAdd.length) * 400)));
                } else {
                    $topBreadcrumbs.append(elementsToAdd[i]);
                }
            }

            if (this.parts.length != 0) {
                pageTitle += ' - ';
                for (var i = this.parts.length - 1; i >= 0; i--) {
                    pageTitle += this.parts[i];
                }
            }

            document.title = pageTitle;
        }
    };
});