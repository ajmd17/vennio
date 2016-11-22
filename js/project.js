function Project(position, element, data) {
    this.position     = position;
    this.element      = element;
    this.data         = data;
}

Project.prototype.getPosition = function() {
    return this.position;
};

Project.prototype.setPosition = function(position) {
    this.position = position;
    if (this.element != undefined) {
        // TODO move it
    }
};