var PROJECT_CLASS_SVG_NAMES = {
    "group"    : "circle",
    "event"    : "star",
    "reminder" : "triangle",
    "favourite": "heart"
};

var SVG_OBJECTS = {
    "circle": $('<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" style="enable-background:new 0 0 510 510" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" height="510px" viewBox="0 0 510 510" width="510px" version="1.1" y="0px" x="0px" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/"><metadata><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/><dc:title/></cc:Work></rdf:RDF></metadata><g><g><path d="m255 0c-140.25 0-255 114.75-255 255s114.75 255 255 255 255-114.75 255-255-114.75-255-255-255z"/></g></g></svg>'),
    "heart": $('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 328.299 328.299" style="enable-background:new 0 0 328.299 328.299;" xml:space="preserve"><path d="M236.787,27.648c-29.599,0-55.91,14.057-72.638,35.854c-16.727-21.797-43.039-35.854-72.638-35.854 C40.971,27.648,0,68.619,0,119.16c0,113.246,164.149,181.491,164.149,181.491s164.149-67.216,164.149-181.491 C328.299,68.619,287.327,27.648,236.787,27.648z"/></svg>'),
    "triangle": $('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 36 36" style="enable-background:new 0 0 36 36;" xml:space="preserve"><path d="M35,0H1C0.448,0,0,0.447,0,1v34c0,0.553,0.448,1,1,1h34c0.552,0,1-0.447,1-1V1C36,0.447,35.552,0,35,0z"/></svg>'),
    "star": $('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.481 19.481" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 19.481 19.481"><g><path d="m10.201,.758l2.478,5.865 6.344,.545c0.44,0.038 0.619,0.587 0.285,0.876l-4.812,4.169 1.442,6.202c0.1,0.431-0.367,0.77-0.745,0.541l-5.452-3.288-5.452,3.288c-0.379,0.228-0.845-0.111-0.745-0.541l1.442-6.202-4.813-4.17c-0.334-0.289-0.156-0.838 0.285-0.876l6.344-.545 2.478-5.864c0.172-0.408 0.749-0.408 0.921,0z"/></g></svg>')
};