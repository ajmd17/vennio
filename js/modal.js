function Modal(title, content, buttons) {
    this.title = title;
    this.content = content;
    this.buttons = buttons;

    var modal = this;

    // create the elements
    this.$backgroundElement = $("<div>")
        .addClass("modal-background")
        .css({
            "opacity": 0
        });
        
    this.$modalWindowElement = $("<div>")
        .addClass("modal-wrapper")
        .css({
            "opacity": 0,
            "position": "fixed",
            "top": "50%",
            "left": "50%",
            "transform": "translateX(-50%) translateY(-50%)",
            "z-index": "1000"
        })
        .append($("<div>")
            .addClass("modal")
            .append($("<div>")
                .addClass("modal-top")
                .append($("<i>")
                    .addClass("fa fa-times")
                    .css({
                        "font-size": "20px",
                        "float": "left",
                        "position": "absolute",
                        "margin-left": "8px",
                        "margin-top": "4px",
                        "cursor": "pointer"
                    })
                    .click(function() {
                        modal.hide();
                    }))
                .append($("<h3>")
                    .addClass("modal-title")
                    .append(this.title)))
            .append($("<hr>"))
            .append($("<div>")
                .addClass("modal-body")
                .append(content))
            .append($("<div>")
                .addClass("modal-bottom")));
}

Modal.prototype.show = function() {
    var modal = this;

    var $body = $("body");

    $(".modal-background-blurred").css("filter", "blur(2px)");

     // create events
    this.$backgroundElement.click(function(event) {
        // do not bubble up the DOM
        event.stopPropagation();
        // remove the modal
        modal.hide();
    });

    $body.append(this.$backgroundElement);
    this.$backgroundElement.animate({
        "opacity": 1
    }, 200);

    $body.append(this.$modalWindowElement);
    this.$modalWindowElement.animate({
        "opacity": 1
    }, 200);
};

Modal.prototype.hide = function() {
    $(".modal-background-blurred").css("filter", "");

    this.$backgroundElement.unbind();
    this.$backgroundElement.animate({
        "opacity": 0
    }, 200, function() {
        $(this).remove();
    });

    this.$modalWindowElement.unbind();
    this.$modalWindowElement.animate({
        "opacity": 0
    }, 200, function() {
        $(this).remove();
    });
};