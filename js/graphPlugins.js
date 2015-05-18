/*
String.prototype.ucwords = function () {
	return this.replace(/(?:^|\s)\S/g, function (v) { return v.toUpperCase(); });
};
String.prototype.ucfirst = function () {
	return this.replace(/(^[a-z])/, function (v) { return v.toUpperCase(); });
};
String.prototype.lcfirst = function () {
	return this.replace(/(^[A-Z])/, function (v) { return v.toLowerCase(); });
};
String.prototype.camelCaseToWords = function () {
	return this.split(/(?=[A-Z])/).join(" ");
};
String.prototype.Us2Space = function () {
	return this.replace(/_/g, " ");
};
String.prototype.short = function (len) {
    return (this.length > (len || 30) ? this.substr(0, (len || 30)) + ".." : this).toString();
};
*/

$(document).ready(function () {

    graphPlugins.forceGraph();
    
    $("form#graphfilter").submit(function (e) {
        e.preventDefault();
    });
    
    $("[title]").qtip({
        position: {
            my: "bottom center", at: 'bottom center', target : "mouse"
        }
    });
});

var gnodes;
var gedges;

var svg;
var force;
var nodes;
var edges;

function startForce(alpha) {
    if (force) {
        if (alpha) {
            force.alpha(alpha).start();
        } else {
            force.start();
        }
    }
}

/*
Remove force layout and data, then start again
http://stackoverflow.com/questions/21338135/d3js-force-layout-destroy-and-reset
**/
function trueRestart() {
    //svg.remove();
    
    gnodes.remove();
    gedges.remove();

    nodes = [];
    links = [];
    //force.nodes(nodes);
    //force.links(links);
    
    graphPlugins.forceGraph();
}

var imdbApiUrl = function (node) {
    return "http://www.omdbapi.com/?i=" + node.imdbid + "&plot=short&r=json";
};

var movieImgUrl = function (node) {
    return "./images/movies/" + node.imdbid + ".JPG";
};

var graphPlugins = {
    
    forceGraph : function () {
        var selector = '#grapharea';
        var div = d3.select(selector), $div = $(selector);
        
        var config = {
            textColor: div.attr("data-textcolor") || 'black',
            rmin: parseInt(div.attr("data-rmin")) || 2, rmax : parseInt(div.attr("data-rmax")) || 10,
            w: $div.width(), h: $div.height(), minrating: 0.01,
            //charge: -50,
            //chargeDistance: 200,
            linkDistance: 60, 
            //linkStrength: 0.1,
            //friction: 0.9, 
            //gravity: 0.25,
            zoom: 1.0, //zoomMin: 0.8, zoomMax: 8.0, zoomStep: 0.2,
            colors: { movie: '#1D9880', star: '#D5F271', director: '#FC8236', character: '#A01852', active: 'black', hover: 'silver' },
            showlabel: true
        };
        
        var rScale = d3.scale.sqrt().range([config.rmin, config.rmax]);
        
        var url = div.attr("data-url");
        svg = div.select('svg');
        svg.attr("width", config.w);
        svg.attr("height", config.h);
        var container = svg.append("g");
        gnodes = container.selectAll("g.node");
        gedges = container.selectAll("line.edge");
        var activeNode = null;
        
        /*
        var zoom = d3.behavior.zoom()
            .scaleExtent([config.zoomMin, config.zoomMax])
            .on("zoom", zoomed);

        function zoomed() {
            config.zoom = d3.event.scale;
            container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }
        
        svg.attr("transform", "translate(0,0)").call(zoom).on("dblclick.zoom", null);
        */
        
        function dragstarted(d) {
            // why? not needed
            //d3.event.sourceEvent.stopPropagation();
            
            d3.select(this).classed("fixed", d.fixed = true);
            //d3.select(this).classed("dragging", true);
            
            // why? not needed
            //startForce();
        }
        
        /*
        function dragged(d) { 
            d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y); 
        }
        
        function dragended(d) { 
            d3.select(this).classed("dragging", false); 
        }

        d3.behavior.drag()
            .origin(function (d) { return d; })
            .on("dragstart", dragstarted)
            .on("drag", dragged)
            .on("dragend", dragended);
        */
        
        nodes = {
            keys: [],
            list: [],
            makeKey : function(d) {
                return d.type + "_" + d.name.toLowerCase().replace(/ /g,"_") + (d.year ? "_" + d.year : "");
            },
            exists: function(data) {
                return this.keys.indexOf(this.makeKey(data)) > -1;
            },
            add: function(data) {
                if(!this.exists(data)) {
                    data.id = this.makeKey(data);
                    data.zoom = 1;
                    data.active = 1;
                    data.hover = 0;
                    this.keys.push(data.id);
                    this.list.push(data);
                } else data.id = this.makeKey(data);
            },
            get: function(name, type, year) {
                var key = arguments.length >= 2 ? this.makeKey({name: name,type: type, year : (year || null)}) : name;
                for(var i = 0; i < this.list.length; i++) {
                    if(key === this.list[i].id) return this.list[i];
                }
                return null;
            },
            getAll: function() { return this.list; }
        };
        
        edges = {
            keys: [],
            list: [],
            makeKey : function(s, d) {
                return s.id + ":" + d.id;
            },
            exists: function(s, d) {
                return this.keys.indexOf(this.makeKey(s, d)) > -1;
            },
            add: function(s, d) {
                if(!this.exists(s, d)) {
                    var e = this.makeKey(s, d);
                    this.keys.push(e);
                    this.list.push({
                        source: s, target: d, id: e, active: 1, hover: 0
                    });
                }
            },
            get: function(s,d) {
                var key = this.makeKey(s, d);
                for(var i = 0; i < this.list.length; i++){
                    if(key === this.list[i].id) return this.list[i];
                }
                return null;
            },
            getAll: function() { 
                return this.list;
            }
        };
        
        var tick = function(e) {
            //if(force.alpha() < 0.025) force.alpha(0); //why? - Required to stop nodes from moving till forever..
            //after a threshold is reached force layout must be stopped to save browser memory.
            
            // why do we need a transform/translate here - why can't we just use the current x/y?
            // transform is needed because nodes are not circles but a group('g') that has circles and labels.
            // Group is transformed, circle and label are placed relative to their group.
            //gnodes.attr("cx", function(d) { return d.x; }).attr("cy", function(d) { return d.y; });
            gnodes.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
            
            // enable collision detection/prevention
            //gnodes.each(collide(0.5, nodes.getAll()));
            
            gedges.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
        };
        
        /*
         * this was having a zoom effect on force layout by associating linkStrength and linkDistance
         * to zoom.
        .linkStrength(
            //function(d) {
            //    return config.linkStrength/d.zoom/config.zoom;
            //}
            config.linkStrength
            ).linkDistance(
            //function(d) {
            //    return config.linkDistance*config.zoom*config.zoom*(config.showlabel ? 3 : 1);
            //}
            config.linkDistance
            ).charge(
            //function(d) {
            //    return -30*config.zoom*(d.zoom + config.minrating)*d.active;
            //}
            config.charge
            )
            .size([config.w-2*config.rmax,config.h-2*config.rmax])
        */
        
        force = d3.layout.force()
            .size([config.w, config.h])
            //.linkStrength(config.linkStrength)
            .linkDistance(config.linkDistance)
            //.charge(config.charge)
            .charge(-60)
            //.chargeDistance(config.chargeDistance)
            //.friction(config.friction)
            .friction(0.7)
            //.gravity(config.gravity)
            .gravity(0.4)
            .on("tick", tick)
            //.on("end", tick); //why? - to have our nodes at the final best positions calculated by force layout.

        var drag = force.drag().on("dragstart", dragstarted);
        
        var selectMovie = function(fc) {
            //$("#connectionselect").fadeIn('fast');
            activeNode = fc;
            var active = $("input[name='link']:checked").val() || "";
            filter.disableAll();
            //fc.zoom = 2;
            
            // enable movies
            filter.enableConnected(fc.id, active);
            
            // enable any other filters
            if(!active || active === 'star') {
                for(var s in fc.starNodes) {
                    filter.enableConnected(fc.starNodes[s].id, 'movie');
                }
            }
            if(!active || active === 'character') {
                for(var s in fc.characterNodes) {
                    filter.enableConnected(fc.characterNodes[s].id, 'movie');
                }
            }
            if(!active || active === 'director') {
                for(var s in fc.starNodes) {
                    filter.enableConnected(fc.director.id, 'movie');
                }
            }
            fc.active = 1;
            filter.layout(3, activeNode, rScale);
        };
        
        var updateMovie = function() {
            if($("input#movie").val()) {
                var name = $("input#movie").val(),m = name.match(/, (\d+)/), year = m ? m[1] : '';
                if(m) name = name.replace(/, \d+/, '');
                selectMovie(nodes.get(name, 'movie', year));
            }
        };
        
        //var changeFilters = function() {
        //    applyFilters();
        //}
        
        //Page Events
        $("input#movie").keyup(function(e) {
            e.preventDefault();
            e.stopPropagation();
            var code = e.keyCode || e.which;
            var name = $(this).val(),m = name.match(/, (\d+)/), year = m ? m[1] : '';
            if(m) name = name.replace(/, \d+/, '');
            if(code === 13 && nodes.get(name, 'movie', year)) {
                updateMovie();
            }
        });
        
        $("input[name='link']").change(applyFilters);//(updateMovie);
        
        $("a#clear").click(function(e){
            e.preventDefault();
            filter.enableAll();
            activeNode = null;
            tip.showActive(activeNode);
            config.zoom = 1;
            $("input#movie").val("");
            //$("#connectionselect").fadeOut('fast');
            $("input#check[name='link']").prop('checked',true);
            filter.layout(1, activeNode, rScale);
        });
        
        $("body").keyup(function(e) {
            var code = e.keyCode || e.which;
            if(code === 27) {
                if(activeNode) {
                    activeNode = null;
                    edgeHighlight(activeNode,false);
                }
                tip.showActive(activeNode);
            }
        });
        
        $("input#showlabels").click(function() {
            config.showlabel = !config.showlabel;
            showHideLabels();
        });
        
        function showHideLabels() {
            gnodes.selectAll("text").style("opacity", config.showlabel ? 1 : 0);
            
            // why do this, I don't think they really need rearranging and its not behaving correctly
            // this was used to rearrange nodes if their positions have corrupted after some usage. Generally
            // showing labels might be followed by zoom/drag.
            //force.alpha(0.1).start();
        }
        
        var edgeHighlight = function(d, highlight) {
            if(highlight) {
                gedges.each(function(de){
                    de.hover = de.source.id === d.id || de.target.id === d.id ? 1 : 0.1;
                    de.source.hover = Math.max(de.source.hover,de.hover);
                    de.target.hover = Math.max(de.target.hover,de.hover);
                });
                gnodes.style('stroke', function(dn) {
                    return activeNode && activeNode.id === dn.id ? config.colors.active : ( dn.id === d.id ? config.colors.hover : '');
                }).style("stroke-width", function(dn) {
                    return activeNode && activeNode.id === dn.id ? '3px' : ( dn.id === d.id ? '3px' : '');
                });
            }
            else {
                gedges.each(function(de) {
                    de.hover = 0;
                    de.source.hover = 0;
                    de.target.hover = 0;
                });
                filter.setActiveStroke(activeNode, config.colors.active);
            }
            filter.setOpacity();
        };
        
        //Creates graph afresh from data available in force
        var refreshGraph = function() {
            
            //Render edges
            gedges = gedges.data(force.links()).enter().append('line')
                .attr("class", "edge")
                .style("stroke-width", 1).attr("fill", function(d) {
                    return d.target.color;
                }).attr("stroke", function(d){return d.target.color || 'grey';})
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });;
        
            //Render nodes
            gnodes = gnodes.data(force.nodes()).enter().append('g').attr("class","node").each(function(d) {
                // this is their initial position, very important
                //d.x = Math.random() * config.w;
                //d.y = Math.random() * config.h;
                d.x = 0;
                d.y = 0;
            }).attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
            
            gnodes.selectAll('circle').remove();
            
            var circle = gnodes.append('circle').attr("class", "bubble");
            circle.attr("fill",function(d){ return d.color; })
                .attr('r', 0).attr("stroke-width", 2)
                .transition().duration(500).attr("r", function(d) {
                    d.r = rScale(d.rating);
                    return d.r * d.zoom; 
                });
//            circle.call(tip);
            
            circle.on("mouseover",function(d) {
                if(activeNode && d.id === activeNode.id) return;
                tip.hide();
                tip.show(d);
                edgeHighlight(d, true);
            }).on("mouseout",function(d) {
                edgeHighlight(d, false);
                tip.hide();
                if(activeNode) edgeHighlight(activeNode, true);
//                window.setTimeout(function(){
//                    if($("div.d3-tip").text().indexOf(d.name)>-1) tip.hide(d);
//                },3000);
            }).on("click",function(d) {
                if(activeNode && activeNode.id !== d.id)
                    edgeHighlight(activeNode, false);
                activeNode = d;
                edgeHighlight(d, true);
                tip.hide();
                tip.showActive(activeNode);
            }).on("dblclick",function(d) {
                var type = $("input[name='link']:checked").val();
                activeNode = d;
                edgeHighlight(d, true);
                filter.enableConnected(d.id, type);
                filter.layout(activeNode, rScale);
            });
            
            //Render Text
            gnodes.append("text").text(function(d){return d.name.length > 12 ? (d.name.substr(0,10) + "..") : d.name;})
                    .style("opacity", 0).style("font-size", '10px')
                    .style("stroke-width", "0.3")
                    .attr("x", function(){ return -this.getBBox().width/2; })
                    .attr("y", function(d){ return -rScale(d.rating); })
                    .style("pointer-events", "none");
            
            $('body').click(function(e) {
                if(e.target.tagName !== 'circle') {
                    activeNode = null;
                    edgeHighlight(null, false);
                }
                tip.showActive(activeNode);
            });
            
            // new function call to listen to filters immediately
            applyFilters();
            
            showHideLabels();
            
            // what is this doing? it's critical for drag anyway!
            // Adds d3 drag event handler to nodes.
            //gnodes.call(force.drag);
            gnodes.call(drag);
            
            startForce(0.1);
        };
        
        // Load Data
        loadMovieData(url, config, rScale, refreshGraph);
        
        // hook up search box population
        addSuggester("input#movie", function(term) {
            var res = [];
            nodes.getAll().forEach(function(n) {
                if(n.type==='movie' && n.name.toLowerCase().indexOf(term.toLowerCase())>-1) res.push(n.name + (n.year ? ", " + n.year : ""));
            });
            return res;
        }, updateMovie);
    }
};