function Tooltip($element, title, content, callbacks) {
    this.title   = title;
    this.content = content;
    this.showing = false;

    if (callbacks !== undefined) {
        this.callbacks = callbacks;
    } else {
        this.callbacks = {};
    }

    var tooltip = this;

    var $tooltipContent = $("<div>")
        .addClass("tooltip");

    if (this.title != "") {
        $tooltipContent.append($("<div>")
                .addClass("banner")
                .append(title));
    }
    
    $tooltipContent.append($("<div>")
        .addClass("tooltip-body")
        .append(content));

    this.$tooltipElement = $("<div>")
        .addClass("tooltip-wrapper")
        .css({
            "position": "fixed",
            "z-index" : "1000",
            "opacity" : 0
        })
        .append($tooltipContent)
        .focusout(function(e) {
            $(this).animate({
                "opacity": 0
            }, 300, function() {
                tooltip.hide();
            });
        });

    $element.click(function(e) {
        if (!tooltip.showing) {
            tooltip.show($(this));
        } else {
            e.preventDefault();
            tooltip.$tooltipElement.animate({
                "opacity": 0
            }, 300, function() {
                tooltip.hide();
            });
        }
    });
}

Tooltip.prototype.getElement = function() {
    return this.$tooltipElement;
};

Tooltip.prototype.show = function(element) {
    var $body    = $("body");
    var $element = $(element);

    var left = $element.offset().left;
    var top  = $element.offset().top + $element.height();

    console.log(left, top);

    this.$tooltipElement.css({
        "left": left.toString() + "px",
        "top" : top.toString()  + "px"
    });

    this.$tooltipElement.animate({
        "opacity": 1
    }, 300);

    $body.append(this.$tooltipElement);
    this.$tooltipElement.attr("tabindex", -1).focus();
    this.showing = true;

    if (this.callbacks.show !== undefined) {
        this.callbacks.show();
    }
};

Tooltip.prototype.hide = function() {
    this.$tooltipElement.detach();
    this.showing = false;

    if (this.callbacks.hide !== undefined) {
        this.callbacks.hide();
    }
};