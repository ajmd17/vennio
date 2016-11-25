Array.prototype.contains = function(obj) {
    var i = this.length;

    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }

    return false;
};

function copyProperties(dst, src) {
    for (attrib in src) {
        if (src.hasOwnProperty(attrib)) {
            if (typeof src[attrib] === 'object') {
                dst[attrib] = {};
                copyProperties(dst[attrib], src[attrib]);
            } else if (typeof src[attrib] !== 'function') {
                dst[attrib] = src[attrib];
            }
        }
    }
}

function randRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roundTo(num, to) {
    return Math.floor(to * Math.ceil(num / to));
}

// attrib is an object containing the key and value
// of what to search for like so
// { "email": "blahblah@blah.com" }
function snapshotHasProperty(snapshot, attrib) {
    if (!snapshot) {
        return null;
    }

    var snapshotValue = snapshot.val();
    if ((snapshotValue !== undefined && snapshotValue !== null) &&
        Object.keys(snapshotValue).length != 0) {

        var attribKeys = Object.keys(attrib);
        var attribKey = attribKeys[0].toString();
        var attribVal = attrib[attribKey];

        var snapshotKeys = Object.keys(snapshotValue);

        for (var i = 0; i < snapshotKeys.length; i++) {
            var curObject = snapshotValue[snapshotKeys[i]];
            if (curObject[attribKey] == attribVal) {
                curObject.key = snapshotKeys[i];
                return curObject;
            }
        }
    }

    return null;
}

function replaceSvg(elt) {
    $(elt).each(function() {
        var $img = $(this);
        var imgID = $img.attr("id");
        var imgClass = $img.attr("class");
        var imgURL = $img.attr("src");

        $.get(imgURL, function(data) {
            var $svg = $(data).find("svg");

            if (imgID !== undefined) {
                $svg = $svg.attr("id", imgID);
            }
            if (imgClass !== undefined) {
                $svg = $svg.attr("class", imgClass + " replaced-svg");
            }

            $svg = $svg.removeAttr("xmlns:a");

            if (!$svg.attr("viewBox") && $svg.attr("height") && $svg.attr("width")) {
                $svg.attr("viewBox", "0 0 " + $svg.attr("height") + " " + $svg.attr("width"))
            }

            $img.replaceWith($svg);

        }, "xml");
    });
}
