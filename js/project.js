function Project(name, position, element) {
    this.name = name;
    this.position = position;
    this.element = element;
}

Project.prototype.setPosition = function(position) {
    this.position = position;
    if (this.element != undefined) {
        // TODO move it
    }
};
