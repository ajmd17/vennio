var totalToastHeight = 0;

function Toast(title, content, callbacks) {
    this.title   = title;
    this.content = content;
    
    if (callbacks !== undefined && callbacks !== null) {
        this.callbacks = callbacks;
    } else {
        this.callbacks = {};
    }
    
    this.$toastElement = (function(toast) {
        return $("<div>")
            .addClass("toast-wrapper")
            .append($("<div>")
                .addClass("toast")
                .click(function(e) {
                    e.stopPropagation();

                    if (toast.callbacks.click != undefined) {
                        toast.callbacks.click();
                    }
                    toast.hide();
                })
                .append($("<h3>")
                    .append(toast.title))
                .append($("<div>")
                    .addClass("toast-content")
                    .append(toast.content)));
    })(this);
}

Toast.prototype.getElement = function() {
    return this.$toastElement;
};

Toast.prototype.show = function() {
    this.$toastElement.css({
        "top": totalToastHeight.toString() + "px"
    });
    
    $("body").append(this.$toastElement);

    this.toastHeight = this.$toastElement.height();
    totalToastHeight += this.toastHeight;

    if (this.callbacks.show !== undefined) {
        this.callbacks.show();
    }
};

Toast.prototype.hide = function() {
    if (globalConfig.visuals.enableAnimations) {
        // animate the toast so that it goes out of view
        this.$toastElement.animate({
            "right": (-1 * this.toastHeight).toString() + "px",
            "opacity": 0
        }, 200, function() {
            $(this).remove();
        })
    } else {
        this.$toastElement.remove();
    }

    if (this.toastHeight !== undefined && this.toastHeight !== null) {
        // modify all other toasts
        var $toastWrapper = $(".toast-wrapper");
        var change = {
            "top": "-=" + this.toastHeight.toString() + "px"
        };

        $toastWrapper.each(function() {
            var $this = $(this);
            if ($this.position().top > 0) {
                if (globalConfig.visuals.enableAnimations) {
                    $this.animate(change, 200);
                } else {
                    $this.css(change);
                }
            }
        });

        totalToastHeight -= this.toastHeight;
    }

    if (this.callbacks.hide !== undefined) {
        this.callbacks.hide();
    }
};