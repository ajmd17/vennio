var WEEKDAY_NAMES = [
    "Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"
];
var MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function Calendar(date, dateChangedCallback) {
    if (date != undefined) {
        this.date = date;
    } else {
        this.date = new Date();
    }
    
    this.dateChangedCallback = dateChangedCallback;

    var $banner = $("<div>")
        .addClass("banner");    
    var $weekdays = $("<ul>")
        .addClass("weekdays");

    WEEKDAY_NAMES.forEach(function(element) {
        $weekdays.append($("<li>")
            .append(element));
    });

    var $weekdaysWrapper = $("<div>")
        .addClass("weekdays-wrapper")
        .append($weekdays);
    var $daysWrapper = $("<div>")
        .addClass("days-wrapper")
        .append($("<div>")
            .addClass("days"));

    this.$calendarElement = $("<div>")
        .addClass("cal")
        .append($banner)
        .append($weekdaysWrapper)
        .append($daysWrapper);

    (function(calendar) {
        $(window).resize(function() {
            calendar.updateSize();
        });
    })(this);
    
    this.updateData();
}

Calendar.prototype.getDate = function() {
    return this.date;
};

Calendar.prototype.getElement = function() {
    return this.$calendarElement;
};

Calendar.prototype.updateData = function() {
    var calendar   = this;
    
    var $cal       = this.$calendarElement;
    var $banner    = $cal.find(".banner");
    var $weekdays  = $cal.find(".weekdays");
    var $days      = $cal.find(".days");

    var year  = this.date.getFullYear();
    var month = this.date.getMonth();

    var firstDay    = new Date(year, month, 1);
    var startingDay = firstDay.getDay();
    var daysInMonth = getDaysInMonth(year, month);

    // day of the month to be output
    var dayNumber = 1;
    var counter = 0;

    if ($days.length > 0) {
        $days.empty();
    }

    if ($banner.length > 0) {
        $banner.empty();
        
        $banner.append($("<div>")
            .append("<i class=\"fa fa-chevron-left\">")
            .addClass("month-back")
            .click(function() {
                // go back a month
                var newDate = calendar.date;
                var day = newDate.getDate();
                var daysInMonth = getDaysInMonth(newDate.getFullYear(), newDate.getMonth() - 1);
                if (day > daysInMonth) {
                    newDate.setDate(daysInMonth);
                }
                newDate.setMonth(newDate.getMonth() - 1);
                calendar.updateData();
                calendar.updateSize();
            }));
        $banner.append($("<div>")
            .append(MONTH_NAMES[calendar.date.getMonth()])
            .append(" " + calendar.date.getFullYear().toString()));
        $banner.append($("<div>")
            .append("<i class=\"fa fa-chevron-right\">")
            .addClass("month-forward")
            .click(function() {
                // go forward a month
                var newDate = calendar.date;
                var day = newDate.getDate();
                var daysInMonth = getDaysInMonth(newDate.getFullYear(), newDate.getMonth() + 1);
                if (day > daysInMonth) {
                    newDate.setDate(daysInMonth);
                }
                newDate.setMonth(newDate.getMonth() + 1);
                calendar.updateData();
                calendar.updateSize();
            }));
    }
    
    if (daysInMonth != 0) {
        counter = 7 * Math.ceil((daysInMonth + startingDay) / 7);
    }

    var $dayElement  = null;
    var $weekElement = null;
    var atEnd = false;

    for (var i = 0; i <= counter; i++) {
        $dayElement = $("<li>");

        atEnd = (i == counter);

        if (i % 7 == 0 || atEnd) {
            if ($weekElement != null) {
                // append old week
                $days.append($weekElement);
            }

            // create new week object
            $weekElement = $("<ul>")
                .addClass("week");
        }

        if (!atEnd) {
            if (i >= startingDay && dayNumber <= daysInMonth) {
                (function(day) {
                    var $elt = $("<div>")
                        .addClass("day")
                        .append(day.toString())
                        .click(function() {
                            // set new day, but do not re-create element.
                            if (calendar.date.getDate() != day) {
                                calendar.date.setDate(day);

                                $(".day").removeClass("active");
                                $(this).addClass("active");

                                // trigger callback because we are not calling updateData()
                                if (calendar.dateChangedCallback != undefined) {
                                    calendar.dateChangedCallback(calendar.date);
                                }
                            }
                        });

                    if (calendar.date.getDate() == day) {
                        $elt.addClass("active");
                    }

                    $dayElement.append($elt);
                })(dayNumber++);
            } else if (i < startingDay) {
                $dayElement.append($("<div>")
                    .append(new Date(year, month, -1 * (startingDay - i) + 1).getDate())
                        .addClass("day"))
                    .addClass("next-month");
            } else if (dayNumber > daysInMonth) {
                $dayElement.append($("<div>")
                    .append(new Date(year, month, dayNumber++).getDate())
                        .addClass("day"))
                    .addClass("next-month");
            }

            $weekElement.append($dayElement);
        }
    }

    if (this.dateChangedCallback != undefined) {
        this.dateChangedCallback(this.date);
    }
};

Calendar.prototype.updateSize = function() {
    var width     = this.$calendarElement.width();
    var eltSize   = width / 7;

    var $days       = this.$calendarElement.find(".days");
    var $daysLi     = $days.find("li");

    var $weekdays   = this.$calendarElement.find(".weekdays");
    var $weekdaysLi = $weekdays.find("li");

    $weekdaysLi.css("width", eltSize.toString() + "px");
    $daysLi.css({
        "width" : eltSize.toString() + "px",
        "height": eltSize.toString() + "px",
        "line-height": eltSize.toString() + "px"
    });

    var bannerSize  = 22;
    var weekdaySize = 16;
    var daySize     = 20;

    if (width >= 750) {
        bannerSize  = 30;
        weekdaySize = 20;
        daySize     = 22;
    } else if (width >= 600) {
        bannerSize  = 28;
        weekdaySize = 18;
        daySize     = 18;
    } else if (width >= 400) {
        bannerSize  = 24;
        weekdaySize = 16;
        daySize     = 16;
    } else {
        bannerSize  = 20;
        weekdaySize = 12;
        daySize     = 14;
    }

    this.$calendarElement.find(".banner").css("font-size", bannerSize);
    $weekdaysLi.css("font-size", weekdaySize);
    $daysLi.css("font-size", daySize);
};

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}