function Project(name, position, element, projectClass) {
    this.name = name;
    this.position = position;
    this.element = element;
    this.projectClass = projectClass;
}

Project.prototype.setPosition = function(position) {
    this.position = position;
    if (this.element != undefined) {
        // TODO move it
    }
};
