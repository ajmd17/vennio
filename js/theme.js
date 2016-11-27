function Theme(backgroundUrl, previewUrl, backgroundType, blurAmt) {
    this.backgroundUrl = backgroundUrl;
    this.previewUrl = previewUrl;
    this.backgroundType = backgroundType;
    this.blurAmt = blurAmt;
}

var BackgroundType = {
    IMAGE: 0,
    VIDEO: 1
};

var BUILTIN_THEMES = {
    leaves: new Theme('videos/leaves.mp4', '', BackgroundType.VIDEO, 18),
    stars:  new Theme('videos/stars.mp4', '', BackgroundType.VIDEO, 8),
    woods:  new Theme('videos/woods.mp4', '', BackgroundType.VIDEO, 8),
    autumn_leaf: new Theme('videos/autumn-leaf.mp4', '', BackgroundType.VIDEO, 8),
    poly:   new Theme('img/poly.png', 'img/theme_previews/poly.png', BackgroundType.IMAGE, 0),
    poly_2: new Theme('img/poly_2.png', 'img/theme_previews/poly_2.png', BackgroundType.IMAGE, 0),
    poly_green: new Theme('img/poly-green.png', 'img/theme_previews/poly-green.png', BackgroundType.IMAGE, 0),
    hex:    new Theme('img/hex.png', 'img/theme_previews/hex.png', BackgroundType.IMAGE, 0),
    milky_way: new Theme('img/milky-way.jpg', 'img/theme_previews/milky-way.png', BackgroundType.IMAGE, 0)
};