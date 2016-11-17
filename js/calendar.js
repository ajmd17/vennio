var WEEKDAY_NAMES = [
    "Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"
];
var MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function getDaysInMonth(year, month) {
    return new Date(year, month - 1, 0).getDate();
}

function updateCalendarData(calendar, date) {
    var $calendar  = $(calendar);
    var $monthName = $calendar.find(".month-name");
    var $weekdays  = $calendar.find(".weekdays");
    var $days      = $calendar.find(".days");

    $days.empty();

    $monthName.html(MONTH_NAMES[date.getMonth()]);

    var year  = date.getFullYear();
    var month = date.getMonth();

    var firstDay = new Date(year, month, 1);
    var startingDay = firstDay.getDay();
    var daysInMonth = getDaysInMonth(year, month);
    
    // what to count to
    var counter = 0;
    if (daysInMonth != 0) {
        counter = 7 * Math.ceil(daysInMonth / 7);
    }

    var dayNumber = 1; // day of the month
    for (var i = 0; i < counter; i++) {
        var $dayElement = $("<li>");

        if (i >= startingDay && dayNumber <= daysInMonth) {
            $dayElement.append($("<div>")
                .addClass("day-item")
                .append($("<a href=\"#\">")
                    .append(dayNumber.toString())));
            dayNumber++;
        } else {
            $dayElement.css({
                "visibility": "hidden"
            });
        }

        $days.append($dayElement);
    }
}

function createCalendarElement() {
    var $calendarDiv = $("<div>")
        .addClass("calendar")
        .append($("<h3>")
            .addClass("month-name"));

    var $weekdays = $("<ul>")
        .addClass("weekdays");

    for (var i = 0; i < WEEKDAY_NAMES.length; i++) {
        $weekdays.append($("<li>")
            .append(WEEKDAY_NAMES[i]));
    }
    $calendarDiv.append($weekdays);

    var $days = $("<ul>")
        .addClass("days");
    $calendarDiv.append($days);

    updateCalendarData($calendarDiv, new Date());

    return $calendarDiv;
}