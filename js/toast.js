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

Toast.totalToastHeight = 0;
Toast.toasts = [];
Toast.animations = true;

Toast.prototype.getElement = function() {
    return this.$toastElement;
};

Toast.prototype.show = function() {
    this.$toastElement.css({
        "top": Toast.totalToastHeight.toString() + "px"
    });
    
    $("body").append(this.$toastElement);

    this.toastHeight = this.$toastElement.height();
    Toast.totalToastHeight += this.toastHeight;

    this.index = Toast.toasts.length;
    Toast.toasts.push(this);

    if (this.callbacks.show !== undefined) {
        this.callbacks.show();
    }
};

Toast.prototype.hide = function() {
    if (Toast.animations) {
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
        if (Toast.toasts.length - 1 > this.index) {
            var change = {
                "top": "-=" + this.toastHeight.toString() + "px"
            };

            for (var i = this.index; i < Toast.toasts.length; i++) {
                if (Toast.animations) {
                    Toast.toasts[i].$toastElement.animate(change, 200);
                } else {
                    Toast.toasts[i].$toastElement.css(change);
                }
            }
        }

        Toast.totalToastHeight -= this.toastHeight;
    }

    if (this.callbacks.hide !== undefined) {
        this.callbacks.hide();
    }
};