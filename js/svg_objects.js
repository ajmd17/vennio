var PROJECT_CLASS_SVG_NAMES = {
    'group'    : 'circle',
    'event'    : 'calendar',
    'reminder' : 'triangle',
    'favourite': 'heart',
    'sticky'   : 'rectangle',
};

var SVG_OBJECTS = {
    'circle': $('<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" style="enable-background:new 0 0 510 510" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" height="510px" viewBox="0 0 510 510" width="510px" version="1.1" y="0px" x="0px" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/"><metadata><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/><dc:title/></cc:Work></rdf:RDF></metadata><g><g><path d="m255 0c-140.25 0-255 114.75-255 255s114.75 255 255 255 255-114.75 255-255-114.75-255-255-255z"/></g></g></svg>'),
    'heart': $('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 328.299 328.299" style="enable-background:new 0 0 328.299 328.299;" xml:space="preserve"><path d="M236.787,27.648c-29.599,0-55.91,14.057-72.638,35.854c-16.727-21.797-43.039-35.854-72.638-35.854 C40.971,27.648,0,68.619,0,119.16c0,113.246,164.149,181.491,164.149,181.491s164.149-67.216,164.149-181.491 C328.299,68.619,287.327,27.648,236.787,27.648z"/></svg>'),
    'triangle': $('<xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 36 36" style="enable-background:new 0 0 36 36;" xml:space="preserve"><path d="M35,0H1C0.448,0,0,0.447,0,1v34c0,0.553,0.448,1,1,1h34c0.552,0,1-0.447,1-1V1C36,0.447,35.552,0,35,0z"/></svg>'),
    'star': $('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.481 19.481" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 19.481 19.481"><g><path d="m10.201,.758l2.478,5.865 6.344,.545c0.44,0.038 0.619,0.587 0.285,0.876l-4.812,4.169 1.442,6.202c0.1,0.431-0.367,0.77-0.745,0.541l-5.452-3.288-5.452,3.288c-0.379,0.228-0.845-0.111-0.745-0.541l1.442-6.202-4.813-4.17c-0.334-0.289-0.156-0.838 0.285-0.876l6.344-.545 2.478-5.864c0.172-0.408 0.749-0.408 0.921,0z"/></g></svg>'),
    'calendar': $('<svg version="1" xmlns="http://www.w3.org/2000/svg" width="682.67" height="682.67" viewBox="0 0 512.000000 512.000000"><path d="M248.4 11c-4.9 2-8.7 9.3-8.1 15.6.2 1.7-11.3 12-54.6 48.8L131 122H47v380h413V122h-84l-54.8-46.6-54.7-46.5-.1-4.9c-.1-2.8-.8-6-1.8-7.5-3.5-5.3-10.6-7.8-16.2-5.5zm63.7 67.5l50.5 43-54.2.3c-29.8.1-78.9.1-109.1 0l-54.9-.3 50.5-43 50.6-43h8l8.1.1 50.5 42.9z"/></svg>'),
    'rectangle': $('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400.0 400.0" display="block"><path fill-rule="evenodd" d="M0 200v157h400V139.4l-48.2-48.2L303.5 43H0v157"/></svg>'),

};