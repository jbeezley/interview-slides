// d3.legend.js 
// (C) 2012 ziggy.jonsson.nyc@gmail.com
// MIT licence
/* jshint indent: false */
/* global d3 */
(function() {
    'use strict';
    var lineLength = 2;
    var fontSize = 18;
d3.legend = function(g) {
  g.each(function() {
    var g= d3.select(this),
        items = {},
        svg = d3.select(g.property("nearestViewportElement")),
        legendPadding = g.attr("data-style-padding") || 5,
        //lb = g.selectAll(".legend-box").data([true]),
        li = g.selectAll(".legend-items").data([true]);
 
    //lb.enter().append("rect").classed("legend-box",true);
    li.enter().append("g").classed("legend-items",true);
 
    svg.selectAll("[data-legend]").each(function() {
        var self = d3.select(this);
        items[self.attr("data-legend")] = {
          pos : self.attr("data-legend-pos") || this.getBBox().y,
          color : self.style("stroke"),
          width : self.style('stroke-width')
        };
      });
 
    items = d3.entries(items).sort(function(a,b) { return a.value.pos-b.value.pos; });
 
    
    li.selectAll("text")
        .data(items,function(d) { return d.key; })
        .call(function(d) { d.enter().append("text"); })
        .call(function(d) { d.exit().remove(); })
        .attr("y",function(d,i) { return i+"em"; })
        .attr("x","1em")
        .text(function(d) { return d.key; })
        .style('font-size', fontSize + 'px');
    
    var line = d3.svg.line()
            .x(function (d) { return fontSize * d[0]; })
            .y(function (d) { return fontSize * d[1]; });
    function makeLine(cx, cy) {
        var data = [ [cx - lineLength/2, cy],
                     [cx + lineLength/2, cy]];
        return line(data);
    }
    
    li.selectAll("path")
        .data(items,function(d) { return d.key; })
        .enter().append('path')
        .attr('d', function (d, i) { return makeLine(0, i-0.25); })
        //.call(function(d) { d.enter().append("path").attr('d', makeLine(0, -0.25)); })
        //.call(function(d) { d.exit().remove(); })
        //.attr("cy",function(d,i) { return i-0.25+"em"; })
        //.attr("cx",0)
        //.attr("r","0.4em")
        .style("stroke", function(d) {
          return d.value.color;
        })
        .style('fill', 'none')
        .style('stroke-width', function (d) { return d.value.width; });
    //li.selectAll('text').call(function (d) {console.log(d[0][0].getBBox());}); 
    // Reposition and resize the box
    /*var lbbox = li[0][0].getBBox();
    lb.attr("x",(lbbox.x-legendPadding))
        .attr("y",(lbbox.y-legendPadding))
        .attr("height",(lbbox.height+2*legendPadding))
        .attr("width",(lbbox.width+2*legendPadding));*/
  });
  return g;
};
})();
