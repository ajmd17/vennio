const SVG_OBJECTS = {
    "circle": $(`<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" style="enable-background:new 0 0 510 510" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" height="510px" viewBox="0 0 510 510" width="510px" version="1.1" y="0px" x="0px" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/"><metadata><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/><dc:title/></cc:Work></rdf:RDF></metadata>
    <g>
        <g>
            <path d="m255 0c-140.25 0-255 114.75-255 255s114.75 255 255 255 255-114.75 255-255-114.75-255-255-255z"/>
        </g>
    </g>
    </svg>`),
    "heart": $(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 328.299 328.299" style="enable-background:new 0 0 328.299 328.299;" xml:space="preserve">
    <path d="M236.787,27.648c-29.599,0-55.91,14.057-72.638,35.854c-16.727-21.797-43.039-35.854-72.638-35.854
        C40.971,27.648,0,68.619,0,119.16c0,113.246,164.149,181.491,164.149,181.491s164.149-67.216,164.149-181.491
        C328.299,68.619,287.327,27.648,236.787,27.648z"/>
    </svg>`),
    "triangle": $(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 36 36" style="enable-background:new 0 0 36 36;" xml:space="preserve">
<path d="M35,0H1C0.448,0,0,0.447,0,1v34c0,0.553,0.448,1,1,1h34c0.552,0,1-0.447,1-1V1C36,0.447,35.552,0,35,0z"/>
</svg>`),
    
    /*$(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 60.02 60.02" style="enable-background:new 0 0 60.02 60.02;" xml:space="preserve">
<path d="M30.895,0.54c-0.34-0.678-1.449-0.678-1.789,0l-29,58c-0.155,0.31-0.139,0.678,0.044,0.973
	C0.332,59.808,0.654,59.988,1,59.988h58c0.008,0,0.016,0,0.02,0c0.553,0,1-0.448,1-1c0-0.229-0.076-0.439-0.205-0.608L30.895,0.54z"
	/>
</svg>
`),*/
    /*$(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 382.365 382.365" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 382.365 382.365">
    <g>
        <path d="m378.248,312.399l-162.38-271.915c-5.239-8.774-14.468-14.011-24.686-14.011s-19.446,5.237-24.685,14.011l-162.379,271.915c-5.375,8.999-5.494,19.815-0.32,28.932s14.522,14.561 25.005,14.561h324.76c10.482,0 19.831-5.443 25.005-14.561 5.174-9.116 5.054-19.932-0.32-28.932z"/>
    </g>
    </svg>
    `),*/
    "star": $(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.481 19.481" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 19.481 19.481">
    <g>
        <path d="m10.201,.758l2.478,5.865 6.344,.545c0.44,0.038 0.619,0.587 0.285,0.876l-4.812,4.169 1.442,6.202c0.1,0.431-0.367,0.77-0.745,0.541l-5.452-3.288-5.452,3.288c-0.379,0.228-0.845-0.111-0.745-0.541l1.442-6.202-4.813-4.17c-0.334-0.289-0.156-0.838 0.285-0.876l6.344-.545 2.478-5.864c0.172-0.408 0.749-0.408 0.921,0z"/>
    </g>
    </svg>
    `)
    
    /*$(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 268.477 268.477" style="enable-background:new 0 0 268.477 268.477;" xml:space="preserve">
    <g>
        <path style="fill-rule:evenodd;clip-rule:evenodd;" d="M267.522,99.163c-2.017-5.389-6.963-9.132-12.693-9.621l-75.845-8.999
            l-31.046-71.52c-2.355-5.469-7.728-9.016-13.678-9.024h-0.022c-5.942,0-11.318,3.525-13.685,8.981l-31.06,71.563l-75.845,8.999
            c-5.745,0.495-10.692,4.247-12.701,9.643c-2.017,5.397-0.75,11.47,3.262,15.608l58.437,55.242l-17.659,80.845
            c-1.041,5.709,1.327,11.514,6.074,14.865c2.564,1.813,5.58,2.731,8.602,2.731c2.564,0,5.128-0.655,7.435-1.988l67.142-42.758
            l67.141,42.758c2.309,1.333,4.871,1.988,7.435,1.988c3.015,0,6.015-0.91,8.579-2.717c4.749-3.336,7.122-9.119,6.103-14.828
            l-17.665-80.896l58.463-55.272C268.287,110.628,269.547,104.554,267.522,99.163z"/>
    </g>
    </svg>
    `)*/

};