app.factory('Extensions', function() {
    /** theme.js */
    function Theme(backgroundUrl, previewUrl, isVideo, blurAmt) {
        this.backgroundUrl = backgroundUrl;
        this.previewUrl = previewUrl;
        this.isVideo = isVideo;
        this.blurAmt = blurAmt;
    };
    
    var Extensions = {
        builtinThemes: {
            leaves: new Theme('videos/leaves.mp4', '', true, 18),
            stars:  new Theme('videos/stars.mp4', '', true, 8),
            woods:  new Theme('videos/woods.mp4', '', true, 8),
            autumn_leaf: new Theme('videos/autumn-leaf.mp4', '', true, 8),
            poly:   new Theme('img/poly.png', 'img/theme_previews/poly.png', false, 0),
            poly_2: new Theme('img/poly_2.png', 'img/theme_previews/poly_2.png', false, 0),
            poly_green: new Theme('img/poly-green.png', 'img/theme_previews/poly-green.png', false, 0),
            hex:    new Theme('img/hex.png', 'img/theme_previews/hex.png', false, 0),
            milky_way: new Theme('img/milky-way.jpg', 'img/theme_previews/milky-way.png', false, 0)
        }
    };

    return Extensions;
});