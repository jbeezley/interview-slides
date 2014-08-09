/* global d3, enkf */

function makeFirePlot() {
    'use strict';
    d3.selection.prototype.moveToFront = function() {
        return this.each(function() {
            this.parentNode.appendChild(this);
        });
    };
    var labelHeight = 15;
    var gwidth = 900, gheight = 600;
    var padding = 5;
    var sheight = 20;
    var width = gwidth/2 - 2 * padding - labelHeight/2,
        height = gheight/2 - sheight - 4 * padding - labelHeight/2;
    var animT = 1000;

    var x = d3.scale.linear()
        .domain([-5, 5])
        .range([0, width]);
    var y = d3.scale.linear()
        .domain([-0.1, 1.1])
        .range([height, 0]);
    var ys = d3.scale.linear()
        .domain([-1, 1])
        .range([sheight, 0]);
    
    var xdata = d3.range(-10,10,0.01);
    var pdata = d3.range(-5.05, 5.05, 0.1);
    function shapeFunction(center) {
        center = center || 0;
        var sigma = 0.01;
        return function (d) {
            return d.map(function (z) { return Math.exp(-(z-center)*(z-center)/sigma); });
        };
    }
    var baseShape = shapeFunction(0);
    var baseData = baseShape(xdata);
    var line = d3.svg.line()
        .interpolate('monotone')
        .x(function (d,i) { return x(xdata[i]); })
        .y(function (d) { return y(d); });
    var aline = d3.svg.line()
        .interpolate('monotone')
        .x(function (d, i) { return x(pdata[i]); })
        .y(function (d) { return y(d); });

    var svg = d3.select('#enkfFirePlot').append('svg')
        .attr('width', gwidth)
        .attr('height', gheight);

    var boxes = [ {
            classes: ['forecast', 'lines', 'notrans'],
            x: padding + labelHeight,
            y: padding + labelHeight,
            width: width,
            height: height,
            url: 'flinebox'
        }, {
            classes: ['forecast', 'lines', 'trans'],
            x: padding*3 + width + labelHeight,
            y: padding + labelHeight,
            width: width,
            height: height,
            url: 'flinetbox'
        }, {
            classes: ['forecast', 'points', 'trans'],
            x: padding*3 + width + labelHeight,
            y: padding*3 + height + labelHeight,
            width: width,
            height: sheight,
            url: 'fpointbox'
        }, {
            classes: ['analysis', 'points', 'trans'],
            x: padding*3 + width + labelHeight,
            y: padding*5 + height + sheight + labelHeight,
            width: width,
            height: sheight,
            url: 'apointbox'
        }, {
            classes: ['analysis', 'lines', 'notrans'],
            x: padding + labelHeight,
            y: padding*7 + height + 2*sheight + labelHeight,
            width: width,
            height: height,
            url: 'alinebox'
        }, {
            classes: ['analysis', 'lines', 'trans'],
            x: padding*3 + width + labelHeight,
            y: padding*7 + height + 2*sheight + labelHeight,
            width: width,
            height: height,
            url: 'alinetbox'
        }];
    
    var sel = svg.selectAll('.plotBox').data(boxes).enter()
        .append('g')
          .classed('plotBox', true)
          .attr('transform', function (d) { return 'translate(' + [d.x,d.y] + ')'; });

    sel.append('defs').append('clipPath')
          .attr('id', function (d) { return d.url; })
        .append('rect')
          .attr('width', function (d) { return d.width; })
          .attr('height', function (d) { return d.height; });
    var rgroup = sel.append('g')
          .attr('class', function (d) { return d.classes.join(' '); })
          .attr('clip-path', function (d) { return 'url(#' + d.url + ')'; });
    rgroup.append('rect')
          .attr('class', 'plotWindowRectWhite')
          .attr('width', function (d) { return d.width; })
          .attr('height', function (d) { return d.height; })
          .attr('rx', '5px')
          .attr('ry', '5px')
          .style('fill-opacity', 1.0)
          .style('fill', 'white');
    rgroup.append('rect')
          .attr('class', 'plotWindowRect')
          .attr('width', function (d) { return d.width; })
          .attr('height', function (d) { return d.height; })
          .attr('rx', '5px')
          .attr('ry', '5px')
          .style('fill-opacity', 0.05)
          .on('mouseover', function () { mouseover(this); } )
          .on('mouseout', function () { mouseout(this); })
          .on('mousemove', function () { mousemove(this); })
          .on('click', function () { mouseclick(this); })
          .moveToFront();
    
    var lx = labelHeight;
    var ly = padding + height/2 + labelHeight;
    svg.append('text')
        .attr('x', lx)
        .attr('y', ly)
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(270,' + [lx,ly] + ')')
        .text('Forecast')
        .style('font-size', labelHeight + 'px')
        .style('font-family', 'monospace');
    
    lx = labelHeight;
    ly = 6 * padding + height/2 + 2*labelHeight + height + 2 * sheight;
    svg.append('text')
        .attr('x', lx)
        .attr('y', ly)
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(270,' + [lx,ly] + ')')
        .text('Analysis')
        .style('font-size', labelHeight + 'px')
        .style('font-family', 'monospace');
    
    lx = labelHeight + padding + width/2;
    ly = labelHeight;
    svg.append('text')
        .attr('x', lx)
        .attr('y', ly)
        .attr('text-anchor', 'middle')
        .text('Standard EnKF')
        .style('font-size', labelHeight + 'px')
        .style('font-family', 'monospace');
    
    lx = 2*labelHeight + 3*padding + 3 * width/2;
    ly = labelHeight;
    svg.append('text')
        .attr('x', lx)
        .attr('y', ly)
        .attr('text-anchor', 'middle')
        .text('Transformed EnKF')
        .style('font-size', labelHeight + 'px')
        .style('font-family', 'monospace');

    var fmean = 0, ferr = 1.5;
    var obsStd = 0.5, obsPStd = 0.1;
    var nens = 10, ensF;
    
    function reset() {
        svg.selectAll('.analysis').selectAll('.ensemble').remove();
    }

    function drawEns() {
        var sel = svg.selectAll('.forecast.points').selectAll('.ensemble')
            .data(ensF);
        sel.enter().append('circle')
            .attr('class', 'ensemble fpts')
            .attr('cy', ys(0))
            .attr('r', '3pt');
        sel.exit().remove();
        sel.attr('cx', x(0));
        
        sel = svg.selectAll('.forecast.lines').selectAll('.ensemble')
            .data(ensF);
        sel.enter().append('path')
            .attr('class', 'ensemble flines')
            .attr('d', line(baseData));
        sel.exit().remove();

        svg.selectAll('.forecast').selectAll('.ensemble')
            .data(ensF)
              .attr('transform', function () { return 'translate(0,0)'; })
            .transition().duration(animT)
              .attr('transform', function (d) { return 'translate(' + (x(d) - x(0)) + '0)'; });

        svg.selectAll('.plotWindowRect').moveToFront();
    }

    function makeEns() {
        var r = d3.random.normal(fmean, ferr), i;
        ensF = [];
        for(i=0; i<nens; i++) {
            ensF.push(r());
        }
        reset();
        drawEns();
    }
    makeEns();
    function assimS(obs) {
        var e = ensF.map(function (d) { return [d]; });
        var H = enkf.obsFunction();
        obs = [[x.invert(obs)]];
        var err = [[obsStd * obsStd]];
        var a = enkf(e, obs, H, err).map(function (d) { return d[0]; });
        var sel = d3.selectAll('.plotBox').select('.analysis.points').selectAll('.ensemble').data(a);
        sel.enter()
            .append('circle')
                .attr('class', 'ensemble')
                .attr('cy', ys(0))
                .attr('cx', x(0))
                .attr('r', '3pt');
        sel.exit().remove();

        sel = d3.selectAll('.plotBox').select('.analysis.lines.trans').selectAll('.ensemble').data(a);
        sel.enter()
            .append('path')
                .attr('class', 'ensemble')
                .attr('d', line(baseData));
        sel.exit().remove();

        sel = d3.selectAll('.plotBox').selectAll('.analysis.trans').selectAll('.ensemble');
        sel.attr('transform', function (d, i) { return 'translate(' + (x(ensF[i]) - x(0)) + ',0)'; })
            .transition().duration(animT)
            .attr('transform', function (d) { return 'translate(' + (x(d) - x(0)) + ',0)'; });
    }
    function assimP(obs) {
        var e = ensF.map(function (d) { return shapeFunction(d)(pdata); });
        var H = enkf.obsFunction();
        obs = [shapeFunction(x.invert(obs))(pdata)];
        var v = obsPStd * obsPStd;
        var err = [pdata.map( function () { return v; } )];
        var a = enkf(e, obs, H, err);

        var sel = d3.selectAll('.plotBox').select('.analysis.lines.notrans').selectAll('.ensemble').data(a);
        sel.enter()
            .append('path')
                .attr('class', 'ensemble');
        sel.exit().remove();
        sel.attr('d', function (d, i) { return aline(e[i]); })
          .transition().duration(animT)
            .attr('d', function (d) { return aline(d); });
    }
    
    d3.selectAll('.plotBox').select('.forecast,.analysis').selectAll('.mouseLine')
        .data([0]).enter()
            .append('path')
                .attr('class', 'mouseLine');

    var mline = d3.svg.line()
        .x(function (d) { return d; })
        .y(function (d, i) { return i ? height : 0; });
    function drawMouse(p) {
        if (p === undefined) {
            d3.selectAll('.mouseLine').attr('visibility', 'hidden');
        } else {
            d3.selectAll('.mouseLine')
                .attr('visibility', 'visible')
                .attr('d', mline(p));
        }
    }

    function mouseover(t) {
        d3.select(t).style('fill-opacity', 0.1);
        var p = d3.mouse(t), m = p[0];
        drawMouse([m, m]);
    }
    function mouseout(t) {
        d3.select(t).style('fill-opacity', 0.05);
        drawMouse();
    }
    function mousemove(t) {
        var p = d3.mouse(t), m = p[0];
        drawMouse([m, m]);
    }
    function mouseclick(t) {
        var p = d3.mouse(t), m = p[0], data;
        if (d3.event.shiftKey) {
            data = [];
            makeEns();
        } else {
            data = [m];
            assimS(m);
            assimP(m);
        }
        var sel = svg.selectAll('.points').selectAll('.observation.opts').data(data);
        sel.enter().append('path')
            .attr('class', 'observation opts')
            .attr('d', d3.svg.symbol().type('cross').size(50));
        sel.exit().remove();
        sel.attr('transform', function (d) { return 'translate(' + [d,ys(0)] + ')'; });
        
        sel = svg.selectAll('.points').selectAll('.observation.errbar').data(data);
        sel.enter().append('rect')
            .attr('class', 'observation errbar')
            .attr('y', 0)
            .attr('height', sheight)
            .attr('rx', 3)
            .attr('ry', 3);
        sel.exit().remove();
        sel.attr('x', function (d) { return x(x.invert(d) - obsStd); })
            .attr('width', 2*(x(obsStd) - x(0)));
        
        sel = svg.selectAll('.lines').selectAll('.observation').data(data);
        sel.enter().append('path')
            .attr('class', 'observation olines')
            .attr('d', line(baseData));
        sel.exit().remove();
        sel.attr('transform', function (d) { return 'translate(' + [d - x(0),0] + ')'; });

        var area = d3.svg.area()
            .x(function (d,i) { return x(xdata[i]); })
            .y0(function (d) { return y(d - obsPStd); })
            .y1(function (d) { return y(d + obsPStd); });
        
        sel = svg.selectAll('.lines').selectAll('.observation.errbar').data(data);
        sel.enter().append('path')
            .attr('class', 'observation errbar')
            .attr('d', area(baseData));
        sel.exit().remove();
        sel.attr('transform', function (d) { return 'translate(' + [d - x(0),0] + ')'; });


        svg.selectAll('.plotWindowRect').moveToFront();
    }

    
    d3.select('#enkfFireNens').on('change', function () {
        nens = this.value;
    }).attr('value', nens);
    d3.select('#enkfFireEnsErr').on('change', function () {
        ferr = this.value;
    }).attr('value', ferr);
    d3.select('#enkfFireObsStd').on('change', function () {
        obsStd = this.value;
        obsPStd = obsStd/5;

    }).attr('value', obsStd);

    svg.selectAll('.plotWindowRect').moveToFront();

    function makeLegend() {
        var d = { x: 0, y: 0}, p = 10, b = 15;
        var h = 2*sheight + 2*padding, w = width;
        var drag = d3.behavior.drag()
            .on('drag', function () {
                d.x += d3.event.dx;
                d.y += d3.event.dy;
                //console.log(d);
                d3.select(this).attr('transform', function () {
                    return 'translate(' + [d.x,d.y] + ')';
                });
            })
            .on('dragstart', function () {
                d3.event.sourceEvent.stopPropagation();
            });
        var l = svg.append('g')
            .attr('transform', 'translate(' + [labelHeight + padding, height + sheight + 2*padding] + ')');
        l.append('rect')
            .attr('width', w)
            .attr('height', h)
            .attr('rx', 5)
            .attr('ry', 5)
            .style('fill', 'white')
            .style('fill-opacity', 1e-6)
            .style('stroke', 'black')
            .style('stroke-width', '1pt')
            .call(drag);
        l.append('rect')
            .attr('width', b)
            .attr('height', b)
            .attr('x', p)
            .attr('y', h/2 - b/2)
            .attr('class', 'observation errbar');
        l.append('text')
            .attr('x', p + b + p)
            .attr('y', h/2 + b/2 - 5)
            .text('Observation Error')
            .style('font-size', 12)
            .style('font-family', 'monospace');

    }
    //makeLegend();
}

function makeFireDescPlot() {
    'use strict';
    var width = 500, height = 300, pad = 5;
    var svg = d3.select('#fireDescPlotDiv')
        .append('svg')
          .attr('id', 'chooseShape')
          .attr('width', width + 2*pad)
          .attr('height', height + 2*pad)
          .attr('class', 'fragment')
          .attr('data-fragment-index', '1')
        .append('g')
          .attr('transform', 'translate(' + [pad,pad] + ')');
    svg.append('defs').append('clipPath')
          .attr('id', 'clip')
        .append('rect')
          .attr('rx', '5px')
          .attr('ry', '5px')
          .attr('width', width)
          .attr('height', height);
    var plotBox = svg.append('g')
          .attr('clip-path', 'url(#clip)');
    plotBox.insert('rect')
        .attr('width', width)
        .attr('height', height)
        .style('fill', 'white')
        .style('fill-opacity', '1');
    var cli = plotBox.append('rect')
        .attr('width', width)
        .attr('height', height)
        .style('fill', 'black')
        .style('fill-opacity', 0.05);
    var nens = 10;
    var ens = [];
    var r = d3.random.normal(0,1.5);
    
    var x = d3.scale.linear()
        .domain([-4, 4])
        .range([0, width]);
    var y = d3.scale.linear()
        .domain([-0.1, 1.1])
        .range([height, 0]);

    var xdata = d3.range(-10,10,0.01);
    var sel;
    function shapeFunction(center) {
        center = center || 0;
        var sigma = 0.01;
        return function (d) {
            return d.map(function (z) { return Math.exp(-(z-center)*(z-center)/sigma); });
        };
    }
    var baseShape = shapeFunction(0);
    var baseData = baseShape(xdata);
    var line = d3.svg.line()
        .interpolate('monotone')
        .x(function (d,i) { return x(xdata[i]); })
        .y(function (d) { return y(d); });
    
    function drawEnsemble() {
        sel = plotBox.selectAll('.ensemble').data(ens);
        sel.enter()
            .append('path')
              .attr('class', function (d,i) { return 'ensemble forecast flines member' + i; })
              //.attr('data-fragment-index', 4)
              .attr('d', line(baseData));
        sel
              .attr('visibility', 'hidden')
              .attr('transform', 'translate(0,0)');
        sel.exit().remove();
        return sel;
    }

    function makeEnsemble() {
        ens = d3.range(nens).map(r);
        //ens[0] = 1.5123;
        drawEnsemble();
    }
    var imem = 0;
    function drawEns() {
        var pg = d3.select('#oneDFireSection')[0][0];
        if (!animating || pg.className !== 'present') {
            animating = false;
            return;
        }
        if (imem === 0) {
            makeEnsemble();
        }
        plotBox.select('.member' + imem)
              .attr('visibility', 'visibile')
              .style('stroke', 'blue')
            .transition().duration(700)
              .attr('transform', function (d) { return 'translate(' + (x(d) - x(0))  + ',0)'; })
            .transition().duration(100)
              .style('stroke', 'black');
        imem = (imem + 1) % nens;
        return true;
    }
    function animate() {
        var pg = d3.select('#oneDFireSection')[0][0];
        var i;
        if (pg.className === 'present' && animating) {
            for (i = imem; i < nens; i++) {
                d3.timer(drawEns, 750 * i);
            }
            imem = 0;
            setTimeout(animate, 10000);
        } else {
            animating = false;
        }
    }
    var animating = false;
    //cli.on('click', function () { drawEns(); });
    document.fireFragmentEvent = function (event) {
        var d = d3.select(event.fragment);
        var id = d.attr('id');
        if (id === 'chooseShape') {
            animating = true;
            makeEnsemble();
            imem = 1;
            plotBox.select('.member0').attr('visibility', 'visible');
        } else if (id === 'generatePert') {
            animating = false;
        } else if (id === 'translateShape') {
            animating = true;
            imem = 0;
            drawEns();
        } else if (id === 'repeatForAllShapes') {
            imem = 0;
            animating = true;
            animate();
        }
    };
}

