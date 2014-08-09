/* global d3, topojson, enkf*/
/* jshint unused: false*/
function drawMapAssim() {
    'use strict';

    var width = 400, height = 300, scale = 500;
    var div = d3.select("#mapdataassim");
    var proj = d3.geo.albers()
        .scale(scale)
        .translate([width/2, height/2]);
    var path = d3.geo.path().projection(proj);
    var svg = div.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr('class','fragment')
        .attr('data-fragment-index','1');

    svg.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);

    var g = svg.append("g")
        .attr('class', 'fragment')
        .attr('data-fragment-index','1');
    d3.json("data/us.json", function (error, us) {
        g.append('g')
            .attr('id', 'states')
        .selectAll('path')
            .data(topojson.feature(us, us.objects.states).features)
        .enter().append('path')
            .attr('d', path);
        g.append('path')
            .datum(topojson.mesh(us, us.objects.states, function (a, b) {return a !== b;}))
            .attr('id', 'state-borders')
            .attr('d', path);
    });
    var line = d3.svg.line();
    var xSteps = d3.range(25, width + 25, 50),
        ySteps = d3.range(25, height + 25, 50),
        xSmall = d3.range(0, width + 6, 6),
        ySmall = d3.range(0, height + 6, 6);
     
    svg.append('g')
        .attr('class', 'fragment')
        .attr('data-fragment-index', '2')
    .selectAll('.x')
        .data(xSteps)
      .enter().append('path')
        .attr('class', 'mapgrid')
        .datum(function (x) { return ySmall.map(function(y) { return [x, y]; }); });

    svg.append('g')
        .attr('class', 'fragment')
        .attr('data-fragment-index', '2')
    .selectAll('.y')
        .data(ySteps)
      .enter().append('path')
        .attr('class', 'mapgrid')
        .datum(function (y) { return xSmall.map(function(x) { return [x, y]; }); });
 
    svg.selectAll('path').attr('d', line);
    
    function makepoint(coord) {
        svg.append('path')
            .attr('class', 'datapoint')
            .attr('transform', 'translate(' + proj(coord) + ')')
            .attr('d', d3.svg.symbol().type('cross'))
            .attr('class', 'fragment')
            .attr('style', 'fill:#f00')
            .attr('data-fragment-index','3');
    }
    
    makepoint([-104.9846,39.7392]);
    makepoint([-73.9400,40.6700]);
    makepoint([-118.2500,34.0500]);
    makepoint([-80.2241,25.7877]);
    makepoint([-122.6819,45.52]);
}

function drawOptimalInterp() {
    'use strict';
    var margin = { top: 20, right: 20, bottom: 30, left: 20 };
    var width = 450 - margin.left - margin.right, height = 350 - margin.top - margin.bottom;
    var svg = d3.select('#oigraph').append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.bottom + margin.top)
              .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    var x = d3.scale.linear().range([0, width]).domain([0,10]),
        y = d3.scale.linear().range([height, 0]).domain([0,10]),
        xAxis = d3.svg.axis().scale(x).orient('bottom'),
        yAxis = d3.svg.axis().scale(y).orient('left');
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);
    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);
    var line = d3.svg.line()
          .x(function (d, i) { return x(i); })
          .y(function (d) { return y(d); });
    var innov = d3.svg.line()
          .x(function (d) {return x(d.x);})
          .y(function (d) {return y(d.y);});
    var modelData = [1, 3, 4, 2.5, 3, 5, 5.5, 4, 4.8, 6.5, 7.5];
    var obs = { 'x': 4.5, 'y': 6 };
    var mobs = { 'x': 4.5, 'y': d3.interpolateNumber(modelData[4], modelData[5])(0.5) } ;
    svg.append('g')
            .attr('class', 'linepoint')
            .attr('data-fragment-index', '0')
          .selectAll('.linepoint')
            .data(modelData)
          .enter().append('circle').attr('r',5)
            //.attr('d', d3.svg.symbol().type('circle'))
            .attr('transform', function (d, i) { return 'translate(' + x(i) + ',' + y(d) + ')'; });
    svg.append('path')
        .datum([mobs,obs])
        .attr('d',innov)
        .attr('class', 'innovplot fragment')
        .attr('data-fragment-index', '1');
    svg.append('g')
        .append('path')
        .attr('class', 'datapoint')
        .attr('transform','translate(' + x(obs.x) + ',' + y(obs.y) + ')')
        .attr('d', d3.svg.symbol().type('cross'))
        .attr('style', 'fill:#f00');
    svg.append('path')
        .datum(modelData)
        .attr('d', line)
        .attr('class', 'lineplot fragment')
        .attr('data-fragment-index', '1');
    svg.append('g')
        .attr('class', 'fragment linepoint')
        .attr('data-fragment-index', '1')
        .append('path')
        .attr('transform', 'translate(' + x(mobs.x) + ',' + y(mobs.y) + ')')
        .attr('d', d3.svg.symbol().type('circle'))
        .attr('style', 'fill:#e99');
    svg.append('text')
        .attr('class', 'axis')
        .attr('style', 'fill:#99f;font:16px monospace')
        .attr('x', x(10))
        .attr('y', y(modelData[10]))
        .attr('dy', '-1em')
        .attr('dx', '-1em')
        .text('V');
    svg.append('text')
        .attr('class', 'axis')
        .attr('style', 'fill:#f00;font:16px monospace')
        .attr('x', x(obs.x))
        .attr('y', y(obs.y))
        .attr('dy', '-1em')
        .attr('dx', '-1em')
        .text('y');
    svg.append('text')
        .attr('class', 'axis fragment')
        .attr('data-fragment-index', '1')
        .attr('style', 'fill:#e99;font:16px monospace')
        .attr('x', x(mobs.x))
        .attr('y', y(mobs.y))
        .attr('dy', '0.5em')
        .attr('dx', '.7em')
        .text('H(V)');

}

function drawOptimalInvInterp() {
    'use strict';
    var margin = { top: 20, right: 20, bottom: 30, left: 50 };
    var width = 450 - margin.left - margin.right, height = 350 - margin.top - margin.bottom;
    var svg = d3.select('#oiinvgraph').append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.bottom + margin.top)
              .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    var x = d3.scale.linear().range([0, width]).domain([0,10]),
        y = d3.scale.linear().range([height, 0]).domain([0,10]),
        xAxis = d3.svg.axis().scale(x).orient('bottom'),
        yAxis = d3.svg.axis().scale(y).orient('left');
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);
    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);
    var line = d3.svg.line()
          .x(function (d, i) { return x(i); })
          .y(function (d) { return y(d); });
    var innov = d3.svg.line()
          .x(function (d) {return x(d.x);})
          .y(function (d) {return y(d.y);});
    var modelData = [1, 3, 4, 2.5, 3, 5, 5.5, 4, 4.8, 6.5, 7.5];
    var obs = { 'x': 4.5, 'y': 6 };
    var mobs = { 'x': 4.5, 'y': d3.interpolateNumber(modelData[4], modelData[5])(0.5) } ;
    mobs.z = mobs.y;
    var movegroup = svg.append('g');
    svg.append('g')
            .attr('class', 'darklinepoint')
            .attr('data-fragment-index', '0')
          .selectAll('.linepoint')
            .data(modelData)
          .enter().append('circle').attr('r',5)
            .attr('transform', function (d, i) { return 'translate(' + x(i) + ',' + y(d) + ')'; });
    var modelpts = movegroup.append('g')
            .attr('data-fragment-index', '0')
          .selectAll('.linepoint')
            .data(modelData)
          .enter().append('circle')
            .attr('class', 'linepoint')
            .attr('r',5)
            .attr('cx', function (d, i) { return x(i); })
            .attr('cy', function (d) { return y(d); });
            //.attr('transform', function (d, i) { return 'translate(' + x(i) + ',' + y(d) + ')'; })
            //.append('circle').attr('r',5);
    svg.append('g')
        .append('path')
        .attr('class', 'datapoint')
        .attr('transform','translate(' + x(obs.x) + ',' + y(obs.y) + ')')
        .attr('d', d3.svg.symbol().type('cross'))
        .attr('style', 'fill:#f00');
    svg.append('path')
        .datum(modelData)
        .attr('d', line)
        .attr('class', 'darklineplot');
    var modelline = movegroup.append('path')
        .datum(modelData)
        .attr('d', line)
        .attr('class', 'lineplot');
    svg.append('g')
        .attr('class', 'darklinepoint')
        .append('path')
        .attr('transform', 'translate(' + x(mobs.x) + ',' + y(mobs.y) + ')')
        .attr('d', d3.svg.symbol().type('circle'))
        .attr('style', 'fill:#e99');
    var mobspt = movegroup.append('g')
        .attr('class', 'linepoint')
        .append('path')
        .attr('transform', 'translate(' + x(mobs.x) + ',' + y(mobs.y) + ')')
        .attr('d', d3.svg.symbol().type('circle'))
        .attr('style', 'fill:#e99');
    var origData = modelData.slice();
    function gausShp(sigma) {
        return function (d, i) {
            var dx = Math.abs(i - 4.5);
            if (dx < 1e-6) { return d + (obs.y - mobs.y); }
            else {
                return d + (obs.y - mobs.y) * Math.exp( -dx*dx / (2*sigma * sigma) );
            }
        };
    }
    function expShp(sigma) {
        return function (d, i) {
            var dx = Math.abs(i - 4.5);
            if (dx < 1e-6) { return d + (obs.y - mobs.y); }
            else {
                return d + (obs.y - mobs.y) * Math.exp( -dx / (sigma * sigma) );
            }
        };
    }
    function hatShp(sigma) {
        return function (d, i) {
            var dx = Math.abs(i - 4.5);
            if (dx < 1e-6) {
                return d + (obs.y - mobs.y);
            } else if (dx > sigma || sigma === 0.0) {
                return d;
            } else {
                return d + (obs.y - mobs.y) * ( 1 - dx/sigma );
            }
        };
    }
    function noneShp() {
        return function (d) {
            return d;
        };
    }
    function updatePlotData(shp) {
        var i;
        for (i = 0; i < origData.length; i++) {
            modelData[i] = shp(origData[i], i);
        }
        mobs.z = d3.interpolateNumber(modelData[4], modelData[5])(0.5);
    }
    var sigma = 1.0;
    var shp = noneShp;
    var shpLine = d3.svg.line()
        .x(function (d) { return x(d); })
        .y(function (d) { return y(10*(shp(sigma)(d, d) - d) / (obs.y - mobs.y)); })
        .interpolate('monotone');
    var shapePlot = movegroup.append('path')
        .datum(d3.range(0, 10, 0.1))
        .attr('d', shpLine)
        .attr('style', 'stroke:#9f9')
        .attr('class', 'lineplot');
    function updatePlot(shp) {
        updatePlotData(shp);
        modelline.attr('d', line);
        d3.selectAll('circle.linepoint').data(modelData)
            .attr('cx', function (d, i) { return x(i); })
            .attr('cy', function (d) { return y(d); });
        shapePlot.attr('d', shpLine);
        mobspt.attr('transform', 'translate(' + x(mobs.x) + ',' + y(mobs.z) + ')');
    }
    function updatePlotTrans(shp) {
        updatePlotData(shp);
        modelline.transition().attr('d', line);
        d3.selectAll('circle.linepoint').data(modelData)
          .transition()
            .attr('cx', function (d, i) { return x(i); })
            .attr('cy', function (d) { return y(d); });
        shapePlot.transition().attr('d', shpLine);
        mobspt.attr('transform', 'translate(' + x(mobs.x) + ',' + y(mobs.z) + ')');
    }
    d3.select('#oiinterpsigma').on('change', function () {
        sigma = this.value;
        updatePlot(shp(sigma));
    });
    d3.select('#oiinterpshape').on('change', function () {
        if (this.value === 'Gaussian') {
            shp = gausShp;
        } else if (this.value === 'Exponential') {
            shp = expShp;
        } else if (this.value === 'Hat') {
            shp = hatShp;
        } else if (this.value === 'None') {
            shp = noneShp;
        }
        updatePlotTrans(shp(sigma));
    });
}

function drawLorenzKalman() {
    'use strict';
    var margin = { top: 0, right: 0, bottom: 0, left: 0 };
    var width = 600, height = 150, n = 400;
    var robj = initKFModel(0);
    var model = robj.model, obs = robj.obs;
    var pltX = new LinePlot({ miny: -30, maxy: 30, domSelect: '#kalmanPlotX', n: n, margin: margin, width: width, height: height });
    var pltY = new LinePlot({ miny: -30, maxy: 30, domSelect: '#kalmanPlotY', n: n, margin: margin, width: width, height: height });
    var pltZ = new LinePlot({ miny: 0, maxy: 50, domSelect: '#kalmanPlotZ', n: n, margin: margin, width: width, height: height });

    function updatePlts() {
      pltX.update();
      pltY.update();
      pltZ.update();
    }

    pltX.addPath(model.time, model.mean.x, 'lineX', model.cov.x.x);
    pltY.addPath(model.time, model.mean.y, 'lineX', model.cov.y.y);
    pltZ.addPath(model.time, model.mean.z, 'lineX', model.cov.z.z);
    pltX.addPath(model.time, function () { return obs.getObs(model.time(), 0, 0.0); }, 'lineY');
    pltY.addPath(model.time, function () { return obs.getObs(model.time(), 1, 0.0); }, 'lineY');
    pltZ.addPath(model.time, function () { return obs.getObs(model.time(), 2, 0.0); }, 'lineY');
  
    pltX.addPath(model.time, model.mean.x, 'lineX');
    pltY.addPath(model.time, model.mean.y, 'lineX');
    pltZ.addPath(model.time, model.mean.z, 'lineX');
    
    obs.obsFrequency = ko.observable(5);
    obs.reset = function () {
        model.value.x(1.0);
        model.value.y(1.0);
        model.value.z(25.0);
        model.cov.x.x(1.0);
        model.cov.x.y(0.0);
        model.cov.x.z(0.0);
        model.cov.y.y(1.0);
        model.cov.y.z(0.0);
        model.cov.z.z(1.0);
    }
    updatePlts();
    
    var time, stime = 0;
    function animate() {
        var vals;
        var pg = d3.select('#LorenzKalmanSection')[0][0];
        if (pg.className === 'present' && !obs.pause()) {
            time = model.time();
            if (time - stime > obs.obsFrequency()/10) {
                stime = time;
                vals = model.assimilate(obs);
                pltX.addMark(vals[0]);
                pltY.addMark(vals[1]);
                pltZ.addMark(vals[2]);
            }
            model.update(0.01);
            updatePlts();
        }
        requestAnimationFrame(animate);
    }
    ko.applyBindings(obs, document.getElementById('LorenzKalmanSection'));
    animate();
}

function drawLorenzEnKF() {
    'use strict';
    var margin = { top: 0, right: 0, bottom: 0, left: 0 };
    var width = 600, height = 150, n = 300, N = 10;
    var robj = initKFModel(N);
    var i;
    var model = robj.model, obs = robj.obs;
    var pltX = new LinePlot({ miny: -30, maxy: 30, domSelect: '#enkfPlotX', n: n, margin: margin, width: width, height: height });
    var pltY = new LinePlot({ miny: -30, maxy: 30, domSelect: '#enkfPlotY', n: n, margin: margin, width: width, height: height });
    var pltZ = new LinePlot({ miny: 0, maxy: 50, domSelect: '#enkfPlotZ', n: n, margin: margin, width: width, height: height });

    function updatePlts() {
      pltX.update();
      pltY.update();
      pltZ.update();
    }

    pltX.addPath(model.time, model.mean.x, 'lineX', model.cov.x.x);
    pltY.addPath(model.time, model.mean.y, 'lineX', model.cov.y.y);
    pltZ.addPath(model.time, model.mean.z, 'lineX', model.cov.z.z);
    pltX.addPath(model.time, function () { return obs.getObs(model.time(), 0, 0.0); }, 'lineY');
    pltY.addPath(model.time, function () { return obs.getObs(model.time(), 1, 0.0); }, 'lineY');
    pltZ.addPath(model.time, function () { return obs.getObs(model.time(), 2, 0.0); }, 'lineY');
    for (i = 0; i < N; i++) {
        pltX.addPath(model.time, model.ensemble[i].x, 'lineZ');
        pltY.addPath(model.time, model.ensemble[i].y, 'lineZ');
        pltZ.addPath(model.time, model.ensemble[i].z, 'lineZ');
    }
  
    pltX.addPath(model.time, model.mean.x, 'lineX');
    pltY.addPath(model.time, model.mean.y, 'lineX');
    pltZ.addPath(model.time, model.mean.z, 'lineX');
    
    obs.obsFrequency = ko.observable(5);
    obs.reset = function () {
        var i, r = d3.random.normal(0,5);
        for (i = 0; i < N; i++) {
          model.ensemble[i].x(r());
          model.ensemble[i].y(r());
          model.ensemble[i].z(25 + r());
        }
    }
    updatePlts();
    
    var time, stime = 0;
    function animate() {
        var vals = [0,0,25];
        var pg = d3.select('#LorenzEnKFSection')[0][0];
        if (pg.className === 'present' && !obs.pause()) {
            time = model.time();
            if (time - stime > obs.obsFrequency()/10) {
                stime = time;
                vals = model.assimilate(obs);
                pltX.addMark(vals[0]);
                pltY.addMark(vals[1]);
                pltZ.addMark(vals[2]);
            }
            model.update(0.01);
            updatePlts();
        }
        requestAnimationFrame(animate);
    }
    ko.applyBindings(obs, document.getElementById('LorenzEnKFSection'));
    animate();
}

function drawKalmanPlot() {
    'use strict';

    function gaussian(mean, stddev) {
        var v = stddev * stddev;
        var c = 1 / (stddev * Math.sqrt(2 * Math.PI));
        return function (d) {
            var s = (d - mean);
            return c *  Math.exp( -0.5 * s * s / v );
        };
    }

    var xdata = d3.range(-5, 5, 0.05);
    var width = 600, height = 350, pad = 5;
    var svg = d3.select('#kalmanPlot').append('svg')
                .attr({ width: width + 2*pad, height: height + 2*pad })
                .attr('transform', 'translate(' + [pad, pad] + ')')
                .style('background', 'white')
                .style('border', '5px solid white')
                .style('border-radius', '5px');
    var x = d3.scale.linear()
              .domain([-5, 5])
              .range([0, width]);
    var y = d3.scale.linear()
              .domain([0, 2.25])
              .range([height, 0]);
    var fmean = 0, fstd = 1;
    svg.append('path').attr('class', 'observation')
          .style('fill', 'none')
          .style('stroke', 'red')
          .style('stroke-width', '1.5px')
          .attr('data-legend', 'observation')
          .attr('data-legend-pos', '2');
          //.style('stroke-dasharray', ('3','7'));
    svg.append('path').attr('class', 'analysis')
          .style('fill', 'none')
          .style('stroke', 'blue')
          .style('stroke-width', '1.5px')
          .attr('data-legend', 'analysis')
          .attr('data-legend-pos', '3');
    svg.append('path').attr('class', 'forecast')
            .style('fill', 'none')
            .style('stroke', 'black')
            .style('stroke-width', '1.5px')
          .attr('data-legend', 'forecast')
          .attr('data-legend-pos', '1');

    var amean, astd;
    function draw(omean, ostd) {
        var fvar = fstd * fstd;
        var forecast = gaussian(fmean, fstd);
        var linef = d3.svg.line()
                        .x(function (d) { return x(d); })
                        .y(function (d) { return y(forecast(d)); })
                        .interpolate('monotone');
        var ovar = ostd * ostd;
        var k = fvar/(fvar + ovar);
        var avar = (1 - k) * fvar;
        astd = Math.sqrt(avar);
        amean = fmean + k * omean;
        var observation = gaussian(omean, ostd);
        var lineo = d3.svg.line()
                      .x(function (d) { return x(d); })
                      .y(function (d) { return y(observation(d)); })
                      .interpolate('monotone');
        var analysis = gaussian(amean, astd);
        var linea = d3.svg.line()
                      .x(function (d) { return x(d); })
                      .y(function (d) { return y(analysis(d)); })
                      .interpolate('monotone');
      
        svg.select('.forecast')
            .attr('d', linef(xdata));
        svg.select('.observation')
          .attr('class', 'observation')
          .attr('d', lineo(xdata));
        svg.select('.analysis')
          .attr('class', 'analysis')
          .attr('d', linea(xdata));
        function fmt(v) {
            return Number(v).toFixed(2);
        }
        d3.select('#fMeanText').text(fmt(fmean));
        d3.select('#fStdText').text(fmt(fstd));
        d3.select('#oMeanText').text(fmt(omean));
        d3.select('#oStdText').text(fmt(ostd));
        d3.select('#aMeanText').text(fmt(amean));
        d3.select('#aStdText').text(fmt(astd));
    }

    var sstdval = 0.5, smeanval = 2;
    draw(smeanval, sstdval);
    d3.select('#obsMeanSlider')
        .on('change', function () { smeanval = this.value; draw(smeanval, sstdval); })
        .attr('value', smeanval);
    d3.select('#obsStdSlider')
        .on('change', function () { sstdval = this.value; draw(smeanval, sstdval); })
        .attr('value', sstdval);
    d3.select('#foreStdSlider')
        .on('change', function () { fstd = this.value; draw(smeanval, sstdval); })
        .attr('value', fstd);

    function transForecast() {
        var p = d3.select('.forecastTransition');
        var line = d3.svg.line()
                    .x(function (d) { return x(d); })
                    .interpolate('monotone');
        return function (t) {
            var mint = d3.interpolate(fmean, amean);
            var vint = d3.interpolate(fstd, astd);
            var g = gaussian(mint(t), vint(t));
            line.y(function (d) { return y(g(d)); });
            p.attr('d', line(xdata));
        };
    }
    function drawTransition() {
        var pg = d3.select('#kalmanPlotSection')[0][0];
        if (pg.className === 'present') {
            svg.append('path').attr('class', 'forecastTransition')
                .style('fill', 'none')
                .style('stroke', 'black')
                .style('stroke-width', '1.5pt')
                .style('opacity', '0.5')
                .transition()
                .style('stroke', 'blue')
                .tween('forecastTransition', transForecast)
                .duration(1000)
                .remove();
        }
    }
    var legend = svg.append('g')
        .attr('class', 'legend')
        //.style('font-size', '12px')
        .attr('transform', 'translate(50,30)')
        .call(d3.legend);
    setInterval(drawTransition, 1000);
}

function drawEnKFPlot() {
    'use strict';
    d3.selection.prototype.moveToFront = function() { 
      return this.each(function() { 
        this.parentNode.appendChild(this); 
      }); 
    };
    var xdata = d3.range(-5, 5, 0.05);

    var width = 600, height = 400, pad = 5;
    var svg = d3.select('#enkfPlot').append('svg')
                .attr({ width: width + 2*pad, height: height + 2*pad })
                .attr('transform', 'translate(' + [pad, pad] + ')')
                .style('background', 'white')
                .style('border', '5px solid white')
                .style('border-radius', '5px');
    var x = d3.scale.linear()
              .domain([-6, 6])
              .range([0, width]);
    var y = d3.scale.linear()
              .domain([-4, 4])
              .range([height, 0]);

    var nens = 10;

    var fmean = 0.0;
    var fstd = 1.0;
    var fcorr = 0.25;

    var forecastEns;
    var analysisEns = [];
    var dataMean = [-1, 0], dataStd = [0.5, 0.5];
    var fEnsMean, fEnsErr, aEnsMean, aEnsErr;
    
    function getErr(cov) {
        var err = {};
        var eig = enkf.numeric.eig(cov);
        err.x = Math.sqrt(eig.lambda.x[0]);
        err.y = Math.sqrt(eig.lambda.x[1]);
        var v1 = eig.E.x[0];
        var s = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
        err.t = Math.acos(v1[0] / s) * 180 / Math.PI;
        return err;
    }

    function setEllipse(v, err, ell) {
        var xw = x(err.x) - x(0);
        var yw = y(0) - y(err.y);
        ell
            .attr('cx', x(v[0]))
            .attr('cy', y(v[1]))
            .style('opacity', 0.1)
            .attr('rx', xw)
            .attr('ry', yw)
            .attr('transform', 'rotate(' + [err.t,x(v[0]),y(v[1])] + ')');
    }

    function makeEns() {
        var a = [], i, g = d3.random.normal(fmean, fstd);
        var x, y;
        for (i = 0; i < nens; i++) {
            x = g();
            y = g();
            a.push([x, fcorr * x + (1-fcorr) * y]);
        }
        forecastEns = a;
        fEnsMean = enkf.mean(a)[0];
        fEnsErr = getErr(enkf.cov(a));
        setEllipse(fEnsMean, fEnsErr, fErrFill);
    }
    
    var linesx = d3.svg.line()
                  .x(function (d) { return d; })
                  .y(function (d, i) { return i ? pad : height + pad; });
    var linesy = d3.svg.line()
                  .x(function (d, i) { return i ? pad : width + pad; })
                  .y(function (d) { return d; });
    var xysel = 'xy';
    var fErrFill = svg.append('ellipse')
                    .attr('class', 'fErr')
                    .style('fill', 'black')
                    .style('opacity', 1e-6)
                    .style('stroke', 'none');
    var aErrFill = svg.append('ellipse')
                    .attr('class', 'aErr')
                    .style('fill', 'blue')
                    .style('opacity', 1e-6)
                    .style('stroke', 'none');
    var axbox = svg.append('rect')
                    .attr('class', 'bbox')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', width)
                    .attr('height', height)
                    .style('fill', 'white')
                    .attr('opacity', '1e-6')
                    .style('stroke', 'none');
    var xselLine =
            svg.append('path')
                .attr('class', 'xsel')
                .attr('d', linesx([0,0]))
                .style('fill', 'none')
                .style('stroke', 'red')
                .style('stroke-width', '0.5px')
                .style('opacity', 1e-6);
    var yselLine =
            svg.append('path')
                .attr('class', 'ysel')
                .attr('d', linesy([0,0]))
                .style('fill', 'none')
                .style('stroke', 'red')
                .style('stroke-width', '0.5px')
                .style('opacity', 1e-6);
    var obsMark =
            svg.append('circle')
                .attr('class', 'msel')
                .attr('r', 2)
                .style('fill', 'red')
                .style('stroke', 'none')
                .style('opacity', 1e-6);
    var xobsLine =
            svg.append('path')
                .attr('class', 'observationx')
                .attr('d', linesx([0,0]))
                .style('fill', 'none')
                .style('stroke', 'red')
                .style('stroke-width', '1.5px')
                .style('opacity', 1e-6);
    var yobsLine =
            svg.append('path')
                .attr('class', 'observationy')
                .attr('d', linesy([0,0]))
                .style('fill', 'none')
                .style('stroke', 'red')
                .style('stroke-width', '1.5px')
                .style('opacity', 1e-6);
    var xobsFill = svg.append('rect')
                .attr('class', 'obsFillx')
                .attr('fill', 'red')
                .attr('stroke', 'none')
                .style('opacity', 1e-6);
    var yobsFill = svg.append('rect')
                .attr('class', 'obsFilly')
                .attr('fill', 'red')
                .attr('stroke', 'none')
                .style('opacity', 1e-6);
    var cobsFill = svg.append('ellipse')
                .attr('class', 'obsFillc')
                .attr('fill', 'red')
                .attr('stroke', 'none')
                .style('opacity', 1e-6);
    axbox.on('mouseover', function () {
        var p = d3.mouse(this);
        if(xysel === 'x' || xysel === 'xy') {
            xselLine
                .attr('d', linesx([p[0],p[0]]))
                .style('opacity', 1);
        }
        if (xysel === 'y' || xysel === 'xy') {
            yselLine
                .attr('d', linesy([p[1],p[1]]))
                .style('opacity', 1);
        }
    });
    axbox.on('mousemove', function () {
        var p = d3.mouse(this);
        xselLine
              .attr('d', linesx([p[0],p[0]]));
        yselLine
              .attr('d', linesy([p[1],p[1]]));
    });
    axbox.on('mouseout', function () {
        xselLine.style('opacity', 1e-6);
        yselLine.style('opacity', 1e-6);
    });
    function clearObs() {
        aErrFill.style('opacity', 1e-6);
        obsMark.style('opacity', 1e-6);
        xobsLine.style('opacity', 1e-6);
        yobsLine.style('opacity', 1e-6);
        xobsFill.style('opacity', 1e-6);
        yobsFill.style('opacity', 1e-6);
        cobsFill.style('opacity', 1e-6);
    }
    axbox.on('click', function () {
        var p = d3.mouse(this);
        var xw, yw;
        xw = x(dataStd[0]) - x(0);
        yw = y(0) - y(dataStd[1]);
        clearObs();
        if (xysel === 'x') {
            dataMean = [x.invert(p[0]), NaN];
            xobsFill
                  .attr('x', p[0] - xw)
                  .attr('y', pad)
                  .attr('width', 2*xw)
                  .attr('height', height)
                  .style('opacity', 0.05);
            xobsLine
                  .attr('d', linesx([p[0],p[0]]))
                  .style('opacity', 0.5);
        } else if (xysel === 'y') {
            dataMean = [NaN, y.invert(p[1])];
            yobsFill
                  .attr('x', pad)
                  .attr('y', p[1] - yw)
                  .attr('width', width)
                  .attr('height', 2*yw)
                  .style('opacity', 0.05);
            yobsLine
                  .attr('d', linesy([p[1],p[1]]))
                  .style('opacity', 0.5);
        } else {
            dataMean = [x.invert(p[0]), y.invert(p[1])];
            cobsFill
                  .attr('cx', p[0])
                  .attr('cy', p[1])
                  .attr('rx', xw)
                  .attr('ry', yw)
                  .style('opacity', 0.05);
            obsMark
                  .attr('cx', p[0])
                  .attr('cy', p[1])
                  .style('opacity', 1);
        }
        assimilate();
    });
    
    makeEns();
    function assimilate() {
        var H, obs, ovar;
        if (xysel === 'x') {
            H = enkf.obsFunction(0);
            obs = [[dataMean[0]]];
            ovar = [[dataStd[0] * dataStd[0]]];
        } else if (xysel === 'y') {
            H = enkf.obsFunction(1);
            obs = [[dataMean[1]]];
            ovar = [[dataStd[1] * dataStd[1]]];
        } else {
            H = enkf.obsFunction();
            obs = [dataMean];
            ovar = [[dataStd[0] * dataStd[0],dataStd[1] * dataStd[1]]];
        }
        analysisEns = enkf(forecastEns, obs, H, ovar);
        //var pp = enkf.numeric.prettyPrint;
        //console.log(pp(forecastEns));
        //console.log(pp(analysisEns));
        draw();
    }

    function draw() {
        var fsel = svg.selectAll('.forecast')
            .data(forecastEns);
        fsel.enter()
            .append('circle')
              .attr('class', 'forecast')
              .attr('r', '3pt')
              .style('fill', 'none')
              .style('stroke', 'black')
              .style('stroke-width', '1.5pt');
        fsel
              .attr('cx', function (d) { return x(d[0]); })
              .attr('cy', function (d) { return y(d[1]); });
        fsel.exit().remove();
        var asel = svg.selectAll('.analysis');
        asel
            .data(forecastEns)
              .enter()
            .append('circle')
              .attr('class', 'analysis')
              .attr('r', '3pt')
              .style('fill', 'none')
              .style('stroke', 'blue')
              .style('stroke-width', '1.5pt')
              .style('opacity', 1e-6);
        asel.data(forecastEns)
              .attr('cx', function (d) { return x(d[0]); })
              .attr('cy', function (d) { return y(d[1]); });
        asel.data(analysisEns).style('opacity', 1).transition().duration(1000)
              .attr('cx', function (d) { return x(d[0]); })
              .attr('cy', function (d) { return y(d[1]); });
        asel.data(analysisEns).exit().style('opacity', 1e-6);
        if (analysisEns.length > 0) {
            aEnsMean = enkf.mean(analysisEns)[0];
            aEnsErr = getErr(enkf.cov(analysisEns));
            setEllipse(aEnsMean, aEnsErr, aErrFill);
        }
        axbox.moveToFront();
    }
    draw();
    
    d3.select('#enkfObsVarX').on('change', function () {
        dataStd[0] = this.value;
    })
      .attr('value', dataStd[0]);
    d3.select('#enkfObsVarY').on('change', function () {
        dataStd[1] = this.value;
    })
      .attr('value', dataStd[1]);
    d3.select('#enkfNens').on('change', function () {
        nens = Number(this.value);
    })
      .attr('value', nens);
    d3.select('#enkfObsVar').on('change', function () {
        xysel = this.value;
    });
    d3.select('#enkffCor').on('change', function () {
        fcorr = this.value;
    })
      .attr('value', fcorr);
    d3.select('#enkfSubmitButton').on('click', function () {
        clearObs();
        makeEns();
        analysisEns = [];
        draw();
    });

    //var legend = svg.append('g')
    //    .attr('class', 'legend')
    //    .attr('transform', 'translate(50,30)')
    //    .call(d3.legend);
    //setInterval(drawTransition, 1000);
}
