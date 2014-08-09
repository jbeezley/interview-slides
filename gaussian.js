/* global d3 */
'use strict';

function Gaussian(min, max, mean, sigma, selection, cls) {
    var n = 100;
    var margin = { top: 20, right: 20, bottom: 20, left: 40 },
        width = 400 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    var x = d3.scale.linear()
        .domain([0, n-1])
        .range([0, width]);

    var y = d3.scale.linear()
        .domain([0, 1])
        .range([height, 0]);

    var line = d3.svg.line()
        .x(function (d, i) { return x(i); })
        .y(function (d, i) { return y(d); });

    var svg = d3.select(selection).append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    svg.append('svg:rect')
        .attr('class', 'gausBox')
        .attr('width', width)
        .attr('height', height);

    /*svg.append('defs').append('clipPath')
        .attr('id', 'clip')
      .append('rect')
        .attr('width', width+5)
        .attr('height', height+5);*/

    var path = svg.append('g')
        //.attr('clip-path', 'url(#clip)')
      .append('path')
        .datum([])
        .attr('class', cls)
        .attr('d', line);
    
    var t = d3.scale.linear().domain([0,n-1]);
    t.range([min,max]);
    var rng = d3.range(n);
    function draw() {
        var m = mean(), s = sigma();
        function gausDensity(x) {
            var a = (t(x)-m)/s;
            return Math.exp( -0.5*a*a );
        }
        var data = rng.map(gausDensity);
        d3.select('.gaussian').datum(data).attr('d', line);
    }

    return draw;
}
