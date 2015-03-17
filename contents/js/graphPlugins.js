/* * ************************************************************ 
 * 
 * Date: 21 Jan, 2015
 * version: 0.0.1
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Description:   
 * Javascript file graphPlugins.js
 * *************************************************************** */

String.prototype.ucwords = function(){
	return this.replace(/(?:^|\s)\S/g,function(v){return v.toUpperCase();});
};
String.prototype.ucfirst = function(){
	return this.replace(/(^[a-z])/,function(v){return v.toUpperCase();});
};
String.prototype.lcfirst = function(){
	return this.replace(/(^[A-Z])/,function(v){return v.toLowerCase();});
};
String.prototype.camelCaseToWords = function(){
	return this.split(/(?=[A-Z])/).join(" ");
};
String.prototype.Us2Space = function(){
	return this.replace(/_/g," ");
};
String.prototype.short = function(len){
    return (this.length> (len || 30) ? this.substr(0,(len || 30))+".." : this).toString();
};
var graphPlugins = {
    forceGraph : function(){
        var selector = '#grapharea';
        var div = d3.select(selector), $div = $(selector);
        var config = {
            colors : ["#19FFBB","#0090D9","#E400FF"],textColor: div.attr("data-textcolor") || 'black',
            rmin: parseInt(div.attr("data-rmin")) || 2, rmax : parseInt(div.attr("data-rmax")) || 10,
            w : $div.width(),h : $div.height(),minrating: 0.01,
            linkDistance: 10, linkStrength: 0.1,zoom: 1
        };
        var rScale = d3.scale.sqrt().range([config.rmin,config.rmax]);
        var url = div.attr("data-url");
        var svg = div.append('svg');
        svg.attr("width",config.w);
        svg.attr("height",config.h);
        var gnodes = svg.selectAll("g.node"), gedges = svg.selectAll("line.edge"),activeNode = null;
//        var tip = d3.tip().attr('class', 'd3-tip').html(function(d) { 
//            if(!d.tooltip || !d.tooltip.length) return "<span><strong>"+d.name+"</strong></span>";
//            var html = "";
//            for(var i=0;i<d.tooltip.length;i++){
//                var text = d.tooltip[i].url ? "<a href='"+d.tooltip[i].url+"' target='_blank'>"+d[d.tooltip[i].key]+"</a>" : d[d.tooltip[i].key];
//                if(d.tooltip[i].label)
//                    html += "<span class='title'> "+d.tooltip[i].label+":</span> " ; 
//                html += text+"<br />";
//            }
//            return html;
//        });
        
        var tip = {
            getHtml: function(d,title){
                var html = "<h3>"+title+" Node</h3>";
                if(!d.tooltip || !d.tooltip.length) return html+"<span><strong>"+d.name+"</strong></span>";
                for(var i=0;i<d.tooltip.length;i++){
                    var text = d.tooltip[i].url ? "<a href='"+d.tooltip[i].url+"' target='_blank'>"+d[d.tooltip[i].key]+"</a>" : d[d.tooltip[i].key];
                    if(d.tooltip[i].label)
                        html += "<span class='title'> "+d.tooltip[i].label+":</span> " ; 
                    html += text+"<br />";
                }
                return html;
            },
            show: function(d){
                $("div#infohover").html(tip.getHtml(d,"Hovered")).show();
            },
            hide: function(){
                $("div#infohover").hide();
            },
            showActive: function(){
                if(activeNode) $("div#infoactive").html(tip.getHtml(activeNode,"Active")).show();
                else $("div#infoactive").hide();
            }
        };
        
        var nodes = {
            keys: [],
            list: [],
            makeKey : function(d){
                return d.type+"_"+d.name.toLowerCase().replace(/ /g,"_");
            },
            exists: function(data){
                return this.keys.indexOf(this.makeKey(data)) > -1;
            },
            add: function(data){
                if(!this.exists(data)){
                    data.id = this.makeKey(data);
                    data.zoom = 1;
                    data.active = 1;
                    data.hover = 0;
                    this.keys.push(data.id);
                    this.list.push(data);
                }else data.id = this.makeKey(data);
            },
            get: function(name,type){
                var key = arguments.length === 2 ? this.makeKey({name: name,type: type}) : name;
                for(var i=0;i<this.list.length;i++){
                    if(key === this.list[i].id) return this.list[i];
                }
                return null;
            },
            getAll: function(){ return this.list;}
        };
        var edges = {
            keys: [],
            list: [],
            makeKey : function(s,d){
                return s.id+":"+d.id;
            },
            exists: function(s,d){
                return this.keys.indexOf(this.makeKey(s,d)) > -1;
            },
            add: function(s,d){
                if(!this.exists(s,d)){
                    var e = this.makeKey(s,d);
                    this.keys.push(e);
                    this.list.push({
                        source: s, target: d, id: e, active: 1, hover: 0
                    });
                }
            },
            get: function(s,d){
                var key = this.makeKey(s,d);
                for(var i=0;i<this.list.length;i++){
                    if(key === this.list[i].id) return this.list[i];
                }
                return null;
            },
            getAll: function(){ return this.list;}
        };
        
        var filter = {
            disableAll: function(){
                gedges.each(function(d){ d.active = 0; });
                gnodes.each(function(d){ d.active = 0; });
            },
            enableAll : function(){
                gedges.each(function(d){ d.active = 1; });
                gnodes.each(function(d){ 
                    d.active = 1; 
                    d.zoom = 1;
                });
            },
            enableConnected: function(id,type){
                gedges.each(function(d){
                    if(!d.active){
                        if(d.source.id===id && (type === "" || d.target.type === type)){
                            d.target.active = 1;
                            d.active = 1;
                        }else if(d.target.id===id && (type === "" || d.source.type === type)){
                            d.source.active = 1;
                            d.active = 1;
                        }
                    }
                });
            },
            enableType: function(type){
                gedges.each(function(d){
                    if(!d.active){
                        if(d.target.type === type){
                            d.target.active = 1;
                            d.active = 1;
                        }else if(d.source.type === type){
                            d.source.active = 1;
                            d.active = 1;
                        }
                    }
                });
            },
            setOpacity: function(){
                gnodes.transition().duration(400).style('opacity',function(d){ return d.active ? d.hover || d.active : d.active; });
                gedges.transition().duration(400).style('opacity',function(d){ return d.active ? d.hover || d.active : d.active; });
            },
            layout: function(zoom){
                config.zoom = arguments.length ? zoom || 1 : config.zoom;
                gnodes.style('stroke',function(d){ return activeNode && d.id === activeNode.id ? 'red' : '' ;})
                      .style("stroke-width",function(d){ return activeNode && d.id === activeNode.id ? '3px' : '0x' ;});
                gnodes.selectAll("circle.bubble").transition().duration(500)
                    .attr("r",function(d){ return rScale(d.rating+0.001) * d.zoom * d.active; });
                filter.setOpacity();
                force.alpha(0.1).start();
            }
        };
        
        var tick = function(e){
            gnodes.attr("transform",function(d){ return "translate("+d.x+","+d.y+")"; });
            gedges.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) {  return d.target.y; });
//                .attr("d",function(d){
//                    return "M"+d.source.x+" "+d.source.y+
//                           " C "+d.source.x+" "+(d.source.y+d.target.y)/2+", "+
//                           d.target.x+" "+(d.source.y+d.target.y)/2+", "+
//                           d.target.x+" "+d.target.y;});;
        };
        
        var force = d3.layout.force()
            .linkStrength(function(d){
                return config.linkStrength/d.zoom/config.zoom;
            }).linkDistance(function(d){
                return config.linkDistance*config.zoom;
            }).charge(function(d){
                return -30*(d.zoom+config.minrating)*d.active;
            }).size([config.w-2*config.rmax,config.h-2*config.rmax])
            .on("tick", tick).on("end", tick);

        var selectMovie = function(fc){
            activeNode = fc;
            var active = $("select#linkparam").val();
            filter.disableAll();
            fc.zoom = 2;
            filter.enableConnected(fc.id,active);
            if(!active || active==='star'){
                for(var s in fc.starNodes){
                    filter.enableConnected(fc.starNodes[s].id,'movie');
                }
            }
            if(!active || active==='character'){
                for(var s in fc.characterNodes){
                    filter.enableConnected(fc.characterNodes[s].id,'movie');
                }
            }
            if(!active || active==='director'){
                for(var s in fc.starNodes){
                    filter.enableConnected(fc.directorNode.id,'movie');
                }
            }
            fc.active = 1;
            filter.layout(20);
        };
        
        var updateMovie = function(){
            if($("input#movie").val())
                selectMovie(nodes.get($("input#movie").val(),'movie'));
        };
        
        $("input#movie").keyup(function(e){
            e.preventDefault();
            e.stopPropagation();
            var code = e.keyCode || e.which;
            if(code === 13 && nodes.get($(this).val(),'movie')){
                updateMovie();
            }
        });
        $("select#linkparam").change(updateMovie);
        $("a#clear").click(function(e){
            e.preventDefault();
            filter.enableAll();
            activeNode = null;
            config.zoom = 1;
            $("input#movie").val("");
            $("select#linkparam").val("");
            filter.layout(1);
        });
        
        var edgeHighlight = function(d,highlight){
            if(highlight)
                gedges.each(function(de){
                    de.hover = de.source.id === d.id || de.target.id === d.id ? 1 : 0.1;
                    de.source.hover = Math.max(de.source.hover,de.hover);
                    de.target.hover = Math.max(de.target.hover,de.hover);
                });
            else gedges.each(function(de){
                de.hover = 0;
                de.source.hover = 0;
                de.target.hover = 0;
            });
            filter.setOpacity();
        };
        
        var refreshGraph = function(){
            //Render edges
            gedges = gedges.data(force.links()).enter().append('line')
                .attr("class", "edge")
                .style("stroke-width", 1).attr("fill",function(d){
                    return d.target.color;
                }).attr("stroke",function(d){return d.target.color || 'grey';})
//                .attr("d",function(d){
//                    return "M"+d.source.x+" "+d.source.y+
//                           " C "+(0.9*d.source.x+0.1*d.target.x)+" "+(0.9*d.source.y+0.1*d.target.y)+", "+
//                           (0.9*d.target.x+0.1*d.source.x)+" "+(0.9*d.target.y+0.1*d.source.y)+", "+
//                           d.target.x+" "+d.target.y;});
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) {  return d.target.y; });;
        
            //Render nodes
            gnodes = gnodes.data(force.nodes()).enter().append('g').attr("class","node").each(function(d){
                d.x = Math.random()*config.w;
                d.y = Math.random()*config.h;
            }).attr("transform",function(d){ return "translate("+d.x+","+d.y+")"; });
            gnodes.selectAll('circle').remove();
            
            //Render Circles
            var circle = gnodes.append('circle').attr("class","bubble");
            circle.attr("fill",function(d){ return d.color; })
                .attr('r',0).attr("stroke-width", 2)
                .transition().duration(500).attr("r",function(d){ return rScale(d.rating)*d.zoom; });
//            circle.call(tip);
            circle.on("mouseover",function(d){
                tip.hide();
                tip.show(d);
                edgeHighlight(d,true);
            }).on("mouseout",function(d){
                edgeHighlight(d,false);
                if(activeNode) edgeHighlight(activeNode,true);
//                window.setTimeout(function(){
//                    if($("div.d3-tip").text().indexOf(d.name)>-1) tip.hide(d);
//                },3000);
            }).on("click",function(d){
                activeNode = d;
                edgeHighlight(d,true);
                tip.showActive();
            }).on("dblclick",function(d){
                var type = $("select#linkparam").val();
                console.log('dblclick',d.id);
                filter.enableConnected(d.id,type);
                filter.layout();
            });
            
            $('body').click(function(e){
                if(e.target.tagName!=='circle'){
                    activeNode = null;
                    edgeHighlight(null,false);
                }
            });
            
            gnodes.selectAll('text').remove();
            gnodes.call(force.drag);
            force.alpha(0.1).start();
        };
        
        //Load Data
        $.fancybox.showLoading();
        d3.json(url,function(err,data){
            $.fancybox.hideLoading();
            if(err) return $.fancybox("<p>Failed to load data.</p>");
            data.forEach(function(d,i){
                d.type = 'movie';
                d.starNodes = {};
                d.characterNodes = {};
                d.rating = d.rating && parseInt(d.rating) ? parseInt(d.rating) : 0 ;
                d.color = 'orange';
                d.y = 0; d.x = 0;
                d.tooltip = [
                    { key: "name",url : d.url || "" },
                    {key: "rating", label: "Rating"}
                ];
                nodes.add(d);
                var director = {name: d.director, type: 'director', rating: 0,films: 0, color: 'black'};
                director.tooltip = [
                    {key: 'name' },
                    {key: "rating", label: "Average Rating"}
                ];
                nodes.add(director);
                edges.add(nodes.get(d.id),nodes.get(director.id));
                d.directorNode = nodes.get(director.id);
                d.directorNode.rating = (d.directorNode.rating*d.directorNode.films+d.rating)/(d.directorNode.films+1).toFixed(1);
                d.directorNode.films++;
                d.stars.forEach(function(s){
                    var star = {name: s, type: 'star',rating: 0,  color: 'blue',films: 0};
                    star.tooltip = [
                        {key: 'name' },
                        {key: "rating", label: "Average Rating"}
                    ];
                    nodes.add(star);
                    edges.add(nodes.get(d.id),nodes.get(star.id));
                    d.starNodes[star.id] = nodes.get(star.id);
                    d.starNodes[star.id].rating = (d.starNodes[star.id].rating * d.starNodes[star.id].films + d.rating)/(d.starNodes[star.id].films+1).toFixed(1);
                    d.starNodes[star.id].films++;
                });
                d.characters.forEach(function(s){
                    var character = {name: s, type: 'character',rating: 0, color: 'green',films: 0};
                    character.tooltip = [
                        {key: 'name' },
                        {key: "films", label: "Found in movies"}
                    ];
                    nodes.add(character);
                    edges.add(nodes.get(d.id),nodes.get(character.id));
                    d.characterNodes[character.id] = nodes.get(character.id);
                    d.characterNodes[character.id].rating = (d.characterNodes[character.id].rating * d.characterNodes[character.id].films + d.rating)/(d.characterNodes[character.id].films+1).toFixed(1);
                    d.characterNodes[character.id].films++;
                });
            });
            data.forEach(function(d,i){
                if(!d.id) return console.error("missing id for movie",d.name);
                for(var j=i+1;j<data.length;j++){
                    if(!data[j].id){
                        console.error("missing id for movie",data[j].name);
                        continue;
                    }
                    var w = 0;
                    if(d.directorNode.id === data[j].directorNode.id) w++;
                    d.stars.forEach(function(s1){
                        data[j].stars.forEach(function(s2){
                            if(s1 === s2) w++;
                        });
                    });
                    d.characters.forEach(function(c1){
                        data[j].characters.forEach(function(c2){
                            if(c1 === c2) w++;
                        });
                    });
                    if(w){
                        edges.add(d,data[j]);
                    }
                }
            });
            var min = d3.min(nodes.getAll(),function(d){ return d.rating;})*config.minrating,
                max = d3.max(nodes.getAll(),function(d){ return d.rating;})*3;
                rScale.domain([min, max]);
            force.nodes(nodes.getAll()).links(edges.getAll())
                .linkStrength(0.1)
                .friction(0.9)
                .gravity(0.25)
                .theta(0.8);
            refreshGraph();
        });
        
        addSuggester("input#movie",function(term){
            var res = [];
            nodes.getAll().forEach(function(n){
                if(n.type==='movie' && n.name.toLowerCase().indexOf(term.toLowerCase())>-1) res.push(n.name);
            });
            return res;
        },updateMovie);
    }
};

$(document).ready(function(){
    graphPlugins.forceGraph();
    $("form#graphfilter").submit(function(e){
        e.preventDefault();
    });
//    d3.selectAll(".streamgraph").each(function(){
//        graphPlugins.streamGraph(this);
//    });
//    d3.selectAll(".bargraph").each(function(){
//        graphPlugins.barGraph(this);
//    });
//    d3.selectAll(".bargraphgeneric").each(function(){
//        graphPlugins.barGraphGeneric(this);
//    });
//    d3.selectAll(".sungraph").each(function(){
//        graphPlugins.sunburstGraph(this);
//    });
});